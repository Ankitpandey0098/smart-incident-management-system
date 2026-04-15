import React, { createContext, useState, useEffect } from "react";
import api from "./api/axios";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const token = localStorage.getItem("access");

    if (!token) {
      setLoading(false);
      return;
    }

    api.get("user/", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {

        setUser(res.data);

        localStorage.setItem("role", res.data.role);
        localStorage.setItem("department", res.data.department || "");

      })
      .catch((err) => {

        console.error("User fetch error:", err);

        if (err.response?.status === 401) {
          localStorage.removeItem("access");
          localStorage.removeItem("refresh");
          setUser(null);
        }

      })
      .finally(() => {
        setLoading(false);
      });

  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, loading }}>
      {children}
    </UserContext.Provider>
  );
};
