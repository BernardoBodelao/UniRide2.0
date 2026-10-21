import { useEffect, useRef } from "react";

// Confirmação baseada no <dialog> nativo: o navegador cuida do foco preso e da tecla Esc.
export default function ConfirmDialog({ open, title, description, confirmLabel, busyLabel, busy = false, onConfirm, onCancel }) {
  const dialogRef = useRef(null);
  const cancelRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      cancelRef.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="dialog"
      aria-labelledby="dialog-title"
      aria-describedby="dialog-text"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onCancel();
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current && !busy) onCancel();
      }}
    >
      <div className="dialog__panel">
        <h2 className="dialog__title" id="dialog-title">
          {title}
        </h2>
        <p className="dialog__text" id="dialog-text">
          {description}
        </p>
        <div className="dialog__actions">
          <button ref={cancelRef} type="button" className="btn btn--secondary" onClick={onCancel} disabled={busy}>
            Cancelar
          </button>
          <button type="button" className="btn btn--danger" onClick={onConfirm} disabled={busy}>
            {busy ? busyLabel : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
