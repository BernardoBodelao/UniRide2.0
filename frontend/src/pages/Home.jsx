import { useState } from "react";
import { Link } from "react-router-dom";
import EmptyState from "../components/EmptyState";
import Field from "../components/Field";
import Icon from "../components/Icon";
import { RideSkeletonList } from "../components/LoadingSpinner";
import ProfileNotice from "../components/ProfileNotice";
import RideCard from "../components/RideCard";
import { useAuth } from "../hooks/useAuth";
import { usePageTitle } from "../hooks/usePageTitle";
import { useRides } from "../hooks/useRides";
import { useToast } from "../hooks/useToast";
import { ridesService } from "../services/rides";
import { firstNameOf, pluralize } from "../utils/format";

export default function Home() {
  usePageTitle("Caronas");
  const toast = useToast();
  const { user } = useAuth();
  const [form, setForm] = useState({ from: "", to: "" });
  const [filters, setFilters] = useState({ from: "", to: "" });
  const [pending, setPending] = useState(null); // { id, action }
  const { rides, loading, loadingMore, hasMore, error, reload, loadMore, updateRide } = useRides(filters);

  const hasFilters = Boolean(filters.from || filters.to);
  const firstName = firstNameOf(user);

  const handleSearch = (event) => {
    event.preventDefault();
    const next = { from: form.from.trim(), to: form.to.trim() };
    // Se os filtros não mudaram, a mesma busca é refeita para trazer dados atualizados.
    if (next.from === filters.from && next.to === filters.to) reload();
    else setFilters(next);
  };

  const swapPlaces = () => setForm((current) => ({ from: current.to, to: current.from }));

  const clearFilter = (name) => {
    setForm((current) => ({ ...current, [name]: "" }));
    setFilters((current) => ({ ...current, [name]: "" }));
  };

  const clearAll = () => {
    setForm({ from: "", to: "" });
    setFilters({ from: "", to: "" });
  };

  const runAction = async (id, action, request, successMessage) => {
    if (pending) return;
    setPending({ id, action });
    try {
      const data = await request(id);
      updateRide(data.ride);
      toast.success(successMessage);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setPending(null);
    }
  };

  const handleJoin = (id) => runAction(id, "join", ridesService.join, "Você entrou na carona.");
  const handleLeave = (id) => runAction(id, "leave", ridesService.leave, "Você saiu da carona.");

  const handleLoadMore = async () => {
    try {
      await loadMore(rides.length);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const countText = loading
    ? "Buscando..."
    : error
      ? ""
      : `${rides.length}${hasMore ? "+" : ""} ${pluralize(rides.length, "carona encontrada", "caronas encontradas")}`;

  let results;
  if (loading) {
    results = <RideSkeletonList />;
  } else if (error) {
    results = (
      <EmptyState icon="alert" title="Não foi possível carregar as caronas" description={error}>
        <button type="button" className="btn btn--secondary" onClick={reload}>
          Tentar de novo
        </button>
      </EmptyState>
    );
  } else if (rides.length === 0 && hasFilters) {
    results = (
      <EmptyState
        icon="search"
        title="Nenhuma carona nesse trajeto"
        description="A busca encontra qualquer trecho do nome do local, sem diferenciar acentos. Tente um nome mais curto ou limpe os filtros."
      >
        <button type="button" className="btn btn--secondary" onClick={clearAll}>
          Limpar filtros
        </button>
        <Link to="/create" className="btn btn--primary">
          Publicar carona
        </Link>
      </EmptyState>
    );
  } else if (rides.length === 0) {
    results = (
      <EmptyState
        title="Ainda não há caronas com vaga"
        description="Caronas lotadas não aparecem aqui. Publique a sua para que quem faz o mesmo caminho encontre você."
      >
        <Link to="/create" className="btn btn--primary">
          Publicar carona
        </Link>
      </EmptyState>
    );
  } else {
    results = (
      <>
        <div className="ride-list">
          {rides.map((ride) => (
            <RideCard
              key={ride.id}
              ride={ride}
              currentUserId={user?.id}
              pending={pending?.id === ride.id ? pending.action : null}
              onJoin={handleJoin}
              onLeave={handleLeave}
            />
          ))}
        </div>
        {hasMore && (
          <div className="ride-list__more">
            <button type="button" className="btn btn--secondary" onClick={handleLoadMore} disabled={loadingMore}>
              {loadingMore ? "Carregando..." : "Mostrar mais caronas"}
            </button>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <section className="planner" aria-labelledby="planner-title">
        <h1 className="planner__title" id="planner-title">
          Para onde você vai{firstName ? `, ${firstName}` : ""}?
        </h1>
        <p className="planner__lead">Busque pela origem, pelo destino ou pelos dois. Sem filtros, você vê todas as caronas com vaga.</p>
        <form className="planner__form" onSubmit={handleSearch} role="search" aria-label="Buscar caronas">
          <Field
            id="search-from"
            label="Origem"
            marker="origin"
            placeholder="De onde você sai?"
            value={form.from}
            onChange={(event) => setForm((current) => ({ ...current, from: event.target.value }))}
            autoComplete="off"
            maxLength={120}
          />
          <button type="button" className="btn btn--icon planner__swap" onClick={swapPlaces} aria-label="Trocar origem e destino">
            <Icon name="swap" />
          </button>
          <Field
            id="search-to"
            label="Destino"
            marker="destination"
            placeholder="Para onde você vai?"
            value={form.to}
            onChange={(event) => setForm((current) => ({ ...current, to: event.target.value }))}
            autoComplete="off"
            maxLength={120}
          />
          <button type="submit" className="btn btn--accent planner__submit">
            <Icon name="search" /> Buscar caronas
          </button>
        </form>
      </section>

      <ProfileNotice />

      <section className="results" aria-labelledby="results-title">
        <div className="results__head">
          <div>
            <h2 className="results__title" id="results-title">
              Caronas disponíveis
            </h2>
            <p className="results__count" role="status">
              {countText}
            </p>
          </div>
          <button type="button" className="btn btn--ghost" onClick={reload} disabled={loading}>
            <Icon name="refresh" /> Atualizar
          </button>
        </div>

        {hasFilters && (
          <div className="filters" aria-label="Filtros ativos">
            {filters.from && (
              <button type="button" className="chip chip--filter" onClick={() => clearFilter("from")} aria-label={`Remover filtro de origem: ${filters.from}`}>
                Origem: {filters.from} <Icon name="x" size={16} />
              </button>
            )}
            {filters.to && (
              <button type="button" className="chip chip--filter" onClick={() => clearFilter("to")} aria-label={`Remover filtro de destino: ${filters.to}`}>
                Destino: {filters.to} <Icon name="x" size={16} />
              </button>
            )}
            <button type="button" className="btn btn--link" onClick={clearAll}>
              Limpar filtros
            </button>
          </div>
        )}

        {results}
      </section>
    </>
  );
}
