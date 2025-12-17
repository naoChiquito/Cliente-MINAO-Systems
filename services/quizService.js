const { API_BASE_URL } = require("../app/config");
const BASE_URL = `${API_BASE_URL}/quizzes`;
const FETCH_TIMEOUT = 10000;

const BASE_URLS_TO_TRY = [BASE_URL];

function buildAuthHeaders(token, extra = {}) {
  const headers = { ...extra };
  if (token && String(token).trim()) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function tryParseJsonOrReturnRaw(response) {
  const text = await response.text();
  try {
    return { ok: true, parsed: JSON.parse(text) };
  } catch {
    return { ok: false, raw: text };
  }
}

async function requestJsonWithFallback(path, options = {}) {
  for (const base of BASE_URLS_TO_TRY) {
    const url = `${base}${path}`;
    try {
      const response = await fetch(url, options);
      const { ok, parsed, raw } = await tryParseJsonOrReturnRaw(response);

      if (!ok) {
        console.warn("⚠ Respuesta NO JSON desde:", url, raw?.slice(0, 120));
        continue;
      }

      if (!response.ok) {
        return { success: false, message: parsed.message || `Error HTTP ${response.status}`, _url: url };
      }

      return { success: true, parsed, _url: url };
    } catch (err) {
      console.warn("⚠ Fallo consultando:", url, err.message);
    }
  }

  return { success: false, message: "No se pudo obtener JSON desde ningún endpoint." };
}

function normalizeQuizListResponse(parsed) {
  if (parsed?.success && Array.isArray(parsed.data)) return parsed.data;
  if (Array.isArray(parsed)) return parsed;
  if (parsed?.result && Array.isArray(parsed.result)) return parsed.result;
  return [];
}


async function getQuizzesByCourse(courseId) {
  const res = await requestJsonWithFallback(`/course/${encodeURIComponent(courseId)}`, { method: "GET" });
  if (!res.success) return { success: false, message: res.message, data: [], result: [], count: 0 };
  const quizzes = normalizeQuizListResponse(res.parsed);
  return { success: true, data: quizzes, result: quizzes, count: quizzes.length, message: res.parsed?.message || "Cuestionarios cargados." };
}

async function updateQuestionnaire(quizId, updatedData) {
  try {
    const res = await requestJsonWithFallback(
      `/updateQuiz/${encodeURIComponent(quizId)}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData)
      }
    );

    if (!res.success) {
      console.error("❌ ERROR EN updateQuestionnaire:", res.message);
      return { success: false, message: res.message };
    }

    return { success: true, data: res.parsed };

  } catch (err) {
    console.error("❌ ERROR EN updateQuestionnaire:", err);
    return { success: false, message: err.message };
  }
}


// --- Funciones restantes ---
async function getQuizDetailForUser(quizId, token) {
  const headers = buildAuthHeaders(token, { "Content-Type": "application/json" });
  const res = await requestJsonWithFallback(`/${encodeURIComponent(quizId)}/view`, { method: "GET", headers });
  if (!res.success) return { success: false, message: res.message };
  return res.parsed;
}

async function answerQuiz(studentUserId, quizId, answers, token) {
  const headers = buildAuthHeaders(token, { "Content-Type": "application/json" });
  const res = await requestJsonWithFallback(`/answerQuiz`, {
    method: "POST",
    headers,
    body: JSON.stringify({ studentUserId, quizId, answers }),
  });
  if (!res.success) return { success: false, message: res.message };
  return { success: true, data: res.parsed };
}

async function viewQuizResult(quizId, studentUserId, attemptNumber, token) {
  if (!attemptNumber) return { success: false, message: "attemptNumber is required" };
  const headers = buildAuthHeaders(token, { "Content-Type": "application/json" });
  const res = await requestJsonWithFallback(
    `/quizResult?quizId=${encodeURIComponent(quizId)}&studentUserId=${encodeURIComponent(studentUserId)}&attemptNumber=${encodeURIComponent(attemptNumber)}`,
    { method: "GET", headers }
  );
  if (!res.success) return { success: false, message: res.message };
  return res.parsed;
}

async function listQuizResponses(quizId, token) {
  const headers = buildAuthHeaders(token, { "Content-Type": "application/json" });
  const res = await requestJsonWithFallback(`/${encodeURIComponent(quizId)}/responses`, { method: "GET", headers });
  if (!res.success) return { success: false, message: res.message };
  return res.parsed;
}

async function createQuiz(quizData) {
  const url = `${BASE_URLS_TO_TRY}/createQuiz`;

  try {
    const response = await fetchWithTimeout(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(quizData)
    });

    if (response.status >= 400 && response.status < 500) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message ||
          `Error de validación al crear el cuestionario. Código: ${response.status}`
      );
    }

    if (response.ok) {
      const data = await response
        .json()
        .catch(() => ({ message: "Cuestionario creado exitosamente." }));
      return data;
    }

    throw new Error(`Error inesperado del servidor. Código: ${response.status}`);
  } catch (err) {
    throw err;
  }
}

async function getQuizResponsesList(quizId) {
  const url = `${BASE_URLS_TO_TRY}/${quizId}/responses`;

  try {
    const response = await fetchWithTimeout(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    });

    const responseText = await response.text();

    if (!response.ok) {
      try {
        const errorData = JSON.parse(responseText);
        throw new Error(
          errorData.message || `Fallo al obtener respuestas. Código: ${response.status}`
        );
      } catch (e) {
        throw new Error(
          `Error al obtener respuestas. Código: ${response.status}. Respuesta: ${responseText.substring(
            0,
            50
          )}`
        );
      }
    }

    let responseData = {};
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      console.warn("Respuesta 200/204 sin contenido JSON.");
      responseData = {};
    }

    const responsesArray =
      responseData.responses || responseData.data || responseData.result || [];

    return {
      success: responseData.success || true,
      responses: responsesArray,
      message: responseData.message || "Resultados obtenidos."
    };
  } catch (err) {
    throw err;
  }
}

async function deleteQuiz(quizId) {
  const url = `${BASE_URLS_TO_TRY}/deleteQuiz/${quizId}`;

  try {
    const response = await fetchWithTimeout(url, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Fallo al eliminar el cuestionario. Código: ${response.status}`
      );
    }

    return await response
      .json()
      .catch(() => ({ success: true, message: "Cuestionario eliminado exitosamente." }));
  } catch (err) {
    throw err;
  }
}


