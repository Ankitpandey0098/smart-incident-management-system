import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { UserContext } from "../UserContext";


const PrivateRoute = ({ children }) => {

  const { loading } = useContext(UserContext);
  const token = localStorage.getItem("access");

  console.log("PrivateRoute token:", token);
  console.log("PrivateRoute loading:", loading);

  // Wait until authentication check completes
  if (loading) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontSize: "18px",
          fontWeight: "500"
        }}
      >
        Loading...
      </div>
    );
  }

  // If no token, redirect to login
  if (!token || token === "undefined" || token === "null") {
    return <Navigate to="/login" replace />;
  }

  // Otherwise allow access
  return children;
};

export default PrivateRoute;
