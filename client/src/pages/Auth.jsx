import React, { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Check,
  Sparkles,
  BookOpen,
  Trophy,
  Users,
} from "lucide-react";
import { api, subjects } from "../api";
import { useApp, useAction } from "../context";
import { IconButton } from "../components/UI";
export function Auth() {
  const { user, setUser, notify } = useApp(),
    navigate = useNavigate();
  const [run, busy] = useAction();
  const [register, setRegister] = useState(false),
    [visible, setVisible] = useState(false),
    [form, setForm] = useState({ name: "", email: "", password: "" });
  if (user) return <Navigate to="/" replace />;
  const submit = (e) => {
    e.preventDefault();
    run(async () => {
      const d = await api(register ? "/auth/register" : "/auth/login", {
        method: "POST",
        body: form,
      });
      setUser(d.user);
      navigate(register ? "/onboarding" : "/");
    });
  };
  const demo = (role) =>
    run(async () => {
      const d = await api("/auth/login", {
        method: "POST",
        body: { email: `${role}@brightpath.demo`, password: "Learn@123" },
      });
      setUser(d.user);
      navigate(role === "admin" ? "/admin" : "/");
    });
  return (
    <div className="auth-page">
      <section className="auth-story">
        <div className="brand light">
          <img src="/art/logo.svg" alt="" />
          <span>
            brightpath<i>.</i>
          </span>
        </div>
        <div className="auth-story-copy">
          <span className="pill light">
            <Sparkles size={14} /> A brighter way to learn
          </span>
          <h1>
            Big dreams start
            <br />
            with a little
            <br />
            <em>curiosity.</em>
          </h1>
          <p>
            Find your interests. Build your confidence.
            <br />
            Make a little progress, every single day.
          </p>
        </div>
        <img
          className="auth-illustration"
          src="/art/hero.svg"
          alt="Illustration of a student discovering new ideas"
        />
        <div className="auth-proof">
          <span>
            <BookOpen size={18} />
            Learn at your pace
          </span>
          <span>
            <Trophy size={18} />
            Celebrate progress
          </span>
          <span>
            <Users size={18} />
            Grow together
          </span>
        </div>
      </section>
      <section className="auth-form-side">
        <div className="auth-top">
          <span>
            {register ? "Already learning with us?" : "New around here?"}
          </span>
          <button
            onClick={() => setRegister(!register)}
            className="text-button"
          >
            {register ? "Log in" : "Create an account"}
            <ArrowRight size={15} />
          </button>
        </div>
        <div className="auth-form-wrap">
          <span className="auth-wave">✦</span>
          <div className="eyebrow">YOUR NEXT CHAPTER</div>
          <h2>{register ? "Let’s get you started." : "Welcome back."}</h2>
          <p>
            {register
              ? "A world of discovery is waiting for you."
              : "Good to see you. Ready to learn something new?"}
          </p>
          <form onSubmit={submit} className="form-stack">
            {register && (
              <label>
                Full name
                <input
                  required
                  minLength={2}
                  maxLength={80}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  autoComplete="name"
                  placeholder="Your name"
                />
              </label>
            )}
            <label>
              Email address
              <input
                required
                type="email"
                maxLength={254}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                autoComplete="email"
                placeholder="you@example.com"
              />
            </label>
            <label>
              Password
              <span className="password-field">
                <input
                  required
                  minLength={register ? 8 : 1}
                  maxLength={128}
                  type={visible ? "text" : "password"}
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  autoComplete={register ? "new-password" : "current-password"}
                  placeholder={
                    register
                      ? "At least 8 characters, letters and numbers"
                      : "Enter your password"
                  }
                />
                <IconButton
                  label={visible ? "Hide password" : "Show password"}
                  type="button"
                  onClick={() => setVisible(!visible)}
                >
                  {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                </IconButton>
              </span>
            </label>
            <button className="button primary full" disabled={busy}>
              {busy
                ? "Just a moment…"
                : register
                  ? "Create my account"
                  : "Let’s go"}
              <ArrowRight size={18} />
            </button>
          </form>
          <div className="or-divider">
            <span>or explore the demo</span>
          </div>
          <div className="demo-buttons">
            <button
              className="button secondary"
              disabled={busy}
              onClick={() => demo("student")}
            >
              Student demo
              <ArrowRight size={16} />
            </button>
            <button
              className="button quiet"
              disabled={busy}
              onClick={() => demo("admin")}
            >
              Admin demo
            </button>
          </div>
          <p className="auth-note">
            A complete learning space. Demo accounts share sample data.
            <br />
            Create an account for your own progress.
          </p>
        </div>
        <div className="auth-bottom">A little progress. A brighter future.</div>
      </section>
    </div>
  );
}
export function Onboarding() {
  const { user, setUser } = useApp(),
    navigate = useNavigate();
  const [run, busy] = useAction(),
    [step, setStep] = useState(0),
    [selected, setSelected] = useState(user.interests || []);
  const pages = [
    [
      "A world of possibilities.",
      "Learn at your own pace with short lessons, thoughtful practice, and a community that grows with you.",
      "hero",
    ],
    [
      "Every small win counts.",
      "Track your learning, challenge yourself with knowledge checks, and celebrate how far you have come.",
      "trophy",
    ],
    [
      "What makes you curious?",
      "Pick a few interests. You can always change these in your profile.",
      "earth",
    ],
  ];
  const finish = () =>
    run(async () => {
      const d = await api("/profile", {
        method: "PATCH",
        body: {
          name: user.name,
          bio: user.bio,
          country: user.country,
          interests: selected,
        },
      });
      setUser(d.user);
      navigate("/");
    });
  return (
    <div className="onboarding">
      <div className="brand">
        <img src="/art/logo.svg" alt="" />
        <span>
          brightpath<i>.</i>
        </span>
      </div>
      <div className="onboarding-card">
        <button className="text-button skip" onClick={finish} disabled={busy}>
          Skip for now
        </button>
        <img src={`/art/${pages[step][2]}.svg`} alt="" />
        <h1>{pages[step][0]}</h1>
        <p>{pages[step][1]}</p>
        {step === 2 && (
          <div className="interest-grid">
            {subjects.map((s) => (
              <button
                className={`interest ${selected.includes(s) ? "selected" : ""}`}
                key={s}
                onClick={() =>
                  setSelected(
                    selected.includes(s)
                      ? selected.filter((x) => x !== s)
                      : [...selected, s],
                  )
                }
              >
                {s}
                {selected.includes(s) && <Check size={15} />}
              </button>
            ))}
          </div>
        )}
        <div className="onboarding-dots">
          {pages.map((_, i) => (
            <span key={i} className={step === i ? "active" : ""} />
          ))}
        </div>
        <button
          className="button primary"
          disabled={busy}
          onClick={() => (step < 2 ? setStep(step + 1) : finish())}
        >
          {step < 2 ? "Keep going" : "Start my journey"}
          <ArrowRight size={17} />
        </button>
      </div>
    </div>
  );
}
