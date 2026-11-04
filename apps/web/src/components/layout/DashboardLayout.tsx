"use client";

import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";
import { RightSidebar } from "./RightSidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
  showRightSidebar?: boolean;
}

export function DashboardLayout({ children, showRightSidebar = true }: DashboardLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex flex-col antialiased">
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Left Sidebar */}
        <div className="hidden lg:block shrink-0">
          <Sidebar />
        </div>

        {/* Mobile Sidebar Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white z-10 shadow-2xl">
              <Sidebar onClose={() => setMobileMenuOpen(false)} />
            </div>
          </div>
        )}

        {/* Central Workspace */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <TopNav onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} />
          <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-8">
            {children}
          </main>
        </div>

        {/* Desktop Right Sidebar */}
        {showRightSidebar && <RightSidebar />}
      </div>
    </div>
  );
}
