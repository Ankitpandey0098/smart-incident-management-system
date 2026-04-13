import React, { useEffect, useState } from "react";
import { Card, Row, Col, Spinner, Alert, Badge } from "react-bootstrap";
import axios from "axios";
import IncidentHeatmap from "../components/IncidentHeatmap";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";

import { Bar, Pie, Doughnut, Line } from "react-chartjs-2";

/* ================= REGISTER CHART ================= */

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend
);

const IncidentCharts = () => {
  const [categoryData, setCategoryData] = useState(null);
  const [statusData, setStatusData] = useState(null);
  const [departmentData, setDepartmentData] = useState(null);
  const [timelineData, setTimelineData] = useState(null);
  const [riskAlerts, setRiskAlerts] = useState([]);

  const [summary, setSummary] = useState({
    total: 0,
    pending: 0,
    progress: 0,
    resolved: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ================= TOKEN HELPER ================= */

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

        const [
          catRes,
          statRes,
          deptRes,
          timeRes,
          riskRes
        ] = await Promise.all([
          requestWithToken("http://127.0.0.1:8000/api/analytics/category/"),
          requestWithToken("http://127.0.0.1:8000/api/analytics/status/"),
          requestWithToken("http://127.0.0.1:8000/api/analytics/departments/"),
          requestWithToken("http://127.0.0.1:8000/api/analytics/timeline/"),
          requestWithToken("http://127.0.0.1:8000/api/analytics/risk-alerts/")
        ]);

        setRiskAlerts(riskRes || []);

        /* ================= CATEGORY ================= */

        if (catRes?.length) {
          setCategoryData({
            labels: catRes.map((i) => i.category),
            datasets: [
              {
                label: "Incidents",
                data: catRes.map((i) => i.count),
                backgroundColor: [
                  "#ff6384",
                  "#36a2eb",
                  "#ffce56",
                  "#4bc0c0",
                  "#9966ff",
                  "#ff9f40",
                  "#20c997"
                ],
                borderRadius: 8,
              },
            ],
          });
        }

        /* ================= STATUS ================= */

        if (statRes?.length) {

          const pending =
            statRes.find((i) =>
              i.status.toLowerCase().includes("pending")
            )?.count || 0;

          const progress =
            statRes.find((i) =>
              i.status.toLowerCase().includes("progress")
            )?.count || 0;

          const resolved =
            statRes.find((i) =>
              i.status.toLowerCase().includes("resolved")
            )?.count || 0;

          const total = pending + progress + resolved;

          setSummary({
            total,
            pending,
            progress,
            resolved,
          });

          setStatusData({
            labels: ["Pending", "In Progress", "Resolved"],
            datasets: [
              {
                data: [pending, progress, resolved],
                backgroundColor: [
                  "#ffc107", // yellow
                  "#0d6efd", // blue
                  "#198754", // green
                ],
                borderWidth: 1,
              },
            ],
          });
        }

        /* ================= DEPARTMENT ================= */

        if (deptRes?.length) {
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
                  "#20c997",
                  "#6610f2"
                ],
              },
            ],
          });
        }

        /* ================= TIMELINE ================= */

        if (timeRes?.length) {
          setTimelineData({
            labels: timeRes.map((i) => i.date),
            datasets: [
              {
                label: "Incidents",
                data: timeRes.map((i) => i.count),
                fill: true,
                backgroundColor: "rgba(13,110,253,0.15)",
                borderColor: "#0d6efd",
                tension: 0.3,
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

    const interval = setInterval(fetchCharts, 30000);

    return () => clearInterval(interval);

  }, []);

  /* ================= OPTIONS ================= */

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
      },
    },
  };

  /* ================= LOADING ================= */

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
    <>
      {/* ================= RISK ALERT ================= */}

      {riskAlerts.length > 0 && (
        <Card className="mb-4 shadow-sm border-danger">
          <Card.Header className="bg-danger text-white">
            🚨 Risk Alerts
          </Card.Header>

          <Card.Body>
            {riskAlerts.map((alert, index) => (
              <Alert key={index} variant="warning">
                ⚠ {alert.message}{" "}
                <Badge bg="danger">{alert.count}</Badge>
              </Alert>
            ))}
          </Card.Body>
        </Card>
      )}

      {/* ================= KPI ================= */}

      <Row className="mb-4 g-3">

        <Col md={3}>
          <Card className="text-center shadow-sm">
            <Card.Body>
              <h6>Total Incidents</h6>
              <h3>{summary.total}</h3>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="text-center shadow-sm border-warning">
            <Card.Body>
              <h6>Pending</h6>
              <h3 className="text-warning">{summary.pending}</h3>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="text-center shadow-sm border-primary">
            <Card.Body>
              <h6>In Progress</h6>
              <h3 className="text-primary">{summary.progress}</h3>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="text-center shadow-sm border-success">
            <Card.Body>
              <h6>Resolved</h6>
              <h3 className="text-success">{summary.resolved}</h3>
            </Card.Body>
          </Card>
        </Col>

      </Row>

      {/* ================= CHARTS ================= */}

      <Row className="g-4">

        <Col md={4}>
          <Card className="shadow-sm h-100">
            <Card.Header>Incidents by Category</Card.Header>
            <Card.Body style={{ height: 320 }}>
              {categoryData && (
                <Bar data={categoryData} options={chartOptions} />
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="shadow-sm h-100">
            <Card.Header>Incidents by Status</Card.Header>
            <Card.Body style={{ height: 320 }}>
              {statusData && (
                <Pie data={statusData} options={chartOptions} />
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="shadow-sm h-100">
            <Card.Header>Incidents by Department</Card.Header>
            <Card.Body style={{ height: 320 }}>
              {departmentData && (
                <Doughnut data={departmentData} options={chartOptions} />
              )}
            </Card.Body>
          </Card>
        </Col>

      </Row>

      {/* ================= TIMELINE ================= */}

      <Row className="mt-4">
        <Col>
          <Card className="shadow-sm">
            <Card.Header>📈 Incident Trend</Card.Header>
            <Card.Body style={{ height: 350 }}>
              {timelineData && (
                <Line data={timelineData} options={chartOptions} />
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* ================= HEATMAP ================= */}

      <Row className="mt-4">
        <Col>
          <Card className="shadow-sm">
            <Card.Header>🔥 Incident Heatmap</Card.Header>
            <Card.Body style={{ padding: 0 }}>
              <IncidentHeatmap />
            </Card.Body>
          </Card>
        </Col>
      </Row>

    </>
  );
};

export default IncidentCharts;
