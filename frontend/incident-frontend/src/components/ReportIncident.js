import React, { useState } from "react";
import axios from "axios";
import { Form, Button, Container, Alert, Card } from "react-bootstrap";

function ReportIncident() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [attachmentName, setAttachmentName] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const token = localStorage.getItem("access");
    if (!token) {
      setError("Please login first");
      return;
    }

    

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);


      if (attachment) {
        formData.append("attachment", attachment);
      }

      await axios.post(
        "http://127.0.0.1:8000/api/incidents/",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // ✅ Success message includes selected department
      setMessage("✅ Report submitted successfully. Department assigned automatically.");


      setTitle("");
      setDescription("");
      setAttachment(null);
      setAttachmentName("");


    } catch (err) {
      console.error(err.response?.data || err.message);
      setError("❌ Failed to report the incident.");
    }
  };

  return (
    <Container className="mt-5" style={{ maxWidth: "650px" }}>
      <Card className="shadow-sm">
        <Card.Body>
          <h3 className="text-center text-primary mb-4">
            🏙️ Report a Civic or Environmental Issue
          </h3>

          {error && <Alert variant="danger">{error}</Alert>}
          {message && <Alert variant="success">{message}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Incident Title</Form.Label>
              <Form.Control
                type="text"
                placeholder="Short summary of the incident"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                placeholder="Describe the incident in detail"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
              <Form.Text className="text-muted">
                Report non-emergency issues such as deforestation, drainage problems, or illegal activities.
              </Form.Text>
            </Form.Group>




            <Form.Group className="mb-4">
              <Form.Label>Attachment (optional)</Form.Label>
              <Form.Control
                type="file"
                onChange={(e) => {
                  if (e.target.files.length > 0) {
                    setAttachment(e.target.files[0]);
                    setAttachmentName(e.target.files[0].name);
                  }
                }}
              />
            </Form.Group>

            <Button type="submit" variant="primary" className="w-100">
              Submit Report
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default ReportIncident;
