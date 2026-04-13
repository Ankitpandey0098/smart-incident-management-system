import React, { useEffect, useState } from "react";
import axios from "axios";

const LiveIncidentFeed = () => {
  const [incidents, setIncidents] = useState([]);

  const token = localStorage.getItem("access");

  const axiosConfig = {
    headers: { Authorization: `Bearer ${token}` },
  };

  const fetchIncidents = async () => {
    try {
      const res = await axios.get(
        "http://127.0.0.1:8000/api/incidents/",
        axiosConfig
      );

      const data = Array.isArray(res.data) ? res.data : [];

      const sorted = data.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );

      setIncidents(sorted.slice(0, 10));
    } catch (err) {
      console.error("Incident fetch error", err);
    }
  };

  useEffect(() => {
    fetchIncidents();

    const interval = setInterval(fetchIncidents, 10000);

    return () => clearInterval(interval);
  }, []);

  const getIcon = (category) => {
    const cat = (category || "").toLowerCase();

    if (cat.includes("fire")) return "🔥";
    if (cat.includes("accident")) return "🚧";
    if (cat.includes("crime")) return "🚔";
    if (cat.includes("medical")) return "🚑";

    return "📍";
  };

  const getStatusColor = (status) => {
    const s = (status || "").toLowerCase();

    if (s === "pending") return "#ff4d4d";
    if (s === "in progress") return "#ffa500";
    if (s === "resolved") return "#28a745";

    return "#999";
  };

  return (
    <div
      style={{
        width: "320px",
        background: "white",
        padding: "15px",
        borderRadius: "8px",
        boxShadow: "0 3px 10px rgba(0,0,0,0.2)",
        maxHeight: "500px",
        overflowY: "auto",
      }}
    >
      <h4 style={{ marginBottom: "10px" }}>🚨 Live Incident Feed</h4>

      {incidents.length === 0 && <p>No incidents</p>}

      {incidents.map((incident) => (
        <div
          key={incident.id}
          style={{
            borderBottom: "1px solid #eee",
            padding: "8px 0",
          }}
        >
          <div style={{ fontWeight: "bold" }}>
            {getIcon(incident.category)} {incident.title}
          </div>

          <div style={{ fontSize: "13px", color: "#555" }}>
            Category: {incident.category || "General"}
          </div>

          <div
            style={{
              fontSize: "12px",
              color: getStatusColor(incident.status),
              fontWeight: "bold",
            }}
          >
            Status: {incident.status}
          </div>
        </div>
      ))}
    </div>
  );
};

export default LiveIncidentFeed;
