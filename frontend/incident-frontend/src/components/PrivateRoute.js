const token = localStorage.getItem("access");

if (!token) {
  return <Navigate to="/login" replace />;
}

return children;
