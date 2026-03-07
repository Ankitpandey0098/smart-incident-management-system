import React, { useState, useEffect } from "react";
import { Card, Form, Button, Alert, Spinner } from "react-bootstrap";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const OTP_EXPIRY_SECONDS = 300; // 5 minutes

const ForgotPassword = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [timer, setTimer] = useState(0);

  // ⏳ Countdown logic
  useEffect(() => {
    if (timer <= 0) return;

    const interval = setInterval(() => {
      setTimer((t) => t - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  const formatTime = () => {
    const min = Math.floor(timer / 60);
    const sec = timer % 60;
    return `${min}:${sec < 10 ? "0" : ""}${sec}`;
  };

  // STEP 1 — Send OTP
  const sendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await axios.post(
        "http://localhost:8000/api/auth/forgot-password/",
        { email }
      );

      setMessage(res.data.message);
      setStep(2);
      setTimer(OTP_EXPIRY_SECONDS);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  // 🔁 Resend OTP
  const resendOtp = async () => {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await axios.post(
        "http://localhost:8000/api/auth/forgot-password/",
        { email }
      );
      setMessage("OTP resent successfully");
      setTimer(OTP_EXPIRY_SECONDS);
    } catch (err) {
      setError("Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  // STEP 2 — Verify OTP
  const verifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await axios.post(
        "http://localhost:8000/api/auth/verify-otp/",
        { email, otp }
      );
      setMessage(res.data.message);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.error || "Invalid or expired OTP");
    } finally {
      setLoading(false);
    }
  };

  // STEP 3 — Reset Password
  const resetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await axios.post(
        "http://localhost:8000/api/auth/reset-password/",
        { email, otp, password }
      );

      setMessage(res.data.message);

      // ✅ Redirect after success
      setTimeout(() => {
        navigate("/login");
      }, 2000);

    } catch (err) {
      setError(err.response?.data?.error || "Password reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-4 shadow-lg mx-auto" style={{ maxWidth: "400px" }}>
      <h4 className="text-center mb-3">Forgot Password</h4>

      {message && <Alert variant="success">{message}</Alert>}
      {error && <Alert variant="danger">{error}</Alert>}

      {/* STEP 1 */}
      {step === 1 && (
        <Form onSubmit={sendOtp}>
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              placeholder="Registered email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Form.Group>

          <Button className="w-100" type="submit" disabled={loading}>
            {loading ? <Spinner size="sm" /> : "Send OTP"}
          </Button>
        </Form>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <Form onSubmit={verifyOtp}>
          <Form.Group className="mb-2">
            <Form.Label>OTP</Form.Label>
            <Form.Control
              type="text"
              placeholder="6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
            />
          </Form.Group>

          <div className="d-flex justify-content-between mb-2">
            <small className="text-muted">
              OTP expires in: <b>{formatTime()}</b>
            </small>

            <Button
              variant="link"
              disabled={timer > 0 || loading}
              onClick={resendOtp}
            >
              Resend OTP
            </Button>
          </div>

          <Button className="w-100" type="submit" disabled={loading}>
            {loading ? <Spinner size="sm" /> : "Verify OTP"}
          </Button>
        </Form>
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <Form onSubmit={resetPassword}>
          <Form.Group className="mb-3">
            <Form.Label>New Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Form.Group>

          <Button className="w-100" type="submit" disabled={loading}>
            {loading ? <Spinner size="sm" /> : "Reset Password"}
          </Button>
        </Form>
      )}
    </Card>
  );
};

export default ForgotPassword;
