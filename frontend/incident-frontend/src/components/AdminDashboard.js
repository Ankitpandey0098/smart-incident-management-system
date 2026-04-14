// src/components/AdminDashboard.js

import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Table,
  Card,
  Spinner,
  Row,
  Col,
  Badge,
  Button,
  Alert
} from "react-bootstrap";
import { EnvelopeFill, GeoAltFill } from "react-bootstrap-icons";
import api from "../api/axios";

const AdminDashboard = () => {

  const token = localStorage.getItem("access");

  const [incidents, setIncidents] = useState([]);
  const [visibleIncidents, setVisibleIncidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [showAll, setShowAll] = useState(false);

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    progress: 0,
    resolved: 0
  });

  const [categoryStats, setCategoryStats] = useState([]);

  // ✅ Auto Refresh Every 5 Seconds
  useEffect(() => {

    fetchIncidents();

    const interval = setInterval(() => {
      fetchIncidents();
    }, 10000000);

    return () => clearInterval(interval);

  }, []);

  useEffect(() => {
    if (showAll) {
      setVisibleIncidents(incidents);
    } else {
      setVisibleIncidents(incidents.slice(0, 10));
    }
  }, [incidents, showAll]);

  const fetchIncidents = async () => {

    setLoading(true);

    try {

      const res = await api.get("/incidents/", {
  headers: {
    Authorization: `Bearer ${token}`
  }
});


      const sorted = sortIncidents(res.data);

      setIncidents(sorted);

      calculateStats(sorted);
      calculateCategoryStats(sorted);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const sortIncidents = (data) => {

    const order = {
      "in progress": 1,
      "pending": 2,
      "resolved": 3
    };

    return [...data].sort((a, b) => {

      const statusA = a.status?.toLowerCase();
      const statusB = b.status?.toLowerCase();

      return (order[statusA] || 99) - (order[statusB] || 99);
    });
  };

  const calculateStats = (data) => {

    let pending = 0;
    let progress = 0;
    let resolved = 0;

    data.forEach((inc) => {

      const status = inc.status?.toLowerCase();

      if (status === "pending") pending++;
      if (status === "in progress") progress++;
      if (status === "resolved") resolved++;

    });

    setStats({
      total: data.length,
      pending,
      progress,
      resolved
    });
  };

  const calculateCategoryStats = (data) => {

    const map = {};

    data.forEach((inc) => {

      if (!inc.category) return;

      map[inc.category] = (map[inc.category] || 0) + 1;

    });

    const result = Object.keys(map).map((key) => ({
      category: key,
      count: map[key]
    }));

    setCategoryStats(result);
  };

  const reportIncident = async (incident) => {

    try {

     await api.post(`/incidents/${incident.id}/report/`, {}, {
  headers: {
    Authorization: `Bearer ${token}`
  }
});


      setMessage(
        `Incident "${incident.title}" sent to ${incident.department}`
      );

      fetchIncidents();

    } catch (err) {

      setMessage(
        err.response?.data?.error || "Failed to report incident"
      );
    }
  };

  const updateStatus = async (incident, newStatus) => {

    try {

      await api.patch(
  `/incidents/${incident.id}/`,
  { status: newStatus },
  {
    headers: {
      Authorization: `Bearer ${token}`
    }
  }
);


      setMessage(`Status updated to ${newStatus}`);

      fetchIncidents();

    } catch (err) {

      console.error(err);
      setMessage("Failed to update status");

    }
  };

  const statusBadge = (status) => {

    const s = status?.toLowerCase();

    if (s === "pending")
      return <Badge bg="warning">Pending</Badge>;

    if (s === "in progress")
      return <Badge bg="primary">In Progress</Badge>;

    return <Badge bg="success">Resolved</Badge>;
  };

  return (
    console.log("TOKEN INSIDE ADMIN:", localStorage.getItem("access")),

    <div className="container mt-5 pt-5">

      <h2 className="mb-4">Admin Incident Dashboard</h2>

      {message && (
        <Alert
          variant="info"
          dismissible
          onClose={() => setMessage(null)}
        >
          {message}
        </Alert>
      )}

      <Row className="mb-4">

        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title>Total</Card.Title>
              <h3>{stats.total}</h3>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title>Pending</Card.Title>
              <h3>{stats.pending}</h3>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title>In Progress</Card.Title>
              <h3>{stats.progress}</h3>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title>Resolved</Card.Title>
              <h3>{stats.resolved}</h3>
            </Card.Body>
          </Card>
        </Col>

      </Row>

      <Card className="mb-4">
        <Card.Header>
          <h5>Incident Categories</h5>
        </Card.Header>

        <Card.Body>

          {categoryStats.length === 0
            ? "No data available"
            : categoryStats.map((cat) => (
                <div key={cat.category}>
                  {cat.category} : {cat.count}
                </div>
              ))}

        </Card.Body>
      </Card>

      <Card>

        <Card.Header>
          <h5>All Incidents</h5>
        </Card.Header>

        <Card.Body style={{ overflowX: "auto" }}>

          {loading ? (

            <div className="d-flex justify-content-center">
              <Spinner animation="border" />
            </div>

          ) : (

            <>

            <Table striped bordered hover>

              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>User</th>
                  <th>Category</th>
                  <th>Department</th>
                  <th>Emails</th>
                  <th>Status</th>

                  <th>Status</th>
                  <th>Location</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>

                {visibleIncidents.map((inc) => (

                  <tr key={inc.id}>

                    <td>{inc.id}</td>
                    <td>{inc.title}</td>
                    <td>{inc.user?.username || "N/A"}</td>
                    <td>{inc.category}</td>
                    <td>{inc.department}</td>

<td>
  <div>
    <Badge 
  bg={
    inc.email_sent_count >= 3
      ? "danger"
      : "dark"
  }
>
  {inc.email_sent_count || 0} Sent
</Badge>


    {inc.last_email_sent_at && (
      <div style={{fontSize:"11px"}}>
        {new Date(
          inc.last_email_sent_at
        ).toLocaleString()}
      </div>
    )}
  </div>
</td>

<td>{statusBadge(inc.status)}</td>

                    <td>{statusBadge(inc.status)}</td>

                    <td>

                      {inc.latitude && inc.longitude ? (

                        <Button
                          size="sm"
                          variant="outline-success"
                          href={`https://www.google.com/maps?q=${inc.latitude},${inc.longitude}`}
                          target="_blank"
                        >
                          <GeoAltFill />
                        </Button>

                      ) : "N/A"}

                    </td>

                    <td>

                      <Button
                        size="sm"
                        variant="outline-primary"
                        className="me-2"
                        onClick={() => reportIncident(inc)}
                      >
                        <EnvelopeFill />
                      </Button>

                      <Button
                        size="sm"
                        variant="outline-warning"
                        className="me-2"
                        onClick={() => updateStatus(inc, "pending")}
                      >
                        Pending
                      </Button>

                      <Button
                        size="sm"
                        variant="outline-info"
                        className="me-2"
                        onClick={() => updateStatus(inc, "in progress")}
                      >
                        Progress
                      </Button>

                      <Button
                        size="sm"
                        variant="outline-success"
                        onClick={() => updateStatus(inc, "resolved")}
                      >
                        Resolve
                      </Button>

                    </td>

                  </tr>

                ))}

              </tbody>

            </Table>

            {incidents.length > 10 && (

              <div className="text-center mt-3">

                <Button
                  variant="outline-dark"
                  onClick={() => setShowAll(!showAll)}
                >
                  {showAll ? "Show Less" : "Show More"}
                </Button>

              </div>

            )}

            </>

          )}

        </Card.Body>

      </Card>

    </div>
  );
};

export default AdminDashboard;
