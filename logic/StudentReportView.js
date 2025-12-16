document.addEventListener('DOMContentLoaded', () => {
    const studentId = localStorage.getItem('ReportStudentId');
    const courseId = localStorage.getItem('ReportCourseId');
    const studentName = localStorage.getItem('ReportStudentName');
    
    const instructorName = (localStorage.getItem('userName') || '') + ' ' + (localStorage.getItem('userPaternalSurname') || '');

    const instructorNameDisplay = document.getElementById('instructorNameDisplay');
    if (instructorNameDisplay) {
        instructorNameDisplay.textContent = instructorName.trim();
    }

    if (!studentId || !courseId) {
        document.getElementById('reportContainer').innerHTML = "<p class='error-message'>Error: Falta el ID del estudiante o del curso para generar el reporte.</p>";
        return;
    }

    const studentNameDisplay = document.getElementById('studentNameDisplay');
    if (studentNameDisplay) {
        studentNameDisplay.textContent = studentName || 'Estudiante';
    }

    loadReportHtml(studentId, courseId);
});

async function loadReportHtml(studentId, courseId) {
    const container = document.getElementById('reportContainer');
    
    if (!container) return;

    try {
        const response = await window.api.getStudentReportHtml(studentId, courseId); 

        if (response.success) {
            container.innerHTML = response.data; 
        } else {
            console.error("Error del servicio:", response.message);
            alert('Error del Servidor: ${response.message}');
        }
        
    } catch (error) {
        console.error("Error IPC/General:", error);
        alert('error de Conexión. No se pudo cargar el reporte. ${error.message}');
    }
}