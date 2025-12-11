const BASE_URL = "http://localhost:8000/minao_systems/quizzes";

/* ============================================================
   ✔  GET QUIZZES BY COURSE
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

        const raw = await response.text();
        console.log("📥 RAW RESPONSE FROM SERVER:", raw);

        let parsed;
        try {
            parsed = JSON.parse(raw);
        } catch (err) {
            console.error("❌ No se pudo parsear JSON:", err);
            throw new Error("El servidor devolvió una respuesta NO JSON.");
        }

        if (!response.ok) {
            throw new Error(parsed.message || "Error obteniendo cuestionarios.");
        }

        return parsed;

    } catch (err) {
        console.error("❌ ERROR EN getQuizzesByCourse:", err);
        return { success: false, message: err.message };
    }
}

/* ============================================================
   ✔  UPDATE QUESTIONNAIRE
============================================================ */
async function updateQuestionnaire(quizId, updatedData) {
    try {
        const response = await fetch(
            `${BASE_URL}/updateQuiz/${encodeURIComponent(quizId)}`,
            {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedData) // Sending updated quiz data
            }
        );

        const data = await response.json();

        if (!response.ok) throw new Error(data.message || "Error al actualizar cuestionario");

        return { success: true, data };
    } catch (err) {
        console.error("❌ ERROR EN updateQuestionnaire:", err);
        return { success: false, message: err.message };
    }
}

/* ============================================================
   ✔  GET QUIZ DETAIL FOR USER
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

        const raw = await response.text();
        console.log("📥 RAW RESPONSE FROM SERVER:", raw);

        let parsed;
        try {
            parsed = JSON.parse(raw);
        } catch (err) {
            console.error("❌ No se pudo parsear JSON:", err);
            throw new Error("El servidor devolvió una respuesta NO JSON.");
        }

        if (!response.ok) {
            throw new Error(parsed.message || "Error obteniendo detalle del cuestionario.");
        }

        return parsed;

    } catch (err) {
        console.error("❌ ERROR EN getQuizDetailForUser:", err);
        return { success: false, message: err.message };
    }
}

/* ============================================================
   ✔  ANSWER QUIZ
============================================================ */
async function answerQuiz(studentUserId, quizId, answers) {
    try {
        const response = await fetch(
            `${BASE_URL}/answerQuiz`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    studentUserId,
                    quizId,
                    answers
                })
            }
        );

        const data = await response.json();

        if (!response.ok) throw new Error(data.message || "Error al contestar el cuestionario");

        return { success: true, data };
    } catch (err) {
        console.error("❌ ERROR EN answerQuiz:", err);
        return { success: false, message: err.message };
    }
}

/* ============================================================
   ✔  VIEW QUIZ RESULT
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

        const raw = await response.text();
        console.log("📥 RAW RESPONSE FROM SERVER:", raw);

        let parsed;
        try {
            parsed = JSON.parse(raw);
        } catch (err) {
            console.error("❌ No se pudo parsear JSON:", err);
            throw new Error("El servidor devolvió una respuesta NO JSON.");
        }

        if (!response.ok) {
            throw new Error(parsed.message || "Error obteniendo resultado del cuestionario.");
        }

        return parsed;

    } catch (err) {
        console.error("❌ ERROR EN viewQuizResult:", err);
        return { success: false, message: err.message };
    }
}

/* ============================================================
   ✔  LIST QUIZ RESPONSES
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

        const raw = await response.text();
        console.log("📥 RAW RESPONSE FROM SERVER:", raw);

        let parsed;
        try {
            parsed = JSON.parse(raw);
        } catch (err) {
            console.error("❌ No se pudo parsear JSON:", err);
            throw new Error("El servidor devolvió una respuesta NO JSON.");
        }

        if (!response.ok) {
            throw new Error(parsed.message || "Error obteniendo respuestas del cuestionario.");
        }

        return parsed;

    } catch (err) {
        console.error("❌ ERROR EN listQuizResponses:", err);
        return { success: false, message: err.message };
    }
}

module.exports = {
    getQuizzesByCourse,
    updateQuestionnaire,
    getQuizDetailForUser,
    answerQuiz,
    viewQuizResult,
    listQuizResponses
};
