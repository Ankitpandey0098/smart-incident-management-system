import React, { useState } from "react";
import axios from "axios";
import { Form, Button, Container, Alert, Card } from "react-bootstrap";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix marker icon issue
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function ReportIncident() {

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [attachment, setAttachment] = useState(null);
  const [attachmentName, setAttachmentName] = useState("");

  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);

  const [showMap, setShowMap] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // 📡 Get GPS location
  const getCurrentLocation = () => {

    if (!navigator.geolocation) {
      setError("Geolocation not supported.");
      return;
    }

    navigator.geolocation.getCurrentPosition(

      (position) => {

        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);

      },

      () => {
        setError("Unable to retrieve location.");
      }

    );
  };

  // 📍 Map click handler
  function LocationMarker() {

    useMapEvents({
      click(e) {
        setLatitude(e.latlng.lat);
        setLongitude(e.latlng.lng);
      },
    });

    return latitude && longitude ? (
      <Marker position={[latitude, longitude]} />
    ) : null;
  }

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

      if (latitude && longitude) {
        formData.append("latitude", latitude);
        formData.append("longitude", longitude);
      }

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

      setMessage("✅ Report submitted successfully.");

      setTitle("");
      setDescription("");
      setAttachment(null);
      setAttachmentName("");
      setLatitude(null);
      setLongitude(null);

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

            {/* Title */}

            <Form.Group className="mb-3">
              <Form.Label>Incident Title</Form.Label>
              <Form.Control
                type="text"
                placeholder="Short summary"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </Form.Group>

            {/* Description */}

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                placeholder="Describe the incident"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </Form.Group>

            {/* LOCATION SECTION */}

            <Form.Group className="mb-3">

              <Form.Label>📍 Incident Location</Form.Label>

              <div className="d-flex gap-2">

                <Button
                  variant="outline-primary"
                  onClick={getCurrentLocation}
                >
                  📡 Use Current Location
                </Button>

                <Button
                  variant="outline-success"
                  onClick={() => setShowMap(!showMap)}
                >
                  🗺️ Select From Map
                </Button>

              </div>

              {/* Map */}

              {showMap && (

                <div className="mt-3">

                  <MapContainer
                    center={[28.4744, 77.5040]}
                    zoom={13}
                    style={{ height: "300px", width: "100%" }}
                  >

                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    <LocationMarker />

                  </MapContainer>

                </div>

              )}

              {/* Coordinates */}

              {latitude && longitude && (

                <div className="mt-3 p-2 border rounded bg-light">

                  <strong>Selected Location</strong>

                  <div className="text-muted">

                    Latitude: {latitude.toFixed(5)} <br/>
                    Longitude: {longitude.toFixed(5)}

                  </div>

                  <Button
                    size="sm"
                    variant="outline-secondary"
                    className="mt-2"
                    onClick={() =>
                      window.open(
                        `https://www.google.com/maps?q=${latitude},${longitude}`,
                        "_blank"
                      )
                    }
                  >
                    View on Map
                  </Button>

                </div>

              )}

            </Form.Group>

            {/* Attachment */}

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

              {attachmentName && (
                <div className="text-muted mt-1">
                  Selected file: {attachmentName}
                </div>
              )}

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
