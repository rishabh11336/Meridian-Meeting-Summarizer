import axios from "axios";

const client = axios.create({
  baseURL: "/api",
  timeout: 5 * 60 * 1000,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT from localStorage on every request
client.interceptors.request.use((config) => {
  const raw = localStorage.getItem("meridian-auth");
  if (raw) {
    try {
      const { state } = JSON.parse(raw) as { state: { token: string | null } };
      if (state?.token) {
        config.headers.Authorization = `Bearer ${state.token}`;
      }
    } catch {
      // ignore malformed storage
    }
  }
  return config;
});

// On 401, clear auth state and redirect to login
client.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("meridian-auth");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default client;
