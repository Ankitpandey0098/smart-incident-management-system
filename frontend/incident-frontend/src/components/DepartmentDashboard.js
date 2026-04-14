// src/components/DepartmentDashboard.js

import React, { useEffect, useState } from "react";
import axios from "axios";
import api from "../api/axios";
import {
  Table,
  Card,
  Spinner,
  Badge,
  Button,
  Alert
} from "react-bootstrap";

const DepartmentDashboard = () => {

  const token = localStorage.getItem("access");
  const department = localStorage.getItem("department");

  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {

    fetchIncidents();

    // ✅ Auto Refresh Every 5 Seconds
    const interval = setInterval(() => {
      fetchIncidents();
    }, 5000);

    return () => clearInterval(interval);

  }, []);

  const fetchIncidents = async () => {

    setLoading(true);

    try {

      const res = await api.get("/incidents/", {
  headers: {
    Authorization: `Bearer ${token}`
  }
});

      console.log("Logged Department:", department);
      console.log("All Incidents:", res.data);

      const filtered = res.data.filter(
        (i) =>
          i.department &&
          i.department.toLowerCase().trim() ===
          department.toLowerCase().trim()
      );

      console.log("Filtered Incidents:", filtered);

      const sorted = filtered.sort((a, b) => {

        const order = {
          "pending": 1,
          "in progress": 2,
          "resolved": 3
        };

        return order[a.status?.toLowerCase()] - order[b.status?.toLowerCase()];
      });

      setIncidents(sorted);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (incident, status) => {

    try {

      await api.patch(
  `/incidents/${incident.id}/`,
  { status },
  {
    headers: {
      Authorization: `Bearer ${token}`
    }
  }
);


      setMessage(`Status updated to ${status}`);

      fetchIncidents();

    } catch (err) {

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

  const priorityBadge = (priority) => {

    const p = priority?.toLowerCase();

    if (p === "high")
      return <Badge bg="danger">High</Badge>;

    if (p === "medium")
      return <Badge bg="warning">Medium</Badge>;

    return <Badge bg="secondary">Low</Badge>;
  };

  return (

    <div className="container mt-5 pt-5">

      <h2 className="mb-4">
        {department} Department Dashboard
      </h2>

      {message && (
        <Alert
          variant="info"
          dismissible
          onClose={() => setMessage(null)}
        >
          {message}
        </Alert>
      )}

      <Card>

        <Card.Header>
          <h5>Assigned Incidents</h5>
        </Card.Header>

        <Card.Body>

          {loading ? (
            <Spinner animation="border" />
          ) : incidents.length === 0 ? (

            <Alert variant="success">
              No incidents assigned 🎉
            </Alert>

          ) : (

            <Table striped bordered hover responsive>

              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Description</th>
                  <th>User</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>

                {incidents.map((inc) => (

                  <tr key={inc.id}>

                    <td>{inc.id}</td>

                    <td>{inc.title}</td>

                    <td>
                      {inc.description?.substring(0, 40)}...
                    </td>

                    <td>{inc.user?.username}</td>

                    <td>
                      {priorityBadge(inc.priority)}
                    </td>

                    <td>
                      {statusBadge(inc.status)}
                    </td>

                    <td>
                      {new Date(inc.created_at).toLocaleString()}
                    </td>

                    <td>

                      {inc.status !== "resolved" && (

                        <>
                          <Button
                            size="sm"
                            variant="warning"
                            className="me-2"
                            onClick={() =>
                              updateStatus(inc, "in progress")
                            }
                          >
                            Start
                          </Button>

                          <Button
                            size="sm"
                            variant="success"
                            onClick={() =>
                              updateStatus(inc, "resolved")
                            }
                          >
                            Resolve
                          </Button>
                        </>

                      )}

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

export default DepartmentDashboard;
