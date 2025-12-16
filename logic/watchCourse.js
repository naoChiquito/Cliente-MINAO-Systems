document.addEventListener("DOMContentLoaded", async function() {
    const studentNameDisplay = document.getElementById('studentNameDisplay');
    const coursesContainer = document.getElementById('coursesContainer');
    const courseSearchInput = document.getElementById('courseSearch');

   
    const userName = localStorage.getItem('userName');
    const userPaternalSurname = localStorage.getItem('userPaternalSurname');

    if (userName && userPaternalSurname) {
        studentNameDisplay.textContent = `${userName} ${userPaternalSurname}`;
    }

    let allCourses = []; 

   
    const loadCourses = async () => {
        try {
            console.log("📡 Solicitando TODOS los cursos...");
            const response = await window.api.getAllCourses();

            console.log("📥 Cursos recibidos:", response);

            if (response.success && Array.isArray(response.data)) {
                allCourses = response.data;
                displayCourses(allCourses);
            } else {
                console.error("⚠ Formato inesperado:", response);
            }

        } catch (error) {
            console.error("❌ Error al cargar cursos:", error);
        }
    };

   
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

                <button class="btn-primary ver-detalles" data-courseid="${course.cursoId}">
                    Ver detalles
                </button>
            `;

            coursesContainer.appendChild(div);
        });

        
        
        
        document.querySelectorAll(".ver-detalles").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const id = e.target.dataset.courseid;

                
                localStorage.setItem("selectedCourseId", id);

                console.log("➡ Guardado selectedCourseId:", id);

                
                window.nav.goTo("JoinCourse");
            });
        });
    };


   
    function formatDate(dateString) {
        if (!dateString) return "";
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}/${month}/${day}`;
    }

   
    courseSearchInput.addEventListener("input", () => {
        const text = courseSearchInput.value.trim().toLowerCase();

        const filtered = allCourses.filter(c =>
            c.name.toLowerCase().includes(text)
        );

        displayCourses(filtered);
    });
    

   
    loadCourses();
});


document.querySelectorAll(".ver-detalles").forEach(btn => {
    btn.addEventListener("click", (e) => {
        const id = e.target.dataset.courseid;

        localStorage.setItem("selectedCourseId", id);
        localStorage.setItem("courseOrigin", "watchCourses");

        window.nav.goTo("JoinCourse");
    });
});



