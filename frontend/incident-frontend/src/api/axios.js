
// src/api/axios.js
import axios from "axios";

const api = axios.create({
  baseURL:  "https://smart-incident-management-system-chno.onrender.com/api", // your Django API base
  withCredentials: true, // IMPORTANT: allow cookies for session auth
    headers: {
    "Content-Type": "application/json",
},
});

export default api;
