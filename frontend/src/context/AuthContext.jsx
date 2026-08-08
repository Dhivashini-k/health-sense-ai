import React, { createContext, useContext, useState } from "react";
import * as api from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    const raw = localStorage.getItem("hs_user");
    return raw ? JSON.parse(raw) : null;
  });

  const login = async (email, password) => {
    const data = await api.login(email, password);
    localStorage.setItem("hs_token", data.access_token);
    const user = { role: data.role, name: data.name, userId: data.user_id };
    localStorage.setItem("hs_user", JSON.stringify(user));
    setSession(user);
    return user;
  };

  const logout = () => {
    localStorage.removeItem("hs_token");
    localStorage.removeItem("hs_user");
    setSession(null);
  };

  return <AuthContext.Provider value={{ session, login, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
