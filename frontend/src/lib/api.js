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
