import React, { useEffect, useState } from "react";
import {
  Card,
  Row,
  Col,
  Spinner,
  Alert,
  Button,
  Form,
  Badge,
  Image,
} from "react-bootstrap";

import { useNavigate } from "react-router-dom";
import api from "../api/axios";
const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    email: "",
    first_name: "",
    last_name: "",
    phone: "",
    city: "",
    profile_image: null,
  });
  const [preview, setPreview] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const token = localStorage.getItem("access");

  /* ================= LOAD PROFILE ================= */
  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    api.get("profile/", {
  headers: { Authorization: `Bearer ${token}` },
})
      .then((res) => {
        setProfile(res.data);
        setFormData({
          email: res.data.email || "",
          first_name: res.data.first_name || "",
          last_name: res.data.last_name || "",
          phone: res.data.phone || "",
          city: res.data.city || "",
          profile_image: null,
        });
        setPreview(res.data.profile_image || null);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load profile");
        setLoading(false);
      });
  }, [navigate, token]);

  /* ================= INPUT HANDLERS ================= */
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, profile_image: file });
      setPreview(URL.createObjectURL(file));
    }
  };

  /* ================= SAVE PROFILE ================= */
  const handleSave = () => {
    const data = new FormData();
    Object.keys(formData).forEach((key) => {
      if (formData[key]) data.append(key, formData[key]);
    });

    api.patch("profile/", data, {
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "multipart/form-data",
  },
})
      .then((res) => {
        setProfile({ ...profile, ...res.data });
        setEditMode(false);
        setFormData({ ...formData, profile_image: null });
      })
      .catch(() => setError("Failed to update profile"));
  };

  /* ================= UI STATES ================= */
  if (loading)
    return <Spinner animation="border" className="d-block mx-auto mt-5" />;
  if (error) return <Alert variant="danger">{error}</Alert>;

  /* ================= RENDER ================= */
  return (
    <div className="d-flex justify-content-center mt-5 px-3">
      <Card
        className="shadow-sm"
        style={{
          maxWidth: 760,
          width: "100%",
          borderRadius: 12,
          border: "1px solid #e5e7eb",
        }}
      >
        <Card.Body className="p-4">

          {/* HEADER */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h4 className="fw-semibold mb-0">My Profile</h4>
            <Badge bg="info" pill className="px-3 py-2 text-uppercase">
              {profile.role}
            </Badge>
          </div>

          {/* AVATAR ROW */}
          <Row className="align-items-center mb-4">
            <Col xs="auto">
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: "1px solid #ddd",
                  position: "relative",
                  backgroundColor: "#f3f4f6",
                }}
              >
                <Image
                  src={preview || "/default-avatar.png"}
                  alt="Profile"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />

                {editMode && (
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{
                      position: "absolute",
                      inset: 0,
                      opacity: 0,
                      cursor: "pointer",
                    }}
                  />
                )}
              </div>
            </Col>

            <Col>
              <div className="fw-semibold">{profile.username}</div>
              <div className="text-muted" style={{ fontSize: 13 }}>
                {editMode ? "Click avatar to change photo" : "Profile picture"}
              </div>
            </Col>
          </Row>

          {/* ACCOUNT INFO */}
          {["email", "first_name", "last_name", "phone", "city"].map((field) => (
            <Row className="mb-3 align-items-center" key={field}>
              <Col md={4} className="text-muted text-capitalize">
                {field.replace("_", " ")}
              </Col>
              <Col md={8}>
                <Form.Control
                  name={field}
                  value={editMode ? formData[field] : profile[field] || ""}
                  onChange={handleChange}
                  disabled={!editMode}
                  style={{
                    backgroundColor: editMode ? "#fff" : "#f3f4f6",
                    borderRadius: 8,
                  }}
                />
              </Col>
            </Row>
          ))}

          {/* ACTION BUTTONS */}
          <div className="text-end mt-4">
            {editMode ? (
              <>
                <Button size="sm" onClick={handleSave} className="me-2">
                  Save Changes
                </Button>
                <Button
                  size="sm"
                  variant="outline-secondary"
                  onClick={() => setEditMode(false)}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={() => setEditMode(true)}>
                Edit Profile
              </Button>
            )}
          </div>

        </Card.Body>
      </Card>
    </div>
  );
};

export default Profile;
