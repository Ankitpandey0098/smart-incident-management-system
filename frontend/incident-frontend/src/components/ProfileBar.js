import React, { useEffect, useState, useContext } from "react";
import { Dropdown, Image, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../UserContext";

const ProfileBar = () => {
  const { user, setUser } = useContext(UserContext);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const token = localStorage.getItem("access");

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    fetchUser();
    // eslint-disable-next-line
  }, []);

  const fetchUser = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/profile/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setUser(data);
      setLoading(false);
    } catch (err) {
      handleLogout();
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    navigate("/login");
  };

  if (loading)
    return <Spinner animation="border" size="sm" className="me-2" />;

  return (
    <Dropdown align="end">
      <Dropdown.Toggle
        variant="light"
        size="sm"
        className="profile-toggle d-flex align-items-center"
      >
        {user?.profile_image ? (
          <Image
            src={user.profile_image}
            roundedCircle
            className="me-2"
            style={{ width: 34, height: 34, objectFit: "cover" }}
          />
        ) : (
          <div className="avatar-fallback me-2">
            {user?.username?.charAt(0).toUpperCase()}
          </div>
        )}

        <div className="text-start">
          <div className="fw-semibold small">{user?.username}</div>
          <div className="text-muted role-text">
            {user?.role || "Member"}
          </div>
        </div>
      </Dropdown.Toggle>

      <Dropdown.Menu className="profile-dropdown shadow border-0">
        <div className="px-3 py-2">
          <div className="fw-semibold">{user?.username}</div>
          <div className="text-muted small">{user?.email}</div>
        </div>

        <Dropdown.Divider />

        <Dropdown.Item onClick={() => navigate("/profile")}>
          👤 View Profile
        </Dropdown.Item>

        <Dropdown.Item onClick={handleLogout} className="text-danger">
          🚪 Logout
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default ProfileBar;
