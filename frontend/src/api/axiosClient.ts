import axios, { AxiosError } from "axios";
import { API_BASE_URL, TOKEN_STORAGE_KEY } from "./config";

/** Sans timeout, axios attend indéfiniment (valeur par défaut : 0 = jamais).
 * Si le backend est lent ou injoignable (ex: cold start d'un hébergeur après
 * une période d'inactivité), l'utilisateur restait bloqué sur un spinner
 * infini sans jamais voir d'erreur -- exactement le symptôme "blocage
 * complet" remonté sur le login. 20s couvre largement une requête normale. */
export const DEFAULT_REQUEST_TIMEOUT_MS = 20_000;

export const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: DEFAULT_REQUEST_TIMEOUT_MS,
});

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

/** Extrait un message d'erreur lisible depuis une erreur Axios/FastAPI. */
export function getErrorMessage(error: unknown, fallback = "Une erreur est survenue. Réessaie."): string {
  if (axios.isAxiosError(error)) {
    const detail = (error.response?.data as { detail?: unknown } | undefined)?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail) && detail.length > 0) {
      const first = detail[0] as { msg?: string };
      if (first?.msg) return first.msg;
    }
    if (error.code === "ERR_NETWORK") return "Impossible de contacter le serveur. Vérifie ta connexion.";
    if (error.code === "ECONNABORTED") {
      return "Le serveur met plus de temps que prévu à répondre (ça peut arriver après une période d'inactivité). Réessaie dans un instant.";
    }
  }
  return fallback;
}
