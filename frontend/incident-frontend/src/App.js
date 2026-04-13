import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Container } from "react-bootstrap";

import ScrollToTop from "./components/ScrollToTop";
import Signup from "./components/Signup";
import Login from "./components/Login";
import IncidentList from "./components/IncidentList";
import ReportIncident from "./components/ReportIncident";
import EditIncident from "./components/EditIncident";
import About from "./components/About";
import Contact from "./components/Contact";
import Profile from "./components/Profile";
import PrivateRoute from "./components/PrivateRoute";
import Footer from "./components/Footer";
import NavigationBar from "./components/NavigationBar";

import { UserProvider } from "./UserContext";
import "./App.css";
import AdminDashboard from "./components/AdminDashboard";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";
import VerifyOTP from "./components/VerifyOTP";
import IncidentMap from "./components/IncidentMap";
import DepartmentDashboard from "./components/DepartmentDashboard";
import IncidentStatistics from "./components/IncidentCharts";

/* 🔹 BACKGROUND IMAGES */
const BACKGROUNDS = [
  "/bg/bg1.webp",
  "/bg/bg2.jpeg",
  "/bg/bg3.jpeg",
  "/bg/bg4.jpeg",
  "/bg/bg5.jpeg",
];

function App() {
  const isLoggedIn = !!localStorage.getItem("access");
  const role = localStorage.getItem("role");

  const [bgIndex, setBgIndex] = useState(0);

  /* 🔹 CHANGE BACKGROUND EVERY 5 SECONDS */
  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % BACKGROUNDS.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <UserProvider>
      <div
        className="global-bg"
        style={{ backgroundImage: `url(${BACKGROUNDS[bgIndex]})` }}
      >
        <Router>
          <ScrollToTop />
          <NavigationBar />

          {/* 🔹 CONTENT LAYER */}
          <div className="content-layer">
            <Container>
              <Routes>
                {/* Public */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/map" element={<IncidentMap />} />
               <Route 
  path="/incident-statistics" 
  element={<IncidentStatistics />} 
/>


                {/* Protected */}
                <Route
                  path="/dashboard"
                  element={
                    <PrivateRoute>
                      <IncidentList />
                    </PrivateRoute>
                  }
                />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/verify-otp" element={<VerifyOTP />} />

                <Route
                  path="/report"
                  element={
                    <PrivateRoute>
                      <ReportIncident />
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/edit/:id"
                  element={
                    <PrivateRoute>
                      <EditIncident />
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/profile"
                  element={
                    <PrivateRoute>
                      <Profile />
                    </PrivateRoute>
                  }
                />

                {/* Default */}
                <Route
                  path="/"
                  element={
                    isLoggedIn ? (
                      role === "admin" ? (
                        <Navigate to="/admin" replace />
                      ) : role === "department" ? (
                        <Navigate to="/department" replace />
                      ) : (
                        <Navigate to="/dashboard" replace />
                      )
                    ) : (
                      <Navigate to="/login" replace />
                    )
                  }
                />

                <Route
                  path="/department"
                  element={
                    <PrivateRoute>
                      <DepartmentDashboard />
                    </PrivateRoute>
                  }
                />


                <Route path="*" element={<div>Page not found</div>} />
              </Routes>
            </Container>
          </div>

          <Footer />
        </Router>
      </div>
    </UserProvider>
  );
}

export default App;
