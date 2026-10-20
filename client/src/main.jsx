import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import { Provider, useApp } from "./context";
import Layout from "./components/Layout";
import { Loading, Empty } from "./components/UI";
import { Auth, Onboarding } from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import { Courses, CourseDetail, Certificate } from "./pages/Courses";
import { Exams, Exam, Results, Leaderboard } from "./pages/Exams";
import Universities from "./pages/Universities";
import Community from "./pages/Community";
import { Profile, Settings, Notifications } from "./pages/Account";
import Admin, { AdminCourse } from "./pages/Admin";
import "./styles.css";
class ErrorBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="fatal-error">
        <h1>Let’s try that again.</h1>
        <p>Something interrupted this page. Your saved progress is safe.</p>
        <button
          className="button primary"
          onClick={() => window.location.reload()}
        >
          Reload the app
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}
function Protected({ children, admin = false }) {
  const { user, ready } = useApp();
  if (!ready) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;
  if (admin && user.role !== "admin") return <Navigate to="/" replace />;
  return children;
}
function App() {
  const { ready } = useApp();
  if (!ready) return <Loading />;
  return (
    <Routes>
      <Route path="/login" element={<Auth />} />
      <Route
        path="/onboarding"
        element={
          <Protected>
            <Onboarding />
          </Protected>
        }
      />
      <Route
        element={
          <Protected>
            <Layout />
          </Protected>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="courses" element={<Courses />} />
        <Route path="learning" element={<Courses mine />} />
        <Route path="courses/:id" element={<CourseDetail />} />
        <Route path="certificate/:id" element={<Certificate />} />
        <Route path="exams" element={<Exams />} />
        <Route path="exam/:id" element={<Exam />} />
        <Route path="results/:id" element={<Results />} />
        <Route path="leaderboard" element={<Leaderboard />} />
        <Route path="universities" element={<Universities />} />
        <Route path="community" element={<Community />} />
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
        <Route path="notifications" element={<Notifications />} />
        <Route
          path="admin"
          element={
            <Protected admin>
              <Admin />
            </Protected>
          }
        />
        <Route
          path="admin/courses/:id"
          element={
            <Protected admin>
              <AdminCourse />
            </Protected>
          }
        />
        <Route
          path="*"
          element={
            <Empty
              title="This page took a different path"
              text="Let’s get you back to your learning."
            >
              <Link className="button primary" to="/">
                Back home
              </Link>
            </Empty>
          }
        />
      </Route>
    </Routes>
  );
}
createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <Provider>
          <a href="#main-content" className="skip-link">
            Skip to content
          </a>
          <App />
        </Provider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
);
