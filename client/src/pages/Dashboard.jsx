import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Target,
  Clock,
  CheckCircle2,
  Plus,
  Trash2,
  Flame,
  ArrowUpRight,
  CalendarDays,
} from "lucide-react";
import { api, useResource, subjects, dateLabel } from "../api";
import { useApp, useAction } from "../context";
import {
  Resource,
  PageHead,
  SectionTitle,
  CourseCard,
  Progress,
  IconButton,
  Empty,
  Modal,
} from "../components/UI";
export default function Dashboard() {
  const state = useResource("/dashboard"),
    { user, notify } = useApp();
  const [run, busy] = useAction();
  const [add, setAdd] = useState(false),
    [title, setTitle] = useState(""),
    [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const close = React.useCallback(() => setAdd(false), []);
  return (
    <Resource state={state}>
      {(d) => (
        <>
          <PageHead
            eyebrow="MAKE ROOM FOR SOMETHING NEW"
            title={`Hi, ${user.name.split(" ")[0]} 👋`}
            description="A little learning today. A world of possibilities tomorrow."
          >
            <span className="date-chip">
              <CalendarDays size={16} />
              {new Date().toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </span>
          </PageHead>
          <div className="dashboard-grid">
            <div className="dashboard-main">
              <section className="hero-panel">
                <div className="hero-copy">
                  <span className="pill light">
                    <span className="small-sparkle">✦</span> YOUR NEXT GREAT
                    DISCOVERY
                  </span>
                  <h2>
                    A little progress.
                    <br />A brighter future.
                  </h2>
                  <p>
                    Make space for your curiosity.
                    <br />
                    Your next chapter starts right here.
                  </p>
                  <Link className="button white" to="/courses">
                    Explore courses
                    <ArrowRight size={17} />
                  </Link>
                </div>
                <img
                  src="/art/hero.svg"
                  alt="Student exploring books and ideas"
                />
                <span className="hero-circle" />
              </section>
              <div className="stats-row">
                <div className="stat">
                  <span className="stat-icon sky">
                    <BookOpen />
                  </span>
                  <div>
                    <strong>{d.stats.enrolled}</strong>
                    <small>Courses enrolled</small>
                  </div>
                </div>
                <div className="stat">
                  <span className="stat-icon mint">
                    <CheckCircle2 />
                  </span>
                  <div>
                    <strong>{d.stats.lessons}</strong>
                    <small>Lessons completed</small>
                  </div>
                </div>
                <div className="stat">
                  <span className="stat-icon peach">
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
              <SectionTitle title="Pick up where you left off" to="/learning" />
              {d.enrolled.length ? (
                <div className="course-grid two">
                  {d.enrolled.slice(0, 2).map((c) => (
                    <CourseCard key={c.id} course={c} />
                  ))}
                </div>
              ) : (
                <Empty
                  title="Your learning journey starts here"
                  text="Choose a course that sparks your curiosity."
                >
                  <Link className="button primary" to="/courses">
                    Find a course
                  </Link>
                </Empty>
              )}
              <SectionTitle title="Follow your curiosity" to="/courses" />
              <div className="subject-grid">
                {subjects.map((s, i) => (
                  <Link
                    to={`/courses?subject=${encodeURIComponent(s)}`}
                    key={s}
                  >
                    <span
                      className={`subject-icon ${["peach", "mint", "lavender", "rose", "yellow", "sky"][i]}`}
                    >
                      {["∑", "◒", "⚛", "❋", "⚗", "⌘"][i]}
                    </span>
                    <span>{s}</span>
                  </Link>
                ))}
              </div>
              <SectionTitle title="Something new to discover" to="/courses" />
              <div className="course-grid two">
                {d.courses
                  .filter((c) => !c.enrolled)
                  .slice(0, 2)
                  .map((c) => (
                    <CourseCard key={c.id} course={c} />
                  ))}
              </div>
            </div>
            <aside className="dashboard-aside">
              <section className="panel activity-panel">
                <div className="section-title">
                  <h2>Your learning rhythm</h2>
                  <span className="mini-icon">
                    <Flame size={18} />
                  </span>
                </div>
                <p>A small step is still a step.</p>
                <div className="weekly-bars">
                  {Array.from({ length: 7 }, (_, i) => {
                    const day = new Date();
                    day.setUTCDate(day.getUTCDate() - 6 + i);
                    const key = day.toISOString().slice(0, 10),
                      count = d.activity.find((a) => a.day === key)?.count || 0;
                    return (
                      <div key={key} className={i === 6 ? "today" : ""}>
                        <span className="bar-track">
                          <span
                            style={{
                              height: `${Math.min(count / 3, 1) * 100}%`,
                            }}
                            title={`${count} lessons`}
                          />
                        </span>
                        <small>
                          {day.toLocaleDateString(undefined, {
                            weekday: "narrow",
                            timeZone: "UTC",
                          })}
                        </small>
                      </div>
                    );
                  })}
                </div>
                <div className="weekly-total">
                  <strong>
                    {d.activity.reduce((s, a) => s + a.count, 0)} lessons
                  </strong>
                  <span>in the last 7 days</span>
                </div>
                <Progress
                  label="Weekly goal · 5 lessons"
                  value={Math.min(
                    (d.activity.reduce((s, a) => s + a.count, 0) / 5) * 100,
                    100,
                  )}
                />
              </section>
              {user.settings.studyReminders && (
                <section className="panel plan-panel">
                  <SectionTitle title="Your study plan">
                    <IconButton
                      label="Add study task"
                      onClick={() => setAdd(true)}
                    >
                      <Plus size={19} />
                    </IconButton>
                  </SectionTitle>
                  <p>A little intention goes a long way.</p>
                  <div className="task-list">
                    {d.tasks.length ? (
                      d.tasks.slice(0, 6).map((t) => (
                        <div
                          className={`task ${t.done ? "done" : ""}`}
                          key={t.id}
                        >
                          <input
                            type="checkbox"
                            aria-label={`Complete ${t.title}`}
                            checked={!!t.done}
                            disabled={busy}
                            onChange={(e) =>
                              run(async () => {
                                await api(`/tasks/${t.id}`, {
                                  method: "PATCH",
                                  body: { done: e.target.checked },
                                });
                                state.reload();
                              })
                            }
                          />
                          <span>
                            <strong>{t.title}</strong>
                            <small>{dateLabel(t.due_date)}</small>
                          </span>
                          <IconButton
                            label={`Delete ${t.title}`}
                            onClick={() =>
                              run(async () => {
                                await api(`/tasks/${t.id}`, {
                                  method: "DELETE",
                                  body: {},
                                });
                                state.reload();
                              })
                            }
                          >
                            <Trash2 size={14} />
                          </IconButton>
                        </div>
                      ))
                    ) : (
                      <p className="muted">
                        No tasks yet. Plan your next small step.
                      </p>
                    )}
                  </div>
                  <button className="text-button" onClick={() => setAdd(true)}>
                    <Plus size={15} />
                    Add a study goal
                  </button>
                </section>
              )}
              <section className="exam-promo">
                <img src="/art/trophy.svg" alt="" />
                <span className="eyebrow">PUT YOUR KNOWLEDGE TO WORK</span>
                <h3>
                  You know more
                  <br />
                  than you think.
                </h3>
                <p>Take a quick knowledge check and see your progress.</p>
                <Link to="/exams" className="button primary full">
                  Challenge yourself
                  <ArrowUpRight size={16} />
                </Link>
              </section>
              <div className="quote-card">
                <span>“</span>
                <p>
                  The beautiful thing about learning is that it opens another
                  door.
                </p>
                <small>KEEP YOUR CURIOSITY ALIVE</small>
              </div>
            </aside>
          </div>
          {add && (
            <Modal title="Make a little plan" onClose={close}>
              <form
                className="form-stack"
                onSubmit={(e) => {
                  e.preventDefault();
                  run(async () => {
                    await api("/tasks", {
                      method: "POST",
                      body: { title, due_date: date },
                    });
                    setAdd(false);
                    setTitle("");
                    state.reload();
                    notify("Your study goal is ready.");
                  });
                }}
              >
                <label>
                  What will you learn?
                  <input
                    autoFocus
                    required
                    minLength={3}
                    maxLength={180}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Finish the first physics lesson"
                  />
                </label>
                <label>
                  When?
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </label>
                <button className="button primary" disabled={busy}>
                  Add to my plan
                </button>
              </form>
            </Modal>
          )}
        </>
      )}
    </Resource>
  );
}
