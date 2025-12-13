document.addEventListener("DOMContentLoaded", async () => {

    const courseId = localStorage.getItem("selectedCourseId");
    if (!courseId) {
        alert("Curso no encontrado.");
        return;
    }

    const studentName = localStorage.getItem("userName") || "";
    const paternalSurname = localStorage.getItem("userPaternalSurname") || "";
    const nameEl = document.getElementById("studentNameDisplay");

    if (nameEl) {
        nameEl.textContent = `${studentName} ${paternalSurname}`.trim();
    }


    loadCourseHeader(courseId);
    loadCourseContent(courseId);
    loadCourseQuizzes(courseId);
});

async function loadCourseHeader(courseId) {
    try {
        const response = await window.api.getCourseDetails(courseId);

        if (!response || response.success === false) {
            console.warn("⚠ No se pudieron obtener los detalles del curso");
            return;
        }

        const course =
            response.data?.result ||
            response.data?.data ||
            response.data ||
            response.result ||
            response;

        if (!course || !course.name) {
            console.warn("⚠ Detalles del curso sin nombre:", response);
            return;
        }

        const titleEl = document.getElementById("course-title");
        const descEl = document.getElementById("course-description");

        if (titleEl) {
            titleEl.textContent = course.name;
        }

        if (descEl) {
            descEl.textContent = course.description || "";
        }

    } catch (error) {
        console.error("❌ Error cargando cabecera del curso:", error);
    }
}


async function loadCourseContent(courseId) {
    const container = document.getElementById("contents-container");
    container.innerHTML = "<p>Cargando contenido...</p>";

    try {
        const response = await window.api.getCourseContent(courseId);

        if (!response.success) {
            throw new Error(response.message || "Error al cargar contenido");
        }

        const contents = response.data?.results || [];
        container.innerHTML = "";

        if (contents.length === 0) {
            container.innerHTML = "<p>No hay contenido disponible.</p>";
            return;
        }

        contents.forEach(content => {
            const card = document.createElement("div");
            card.className = "module-card";

            card.innerHTML = `
                <span class="module-id">${content.type || "Contenido"}</span>
                <h2>${content.title}</h2>
                <p class="module-desc">
                    ${content.descripcion || "Sin descripción disponible."}
                </p>
            `;

            container.appendChild(card);
        });

    } catch (error) {
        console.error("❌ Error cargando contenido:", error);
        container.innerHTML = "<p>Error al cargar contenido.</p>";
    }
}


async function loadCourseQuizzes(courseId) {
    const container = document.getElementById("quizzes-container");
    container.innerHTML = "<p>Cargando cuestionarios...</p>";

    const studentUserId = localStorage.getItem("userId");
    const token = localStorage.getItem("token"); 

    try {
        const response = await window.api.getQuizzesByCourse(courseId);
        container.innerHTML = "";

        if (!response || response.success === false) {
            container.innerHTML = "<p>No hay cuestionarios disponibles.</p>";
            return;
        }

        const quizzes =
            Array.isArray(response.result) ? response.result :
            Array.isArray(response.data) ? response.data :
            Array.isArray(response) ? response :
            [];

        if (quizzes.length === 0) {
            container.innerHTML = "<p>No hay cuestionarios disponibles.</p>";
            return;
        }

        const scoreMap = {};
        await Promise.all(
            quizzes.map(async (q) => {
                const quizId = q.quizId;
                const scoreInfo = await getStudentQuizScoreSafe(quizId, studentUserId, token);
                if (scoreInfo) scoreMap[quizId] = scoreInfo;
            })
        );

        quizzes.forEach((quiz) => {
            const quizId = quiz.quizId;
            const scoreInfo = scoreMap[quizId]; 

            const card = document.createElement("div");
            card.className = "module-card";
            card.style.cursor = "pointer";

            const scoreLine = scoreInfo
                ? `<div class="module-link" style="margin-top:8px;">
                       ✅ Calificación: <strong>${scoreInfo.score}</strong> / ${scoreInfo.total}
                   </div>`
                : `<div class="module-link" style="margin-top:8px;">
                       📝 Sin contestar
                   </div>`;

            card.innerHTML = `
                <span class="module-id">Quiz</span>
                <h2>${quiz.title}</h2>
                <p class="module-desc">
                    ${quiz.description || "Sin descripción."}
                </p>
                <span class="module-link">
                    Preguntas: ${quiz.numberQuestion ?? 0}
                </span>
                ${scoreLine}
            `;

            card.addEventListener("click", () => {
                localStorage.setItem("selectedQuizId", String(quizId));
                localStorage.setItem("selectedQuizTitle", quiz.title || "Cuestionario");

   
                if (window.nav && typeof window.nav.goTo === "function") {
                    window.nav.goTo("AnswerQuiz");
                } else {
                    window.location.href = "AnswerQuiz.html";
                }
            });

            container.appendChild(card);
        });

    } catch (error) {
        console.error("❌ Error cargando cuestionarios:", error);
        container.innerHTML = "<p>Error al cargar cuestionarios.</p>";
    }
}


async function getStudentQuizScoreSafe(quizId, studentUserId, token) {
    try {
        if (!studentUserId) return null;

        const res = await window.api.viewQuizResult(quizId, studentUserId, token);

        if (!res || res.success === false) return null;

        const score = res.scoreObtained ?? res.data?.scoreObtained ?? res.result?.scoreObtained;
        const total = res.totalWeighing ?? res.data?.totalWeighing ?? res.result?.totalWeighing;

        if (typeof score !== "number" || typeof total !== "number") return null;

        return { score, total };
    } catch (e) {
        return null; 
    }
}


// luis@example.com
