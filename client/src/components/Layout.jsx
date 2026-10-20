import React, { useEffect, useState } from "react";
import {
  NavLink,
  Outlet,
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  Home,
  BookOpen,
  Compass,
  ClipboardCheck,
  GraduationCap,
  MessageCircle,
  Trophy,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  ArrowUpRight,
  Shield,
  User,
} from "lucide-react";
import { useApp, useAction } from "../context";
import { api } from "../api";
import { Avatar, IconButton } from "./UI";
const links = [
  ["/", "Overview", Home],
  ["/learning", "My learning", BookOpen],
  ["/courses", "Explore courses", Compass],
  ["/exams", "Practice & exams", ClipboardCheck],
  ["/universities", "Universities", GraduationCap],
  ["/community", "Study rooms", MessageCircle],
  ["/leaderboard", "Leaderboard", Trophy],
];
export default function Layout() {
  const { user, setUser } = useApp();
  const [run, busy] = useAction();
  const [open, setOpen] = useState(false),
    [query, setQuery] = useState(""),
    [unread, setUnread] = useState(0);
  const location = useLocation(),
    navigate = useNavigate();
  useEffect(() => {
    setOpen(false);
    const refreshUnread = () =>
      api("/notifications")
        .then((d) =>
          setUnread(d.notifications.filter((n) => !n.is_read).length),
        )
        .catch(() => {});
    refreshUnread();
    window.addEventListener("notifications-changed", refreshUnread);
    window.scrollTo(0, 0);
    return () =>
      window.removeEventListener("notifications-changed", refreshUnread);
  }, [location.pathname]);
  const logout = () =>
    run(async () => {
      await api("/auth/logout", { method: "POST", body: {} });
      setUser(null);
      navigate("/login");
    });
  return (
    <div className="app-shell">
      <button
        className={`sidebar-overlay ${open ? "visible" : ""}`}
        aria-label="Close menu"
        onClick={() => setOpen(false)}
      />
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <Link to="/" className="brand">
          <img src="/art/logo.svg" alt="" />
          <span>
            bright<span>path</span>
            <i>.</i>
          </span>
        </Link>
        <IconButton
          label="Close menu"
          className="icon-button mobile-close"
          onClick={() => setOpen(false)}
        >
          <X />
        </IconButton>
        <div className="nav-label">YOUR LEARNING SPACE</div>
        <nav aria-label="Main navigation">
          {links.map(([to, label, Icon]) => (
            <NavLink key={to} to={to} end={to === "/"}>
              <Icon size={19} />
              <span>{label}</span>
              {to === "/community" && <span className="nav-dot" />}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-tip">
          <span className="tip-orbit">✦</span>
          <h3>Small steps. Big dreams.</h3>
          <p>Your next discovery is just one lesson away.</p>
          <Link to="/courses">
            Find your next course <ArrowUpRight size={16} />
          </Link>
        </div>
        <nav className="secondary-nav" aria-label="Account navigation">
          {user.role === "admin" && (
            <NavLink to="/admin">
              <Shield size={19} />
              Admin workspace
            </NavLink>
          )}
          <NavLink to="/settings">
            <Settings size={19} />
            Settings
          </NavLink>
          <button onClick={logout} disabled={busy}>
            <LogOut size={19} />
            Log out
          </button>
        </nav>
        <Link to="/profile" className="sidebar-profile">
          <Avatar name={user.name} />
          <span>
            <strong>{user.name}</strong>
            <small>
              {user.role === "admin"
                ? "Administrator"
                : "Curious mind, lifelong learner"}
            </small>
          </span>
        </Link>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <IconButton
            label="Open menu"
            className="icon-button mobile-menu"
            onClick={() => setOpen(true)}
          >
            <Menu />
          </IconButton>
          <div className="topbar-label">
            Let curiosity lead the way <span>✦</span>
          </div>
          <form
            className="global-search"
            onSubmit={(e) => {
              e.preventDefault();
              navigate(`/courses?search=${encodeURIComponent(query)}`);
              setQuery("");
            }}
          >
            <Search size={17} />
            <input
              aria-label="Search courses"
              placeholder="Search anything to learn…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <kbd>↵</kbd>
          </form>
          <Link
            to="/notifications"
            className="icon-button bell"
            aria-label={`Notifications, ${unread} unread`}
          >
            <Bell size={20} />
            {unread > 0 && <i />}
          </Link>
          <span className="topbar-divider" />
          <Link
            to="/profile"
            className="topbar-profile"
            aria-label="My profile"
          >
            <Avatar name={user.name} size="small" />
            <span>{user.name.split(" ")[0]}</span>
          </Link>
        </header>
        <main id="main-content" className="main-content">
          <Outlet />
        </main>
        <footer className="app-footer">
          <span>Made for curious minds.</span>
          <span>BrightPath © {new Date().getFullYear()}</span>
        </footer>
      </div>
      <nav className="mobile-bottom" aria-label="Mobile navigation">
        {[
          ["/", "Home", Home],
          ["/learning", "Learn", BookOpen],
          ["/exams", "Exams", ClipboardCheck],
          ["/community", "Chat", MessageCircle],
          ["/profile", "Profile", User],
        ].map(([to, label, Icon]) => (
          <NavLink to={to} key={to} end={to === "/"}>
            <Icon size={21} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
