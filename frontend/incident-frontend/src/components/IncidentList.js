import React, { useEffect, useState } from "react";
import axios from "axios";
import api from "../api/axios";
import {
  Card,
  Button,
  Alert,
  Row,
  Col,
  Spinner,
  Form,
  Modal,
  Toast,
  ProgressBar
} from "react-bootstrap";

import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import IncidentCharts from "./IncidentCharts";

import LiveIncidentFeed from "../components/LiveIncidentFeed";

dayjs.extend(relativeTime);
dayjs.extend(utc);




const IncidentList = () => {

  const [incidents, setIncidents] = useState([]);
  const [filteredIncidents, setFilteredIncidents] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("All");

  const [currentUser, setCurrentUser] = useState({
    username: "",
    is_staff: false
  });

  const [toast, setToast] = useState({
    show: false,
    message: "",
    variant: "success"
  });

  const [showImage, setShowImage] = useState(false);
  const [activeImage, setActiveImage] = useState(null);

  const navigate = useNavigate();

  const token = localStorage.getItem("access");

  const axiosConfig = {
    headers: { Authorization: `Bearer ${token}` }
  };

  // =========================
  // SLA OVERDUE CHECK (24h)
  // =========================
  const isOverdue = (incident) => {
    if (incident.status === "resolved") return false;

    const created = dayjs.utc(incident.created_at);
    const now = dayjs.utc();

    const hours = now.diff(created, "hour");

    return hours >= 24;
  };

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get("user/");

        setCurrentUser(res.data);
      } catch (err) {
        console.error("User fetch failed", err);
      }
    };

    fetchUser();
  }, []);

  // Fetch incidents
  const fetchIncidents = async () => {
    try {

      const res = await api.get("incidents/");

      const formatted = res.data.map(i => ({
        ...i,
        department: i.department || "Municipality",
        category: i.category || "General Issue",
        logs: i.logs || []
      }));

    const sorted = sortByStatusPriority(formatted);

setIncidents(sorted);
setFilteredIncidents(sorted);



    } catch {

      setError("Failed to load incidents");

    } finally {

      setLoading(false);

    }
  };
