document.addEventListener("DOMContentLoaded", async function () {
    const studentNameDisplay = document.getElementById('studentNameDisplay');
    const coursesContainer = document.getElementById('coursesContainer');
    const courseSearchInput = document.getElementById('courseSearch');

    const userEmail = localStorage.getItem("userEmail");
    const studentId = localStorage.getItem("userId");


    async function loadStudentName() {
        try {
            if (!userEmail) {
                console.error("❌ No hay email en localStorage.");
                return;
            }

            const response = await window.api.findUserByEmailJSON(userEmail);

            if (!response.success || !response.user) {
                console.error("❌ No se pudo obtener el usuario:", response.message);
                return;
            }

            const u = response.user;
            const fullName = `${u.userName || ""} ${u.paternalSurname || ""}`.trim();
            studentNameDisplay.textContent = fullName || "[Nombre]";

            localStorage.setItem("userName", u.userName || "");
            localStorage.setItem("userPaternalSurname", u.paternalSurname || "");

        } catch (error) {
            console.error("❌ Error cargando nombre del alumno:", error);
        }
    }

    await loadStudentName();

    let allCourses = [];

    async function loadCourses() {
        try {
            if (!studentId) {
                console.error("❌ No se encontró studentId en localStorage");
                return;
            }

            const response = await window.api.getCoursesByStudent(studentId);
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
    }

    function displayCourses(courses) {
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
    }

  
    function formatDate(dateString) {
        if (!dateString) return "";
        const date = new Date(dateString);
        return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`;
    }

    
    courseSearchInput.addEventListener("input", () => {
        const text = courseSearchInput.value.trim().toLowerCase();
        const filtered = allCourses.filter(c =>
            c.name.toLowerCase().includes(text)
        );
        displayCourses(filtered);
    });

   
    loadCourses();


    document.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-courseid]");
        if (!button) return;

        const courseId = button.dataset.courseid;
        if (!courseId) return;

        localStorage.setItem("selectedCourseId", courseId);
        localStorage.setItem("courseOrigin", "studentCourses");

        window.nav.goTo("EnrolledCourseDetails");
    });
});

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
