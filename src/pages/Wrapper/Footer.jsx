import React from "react";

/**
 * Props:
 * - appName?: string
 */
export function Footer({ appName = "DormDesk" }) {
  return (
    <footer className="w-full border-t border-[#E0E0E0] bg-white">
      <div className="mx-auto max-w-7xl px-4 py-6 text-center text-sm text-[#616161]">
        © {new Date().getFullYear()} {appName} — All rights reserved
      </div>
    </footer>
  );
}

