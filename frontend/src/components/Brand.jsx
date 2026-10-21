// A marca: um "U" desenhado como trajeto, com um ponto de saída e um de chegada.
export function BrandMark({ size = 32, tone = "dark" }) {
  const light = tone === "light";
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <rect width="32" height="32" rx="9" fill={light ? "#FFFFFF" : "#0D2A4A"} />
      <path
        d="M10.5 9v8.5a5.5 5.5 0 0 0 11 0V9"
        fill="none"
        stroke={light ? "#0D2A4A" : "#FFFFFF"}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <circle cx="10.5" cy="9" r="2.6" fill={light ? "#0A7A62" : "#2FD0A0"} />
      <circle cx="21.5" cy="9" r="2.1" fill={light ? "#FFFFFF" : "#0D2A4A"} stroke={light ? "#0A7A62" : "#2FD0A0"} strokeWidth="1.8" />
    </svg>
  );
}

export default function Brand({ tone = "dark" }) {
  return (
    <span className={`brand brand--${tone}`}>
      <BrandMark tone={tone} />
      <span className="brand__name">UniRide</span>
    </span>
  );
}
