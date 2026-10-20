import React, { useState } from "react";
import {
  Link,
  useParams,
  useSearchParams,
  useNavigate,
} from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  Play,
  Download,
  Award,
  ChevronRight,
  LockKeyhole,
} from "lucide-react";
import { api, useResource, subjects, dateLabel } from "../api";
import { useApp, useAction } from "../context";
import {
  Resource,
  PageHead,
  CourseCard,
  SearchField,
  Empty,
  Badge,
  Avatar,
  Progress,
  SectionTitle,
} from "../components/UI";
export function Courses({ mine = false }) {
  const state = useResource("/courses"),
    [params, setParams] = useSearchParams();
  const [sort, setSort] = useState("recommended");
  const search = params.get("search") || "",
    subject = params.get("subject") || "All subjects";
  const update = (key, value) => {
    const p = new URLSearchParams(params);
    if (value) p.set(key, value);
    else p.delete(key);
    setParams(p, { replace: true });
  };
  return (
    <>
      <PageHead
        eyebrow={
          mine ? "YOUR PERSONAL LEARNING SHELF" : "A WORLD OF POSSIBILITIES"
        }
        title={
          mine ? "Keep your curiosity going." : "What will you discover today?"
        }
        description={
          mine
            ? "Your courses, your pace. Pick up exactly where you left off."
            : "Explore something you love. Or discover something you didn’t know you would."
        }
      >
        {mine && (
          <Link className="button primary" to="/courses">
            Explore courses
            <ArrowRight size={16} />
          </Link>
        )}
      </PageHead>
      <div className="filter-bar">
        <SearchField
          value={search}
          onChange={(s) => update("search", s)}
          placeholder="Find your next discovery…"
        />
        <label className="sr-only" htmlFor="course-sort">
          Sort courses
        </label>
        <select
          id="course-sort"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="recommended">Recommended</option>
          <option value="title">Title: A to Z</option>
          <option value="short">Shortest first</option>
        </select>
      </div>
      <div className="filter-chips" aria-label="Filter by subject">
        {["All subjects", ...subjects].map((s) => (
          <button
            className={subject === s ? "active" : ""}
            key={s}
            onClick={() => update("subject", s === "All subjects" ? "" : s)}
          >
            {s}
          </button>
        ))}
      </div>
      <Resource state={state}>
        {(d) => {
          const cs = d.courses
            .filter(
              (c) =>
                (!mine || c.enrolled) &&
                (subject === "All subjects" || c.subject === subject) &&
                `${c.title} ${c.subject} ${c.description}`
                  .toLowerCase()
                  .includes(search.toLowerCase()),
            )
            .sort((a, b) =>
              sort === "title"
                ? a.title.localeCompare(b.title)
                : sort === "short"
                  ? a.minutes - b.minutes
                  : 0,
            );
          return (
            <>
              <div className="results-label">
                {cs.length} {mine ? "enrolled" : "available"} course
                {cs.length !== 1 ? "s" : ""}
                <span>Keep exploring, keep growing.</span>
              </div>
              {cs.length ? (
                <div className="course-grid">
                  {cs.map((c) => (
                    <CourseCard key={c.id} course={c} />
                  ))}
                </div>
              ) : (
                <Empty
                  title={
                    mine ? "Your next chapter is waiting" : "No courses found"
                  }
                  text={
                    mine
                      ? "Enroll in a course to add it to your learning shelf."
                      : "Try a different search or subject."
                  }
                >
                  <Link to="/courses" className="button primary">
                    Explore all courses
                  </Link>
                </Empty>
              )}
            </>
          );
        }}
      </Resource>
    </>
  );
}
export function CourseDetail() {
  const { id } = useParams(),
    state = useResource(`/courses/${id}`),
    [params, setParams] = useSearchParams(),
    { notify } = useApp();
  const [run, busy] = useAction();
  return (
    <Resource state={state}>
      {(d) => {
        const c = d.course,
          selected = Number(params.get("lesson")),
          current =
            d.lessons.find((l) => l.id === selected) ||
            d.lessons.find((l) => !l.completed) ||
            d.lessons[0],
          done = d.lessons.filter((l) => l.completed).length,
          index = d.lessons.findIndex((l) => l.id === current?.id);
        const finish = () =>
          run(async () => {
            await api(`/lessons/${current.id}/complete`, {
              method: "POST",
              body: {},
            });
            notify("One more step forward. Lesson completed!");
            state.reload();
            if (index < d.lessons.length - 1)
              setParams({ lesson: d.lessons[index + 1].id });
          });
        return (
          <>
            <Link to="/learning" className="back-link">
              <ArrowLeft size={16} />
              Back to learning
            </Link>
            <div className="course-detail-header">
              <div>
                <Badge tone={c.color}>{c.subject}</Badge>
                <h1>{c.title}</h1>
                <p>{c.description}</p>
                <div className="course-detail-meta">
                  <Avatar name={c.instructor} size="small" />
                  <span>{c.instructor}</span>
                  <span>·</span>
                  <span>{c.level}</span>
                  <span>·</span>
                  <Clock size={15} />
                  <span>
                    {d.lessons.reduce((s, l) => s + l.minutes, 0)} minutes
                  </span>
                </div>
              </div>
              <img src={`/art/${c.art}.svg`} alt="" />
            </div>
            <div className="lesson-layout">
              <section className="panel lesson-content">
                {current ? (
                  <>
                    {current.video ? (
                      <div className="video-wrap">
                        <video
                          controls
                          preload="metadata"
                          poster={
                            current.video === "/media/waves.mp4"
                              ? "/art/wave-poster.svg"
                              : `/art/${c.art}.svg`
                          }
                          key={current.video}
                        >
                          <source
                            src={current.video}
                            type={
                              current.video.endsWith(".webm")
                                ? "video/webm"
                                : "video/mp4"
                            }
                          />
                          {current.video === "/media/waves.mp4" && (
                            <track
                              kind="captions"
                              src="/media/waves.vtt"
                              srcLang="en"
                              label="English"
                              default
                            />
                          )}
                          Your browser does not support HTML video.
                        </video>
                        <small>
                          {current.video === "/media/waves.mp4"
                            ? "Original animated explainer · silent video with captions"
                            : "Video lesson · continue with the reading below"}
                        </small>
                      </div>
                    ) : (
                      <div className={`lesson-banner ${c.color}`}>
                        <img src={`/art/${c.art}.svg`} alt="" />
                        <span>
                          CHAPTER {String(index + 1).padStart(2, "0")}
                          <strong>{current.title}</strong>
                        </span>
                      </div>
                    )}
                    <div className="lesson-reading">
                      <div className="lesson-overline">
                        <span>
                          LESSON {index + 1} OF {d.lessons.length}
                        </span>
                        <span>
                          <Clock size={14} />
                          {current.minutes} min read
                        </span>
                      </div>
                      <h2>{current.title}</h2>
                      {current.content.split("\n\n").map((p, i) => (
                        <p key={i}>{p}</p>
                      ))}
                      <div className="learning-note">
                        <span>✦</span>
                        <p>
                          <strong>Make it stick.</strong> Pause for a moment.
                          How would you explain this idea to a friend?
                        </p>
                      </div>
                      <div className="lesson-actions">
                        {d.enrolled ? (
                          <button
                            className={`button ${current.completed ? "secondary" : "primary"}`}
                            disabled={busy}
                            onClick={
                              current.completed
                                ? () => {
                                    if (index < d.lessons.length - 1)
                                      setParams({
                                        lesson: d.lessons[index + 1].id,
                                      });
                                    else
                                      notify(
                                        "You have reached the end. Your certificate is ready.",
                                      );
                                  }
                                : finish
                            }
                          >
                            {current.completed ? (
                              <CheckCircle2 size={17} />
                            ) : (
                              <Check size={17} />
                            )}{" "}
                            {current.completed
                              ? index < d.lessons.length - 1
                                ? "Next lesson"
                                : "All caught up!"
                              : "Mark complete & continue"}
                          </button>
                        ) : (
                          <button
                            className="button primary"
                            disabled={busy}
                            onClick={() =>
                              run(async () => {
                                await api(`/courses/${id}/enroll`, {
                                  method: "POST",
                                  body: {},
                                });
                                state.reload();
                                notify("You’re enrolled. Let’s begin!");
                              })
                            }
                          >
                            Start learning
                            <ArrowRight size={17} />
                          </button>
                        )}
                        <span>
                          {current.completed
                            ? "You’ve completed this lesson."
                            : d.enrolled
                              ? "Progress is saved to your account."
                              : "Enroll to track your progress."}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <Empty
                    title="Lessons are on their way"
                    text="This course has not been published yet."
                  />
                )}
              </section>
              <aside className="lesson-aside">
                <section className="panel">
                  <SectionTitle title="Your learning path" />
                  <Progress
                    label={`${done} of ${d.lessons.length} lessons`}
                    value={
                      d.lessons.length ? (done / d.lessons.length) * 100 : 0
                    }
                  />
                  <div className="lesson-list">
                    {d.lessons.map((l, i) => (
                      <button
                        key={l.id}
                        className={current?.id === l.id ? "active" : ""}
                        onClick={() => setParams({ lesson: l.id })}
                      >
                        <span
                          className={`lesson-number ${l.completed ? "complete" : ""}`}
                        >
                          {l.completed ? (
                            <Check size={15} />
                          ) : (
                            String(i + 1).padStart(2, "0")
                          )}
                        </span>
                        <span>
                          <strong>{l.title}</strong>
                          <small>
                            {l.minutes} min ·{" "}
                            {l.video ? "Video + reading" : "Reading"}
                          </small>
                        </span>
                        {current?.id === l.id && <Play size={13} />}
                      </button>
                    ))}
                  </div>
                </section>
                <section className="certificate-promo">
                  <Award size={34} />
                  <h3>A milestone worth celebrating.</h3>
                  <p>
                    Complete every lesson to unlock your course certificate.
                  </p>
                  {done === d.lessons.length && done > 0 ? (
                    <Link
                      className="button primary full"
                      to={`/certificate/${id}`}
                    >
                      <Award size={16} />
                      View certificate
                    </Link>
                  ) : (
                    <span className="muted">
                      <LockKeyhole size={14} />
                      Keep going. You’re on your way.
                    </span>
                  )}
                </section>
                <Link
                  className="exam-link"
                  to={`/exams?subject=${encodeURIComponent(c.subject)}`}
                >
                  <span>
                    <strong>Ready to test yourself?</strong>
                    <small>
                      Try a {c.subject.toLowerCase()} knowledge check
                    </small>
                  </span>
                  <ArrowRight size={18} />
                </Link>
              </aside>
            </div>
          </>
        );
      }}
    </Resource>
  );
}
export function Certificate() {
  const { id } = useParams(),
    state = useResource(`/certificates/${id}`);
  return (
    <Resource state={state}>
      {(d) => (
        <>
          <div className="print-toolbar">
            <Link className="back-link" to={`/courses/${id}`}>
              <ArrowLeft size={16} />
              Back to course
            </Link>
            <button className="button primary" onClick={() => window.print()}>
              <Download size={17} />
              Print / save as PDF
            </button>
          </div>
          <div className="certificate">
            <div className="brand">
              <img src="/art/logo.svg" alt="" />
              <span>
                brightpath<i>.</i>
              </span>
            </div>
            <div className="certificate-mark">
              <Award size={66} />
            </div>
            <span className="eyebrow">CURIOSITY. COMMITMENT. PROGRESS.</span>
            <h1>Certificate of completion</h1>
            <p>This celebrates</p>
            <h2>{d.name}</h2>
            <p>for completing every lesson in</p>
            <h3>{d.course}</h3>
            <div className="certificate-meta">
              <div>
                <strong>{dateLabel(d.date)}</strong>
                <span>DATE OF COMPLETION</span>
              </div>
              <div>
                <strong>BrightPath Learning</strong>
                <span>A LITTLE PROGRESS, EVERY DAY</span>
              </div>
            </div>
            <small>{d.note}</small>
            <code>{d.code}</code>
          </div>
        </>
      )}
    </Resource>
  );
}
