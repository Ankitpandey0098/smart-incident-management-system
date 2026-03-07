// src/pages/About.js
import React from "react";
import { Container, Row, Col, Card, Badge, ProgressBar } from "react-bootstrap";

const About = () => {
  return (
    <Container style={{ padding: "40px 20px", minHeight: "100vh" }}>
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <h1 className="fw-bold text-primary">About This Platform</h1>
          <p className="text-muted fs-5">
            This Incident Management Platform is designed to help users report, track, and manage
            various types of incidents efficiently. It allows authorities and emergency services
            to respond quickly while providing analytics for better decision-making.
          </p>
        </Col>
      </Row>

      {/* Objectives */}
      <Row className="mb-5">
        <Col md={6}>
          <Card className="shadow-sm p-4 h-100">
            <Card.Title className="fw-bold mb-3">Objectives</Card.Title>
            <ul>
              <li>Enable users to report incidents like accidents, floods, fires, and cyber crimes.</li>
              <li>Provide real-time updates to administrators and emergency services.</li>
              <li>Maintain a detailed activity timeline for each incident.</li>
              <li>Generate statistics and visualizations for better analysis.</li>
            </ul>
          </Card>
        </Col>

        {/* Features */}
        <Col md={6}>
          <Card className="shadow-sm p-4 h-100">
            <Card.Title className="fw-bold mb-3">Key Features</Card.Title>
            <ul>
              <li>User authentication and role-based access control.</li>
              <li>Admin dashboard with category and status management.</li>
              <li>Automated incident classification with confidence scores.</li>
              <li>Real-time incident updates with polling.</li>
              <li>Attachment support for images and documents.</li>
              <li>Search and filter functionality by category, status, and reporter.</li>
              <li>Visual analytics through charts and progress bars.</li>
            </ul>
          </Card>
        </Col>
      </Row>

      {/* Technology Stack */}
      <Row className="mb-5">
        <Col>
          <Card className="shadow-sm p-4">
            <Card.Title className="fw-bold mb-3">Technology Stack</Card.Title>
            <Row>
              <Col md={4}>
                <h6>Frontend</h6>
                <ul>
                  <li>React.js</li>
                  <li>Bootstrap 5 / React-Bootstrap</li>
                  <li>Axios for API calls</li>
                </ul>
              </Col>
              <Col md={4}>
                <h6>Backend</h6>
                <ul>
                  <li>Django & Django REST Framework</li>
                  <li>JWT Authentication</li>
                  <li>SQLite / PostgreSQL</li>
                </ul>
              </Col>
              <Col md={4}>
                <h6>Other Tools</h6>
                <ul>
                  <li>Day.js for timestamps</li>
                  <li>Google Drive API for file uploads</li>
                  <li>Charts.js / React Charts for analytics</li>
                </ul>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Call to Action */}
      <Row className="mb-5">
        <Col>
          <Card className="shadow-sm p-4 text-center">
            <Card.Title className="fw-bold mb-3">Get Started</Card.Title>
            <p className="text-muted fs-5">
              Users can register to report incidents, while admins can manage incident categories,
              statuses, and view analytics to make informed decisions.
            </p>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default About;
