window.addEventListener('DOMContentLoaded', () => {
    
    const courseId = localStorage.getItem('CourseId');
    const instructorName = localStorage.getItem('userName') + ' ' + localStorage.getItem('userPaternalSurname');

    if (!courseId) {
        alert('Error: ID del curso no encontrado. Volviendo al menú principal.');
        window.location.href = 'InstructorMainMenu.html';
        return;
    }
    
    const instructorNameDisplay = document.getElementById('instructorNameDisplay');
    if (instructorNameDisplay) {
        instructorNameDisplay.textContent = instructorName.trim();
    }
    
    loadCourseDetails(courseId);


    const editButton = document.getElementById('editInfoBtn');
    const contentButton = document.getElementById('contentBtn');
    const quizzButton = document.getElementById('quizBtn');
    
    if (editButton) {
        editButton.addEventListener('click', () => {
            if (courseId) {
                window.location.href = 'EditCourse.html'; 
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
                window.location.href = 'contentManagement.html'; 
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
                window.location.href = 'quizManagement.html'; 
            } else {
                alert("Error: No se pudo encontrar el ID del curso para ver sus quizes.");
            }
        });
    } else {
        console.error("El botón 'quiztBtn' no fue encontrado en el DOM.");
    }


});


async function loadCourseDetails(courseId) {
    try {
        const response = await window.api.getCourseDetails(courseId);
        
        if (response.success) {
            const serverResponse = response.data; 
            const courseDetails = serverResponse.result && serverResponse.result.length > 0
                                ? serverResponse.result[0]
                                : null;
            
            if (courseDetails) {
                renderCourseData(courseDetails); 
            } else {
                document.getElementById('courseTitleDisplay').textContent = 'Curso no encontrado';
                document.getElementById('descriptionDisplay').textContent = 'El curso seleccionado no existe o no tiene datos.';
            }
        } else {
            document.getElementById('courseTitleDisplay').textContent = 'Error al cargar detalles';
            document.getElementById('descriptionDisplay').textContent = response.message || 'Fallo de servidor al obtener curso.';
        }
    } catch (err) {
        document.getElementById('courseTitleDisplay').textContent = 'Error de conexión';
        document.getElementById('descriptionDisplay').textContent = 'No se pudo conectar con el microservicio de cursos.';
        console.error("Fallo de red:", err);
    }
}

function renderCourseData(course) {
    if (!course) return;
    
    
    document.getElementById('courseTitleDisplay').textContent = course.name || 'Sin nombre';
    localStorage.setItem('CourseName', course.name);
    document.getElementById('courseIdDisplay').textContent = course.cursoId || localStorage.getItem('CourseId') || 'N/A';
    document.getElementById('categoryDisplay').textContent = course.category || '--';
    
    document.getElementById('startDateDisplay').textContent = course.startDate 
        ? new Date(course.startDate).toLocaleDateString() 
        : '--';
    document.getElementById('endDateDisplay').textContent = course.endDate 
        ? new Date(course.endDate).toLocaleDateString() 
        : '--';
        
    document.getElementById('stateDisplay').textContent = course.state || '--';
    document.getElementById('descriptionDisplay').textContent = course.description || 'No hay descripción disponible.';

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