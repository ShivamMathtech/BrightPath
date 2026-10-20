import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Link,
  useParams,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowRight,
  ArrowLeft,
  Clock,
  ClipboardCheck,
  Check,
  CheckCircle2,
  XCircle,
  Award,
  Flag,
  Send,
  RefreshCw,
} from "lucide-react";
import { api, useResource, subjects, dateLabel } from "../api";
import { useApp, useAction } from "../context";
import {
  Resource,
  PageHead,
  Badge,
  Empty,
  SectionTitle,
  Progress,
  Modal,
  Avatar,
} from "../components/UI";
const tones = {
  Mathematics: "peach",
  Geography: "mint",
  Physics: "lavender",
  Biology: "rose",
  Chemistry: "yellow",
  "Computer Science": "sky",
};
export function Exams() {
  const state = useResource("/exams"),
    navigate = useNavigate(),
    [params] = useSearchParams();
  const [run, busy] = useAction(),
    [subject, setSubject] = useState(params.get("subject") || "All subjects");
  return (
    <>
      <PageHead
        eyebrow="TURN PRACTICE INTO PROGRESS"
        title="A little challenge. A lot of growth."
        description="Check your understanding, learn from your answers, and try again."
      >
        <Link className="button secondary" to="/leaderboard">
          <Award size={17} />
          Leaderboard
        </Link>
      </PageHead>
      <div className="exam-intro">
        <span className="intro-icon">
          <ClipboardCheck size={28} />
        </span>
        <div>
          <h3>Practice makes possibilities.</h3>
          <p>
            Your answers save as you go. Each exam has a server-enforced timer
            and a detailed review.
          </p>
        </div>
        <img src="/art/trophy.svg" alt="" />
      </div>
      <div className="filter-chips">
        {["All subjects", ...subjects].map((s) => (
          <button
            key={s}
            className={subject === s ? "active" : ""}
            onClick={() => setSubject(s)}
          >
            {s}
          </button>
        ))}
      </div>
      <Resource state={state}>
        {(d) => (
          <>
            <div className="exam-grid">
              {d.exams
                .filter(
                  (e) => subject === "All subjects" || e.subject === subject,
                )
                .map((e) => (
                  <article className="panel exam-card" key={e.id}>
                    <div className="exam-card-top">
                      <span
                        className={`exam-icon ${tones[e.subject] || "sky"}`}
                      >
                        <ClipboardCheck size={25} />
                      </span>
                      <Badge tone={e.best_score !== null ? "mint" : ""}>
                        {e.best_score !== null
                          ? `Best: ${e.best_score}%`
                          : "Ready when you are"}
                      </Badge>
                    </div>
                    <span className="subject-label">{e.subject}</span>
                    <h3>{e.title}</h3>
                    <p>
                      {e.question_count} questions to put your learning into
                      practice.
                    </p>
                    <div className="exam-card-footer">
                      <span>
                        <Clock size={15} />
                        {e.minutes} minutes
                      </span>
                      <button
                        className="button primary small"
                        disabled={busy}
                        onClick={() =>
                          run(async () => {
                            const a = await api(`/exams/${e.id}/start`, {
                              method: "POST",
                              body: {},
                            });
                            navigate(`/exam/${a.id}`);
                          })
                        }
                      >
                        {e.attempts ? "Try again" : "Start exam"}
                        <ArrowRight size={15} />
                      </button>
                    </div>
                  </article>
                ))}
            </div>
            <SectionTitle title="Your progress, one attempt at a time" />
            {d.history.length ? (
              <div className="panel table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Knowledge check</th>
                      <th>Date</th>
                      <th>Score</th>
                      <th>Review</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.history.map((a) => (
                      <tr key={a.id}>
                        <td>
                          <strong>{a.title}</strong>
                          <small>{a.subject}</small>
                        </td>
                        <td>{dateLabel(a.submitted_at)}</td>
                        <td>
                          <Badge tone={a.score >= 70 ? "mint" : "peach"}>
                            {a.score}%
                          </Badge>
                        </td>
                        <td>
                          <Link className="text-link" to={`/results/${a.id}`}>
                            View answers
                            <ArrowRight size={15} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty
                icon={ClipboardCheck}
                title="Your first milestone is waiting"
                text="Complete a knowledge check to see your results here."
              />
            )}
          </>
        )}
      </Resource>
    </>
  );
}
export function Exam() {
  const { id } = useParams(),
    state = useResource(`/attempts/${id}`);
  return (
    <Resource state={state}>
      {(d) => <ExamRunner key={d.id} initial={d} />}
    </Resource>
  );
}
function ExamRunner({ initial: a }) {
  const navigate = useNavigate(),
    { notify } = useApp();
  const [answers, setAnswers] = useState(a.answers),
    [current, setCurrent] = useState(0),
    [seconds, setSeconds] = useState(
      Math.max(0, Math.ceil((a.deadline - a.server_time) / 1000)),
    ),
    [confirm, setConfirm] = useState(false),
    [busy, setBusy] = useState(false),
    [saved, setSaved] = useState("All answers saved");
  const [flags, setFlags] = useState([]);
  const pending = useRef(Promise.resolve()),
    latest = useRef(a.answers),
    submitting = useRef(false),
    autoAttempted = useRef(false),
    offset = useRef(a.server_time - Date.now());
  const close = useCallback(() => setConfirm(false), []);
  const submit = useCallback(
    async (auto = false) => {
      if (submitting.current) return;
      submitting.current = true;
      setBusy(true);
      setConfirm(false);
      try {
        await pending.current;
        await api(`/attempts/${a.id}/submit`, {
          method: "POST",
          body: { answers: latest.current },
        });
        navigate(`/results/${a.id}`, { replace: true });
      } catch (e) {
        notify(e.message, "error");
        submitting.current = false;
        setBusy(false);
        if (auto) setSaved("Submission failed. Reconnect and submit again.");
      }
    },
    [a.id, navigate],
  );
  useEffect(() => {
    if (a.submitted_at) {
      navigate(`/results/${a.id}`, { replace: true });
      return;
    }
    const t = setInterval(() => {
      const left = Math.max(
        0,
        Math.ceil((a.deadline - (Date.now() + offset.current)) / 1000),
      );
      setSeconds(left);
      if (left === 0 && !submitting.current && !autoAttempted.current) {
        autoAttempted.current = true;
        submit(true);
      }
    }, 1000);
    return () => clearInterval(t);
  }, [a.deadline, a.submitted_at, a.id, navigate, submit]);
  const choose = (value) => {
    if (busy || seconds === 0) return;
    const next = { ...latest.current, [a.questions[current].id]: value };
    latest.current = next;
    setAnswers(next);
    setSaved("Saving…");
    pending.current = pending.current
      .catch(() => {})
      .then(() =>
        api(`/attempts/${a.id}/answers`, {
          method: "PUT",
          body: { answers: next },
        }),
      )
      .then(() => setSaved("All answers saved"))
      .catch((e) => {
        setSaved("Not saved. Your connection may be interrupted.");
        notify(e.message, "error");
      });
  };
  const q = a.questions[current];
  return (
    <>
      <div className="exam-workspace-head">
        <Link className="back-link" to="/exams">
          <ArrowLeft size={16} />
          Leave & resume later
        </Link>
        <span className={`exam-timer ${seconds < 60 ? "urgent" : ""}`}>
          <Clock size={18} />
          {String(Math.floor(seconds / 60)).padStart(2, "0")}:
          {String(seconds % 60).padStart(2, "0")}
        </span>
      </div>
      <PageHead
        eyebrow={a.subject.toUpperCase()}
        title={a.title}
        description="Take a breath. Think it through. You’ve got this."
      />
      <div className="exam-workspace">
        <section className="panel question-panel">
          <div className="question-heading">
            <Badge>
              Question {current + 1} of {a.questions.length}
            </Badge>
            <button
              className={`text-button ${flags.includes(current) ? "flagged" : ""}`}
              onClick={() =>
                setFlags(
                  flags.includes(current)
                    ? flags.filter((f) => f !== current)
                    : [...flags, current],
                )
              }
            >
              <Flag size={15} />
              {flags.includes(current) ? "Flagged" : "Flag for review"}
            </button>
          </div>
          <h2>{q.prompt}</h2>
          <div
            className="answer-options"
            role="radiogroup"
            aria-label="Choose your answer"
          >
            {q.options.map((option, i) => (
              <label className={answers[q.id] === i ? "selected" : ""} key={i}>
                <input
                  type="radio"
                  name={`q-${q.id}`}
                  value={i}
                  checked={answers[q.id] === i}
                  onChange={() => choose(i)}
                  disabled={busy || seconds === 0}
                />
                <span className="option-letter">
                  {String.fromCharCode(65 + i)}
                </span>
                <span>{option}</span>
                {answers[q.id] === i && <CheckCircle2 size={19} />}
              </label>
            ))}
          </div>
          <div className="question-controls">
            <button
              className="button secondary"
              disabled={current === 0 || busy}
              onClick={() => setCurrent(current - 1)}
            >
              <ArrowLeft size={16} />
              Previous
            </button>
            <span className="save-status" aria-live="polite">
              {saved}
            </span>
            {current < a.questions.length - 1 ? (
              <button
                className="button primary"
                onClick={() => setCurrent(current + 1)}
              >
                Next question
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                className="button primary"
                disabled={busy}
                onClick={() => setConfirm(true)}
              >
                Review & submit
                <Send size={16} />
              </button>
            )}
          </div>
        </section>
        <aside className="panel question-navigator">
          <h3>Your progress</h3>
          <Progress
            label={`${Object.keys(answers).length} answered`}
            value={(Object.keys(answers).length / a.questions.length) * 100}
          />
          <div className="question-numbers">
            {a.questions.map((q, i) => (
              <button
                className={`${answers[q.id] !== undefined ? "answered" : ""} ${current === i ? "current" : ""} ${flags.includes(i) ? "flagged" : ""}`}
                aria-label={`Question ${i + 1}${answers[q.id] !== undefined ? ", answered" : ""}`}
                key={q.id}
                onClick={() => setCurrent(i)}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <div className="exam-legend">
            <span>
              <i className="blue" />
              Answered
            </span>
            <span>
              <i />
              Not answered
            </span>
            <span>
              <i className="gold" />
              Flagged
            </span>
          </div>
          <p>
            There is no negative marking. Unanswered questions receive zero
            points.
          </p>
          <button
            className="button primary full"
            disabled={busy}
            onClick={() => setConfirm(true)}
          >
            {busy ? "Submitting…" : "Submit exam"}
          </button>
        </aside>
      </div>
      {confirm && (
        <Modal title="Ready to see how you did?" onClose={close}>
          <div className="submit-summary">
            <Award size={46} />
            <p>
              You answered{" "}
              <strong>
                {Object.keys(answers).length} of {a.questions.length}
              </strong>{" "}
              questions.
            </p>
            {Object.keys(answers).length < a.questions.length && (
              <p className="warning-text">
                Unanswered questions will receive zero points.
              </p>
            )}
            <p>You can review every answer after submitting.</p>
            <div className="button-row">
              <button className="button secondary" onClick={close}>
                Keep reviewing
              </button>
              <button
                className="button primary"
                disabled={busy}
                onClick={() => submit()}
              >
                Submit my answers
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
export function Results() {
  const { id } = useParams(),
    state = useResource(`/attempts/${id}`),
    navigate = useNavigate();
  const [run, busy] = useAction();
  return (
    <Resource state={state}>
      {(d) => {
        if (!d.result)
          return (
            <Empty
              title="You’re still making progress"
              text="Finish your exam to see the review."
            >
              <Link className="button primary" to={`/exam/${id}`}>
                Resume exam
              </Link>
            </Empty>
          );
        const r = d.result;
        return (
          <>
            <Link className="back-link" to="/exams">
              <ArrowLeft size={16} />
              All knowledge checks
            </Link>
            <div className="result-hero">
              <img src="/art/trophy.svg" alt="" />
              <span className="eyebrow">ANOTHER STEP FORWARD</span>
              <h1>
                {r.score >= 70
                  ? "Look at you grow."
                  : "Every attempt is a fresh start."}
              </h1>
              <p>
                {d.title} · {dateLabel(d.submitted_at)}
              </p>
              <div className="score-ring" style={{ "--score": `${r.score}%` }}>
                <div>
                  <strong>
                    {r.score}
                    <small>%</small>
                  </strong>
                  <span>
                    {r.correct} of {r.total} correct
                  </span>
                </div>
              </div>
              <div className="button-row">
                <button
                  className="button primary"
                  disabled={busy}
                  onClick={() =>
                    run(async () => {
                      const a = await api(`/exams/${d.exam_id}/start`, {
                        method: "POST",
                        body: {},
                      });
                      navigate(`/exam/${a.id}`);
                    })
                  }
                >
                  <RefreshCw size={16} />
                  Try again
                </button>
                <Link className="button secondary" to="/leaderboard">
                  View leaderboard
                </Link>
              </div>
            </div>
            <SectionTitle title="Let’s learn from every answer" />
            <div className="review-list">
              {r.review.map((q, i) => (
                <article className="panel review-card" key={q.id}>
                  <div className="review-title">
                    <span
                      className={`review-state ${q.isCorrect ? "correct" : "incorrect"}`}
                    >
                      {q.isCorrect ? (
                        <CheckCircle2 size={20} />
                      ) : (
                        <XCircle size={20} />
                      )}
                    </span>
                    <h3>
                      {i + 1}. {q.prompt}
                    </h3>
                    <Badge tone={q.isCorrect ? "mint" : "rose"}>
                      {q.isCorrect
                        ? "Correct"
                        : q.selected === null
                          ? "Unanswered"
                          : "Keep practicing"}
                    </Badge>
                  </div>
                  <div className="review-options">
                    {q.options.map((o, j) => (
                      <div
                        className={`${j === q.correct ? "correct" : ""} ${j === q.selected && j !== q.correct ? "incorrect" : ""}`}
                        key={j}
                      >
                        <span>{String.fromCharCode(65 + j)}</span>
                        {o}
                        {j === q.correct && <Check size={16} />}{" "}
                        {j === q.selected && <small>Your answer</small>}
                      </div>
                    ))}
                  </div>
                  <p className="explanation">
                    <strong>Why?</strong> {q.explanation}
                  </p>
                </article>
              ))}
            </div>
          </>
        );
      }}
    </Resource>
  );
}
export function Leaderboard() {
  const state = useResource("/leaderboard"),
    { user } = useApp();
  return (
    <>
      <PageHead
        eyebrow="GROWING IS BETTER TOGETHER"
        title="A little friendly inspiration."
        description="Celebrate your community. Points are the sum of your best scores across exams."
      />
      <Resource state={state}>
        {(d) => (
          <>
            {d.leaders.length ? (
              <>
                <div className="podium">
                  {d.leaders.slice(0, 3).map((u, i) => (
                    <div className={`podium-card place-${i + 1}`} key={u.id}>
                      <span className="podium-place">
                        {i === 0 ? "♛" : i + 1}
                      </span>
                      <Avatar name={u.name} size="large" />
                      <h3>
                        {u.name}
                        {u.id === user.id ? " (you)" : ""}
                      </h3>
                      <strong>
                        {u.points}
                        <span> points</span>
                      </strong>
                      <p>
                        {u.exams} exam{u.exams !== 1 ? "s" : ""} · {u.average}%
                        average
                      </p>
                    </div>
                  ))}
                </div>
                <div className="panel table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Learner</th>
                        <th>Exams</th>
                        <th>Best-score average</th>
                        <th>Total points</th>
                      </tr>
                    </thead>
                    <tbody>
                      {d.leaders.map((u, i) => (
                        <tr
                          key={u.id}
                          className={u.id === user.id ? "your-row" : ""}
                        >
                          <td>
                            <strong>#{i + 1}</strong>
                          </td>
                          <td>
                            <div className="instructor">
                              <Avatar name={u.name} size="small" />
                              <strong>
                                {u.name}
                                {u.id === user.id ? " · You" : ""}
                              </strong>
                            </div>
                          </td>
                          <td>{u.exams}</td>
                          <td>{u.average}%</td>
                          <td>
                            <strong>{u.points}</strong>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <Empty
                title="Be the first to set a milestone"
                text="Complete an exam to join the leaderboard."
              />
            )}
            <p className="footnote">
              Repeated attempts count only your best score per exam. The demo
              starts with three sample learners.
            </p>
          </>
        )}
      </Resource>
    </>
  );
}
