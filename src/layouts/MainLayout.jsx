import React, { useState } from "react";
import Sidebar from "../components/Sidebar/Sidebar";
import Navbar from "../components/Navbar/Navbar";
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
    </div>
  );
};

export default MainLayout;