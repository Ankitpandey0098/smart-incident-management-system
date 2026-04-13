import React, { useEffect, useState } from "react";
import axios from "axios";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";

const HeatmapLayer = ({ points }) => {
  const map = useMap();

  useEffect(() => {
    if (!points || points.length === 0) return;

    // Convert API data to heatmap points
    const heatPoints = points
      .filter(p => p.lat && p.lng)
      .map(p => [parseFloat(p.lat), parseFloat(p.lng), 1]);

    const heat = L.heatLayer(heatPoints, {
      radius: 35,
      blur: 25,
      maxZoom: 17,
      minOpacity: 0.4,
      gradient: {
        0.2: "#00bfff",
        0.4: "#00ff7f",
        0.6: "#ffff00",
        0.8: "#ff8c00",
        1.0: "#ff0000"
      }
    });

    heat.addTo(map);

    return () => {
      map.removeLayer(heat);
    };
  }, [points, map]);

  return null;
};

const IncidentHeatmap = () => {
  const [points, setPoints] = useState([]);

  useEffect(() => {
    const fetchHeatmap = async () => {
      try {
        const token = localStorage.getItem("access");

        const res = await axios.get(
          "http://127.0.0.1:8000/api/analytics/heatmap/",
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        console.log("Heatmap Data:", res.data);
        setPoints(res.data);
      } catch (error) {
        console.error("Heatmap Error:", error);
      }
    };

    fetchHeatmap();
  }, []);

  return (
    <div
      style={{
        height: "600px",
        width: "100%",
        borderRadius: "10px",
        overflow: "hidden"
      }}
    >
      <MapContainer
        center={[20.5937, 78.9629]}
        zoom={5}
        scrollWheelZoom={true}
        style={{
          height: "100%",
          width: "100%"
        }}
      >
        <TileLayer
          attribution="© OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <HeatmapLayer points={points} />
      </MapContainer>
    </div>
  );
};

export default IncidentHeatmap;
