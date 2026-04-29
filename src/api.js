// ─── API helper ───────────────────────────────────────────────────────────────
// All requests go through /api (proxied to Express by Vite in dev)

function getToken() { return localStorage.getItem("vt_token"); }

async function request(method, path, body) {
  const token = getToken();
  const res = await fetch(path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...(body !== undefined && { body: JSON.stringify(body) }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export const api = {
  // Auth
  signup: (name, email, password) => request("POST", "/api/auth/signup", { name, email, password }),
  login:  (email, password)       => request("POST", "/api/auth/login",  { email, password }),
  me:     ()                      => request("GET",  "/api/auth/me"),

  // Daily log
  getLog:    (date) => request("GET",  `/api/log${date ? `?date=${date}` : ""}`),
  saveLog:   (data) => request("PUT",  "/api/log", data),

  // Weight
  getWeight:    ()       => request("GET",    "/api/weight"),
  logWeight:    (value)  => request("POST",   "/api/weight", { value }),
  deleteWeight: (id)     => request("DELETE", `/api/weight/${id}`),

  // Custom foods
  getCustomFoods:    ()           => request("GET",    "/api/custom-foods"),
  addCustomFood:     (food)       => request("POST",   "/api/custom-foods", food),
  toggleCustomFood:  (id, checked)=> request("PATCH",  `/api/custom-foods/${id}`, { checked }),
  deleteCustomFood:  (id)         => request("DELETE", `/api/custom-foods/${id}`),
};
