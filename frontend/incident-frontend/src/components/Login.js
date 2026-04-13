import React, { useState } from "react";
import axios from "axios";
import {
  Form,
  Button,
  Alert,
  InputGroup
} from "react-bootstrap";
import api from "../api/axios";

import { useNavigate, Link } from "react-router-dom";

function Login() {

  const [form, setForm] = useState({
    username: "",
    password: ""
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleLogin = async (e) => {

    e.preventDefault();
    setError("");
    setLoading(true);

    try {

      const res = await api.post("/login/", form);


      // Save tokens
      localStorage.setItem("access", res.data.access);
      localStorage.setItem("refresh", res.data.refresh);

      // Get user info
      const user = await api.get("/user/", {
  headers: {
    Authorization: `Bearer ${res.data.access}`
  }
});


      // Save role + department
      localStorage.setItem("role", user.data.role);
      localStorage.setItem("department", user.data.department || "");

      // Redirect based on role
      console.log("User Role:", user.data.role);
      console.log("Department:", user.data.department);

      const role = user.data.role?.toLowerCase();

      if (role === "admin") {
        navigate("/admin");
      }
      else if (role === "department") {
        navigate("/department");
      }
      else {
        navigate("/dashboard");
      }


    } catch (err) {

      setError(
        err.response?.data?.detail ||
        "Invalid username or password"
      );

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
        background: "rgba(116, 105, 105, 0.45)",
        padding: "20px",
        borderRadius: "25px"
      }}
    >

      <div
        style={{
          width: "100%",
          maxWidth: "450px",
          background: "#ffffff",
          borderRadius: "14px",
          padding: "2.5rem",
          boxShadow: "0 15px 40px rgba(0,0,0,0.25)"
        }}
      >

        <h2
          className="text-center mb-1"
          style={{ fontWeight: "600", color: "#111827" }}
        >
          Login
        </h2>

        <p className="text-center text-muted mb-4">
          Incident Management Platform
        </p>

        {error && <Alert variant="danger">{error}</Alert>}

        <Form onSubmit={handleLogin}>

          <Form.Group className="mb-3">
            <Form.Label>Username</Form.Label>
            <Form.Control
              name="username"
              required
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label>Password</Form.Label>

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
                onClick={() =>
                  setShowPassword(!showPassword)
                }
              >
                {showPassword ? "Hide" : "Show"}
              </Button>

            </InputGroup>

          </Form.Group>

          <Button
            type="submit"
            className="w-100"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </Button>

        </Form>
              <div className="text-center mt-3">
  <Link to="/forgot-password">
    Forgot Password?
  </Link>
</div>

        <div
          className="text-center mt-4"
          style={{ fontSize: "0.95rem" }}
        >
          Don't have an account?{" "}
          <Link to="/signup">
            Register
          </Link>
        </div>

      </div>

    </div>

  );
}

export default Login;
