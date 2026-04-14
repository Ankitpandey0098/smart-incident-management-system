import { Navigate } from "react-router-dom";

const AuthLoader = () => {
  const token = localStorage.getItem("access");
  const role = localStorage.getItem("role");

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
