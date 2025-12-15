window.addEventListener('DOMContentLoaded', () => {
    
    const courseId = localStorage.getItem('CourseId');
    const courseName = localStorage.getItem('CourseName');
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

    const courseNameDisplay = document.getElementById('courseNameDisplay');
    if (courseNameDisplay) {
        courseNameDisplay.textContent = courseName;
    }

    loadStudents(courseId);


});    


async function loadStudents(courseId) {
    const container = document.getElementById('responsesContainer');
    const loadingMessage = document.getElementById('loadingMessage');
    
    try {
        const result = await window.api.getStudentsByCourse(courseId);

        if (result.success && result.students && result.students.length > 0) {
            renderStudentsTable(result.students, container);
            loadingMessage.style.display = 'none'; 
        } else if (result.success) {
            container.innerHTML = "<p class='info-message'>Aún no hay estudiantes inscritos en este curso.</p>";
            loadingMessage.style.display = 'none';
        } else {
            container.innerHTML = `<p class='error'>Error al cargar estudiantes: ${result.message}</p>`;
        }
    } catch (error) {
        console.error("Error al obtener estudiantes por curso:", error);
        container.innerHTML = `<p class='error'>Fallo de conexión con el servicio de estudiantes.</p>`;
    }
}

function renderStudentsTable(students, container) {
    let html = `
    <table class="data-table">
        <thead>
            <tr>
                <th>ID Estudiante</th>
                <th>Nombre Completo</th>
                <th>Calificación Promedio</th>
                <th>Reportes</th>
            </tr>
        </thead>
        <tbody>
    `;

    students.forEach(student => {

        const numericAverage = parseFloat(student.average) || 0; 
        const averageScore = numericAverage.toFixed(2);
        const studentName = student.name || 'Desconocido';
        localStorage.setItem('studentName', student.name);
        localStorage.setItem('studentId', student.studentId);
        
        html += `
        <tr>
            <td>${student.studentId}</td>
            <td>${studentName}</td>
            <td><strong>${averageScore}</strong></td>
            <td>
                <button class="btn-action btn-secondary btn-sm" onclick="viewStudentReport('${student.studentId}', '${studentName}')">
                    Ver Reporte
                </button>
            </td>
        </tr>
        `;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;
}

function viewStudentReport() {
    const courseId = localStorage.getItem('CourseId'); 

    const studentId = localStorage.getItem('studentId');
    const studentName = localStorage.getItem('studentName');

    
    
    alert(`Preparando para ver reporte detallado de ${studentName} (ID: ${studentId}) en el curso ${courseId}.`);
    
}