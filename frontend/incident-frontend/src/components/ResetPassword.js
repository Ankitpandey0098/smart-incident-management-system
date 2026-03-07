import React, { useState } from "react";
import { Card, Form, Button, Alert, Spinner } from "react-bootstrap";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // 🔹 Get values passed from VerifyOTP (if any)
  const stateEmail = location.state?.email || "";
  const stateOtp = location.state?.otp || "";

  // 🔹 State
  const [email, setEmail] = useState(stateEmail);
  const [otp, setOtp] = useState(stateOtp);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(
        "http://localhost:8000/api/auth/reset-password/",
        {
          email,
          otp,
          password,
        }
      );

      setMessage(res.data.message || "Password reset successful");

      setTimeout(() => {
        navigate("/login");
      }, 2000);

    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Invalid OTP or expired"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-4 shadow-lg mx-auto" style={{ maxWidth: "400px" }}>
      <h4 className="text-center mb-3">Reset Password</h4>

      {message && <Alert variant="success">{message}</Alert>}
      {error && <Alert variant="danger">{error}</Alert>}

      <Form onSubmit={handleSubmit}>
        {/* Email */}
        <Form.Group className="mb-2">
          <Form.Label>Email</Form.Label>
          <Form.Control
            type="email"
            placeholder="Registered email"
            value={email}
            disabled={!!stateEmail}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Form.Group>

        {/* OTP */}
        <Form.Group className="mb-2">
          <Form.Label>OTP</Form.Label>
          <Form.Control
            type="text"
            placeholder="6-digit OTP"
            value={otp}
            disabled={!!stateOtp}
            onChange={(e) => setOtp(e.target.value)}
            required
          />
        </Form.Group>

        {/* New Password */}
        <Form.Group className="mb-2">
          <Form.Label>New Password</Form.Label>
          <Form.Control
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Form.Group>

        {/* Confirm Password */}
        <Form.Group className="mb-3">
          <Form.Label>Confirm Password</Form.Label>
          <Form.Control
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </Form.Group>

        <Button
          type="submit"
          variant="success"
          className="w-100"
          disabled={loading}
        >
          {loading ? <Spinner size="sm" /> : "Reset Password"}
        </Button>
      </Form>
    </Card>
  );
};

export default ResetPassword;
