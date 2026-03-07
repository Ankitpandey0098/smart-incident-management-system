import React, { useEffect, useState } from "react";
import { Card, Row, Col, Spinner, Alert } from "react-bootstrap";
import axios from "axios";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

import { Bar, Pie, Doughnut } from "react-chartjs-2";

/* ================= REGISTER CHART.JS ================= */
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
);

const IncidentCharts = () => {
  const [categoryData, setCategoryData] = useState(null);
  const [statusData, setStatusData] = useState(null);
  const [departmentData, setDepartmentData] = useState(null); // ✅ new
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ================ AUTH HELPER ================= */
  const requestWithToken = async (url) => {
    let access = localStorage.getItem("access");
    const refresh = localStorage.getItem("refresh");

    try {
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${access}` },
      });
      return res.data;
    } catch (err) {
      if (err.response?.status === 401 && refresh) {
        const tokenRes = await axios.post(
          "http://127.0.0.1:8000/api/token/refresh/",
          { refresh }
        );
        access = tokenRes.data.access;
        localStorage.setItem("access", access);

        const retry = await axios.get(url, {
          headers: { Authorization: `Bearer ${access}` },
        });
        return retry.data;
      }
      throw err;
    }
  };

  /* ================= FETCH DATA ================= */
  useEffect(() => {
    const fetchCharts = async () => {
      try {
        setLoading(true);

        const catRes = await requestWithToken(
          "http://127.0.0.1:8000/api/analytics/category/"
        );
        const statRes = await requestWithToken(
          "http://127.0.0.1:8000/api/analytics/status/"
        );
        const deptRes = await requestWithToken(
          "http://127.0.0.1:8000/api/analytics/departments/"
        ); // ✅ new

        if (Array.isArray(catRes) && catRes.length) {
          setCategoryData({
            labels: catRes.map((i) => i.category),
            datasets: [
              {
                label: "Incidents",
                data: catRes.map((i) => i.count),
                backgroundColor: ["#0d6efd", "#dc3545", "#ffc107", "#198754"],
                borderRadius: 6,
              },
            ],
          });
        }

        if (Array.isArray(statRes) && statRes.length) {
          setStatusData({
            labels: statRes.map((i) => i.status),
            datasets: [
              {
                data: statRes.map((i) => i.count),
                backgroundColor: ["#ffc107", "#0d6efd", "#198754"],
              },
            ],
          });
        }

        if (Array.isArray(deptRes) && deptRes.length) {
          setDepartmentData({
            labels: deptRes.map((i) => i.department),
            datasets: [
              {
                data: deptRes.map((i) => i.count),
                backgroundColor: [
                  "#0d6efd",
                  "#dc3545",
                  "#ffc107",
                  "#198754",
                  "#6f42c1",
                  "#fd7e14",
                ],
              },
            ],
          });
        }
      } catch (err) {
        setError("Failed to load analytics data");
      } finally {
        setLoading(false);
      }
    };

    fetchCharts();
  }, []);

  /* ================= OPTIONS ================= */
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          boxWidth: 12,
          padding: 16,
        },
      },
    },
  };

  /* ================= RENDER ================= */
  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <Spinner animation="border" />
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  return (
    <Row className="g-4">
      <Col md={4}>
        <Card className="shadow-sm h-100">
          <Card.Header className="fw-semibold bg-white">
            Incidents by Category
          </Card.Header>
          <Card.Body style={{ height: 320 }}>
            {categoryData ? (
              <Bar data={categoryData} options={commonOptions} />
            ) : (
              <p className="text-muted text-center mt-5">
                No category data available
              </p>
            )}
          </Card.Body>
        </Card>
      </Col>

      <Col md={4}>
        <Card className="shadow-sm h-100">
          <Card.Header className="fw-semibold bg-white">
            Incidents by Status
          </Card.Header>
          <Card.Body style={{ height: 320 }}>
            {statusData ? (
              <Pie data={statusData} options={commonOptions} />
            ) : (
              <p className="text-muted text-center mt-5">
                No status data available
              </p>
            )}
          </Card.Body>
        </Card>
      </Col>

      <Col md={4}>
        <Card className="shadow-sm h-100">
          <Card.Header className="fw-semibold bg-white">
            Incidents by Department
          </Card.Header>
          <Card.Body style={{ height: 320 }}>
            {departmentData ? (
              <Doughnut data={departmentData} options={commonOptions} />
            ) : (
              <p className="text-muted text-center mt-5">
                No department data available
              </p>
            )}
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

export default IncidentCharts;
