import React, { useState } from "react";
import { Card, Form, Button, Alert, Spinner } from "react-bootstrap";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const VerifyOTP = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
  const res = await axios.post(
    "https://smart-incident-management-system-chno.onrender.com/api/auth/verify-otp/",
    { email, otp }
  );


      setMessage(res.data.message || "OTP verified successfully");

      // Move to reset password page
      setTimeout(() => {
        navigate("/reset-password", {
          state: { email, otp },
        });
      }, 1500);

    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Invalid or expired OTP"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-4 shadow-lg mx-auto" style={{ maxWidth: "400px" }}>
      <h4 className="text-center mb-3">Verify OTP</h4>

      {message && <Alert variant="success">{message}</Alert>}
      {error && <Alert variant="danger">{error}</Alert>}

      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-2">
          <Form.Label>Email</Form.Label>
          <Form.Control
            type="email"
            placeholder="Registered email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>OTP</Form.Label>
          <Form.Control
            type="text"
            placeholder="6-digit OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
          />
        </Form.Group>

        <Button
          type="submit"
          variant="primary"
          className="w-100"
          disabled={loading}
        >
          {loading ? <Spinner size="sm" /> : "Verify OTP"}
        </Button>
      </Form>
    </Card>
  );
};

export default VerifyOTP;
