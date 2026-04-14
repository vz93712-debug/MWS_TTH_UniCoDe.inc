const API_URL = "http://127.0.0.1:8000/api/v1";

// Достаем токен из LocalStorage
const getToken = () => localStorage.getItem("access_token");

// Универсальная функция запроса с перехватом ошибок
const request = async (endpoint, options = {}) => {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error(`API Error [${response.status}] at ${endpoint}:`, errorData);
    throw new Error(
      errorData.detail || "Произошла ошибка при запросе к серверу",
    );
  }

  // Для DELETE запросов (204 No Content)
  if (response.status === 204) return null;

  return response.json();
};

// Наш главный объект со всеми ручками бэкенда
export const api = {
  // === 1. АВТОРИЗАЦИЯ ===
  login: (email, password) =>
    request("/auth/login/", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  getMe: () => request("/auth/me/"),

  // === 2. ПРОСТРАНСТВА И СТРАНИЦЫ ===
  getSpaces: () => request("/spaces/"),

  getPagesTree: (spaceId) => request(`/spaces/${spaceId}/pages/`),
  getPage: (pageId) => request(`/pages/${pageId}/`),
  createPage: (spaceId, data) =>
    request(`/spaces/${spaceId}/pages/`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // === 3. ИНТЕГРАЦИЯ MWS TABLES (Proxy) ===
  getMwsSpaces: () => request("/mws/spaces/"),

  getMwsNodes: (spaceId) =>
    request(`/mws/spaces/${spaceId}/nodes/?type=datasheet`),

  getMwsRecords: (dstId) =>
    request(`/mws/datasheets/${dstId}/records/?pageSize=50&cellFormat=json`),

  // === 4. ИСКУССТВЕННЫЙ ИНТЕЛЛЕКТ ===
  generateTable: (prompt, pageId) =>
    request("/ai/generate-table/", {
      method: "POST",
      body: JSON.stringify({ prompt, page_id: pageId }),
    }),
  askAssistant: (pageId, message) =>
    request("/ai/chat/", {
      method: "POST",
      body: JSON.stringify({ page_id: pageId, message }),
    }),
  checkTaskStatus: (taskId) => request(`/ai/tasks/${taskId}/`),

  // === 5. СОХРАНЕНИЕ СТРАНИЦЫ (AutoSave) ===
  updatePage: (pageId, content) =>
    request(`/pages/${pageId}/`, {
      method: "PATCH",
      body: JSON.stringify({ content }),
    }),

  // === 6. ИСТОРИЯ ВЕРСИЙ (СКВ - Машина Времени) ===
  getPageVersions: (pageId) => request(`/pages/${pageId}/versions/`),

  getVersionDetail: (pageId, versionId) =>
    request(`/pages/${pageId}/versions/${versionId}/`),
};
