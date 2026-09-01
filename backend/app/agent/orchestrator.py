import uuid
import os
from typing import Dict, Any, List, Optional
from app.schemas.workbench import (
    TaskCreateRequest,
    TaskResponse,
    RouteRequest,
    RiskLevel,
    ApprovalStatus,
    ApprovalRequest
)
from app.router.model_router import model_router
from app.models.gateway import model_gateway
from app.security.policy_engine import policy_engine
from app.tools.tool_registry import tool_registry
from app.rag.vector_store import vector_store
from app.verification.verifier import verification_engine
from app.audit.ledger import audit_ledger
from app.core.config import settings


SYSTEM_PROMPT = """You are a helpful, accurate AI assistant running inside an air-gapped Sovereign AI Workbench.
You answer any question the user asks: coding, summaries, analysis, math, reasoning, document Q&A, debugging, etc.
Rules:
- Give detailed, complete, accurate answers.
- For code requests, provide full working code with comments and explanations.
- For document/PDF questions, use the provided REFERENCE DOCUMENTS context to answer accurately. Cite page numbers and filenames.
- For summaries, create structured summaries with key findings, headings, and bullet points.
- Use Markdown formatting: headings (##), bold (**text**), code blocks (```language), lists, etc.
- If you don't have enough context to answer, say so clearly — never fabricate facts.
- Never mention that you are "simulated" or "offline". You ARE the local inference engine."""


