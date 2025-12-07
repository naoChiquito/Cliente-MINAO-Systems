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
    setupFormSubmission(courseId);


    const deactivateButton = document.getElementById('deactivateCourseBtn');
    
    if (deactivateButton) {
        deactivateButton.addEventListener('click', () => {
            if (courseId) {
                setupState(courseId); 
            } else {
                alert('Error: ID del curso no encontrado. No se puede desactivar.');
            }
        });
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
     document.getElementById('courseIdDisplay').textContent = course.cursoId || localStorage.getItem('CourseId') || 'N/A';
    document.getElementById('courseTitleDisplay').textContent = course.name || 'Sin nombre';
    document.getElementById('name').value = course.name || ''; 
    document.getElementById('description').value = course.description || ''; 
    document.getElementById('category').value = course.category || ''; 
    document.getElementById('startDate').textContent = course.startDate 
        ? course.startDate.split('T')[0] 
        : '';
    document.getElementById('endDate').value = course.endDate 
        ? course.endDate.split('T')[0] 
        : '';

}


function setupFormSubmission(courseId) {
    const form = document.getElementById('editCourseForm');
    
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const courseData = {
            cursoId: courseId,
            name: document.getElementById('name').value,
            description: document.getElementById('description').value,
            category: document.getElementById('category').value,
            endDate: document.getElementById('endDate').value,
        };

        const startDateText = document.getElementById('startDate').textContent;
        const endDateValue = document.getElementById('endDate').value;

        const startDate = new Date(startDateText); 
        const endDate = new Date(endDateValue);

        if (endDate <= startDate) {
            alert('Error de Edición: La fecha de fin debe ser posterior a la fecha de inicio.');
            return;
        }

        try {
            const response = await window.api.updateCourse(courseData); 
            
            if (response.success) {
                alert('Curso actualizado exitosamente.');
                window.location.href = 'CourseManagement.html'; 
            } else {
                alert(`Error: ${response.message || 'No se pudo guardar la edición.'}`);
            }
        } catch (error) {
            alert(`Error de Conexión: No se pudo contactar al microservicio.`);
            console.error('Fallo en la petición PATCH:', error);
        }
    });
}


async function setupState(courseId) {
    const newState = "Inactivo";
    const isConfirmed = confirm("ADVERTENCIA: Si desactivas este curso, NO podrá ser activado de nuevo. ¿Estás seguro de continuar?");
    
    if (!isConfirmed) {
        return; 
    }
    try {
        const response = await window.api.setState(courseId, newState); 
        
        if (response.success) {
            alert("Curso desactivado permanentemente.");
            
            window.location.href = 'InstructorMainMenu.html'; 
            
        } else {
            alert(`Error al desactivar: ${response.message || 'Fallo de servidor.'}`);
            console.error("Fallo de desactivación:", response.message);
        }
    } catch (error) {
        alert("Error de conexión: No se pudo contactar al microservicio.");
        console.error("Fallo de red durante la desactivación:", error);
    }    

}