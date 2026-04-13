import React, { useContext, useEffect, useState } from "react";
import { Navbar, Nav, Button, Container, Dropdown, Badge, Spinner } from "react-bootstrap";
import { Link, useNavigate, useLocation } from "react-router-dom";
import ProfileBar from "./ProfileBar";
import { UserContext } from "../UserContext";
import axios from "axios";
import api from "../api/axios";
const NavigationBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(UserContext);
  const token = localStorage.getItem("access");

  const [darkMode, setDarkMode] = useState(localStorage.getItem("darkMode") === "true");
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [hoveredNotification, setHoveredNotification] = useState(null);

  useEffect(() => {
    document.body.classList.toggle("dark-mode", darkMode);
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  useEffect(() => {
    if (token) fetchNotifications();
    const interval = setInterval(() => {
      if (token) fetchNotifications();
    }, 15000);
    return () => clearInterval(interval);
  }, [token]);

  const fetchNotifications = async () => {
    setLoadingNotifications(true);
    try {
      const res = await api.get("notifications/", {
  headers: { Authorization: `Bearer ${token}` },
});
      setNotifications(res.data);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const markAsRead = async (id) => {
    try {
   await api.post(
  "notifications/mark_read/",
  { notification_id: id },
  {
    headers: { Authorization: `Bearer ${token}` },
  }
);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <Navbar fixed="top" expand="lg" className="main-navbar shadow-sm bg-white">
      <Container fluid>
        <Navbar.Brand as={Link} to="/" className="fw-bold">
          🚨 Incident Platform
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="navbar-nav" />
        <Navbar.Collapse id="navbar-nav">
          <Nav className="me-auto ms-4">
            {token && (
              <>
                <Nav.Link
                  as={Link}
                  to="/dashboard"
                  className={isActive("/dashboard") ? "fw-semibold text-primary" : ""}
                >
                  Dashboard
                </Nav.Link>
                <Nav.Link
                as={Link}
                to="/incident-statistics"
                className={isActive("/incident-statistics") ? "fw-semibold text-primary" : ""}
              >
                Incident Statistics
              </Nav.Link>

                <Nav.Link
                  as={Link}
                  to="/report"
                  className={isActive("/report") ? "fw-semibold text-primary" : ""}
                >
                  Report Incident
                </Nav.Link>

                {/* Admin panel */}
                {user?.role === "admin" && (
                  <Nav.Link
                    as={Link}
                    to="/admin"
                    className={isActive("/admin") ? "fw-semibold text-primary" : ""}
                  >
                    Admin Panel
                  </Nav.Link>
                )}

                {/* City Map */}
                <Nav.Link
                  as={Link}
                  to="/map"
                  className={isActive("/map") ? "fw-semibold text-primary" : ""}
                >
                  City Map
                </Nav.Link>
              </>
            )}
          </Nav>

          <Nav className="ms-auto align-items-center">
            {token ? (
              <>
                <div className="d-flex align-items-center gap-3 me-3">
                  {/* Dark Mode Toggle */}
                  <Button
                    variant={darkMode ? "secondary" : "light"}
                    size="sm"
                    className="rounded-circle"
                    onClick={() => setDarkMode(!darkMode)}
                    style={{ width: 36, height: 36 }}
                  >
                    {darkMode ? "☀️" : "🌙"}
                  </Button>

                  {/* Notifications */}
                  <Dropdown align="end">
                    <Dropdown.Toggle
                      variant="light"
                      id="dropdown-notifications"
                      className="position-relative rounded-circle d-flex align-items-center justify-content-center"
                      style={{ width: 40, height: 40, fontSize: 20, lineHeight: 1, paddingLeft: 30 }}
                    >
                      🔔
                      {unreadCount > 0 && (
                        <Badge
                          bg="danger"
                          pill
                          style={{
                            position: "absolute",
                            top: 0,
                            right: 0,
                            fontSize: "0.6rem",
                          }}
                        >
                          {unreadCount}
                        </Badge>
                      )}
                    </Dropdown.Toggle>

                    <Dropdown.Menu
                      style={{ minWidth: "320px", maxHeight: "400px", overflowY: "auto" }}
                    >
                      <Dropdown.Header className="fw-bold">Notifications</Dropdown.Header>

                      {loadingNotifications && (
                        <div className="d-flex justify-content-center p-2">
                          <Spinner animation="border" size="sm" />
                        </div>
                      )}

                      {!loadingNotifications && notifications.length === 0 && (
                        <div className="px-3 py-2 text-muted">No notifications</div>
                      )}

                      {!loadingNotifications &&
                        notifications.map((n) => (
                          <Dropdown.Item
                            key={n.id}
                            onMouseEnter={() => setHoveredNotification(n.id)}
                            onMouseLeave={() => setHoveredNotification(null)}
                            className="d-flex justify-content-between align-items-center"
                            style={{
                              fontWeight: n.is_read ? "normal" : "bold",
                              color: n.is_read ? "#6c757d" : "#000",
                              whiteSpace: "normal",
                              wordWrap: "break-word",
                            }}
                          >
                            <span>{n.message}</span>
                            {!n.is_read && hoveredNotification === n.id && (
                              <span
                                onClick={() => markAsRead(n.id)}
                                style={{ cursor: "pointer", marginLeft: "10px" }}
                                title="Mark as Read"
                              >
                                👁️
                              </span>
                            )}
                          </Dropdown.Item>
                        ))}
                    </Dropdown.Menu>
                  </Dropdown>
                </div>

                <div className="mx-3" style={{ width: 1, height: 30, background: "#ddd" }} />

                <ProfileBar />

                <Button
                  variant="outline-danger"
                  size="sm"
                  className="ms-3"
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button
                  as={Link}
                  to="/login"
                  variant="outline-secondary"
                  size="sm"
                  className="me-2"
                >
                  Login
                </Button>
                <Button
                  as={Link}
                  to="/signup"
                  variant="success"
                  size="sm"
                >
                  Sign Up
                </Button>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavigationBar;
