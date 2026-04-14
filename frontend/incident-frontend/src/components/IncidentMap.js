import React, { useEffect, useState } from "react";
import axios from "axios";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";

import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

import L from "leaflet";
import "leaflet.heat";
import api from "../api/axios";
/* ================= FIX MARKER ICONS ================= */

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

/* ================= PULSE ICON ================= */

const pulseIcon = new L.DivIcon({
  html: `<div class="pulse-marker"></div>`,
  className: "",
  iconSize: [20, 20],
});

/* ================= COLORED MARKERS ================= */

const createColoredIcon = (color) =>
  new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl:
      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });

/* ================= HEATMAP ================= */

const HeatmapLayer = ({ incidents }) => {
  const map = useMap();

  useEffect(() => {
    if (!incidents.length) return;

    const heatData = incidents.map((i) => {
      let weight = 0.5;

      const status = (i.status || "").toLowerCase();

      if (status === "pending") weight = 1;
      else if (status === "in progress") weight = 0.7;
      else if (status === "resolved") weight = 0.3;

      return [i.latitude, i.longitude, weight];
    });

    const heatLayer = L.heatLayer(heatData, {
      radius: 25,
      blur: 20,
      maxZoom: 17,
    });

    heatLayer.addTo(map);

    return () => map.removeLayer(heatLayer);
  }, [incidents, map]);

  return null;
};

/* ================= AUTO ZOOM NEW INCIDENT ================= */

const AutoZoomToIncident = ({ incident }) => {
  const map = useMap();

  useEffect(() => {
    if (!incident) return;

    map.flyTo([incident.latitude, incident.longitude], 15, {
      duration: 2,
    });
  }, [incident, map]);

  return null;
};

/* ================= FIT ALL INCIDENTS ================= */

const FitBounds = ({ incidents }) => {
  const map = useMap();

  useEffect(() => {
    if (!incidents.length) return;

    const bounds = L.latLngBounds(
      incidents.map((i) => [i.latitude, i.longitude])
    );

    map.fitBounds(bounds, { padding: [50, 50] });

  }, [incidents, map]);

  return null;
};

/* ================= MAIN COMPONENT ================= */

