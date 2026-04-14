import { Navigate } from "react-router-dom";

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("access");

  console.log("PrivateRoute token:", token);

  if (!token || token === "undefined" || token === "null") {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default PrivateRoute;
