import { useId, useState } from "react";
import Icon from "./Icon";

// Campo de formulário com rótulo visível, dica e erro ligados por aria-describedby.
// `marker` ("origin" | "destination") desenha o ponto de saída/chegada dentro do campo.
export default function Field({ id, label, hint, error, marker, multiline = false, revealable = false, className = "", ...inputProps }) {
  const generatedId = useId();
  const fieldId = id || generatedId;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  const [revealed, setRevealed] = useState(false);

  const Control = multiline ? "textarea" : "input";
  const type = revealable ? (revealed ? "text" : "password") : inputProps.type;

  return (
    <div className={`field ${error ? "field--invalid" : ""} ${className}`.trim()}>
      <label className="field__label" htmlFor={fieldId}>
        {label}
      </label>
      <div className="field__control">
        {marker && <span className={`marker marker--${marker}`} aria-hidden="true" />}
        <Control
          id={fieldId}
          className={`field__input ${marker ? "field__input--marked" : ""} ${revealable ? "field__input--trailing" : ""}`.trim()}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
          {...inputProps}
          type={multiline ? undefined : type}
        />
        {revealable && (
          <button
            type="button"
            className="field__toggle"
            onClick={() => setRevealed((value) => !value)}
            aria-label={revealed ? "Ocultar senha" : "Mostrar senha"}
            aria-pressed={revealed}
          >
            <Icon name={revealed ? "eye-off" : "eye"} />
          </button>
        )}
      </div>
      {hint && (
        <p className="field__hint" id={hintId}>
          {hint}
        </p>
      )}
      {error && (
        <p className="field__error" id={errorId}>
          <Icon name="alert" size={16} />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