const IncidentMap = () => {
  const [incidents, setIncidents] = useState([]);
  const [filteredIncidents, setFilteredIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [heatmapMode, setHeatmapMode] = useState(false);

  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [stats, setStats] = useState({
    total: 0,
    fire: 0,
    accident: 0,
    crime: 0,
    medical: 0,
  });

  const [newIncident, setNewIncident] = useState(null);
  const [newIncidentIds, setNewIncidentIds] = useState([]);

  const token = localStorage.getItem("access");

  const axiosConfig = {
    headers: { Authorization: `Bearer ${token}` },
  };

  /* ================= FETCH INCIDENTS ================= */

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        

        const res = await api.get("incidents/", axiosConfig);


        const data = Array.isArray(res.data) ? res.data : [];

        const valid = data
          .filter((i) => i.latitude && i.longitude)
          .map((i) => ({
            ...i,
            latitude: parseFloat(i.latitude),
            longitude: parseFloat(i.longitude),
          }));

        const existingIds = incidents.map((i) => i.id);

        const newlyAdded = valid.filter((i) => !existingIds.includes(i.id));

        if (newlyAdded.length) {
          setNewIncident(newlyAdded[0]);
          setNewIncidentIds(newlyAdded.map((i) => i.id));

          setTimeout(() => {
            setNewIncident(null);
            setNewIncidentIds([]);
          }, 30000);
        }

        setIncidents(valid);
        setFilteredIncidents(valid);

        calculateStats(valid);
      } catch (err) {
        console.error("Fetch error", err);
      } finally {
        setLoading(false);
      }
    };

    fetchIncidents();

    const interval = setInterval(fetchIncidents, 10000);

    return () => clearInterval(interval);
  }, []);

  /* ================= FILTER ================= */

  useEffect(() => {
    let filtered = incidents;

    if (categoryFilter !== "all") {
      filtered = filtered.filter((i) =>
        (i.category || "").toLowerCase().includes(categoryFilter)
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (i) => (i.status || "").toLowerCase() === statusFilter
      );
    }

    setFilteredIncidents(filtered);
    calculateStats(filtered);
  }, [categoryFilter, statusFilter, incidents]);

  /* ================= STATS ================= */

  const calculateStats = (data) => {
    const fire = data.filter((i) =>
      (i.category || "").toLowerCase().includes("fire")
    ).length;

    const accident = data.filter((i) =>
      (i.category || "").toLowerCase().includes("accident")
    ).length;

    const crime = data.filter((i) =>
      (i.category || "").toLowerCase().includes("crime")
    ).length;

    const medical = data.filter((i) =>
      (i.category || "").toLowerCase().includes("medical")
    ).length;

    setStats({
      total: data.length,
      fire,
      accident,
      crime,
      medical,
    });
  };

  if (loading) return <p className="text-center mt-4">Loading map...</p>;

  /* ================= ICON SELECTOR ================= */

  const getIcon = (incident) => {
    if (newIncidentIds.includes(incident.id)) {
      return pulseIcon;
    }

    const cat = (incident.category || "").toLowerCase();

    if (cat.includes("fire")) return createColoredIcon("red");
    if (cat.includes("accident")) return createColoredIcon("orange");
    if (cat.includes("crime")) return createColoredIcon("violet");
    if (cat.includes("medical")) return createColoredIcon("green");

    return createColoredIcon("blue");
  };

  return (
    <div style={{ height: "90vh", width: "100%", padding: "20px" }}>
      <h3 className="text-primary mb-3">🏙️ City Incident Map</h3>

      {/* ALERT */}

      {newIncident && (
        <div
          style={{
            background: "#ff4d4d",
            color: "white",
            padding: "10px",
            borderRadius: "6px",
            marginBottom: "10px",
            fontWeight: "bold",
          }}
        >
          🚨 New Incident Reported: {newIncident.title}
        </div>
      )}

      {/* FILTERS */}

      <div style={{ marginBottom: "10px" }}>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="all">All Categories</option>
          <option value="fire">Fire</option>
          <option value="accident">Accident</option>
          <option value="crime">Crime</option>
          <option value="medical">Medical</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ marginLeft: "10px" }}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="in progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>

        <button
          onClick={() => setHeatmapMode(!heatmapMode)}
          style={{ marginLeft: "10px" }}
        >
          {heatmapMode ? "Show Markers" : "Show Heatmap"}
        </button>
      </div>

      <MapContainer
        center={[28.6139, 77.2090]}
        zoom={6}
        scrollWheelZoom
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        <FitBounds incidents={filteredIncidents} />

        {newIncident && <AutoZoomToIncident incident={newIncident} />}

        {heatmapMode && <HeatmapLayer incidents={filteredIncidents} />}

        {!heatmapMode && (
          <MarkerClusterGroup chunkedLoading>
            {filteredIncidents.map((i) => (
              <Marker
                key={i.id}
                position={[i.latitude, i.longitude]}
                icon={getIcon(i)}
              >
                <Popup>
                  <strong>{i.title}</strong>
                  <br />
                  Category: {i.category || "General"}
                  <br />
                  Department: {i.department || "N/A"}
                  <br />
                  Status: {i.status}
                </Popup>
              </Marker>
            ))}
          </MarkerClusterGroup>
        )}
      </MapContainer>

      <style>{`
        .pulse-marker {
          width:20px;
          height:20px;
          background:red;
          border-radius:50%;
          position:relative;
        }

        .pulse-marker::after {
          content:'';
          width:20px;
          height:20px;
          border-radius:50%;
          background:red;
          position:absolute;
          left:0;
          top:0;
          animation:pulse 1.5s infinite;
          opacity:0.6;
        }

        @keyframes pulse {
          0% {transform:scale(1); opacity:0.6;}
          70% {transform:scale(3); opacity:0;}
          100% {opacity:0;}
        }
      `}</style>
    </div>
  );
};

export default IncidentMap;
