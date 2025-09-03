import React from "react";

export default function Spinner({ size = 20, className = "" }) {
  const px = typeof size === "number" ? `${size}px` : size;
  return (
    <span
      className={`inline-block rounded-full border-2 border-white/20 border-t-fuchsia-400 animate-spin ${className}`}
      style={{ width: px, height: px }}
      aria-label="Loading"
    />
  );
}

