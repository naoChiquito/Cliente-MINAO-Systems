document.addEventListener("DOMContentLoaded", async function() {
    const studentNameDisplay = document.getElementById('studentNameDisplay');
    const coursesContainer = document.getElementById('coursesContainer');
    const courseSearchInput = document.getElementById('courseSearch');

    const userEmail = localStorage.getItem("userEmail");
    const studentId = localStorage.getItem("userId");

    /* ============================
       1. Mostrar nombre del alumno
    ============================ */
    async function loadStudentName() {
        try {
            if (!userEmail) {
                console.error("❌ No hay email en localStorage.");
                return;
            }

            console.log("📡 Solicitando datos del usuario:", userEmail);

            const response = await window.api.findUserByEmailJSON(userEmail);

            console.log("📥 Usuario recibido:", response);

            if (!response.success || !response.user) {
                console.error("❌ No se pudo obtener el usuario:", response.message);
                return;
            }

            const u = response.user;

            // Mostrar nombre completo
            const fullName = `${u.userName || ""} ${u.paternalSurname || ""}`.trim();
            studentNameDisplay.textContent = fullName || "[Nombre]";

            // Guardar para usos futuros (opcional)
            localStorage.setItem("userName", u.userName || "");
            localStorage.setItem("userPaternalSurname", u.paternalSurname || "");

        } catch (error) {
            console.error("❌ Error cargando nombre del alumno:", error);
        }
    }

    await loadStudentName();


    let allCourses = [];

    /* ============================
       2. Cargar cursos DEL ESTUDIANTE
    ============================ */
    const loadCourses = async () => {
        try {
            if (!studentId) {
                console.error("❌ No se encontró studentId en localStorage");
                return;
            }

            console.log(`📡 Solicitando cursos del estudiante ${studentId}...`);

            const response = await window.api.getCoursesByStudent(studentId);

            console.log("📥 Cursos recibidos:", response);

            const coursesArray = response?.data?.data;

            if (response.success && Array.isArray(coursesArray)) {
                allCourses = coursesArray;
                displayCourses(allCourses);
            } else {
                console.error("⚠ Formato inesperado:", response);
            }

        } catch (error) {
            console.error("❌ Error al cargar cursos:", error);
        }
    };


    /* ============================
       3. Mostrar cursos en pantalla
    ============================ */
    const displayCourses = (courses) => {
        coursesContainer.innerHTML = "";

        if (courses.length === 0) {
            coursesContainer.innerHTML = `
                <p style="color:#666; font-size: 14px;">No hay cursos disponibles.</p>
            `;
            return;
        }

        courses.forEach(course => {
            const div = document.createElement("div");
            div.classList.add("course-item");

            const start = formatDate(course.startDate);
            const end = formatDate(course.endDate);

            div.innerHTML = `
                <div>
                    <h4>${course.name}</h4>
                    <p style="margin: 0; color:#555;">
                        ${course.category ? `<b>Categoría:</b> ${course.category}<br>` : ""}
                        ${start ? `<b>Inicio:</b> ${start}<br>` : ""}
                        ${end ? `<b>Fin:</b> ${end}<br>` : ""}
                        <b>Estado:</b> ${course.state}
                    </p>
                </div>

                <button class="btn-primary" data-courseid="${course.cursoId}">
                    Ver detalles
                </button>
            `;

            coursesContainer.appendChild(div);
        });

        document.querySelectorAll(".btn-primary").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const id = e.target.dataset.courseid;
                window.nav.goTo(`JoinCourse.html?courseId=${id}`);
            });
        });
    };


    /* ============================
       4. Recortar el formato de fecha
    ============================ */
    function formatDate(dateString) {
        if (!dateString) return "";
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}/${month}/${day}`;
    }

    /* ============================
       5. Buscador en vivo
    ============================ */
    courseSearchInput.addEventListener("input", () => {
        const text = courseSearchInput.value.trim().toLowerCase();

        const filtered = allCourses.filter(c =>
            c.name.toLowerCase().includes(text)
        );

        displayCourses(filtered);
    });

    /* ============================
       6. Inicializar página
    ============================ */
    loadCourses();
});
