import { Navigate } from "react-router-dom";
import { useContext } from "react";
import { UserContext } from "../UserContext";

const AuthLoader = () => {

  const { loading } = useContext(UserContext);

  const token = localStorage.getItem("access");
  const role = localStorage.getItem("role");

  // Wait until auth finishes
  if (loading) {
    return null;
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  if (role === "department") {
    return <Navigate to="/department" replace />;
  }

  return <Navigate to="/dashboard" replace />;
};

export default AuthLoader;
