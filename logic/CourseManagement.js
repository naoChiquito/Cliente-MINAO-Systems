window.addEventListener('DOMContentLoaded', () => {
        const courseId = (localStorage.getItem('CourseId')
        || localStorage.getItem('courseId')
        || localStorage.getItem('cursoId')
        || ''
    ).trim();

    const instructorName =
        `${(localStorage.getItem('userName') || '').trim()} ${(localStorage.getItem('userPaternalSurname') || '').trim()}`.trim();

    if (!courseId) {
        alert('Error: ID del curso no encontrado. Volviendo al menú principal.');

        if (window.nav && typeof window.nav.goTo === "function") {
            window.nav.goTo("InstructorMainMenu");
        } else {
      
            window.location.href = 'InstructorMainMenu.html';
        }
        return;
    }

    localStorage.setItem('CourseId', courseId);

    const instructorNameDisplay = document.getElementById('instructorNameDisplay');
    if (instructorNameDisplay) {
        instructorNameDisplay.textContent = instructorName || "[Nombre]";
    }

    loadCourseDetails(courseId);

    const editButton = document.getElementById('editInfoBtn');
    const contentButton = document.getElementById('contentBtn');
    const quizzButton = document.getElementById('quizBtn');
    const studentButton = document.getElementById('studentBtn');

    if (editButton) {
        editButton.addEventListener('click', () => {
            if (courseId) {
                if (window.nav && typeof window.nav.goTo === "function") window.nav.goTo('EditCourse');
                else window.location.href = 'EditCourse.html';
            } else {
                alert("Error: No se pudo encontrar el ID del curso para editar.");
            }
        });
    } else {
        console.error("El botón 'editInfoBtn' no fue encontrado en el DOM.");
    }

    if (contentButton) {
        contentButton.addEventListener('click', () => {
            if (courseId) {
                if (window.nav && typeof window.nav.goTo === "function") window.nav.goTo('contentManagement');
                else window.location.href = 'contentManagement.html';
            } else {
                alert("Error: No se pudo encontrar el ID del curso para ver su contenido.");
            }
        });
    } else {
        console.error("El botón 'contentBtn' no fue encontrado en el DOM.");
    }

    if (quizzButton) {
        quizzButton.addEventListener('click', () => {
            if (courseId) {
                if (window.nav && typeof window.nav.goTo === "function") window.nav.goTo('quizManagement');
                else window.location.href = 'quizManagement.html';
            } else {
                alert("Error: No se pudo encontrar el ID del curso para ver sus quizes.");
            }
        });
    } else {
        console.error("El botón 'quiztBtn' no fue encontrado en el DOM.");
    }

    if (studentButton) {
        studentButton.addEventListener('click', () => {
            if (courseId) {
                if (window.nav && typeof window.nav.goTo === "function") window.nav.goTo('studentsByCourse');
                else window.location.href = 'studentsByCourse.html';
            } else {
                alert("Error: No se pudo encontrar el ID del curso para ver sus estudiantes.");
            }
        });
    } else {
        console.error("El botón 'studentBtn' no fue encontrado en el DOM.");
    }
});


async function loadCourseDetails(courseId) {
    try {
        const response = await window.api.getCourseDetails(courseId);
        console.log("📥 IPC getCourseDetails:", response);

        if (response && response.success) {
            const serverResponse = response.data;

            
            const rawResult = (serverResponse && serverResponse.result !== undefined)
                ? serverResponse.result
                : serverResponse;

            let courseDetails = null;

            if (Array.isArray(rawResult)) {
                courseDetails = rawResult.length > 0 ? rawResult[0] : null;
            } else if (rawResult && typeof rawResult === "object") {
                courseDetails = rawResult;
            }

            if (courseDetails) {
                renderCourseData(courseDetails);
            } else {
                document.getElementById('courseTitleDisplay').textContent = 'Curso no encontrado';
                document.getElementById('descriptionDisplay').textContent = 'El curso seleccionado no existe o no tiene datos.';
            }
        } else {
            document.getElementById('courseTitleDisplay').textContent = 'Error al cargar detalles';
            document.getElementById('descriptionDisplay').textContent = response?.message || 'Fallo de servidor al obtener curso.';
        }
    } catch (err) {
        document.getElementById('courseTitleDisplay').textContent = 'Error de conexión';
        document.getElementById('descriptionDisplay').textContent = 'No se pudo conectar con el microservicio de cursos.';
        console.error("Fallo de red:", err);
    }
}

function renderCourseData(course) {
    if (!course) return;

    const id = course.cursoId || course.courseId || localStorage.getItem('CourseId') || 'N/A';
    const name = course.name || course.courseName || 'Sin nombre';

    document.getElementById('courseTitleDisplay').textContent = name;
    localStorage.setItem('CourseName', name);

    document.getElementById('courseIdDisplay').textContent = id;
    document.getElementById('categoryDisplay').textContent = course.category || '--';

    document.getElementById('startDateDisplay').textContent = course.startDate
        ? new Date(course.startDate).toLocaleDateString()
        : '--';

    document.getElementById('endDateDisplay').textContent = course.endDate
        ? new Date(course.endDate).toLocaleDateString()
        : '--';

    document.getElementById('stateDisplay').textContent = course.state || '--';
    document.getElementById('descriptionDisplay').textContent = course.description || 'No hay descripción disponible.';

    localStorage.setItem('CourseId', String(id));
}

function updateStatusTag(elementId, statusBoolean, buttonText) {
    const statusElement = document.getElementById(elementId);
    const buttonElement = document.getElementById(elementId.replace('Status', 'Btn'));

    if (statusBoolean) {
        statusElement.textContent = 'Cargado';
        statusElement.className = 'status-tag status-active';
        if (buttonElement) buttonElement.textContent = `Editar ${buttonText}`;
    } else {
        statusElement.textContent = 'No Cargado';
        statusElement.className = 'status-tag status-not-found';
        if (buttonElement) buttonElement.textContent = `Agregar ${buttonText}`;
    }
}
