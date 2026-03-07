import React, { useEffect, useState } from "react";
import axios from "axios";

import {
  Card,
  Button,
  Alert,
  Badge,
  Row,
  Col,
  Spinner,
  Form,
  Modal,
  Toast,
  OverlayTrigger,
  Tooltip,
  ProgressBar
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc";
import IncidentCharts from "./IncidentCharts";

dayjs.extend(relativeTime);
dayjs.extend(utc);

const IncidentList = () => {
  const [incidents, setIncidents] = useState([]);
  const [filteredIncidents, setFilteredIncidents] = useState([]);
  const [prevIncidents, setPrevIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [toast, setToast] = useState({ show: false, message: "", variant: "success" });

  const [currentUser, setCurrentUser] = useState({ username: "", is_staff: false });

  const [showImage, setShowImage] = useState(false);
  const [activeImage, setActiveImage] = useState(null);

  const navigate = useNavigate();
  const [expandedLogs, setExpandedLogs] = useState({});
  const [departmentFilter, setDepartmentFilter] = useState("All");


  // Fetch current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem("access");
        const res = await axios.get("http://127.0.0.1:8000/api/user/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCurrentUser({ username: res.data.username, is_staff: res.data.is_staff });
      } catch (err) {
        console.error("Failed to fetch current user", err);
      }
    };
    fetchCurrentUser();
  }, []);

  // Fetch incidents
  const fetchIncidents = async () => {
    try {
      const token = localStorage.getItem("access");
      const res = await axios.get("http://127.0.0.1:8000/api/incidents/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const newIncidents = res.data.map(i => ({
        ...i,
        department: i.department || "Municipality",
        category: i.category || "General Issue",
      }));


      // Show toast if a new incident is reported
      if (prevIncidents.length && newIncidents.length > prevIncidents.length) {
        setToast({ show: true, message: "New incident reported!", variant: "info" });
      }

      setPrevIncidents(incidents);
      setIncidents(newIncidents);
      setFilteredIncidents(newIncidents);
    } catch {
      setError("Failed to load incidents");
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => { fetchIncidents(); }, []);

  // Polling every 10 seconds
  useEffect(() => {
    const interval = setInterval(fetchIncidents, 10000);
    return () => clearInterval(interval);
  }, []);

  // Filters
  useEffect(() => {
    let data = [...incidents];

    if (statusFilter !== "all") data = data.filter(i => i.status === statusFilter);
    if (selectedCategory !== "All") data = data.filter(i => i.category === selectedCategory);
    // ✅ Department filter
    if (departmentFilter !== "All") {
      data = data.filter(
        i => (i.department || "Municipality") === departmentFilter
      );
    }

    if (search.trim()) {
      const term = search.toLowerCase();
      data = data.filter(i =>
        i.title.toLowerCase().includes(term) ||
        i.description.toLowerCase().includes(term) ||
        i.user?.username.toLowerCase().includes(term)
      );
    }

    setFilteredIncidents(data);
  }, [search, statusFilter, selectedCategory,departmentFilter, incidents]);

  // Helpers
  const getImageUrl = (url) => url?.startsWith("http") ? url : `http://127.0.0.1:8000${url}`;
  const getConfidencePercent = (confidence) => confidence ? Math.round(confidence * 100) : 0;
  const getConfidenceVariant = (percent) => percent >= 70 ? "success" : percent >= 40 ? "warning" : "danger";
  const getConfidenceEmoji = (percent) => percent >= 70 ? "🔥" : percent >= 40 ? "⚠️" : "❄️";

  const getCategoryBadge = (category, confidence) => {
    if (!category) return <Badge bg="secondary">Needs Review</Badge>;
    const percent = getConfidencePercent(confidence);
    let color = "danger";
    if (percent >= 70) color = "success";
    else if (percent >= 40) color = "warning";
    return (
      <OverlayTrigger placement="top" overlay={<Tooltip>ML confidence: {percent}%</Tooltip>}>
        <Badge bg={color} className="me-2" style={{ cursor: "pointer", fontWeight: 500 }}>
          {category} ({percent}%)
        </Badge>
      </OverlayTrigger>
    );
  };

  const getStatusBadge = (status) => {
    const map = { pending: "secondary", "in progress": "warning", resolved: "success" };
    return <Badge bg={map[status] || "dark"} className="ms-2" style={{ fontWeight: 500, padding: "0.35em 0.6em" }}>{status.toUpperCase()}</Badge>;
  };

  // Actions
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this incident?")) return;
    try {
      const token = localStorage.getItem("access");
      await axios.delete(`http://127.0.0.1:8000/api/incidents/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIncidents(prev => prev.filter(i => i.id !== id));
      setToast({ show: true, message: "Incident deleted successfully", variant: "success" });
    } catch (err) {
      console.error(err);
      setToast({ show: true, message: "Delete failed", variant: "danger" });
    }
  };

  const updateCategory = async (id, category) => {
    try {
      const token = localStorage.getItem("access");
      await axios.patch(`http://127.0.0.1:8000/api/incidents/${id}/`, { category }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIncidents(prev => prev.map(i => i.id === id ? { ...i, category } : i));
      setToast({ show: true, message: `Category updated to "${category}"`, variant: "success" });
    } catch {
      setToast({ show: true, message: "Category update failed", variant: "danger" });
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      const token = localStorage.getItem("access");
      await axios.patch(`http://127.0.0.1:8000/api/incidents/${id}/`, { status }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIncidents(prev => prev.map(i => i.id === id ? { ...i, status } : i));
      setToast({ show: true, message: `Status updated to "${status}"`, variant: "success" });
    } catch {
      setToast({ show: true, message: "Status update failed", variant: "danger" });
    }
  };

  return (
    <div style={{ minHeight: "100vh", padding: "40px 20px" }}>
      <div className="container">
        <h2 className="fw-bold text-primary mb-4">Civic & Environmental Reports</h2>


        {/* Filters */}
        <Row className="mb-4 g-2">
          <Col md={6}>
            <Form.Control placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
          </Col>
          <Col md={3}>
            <Form.Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </Form.Select>
          </Col>
          {/* <Col md={3}>
            <Form.Select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
            <option value="All">All Categories</option>
            <option value="Deforestation">Deforestation</option>
            <option value="Illegal Wood Smuggling">Illegal Wood Smuggling</option>
            <option value="Drainage Issue">Drainage Issue</option>
            <option value="Illegal Dumping">Illegal Dumping</option>
            <option value="Environmental Damage">Environmental Damage</option>
          </Form.Select>

          </Col> */}
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
              <option value="Waste Management">Waste Management</option>
              <option value="Public Health">Public Health</option>
              <option value="Wildlife / Animal Control">Wildlife / Animal Control</option>
              <option value="Parks & Recreation">Parks & Recreation</option>
            </Form.Select>
          </Col>

        </Row>

        {error && <Alert variant="danger">{error}</Alert>}
        {loading ? <Spinner animation="border" /> : filteredIncidents.length === 0 ? (
          <Alert variant="info">No incidents found</Alert>
        ) : (
          <Row xs={1} md={2} className="g-4">
            {filteredIncidents.map(incident => (
              <Col key={incident.id}>
                <Card className="shadow-sm h-100">
                  <Card.Body>
                    <Card.Title>{incident.title}</Card.Title>
                    {incident.category && (
                      <div className="mt-2 d-flex align-items-center justify-content-between">
                        <strong>{getConfidenceEmoji(getConfidencePercent(incident.confidence))} {incident.category}</strong>
                        <ProgressBar now={getConfidencePercent(incident.confidence)} variant={getConfidenceVariant(getConfidencePercent(incident.confidence))} style={{ width: "60%" }} label={`${getConfidencePercent(incident.confidence)}%`} />
                      </div>
                    )}
                    {/* Department */}
                    <div className="mt-1">
                      <strong>🏛️ Department:</strong>{" "}
                      {incident.department || "Municipality"}
                    </div>


                    <p className="text-muted mt-2">{incident.description}</p>

                    {/* Reporter info */}
                    <div className="text-muted small">
                      Reported by <strong>{incident.user.username}</strong> •{" "}
                      {dayjs.utc(incident.created_at).local().fromNow()}
                    </div>

                    {/* Activity Timeline */}
                    {incident.logs.length > 0 && (
                      <div className="mt-2">
                        <strong>🕒 Activity Timeline</strong>

                        <ul className="mt-1 ps-3">
                          {(expandedLogs[incident.id]
                            ? incident.logs
                            : incident.logs.slice(0, 1)
                          ).map(log => {
                            const actionLower = log.action.toLowerCase();
                            let logClass = "small";
                            if (actionLower.includes("status")) logClass += " text-primary";
                            else if (actionLower.includes("category")) logClass += " text-success";
                            else logClass += " text-muted";

                            return (
                              <li key={log.id} className={logClass}>
                                {log.action} • {dayjs.utc(log.created_at).local().fromNow()}
                              </li>
                            );
                          })}
                        </ul>

                        {incident.logs.length > 1 && (
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0"
                            onClick={() =>
                              setExpandedLogs(prev => ({
                                ...prev,
                                [incident.id]: !prev[incident.id],
                              }))
                            }
                          >
                            {expandedLogs[incident.id] ? "Show less" : "Show more"}
                          </Button>
                        )}
                      </div>
                    )}


                    {/* Admin: Category & Status */}
                    {currentUser.is_staff && (
                        <div className="mt-3 d-flex flex-column gap-2">
                          <Form.Select
                            size="sm"
                            value={incident.category || ""}
                            onChange={e => updateCategory(incident.id, e.target.value)}
                            style={{ maxWidth: "220px" }}
                          >
                            <option value="">Select Category</option>
                            <option value="Deforestation">Deforestation</option>
                            <option value="Illegal Wood Smuggling">Illegal Wood Smuggling</option>
                            <option value="Drainage Issue">Drainage Issue</option>
                            <option value="Illegal Dumping">Illegal Dumping</option>
                            <option value="Environmental Damage">Environmental Damage</option>
                          </Form.Select>


                          <Form.Select size="sm" value={incident.status} onChange={e => handleStatusChange(incident.id, e.target.value)} style={{ maxWidth: "180px" }}>
                            <option value="pending">Pending</option>
                            <option value="in progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                          </Form.Select>
                        </div>
                      )}


                    {/* Attachment */}
                    {incident.attachment && (
                      <img src={getImageUrl(incident.attachment)} alt="Incident" style={{ width: "100%", maxHeight: "220px", objectFit: "cover", borderRadius: "10px", marginTop: "10px", cursor: "pointer" }} onClick={() => { setActiveImage(getImageUrl(incident.attachment)); setShowImage(true); }} />
                    )}

                    {/* Edit/Delete buttons */}
                    {(incident.user?.username === currentUser.username || currentUser.is_staff) && (

                      <div className="d-flex justify-content-start gap-2 mt-3">
                        <Button size="sm" variant="outline-primary" onClick={() => navigate(`/edit/${incident.id}`)}>Edit</Button>
                        <Button size="sm" variant="outline-danger" onClick={() => handleDelete(incident.id)}>Delete</Button>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}

      </div>

      {/* Image Modal */}
      <Modal show={showImage} onHide={() => setShowImage(false)} centered size="lg">
        <Modal.Body className="p-0">
          <img src={activeImage} alt="preview" style={{ width: "100%" }} />
        </Modal.Body>
      </Modal>

      {/* Toast */}
      <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999 }}>
        <Toast show={toast.show} bg={toast.variant} onClose={() => setToast({ ...toast, show: false })} delay={3000} autohide>
          <Toast.Body className="text-white">{toast.message}</Toast.Body>
        </Toast>
      </div>
      {/* Incident Charts */}
      <div className="container mt-5">
        <h3 className="fw-bold text-primary mb-4">Incident Statistics</h3>
        <IncidentCharts />
      </div>

    </div>
  );
};

export default IncidentList;
