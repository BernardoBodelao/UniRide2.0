import { useCallback, useEffect, useMemo, useState } from "react";
import Icon from "./Icon";
import { ToastContext } from "../contexts/toast-context";

let nextToastId = 0;

const ICONS = { success: "check", error: "alert", info: "info" };

function ToastItem({ toast, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), toast.type === "error" ? 8000 : 5000);
    return () => clearTimeout(timer);
  }, [toast.id, toast.type, onDismiss]);

  return (
    <div className={`toast toast--${toast.type}`} role={toast.type === "error" ? "alert" : "status"}>
      <Icon name={ICONS[toast.type]} />
      <p className="toast__text">{toast.message}</p>
      <button type="button" className="toast__close" onClick={() => onDismiss(toast.id)} aria-label="Fechar aviso">
        <Icon name="x" size={18} />
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => setToasts((items) => items.filter((item) => item.id !== id)), []);
  const show = useCallback((message, type) => {
    nextToastId += 1;
    setToasts((items) => [...items.slice(-2), { id: nextToastId, message, type }]);
  }, []);

  const value = useMemo(
    () => ({
      success: (message) => show(message, "success"),
      error: (message) => show(message, "error"),
      info: (message) => show(message, "info"),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
