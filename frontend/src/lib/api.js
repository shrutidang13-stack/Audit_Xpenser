import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || ""
});

export const endpoints = {
  summary: (clientId) => `/api/dashboard/${clientId}/summary`,
  rows: (clientId, key) => `/api/dashboard/${clientId}/${key}`,
  export: (clientId, type) => `/api/export/${clientId}/${type}`
};
