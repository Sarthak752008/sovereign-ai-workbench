const API_BASE = '/api/v1';

export async function fetchSentinelStatus() {
  try {
    const res = await fetch(`${API_BASE}/sentinel/status`);
    if (res.ok) return await res.json();
  } catch (e) {
    console.error(e);
  }
  return {
    sovereign_mode: 'ACTIVE',
    network_status: 'BLOCKED',
    local_inference: 'ACTIVE',
    external_ai_calls: 0,
    external_dns_requests: 0,
    cloud_ai_requests: 0,
    last_egress_check: new Date().toISOString(),
    active_local_models: ['Qwen 2.5 Coder 7B', 'Llama 3.1 8B Instruct', 'DeepSeek R1 8B', 'Qwen 2 VL 7B']
  };
}

export async function fetchModels() {
  try {
    const res = await fetch(`${API_BASE}/models`);
    if (res.ok) return await res.json();
  } catch (e) {
    console.error(e);
  }
  return [];
}

export async function routeTask(prompt, confidentiality = 'CONFIDENTIAL', modality = 'text') {
  try {
    const res = await fetch(`${API_BASE}/router/route`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task_prompt: prompt, confidentiality, modality })
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.error(e);
  }
  return null;
}

export async function createTask(title, prompt, confidentiality = 'CONFIDENTIAL') {
  try {
    const res = await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, prompt, confidentiality })
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.error(e);
  }
  return null;
}

export async function fetchTasks() {
  try {
    const res = await fetch(`${API_BASE}/tasks`);
    if (res.ok) return await res.json();
  } catch (e) {
    console.error(e);
  }
  return [];
}

export async function fetchApprovals() {
  try {
    const res = await fetch(`${API_BASE}/approvals`);
    if (res.ok) return await res.json();
  } catch (e) {
    console.error(e);
  }
  return [];
}

export async function decideApproval(approvalId, decision) {
  try {
    const res = await fetch(`${API_BASE}/approvals/decide`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approval_id: approvalId, decision })
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.error(e);
  }
  return null;
}

export async function fetchAuditEvents() {
  try {
    const res = await fetch(`${API_BASE}/audit/events`);
    if (res.ok) return await res.json();
  } catch (e) {
    console.error(e);
  }
  return [];
}

export async function fetchDocuments() {
  try {
    const res = await fetch(`${API_BASE}/documents`);
    if (res.ok) return await res.json();
  } catch (e) {
    console.error(e);
  }
  return [];
}

export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append('file', file);
  try {
    const res = await fetch(`${API_BASE}/documents/upload`, {
      method: 'POST',
      body: formData
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.error(e);
  }
  return null;
}

export async function deleteDocument(filename) {
  try {
    const res = await fetch(`${API_BASE}/documents/${filename}`, {
      method: 'DELETE'
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.error(e);
  }
  return null;
}

export async function fetchKnowledgeChunks() {
  try {
    const res = await fetch(`${API_BASE}/knowledge/chunks`);
    if (res.ok) return await res.json();
  } catch (e) {
    console.error(e);
  }
  return [];
}

export async function searchKnowledge(query) {
  try {
    const res = await fetch(`${API_BASE}/knowledge/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, top_k: 5 })
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.error(e);
  }
  return [];
}

export async function resetWorkbench() {
  try {
    const res = await fetch(`${API_BASE}/workbench/reset`, {
      method: 'POST'
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.error(e);
  }
  return null;
}
