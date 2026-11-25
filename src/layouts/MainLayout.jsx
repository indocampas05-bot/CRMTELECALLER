import React, { useState } from "react";
import Sidebar from "../components/Sidebar/Sidebar";
import Navbar from "../components/Navbar/Navbar";
import FollowUpReminders from "../components/FollowUpReminders/FollowUpReminders";
import "./MainLayout.css";

const MainLayout = ({ children, activePage, onNavigate }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="layout">
      <Sidebar
        activePage={activePage}
        onNavigate={onNavigate}
        collapsed={collapsed}
      />

      <div className={`main-content ${collapsed ? "expanded" : ""}`}>
        <Navbar toggleSidebar={() => setCollapsed(!collapsed)} />
        <div className="page-content">{children}</div>
      </div>

      {/* Pops up when a scheduled follow-up date/time arrives (works on every page) */}
      <FollowUpReminders onNavigate={onNavigate} />
    </div>
  );
};

export default MainLayout;