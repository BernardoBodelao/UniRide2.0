import Icon from "./Icon";
import RideRoute from "./RideRoute";
import SeatMeter from "./SeatMeter";
import { initialOf, whatsappLink } from "../utils/format";

// pending: "join" | "leave" | null — qual ação desta carona está em andamento.
export default function RideCard({ ride, currentUserId, pending, onJoin, onLeave }) {
  const isOwner = ride.driver_id === currentUserId;
  const remaining = Number(ride.seats_remaining ?? 0);
  const busy = Boolean(pending);
  const whatsapp = ride.is_participating ? whatsappLink(ride.driver_phone) : null;

  return (
    <article className={`ride ${ride.is_participating ? "ride--joined" : ""}`.trim()}>
      <div className="ride__when">
        <time className="ride__time" dateTime={ride.ride_time}>
          {ride.ride_time}
        </time>
        <span className="ride__when-label">saída</span>
      </div>

      <div className="ride__body">
        <RideRoute from={ride.from_loc} to={ride.to_loc} />
        <p className="ride__driver">
          <span className="avatar avatar--sm" aria-hidden="true">
            {initialOf(ride.driver, "?")}
          </span>
          <span>
            Motorista <strong>{ride.driver || "sem nome no perfil"}</strong>
          </span>
        </p>
      </div>

      <div className="ride__aside">
        <SeatMeter total={ride.seats} taken={ride.participant_count || 0} />

        <div className="ride__actions">
          {isOwner ? (
            <span className="chip">Sua carona</span>
          ) : ride.is_participating ? (
            <>
              <span className="chip chip--success">
                <Icon name="check" size={16} /> Você está nesta carona
              </span>
              {whatsapp && (
                <a className="btn btn--secondary btn--block" href={whatsapp} target="_blank" rel="noopener noreferrer">
                  <Icon name="chat" /> Falar com o motorista
                </a>
              )}
              <button type="button" className="btn btn--danger-outline btn--block" disabled={busy} onClick={() => onLeave(ride.id)}>
                {pending === "leave" ? "Saindo..." : "Sair da carona"}
              </button>
            </>
          ) : (
            <button type="button" className="btn btn--primary btn--block" disabled={busy || remaining <= 0} onClick={() => onJoin(ride.id)}>
              {pending === "join" ? "Entrando..." : remaining <= 0 ? "Sem vagas" : "Entrar na carona"}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
