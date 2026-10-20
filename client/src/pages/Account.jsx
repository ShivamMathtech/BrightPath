import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  User,
  Edit3,
  Download,
  BookOpen,
  Award,
  Target,
  Check,
  ArrowRight,
  Settings as SettingsIcon,
  Bell,
  Shield,
  CheckCheck,
  LogOut,
} from "lucide-react";
import { api, useResource, subjects, dateLabel } from "../api";
import { useApp, useAction } from "../context";
import {
  Resource,
  PageHead,
  Avatar,
  SectionTitle,
  Badge,
  Toggle,
  Empty,
} from "../components/UI";
export function Profile() {
  const { user, setUser, notify } = useApp(),
    state = useResource("/dashboard");
  const [run, busy] = useAction();
  const [edit, setEdit] = useState(false),
    [form, setForm] = useState({
      name: user.name,
      bio: user.bio,
      country: user.country,
      interests: user.interests,
    });
  return (
    <>
      <PageHead
        eyebrow="YOUR STORY, STILL UNFOLDING"
        title="Look how far you’ve come."
        description="Every lesson, every question, every little breakthrough."
      />
      <div className="profile-banner">
        <div className="profile-blue" />
        <div className="profile-main">
          <Avatar name={user.name} size="huge" />
          <div>
            <h2>{user.name}</h2>
            <p>{user.bio || "Curious mind. Lifelong learner."}</p>
            <div className="profile-badges">
              <Badge>{user.country}</Badge>
              <Badge tone="mint">
                {user.role === "admin" ? "Administrator" : "Learner"}
              </Badge>
            </div>
          </div>
          <button className="button secondary" onClick={() => setEdit(!edit)}>
            <Edit3 size={16} />
            {edit ? "Close editor" : "Edit profile"}
          </button>
        </div>
      </div>
      {edit && (
        <section className="panel profile-editor">
          <h2>Make it yours.</h2>
          <form
            className="form-stack"
            onSubmit={(e) => {
              e.preventDefault();
              run(async () => {
                const d = await api("/profile", {
                  method: "PATCH",
                  body: form,
                });
                setUser(d.user);
                setEdit(false);
                notify("Your profile is updated.");
              });
            }}
          >
            <div className="form-columns">
              <label>
                Your name
                <input
                  required
                  minLength={2}
                  maxLength={80}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </label>
              <label>
                Country
                <input
                  required
                  minLength={2}
                  maxLength={80}
                  value={form.country}
                  onChange={(e) =>
                    setForm({ ...form, country: e.target.value })
                  }
                />
              </label>
            </div>
            <label>
              A little about you
              <textarea
                maxLength={500}
                rows={3}
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                placeholder="What makes you curious?"
              />
            </label>
            <label>Your interests</label>
            <div className="interest-grid">
              {subjects.map((s) => (
                <button
                  type="button"
                  key={s}
                  className={`interest ${form.interests.includes(s) ? "selected" : ""}`}
                  onClick={() =>
                    setForm({
                      ...form,
                      interests: form.interests.includes(s)
                        ? form.interests.filter((x) => x !== s)
                        : [...form.interests, s],
                    })
                  }
                >
                  {s}
                  {form.interests.includes(s) && <Check size={15} />}
                </button>
              ))}
            </div>
            <button className="button primary" disabled={busy}>
              Save my profile
            </button>
          </form>
        </section>
      )}
      <Resource state={state}>
        {(d) => (
          <>
            <div className="stats-row profile-stats">
              <div className="stat">
                <span className="stat-icon sky">
                  <BookOpen />
                </span>
                <div>
                  <strong>{d.stats.lessons}</strong>
                  <small>Lessons completed</small>
                </div>
              </div>
              <div className="stat">
                <span className="stat-icon peach">
                  <Award />
                </span>
                <div>
                  <strong>{d.stats.completed}</strong>
                  <small>Courses completed</small>
                </div>
              </div>
              <div className="stat">
                <span className="stat-icon mint">
                  <Target />
                </span>
                <div>
                  <strong>
                    {d.stats.average === null ? "—" : `${d.stats.average}%`}
                  </strong>
                  <small>Average exam score</small>
                </div>
              </div>
            </div>
            <div className="profile-grid">
              <section className="panel">
                <SectionTitle title="Follow your interests" />
                <div className="interest-grid">
                  {user.interests.length ? (
                    user.interests.map((s) => (
                      <Link
                        className="interest selected"
                        key={s}
                        to={`/courses?subject=${encodeURIComponent(s)}`}
                      >
                        {s}
                        <ArrowRight size={15} />
                      </Link>
                    ))
                  ) : (
                    <p className="muted">
                      Add your interests to make your profile feel like you.
                    </p>
                  )}
                </div>
                <SectionTitle title="Your milestones" />
                {d.enrolled.filter(
                  (c) => c.completed === c.lesson_count && c.lesson_count > 0,
                ).length ? (
                  d.enrolled
                    .filter(
                      (c) =>
                        c.completed === c.lesson_count && c.lesson_count > 0,
                    )
                    .map((c) => (
                      <Link
                        className="milestone"
                        key={c.id}
                        to={`/certificate/${c.id}`}
                      >
                        <Award />
                        <span>
                          <strong>{c.title}</strong>
                          <small>View your course certificate</small>
                        </span>
                        <ArrowRight size={17} />
                      </Link>
                    ))
                ) : (
                  <Empty
                    icon={Award}
                    title="Your next milestone is on its way"
                    text="Complete a course to collect your first certificate."
                  />
                )}
              </section>
              <section className="panel account-card">
                <h2>Your learning, at a glance.</h2>
                <p>
                  Take your progress with you. Download a simple report of your
                  courses and completed lessons.
                </p>
                <a className="button primary" href="/api/reports/progress.csv">
                  <Download size={17} />
                  Download progress report
                </a>
                <div className="account-info">
                  <span>
                    Email<strong>{user.email}</strong>
                  </span>
                  <span>
                    Member since<strong>{dateLabel(user.created_at)}</strong>
                  </span>
                </div>
                <Link className="text-link" to="/settings">
                  <SettingsIcon size={17} />
                  Account settings
                  <ArrowRight size={16} />
                </Link>
              </section>
            </div>
          </>
        )}
      </Resource>
    </>
  );
}
export function Settings() {
  const { user, setUser, notify } = useApp(),
    [run, busy] = useAction();
  const [pw, setPw] = useState({
    currentPassword: "",
    newPassword: "",
    confirm: "",
  });
  const setting = (key, value) =>
    run(async () => {
      const d = await api("/settings", {
        method: "PATCH",
        body: { ...user.settings, [key]: value },
      });
      setUser({ ...user, settings: d.settings });
      notify("Preference saved.");
    });
  return (
    <>
      <PageHead
        eyebrow="A SPACE THAT WORKS FOR YOU"
        title="Make yourself at home."
        description="A few small preferences can make a big difference."
      />
      <div className="settings-layout">
        <section className="panel settings-panel">
          <div className="settings-title">
            <Bell />
            <div>
              <h2>Your preferences</h2>
              <p>Personalize what you see inside BrightPath.</p>
            </div>
          </div>
          <Toggle
            label="Study plan on Overview"
            description="Show your tasks and study goals on the home page."
            checked={user.settings.studyReminders}
            disabled={busy}
            onChange={(v) => setting("studyReminders", v)}
          />
          <Toggle
            label="Exam result notifications"
            description="Add a notification when your exam results are ready."
            checked={user.settings.examResults}
            disabled={busy}
            onChange={(v) => setting("examResults", v)}
          />
          <Toggle
            label="Community message previews"
            description="Show recent messages in the study room list."
            checked={user.settings.communityUpdates}
            disabled={busy}
            onChange={(v) => setting("communityUpdates", v)}
          />
          <p className="footnote">
            These preferences apply inside the app. Email and push notifications
            are not enabled.
          </p>
        </section>
        <section className="panel settings-panel">
          <div className="settings-title">
            <Shield />
            <div>
              <h2>A little peace of mind</h2>
              <p>Update your password whenever you need.</p>
            </div>
          </div>
          <form
            className="form-stack"
            onSubmit={(e) => {
              e.preventDefault();
              if (pw.newPassword !== pw.confirm)
                return notify("The new passwords don’t match.", "error");
              run(async () => {
                await api("/password", {
                  method: "POST",
                  body: {
                    currentPassword: pw.currentPassword,
                    newPassword: pw.newPassword,
                  },
                });
                setPw({ currentPassword: "", newPassword: "", confirm: "" });
                notify(
                  "Password updated. Other sessions have been signed out.",
                );
              });
            }}
          >
            <label>
              Current password
              <input
                type="password"
                autoComplete="current-password"
                required
                maxLength={128}
                value={pw.currentPassword}
                onChange={(e) =>
                  setPw({ ...pw, currentPassword: e.target.value })
                }
              />
            </label>
            <div className="form-columns">
              <label>
                New password
                <input
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={128}
                  required
                  value={pw.newPassword}
                  onChange={(e) =>
                    setPw({ ...pw, newPassword: e.target.value })
                  }
                />
              </label>
              <label>
                Confirm password
                <input
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={128}
                  required
                  value={pw.confirm}
                  onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
                />
              </label>
            </div>
            <small>
              Use at least 8 characters, including letters and numbers.
            </small>
            <button className="button primary" disabled={busy}>
              Update password
            </button>
          </form>
        </section>
      </div>
    </>
  );
}
export function Notifications() {
  const state = useResource("/notifications"),
    [run, busy] = useAction();
  return (
    <>
      <PageHead
        eyebrow="THE LITTLE THINGS THAT MATTER"
        title="Your latest updates."
        description="New beginnings, finished chapters, and milestones along the way."
      >
        <button
          className="button secondary"
          disabled={busy}
          onClick={() =>
            run(async () => {
              await api("/notifications/read", { method: "POST", body: {} });
              state.reload();
            })
          }
        >
          <CheckCheck size={17} />
          Mark all as read
        </button>
      </PageHead>
      <Resource state={state}>
        {(d) =>
          d.notifications.length ? (
            <div className="panel notification-list">
              {d.notifications.map((n) => (
                <div
                  className={`notification ${n.is_read ? "read" : ""}`}
                  key={n.id}
                >
                  <span className="stat-icon sky">
                    <Bell size={20} />
                  </span>
                  <Link
                    to={n.link}
                    onClick={() =>
                      api("/notifications/read", {
                        method: "POST",
                        body: { id: n.id },
                      }).catch(() => {})
                    }
                  >
                    <h3>
                      {n.title}
                      {!n.is_read && <i />}
                    </h3>
                    <p>{n.body}</p>
                    <small>{dateLabel(n.created_at)}</small>
                  </Link>
                  {!n.is_read && (
                    <button
                      className="text-button"
                      disabled={busy}
                      onClick={() =>
                        run(async () => {
                          await api("/notifications/read", {
                            method: "POST",
                            body: { id: n.id },
                          });
                          state.reload();
                        })
                      }
                    >
                      Mark read
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <Empty
              icon={Bell}
              title="All quiet for now"
              text="Your learning updates will appear here."
            />
          )
        }
      </Resource>
    </>
  );
}
