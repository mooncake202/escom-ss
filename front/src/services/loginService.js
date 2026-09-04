import { apiFetch } from "./apiClient";

export async function postLogin(data) {
  return apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
}