import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

import "./Toast.css";

const ToastContext = createContext(null);

function randomId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timeoutsRef = useRef(new Map());

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const t = timeoutsRef.current.get(id);
    if (t) {
      clearTimeout(t);
      timeoutsRef.current.delete(id);
    }
  }, []);

  const pushToast = useCallback(
    (message, opts = {}) => {
      const { type = "info", title, duration = 3200 } = opts;

      const id = randomId();
      const toast = { id, type, title, message };

      setToasts((prev) => {
        const next = [toast, ...prev];
        return next.slice(0, 4);
      });

      if (duration > 0) {
        const timeoutId = setTimeout(() => removeToast(id), duration);
        timeoutsRef.current.set(id, timeoutId);
      }

      return id;
    },
    [removeToast],
  );

  const api = useMemo(
    () => ({ pushToast, removeToast }),
    [pushToast, removeToast],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastHost toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used inside <ToastProvider>");
  }
  return ctx;
}

function ToastHost({ toasts, onDismiss }) {
  return (
    <div
      className="toast-viewport"
      aria-live="polite"
      aria-relevant="additions"
    >
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast--${t.type}`} role="status">
          <div className="toast-body">
            {t.title && <div className="toast-title">{t.title}</div>}
            <div className="toast-msg">{t.message}</div>
          </div>
          <button
            type="button"
            className="toast-x"
            onClick={() => onDismiss(t.id)}
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
