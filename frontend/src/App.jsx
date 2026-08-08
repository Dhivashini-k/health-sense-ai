import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Login from "./pages/Login.jsx";
import Layout from "./components/Layout.jsx";
import NurseDashboard from "./pages/nurse/NurseDashboard.jsx";
import PatientsPage from "./pages/nurse/PatientsPage.jsx";
import ScreeningWizard from "./pages/nurse/ScreeningWizard.jsx";
import ArchivePage from "./pages/nurse/ArchivePage.jsx";
import SpecialistDashboard from "./pages/specialist/SpecialistDashboard.jsx";
import ReferralsPage from "./pages/specialist/ReferralsPage.jsx";
import LabTestsPage from "./pages/LabTestsPage.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import { ROLE_DISEASES } from "./constants.js";

const SPECIALIST_ROLES = Object.keys(ROLE_DISEASES);

export default function App() {
  const { session } = useAuth();
  return (
    <Routes>
      <Route
  path="/login"
  element={
    session ? <Navigate to="/" replace /> : <Login />
  }
/>

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<RoleHome />} />
        <Route path="patients" element={<ProtectedRoute allow={["Nurse"]}><PatientsPage /></ProtectedRoute>} />
        <Route path="screening" element={<ProtectedRoute allow={["Nurse"]}><ScreeningWizard /></ProtectedRoute>} />
        <Route path="archive" element={<ProtectedRoute allow={["Nurse"]}><ArchivePage /></ProtectedRoute>} />
        <Route path="referrals" element={<ProtectedRoute allow={SPECIALIST_ROLES}><ReferralsPage /></ProtectedRoute>} />
        <Route path="labs" element={<ProtectedRoute allow={["Nurse", ...SPECIALIST_ROLES]}><LabTestsPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

function RoleHome() {
  const { session } = useAuth();

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (session.role === "Nurse") {
    return <NurseDashboard />;
  }

  if (session.role === "Super Admin") {
    return <AdminDashboard />;
  }

  if (SPECIALIST_ROLES.includes(session.role)) {
    return <SpecialistDashboard />;
  }

  return <Navigate to="/login" replace />;
}