async function getQuizDetails(quizId) {
  const url = `${BASE_URLS_TO_TRY}/getQuizForUpdate/${quizId}`;

  try {
    const response = await fetchWithTimeout(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    });

    const responseText = await response.text();

    if (!response.ok) {
      try {
        const errorData = JSON.parse(responseText);
        throw new Error(
          errorData.message ||
            `Fallo al obtener detalles del cuestionario. Código: ${response.status}`
        );
      } catch (e) {
        throw new Error(
          `Error al obtener detalles del cuestionario. Código: ${response.status}. Respuesta: ${responseText.substring(
            0,
            50
          )}`
        );
      }
    }

    let responseData = {};
    try {
      responseData = JSON.parse(responseText);
      if (!responseData.result) {
        throw new Error("Respuesta del servidor incompleta.");
      }
      return responseData;
    } catch (e) {
      console.warn("Respuesta 200/204 sin contenido JSON. Quiz no encontrado.");
      throw new Error("Detalles del Quiz no encontrados o formato inválido.");
    }
  } catch (err) {
    throw err;
  }
}


async function getStudentsAttempts(quizId, studentUserId, token) {
  const headers = buildAuthHeaders(token, { "Content-Type": "application/json" });
  const res = await requestJsonWithFallback(
    `/${encodeURIComponent(quizId)}/students/${encodeURIComponent(studentUserId)}/attempts`,
    { method: "GET", headers }
  );
  if (!res.success) return { success: false, message: res.message };
  return res.parsed;
}


module.exports = {
  getQuizzesByCourse,
  updateQuestionnaire,
  getQuizDetailForUser,
  answerQuiz,
  viewQuizResult,
  listQuizResponses,

  createQuiz,
  getQuizResponsesList,
  deleteQuiz,
  getQuizDetails,

  normalizeQuizListResponse,
  requestJsonWithFallback,
  getStudentsAttempts
};

