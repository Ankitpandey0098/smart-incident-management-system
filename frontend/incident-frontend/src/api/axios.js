import axios from "axios";

const api = axios.create({
  baseURL: "https://smart-incident-management-system-chno.onrender.com/api/",
  headers: {
    "Content-Type": "application/json",
  },
});

// 🔥 AUTO ATTACH TOKEN (IMPORTANT FIX)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
