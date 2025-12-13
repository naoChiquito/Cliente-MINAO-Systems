const BASE_URL = "http://localhost:8000/minao_systems/quizzes";

/**
 * Nota:
 * - Algunas funciones históricas apuntan a :5050 con timeout.
 * - No eliminamos nada: preservamos ambos comportamientos.
 */
const LEGACY_BASE_URL = "http://localhost:5050/minao_systems/quizzes";
const FETCH_TIMEOUT = 10000;

/* ============================================================
   Fetch con timeout (para mantener el comportamiento HEAD)
============================================================ */
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

/* ============================================================
   Parseo seguro de respuestas (Lilly)
============================================================ */
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

/* ============================================================
   Normalizador (Lilly) para listas
============================================================ */
function normalizeQuizListResponse(parsed) {
  if (parsed && parsed.success === true && Array.isArray(parsed.data)) {
    return parsed.data;
  }

  if (Array.isArray(parsed)) {
    return parsed;
  }

  // Algunas APIs devuelven { result: [] }
  if (parsed && Array.isArray(parsed.result)) {
    return parsed.result;
  }

  return [];
}

/* ============================================================
   GET QUIZZES BY COURSE  (Merge “compatible”)
   - Mantiene URL de 8000 (Lilly)
   - Mantiene compatibilidad: regresa data Y result, count, message (HEAD)
============================================================ */
async function getQuizzesByCourse(courseId) {
  try {
    const response = await fetch(
      `${BASE_URL}/course/${encodeURIComponent(courseId)}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      }
    );

    const parsed = await safeParseResponse(response);
    const quizzes = normalizeQuizListResponse(parsed);

    return {
      success: true,
      // formato "nuevo"
      data: quizzes,
      // formato "viejo" (para no romper vistas antiguas)
      result: quizzes,
      count: quizzes.length,
      message: parsed.message || "Cuestionarios cargados."
    };
  } catch (err) {
    console.error("ERROR EN getQuizzesByCourse:", err);
    return {
      success: false,
      message: err.message,
      data: [],
      result: [],
      count: 0
    };
  }
}

/* ============================================================
   UPDATE QUESTIONNAIRE (Merge “compatible”)
   - Usa 8000 (Lilly)
   - No cambia payload (JSON.stringify(updatedData))
============================================================ */
async function updateQuestionnaire(quizId, updatedData) {
  try {
    const response = await fetch(
      `${BASE_URL}/updateQuiz/${encodeURIComponent(quizId)}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData)
      }
    );

    const parsed = await safeParseResponse(response);

    // compat: devolvemos wrapper consistente
    return { success: true, data: parsed };
  } catch (err) {
    console.error("❌ ERROR EN updateQuestionnaire:", err);
    return { success: false, message: err.message };
  }
}

/* ============================================================
   GET QUIZ DETAIL FOR USER  (Lilly)
============================================================ */
async function getQuizDetailForUser(quizId) {
  try {
    const response = await fetch(
      `${BASE_URL}/${encodeURIComponent(quizId)}/view`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      }
    );

    return await safeParseResponse(response);
  } catch (err) {
    console.error("❌ ERROR EN getQuizDetailForUser:", err);
    return { success: false, message: err.message };
  }
}

/* ============================================================
   ANSWER QUIZ  (Lilly)
============================================================ */
async function answerQuiz(studentUserId, quizId, answers) {
  try {
    const response = await fetch(`${BASE_URL}/answerQuiz`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentUserId,
        quizId,
        answers
      })
    });

    const parsed = await safeParseResponse(response);
    return { success: true, data: parsed };
  } catch (err) {
    console.error("❌ ERROR EN answerQuiz:", err);
    return { success: false, message: err.message };
  }
}

/* ============================================================
   VIEW QUIZ RESULT  (unificado: safeParseResponse)
============================================================ */
async function viewQuizResult(quizId, studentUserId) {
  try {
    const response = await fetch(
      `${BASE_URL}/quizResult?quizId=${encodeURIComponent(quizId)}&studentUserId=${encodeURIComponent(studentUserId)}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      }
    );

    return await safeParseResponse(response);
  } catch (err) {
    console.error("ERROR EN viewQuizResult:", err);
    return { success: false, message: err.message };
  }
}

/* ============================================================
   LIST QUIZ RESPONSES  (unificado: safeParseResponse)
============================================================ */
async function listQuizResponses(quizId) {
  try {
    const response = await fetch(
      `${BASE_URL}/${encodeURIComponent(quizId)}/responses`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      }
    );

    return await safeParseResponse(response);
  } catch (err) {
    console.error("ERROR EN listQuizResponses:", err);
    return { success: false, message: err.message };
  }
}

/* ============================================================
   ======== FUNCIONES “LEGACY/ADMIN” (HEAD) ========
   Las dejo con timeout y con su puerto original (5050)
   para NO romper lo que ya dependía de eso.
============================================================ */

/**
 * createQuiz(quizData)
 * - POST legacy /createQuiz
 * - No tocamos payload.
 */
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

/**
 * getQuizResponsesList(quizId)
 * - GET legacy /:quizId/responses
 * - Mantiene forma { success, responses, message }
 */
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

/**
 * deleteQuiz(quizId)
 * - DELETE legacy /deleteQuiz/:id
 */
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

/**
 * getQuizDetails(quizId)
 * - GET legacy /getQuizForUpdate/:id
 */
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

/* ============================================================
   EXPORTS (sin duplicados)
============================================================ */
module.exports = {
  // principales usadas por tu main/preload
  getQuizzesByCourse,
  updateQuestionnaire,
  getQuizDetailForUser,
  answerQuiz,
  viewQuizResult,
  listQuizResponses,

  // extras que agregaste en main (HEAD)
  createQuiz,
  getQuizResponsesList,
  deleteQuiz,
  getQuizDetails,

  // helper útil si alguien lo usa
  normalizeQuizListResponse
};
