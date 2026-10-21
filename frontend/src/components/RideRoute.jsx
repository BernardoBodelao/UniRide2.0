// Trajeto como linha: ponto cheio na origem, anel no destino. É o mesmo desenho da marca.
export default function RideRoute({ from, to, emptyFrom = "Origem não informada", emptyTo = "Destino não informado" }) {
  return (
    <ol className="route" aria-label="Trajeto">
      <li className="route__stop route__stop--origin">
        <span className="route__label">Origem</span>
        <span className={`route__place ${from ? "" : "route__place--empty"}`.trim()}>{from || emptyFrom}</span>
      </li>
      <li className="route__stop route__stop--destination">
        <span className="route__label">Destino</span>
        <span className={`route__place ${to ? "" : "route__place--empty"}`.trim()}>{to || emptyTo}</span>
      </li>
    </ol>
  );
}