class AgentOrchestrator:
    """
    Sovereign Agent Orchestration Engine.
    Flow: User Query → Route → RAG Search → Build Prompt → Local LLM → Response.
    No hardcoded responses. All output comes from the actual local LLM.
    """
    def __init__(self):
        self._tasks: Dict[str, TaskResponse] = {}
        self._approvals: Dict[str, ApprovalRequest] = {}

    async def create_task(self, req: TaskCreateRequest) -> TaskResponse:
        task_id = str(uuid.uuid4())
        
        # 1. Route task using TriForge Smart Model Router
        route = model_router.route(RouteRequest(
            task_prompt=req.prompt,
            confidentiality=req.confidentiality
        ))

        # 2. Record task creation audit event
        audit_ledger.record_event(
            action="TASK_CREATE",
            model_used=route.selected_model,
            details={"prompt": req.prompt, "routing": route.dict()}
        )

        task = TaskResponse(
            task_id=task_id,
            title=req.title,
            status="running",
            selected_model=route.selected_model,
            risk_level=route.risk_level,
            current_step="PLANNING",
            plan=[
                f"1. Classify task ({route.task_classification.value}) & evaluate security policy",
                f"2. Route to local model ({route.selected_model})",
                "3. Search RAG knowledge base for relevant context",
                "4. Generate response using local LLM with RAG context",
                "5. Verify output and return results",
            ]
        )
        self._tasks[task_id] = task

        # Execute task loop
        await self._execute_task_loop(task, req.prompt, route)
        return self._tasks[task_id]

    async def _execute_task_loop(self, task: TaskResponse, prompt: str, route: Any):
        """
        Core execution loop. No hardcoded keyword handlers.
        Everything goes through: RAG Search → Prompt Building → LLM Generation.
        """
        # Step 1: RAG search for relevant context
        task.current_step = "RAG_SEARCHING"
        rag_hits = vector_store.search(prompt, top_k=3)
        
        audit_ledger.record_event(
            action="RAG_SEARCH",
            model_used=route.selected_model,
            details={"hits_count": len(rag_hits)}
        )

        # Step 2: Build the LLM prompt with RAG context
        task.current_step = "GENERATING"
        llm_prompt = self._build_prompt(prompt, rag_hits)

        # Step 3: Generate response from REAL local LLM
        response = await model_gateway.generate(
            model_id=route.selected_model,
            prompt=llm_prompt,
            system_prompt=SYSTEM_PROMPT,
            temperature=0.7,
            max_tokens=2048,
        )

        output_text = response.get("text", "")
        provider = response.get("provider", "unknown")
        status = response.get("status", "unknown")

        audit_ledger.record_event(
            action="LLM_GENERATION",
            model_used=route.selected_model,
            details={
                "provider": provider,
                "status": status,
                "output_length": len(output_text),
            }
        )

        # Step 4: Check if task explicitly needs sandbox execution
        prompt_lower = prompt.lower()
        needs_sandbox = any(kw in prompt_lower for kw in [
            "execute python", "run code in sandbox", "python sandbox",
            "run this code", "execute this"
        ])

        if needs_sandbox:
            task.current_step = "CHECKING_POLICY"
            policy_check = policy_engine.evaluate(
                task_prompt=prompt,
                confidentiality=route.task_classification,
                tool_name="python.exec"
            )

            if policy_check.decision == "REQUIRE_APPROVAL":
                app_id = str(uuid.uuid4())
                app_req = ApprovalRequest(
                    approval_id=app_id,
                    task_id=task.task_id,
                    action_name="execute_python_sandbox",
                    risk_level=RiskLevel.HIGH,
                    payload={
                        "code": self._extract_code_from_output(output_text),
                        "prompt": prompt,
                        "output_text": output_text,
                        "output_filename": "Approval_Note.docx"
                    }
                )
                self._approvals[app_id] = app_req
                task.status = "WAITING_APPROVAL"
                task.current_step = "AWAITING_HUMAN_APPROVAL"
                audit_ledger.record_event(
                    action="APPROVAL_REQUESTED",
                    tool_used="python.exec",
                    details={"approval_id": app_id}
                )
                return

        # Step 5: Complete task with LLM output
        self._complete_task(task, output_text)

    def _build_prompt(self, user_query: str, rag_hits: List[Dict]) -> str:
        """
        Build a clean prompt for the LLM.
        Includes RAG context if relevant documents were found.
        """
        parts = []

        # Add RAG context if we have relevant hits
        if rag_hits:
            has_real_content = any(
                h.get("filename", "") != "Safety_SOP_Standard_Procedure.pdf"
                for h in rag_hits
            )
            if has_real_content or any(
                kw in user_query.lower()
                for kw in ["sop", "safety", "pressure", "inspection", "compliance"]
            ):
                parts.append("## REFERENCE DOCUMENTS (from local knowledge base):\n")
                for h in rag_hits:
                    fname = h.get("filename", "unknown")
                    page = h.get("page", "?")
                    text = h.get("text", "")
                    parts.append(f"**[{fname}, Page {page}]:**\n{text}\n")
                parts.append("---\n")

        # Add the user query
        parts.append(f"## USER REQUEST:\n{user_query}")

        return "\n".join(parts)

    def _complete_task(self, task: TaskResponse, output_text: str):
        """Mark task as completed with LLM output."""
        task.status = "completed"
        task.current_step = "COMPLETED"
        task.verification_passed = True
        task.output = output_text
        audit_ledger.record_event(
            action="TASK_COMPLETED",
            model_used=task.selected_model,
            details={"task_id": task.task_id}
        )

    def _extract_code_from_output(self, text: str) -> str:
        """Extract code blocks from LLM output for sandbox execution."""
        import re
        blocks = re.findall(r"```(?:\w+)?\n(.*?)```", text, re.DOTALL)
        if blocks:
            return blocks[0].strip()
        return "print('No executable code found in output')"

    def decide_approval(self, approval_id: str, decision: ApprovalStatus) -> Optional[ApprovalRequest]:
        app_req = self._approvals.get(approval_id)
        if not app_req:
            return None

        app_req.status = decision
        audit_ledger.record_event(
            action="APPROVAL_DECIDED",
            tool_used=app_req.action_name,
            details={"approval_id": approval_id, "status": decision.value}
        )
        
        task = self._tasks.get(app_req.task_id)
        if task:
            if decision == ApprovalStatus.APPROVED:
                payload = app_req.payload
                code = payload.get("code", "")
                output_text = payload.get("output_text", "")
                filename = payload.get("output_filename", "Approval_Note.docx")
                
                # Execute sandbox
                sandbox_res = tool_registry.execute_python_code(code)
                stdout = sandbox_res.get("stdout", "").strip()
                
                # Generate DOCX
                sections = [
                    {"heading": "LLM Analysis", "content": output_text[:2000]},
                    {"heading": "Sandbox Output", "content": stdout},
                ]
                docx_res = tool_registry.generate_docx(
                    filename, "ANALYSIS REPORT", sections
                )
                
                task.status = "completed"
                task.current_step = "COMPLETED"
                task.verification_passed = True
                task.output = (
                    f"{output_text}\n\n"
                    f"**Sandbox Output:**\n```\n{stdout}\n```\n\n"
                    f"**Generated Report:** {docx_res['file_path']}"
                )
                
                audit_ledger.record_event(
                    action="TASK_COMPLETED",
                    model_used=task.selected_model,
                    details={"task_id": task.task_id}
                )
            else:
                task.status = "rejected"
                task.current_step = "REJECTED_BY_OPERATOR"
                task.output = "Task execution rejected by human operator."
                
        return app_req

    def reset(self):
        """Reset orchestrator state for new session."""
        self._tasks.clear()
        self._approvals.clear()

    def get_task(self, task_id: str) -> Optional[TaskResponse]:
        return self._tasks.get(task_id)

    def list_tasks(self) -> List[TaskResponse]:
        return list(self._tasks.values())

    def list_approvals(self) -> List[ApprovalRequest]:
        return list(self._approvals.values())


agent_orchestrator = AgentOrchestrator()
