import { useCallback, useEffect, useState } from "react";
export async function api(path, options = {}) {
  const { body, ...rest } = options;
  const response = await fetch(`/api${path}`, {
    credentials: "include",
    ...rest,
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...rest.headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response
    .json()
    .catch(() => ({ error: "The server returned an unreadable response." }));
  if (!response.ok) {
    if (response.status === 401 && !path.startsWith("/auth/"))
      window.dispatchEvent(new Event("session-expired"));
    const e = new Error(data.error || "Something went wrong.");
    e.status = response.status;
    throw e;
  }
  if (path === "/notifications/read")
    window.dispatchEvent(new Event("notifications-changed"));
  return data;
}
export function useResource(path) {
  const [state, setState] = useState({
    data: null,
    loading: true,
    error: null,
  });
  const [key, setKey] = useState(0);
  const reload = useCallback(() => setKey((k) => k + 1), []);
  useEffect(() => {
    if (!path) {
      setState({ data: null, loading: false, error: null });
      return;
    }
    const c = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));
    api(path, { signal: c.signal })
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((e) => {
        if (e.name !== "AbortError")
          setState({ data: null, loading: false, error: e.message });
      });
    return () => c.abort();
  }, [path, key]);
  return { ...state, reload };
}
export const dateLabel = (value) =>
  new Date(
    typeof value === "number"
      ? value
      : value.replace(" ", "T") +
        (value.includes("T") || value.length === 10 ? "" : "Z"),
  ).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
export const initials = (name) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
export const subjects = [
  "Mathematics",
  "Geography",
  "Physics",
  "Biology",
  "Chemistry",
  "Computer Science",
];
