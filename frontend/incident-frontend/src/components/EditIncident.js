import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { Form, Button, Alert, Card, Spinner } from "react-bootstrap";

const EditIncident = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // 🔹 Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [existingImage, setExistingImage] = useState(null);

  // 🔹 UI states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // 📥 Fetch incident details
  useEffect(() => {
    const fetchIncident = async () => {
      try {
        const token = localStorage.getItem("access");

        const res = await axios.get(
          `http://127.0.0.1:8000/api/incidents/${id}/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setTitle(res.data.title);
        setDescription(res.data.description);
        setExistingImage(res.data.attachment);
      } catch (err) {
        console.error(err);
        setError("❌ Failed to load incident.");
      } finally {
        setLoading(false);
      }
    };

    fetchIncident();
  }, [id]);

  // 💾 Update incident
  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    if (!title.trim() || !description.trim()) {
      setError("Title and description cannot be empty.");
      setSaving(false);
      return;
    }

    try {
      const token = localStorage.getItem("access");

      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);

      if (attachment) {
        formData.append("attachment", attachment);
      }

      await axios.patch(
        `http://127.0.0.1:8000/api/incidents/${id}/`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            // ❌ DO NOT set Content-Type for FormData
          },
        }
      );

      alert("✅ Incident updated successfully!");
      navigate("/", { replace: true });
      
    } catch (err) {
      console.error(err.response?.data || err.message);
      setError("❌ Failed to update incident.");
    } finally {
      setSaving(false);
    }
  };

  // ⏳ Loading UI
  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" />
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <Card className="p-4 shadow-sm">
        <h3 className="mb-3">✏️ Edit Incident</h3>

        {error && <Alert variant="danger">{error}</Alert>}

        <Form onSubmit={handleUpdate}>
          {/* 🔹 Title */}
          <Form.Group className="mb-3">
            <Form.Label>Title</Form.Label>
            <Form.Control
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </Form.Group>

          {/* 🔹 Description */}
          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </Form.Group>

          {/* 🖼 Existing Image Preview */}
          {existingImage && (
            <div className="mb-3">
              <Form.Label>Current Attachment</Form.Label>
              <br />
              <img
                src={
                  existingImage.startsWith("http")
                    ? existingImage
                    : `http://127.0.0.1:8000${existingImage}`
                }
                alt="Current"
                style={{
                  maxWidth: "100%",
                  maxHeight: "200px",
                  borderRadius: "8px",
                }}
              />
            </div>
          )}

          {/* 📎 Upload New Image */}
          <Form.Group className="mb-3">
            <Form.Label>Replace Attachment (optional)</Form.Label>
            <Form.Control
              type="file"
              onChange={(e) => setAttachment(e.target.files[0])}
            />
          </Form.Group>

          {/* 🔘 Actions */}
          <div className="d-flex gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Updating..." : "Save Changes"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => navigate("/incidents")}
            >
              Cancel
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default EditIncident;
