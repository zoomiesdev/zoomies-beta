import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import NavBar from "./components/NavBar.jsx";
import AuthModal from "./components/AuthModal.jsx";
import HomePage from "./pages/HomePage.jsx";
import CommunityPage from "./pages/CommunityPage.jsx";
import AmbassadorHubPage from "./pages/AmbassadorHubPage.jsx";
import AnimalProfilePage from "./pages/AnimalProfilePage.jsx";
import PremiumPage from "./pages/PremiumPage.jsx";
import UserProfilePage from "./pages/UserProfilePage.jsx";
import PublicProfilePage from "./pages/PublicProfilePage.jsx";
import OrganizationDashboard from "./pages/OrganizationDashboard.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";

function AppContent() {
  const [authOpen, setAuthOpen] = useState(false);
  
  const handleCloseAuth = () => {
    setAuthOpen(false);
  };
  
  return (
    <>
      <div className="container">
        <NavBar onOpenAuth={() => setAuthOpen(true)} />
        <Routes>
          <Route path="/" element={<HomePage/>} />
          <Route path="/community" element={<CommunityPage onOpenAuth={() => setAuthOpen(true)}/>} />
          <Route path="/ambassador" element={<AmbassadorHubPage/>} />
          <Route path="/animal/:id" element={<AnimalProfilePage/>} />
          <Route path="/animal/:id/*" element={<AnimalProfilePage/>} />
          <Route path="/premium" element={<PremiumPage/>} />
          <Route path="/profile" element={<UserProfilePage/>} />
          <Route path="/profile/:userId" element={<PublicProfilePage/>} />
          <Route path="/dashboard" element={<OrganizationDashboard/>} />
          <Route path="/settings" element={<SettingsPage/>} />
        </Routes>
        <footer className="muted" style={{ textAlign:"center", padding:"40px 0", fontSize:12 }}>
          © {new Date().getFullYear()} Zoomies • Terms • Privacy
        </footer>
      </div>
      <AuthModal open={authOpen} onClose={handleCloseAuth} />
    </>
  );
}

export default function App(){
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
