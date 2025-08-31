import React, { useState, useEffect } from "react";
import { Card, Button, Input } from "../components/ui.jsx";
import { useAuth } from "../contexts/useAuth";
import { supabase } from "../lib/supabase.js";
import { 
  Bell, 
  Shield, 
  Trash2, 
  Save, 
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  User
} from "lucide-react";

export default function SettingsPage() {
  const { user, signOut, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("account");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  
  // Account settings state
  const [accountForm, setAccountForm] = useState({
    email: "",
    username: "",
    fullName: ""
  });
  
  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [showPasswords, setShowPasswords] = useState(false);
  
  // Notification settings state
  const [notifications, setNotifications] = useState({
    emailUpdates: true,
    emailMarketing: false,
    emailMilestones: true,
    pushNotifications: true
  });
  
  // Danger zone state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");

  // Load user profile data
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user) return;
      
      try {
        // Update email in form when user loads
        setAccountForm(prev => ({
          ...prev,
          email: user.email || ""
        }));
        
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('username, full_name')
          .eq('user_id', user.id)
          .single();
        
        if (profile && !error) {
          setAccountForm(prev => ({
            ...prev,
            username: profile.username || "",
            fullName: profile.full_name || ""
          }));
        }
      } catch (err) {
        console.error('Error loading user profile:', err);
      }
    };
    
    loadUserProfile();
  }, [user]);

  const handleAccountUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    
    try {
      // Update email if changed
      if (accountForm.email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: accountForm.email
        });
        
        if (emailError) {
          setError(`Email update failed: ${emailError.message}`);
          setLoading(false);
          return;
        }
        
        setMessage("Email update initiated. Please check your email to confirm the change.");
      }
      
      // Update profile if username or full name changed
      if (accountForm.username || accountForm.fullName) {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .upsert({
            user_id: user.id,
            username: accountForm.username,
            full_name: accountForm.fullName
          });
        
        if (profileError) {
          setError(`Profile update failed: ${profileError.message}`);
          setLoading(false);
          return;
        }
      }
      
      setMessage("Account settings updated successfully!");
    } catch (err) {
      setError("An unexpected error occurred while updating account settings.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("New passwords don't match");
      setLoading(false);
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      setError("New password must be at least 6 characters");
      setLoading(false);
      return;
    }
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });
      
      if (error) {
        setError(`Password update failed: ${error.message}`);
      } else {
        setMessage("Password updated successfully!");
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        });
      }
    } catch (err) {
      setError("An unexpected error occurred while updating password.");
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationChange = async (key, value) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
    
    // Here you would typically save to database
    // For now, just update local state
    setMessage("Notification settings updated!");
    setTimeout(() => setMessage(""), 3000);
  };

  const handleAccountDeletion = async () => {
    if (deletePassword !== "DELETE") {
      setError("Please type DELETE to confirm account deletion");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      // Delete user profile first
      const { error: profileError } = await supabase
        .from('user_profiles')
        .delete()
        .eq('user_id', user.id);
      
      if (profileError) {
        console.error('Error deleting profile:', profileError);
      }
      
      // Delete user account - note: this requires admin privileges
      // For now, we'll just sign out the user and show a message
      // In production, you'd need a backend endpoint or admin function
      console.log('Account deletion requested for user:', user.id);
      setMessage("Account deletion requested. Please contact support to complete this process.");
    } catch (err) {
      setError("An unexpected error occurred while deleting account.");
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "account", label: "Account", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "privacy", label: "Privacy & Security", icon: Shield }
  ];
  
  // Show loading state while auth is initializing
  if (authLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '50vh',
        fontSize: '18px',
        color: 'var(--text-muted)'
      }}>
        Loading settings...
      </div>
    );
  }
  
  // Redirect if not logged in
  if (!user) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '50vh',
        fontSize: '18px',
        color: 'var(--text-muted)'
      }}>
        Please log in to access settings.
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: "80px" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <h1 style={{ marginBottom: "24px" }}>Settings</h1>
        
        {/* Tabs */}
        <div style={{ display: "flex", gap: "2px", marginBottom: "24px" }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  border: "none",
                  background: activeTab === tab.id ? "var(--accent)" : "var(--panel)",
                  color: activeTab === tab.id ? "white" : "var(--text)",
                  borderRadius: "8px 8px 0 0",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  transition: "all 0.2s ease"
                }}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Messages */}
        {message && (
          <Card style={{ 
            padding: "12px 16px", 
            marginBottom: "16px",
            background: "rgba(34, 197, 94, 0.1)", 
            border: "1px solid rgba(34, 197, 94, 0.2)",
            color: "#16a34a"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <CheckCircle size={16} />
              {message}
            </div>
          </Card>
        )}

        {error && (
          <Card style={{ 
            padding: "12px 16px", 
            marginBottom: "16px",
            background: "rgba(239, 68, 68, 0.1)", 
            border: "1px solid rgba(239, 68, 68, 0.2)",
            color: "#dc2626"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <AlertTriangle size={16} />
              {error}
            </div>
          </Card>
        )}

        {/* Account Tab */}
        {activeTab === "account" && (
          <div style={{ display: "grid", gap: "24px" }}>
            {/* Account Information */}
            <Card style={{ padding: "24px" }}>
              <h3 style={{ marginTop: 0, marginBottom: "16px" }}>Account Information</h3>
              <form onSubmit={handleAccountUpdate} style={{ display: "grid", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
                    Email Address
                  </label>
                  <Input
                    type="email"
                    value={accountForm.email}
                    onChange={(e) => setAccountForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter your email"
                  />
                </div>
                
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
                    Username
                  </label>
                  <Input
                    value={accountForm.username}
                    onChange={(e) => setAccountForm(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="Enter your username"
                  />
                </div>
                
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
                    Full Name
                  </label>
                  <Input
                    value={accountForm.fullName}
                    onChange={(e) => setAccountForm(prev => ({ ...prev, fullName: e.target.value }))}
                    placeholder="Enter your full name"
                  />
                </div>
                
                <Button type="submit" disabled={loading}>
                  <Save size={16} style={{ marginRight: "8px" }} />
                  {loading ? "Updating..." : "Update Account"}
                </Button>
              </form>
            </Card>

            {/* Change Password */}
            <Card style={{ padding: "24px" }}>
              <h3 style={{ marginTop: 0, marginBottom: "16px" }}>Change Password</h3>
              <form onSubmit={handlePasswordChange} style={{ display: "grid", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
                    New Password
                  </label>
                  <div style={{ position: "relative" }}>
                    <Input
                      type={showPasswords ? "text" : "password"}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(!showPasswords)}
                      style={{
                        position: "absolute",
                        right: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--muted)"
                      }}
                    >
                      {showPasswords ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
                    Confirm New Password
                  </label>
                  <Input
                    type={showPasswords ? "text" : "password"}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Confirm new password"
                  />
                </div>
                
                <Button type="submit" disabled={loading}>
                  {loading ? "Updating..." : "Change Password"}
                </Button>
              </form>
            </Card>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === "notifications" && (
          <Card style={{ padding: "24px" }}>
            <h3 style={{ marginTop: 0, marginBottom: "16px" }}>Notification Preferences</h3>
            <div style={{ display: "grid", gap: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontWeight: "500" }}>Email Updates</div>
                  <div style={{ fontSize: "14px", color: "var(--muted)" }}>
                    Receive updates about your account and important changes
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.emailUpdates}
                  onChange={(e) => handleNotificationChange("emailUpdates", e.target.checked)}
                  style={{ width: "20px", height: "20px" }}
                />
              </div>
              
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontWeight: "500" }}>Email Marketing</div>
                  <div style={{ fontSize: "14px", color: "var(--muted)" }}>
                    Receive promotional emails and special offers
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.emailMarketing}
                  onChange={(e) => handleNotificationChange("emailMarketing", e.target.checked)}
                  style={{ width: "20px", height: "20px" }}
                />
              </div>
              
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontWeight: "500" }}>Milestone Notifications</div>
                  <div style={{ fontSize: "14px", color: "var(--muted)" }}>
                    Get notified when animals reach fundraising milestones
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.emailMilestones}
                  onChange={(e) => handleNotificationChange("emailMilestones", e.target.checked)}
                  style={{ width: "20px", height: "20px" }}
                />
              </div>
              
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontWeight: "500" }}>Push Notifications</div>
                  <div style={{ fontSize: "14px", color: "var(--muted)" }}>
                    Receive push notifications in your browser
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.pushNotifications}
                  onChange={(e) => handleNotificationChange("pushNotifications", e.target.checked)}
                  style={{ width: "20px", height: "20px" }}
                />
              </div>
            </div>
          </Card>
        )}

        {/* Privacy & Security Tab */}
        {activeTab === "privacy" && (
          <div style={{ display: "grid", gap: "24px" }}>
            {/* Privacy Settings */}
            <Card style={{ padding: "24px" }}>
              <h3 style={{ marginTop: 0, marginBottom: "16px" }}>Privacy Settings</h3>
              <div style={{ display: "grid", gap: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontWeight: "500" }}>Public Profile</div>
                    <div style={{ fontSize: "14px", color: "var(--muted)" }}>
                      Allow others to view your public profile
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked={true}
                    style={{ width: "20px", height: "20px" }}
                  />
                </div>
                
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontWeight: "500" }}>Show Activity</div>
                    <div style={{ fontSize: "14px", color: "var(--muted)" }}>
                      Display your activity and donations publicly
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked={false}
                    style={{ width: "20px", height: "20px" }}
                  />
                </div>
              </div>
            </Card>

            {/* Danger Zone */}
            <Card style={{ padding: "24px", border: "1px solid #dc2626" }}>
              <h3 style={{ marginTop: 0, marginBottom: "16px", color: "#dc2626" }}>
                Danger Zone
              </h3>
              
              {!showDeleteConfirm ? (
                <div>
                  <p style={{ marginBottom: "16px", color: "var(--muted)" }}>
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowDeleteConfirm(true)}
                    style={{ borderColor: "#dc2626", color: "#dc2626" }}
                  >
                    <Trash2 size={16} style={{ marginRight: "8px" }} />
                    Delete Account
                  </Button>
                </div>
              ) : (
                <div style={{ display: "grid", gap: "16px" }}>
                  <p style={{ color: "#dc2626", fontWeight: "500" }}>
                    This action cannot be undone. This will permanently delete your account and remove all your data.
                  </p>
                  
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#dc2626" }}>
                      Type "DELETE" to confirm
                    </label>
                    <Input
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      placeholder="Type DELETE to confirm"
                      style={{ borderColor: "#dc2626" }}
                    />
                  </div>
                  
                  <div style={{ display: "flex", gap: "12px" }}>
                    <Button 
                      onClick={handleAccountDeletion}
                      disabled={loading || deletePassword !== "DELETE"}
                      style={{ 
                        background: "#dc2626", 
                        borderColor: "#dc2626",
                        color: "white"
                      }}
                    >
                      <Trash2 size={16} style={{ marginRight: "8px" }} />
                      {loading ? "Deleting..." : "Permanently Delete Account"}
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setDeletePassword("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
