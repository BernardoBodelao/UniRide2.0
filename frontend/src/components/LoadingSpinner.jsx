export default function LoadingSpinner({ label = "Carregando..." }) {
  return (
    <div className="loading" role="status">
      <span className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function RideSkeletonList({ count = 3 }) {
  return (
    <div className="ride-list" role="status" aria-label="Buscando caronas">
      {Array.from({ length: count }, (_, index) => (
        <div className="ride ride--skeleton" key={index} aria-hidden="true">
          <span className="skeleton skeleton--time" />
          <span className="skeleton-stack">
            <span className="skeleton skeleton--line" />
            <span className="skeleton skeleton--line skeleton--short" />
          </span>
          <span className="skeleton skeleton--button" />
        </div>
      ))}
    </div>
  );
}
