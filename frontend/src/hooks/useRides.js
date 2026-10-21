import { useCallback, useEffect, useRef, useState } from "react";
import { ridesService } from "../services/rides";

const PAGE_SIZE = 20;

export function useRides({ from = "", to = "" } = {}) {
  const [state, setState] = useState({ rides: [], loading: true, loadingMore: false, hasMore: false, error: "" });
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setState((current) => ({ ...current, loading: true, error: "" }));
    try {
      const data = await ridesService.list({ from, to, limit: PAGE_SIZE, offset: 0 });
      const rides = data.rides || [];
      if (id === requestId.current) {
        setState({ rides, loading: false, loadingMore: false, hasMore: rides.length === PAGE_SIZE, error: "" });
      }
    } catch (err) {
      if (id === requestId.current) {
        setState((current) => ({ ...current, loading: false, error: err.message }));
      }
    }
  }, [from, to]);

  useEffect(() => {
    load();
  }, [load]);

  // Busca a próxima página a partir de `offset` e acrescenta à lista. Quem chama trata o erro.
  const loadMore = useCallback(
    async (offset) => {
      const id = ++requestId.current;
      setState((current) => ({ ...current, loadingMore: true }));
      try {
        const data = await ridesService.list({ from, to, limit: PAGE_SIZE, offset });
        const page = data.rides || [];
        if (id === requestId.current) {
          setState((current) => {
            const known = new Set(current.rides.map((ride) => ride.id));
            const fresh = page.filter((ride) => !known.has(ride.id));
            return { ...current, rides: [...current.rides, ...fresh], loadingMore: false, hasMore: page.length === PAGE_SIZE };
          });
        }
      } catch (err) {
        if (id === requestId.current) setState((current) => ({ ...current, loadingMore: false }));
        throw err;
      }
    },
    [from, to],
  );

  const updateRide = useCallback((updated) => {
    setState((current) => ({
      ...current,
      rides: current.rides.map((ride) => (ride.id === updated.id ? updated : ride)),
    }));
  }, []);

  return { ...state, reload: load, loadMore, updateRide };
}
