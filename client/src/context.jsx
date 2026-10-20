import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "./api";
const Context = createContext(null);
export function Provider({ children }) {
  const [user, setUser] = useState(null),
    [ready, setReady] = useState(false),
    [toast, setToast] = useState(null);
  useEffect(() => {
    api("/auth/me")
      .then((d) => setUser(d.user))
      .catch(() => {})
      .finally(() => setReady(true));
    const expired = () => setUser(null);
    window.addEventListener("session-expired", expired);
    return () => window.removeEventListener("session-expired", expired);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(timer);
  }, [toast]);
  const notify = (message, type = "success") =>
    setToast({ message, type, id: Date.now() });
  return (
    <Context.Provider value={{ user, setUser, ready, notify }}>
      {children}
      {toast && (
        <div
          className={`toast ${toast.type}`}
          role={toast.type === "error" ? "alert" : "status"}
        >
          {toast.type === "error" ? "!" : "✓"} <span>{toast.message}</span>
          <button
            aria-label="Dismiss notification"
            onClick={() => setToast(null)}
          >
            ×
          </button>
        </div>
      )}
    </Context.Provider>
  );
}
export const useApp = () => useContext(Context);
export function useAction() {
  const { notify } = useApp();
  const [busy, setBusy] = useState(false);
  const run = async (fn) => {
    setBusy(true);
    try {
      await fn();
      return true;
    } catch (e) {
      notify(e.message || "Unable to complete this action.", "error");
      return false;
    } finally {
      setBusy(false);
    }
  };
  return [run, busy];
}
