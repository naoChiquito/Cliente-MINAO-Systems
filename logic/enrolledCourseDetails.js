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

async function loadModuleFilesInto(containerEl, moduleId) {
    if (!containerEl) return;

    containerEl.innerHTML = `<p style="margin-top:10px;">Cargando archivos...</p>`;

    try {
        const response = await window.api.getFilesByContent(moduleId);

        if (response?.success && Array.isArray(response.files) && response.files.length > 0) {
            containerEl.innerHTML = "";

            const title = document.createElement("div");
            title.style.marginTop = "10px";
            title.style.fontWeight = "700";
            title.textContent = "Archivos:";
            containerEl.appendChild(title);

            const btnWrap = document.createElement("div");
            btnWrap.style.display = "flex";
            btnWrap.style.flexWrap = "wrap";
            btnWrap.style.gap = "8px";
            btnWrap.style.marginTop = "8px";

            response.files.forEach((file) => {
                const btn = document.createElement("button");
                btn.className = "btn-sm btn-view";
                btn.type = "button";
                btn.textContent = file.originalName || "Ver archivo";

                btn.addEventListener("click", async () => {
                    const fileUrl = file.url;
                    if (!fileUrl) {
                        alert("La URL del archivo no es válida.");
                        return;
                    }

                    const res = await window.api.viewFileWindow(fileUrl);
                    if (!res?.success) {
                        alert("Error al abrir el visor: " + (res?.message || ""));
                    }
                });

                btnWrap.appendChild(btn);
            });

            containerEl.appendChild(btnWrap);

        } else if (response?.success && Array.isArray(response.files) && response.files.length === 0) {
            containerEl.innerHTML = `<p style="margin-top:10px;">No hay archivos para este contenido.</p>`;
        } else {
            containerEl.innerHTML = `<p style="margin-top:10px;">${response?.message || "No se pudieron cargar archivos."}</p>`;
        }

    } catch (error) {
        console.error("❌ Error cargando archivos del módulo:", error);
        containerEl.innerHTML = `<p style="margin-top:10px;">Error al cargar archivos.</p>`;
    }
}

async function viewFile(fileUrl) {
    if (!fileUrl) {
        alert("La URL del archivo no es válida.");
        return;
    }

    try {
        const response = await window.api.viewFileWindow(fileUrl);
        if (!response?.success) {
            alert("Error al abrir el visor: " + (response?.message || ""));
        }
    } catch (error) {
        console.error("Fallo al intentar abrir el visor:", error);
        alert("Error de conexión al abrir el archivo.");
    }
}

async function loadCourseContent(courseId) {
    const container = document.getElementById("contents-container");
    container.innerHTML = "<p>Cargando contenido...</p>";

    try {
        const response = await window.api.getCourseContent(courseId);
        if (!response.success) throw new Error(response.message || "Error al cargar contenido");

        const contents = response.data?.results || [];
        container.innerHTML = "";

        if (contents.length === 0) {
            container.innerHTML = "<p>No hay contenido disponible.</p>";
            return;
        }

        for (const content of contents) {
            const card = document.createElement("div");
            card.className = "module-card";

            card.innerHTML = `
                <span class="module-id">${content.type || "Contenido"}</span>
                <h2>${content.title}</h2>
                <p class="module-desc">
                    ${content.descripcion || "Sin descripción disponible."}
                </p>
            `;

            const filesBox = document.createElement("div");
            filesBox.className = "module-files";
            filesBox.innerHTML = `<p style="margin-top:10px;">Cargando archivos...</p>`;

            card.appendChild(filesBox);
            container.appendChild(card);

            const moduleId =
                content.contentId ?? content.id ?? content.moduleId ?? content.cursoContentId;
                console.log("CONTENT:", content);

            if (!moduleId) {
                filesBox.innerHTML = `<p style="margin-top:10px;">No se encontró ID del módulo.</p>`;
                continue;
            }

            await loadModuleFilesInto(filesBox, String(moduleId));
        }

    } catch (error) {
        console.error("❌ Error cargando contenido:", error);
        container.innerHTML = "<p>Error al cargar contenido.</p>";
    }
}


