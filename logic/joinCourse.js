window.addEventListener("DOMContentLoaded", async () => {

   
    const sidebarName = document.getElementById("studentNameDisplay");
    const userName = localStorage.getItem("userName");
    const userSurname = localStorage.getItem("userPaternalSurname");

    if (sidebarName && userName && userSurname)
        sidebarName.textContent = `${userName} ${userSurname}`;


   

    document.getElementById("navMisCursos")?.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.nav.goTo("displayStudentCourses");
    });

    document.getElementById("navVerCursos")?.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.nav.goTo("WatchCourse");
    });

    document.getElementById("navChat")?.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.nav.goTo("ChatView");
    });

    document.getElementById("navPerfil")?.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.nav.goTo("Profile");
    });

    document.getElementById("navLogout")?.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.nav.goTo("login");
    });



   
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
    const dropButton = document.getElementById("drop-button");
    joinButton.textContent = "Unirme al curso";
    dropButton.style.display = "none";

    try {
       
        const courseResponse = await window.api.getCourseDetails(courseId);
        const course = courseResponse.data?.result;

        if (!course) throw new Error("Formato inesperado en getCourseDetails");


       
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


       
        const instructorResponse = await window.api.getInstructorFromCourse(courseId);
        const instructorList = instructorResponse.data?.instructor || [];

        if (instructorList.length > 0) {
            const ins = instructorList[0];
            instructorEl.textContent = `Instructor: ${ins.name} (${ins.email})`;
        } else {
            instructorEl.textContent = "Instructor: No disponible";
        }


       
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


       
        quizzesList.innerHTML = "<li>No hay cuestionarios disponibles.</li>";


       

        let enrolled = false;

        if (userId) {
            const enrolledResponse = await window.api.getCoursesByStudent(userId);

            console.log("FULL RESPONSE getCoursesByStudent:", enrolledResponse);

            
            const list =
                enrolledResponse?.data?.data ||  
                enrolledResponse?.data?.result ||
                enrolledResponse?.data?.courses ||
                [];

            console.log("CURSOS PROCESADOS:", list);

            if (Array.isArray(list)) {
                enrolled = list.some(c => String(c.cursoId) === String(courseId));
            }
        }

        function updateButtons() {
            if (enrolled) {
                joinButton.style.display = "none";
                dropButton.style.display = "inline-block";
                dropButton.textContent = "Darse de baja del curso";
            } else {
                dropButton.style.display = "none";
                joinButton.style.display = "inline-block";
                joinButton.textContent = "Unirme al curso";  
            }
        }


        updateButtons();



       
        joinButton.addEventListener("click", async () => {

            if (!userId) {
                alert("Debes iniciar sesión para unirte al curso.");
                return;
            }

            const joinResponse = await window.api.joinCourse({
                studentUserId: userId,
                cursoId: courseId
            });

            if (joinResponse.success) {
                enrolled = true;
                updateButtons();
                alert("¡Te has unido al curso!");
            } else {
                alert(joinResponse.message || "No fue posible unirse al curso.");
            }
        });


       
        dropButton.addEventListener("click", async () => {

            const confirmDrop = confirm(
                "¿Estás seguro de que deseas darte de baja del curso?\n\n" +
                "Perderás acceso inmediato a los contenidos y quizzes."
            );

            if (!confirmDrop) return;

            const result = await window.api.unenrollStudentFromCourse(courseId, userId);

            if (result.success) {
                enrolled = false;
                updateButtons();
                alert("Te has dado de baja del curso.");
            } else {
                alert(result.message || "No se pudo completar la acción.");
            }
        });


    } catch (err) {
        console.error("❌ Error cargando datos del curso:", err);
    }
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