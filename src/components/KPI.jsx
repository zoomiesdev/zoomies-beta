import React from "react";

export default function KPI({ 
  icon, 
  label, 
  value, 
  sparkline, 
  iconColor = "var(--accent)",
  iconBackground = "var(--accent)",
  valueColor = "var(--text)",
  labelColor = "var(--muted)"
}) {
  return (
    <div style={{
      display: "flex",
      alignItems: "flex-start",
      gap: "12px",
      padding: "16px",
      borderRadius: "12px",
      border: "1px solid var(--border)",
      background: "var(--panel)",
      minHeight: "80px"
    }}>
      {/* Icon Chip */}
      <div style={{
        width: "36px",
        height: "36px",
        borderRadius: "8px",
        background: iconBackground,
        display: "grid",
        placeItems: "center",
        flexShrink: 0
      }}>
        {icon}
      </div>
      
      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: "12px",
          color: labelColor,
          marginBottom: "4px",
          fontWeight: 500
        }}>
          {label}
        </div>
        <div style={{
          fontSize: "20px",
          fontWeight: 700,
          color: valueColor,
          marginBottom: "8px"
        }}>
          {value}
        </div>
        
        {/* Optional Sparkline */}
        {sparkline && (
          <div style={{ height: "24px" }}>
            {sparkline}
          </div>
        )}
      </div>
    </div>
  );
}
