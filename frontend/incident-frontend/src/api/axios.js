// src/api/axios.js
import axios from "axios";

const api = axios.create({
  baseURL: "https://smart-incident-management-system-chno.onrender.com/api/",
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
