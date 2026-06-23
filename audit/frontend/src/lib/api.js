import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || ""
});

export const endpoints = {
  summary: (clientId) => `/api/dashboard/${clientId}/summary`,
  rows: (clientId, key) => `/api/dashboard/${clientId}/${key}`,
  export: (clientId, type) => `/api/export/${clientId}/${type}`
};

export function runGSTReco(clientId) {
  return api.post(`/api/gst-reco/${clientId}/run`);
}

export function getGSTRecoSummary(clientId) {
  return api.get(`/api/gst-reco/${clientId}/summary`);
}

export function getGSTRecoResults(clientId, filters = {}) {
  return api.get(`/api/gst-reco/${clientId}/results`, { params: filters });
}

export function exportGSTReco(clientId) {
  return `/api/export/${clientId}/gst-reco`;
}

export const fixedAssetsApi = {
  sources: (clientId) => api.get(`/api/fixed-assets/${clientId}/sources`),
  uploadOpening: (clientId, file) => uploadFile(`/api/fixed-assets/${clientId}/upload/opening`, file),
  uploadAdditions: (clientId, file) => uploadFile(`/api/fixed-assets/${clientId}/upload/additions`, file),
  uploadDisposals: (clientId, file) => uploadFile(`/api/fixed-assets/${clientId}/upload/disposals`, file),
  run: (clientId, financialYear) => api.post(`/api/fixed-assets/${clientId}/run`, null, { params: compact({ financial_year: financialYear }) }),
  summary: (clientId, financialYear) => api.get(`/api/fixed-assets/${clientId}/summary`, { params: compact({ financial_year: financialYear }) }),
  classSummary: (clientId, financialYear) => api.get(`/api/fixed-assets/${clientId}/class-summary`, { params: compact({ financial_year: financialYear }) }),
  assets: (clientId, financialYear) => api.get(`/api/fixed-assets/${clientId}/assets`, { params: compact({ financial_year: financialYear }) }),
  incomeTax: (clientId, financialYear) => api.get(`/api/fixed-assets/${clientId}/income-tax`, { params: compact({ financial_year: financialYear }) }),
  alerts: (clientId) => api.get(`/api/fixed-assets/${clientId}/alerts`),
  export: (clientId) => `/api/export/${clientId}/fixed-assets`
};

export const billMatchingApi = {
  sources: (clientId) => api.get(`/api/bill-matching/${clientId}/sources`),
  extract: (clientId) => api.post(`/api/bill-matching/${clientId}/extract`),
  run: (clientId) => api.post(`/api/bill-matching/${clientId}/run`),
  summary: (clientId) => api.get(`/api/bill-matching/${clientId}/summary`),
  results: (clientId, filters = {}) => api.get(`/api/bill-matching/${clientId}/results`, { params: compact(filters) }),
  duplicates: (clientId) => api.get(`/api/bill-matching/${clientId}/duplicates`),
  createQuery: (clientId, resultId) => api.post(`/api/bill-matching/${clientId}/create-query`, { result_id: resultId }),
  markReviewed: (clientId, resultId, status = "Reviewed") => api.post(`/api/bill-matching/${clientId}/mark-reviewed`, { result_id: resultId, status }),
  export: (clientId) => `/api/export/${clientId}/bill-matching`
};

export const caDashboardApi = {
  dashboard: (clientId) => api.get(`/api/ca-dashboard/${clientId}`)
};

export function getApiErrorMessage(error, fallback = "Request could not be completed") {
  const detail = error?.response?.data?.detail;
  if (Array.isArray(detail)) {
    const messages = detail.map((item) => {
      if (typeof item === "string") return item;
      const location = Array.isArray(item?.loc) ? item.loc.join(" → ") : "request";
      return item?.msg ? `${location}: ${item.msg}` : safeText(item);
    }).filter(Boolean);
    if (messages.length) return messages.join("; ");
  }
  if (detail && typeof detail === "object") return detail.msg || safeText(detail);
  return detail || error?.message || fallback;
}

function uploadFile(url, file) {
  const form = new FormData();
  form.append("file", file);
  return api.post(url, form, { headers: { "Content-Type": "multipart/form-data" } });
}

function compact(value) {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item));
}

function safeText(value) {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
