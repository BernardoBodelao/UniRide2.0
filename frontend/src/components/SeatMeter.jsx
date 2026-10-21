import { pluralize } from "../utils/format";

// Cada círculo é uma vaga: preenchido = ocupada, vazado = livre.
export default function SeatMeter({ total, taken }) {
  const remaining = Math.max(total - taken, 0);
  const label = remaining === 0 ? "Sem vagas" : `${remaining} ${pluralize(remaining, "vaga livre", "vagas livres")}`;
  return (
    <div className={`seats ${remaining === 1 ? "seats--last" : ""}`.trim()}>
      <span className="seats__pips" aria-hidden="true">
        {Array.from({ length: total }, (_, index) => (
          <span key={index} className={`seats__pip ${index < taken ? "is-taken" : ""}`.trim()} />
        ))}
      </span>
      <span className="seats__text">
        {label}
        <span className="visually-hidden"> de {total}</span>
      </span>
    </div>
  );
}
