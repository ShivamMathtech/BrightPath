import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Clock,
  Check,
  AlertCircle,
  X,
  Search,
  ChevronRight,
} from "lucide-react";
import { initials } from "../api";
export function IconButton({ label, children, ...props }) {
  return (
    <button className="icon-button" title={label} aria-label={label} {...props}>
      {children}
    </button>
  );
}
export function Avatar({ name = "Learner", size = "medium", color = "" }) {
  return (
    <span className={`avatar ${size} ${color}`} aria-hidden="true">
      {initials(name)}
    </span>
  );
}
export function Badge({ children, tone = "" }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}
export function Progress({ value, label }) {
  return (
    <div className="progress-wrap">
      {label && (
        <div className="progress-label">
          <span>{label}</span>
          <strong>{Math.round(value)}%</strong>
        </div>
      )}
      <div
        className="progress"
        role="progressbar"
        aria-label={label || "Course completion"}
        aria-valuenow={Math.round(value)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <span style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
    </div>
  );
}
export function Loading() {
  return (
    <div className="loading" role="status">
      <span className="spinner" /> Getting everything ready…
    </div>
  );
}
export function Empty({
  title = "Nothing here yet",
  text,
  children,
  icon: Icon = BookOpen,
}) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Icon size={30} />
      </span>
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {children}
    </div>
  );
}
export function ErrorBox({ error, retry }) {
  return (
    <div className="error-box" role="alert">
      <AlertCircle size={20} />
      <span>{error}</span>
      {retry && (
        <button className="text-button" onClick={retry}>
          Try again
        </button>
      )}
    </div>
  );
}
export function Resource({ state, children }) {
  if (state.loading && !state.data) return <Loading />;
  if (state.error) return <ErrorBox error={state.error} retry={state.reload} />;
  return state.data ? children(state.data) : null;
}
export function PageHead({ eyebrow, title, description, children }) {
  return (
    <div className="page-head">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {children && <div className="page-actions">{children}</div>}
    </div>
  );
}
export function SectionTitle({ title, to, action = "View all", children }) {
  return (
    <div className="section-title">
      <h2>{title}</h2>
      {to ? (
        <Link className="text-link" to={to}>
          {action}
          <ArrowRight size={16} />
        </Link>
      ) : (
        children
      )}
    </div>
  );
}
export function SearchField({
  value,
  onChange,
  placeholder = "Search…",
  label = "Search",
}) {
  return (
    <label className="search-field">
      <Search size={18} />
      <span className="sr-only">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onChange("")}
        >
          <X size={16} />
        </button>
      )}
    </label>
  );
}
export function CourseCard({ course, compact = false }) {
  const percent = course.lesson_count
    ? (course.completed / course.lesson_count) * 100
    : 0;
  return (
    <article className={`course-card ${compact ? "compact" : ""}`}>
      <Link
        to={`/courses/${course.id}`}
        className={`course-art ${course.color}`}
      >
        <img src={`/art/${course.art}.svg`} alt="" />
        <span className="art-badge">{course.level}</span>
      </Link>
      <div className="course-info">
        <span className={`subject-label ${course.color}`}>
          {course.subject}
        </span>
        <Link to={`/courses/${course.id}`}>
          <h3>{course.title}</h3>
        </Link>
        <p>{course.subtitle}</p>
        <div className="course-meta">
          <span>
            <BookOpen size={14} />
            {course.lesson_count} lessons
          </span>
          <span>
            <Clock size={14} />
            {course.minutes} min
          </span>
        </div>
        {!!course.enrolled ? (
          <>
            <Progress value={percent} />
            <div className="card-bottom">
              <span>
                {course.completed} of {course.lesson_count} completed
              </span>
              <Link
                to={`/courses/${course.id}`}
                aria-label={`Continue ${course.title}`}
              >
                <ChevronRight size={19} />
              </Link>
            </div>
          </>
        ) : (
          <div className="card-bottom">
            <div className="instructor">
              <Avatar size="tiny" name={course.instructor} />
              <span>{course.instructor}</span>
            </div>
            <Link
              to={`/courses/${course.id}`}
              aria-label={`Explore ${course.title}`}
            >
              <ArrowRight size={18} />
            </Link>
          </div>
        )}
      </div>
    </article>
  );
}
export function Modal({ title, children, onClose, wide = false }) {
  const ref = useRef();
  useEffect(() => {
    const d = ref.current;
    d.showModal();
    const cancel = (e) => {
      e.preventDefault();
      onClose();
    };
    d.addEventListener("cancel", cancel);
    return () => {
      d.removeEventListener("cancel", cancel);
      d.close();
    };
  }, [onClose]);
  return (
    <dialog
      ref={ref}
      className={`modal ${wide ? "wide" : ""}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-head">
        <h2>{title}</h2>
        <IconButton label="Close dialog" onClick={onClose}>
          <X size={20} />
        </IconButton>
      </div>
      {children}
    </dialog>
  );
}
export function Toggle({ checked, onChange, label, description, disabled }) {
  return (
    <label className="toggle-row">
      <span>
        <strong>{label}</strong>
        {description && <small>{description}</small>}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
      />
      <span className="switch" aria-hidden="true" />
    </label>
  );
}
export function CheckLine({ children }) {
  return (
    <div className="check-line">
      <Check size={16} />
      {children}
    </div>
  );
}
