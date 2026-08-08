import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProtectedRoute({ children, allow }) {
  const { session } = useAuth();
  if (!session) return <Navigate to="/login" replace />;
  if (allow && !allow.includes(session.role)) return <Navigate to="/" replace />;
  return children;
}
