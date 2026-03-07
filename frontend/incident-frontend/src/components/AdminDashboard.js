// src/components/AdminDashboard.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Table, Card, Spinner, Row, Col, Badge, Button } from "react-bootstrap";
import { EnvelopeFill } from "react-bootstrap-icons";

const AdminDashboard = () => {
  const token = localStorage.getItem("access");

  const [incidents, setIncidents] = useState([]); // ✅ FIXED
  const [loading, setLoading] = useState(false);
  const [categoryStats, setCategoryStats] = useState([]);
  const [statusStats, setStatusStats] = useState([]);

  useEffect(() => {
    fetchIncidents();
  }, []);

  // Fetch all incidents
  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/incidents/", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const unresolved = res.data.filter((inc) => inc.status !== "resolved");
      setIncidents(unresolved);

      calculateCategoryStats(unresolved);
      calculateStatusStats(unresolved);
    } catch (err) {
      console.error("Failed to fetch incidents", err);
    } finally {
      setLoading(false);
    }
  };

  // 📧 Report incident to department
  const reportIncident = async (incidentId) => {
    try {
      await axios.post(
        `http://127.0.0.1:8000/api/incidents/${incidentId}/report/`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert("Incident reported to department successfully");
    } catch (err) {
      console.error(err);
      alert(
        err.response?.data?.error || "Failed to report incident to department"
      );
    }
  };

  // Calculate category stats
  const calculateCategoryStats = (incidentsList) => {
    const categoryMap = {};
    incidentsList.forEach((inc) => {
      if (inc.category) {
        categoryMap[inc.category] =
          (categoryMap[inc.category] || 0) + 1;
      }
    });

    setCategoryStats(
      Object.keys(categoryMap).map((cat) => ({
        category: cat,
        count: categoryMap[cat],
      }))
    );
  };

  // Calculate status stats
  const calculateStatusStats = (incidentsList) => {
    const statusMap = {};
    incidentsList.forEach((inc) => {
      statusMap[inc.status] = (statusMap[inc.status] || 0) + 1;
    });

    setStatusStats(
      Object.keys(statusMap).map((status) => ({
        status,
        count: statusMap[status],
      }))
    );
  };

  // Status badge
  const statusBadge = (status) => {
    switch (status) {
      case "pending":
        return <Badge bg="warning">{status}</Badge>;
      case "in progress":
        return <Badge bg="primary">{status}</Badge>;
      case "resolved":
        return <Badge bg="success">{status}</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="container mt-5 pt-5">
      <h2 className="mb-4">Admin Incident Dashboard</h2>

      {/* Summary Cards */}
      <Row className="mb-4">
        <Col md={4}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title>Total Unresolved Incidents</Card.Title>
              <Card.Text style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
                {incidents.length}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title>Categories (Unresolved)</Card.Title>
              {categoryStats.length === 0
                ? "No unresolved incidents"
                : categoryStats.map((cat) => (
                    <div key={cat.category}>
                      {cat.category}: {cat.count}
                    </div>
                  ))}
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title>Status (Unresolved)</Card.Title>
              {statusStats.length === 0
                ? "No unresolved incidents"
                : statusStats.map((stat) => (
                    <div key={stat.status}>
                      {stat.status}: {stat.count}
                    </div>
                  ))}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Incidents Table */}
      <Card>
        <Card.Header>
          <h5>All Unresolved Incidents</h5>
        </Card.Header>
        <Card.Body style={{ overflowX: "auto" }}>
          {loading ? (
            <div className="d-flex justify-content-center p-3">
              <Spinner animation="border" />
            </div>
          ) : (
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>User</th>
                  <th>Category</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Created At</th>
                  <th>Report</th> {/* ✅ NEW */}
                </tr>
              </thead>
              <tbody>
                {incidents.map((inc) => (
                  <tr key={inc.id}>
                    <td>{inc.id}</td>
                    <td>{inc.title}</td>
                    <td>{inc.user?.username || "N/A"}</td>
                    <td>{inc.category || "N/A"}</td>
                    <td>{inc.department || "N/A"}</td>
                    <td>{statusBadge(inc.status)}</td>
                    <td>{new Date(inc.created_at).toLocaleString()}</td>
                    <td className="text-center">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        disabled={!inc.department}
                        onClick={() => reportIncident(inc.id)}
                        title="Report to Department"
                      >
                        <EnvelopeFill />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default AdminDashboard;
