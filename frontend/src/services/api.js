const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/+$/, "");

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

let unauthorizedHandler = null;

// O AuthProvider registra aqui o que fazer quando a sessão expira no meio do uso.
export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

export async function apiRequest(path, { headers, body, ...options } = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      credentials: "include",
      ...options,
      body,
      headers: { ...(body ? { "Content-Type": "application/json" } : {}), ...headers },
    });
  } catch {
    throw new ApiError("Não foi possível conectar ao servidor. Confira se o backend está em execução.", 0);
  }

  let data = {};
  const text = await response.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = {};
    }
  }

  if (!response.ok) {
    // 401 em /auth/* é esperado (senha errada, sessão ainda não iniciada).
    if (response.status === 401 && !path.startsWith("/auth/")) {
      unauthorizedHandler?.();
    }
    throw new ApiError(data.error || "Não foi possível concluir a ação.", response.status);
  }

  return data;
}
