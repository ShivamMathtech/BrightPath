import React, { useState, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Plus,
  Edit3,
  BookOpen,
  Users,
  ClipboardCheck,
  ArrowLeft,
  Save,
  Eye,
  EyeOff,
  Trash2,
  ChevronRight,
} from "lucide-react";
import { api, useResource, subjects, dateLabel } from "../api";
import { useApp, useAction } from "../context";
import {
  Resource,
  PageHead,
  Modal,
  Badge,
  Avatar,
  Empty,
  SectionTitle,
  Toggle,
} from "../components/UI";
const emptyCourse = {
  title: "",
  subject: "Mathematics",
  subtitle: "",
  description: "",
  instructor: "",
  level: "Beginner",
  color: "sky",
  art: "math",
};
const emptyQuestion = () => ({
  prompt: "",
  options: ["", "", "", ""],
  correct: 0,
  explanation: "",
});
export default function Admin() {
  const state = useResource("/admin/overview"),
    { notify } = useApp(),
    [run, busy] = useAction();
  const [tab, setTab] = useState("courses"),
    [modal, setModal] = useState(null),
    [form, setForm] = useState(emptyCourse),
    [exam, setExam] = useState(null),
    [examId, setExamId] = useState(null);
  const close = useCallback(() => setModal(null), []);
  const newExam = () => {
    setExamId(null);
    setExam({
      title: "",
      subject: "Mathematics",
      course_id: state.data.courses[0]?.id || "",
      minutes: 10,
      published: false,
      questions: [emptyQuestion()],
    });
    setModal("exam");
  };
  const editExam = (id) =>
    run(async () => {
      const d = await api(`/admin/exams/${id}`);
      setExam({ ...d.exam, questions: d.questions });
      setExamId(id);
      setModal("exam");
    });
  return (
    <>
      <PageHead
        eyebrow="HELP CURIOUS MINDS GROW"
        title="Your teaching workspace."
        description="Create thoughtful lessons, build knowledge checks, and keep an eye on your learning community."
      />
      <Resource state={state}>
        {(d) => (
          <>
            <div className="stats-row">
              <div className="stat">
                <span className="stat-icon sky">
                  <Users />
                </span>
                <div>
                  <strong>{d.users.length}</strong>
                  <small>Registered members</small>
                </div>
              </div>
              <div className="stat">
                <span className="stat-icon mint">
                  <BookOpen />
                </span>
                <div>
                  <strong>{d.counts.enrollments}</strong>
                  <small>Course enrollments</small>
                </div>
              </div>
              <div className="stat">
                <span className="stat-icon peach">
                  <ClipboardCheck />
                </span>
                <div>
                  <strong>{d.counts.attempts}</strong>
                  <small>Completed attempts</small>
                </div>
              </div>
            </div>
            <div className="admin-toolbar">
              <div className="filter-chips">
                {["courses", "exams", "learners"].map((t) => (
                  <button
                    className={tab === t ? "active" : ""}
                    key={t}
                    onClick={() => setTab(t)}
                  >
                    {t[0].toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
              {tab === "courses" && (
                <button
                  className="button primary"
                  onClick={() => {
                    setForm({ ...emptyCourse, instructor: "Aisha Verma" });
                    setModal("course");
                  }}
                >
                  <Plus size={17} />
                  Create course
                </button>
              )}
              {tab === "exams" && (
                <button className="button primary" onClick={newExam}>
                  <Plus size={17} />
                  Create exam
                </button>
              )}
            </div>
            {tab === "courses" && (
              <div className="panel table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Course</th>
                      <th>Lessons</th>
                      <th>Visibility</th>
                      <th>Manage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.courses.map((c) => (
                      <tr key={c.id}>
                        <td>
                          <strong>{c.title}</strong>
                          <small>{c.subject}</small>
                        </td>
                        <td>{c.lesson_count}</td>
                        <td>
                          <button
                            className="text-button"
                            disabled={busy}
                            onClick={() =>
                              run(async () => {
                                await api(`/admin/courses/${c.id}`, {
                                  method: "PATCH",
                                  body: { published: !c.published },
                                });
                                state.reload();
                                notify(
                                  c.published
                                    ? "Course hidden from the catalog."
                                    : "Course published.",
                                );
                              })
                            }
                          >
                            <Badge tone={c.published ? "mint" : ""}>
                              {c.published ? "Published" : "Draft"}
                            </Badge>
                            {c.published ? (
                              <Eye size={14} />
                            ) : (
                              <EyeOff size={14} />
                            )}
                          </button>
                        </td>
                        <td>
                          <Link
                            className="text-link"
                            to={`/admin/courses/${c.id}`}
                          >
                            Edit course
                            <Edit3 size={15} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {tab === "exams" && (
              <div className="panel table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Knowledge check</th>
                      <th>Questions</th>
                      <th>Time</th>
                      <th>Status</th>
                      <th>Edit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.exams.map((e) => (
                      <tr key={e.id}>
                        <td>
                          <strong>{e.title}</strong>
                          <small>{e.subject}</small>
                        </td>
                        <td>{e.question_count}</td>
                        <td>{e.minutes} min</td>
                        <td>
                          <Badge tone={e.published ? "mint" : ""}>
                            {e.published ? "Published" : "Draft"}
                          </Badge>
                        </td>
                        <td>
                          <button
                            className="text-button"
                            disabled={busy}
                            onClick={() => editExam(e.id)}
                          >
                            Edit
                            <Edit3 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {tab === "learners" && (
              <div className="panel table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Learner</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.users.map((u) => (
                      <tr key={u.id}>
                        <td>
                          <div className="instructor">
                            <Avatar name={u.name} size="small" />
                            <strong>{u.name}</strong>
                          </div>
                        </td>
                        <td>{u.email}</td>
                        <td>
                          <Badge tone={u.role === "admin" ? "peach" : "sky"}>
                            {u.role}
                          </Badge>
                        </td>
                        <td>{dateLabel(u.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </Resource>
      {modal === "course" && (
        <Modal title="A new learning journey" onClose={close} wide>
          <form
            className="form-stack"
            onSubmit={(e) => {
              e.preventDefault();
              run(async () => {
                await api("/admin/courses", { method: "POST", body: form });
                close();
                state.reload();
                notify("Course created as a draft. Add lessons to publish it.");
              });
            }}
          >
            <CourseFields form={form} setForm={setForm} />
            <button className="button primary" disabled={busy}>
              Create course
            </button>
          </form>
        </Modal>
      )}
      {modal === "exam" && exam && (
        <Modal
          title={
            examId ? "Shape this knowledge check" : "Create a knowledge check"
          }
          onClose={close}
          wide
        >
          <form
            className="form-stack"
            onSubmit={(e) => {
              e.preventDefault();
              run(async () => {
                await api(examId ? `/admin/exams/${examId}` : "/admin/exams", {
                  method: examId ? "PUT" : "POST",
                  body: exam,
                });
                close();
                state.reload();
                notify(
                  "Knowledge check saved. Existing attempts keep their original questions.",
                );
              });
            }}
          >
            <label>
              Title
              <input
                required
                minLength={3}
                maxLength={120}
                value={exam.title}
                onChange={(e) => setExam({ ...exam, title: e.target.value })}
              />
            </label>
            <div className="form-columns">
              <label>
                Course
                <select
                  value={exam.course_id}
                  onChange={(e) =>
                    setExam({ ...exam, course_id: e.target.value })
                  }
                >
                  {state.data?.courses.map((c) => (
                    <option value={c.id} key={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Subject
                <select
                  value={exam.subject}
                  onChange={(e) =>
                    setExam({ ...exam, subject: e.target.value })
                  }
                >
                  {subjects.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="form-columns">
              <label>
                Time limit (minutes)
                <input
                  type="number"
                  required
                  min={1}
                  max={180}
                  value={exam.minutes}
                  onChange={(e) =>
                    setExam({ ...exam, minutes: Number(e.target.value) })
                  }
                />
              </label>
              <Toggle
                label="Published"
                checked={exam.published}
                onChange={(published) => setExam({ ...exam, published })}
              />
            </div>
            <SectionTitle title="Questions" />
            {exam.questions.map((q, i) => (
              <QuestionEditor
                key={i}
                question={q}
                number={i + 1}
                canRemove={exam.questions.length > 1}
                onChange={(v) =>
                  setExam({
                    ...exam,
                    questions: exam.questions.map((x, j) => (i === j ? v : x)),
                  })
                }
                onRemove={() =>
                  setExam({
                    ...exam,
                    questions: exam.questions.filter((_, j) => j !== i),
                  })
                }
              />
            ))}
            <div className="button-row">
              <button
                type="button"
                className="button secondary"
                disabled={exam.questions.length >= 100}
                onClick={() =>
                  setExam({
                    ...exam,
                    questions: [...exam.questions, emptyQuestion()],
                  })
                }
              >
                <Plus size={16} />
                Add question
              </button>
              <button className="button primary" disabled={busy}>
                <Save size={16} />
                Save knowledge check
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
function CourseFields({ form, setForm }) {
  const field = (key, value) => setForm({ ...form, [key]: value });
  return (
    <>
      <label>
        Course title
        <input
          required
          minLength={3}
          maxLength={120}
          value={form.title}
          onChange={(e) => field("title", e.target.value)}
        />
      </label>
      <label>
        Short description
        <input
          maxLength={180}
          value={form.subtitle}
          onChange={(e) => field("subtitle", e.target.value)}
        />
      </label>
      <label>
        About the course
        <textarea
          required
          minLength={20}
          maxLength={4000}
          rows={4}
          value={form.description}
          onChange={(e) => field("description", e.target.value)}
        />
      </label>
      <div className="form-columns">
        <label>
          Subject
          <select
            value={form.subject}
            onChange={(e) => field("subject", e.target.value)}
          >
            {subjects.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label>
          Instructor
          <input
            required
            minLength={2}
            maxLength={80}
            value={form.instructor}
            onChange={(e) => field("instructor", e.target.value)}
          />
        </label>
      </div>
      <div className="form-columns">
        <label>
          Level
          <select
            value={form.level}
            onChange={(e) => field("level", e.target.value)}
          >
            {["Beginner", "Intermediate", "Advanced"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label>
          Artwork
          <select
            value={form.art}
            onChange={(e) => field("art", e.target.value)}
          >
            {["math", "earth", "physics", "biology", "chemistry", "code"].map(
              (s) => (
                <option key={s}>{s}</option>
              ),
            )}
          </select>
        </label>
        <label>
          Color
          <select
            value={form.color}
            onChange={(e) => field("color", e.target.value)}
          >
            {["sky", "peach", "mint", "lavender", "rose", "yellow"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
      </div>
    </>
  );
}
function QuestionEditor({
  question: q,
  onChange,
  number,
  canRemove,
  onRemove,
}) {
  return (
    <fieldset className="question-editor">
      <legend>Question {number}</legend>
      <label>
        Question
        <input
          required
          minLength={5}
          maxLength={1000}
          value={q.prompt}
          onChange={(e) => onChange({ ...q, prompt: e.target.value })}
        />
      </label>
      <div className="form-columns">
        {q.options.map((o, i) => (
          <label key={i}>
            Option {String.fromCharCode(65 + i)}
            <input
              required
              maxLength={500}
              value={o}
              onChange={(e) =>
                onChange({
                  ...q,
                  options: q.options.map((x, j) =>
                    i === j ? e.target.value : x,
                  ),
                })
              }
            />
          </label>
        ))}
      </div>
      <label>
        Correct answer
        <select
          value={q.correct}
          onChange={(e) => onChange({ ...q, correct: Number(e.target.value) })}
        >
          {q.options.map((_, i) => (
            <option key={i} value={i}>
              Option {String.fromCharCode(65 + i)}
            </option>
          ))}
        </select>
      </label>
      <label>
        Explanation
        <textarea
          required
          minLength={5}
          maxLength={2000}
          rows={2}
          value={q.explanation}
          onChange={(e) => onChange({ ...q, explanation: e.target.value })}
        />
      </label>
      {canRemove && (
        <button type="button" className="text-button danger" onClick={onRemove}>
          <Trash2 size={15} />
          Remove question
        </button>
      )}
    </fieldset>
  );
}
export function AdminCourse() {
  const { id } = useParams(),
    state = useResource(`/courses/${id}`),
    { notify } = useApp(),
    [run, busy] = useAction();
  const [form, setForm] = useState(null),
    [lesson, setLesson] = useState(null);
  const close = useCallback(() => setLesson(null), []);
  return (
    <Resource state={state}>
      {(d) => (
        <>
          <Link className="back-link" to="/admin">
            <ArrowLeft size={16} />
            Teaching workspace
          </Link>
          <PageHead title={d.course.title} eyebrow="MAKE LEARNING MEANINGFUL">
            <Link className="button secondary" to={`/courses/${id}`}>
              <Eye size={16} />
              Preview course
            </Link>
          </PageHead>
          <div className="admin-course-layout">
            <section className="panel">
              <h2>Course details</h2>
              <form
                className="form-stack"
                onSubmit={(e) => {
                  e.preventDefault();
                  run(async () => {
                    await api(`/admin/courses/${id}`, {
                      method: "PATCH",
                      body: {
                        ...(form || d.course),
                        published: !!(form || d.course).published,
                      },
                    });
                    setForm(null);
                    state.reload();
                    notify("Course updated.");
                  });
                }}
              >
                <CourseFields form={form || d.course} setForm={setForm} />
                <Toggle
                  label="Published in the catalog"
                  description="Add at least one lesson before publishing."
                  checked={!!(form || d.course).published}
                  onChange={(v) =>
                    setForm({ ...d.course, ...form, published: v })
                  }
                />
                <button className="button primary" disabled={busy}>
                  <Save size={16} />
                  Save changes
                </button>
              </form>
            </section>
            <section className="panel">
              <SectionTitle title="Build the learning path">
                <button
                  className="button primary small"
                  onClick={() =>
                    setLesson({ title: "", content: "", minutes: 5, video: "" })
                  }
                >
                  <Plus size={15} />
                  Add lesson
                </button>
              </SectionTitle>
              <div className="admin-lesson-list">
                {d.lessons.map((l, i) => (
                  <button
                    key={l.id}
                    onClick={() => setLesson({ ...l, video: l.video || "" })}
                  >
                    <span className="lesson-number">{i + 1}</span>
                    <span>
                      <strong>{l.title}</strong>
                      <small>{l.minutes} minutes</small>
                    </span>
                    <Edit3 size={16} />
                  </button>
                ))}
              </div>
              {!d.lessons.length && (
                <Empty
                  title="Start with one good lesson"
                  text="Write a clear explanation, add a worked example, and invite learners to practice."
                />
              )}
              <p className="footnote">
                Video files can be placed in client/public/media. Enter their
                /media/filename.mp4 path when editing a lesson.
              </p>
            </section>
          </div>
          {lesson && (
            <Modal
              title={lesson.id ? "Edit lesson" : "A new step forward"}
              onClose={close}
              wide
            >
              <form
                className="form-stack"
                onSubmit={(e) => {
                  e.preventDefault();
                  run(async () => {
                    await api(
                      lesson.id
                        ? `/admin/lessons/${lesson.id}`
                        : `/admin/courses/${id}/lessons`,
                      { method: lesson.id ? "PATCH" : "POST", body: lesson },
                    );
                    close();
                    state.reload();
                    notify("Lesson saved.");
                  });
                }}
              >
                <label>
                  Title
                  <input
                    required
                    minLength={3}
                    maxLength={160}
                    value={lesson.title}
                    onChange={(e) =>
                      setLesson({ ...lesson, title: e.target.value })
                    }
                  />
                </label>
                <label>
                  Lesson content
                  <textarea
                    required
                    minLength={30}
                    maxLength={30000}
                    rows={12}
                    value={lesson.content}
                    onChange={(e) =>
                      setLesson({ ...lesson, content: e.target.value })
                    }
                  />
                  <small>Separate paragraphs with a blank line.</small>
                </label>
                <div className="form-columns">
                  <label>
                    Reading time (minutes)
                    <input
                      type="number"
                      required
                      min={1}
                      max={240}
                      value={lesson.minutes}
                      onChange={(e) =>
                        setLesson({
                          ...lesson,
                          minutes: Number(e.target.value),
                        })
                      }
                    />
                  </label>
                  <label>
                    Optional local video path
                    <input
                      value={lesson.video}
                      onChange={(e) =>
                        setLesson({ ...lesson, video: e.target.value })
                      }
                      placeholder="/media/waves.mp4"
                    />
                  </label>
                </div>
                <button className="button primary" disabled={busy}>
                  Save lesson
                </button>
              </form>
            </Modal>
          )}
        </>
      )}
    </Resource>
  );
}
