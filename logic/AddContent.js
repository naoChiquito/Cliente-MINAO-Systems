window.addEventListener('DOMContentLoaded', () => {
    
    const courseId = localStorage.getItem('CourseId');
    const instructorName = localStorage.getItem('userName') + ' ' + localStorage.getItem('userPaternalSurname');
    const courseName = localStorage.getItem('CourseName');


    if (!courseId) {
        alert('Error: ID del curso no encontrado. Volviendo al menú principal.');
        window.location.href = 'InstructorMainMenu.html';
        return;
    }
    
    const instructorNameDisplay = document.getElementById('instructorNameDisplay');
    if (instructorNameDisplay) {
        instructorNameDisplay.textContent = instructorName.trim();
    }

    const courseNameDisplay = document.getElementById('courseTitleDisplay');
    if (courseNameDisplay) {
        courseNameDisplay.textContent = courseName.trim();
    }    

    setupModuleSubmission(courseId);

});


function setupModuleSubmission(courseId) {
    const form = document.getElementById('addModuleForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const moduleData = {
            title: document.getElementById('title').value,
            descripcion: document.getElementById('descripcion').value,
            type: document.getElementById('type').value, 
            cursoId: courseId, 
        };

        console.log("Datos del Módulo Enviados:", moduleData);

        try {
            const response = await window.api.createContent(moduleData); 
            
            if (response.success) {
                alert('Módulo creado con éxito.');
                window.location.href = 'contentManagement.html'; 
            } else {
                alert(`Error: ${response.message || 'Fallo de servidor.'}`);
            }
        } catch (error) {
            alert('Error de Conexión. No se pudo contactar al microservicio.');
            console.error('Fallo en la creación del módulo:', error);
        }
    });
}