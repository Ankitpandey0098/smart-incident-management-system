
// src/api/axios.js
import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api", // your Django API base
  withCredentials: true, // IMPORTANT: allow cookies for session auth
    headers: {
    "Content-Type": "application/json",
},
});

export default api;
