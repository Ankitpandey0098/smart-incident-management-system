// src/components/Login.js
import React, { useState } from "react";
import api from "../api/axios";
import { useNavigate, Link } from "react-router-dom";
import { Form, Button, Alert, Card } from "react-bootstrap";
import axios from "axios";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("http://127.0.0.1:8000/api/token/", {
        username,
        password,
      });

      localStorage.setItem("access", response.data.access);
      localStorage.setItem("refresh", response.data.refresh);

      const userResponse = await axios.get(
        "http://127.0.0.1:8000/api/user/",
        {
          headers: { Authorization: `Bearer ${response.data.access}` },
        }
      );

      localStorage.setItem("username", userResponse.data.username);
      localStorage.setItem("user_id", userResponse.data.id);

      navigate("/dashboard");
    } catch (err) {
      setError(err?.response?.data?.detail || "Invalid username or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "rgba(96, 90, 90, 0.45)", // ✅ DARK OVERLAY
        padding: "20px",
        borderRadius: "25px",
      }}
    >
      {/* ✅ SOLID CONTENT CONTAINER */}
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "#ffffff",
          borderRadius: "14px",
          padding: "2.5rem",
          boxShadow: "0 15px 40px rgba(0,0,0,0.25)",
        }}
      >
        <h2
          className="text-center mb-4"
          style={{
            fontWeight: "600",
            color: "#111827",
          }}
        >
          Login to Your Account
        </h2>

        {error && <Alert variant="danger">{error}</Alert>}

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label style={{ fontWeight: "500" }}>
              Username
            </Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label style={{ fontWeight: "500" }}>
              Password
            </Form.Label>
            <Form.Control
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Form.Group>
      


          <Button
            type="submit"
            className="w-100"
            disabled={loading}
            style={{
              padding: "10px",
              fontWeight: "600",
            }}
          >
            {loading ? "Logging in..." : "Login"}
          </Button>
        </Form>
            <div
  className="text-center mt-3"
  style={{ fontSize: "0.9rem" }}
>
  <Link to="/forgot-password">Forgot password?</Link>
</div>

        <div
          className="text-center mt-4"
          style={{ fontSize: "0.95rem", color: "#374151" }}
        >
          Don’t have an account?{" "}
          <Link to="/signup">Sign up</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
