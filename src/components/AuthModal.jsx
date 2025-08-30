import React, { useState } from "react";
import { Card, Button, Input } from "./ui.jsx";
import { useAuth } from "../contexts/useAuth";
import { useTheme } from "../theme/useTheme";
import { supabase } from "../lib/supabase.js";

export default function AuthModal({ open, onClose }) {
  const { theme } = useTheme();
  const [isLogin, setIsLogin] = useState(false);
  const [formData, setFormData] = useState({
    userType: "individual", // "individual" or "organization"
    fullName: "",
    organizationName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const { signIn, signUp } = useAuth();

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (isLogin) {
        // Sign in
        const { error } = await signIn(formData.email, formData.password);
        if (error) {
          setError(error);
        } else {
          setMessage("Successfully signed in!");
          setTimeout(() => {
            onClose();
            setFormData({ userType: "individual", fullName: "", organizationName: "", username: "", email: "", password: "", confirmPassword: "" });
            setError("");
            setMessage("");
          }, 1000);
        }
      } else {
        // Sign up
        if (formData.password !== formData.confirmPassword) {
          setError("Passwords don't match");
          setLoading(false);
          return;
        }

        // Check name field based on user type
        const nameField = formData.userType === "individual" ? formData.fullName : formData.organizationName;
        const nameFieldLabel = formData.userType === "individual" ? "Full name" : "Organization name";
        
        if (!nameField.trim()) {
          setError(`${nameFieldLabel} is required`);
          setLoading(false);
          return;
        }

        if (nameField.trim().length > 100) {
          setError(`${nameFieldLabel} must be less than 100 characters`);
          setLoading(false);
          return;
        }

        if (!formData.email.trim()) {
          setError("Email is required");
          setLoading(false);
          return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
          setError("Please enter a valid email address");
          setLoading(false);
          return;
        }

        if (formData.password.length < 6) {
          setError("Password must be at least 6 characters");
          setLoading(false);
          return;
        }

        if (formData.password.length > 128) {
          setError("Password must be less than 128 characters");
          setLoading(false);
          return;
        }

        if (!formData.username.trim()) {
          setError("Username is required");
          setLoading(false);
          return;
        }

        // Trim whitespace from username
        const trimmedUsername = formData.username.trim();
        if (trimmedUsername !== formData.username) {
          setFormData(prev => ({ ...prev, username: trimmedUsername }));
        }

        if (trimmedUsername.length < 3) {
          setError("Username must be at least 3 characters");
          setLoading(false);
          return;
        }

        if (trimmedUsername.length > 30) {
          setError("Username must be less than 30 characters");
          setLoading(false);
          return;
        }

        if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
          setError("Username can only contain letters, numbers, and underscores");
          setLoading(false);
          return;
        }

        if (/^\d/.test(trimmedUsername)) {
          setError("Username cannot start with a number");
          setLoading(false);
          return;
        }

        // Check for reserved/useless usernames
        const reservedUsernames = ['admin', 'root', 'user', 'test', 'demo', 'guest', 'anonymous', 'unknown'];
        if (reservedUsernames.includes(trimmedUsername.toLowerCase())) {
          setError("Username is not available. Please choose a different one.");
          setLoading(false);
          return;
        }

        // Check username uniqueness before signup
        try {
          const { data: existingUser, error: checkError } = await supabase
            .from('user_profiles')
            .select('username')
            .eq('username', trimmedUsername)
            .single();

          if (existingUser) {
            setError("Username is already taken. Please choose a different one.");
            setLoading(false);
            return;
          }

          if (checkError && checkError.code !== 'PGRST116') {
            // PGRST116 = no rows returned (username is available)
            console.warn('Username check error (non-critical):', checkError);
            // Continue with signup even if check fails
          }
        } catch (err) {
          console.warn('Username uniqueness check failed (non-critical):', err);
          // Continue with signup even if check fails
        }

        const { error } = await signUp(formData.email, formData.password, {
          full_name: formData.userType === "individual" ? formData.fullName : formData.organizationName,
          user_type: formData.userType
        }, trimmedUsername);

        if (error) {
          setError(error);
        } else {
          setMessage("Check your email to confirm your account!");
          setTimeout(() => {
            onClose();
            setFormData({ userType: "individual", fullName: "", organizationName: "", username: "", email: "", password: "", confirmPassword: "" });
            setError("");
            setMessage("");
          }, 3000);
        }
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleUserTypeChange = (userType) => {
    setFormData(prev => ({ 
      ...prev, 
      userType,
      // Clear name fields when switching types
      fullName: "",
      organizationName: ""
    }));
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError("");
    setMessage("");
    setFormData({ userType: "individual", fullName: "", organizationName: "", username: "", email: "", password: "", confirmPassword: "" });
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "grid", placeItems: "center", zIndex: 60 }} onClick={onClose}>
      <Card className="center" style={{ 
        width: "min(560px, 92vw)", 
        padding: 24,
        backgroundColor: theme === 'dark' ? '#161616' : 'var(--panel)',
        backdropFilter: 'none'
      }} onClick={e=>e.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>Welcome to Zoomies</h3>
        <p className="muted" style={{ marginTop: 0 }}>
          {isLogin ? "Sign in to your account" : "Create your account to start helping animals"}
        </p>

        {error && (
          <div style={{ 
            background: "rgba(239, 68, 68, 0.1)", 
            color: "#dc2626", 
            padding: "12px", 
            borderRadius: "8px", 
            marginBottom: "16px",
            border: "1px solid rgba(239, 68, 68, 0.2)"
          }}>
            {error}
          </div>
        )}

        {message && (
          <div style={{ 
            background: "rgba(34, 197, 94, 0.1)", 
            color: "#16a34a", 
            padding: "12px", 
            borderRadius: "8px", 
            marginBottom: "16px",
            border: "1px solid rgba(34, 197, 94, 0.2)"
          }}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ width: "100%", display: "grid", gap: 10, marginTop: 10 }}>
          {!isLogin && (
            <>
              {/* User Type Selection */}
              <div style={{ marginBottom: "8px" }}>
                <label style={{ 
                  display: "block", 
                  marginBottom: "8px", 
                  fontWeight: 500,
                  fontSize: "14px"
                }}>
                  I am a:
                </label>
                <div style={{ display: "flex", gap: "8" }}>
                  <button
                    type="button"
                    onClick={() => handleUserTypeChange("individual")}
                    style={{
                      flex: 1,
                      padding: "12px 16px",
                      border: `2px solid ${formData.userType === "individual" ? "var(--accent)" : "var(--border)"}`,
                      borderRadius: "8px",
                      background: formData.userType === "individual" ? "var(--accent)" : "transparent",
                      color: formData.userType === "individual" ? "white" : "var(--text)",
                      cursor: "pointer",
                      transition: "all 0.2s ease"
                    }}
                  >
                    Individual
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUserTypeChange("organization")}
                    style={{
                      flex: 1,
                      padding: "12px 16px",
                      border: `2px solid ${formData.userType === "organization" ? "var(--accent)" : "var(--border)"}`,
                      borderRadius: "8px",
                      background: formData.userType === "organization" ? "var(--accent)" : "transparent",
                      color: formData.userType === "organization" ? "white" : "var(--text)",
                      cursor: "pointer",
                      transition: "all 0.2s ease"
                    }}
                  >
                    Organization
                  </button>
                </div>
              </div>

              {/* Name Field - Dynamic based on user type */}
              <Input 
                placeholder={formData.userType === "individual" ? "Full name" : "Organization name"} 
                name={formData.userType === "individual" ? "fullName" : "organizationName"}
                value={formData.userType === "individual" ? formData.fullName : formData.organizationName}
                onChange={handleInputChange}
                required={!isLogin}
              />
              <div style={{ 
                fontSize: "12px", 
                color: "var(--muted)", 
                marginTop: "-8px",
                lineHeight: "1.4"
              }}>
                {formData.userType === "individual" 
                  ? "This will be displayed on your profile." 
                  : "This will be displayed on your organization profile and animal ambassador pages."
                }
              </div>
            </>
          )}
          {!isLogin && (
            <>
              <Input 
                placeholder="Username (letters, numbers, underscores only)" 
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                required={!isLogin}
              />
              <div style={{ 
                fontSize: "12px", 
                color: "var(--muted)", 
                marginTop: "-8px",
                lineHeight: "1.4"
              }}>
                Username must be 3-30 characters, start with a letter, and be unique.
              </div>
            </>
          )}
          <Input 
            placeholder="Email" 
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
          />
          <Input 
            placeholder="Password" 
            type="password" 
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            required
          />
          {!isLogin && (
            <Input 
              placeholder="Confirm password" 
              type="password" 
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              required={!isLogin}
            />
          )}
          
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <Button type="submit" disabled={loading}>
              {loading ? "Loading..." : (isLogin ? "Sign in" : "Sign up")}
            </Button>
            <Button type="button" variant="outline" onClick={toggleMode}>
              {isLogin ? "Create account" : "Sign in instead"}
            </Button>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