// =========================
// STATUS PRIORITY SORT
// =========================
const sortByStatusPriority = (data) => {

  const priority = {
    "pending": 1,
    "in progress": 2,
    "resolved": 3
  };

  return [...data].sort((a, b) => {

    const statusA = priority[a.status?.toLowerCase()] || 99;
    const statusB = priority[b.status?.toLowerCase()] || 99;

    // First sort by status priority
    if (statusA !== statusB) {
      return statusA - statusB;
    }

    // Then sort by time inside each group
    const dateA = new Date(a.created_at);
    const dateB = new Date(b.created_at);

    // Pending → newest first
    if (a.status === "pending") {
      return dateB - dateA;
    }

    // In progress → oldest first (SLA priority)
    if (a.status === "in progress") {
      return dateA - dateB;
    }

    // Resolved → newest last
    return dateA - dateB;

  });
};



  useEffect(() => {
    fetchIncidents();
  }, []);

  useEffect(() => {
    const interval = setInterval(fetchIncidents, 10000);
    return () => clearInterval(interval);
  }, []);

  // Filters
 useEffect(() => {

  let data = [...incidents];

  if (statusFilter !== "all") {
    data = data.filter(i => i.status === statusFilter);
  }

  if (departmentFilter !== "All") {
    data = data.filter(i => i.department === departmentFilter);
  }

  if (search.trim()) {

    const term = search.toLowerCase();

    data = data.filter(i =>
      i.title.toLowerCase().includes(term) ||
      i.description.toLowerCase().includes(term) ||
      i.user?.username.toLowerCase().includes(term)
    );
  }

  // Sort by status priority
  setFilteredIncidents(sortByStatusPriority(data));

}, [search, statusFilter, departmentFilter, incidents]);

  const getImageUrl = (url) => {
  if (!url) return null;
  return url.startsWith("http")
    ? url
    : `https://smart-incident-management-system-chno.onrender.com${url}`;
};


  const getConfidencePercent = (c) => c ? Math.round(c * 100) : 0;

  const getConfidenceVariant = (p) => {
    if (p >= 70) return "success";
    if (p >= 40) return "warning";
    return "danger";
  };

  const getConfidenceEmoji = (p) => {
    if (p >= 70) return "🔥";
    if (p >= 40) return "⚠️";
    return "❄️";
  };

  // =========================
  // EXPORT CSV
  // =========================
  const exportCSV = () => {

    const headers = [
      "ID",
      "Title",
      "Category",
      "Department",
      "Status",
      "Reported By",
      "Date"
    ];

    const rows = filteredIncidents.map(i => [
      i.id,
      i.title,
      i.category,
      i.department,
      i.status,
      i.user?.username,
      dayjs(i.created_at).format("YYYY-MM-DD HH:mm")
    ]);

    let csvContent =
      "data:text/csv;charset=utf-8," +
      [headers, ...rows].map(e => e.join(",")).join("\n");

    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = "incident_report.csv";
    link.click();
  };

  // =========================
  // EXPORT PDF
  // =========================
  const exportPDF = () => {

    const doc = new jsPDF();

    doc.text("Incident Report", 14, 15);

    const rows = filteredIncidents.map(i => [
      i.id,
      i.title,
      i.category,
      i.department,
      i.status,
      i.user?.username,
      dayjs(i.created_at).format("YYYY-MM-DD")
    ]);

    autoTable(doc, {
      head: [["ID", "Title", "Category", "Department", "Status", "User", "Date"]],
      body: rows,
      startY: 20
    });

    doc.save("incident_report.pdf");
  };

  const handleDelete = async (id) => {

    if (!window.confirm("Delete this incident?")) return;

    try {

      await api.delete(`incidents/${id}/`);


      setIncidents(prev =>
  sortByStatusPriority(
    prev.filter(i => i.id !== id)
  )
);


      setToast({
        show: true,
        message: "Incident deleted",
        variant: "success"
      });

    } catch {

      setToast({
        show: true,
        message: "Delete failed",
        variant: "danger"
      });

    }
  };

 const updateCategory = async (id, category) => {

  try {

    await api.patch(`incidents/${id}/`, { category });

    setIncidents(prev => {
      const updated = prev.map(i =>
        i.id === id ? { ...i, category } : i
      );

      return sortByStatusPriority(updated);
    });

    setToast({
      show: true,
      message: "Category updated",
      variant: "success"
    });

  } catch {

    setToast({
      show: true,
      message: "Update failed",
      variant: "danger"
    });

  }
};

  const handleStatusChange = async (id, status) => {

  try {

    await api.patch(`incidents/${id}/`, { status });

    setIncidents(prev => {
      const updated = prev.map(i =>
        i.id === id ? { ...i, status } : i
      );

      return sortByStatusPriority(updated);
    });

    setToast({
      show: true,
      message: "Status updated",
      variant: "success"
    });

  } catch {

    setToast({
      show: true,
      message: "Status update failed",
      variant: "danger"
    });

  }
};


  return (

    <div style={{ minHeight: "100vh", padding: "40px 20px" }}>

      <div className="container">

        <h2 className="fw-bold text-primary mb-4">
          Civic & Environmental Reports
        </h2>

        {currentUser.is_staff && (

          <div className="mb-3 d-flex gap-2">

            <Button variant="success" onClick={exportCSV}>
              Export CSV
            </Button>

            <Button variant="danger" onClick={exportPDF}>
              Export PDF
            </Button>

          </div>

        )}

        <Row className="mb-4 g-2">

          <Col md={6}>
            <Form.Control
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </Col>

          <Col md={3}>
            <Form.Select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </Form.Select>
          </Col>

          <Col md={3}>
            <Form.Select
              value={departmentFilter}
              onChange={e => setDepartmentFilter(e.target.value)}
            >
              <option value="All">All Departments</option>
              <option value="Forest">Forest</option>
              <option value="Municipality">Municipality</option>
              <option value="Pollution">Pollution</option>
              <option value="Water Management">Water Management</option>
              <option value="Traffic / Roads">Traffic / Roads</option>
            </Form.Select>
          </Col>

        </Row>

        {error && <Alert variant="danger">{error}</Alert>}

        {loading ? (

          <Spinner animation="border" />

        ) : filteredIncidents.length === 0 ? (

          <Alert variant="info">No incidents found</Alert>

        ) : (

          <Row xs={1} md={2} className="g-4">

            {filteredIncidents.map(incident => {

              const confidence = getConfidencePercent(incident.confidence);

              const overdue = isOverdue(incident);

              return (

                <Col key={incident.id}>

                  <Card
                    className="shadow-sm h-100"
                    style={{
                      border: overdue ? "2px solid #dc3545" : ""
                    }}
                  >

                    <Card.Body>

                      <Card.Title>{incident.title}</Card.Title>

                      {overdue && (
                        <div className="mb-2">
                          <span
                            style={{
                              background: "#dc3545",
                              color: "white",
                              padding: "4px 10px",
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontWeight: "bold"
                            }}
                          >
                            ⚠ OVERDUE
                          </span>
                        </div>
                      )}

                      <div className="mt-2 d-flex justify-content-between align-items-center">

                        <strong>
                          {getConfidenceEmoji(confidence)} {incident.category}
                        </strong>

                        <ProgressBar
                          now={confidence}
                          variant={getConfidenceVariant(confidence)}
                          label={`${confidence}%`}
                          style={{ width: "60%" }}
                        />

                      </div>

                      <div className="mt-2">
                        <strong>🏛️ Department:</strong> {incident.department}
                      </div>
                      <div className="mt-2">
  <strong>📌 Status:</strong>{" "}
  <span
    style={{
      padding: "4px 10px",
      borderRadius: "6px",
      color: "white",
      fontSize: "12px",
      fontWeight: "bold",
      background:
        incident.status === "pending"
          ? "#ffc107"
          : incident.status === "in progress"
          ? "#0d6efd"
          : "#198754"
    }}
  >
    {incident.status?.toUpperCase()}
  </span>
</div>

                      <p className="text-muted mt-2">
                        {incident.description}
                      </p>

                      {currentUser.is_staff && (

                        <div className="mt-3">

                          <strong>Admin Controls</strong>

                          <Form.Select
                            className="mt-2"
                            value={incident.status}
                            onChange={(e) =>
                              handleStatusChange(incident.id, e.target.value)
                            }
                          >
                            <option value="pending">Pending</option>
                            <option value="in progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                          </Form.Select>

                          <Form.Select
                            className="mt-2"
                            value={incident.category}
                            onChange={(e) =>
                              updateCategory(incident.id, e.target.value)
                            }
                          >
                            <option value="Infrastructure">Infrastructure</option>
                            <option value="Pollution">Pollution</option>
                            <option value="Deforestation">Deforestation</option>
                            <option value="Water Issue">Water Issue</option>
                            <option value="Illegal Dumping">Illegal Dumping</option>
                            <option value="General Issue">General Issue</option>
                          </Form.Select>

                        </div>

                      )}

                      {incident.latitude && incident.longitude && (

                        <div className="mt-3">

                          <strong>📍 Location</strong>

                          <div className="small text-muted">
                            Lat: {incident.latitude.toFixed(5)} <br/>
                            Lng: {incident.longitude.toFixed(5)}
                          </div>

                          <Button
                            size="sm"
                            variant="outline-success"
                            className="mt-2"
                            onClick={() =>
                              window.open(
                                `https://www.google.com/maps?q=${incident.latitude},${incident.longitude}`,
                                "_blank"
                              )
                            }
                          >
                            🗺️ View on Map
                          </Button>

                        </div>

                      )}

                      <div className="text-muted small mt-2">
                        Reported by <strong>{incident.user.username}</strong> •{" "}
                        {dayjs.utc(incident.created_at).local().fromNow()}
                      </div>

                      {incident.attachment && (

                        <img
                          src={getImageUrl(incident.attachment)}
                          alt="incident"
                          style={{
                            width: "100%",
                            maxHeight: "220px",
                            objectFit: "cover",
                            borderRadius: "10px",
                            marginTop: "10px",
                            cursor: "pointer"
                          }}
                          onClick={() => {
                            setActiveImage(getImageUrl(incident.attachment));
                            setShowImage(true);
                          }}
                        />

                      )}

                      {(incident.user?.username === currentUser.username ||
                        currentUser.is_staff) && (

                        <div className="mt-3 d-flex gap-2">

                          <Button
                            size="sm"
                            variant="outline-primary"
                            onClick={() => navigate(`/edit/${incident.id}`)}
                          >
                            Edit
                          </Button>

                          <Button
                            size="sm"
                            variant="outline-danger"
                            onClick={() => handleDelete(incident.id)}
                          >
                            Delete
                          </Button>

                        </div>

                      )}

                    </Card.Body>

                  </Card>

                </Col>
              );
            })}

          </Row>

        )}

      </div>

      <Modal show={showImage} onHide={() => setShowImage(false)} centered size="lg">
        <Modal.Body className="p-0">
          <img src={activeImage} alt="preview" style={{ width: "100%" }} />
        </Modal.Body>
      </Modal>

      <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999 }}>

        <Toast
          show={toast.show}
          bg={toast.variant}
          delay={3000}
          autohide
          onClose={() => setToast({ ...toast, show: false })}
        >

          <Toast.Body className="text-white">
            {toast.message}
          </Toast.Body>

        </Toast>

      </div>

      
      

    </div>
  );
};

export default IncidentList;