async function loadCourseQuizzes(courseId) {
    const container = document.getElementById("quizzes-container");
    container.innerHTML = "<p>Cargando cuestionarios...</p>";

    const studentUserId = (localStorage.getItem("userId") || "").trim();
    const token = (localStorage.getItem("token") || "").trim();

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

        
        
        
        const attemptsMap = {}; 

        await Promise.all(
            quizzes.map(async (q) => {
                const quizId = q.quizId;
                const attInfo = await getStudentAttemptsCountSafe(quizId, studentUserId, token);
                if (attInfo) attemptsMap[quizId] = attInfo;
            })
        );

        
        
        
        quizzes.forEach((quiz) => {
            const quizId = quiz.quizId;
            const attInfo = attemptsMap[quizId];

            const attemptsCount = attInfo?.attemptsCount ?? 0;
            const isContestato = attemptsCount > 1; 

            const card = document.createElement("div");
            card.className = "module-card";
            card.style.cursor = "pointer";

            let statusLine = "";

            if (isContestato) {
                statusLine = `
                    <div class="module-link" style="margin-top:8px; font-weight:700;">
                        ✅ CONTESTADO
                    </div>
                `;

                card.style.cursor = "pointer"; 
                card.style.opacity = "0.85";
            } else {
                statusLine = `
                    <div class="module-link" style="margin-top:8px;">
                        📝 Sin contestar
                    </div>
                `;
            }

            card.innerHTML = `
                <span class="module-id">Quiz</span>
                <h2>${quiz.title}</h2>
                <p class="module-desc">
                    ${quiz.description || "Sin descripción."}
                </p>
                <span class="module-link">
                    Preguntas: ${quiz.numberQuestion ?? 0}
                </span>
                ${statusLine}
            `;

           card.addEventListener("click", () => {
  localStorage.setItem("selectedQuizId", String(quizId));
  localStorage.setItem("selectedQuizTitle", quiz.title || "Cuestionario");

  
  localStorage.setItem("quizReviewMode", isContestato ? "1" : "0");
  localStorage.setItem("quizMaxAttempt", String(attInfo?.maxAttempt ?? 0));

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

async function getStudentAttemptsCountSafe(quizId, studentUserId, token) {
    try {
        if (!studentUserId) return null;

        const res = await window.api.getStudentsAttempts(quizId, studentUserId, token);

        if (!res || res.success === false) return null;

        const rows =
            Array.isArray(res.attempts) ? res.attempts :
            Array.isArray(res.data) ? res.data :
            Array.isArray(res.result) ? res.result :
            Array.isArray(res) ? res :
            [];

        if (!Array.isArray(rows) || rows.length === 0) {
            return { attemptsCount: 0, maxAttempt: 0 };
        }

        const attemptNumbers = rows
            .map(r => r.attemptNumber)
            .filter(n => typeof n === "number" || (typeof n === "string" && String(n).trim()));

        const unique = new Set(attemptNumbers.map(n => Number(n)));
        const attemptsCount = unique.size;

        let maxAttempt = 0;
        unique.forEach(n => { if (n > maxAttempt) maxAttempt = n; });

        return { attemptsCount, maxAttempt };

    } catch (e) {
        console.warn("⚠ getStudentAttemptsCountSafe falló:", e.message);
        return null;
    }
}


const backButton = document.getElementById("backButton");
if (backButton) {
    backButton.addEventListener("click", () => {
        if (window.nav && typeof window.nav.goBack === "function") {
            window.nav.goBack();
            return;
        }

        
        window.history.back();
    });
}

document.addEventListener("DOMContentLoaded", () => {

    const dropButton = document.getElementById("drop-course-btn");
    const courseId = localStorage.getItem("selectedCourseId");
    const userId = localStorage.getItem("userId");

    if (!dropButton || !courseId || !userId) return;

    dropButton.addEventListener("click", async () => {

        const confirmDrop = confirm(
            "¿Estás seguro de que deseas darte de baja del curso?\n\n" +
            "Perderás acceso inmediato a los contenidos y quizzes."
        );

        if (!confirmDrop) return;

        try {
            const result = await window.api.unenrollStudentFromCourse(courseId, userId);

            if (result.success) {
                alert("Te has dado de baja del curso.");

     
                localStorage.removeItem("selectedCourseId");

          
             
            } else {
                alert(result.message || "No se pudo completar la acción.");
            }

        } catch (error) {
            console.error("❌ Error al darse de baja:", error);
            alert("Ocurrió un error inesperado.");
        }

           window.nav.goTo("displayStudentCourses");
    });
});
