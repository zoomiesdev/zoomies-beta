import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { PawPrint, Sun, Moon, LogIn, LogOut, Home, Users, ShieldCheck, Heart, Crown, Search, User, ChevronDown } from "lucide-react";
import { useTheme } from "../theme/useTheme";
import { useAuth } from "../contexts/useAuth";
import { Button } from "./ui.jsx";
import ZoomiesLogo from "../assets/ZoomiesLogo.png";
import ZoomiesLogoDark from "../assets/ZoomiesLogoDarkmode.png";

export default function NavBar({ onOpenAuth }) {
  const { theme, toggle } = useTheme();
  const { user, signOut } = useAuth();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();
  
  const handleSignOut = async () => {
    await signOut();
    setProfileDropdownOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div style={{ zIndex: 100 }}>
      <div className="card" style={{ 
        padding: 12,
        backgroundColor: theme === 'dark' ? '#161616' : 'var(--panel)',
        backdropFilter: 'none'
      }}>
        <div className="spread">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <img 
              src={theme === 'dark' ? ZoomiesLogoDark : ZoomiesLogo} 
              alt="Zoomies Logo" 
              style={{ 
                width: "60px", 
                height: "60px", 
                objectFit: "contain"
              }} 
            />
            <strong style={{ 
              color: "#FF6FAE", 
              fontSize: "24px",
              fontFamily: "'Dh Pafigo DEMO', sans-serif"
            }}>zoomies</strong>
          </div>

          <nav style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "center", flex: 1 }}>
            <Link 
              to="/" 
              title="Home"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "10px 14px",
                borderRadius: "12px",
                textDecoration: "none",
                color: location.pathname === "/" ? "#FF6FAE" : "var(--text)",
                position: "relative",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                if (location.pathname !== "/") {
                  e.currentTarget.style.color = "#FF6FAE";
                  e.currentTarget.querySelector('.nav-underline').style.width = "100%";
                }
              }}
              onMouseLeave={(e) => {
                if (location.pathname !== "/") {
                  e.currentTarget.style.color = "var(--text)";
                  e.currentTarget.querySelector('.nav-underline').style.width = "0%";
                }
              }}
            >
              <Home size={18}/>
              <div 
                className="nav-underline"
                style={{
                  position: "absolute",
                  bottom: "0",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: location.pathname === "/" ? "100%" : "0%",
                  height: "2px",
                  background: "#FF6FAE",
                  transition: "width 0.2s ease"
                }} 
              />
            </Link>
            <Link 
              to="/ambassador" 
              title="Ambassador Hub"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "10px 14px",
                borderRadius: "12px",
                textDecoration: "none",
                color: location.pathname === "/ambassador" ? "#FF6FAE" : "var(--text)",
                position: "relative",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                if (location.pathname !== "/ambassador") {
                  e.currentTarget.style.color = "#FF6FAE";
                  e.currentTarget.querySelector('.nav-underline').style.width = "100%";
                }
              }}
              onMouseLeave={(e) => {
                if (location.pathname !== "/ambassador") {
                  e.currentTarget.style.color = "var(--text)";
                  e.currentTarget.querySelector('.nav-underline').style.width = "0%";
                }
              }}
            >
              <PawPrint size={18}/>
              <div 
                className="nav-underline"
                style={{
                  position: "absolute",
                  bottom: "0",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: location.pathname === "/ambassador" ? "100%" : "0%",
                  height: "2px",
                  background: "#FF6FAE",
                  transition: "width 0.2s ease"
                }} 
              />
            </Link>
            <Link 
              to="/community" 
              title="Community"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "10px 14px",
                borderRadius: "12px",
                textDecoration: "none",
                color: location.pathname === "/community" ? "#FF6FAE" : "var(--text)",
                position: "relative",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                if (location.pathname !== "/community") {
                  e.currentTarget.style.color = "#FF6FAE";
                  e.currentTarget.querySelector('.nav-underline').style.width = "100%";
                }
              }}
              onMouseLeave={(e) => {
                if (location.pathname !== "/community") {
                  e.currentTarget.style.color = "var(--text)";
                  e.currentTarget.querySelector('.nav-underline').style.width = "0%";
                }
              }}
            >
              <Users size={18}/>
              <div 
                className="nav-underline"
                style={{
                  position: "absolute",
                  bottom: "0",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: location.pathname === "/community" ? "100%" : "0%",
                  height: "2px",
                  background: "#FF6FAE",
                  transition: "width 0.2s ease"
                }} 
              />
            </Link>
            <Link 
              to="/premium" 
              title="Premium"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "10px 14px",
                borderRadius: "12px",
                textDecoration: "none",
                color: location.pathname === "/premium" ? "#FF6FAE" : "var(--text)",
                position: "relative",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                if (location.pathname !== "/premium") {
                  e.currentTarget.style.color = "#FF6FAE";
                  e.currentTarget.querySelector('.nav-underline').style.width = "100%";
                }
              }}
              onMouseLeave={(e) => {
                if (location.pathname !== "/premium") {
                  e.currentTarget.style.color = "var(--text)";
                  e.currentTarget.querySelector('.nav-underline').style.width = "0%";
                }
              }}
            >
              <Crown size={18}/>
              <div 
                className="nav-underline"
                style={{
                  position: "absolute",
                  bottom: "0",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: location.pathname === "/premium" ? "100%" : "0%",
                  height: "2px",
                  background: "#FF6FAE",
                  transition: "width 0.2s ease"
                }} 
              />
            </Link>
          </nav>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button className="btn btn-ghost" title="Search">
              <Search size={16}/>
            </button>
            <button className="btn btn-ghost" onClick={toggle}>
              {theme === "dark" ? <Sun size={16}/> : <Moon size={16}/>}
              {theme === "dark" ? "Light" : "Dark"}
            </button>
            
            {user ? (
              <div style={{ position: "relative" }} ref={dropdownRef}>
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="btn btn-ghost"
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
                >
                  <div style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: "var(--accent)",
                    display: "grid",
                    placeItems: "center",
                    color: "white",
                    fontSize: "12px",
                    fontWeight: 600
                  }}>
                    {user.user_metadata?.full_name?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span style={{ fontSize: "14px" }}>
                    {user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
                  </span>
                  <ChevronDown size={14} style={{ 
                    transform: profileDropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s"
                  }} />
                </button>

                {/* Profile Dropdown */}
                {profileDropdownOpen && (
                  <div style={{
                    position: "absolute",
                    top: "100%",
                    right: 0,
                    marginTop: 8,
                    background: theme === 'dark' ? '#161616' : 'var(--panel)',
                    border: "1px solid var(--border)",
                    borderRadius: "12px",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                    minWidth: 200,
                    zIndex: 1000
                  }}>
                    <div style={{ padding: "8px 0" }}>
                      <Link
                        to="/profile"
                        onClick={() => setProfileDropdownOpen(false)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          padding: "12px 16px",
                          textDecoration: "none",
                          color: "inherit",
                          transition: "background 0.2s"
                        }}
                      >
                        <User size={16} />
                        View Profile
                      </Link>
                      <div style={{ height: 1, background: "var(--border)", margin: "4px 0" }} />
                      <Link
                        to="/dashboard"
                        onClick={() => setProfileDropdownOpen(false)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          padding: "12px 16px",
                          textDecoration: "none",
                          color: "inherit",
                          transition: "background 0.2s"
                        }}
                      >
                        <Crown size={16} />
                        View Dashboard
                      </Link>
                      <div style={{ height: 1, background: "var(--border)", margin: "4px 0" }} />
                      <button
                        onClick={() => setProfileDropdownOpen(false)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          padding: "12px 16px",
                          width: "100%",
                          border: "none",
                          background: "none",
                          cursor: "pointer",
                          color: "inherit",
                          transition: "background 0.2s"
                        }}
                      >
                        <User size={16} />
                        Edit Profile
                      </button>
                      <div style={{ height: 1, background: "var(--border)", margin: "4px 0" }} />
                      <button
                        onClick={() => setProfileDropdownOpen(false)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          padding: "12px 16px",
                          width: "100%",
                          border: "none",
                          background: "none",
                          cursor: "pointer",
                          color: "inherit",
                          transition: "background 0.2s"
                        }}
                      >
                        <Sun size={16} />
                        Settings
                      </button>
                      <div style={{ height: 1, background: "var(--border)", margin: "4px 0" }} />
                      <button
                        onClick={handleSignOut}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          padding: "12px 16px",
                          width: "100%",
                          border: "none",
                          background: "none",
                          cursor: "pointer",
                          color: "var(--accent)",
                          transition: "background 0.2s"
                        }}
                      >
                        <LogOut size={16} />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Button onClick={onOpenAuth}>
                <LogIn size={16}/> Login / Signup
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
