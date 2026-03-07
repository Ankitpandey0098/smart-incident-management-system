// src/components/Footer.js
import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer
      style={{
        backgroundColor: "#0f172a", // deep navy
        color: "#e5e7eb",
      }}
      className="pt-5 pb-4 mt-5"
    >
      <Container>
        <Row className="gy-4">
          {/* ===== BRAND ===== */}
          <Col md={4}>
            <h5 className="fw-bold text-white mb-3">
              Incident Platform
            </h5>
            <p style={{ color: "#cbd5f5", fontSize: "0.9rem", lineHeight: 1.6 }}>
              A centralized platform for reporting, tracking, and resolving
              incidents in real-time. Designed to assist citizens and
              authorities with faster response and transparency.
            </p>
          </Col>

          {/* ===== QUICK LINKS ===== */}
          <Col md={4}>
            <h6 className="fw-semibold text-white mb-3">
              Quick Links
            </h6>
            <ul className="list-unstyled" style={{ fontSize: "0.9rem" }}>
              <li className="mb-2">
                <Link to="/" className="footer-link">
                  Home
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/about" className="footer-link">
                  About Us
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/contact" className="footer-link">
                  Contact
                </Link>
              </li>
            </ul>
          </Col>

          {/* ===== CONTACT ===== */}
          <Col md={4}>
            <h6 className="fw-semibold text-white mb-3">
              Contact
            </h6>
            <p className="mb-2 footer-text">📧 support@incidentplatform.com</p>
            <p className="mb-2 footer-text">📞 +91 8630435665</p>
            <p className="mb-0 footer-text">
              📍 112, Tech Street, Delhi NCR, India
            </p>
          </Col>
        </Row>

        {/* ===== DIVIDER ===== */}
        <hr
          style={{
            borderColor: "#334155",
            margin: "2rem 0",
          }}
        />

        {/* ===== COPYRIGHT ===== */}
        <p
          className="text-center mb-0"
          style={{ fontSize: "0.85rem", color: "#cbd5f5" }}
        >
          © {new Date().getFullYear()} Incident Platform. All rights reserved.
        </p>
      </Container>

      {/* ===== FOOTER STYLES ===== */}
      <style>{`
        .footer-link {
          color: #e5e7eb;
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .footer-link:hover {
          color: #60a5fa;
        }

        .footer-text {
          color: #e5e7eb;
          font-size: 0.9rem;
        }
      `}</style>
    </footer>
  );
};

export default Footer;
