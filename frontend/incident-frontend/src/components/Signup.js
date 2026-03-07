import React, { useState } from "react";
import axios from "axios";
import {
  Form,
  Button,
  Alert,
  Row,
  Col,
  InputGroup,
} from "react-bootstrap";
import { useNavigate, Link } from "react-router-dom";

function Signup() {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    username: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await axios.post(
        "http://127.0.0.1:8000/api/register/",
        form
      );

      if (res.status === 200 || res.status === 201) {
        setSuccess(res.data.message || "Registration successful!");
        setTimeout(() => navigate("/login"), 1500);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed");
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
        background: "rgba(116, 105, 105, 0.45)", // ✅ background protection
        padding: "20px",
        borderRadius: "25px",
      }}
    >
      {/* ✅ SOLID CONTENT BOX */}
      <div
        style={{
          width: "100%",
          maxWidth: "520px",
          background: "#ffffff",
          borderRadius: "14px",
          padding: "2.5rem",
          boxShadow: "0 15px 40px rgba(0,0,0,0.25)",
        }}
      >
        <h2
          className="text-center mb-1"
          style={{ fontWeight: "600", color: "#111827" }}
        >
          Create Account
        </h2>
        <p className="text-center text-muted mb-4">
          Report incidents responsibly
        </p>

        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        <Form onSubmit={handleSignup}>
          <Row>
            <Col md={6} className="mb-3">
              <Form.Label style={{ fontWeight: 500 }}>
                First Name*
              </Form.Label>
              <Form.Control
                name="first_name"
                required
                onChange={handleChange}
              />
            </Col>

            <Col md={6} className="mb-3">
              <Form.Label style={{ fontWeight: 500 }}>
                Last Name*
              </Form.Label>
              <Form.Control
                name="last_name"
                required
                onChange={handleChange}
              />
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label style={{ fontWeight: 500 }}>
              Email*
            </Form.Label>
            <Form.Control
              type="email"
              name="email"
              required
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label style={{ fontWeight: 500 }}>
              Username*
            </Form.Label>
            <Form.Control
              name="username"
              required
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label style={{ fontWeight: 500 }}>
              Password*
            </Form.Label>
            <InputGroup>
              <Form.Control
                type={showPassword ? "text" : "password"}
                name="password"
                required
                onChange={handleChange}
              />
              <Button
                variant="outline-secondary"
                type="button"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide" : "Show"}
              </Button>
            </InputGroup>
          </Form.Group>

          <Button
            type="submit"
            className="w-100"
            disabled={loading}
            style={{
              padding: "10px",
              fontWeight: 600,
            }}
          >
            {loading ? "Creating account..." : "Sign Up"}
          </Button>
        </Form>

        <div
          className="text-center mt-4"
          style={{ fontSize: "0.95rem", color: "#374151" }}
        >
          Already registered?{" "}
          <Link to="/login">Login</Link>
        </div>
      </div>
    </div>
  );
}

export default Signup;
