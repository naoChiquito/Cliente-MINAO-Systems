
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



const FETCH_TIMEOUT = 10000;

async function getQuizzesByCourse(cursoId) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), FETCH_TIMEOUT); 
    
    try {
        const url = `http://localhost:5050/minao_systems/quizzes/course/${cursoId}`; 
        
        const response = await fetch(url, {
            method: "GET",
            signal: controller.signal, 
            headers: { "Content-Type": "application/json" }
        });
        
        clearTimeout(id); 
        const responseText = await response.text(); 

        if (!response.ok) {
            try {
                const errorData = JSON.parse(responseText);
                throw new Error(errorData.message || `Error al cargar cuestionarios. Código: ${response.status}`);
            } catch (e) {
                throw new Error(`Error al cargar cuestionarios. Código: ${response.status}. Respuesta: ${responseText.substring(0, 50)}`);
            }
        }
        
        try {
            const responseData = JSON.parse(responseText);
            const quizzesArray = responseData.result 
                                 ? responseData.result 
                                 : responseData.data;

            if (responseData && quizzesArray && Array.isArray(quizzesArray)) {
                
                return { 
                    success: responseData.success || true, 
                    result: quizzesArray,
                    count: quizzesArray.length,
                    message: responseData.message || "Cuestionarios cargados."
                }; 
            }

            return { count: 0, result: [], success: responseData.success || true }; 

        } catch (e) {
            console.warn("Respuesta 200/204 sin contenido JSON. Asumiendo array vacío.");
            return { count: 0, result: [], success: true }; 
        }

    } catch (err) {
        clearTimeout(id); 
        if (err.name === 'AbortError') {
             throw new Error(`La conexión ha expirado (Timeout).`);
        }
        throw err;
    }
}

async function createQuiz(quizData) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
    
    try {
        const url = `http://localhost:5050/minao_systems/quizzes/createQuiz`; 
        
        const response = await fetch(url, {
            method: "POST",
            signal: controller.signal,
            headers: { 
                "Content-Type": "application/json"
            },
            body: JSON.stringify(quizData) 
        });
        
        clearTimeout(id); 

        if (response.status >= 400 && response.status < 500) {
            const errorData = await response.json().catch(() => ({})); 
            throw new Error(errorData.message || "Error de validación al crear el cuestionario. Código: ${response.status}");
        }
        
        if (response.ok) {
            const data = await response.json().catch(() => ({ message: "Cuestionario creado exitosamente." })); 
            return data;
        }

        throw new Error(`Error inesperado del servidor. Código: ${response.status}`);

    } catch (err) {
        clearTimeout(id); 
        if (err.name === 'AbortError') {
            throw new Error(`La conexión ha expirado (Timeout de ${FETCH_TIMEOUT / 1000}s).`);
        }
        throw err;
    }
}


async function getQuizResponsesList(quizId) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), FETCH_TIMEOUT); 
    
    try {
        const url = `http://localhost:5050/minao_systems/quizzes/${quizId}/responses`; 
        
        const response = await fetch(url, {
            method: "GET",
            signal: controller.signal, 
            headers: { "Content-Type": "application/json" }
        });
        
        clearTimeout(id); 
        const responseText = await response.text(); 

        if (!response.ok) {
             const errorData = await response.json().catch(() => ({}));
             throw new Error(errorData.message || `Fallo al obtener respuestas. Código: ${response.status}`);
        }
        
        const responseData = await response.json().catch(() => ({ responses: [] }));
        
        const responsesArray = responseData.responses || responseData.data || responseData.result || [];

        return { 
            success: true, 
            responses: responsesArray, 
            message: responseData.message 
        };

    } catch (err) {
        clearTimeout(id); 
        if (err.name === 'AbortError') {
            throw new Error(`La conexión ha expirado (Timeout de ${FETCH_TIMEOUT / 1000}s).`);
        }
        throw err;
    }
}

async function deleteQuiz(quizId) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
    
    try {
        const url = `http://localhost:5050/minao_systems/quizzes/deleteQuiz/${quizId}`; 
        const response = await fetch(url, {
            method: "DELETE",
            signal: controller.signal,
            headers: { "Content-Type": "application/json" }
        });
        
        clearTimeout(id); 

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Fallo al eliminar el cuestionario. Código: ${response.status}`);
        }
     
        return await response.json().catch(() => ({ success: true, message: "Cuestionario eliminado exitosamente." })); 

    } catch (err) {
        clearTimeout(id); 
        if (err.name === 'AbortError') {
            throw new Error(`La conexión ha expirado (Timeout de ${FETCH_TIMEOUT / 1000}s).`);
        }
        throw err;
    }
}


module.exports = {
    getQuizzesByCourse,
    updateQuestionnaire,
    getQuizDetailForUser,
    answerQuiz,
    viewQuizResult,
    listQuizResponses, 
    getQuizzesByCourse, 
    createQuiz, 
    getQuizResponsesList, 
    deleteQuiz
};

