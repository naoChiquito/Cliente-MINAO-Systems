const BASE_URL = "http://localhost:5050/minao_systems/quizzes";
const LEGACY_BASE_URL = "http://localhost:5050/minao_systems/quizzes";
const FETCH_TIMEOUT = 10000;

const BASE_URLS_TO_TRY = [
  BASE_URL, 
  "http://localhost:3309/minao_systems/quizzes",
  LEGACY_BASE_URL 
];

function buildAuthHeaders(token, extra = {}) {
  const headers = { ...extra };
  if (token && String(token).trim()) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}


async function fetchWithTimeout(url, options = {}, timeoutMs = FETCH_TIMEOUT) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    if (err.name === "AbortError") {
      throw new Error(`La conexión ha expirado (Timeout de ${timeoutMs / 1000}s).`);
    }
    throw err;
  }
}


async function safeParseResponse(response) {
  const raw = await response.text();
  console.log("📥 RAW RESPONSE FROM SERVER:", raw);

  let parsed;
  try {
    parsed = raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.error("❌ No se pudo parsear JSON:", err);
    throw new Error("El servidor devolvió una respuesta NO JSON.");
  }

  if (!response.ok) {
    throw new Error(parsed.message || `Error HTTP ${response.status}`);
  }

  return parsed;
}


function normalizeQuizListResponse(parsed) {
  if (parsed && parsed.success === true && Array.isArray(parsed.data)) {
    return parsed.data;
  }

  if (Array.isArray(parsed)) {
    return parsed;
  }

  if (parsed && Array.isArray(parsed.result)) {
    return parsed.result;
  }

  return [];
}


async function tryParseJsonOrReturnRaw(response) {
  const raw = await response.text();
  try {
    const parsed = raw ? JSON.parse(raw) : {};
    return { ok: true, parsed };
  } catch {
    return { ok: false, raw };
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
        return {
          success: false,
          message: parsed.message || `Error HTTP ${response.status}`,
          _url: url
        };
      }

      return { success: true, parsed, _url: url };

    } catch (err) {
     
      console.warn("⚠ Fallo consultando:", url, err.message);
  
    }
  }

  return {
    success: false,
    message: "No se pudo obtener JSON desde ningún endpoint (8000/3309/5050)."
  };
}



async function getQuizzesByCourse(courseId) {
  try {
    const res = await requestJsonWithFallback(
      `/course/${encodeURIComponent(courseId)}`,
      { method: "GET" }
    );

    if (!res.success) {
      return {
        success: false,
        message: res.message || "No se pudo obtener JSON desde ningún endpoint de quizzes (8000/3309/5050).",
        data: [],
        result: [],
        count: 0
      };
    }

    const quizzes = normalizeQuizListResponse(res.parsed);

    return {
      success: true,
      data: quizzes,
      result: quizzes,
      count: quizzes.length,
      message: res.parsed?.message || "Cuestionarios cargados."
    };

  } catch (err) {
    console.warn("⚠ Fallo consultando getQuizzesByCourse:", err.message);

    return {
      success: false,
      message: err.message,
      data: [],
      result: [],
      count: 0
    };
  }
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



async function getQuizDetailForUser(quizId, token) {
  try {
    const headers = { "Content-Type": "application/json" };

    // ✅ Solo agrega Authorization si token existe
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const res = await requestJsonWithFallback(
      `/${encodeURIComponent(quizId)}/view`,
      {
        method: "GET",
        headers
      }
    );

    if (!res.success) {
      console.error("❌ ERROR EN getQuizDetailForUser:", res.message);
      return { success: false, message: res.message };
    }

    // ✅ mantenemos el tipo de retorno que tenías: devuelve el JSON tal cual
    return res.parsed;

  } catch (err) {
    console.error("❌ ERROR EN getQuizDetailForUser:", err);
    return { success: false, message: err.message };
  }
}

async function answerQuiz(studentUserId, quizId, answers, token) {
  try {
    const res = await requestJsonWithFallback(
      `/answerQuiz`,
      {
        method: "POST",
        headers: buildAuthHeaders(token, { "Content-Type": "application/json" }),
        body: JSON.stringify({
          studentUserId,
          quizId,
          answers
        })
      }
    );

    if (!res.success) {
      console.error("❌ ERROR EN answerQuiz:", res.message, "URL:", res._url);
      return { success: false, message: res.message };
    }

    return { success: true, data: res.parsed };

  } catch (err) {
    console.error("❌ ERROR EN answerQuiz:", err);
    return { success: false, message: err.message };
  }
}



async function viewQuizResult(quizId, studentUserId, attemptNumber, token) {
  try {
    // backend exige attemptNumber, así que si no viene, devolvemos error claro
    if (!attemptNumber) {
      return { success: false, message: "attemptNumber is required to view quiz result" };
    }

    const headers = { "Content-Type": "application/json" };
    if (token && String(token).trim()) headers.Authorization = `Bearer ${token}`;

    const res = await requestJsonWithFallback(
      `/quizResult?quizId=${encodeURIComponent(quizId)}&studentUserId=${encodeURIComponent(studentUserId)}&attemptNumber=${encodeURIComponent(attemptNumber)}`,
      { method: "GET", headers }
    );

    if (!res.success) {
      console.error("ERROR EN viewQuizResult:", res.message, "URL:", res._url);
      return { success: false, message: res.message };
    }

    return res.parsed;
  } catch (err) {
    console.error("ERROR EN viewQuizResult:", err);
    return { success: false, message: err.message };
  }
}



async function listQuizResponses(quizId, token) {
  try {
    const headers = { "Content-Type": "application/json" };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const res = await requestJsonWithFallback(
      `/${encodeURIComponent(quizId)}/responses`,
      {
        method: "GET",
        headers
      }
    );

    if (!res.success) {
      console.error("ERROR EN listQuizResponses:", res.message);
      return { success: false, message: res.message };
    }

    return res.parsed;

  } catch (err) {
    console.error("ERROR EN listQuizResponses:", err);
    return { success: false, message: err.message };
  }
}




async function createQuiz(quizData) {
  const url = `${LEGACY_BASE_URL}/createQuiz`;

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
  const url = `${LEGACY_BASE_URL}/${quizId}/responses`;

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
  const url = `${LEGACY_BASE_URL}/deleteQuiz/${quizId}`;

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
  const url = `${LEGACY_BASE_URL}/getQuizForUpdate/${quizId}`;

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
  try {
    if (!quizId || !String(quizId).trim()) {
      return { success: false, message: "quizId is required" };
    }

    if (!studentUserId || !String(studentUserId).trim()) {
      return { success: false, message: "studentUserId is required" };
    }

    const headers = { "Content-Type": "application/json" };

    
    if (token && String(token).trim()) {
      headers.Authorization = `Bearer ${token}`;
    }

    const path = `/${encodeURIComponent(quizId)}/students/${encodeURIComponent(studentUserId)}/attempts`;

    const res = await requestJsonWithFallback(path, {
      method: "GET",
      headers
    });

    if (!res.success) {
      console.error("❌ ERROR EN getStudentsAttempts:", res.message, "URL:", res._url);
      return { success: false, message: res.message };
    }

    
    return res.parsed;

  } catch (err) {
    console.error("❌ ERROR EN getStudentsAttempts:", err);
    return { success: false, message: err.message };
  }
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
  safeParseResponse, 


    getStudentsAttempts
};
