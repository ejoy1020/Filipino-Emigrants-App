import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../App.css";

function DashboardLayout({ children, activeMenu }) {
  const [collapsed, setCollapsed] = useState(
    localStorage.getItem("sidebarCollapsed") === "true"
  );
  const navigate = useNavigate();

  // Menu configuration
  const menuItems = [
    { key: "Dashboard", path: "/", icon: "icon-dashboard", label: "Dashboard" },
    { key: "CivilStatus", path: "/civilStatus", icon: "icon-civilstatus", label: "Civil Status" },
    { key: "Sex", path: "/sex", icon: "icon-sex", label: "Gender" },
    { key: "Education", path: "/educ", icon: "icon-education", label: "Education" },
    { key: "Occupation", path: "/occu", icon: "icon-occupation", label: "Occupation" },
    { key: "Age", path: "/age", icon: "icon-age", label: "Age" },
    { key: "Place of Origin", path: "/placeOfOrigin", icon: "icon-placeoforigin", label: "Place of Origin" },
    { key: "Major Countries", path: "/majorCountry", icon: "icon-majorcountry", label: "Major Countries" },
    { key: "All Countries", path: "/allCountries", icon: "icon-allcountries", label: "All Countries" },
  ];

  const toggleSidebar = () => {
    const newCollapsed = !collapsed;
    setCollapsed(newCollapsed);
    localStorage.setItem("sidebarCollapsed", newCollapsed.toString());
  };

  return (
    <div className={`dashboard ${collapsed ? "sidebar-collapsed" : ""}`}>
      {/* === SIDEBAR === */}
      <aside className="sidebar">
        <div className="sidebar-header">
          {/* Sidebar brand 
          <h3>Filipino Emigrants Dashboard</h3>
          <Link to="/" className="brand">
            <img src="" alt="Filipino Emigrants Dashboard" className="logo" />
            {!collapsed && <span className="brand-text">Filipino Emigrants</span>}
          </Link>
          */}
        </div>

        <nav className="sidebar-nav">
          <ul className="nav-menu">
            {menuItems.map((item) => (
              <li key={item.key} className={`nav-item ${activeMenu === item.key ? "active" : ""}`}>
                <button 
                  className="nav-link"
                  onClick={() => navigate(item.path)}
                  title={item.label}
                >
                  <span className={`nav-icon ${item.icon}`}></span>
                  {!collapsed && <span className="nav-text">{item.label}</span>}
                  {activeMenu === item.key && <div className="active-indicator"></div>}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Sidebar footer */}
        {!collapsed && (
          <div className="sidebar-footer">
            <div className="version">v1.0.0</div>
          </div>
        )}
      </aside>

      {/* === MAIN CONTENT === */}
      <main className="main-content">
        {/* Top Navigation */}
        <header className="top-nav">
          <div className="nav-left">
            <button 
              className="menu-toggle"
              onClick={toggleSidebar}
              aria-label="Toggle sidebar"
            >
              <span className="hamburger"></span>
            </button>
            <h1 className="page-title">{activeMenu || "Dashboard"}</h1>
          </div>
          
          <div className="nav-right">
            <div className="user-menu">
              <span className="welcome-text">Welcome, User</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <section className="content-area">
          {children}
        </section>
      </main>
    </div>
  );
}

export default DashboardLayout;