import React, { useState } from "react";

export const Card = ({ className = "", ...p }) => <div className={`card ${className}`} {...p} />;
export const Button = ({ variant="primary", className="", ...p }) => {
  const map = { primary: "btn btn-primary", outline: "btn btn-outline", ghost: "btn btn-ghost" };
  return <button className={`${map[variant]||"btn"} ${className}`} {...p} />;
};
export const Input = ({ className="", ...p }) => <input className={`input ${className}`} {...p} />;
export const Textarea = ({ className="", ...p }) => <textarea className={`textarea ${className}`} {...p} />;
export const Chip = ({ active, className="", ...p }) => <button className={`chip ${active?"active":""} ${className}`} {...p} />;

export const Tooltip = ({ children, content }) => {
  const [isVisible, setIsVisible] = useState(false);

  if (!content) {
    return <>{children}</>;
  }

  return (
    <div
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      style={{ display: "inline-block", position: "relative" }}
    >
      {children}
      {isVisible && (
        <div
          style={{
            position: "absolute",
            bottom: "100%",
            left: "50%",
            transform: "translateX(-50%)",
            background: "var(--bg, #fff)",
            color: "var(--text, #000)",
            border: "1px solid var(--border, #ccc)",
            borderRadius: "4px",
            padding: "6px 10px",
            fontSize: "12px",
            whiteSpace: "nowrap",
            zIndex: 1000,
            marginBottom: "8px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)"
          }}
        >
          {content}
        </div>
      )}
    </div>
  );
};
