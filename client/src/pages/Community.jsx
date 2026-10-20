import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  MessageCircle,
  Users,
  Trash2,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";
import { api, useResource } from "../api";
import { useApp, useAction } from "../context";
import {
  Resource,
  PageHead,
  Avatar,
  IconButton,
  Empty,
  ErrorBox,
} from "../components/UI";
export default function Community() {
  const rooms = useResource("/rooms"),
    { user, notify } = useApp();
  const [room, setRoom] = useState(null),
    [messages, setMessages] = useState([]),
    [body, setBody] = useState(""),
    [error, setError] = useState(null),
    [mobileChat, setMobileChat] = useState(false),
    [loading, setLoading] = useState(false);
  const [run, busy] = useAction();
  const scrollRef = useRef(),
    roomRef = useRef(null),
    lastId = useRef(null),
    sendLock = useRef(false);
  useEffect(() => {
    if (rooms.data?.rooms.length && !room) setRoom(rooms.data.rooms[0]);
  }, [rooms.data, room]);
  useEffect(() => {
    if (!room) return;
    let active = true;
    roomRef.current = room.id;
    lastId.current = null;
    setLoading(true);
    setMessages([]);
    const load = async () => {
      try {
        const d = await api(`/rooms/${room.id}/messages`);
        if (active) {
          setMessages(d.messages);
          setError(null);
          setLoading(false);
        }
      } catch (e) {
        if (active) {
          setError(e.message);
          setLoading(false);
        }
      }
    };
    load();
    const timer = setInterval(load, 3000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [room?.id]);
  useEffect(() => {
    const newest = messages.at(-1)?.id;
    if (newest !== lastId.current) {
      const el = scrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
      lastId.current = newest;
    }
  }, [messages]);
  const send = (e) => {
    e.preventDefault();
    if (!body.trim() || !room || sendLock.current) return;
    sendLock.current = true;
    run(async () => {
      const id = room.id,
        text = body;
      const d = await api(`/rooms/${id}/messages`, {
        method: "POST",
        body: { body: text },
      });
      if (roomRef.current === id) {
        setMessages((ms) =>
          ms.some((m) => m.id === d.message.id) ? ms : [...ms, d.message],
        );
        setBody("");
      }
      rooms.reload();
    }).finally(() => {
      sendLock.current = false;
    });
  };
  return (
    <>
      <PageHead
        eyebrow="GOOD QUESTIONS DESERVE GOOD COMPANY"
        title="Learning is better together."
        description="Ask a question, share an idea, or celebrate a small win with your study community."
      />
      <div
        className={`community-layout panel ${mobileChat ? "chat-open" : ""}`}
      >
        <aside className="room-list">
          <div className="room-list-head">
            <h2>Your study rooms</h2>
            <span className="mini-icon">
              <Users size={18} />
            </span>
          </div>
          <Resource state={rooms}>
            {(d) =>
              d.rooms.map((r, i) => (
                <button
                  key={r.id}
                  className={r.id === room?.id ? "active" : ""}
                  onClick={() => {
                    setRoom(r);
                    setMobileChat(true);
                    setBody("");
                  }}
                >
                  <span
                    className={`room-icon ${["sky", "peach", "mint"][i % 3]}`}
                  >
                    {["✦", "∑", "⚛"][i % 3]}
                  </span>
                  <span>
                    <strong>{r.name}</strong>
                    <small>
                      {user.settings.communityUpdates
                        ? r.last_message || r.description
                        : r.subject}
                    </small>
                  </span>
                  <span className="room-count">{r.messages}</span>
                </button>
              ))
            }
          </Resource>
          <div className="community-guidelines">
            <MessageCircle size={24} />
            <h4>A little kindness goes a long way.</h4>
            <p>
              Keep conversations respectful and relevant. Study rooms are
              visible to all signed-in learners.
            </p>
            <small>Messages refresh every 3 seconds.</small>
          </div>
        </aside>
        <section className="chat-room">
          {room ? (
            <>
              <div className="chat-header">
                <IconButton
                  label="Back to rooms"
                  className="icon-button room-back"
                  onClick={() => setMobileChat(false)}
                >
                  <ArrowLeft size={19} />
                </IconButton>
                <span className="room-icon sky">
                  <MessageCircle size={22} />
                </span>
                <span>
                  <h3>{room.name}</h3>
                  <small>{room.description}</small>
                </span>
                <span className="chat-public">
                  <Users size={15} />
                  Public room
                </span>
              </div>
              {error && <ErrorBox error={error} />}
              <div
                className="message-list"
                ref={scrollRef}
                aria-label="Room messages"
                aria-live="polite"
              >
                {loading ? (
                  <p className="muted">Loading the conversation…</p>
                ) : messages.length ? (
                  messages.map((m, i) => (
                    <div
                      className={`message ${m.user_id === user.id ? "mine" : ""}`}
                      key={m.id}
                    >
                      <Avatar name={m.name} size="small" />
                      <div>
                        <div className="message-author">
                          <strong>
                            {m.user_id === user.id ? "You" : m.name}
                          </strong>
                          <time>
                            {new Date(
                              m.created_at.replace(" ", "T") + "Z",
                            ).toLocaleTimeString(undefined, {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </time>
                        </div>
                        <div className="message-bubble">{m.body}</div>
                      </div>
                      {(m.user_id === user.id || user.role === "admin") && (
                        <IconButton
                          label="Delete message"
                          onClick={() =>
                            run(async () => {
                              await api(`/messages/${m.id}`, {
                                method: "DELETE",
                                body: {},
                              });
                              setMessages((ms) =>
                                ms.filter((x) => x.id !== m.id),
                              );
                              rooms.reload();
                            })
                          }
                        >
                          <Trash2 size={14} />
                        </IconButton>
                      )}
                    </div>
                  ))
                ) : (
                  <Empty
                    icon={MessageCircle}
                    title="Start something good"
                    text="Be the first to say hello or share a question."
                  />
                )}
              </div>
              <form className="message-composer" onSubmit={send}>
                <label className="sr-only" htmlFor="message">
                  Your message
                </label>
                <input
                  id="message"
                  maxLength={2000}
                  placeholder={`Say something to ${room.name.toLowerCase()}…`}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  autoComplete="off"
                />
                <button
                  className="button primary"
                  disabled={busy || !body.trim()}
                  aria-label="Send message"
                >
                  <Send size={19} />
                </button>
              </form>
              <p className="chat-caption">
                A shared learning space. Please avoid posting personal
                information.
              </p>
            </>
          ) : (
            <Empty title="Choose a study room" />
          )}
        </section>
      </div>
    </>
  );
}
