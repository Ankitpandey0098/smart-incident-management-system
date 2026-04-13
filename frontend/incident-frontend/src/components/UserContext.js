// src/UserContext.js

import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

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

    axios
      .get("http://127.0.0.1:8000/api/user/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {

        setUser(res.data);

        localStorage.setItem("role", res.data.role);
        localStorage.setItem("department", res.data.department || "");

      })
      .catch(() => {
        localStorage.clear();
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
