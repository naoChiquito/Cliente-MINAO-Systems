window.addEventListener("DOMContentLoaded", async () => {

    /* ============================================================
       MOSTRAR NOMBRE DEL ALUMNO EN EL SIDEBAR
    ============================================================ */
    const sidebarName = document.getElementById("studentNameDisplay");
    const userName = localStorage.getItem("userName");
    const userSurname = localStorage.getItem("userPaternalSurname");

    if (sidebarName && userName && userSurname)
        sidebarName.textContent = `${userName} ${userSurname}`;


    /* ============================================================
       NAVEGACIÓN DEL SIDEBAR
    ============================================================ */
    document.getElementById("navMisCursos")?.addEventListener("click", () => {
        window.nav.goTo("displayStudentCourses.html");
    });

    document.getElementById("navVerCursos")?.addEventListener("click", () => {
        window.nav.goTo("watchCourses.html");
    });

    document.getElementById("navChat")?.addEventListener("click", () => {
        window.nav.goTo("ChatView.html");
    });

    document.getElementById("navPerfil")?.addEventListener("click", () => {
        window.nav.goTo("Profile.html");
    });

    document.getElementById("navLogout")?.addEventListener("click", () => {
        window.nav.goTo("Login.html");
    });


    /* ============================================================
       DATOS DEL CURSO
    ============================================================ */
    const courseId = localStorage.getItem("selectedCourseId");
    if (!courseId) {
        alert("No se recibió ID de curso.");
        return;
    }

    const userId = localStorage.getItem("userId");

    const titleEl = document.getElementById("course-title");
    const descEl = document.getElementById("course-description");
    const catEl = document.getElementById("course-category");
    const datesEl = document.getElementById("course-dates");
    const instructorEl = document.getElementById("course-instructor");

    const contentsList = document.getElementById("contents-list");
    const quizzesList = document.getElementById("quizzes-list");

    const joinButton = document.getElementById("join-button");


    try {
        /* ================================
           1. Obtener información del curso
        ================================= */
        const courseResponse = await window.api.getCourseDetails(courseId);
        const course = courseResponse.data?.result;

        if (!course) throw new Error("Formato inesperado en getCourseDetails");


        /* ============================
           Recortar el formato de fecha
        ============================ */
        function formatDate(dateString) {
            if (!dateString) return "";
            const date = new Date(dateString);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const day = String(date.getDate()).padStart(2, "0");
            return `${year}/${month}/${day}`;
        }


        titleEl.textContent = course.name;
        descEl.textContent = `Descripción: ${course.description || "Sin descripción"}`;
        catEl.textContent = `Categoría: ${course.category || "N/A"}`;
        datesEl.textContent = `Fechas: ${formatDate(course.startDate)} — ${formatDate(course.endDate)}`;


        /* ================================
           2. INSTRUCTOR DEL CURSO
        ================================= */
        const instructorResponse = await window.api.getInstructorFromCourse(courseId);
        const instructorList = instructorResponse.data?.instructor || [];

        if (instructorList.length > 0) {
            const ins = instructorList[0];
            instructorEl.textContent = `Instructor: ${ins.name} (${ins.email})`;
        } else {
            instructorEl.textContent = "Instructor: No disponible";
        }


        /* ================================
           3. CONTENIDOS
        ================================= */
        const contents = await window.api.getCourseContent(courseId);
        const contentArray = contents?.data?.results || [];

        contentsList.innerHTML = "";

        if (contentArray.length > 0) {
            contentsList.innerHTML = contentArray
                .map(ct => `
                    <li>
                        <b>${ct.title}</b> — ${ct.type}
                        <p>${ct.descripcion || ""}</p>
                    </li>
                `)
                .join("");
        } else {
            contentsList.innerHTML = "<li>No hay contenidos en este curso.</li>";
        }


        /* ================================
           4. QUIZZES (AÚN NO IMPLEMENTADO)
        ================================= */
        quizzesList.innerHTML = "<li>No hay cuestionarios disponibles.</li>";


        /* =======================================================
           5. Validar inscripción
        ======================================================== */

        let enrolled = false;

        if (userId) {
            const enrolledResponse = await window.api.getCoursesByStudent(userId);
            const list =
                enrolledResponse?.data?.courses ||
                enrolledResponse?.data ||
                [];

            if (Array.isArray(list)) {
                enrolled = list.some(c => c.cursoId == courseId);
            }
        }

        function updateJoinButton() {
            if (enrolled) {
                joinButton.textContent = "Darse de baja del curso";
                joinButton.classList.add("danger");
            } else {
                joinButton.textContent = "Unirme al curso";
                joinButton.classList.remove("danger");
            }
        }

        updateJoinButton();


        /* =======================================================
           6. Acción del botón: UNIRSE / DARSE DE BAJA
        ======================================================== */
        joinButton.addEventListener("click", async () => {

            if (!userId) {
                alert("Debes iniciar sesión para unirte al curso.");
                return;
            }

            if (!enrolled) {
                const joinResponse = await window.api.joinCourse({
                    studentUserId: userId,
                    joinCode: course.joinCode
                });

                if (joinResponse.success) {
                    enrolled = true;
                    updateJoinButton();
                    alert("¡Te has unido al curso!");
                } else {
                    alert(joinResponse.message || "No fue posible unirse al curso.");
                }

            } else {
                const confirmDrop = confirm(
                    "¿Estás seguro de que deseas darte de baja de este curso?\n\n" +
                    "Perderás acceso inmediato a los contenidos y quizzes."
                );

                if (!confirmDrop) return;

                const result = await window.api.unenrollStudentFromCourse(courseId, userId);

                if (result.success) {
                    enrolled = false;
                    updateJoinButton();
                    alert("Te has dado de baja del curso.");
                } else {
                    alert(result.message || "No se pudo completar la acción.");
                }
            }
        });


    } catch (err) {
        console.error("❌ Error cargando datos del curso:", err);
    }
});
