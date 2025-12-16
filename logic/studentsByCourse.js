window.addEventListener('DOMContentLoaded', () => {
  const courseId = localStorage.getItem('CourseId');
  const courseName = localStorage.getItem('CourseName');
  const instructorName = (localStorage.getItem('userName') || '') + ' ' + (localStorage.getItem('userPaternalSurname') || '');

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
    courseNameDisplay.textContent = courseName || courseId;
  }

  loadStudents(courseId);
});

async function loadStudents(courseId) {
  const container = document.getElementById('responsesContainer');
  const loadingMessage = document.getElementById('loadingMessage');

  if (loadingMessage) loadingMessage.textContent = `Cargando estudiantes del curso ${courseId}...`;

  try {
    const raw = await window.api.getStudentsByCourse(courseId);
    console.log("📥 getStudentsByCourse raw:", raw);

    const normalized = normalizeStudentsByCourseResponse(raw);
    console.log("🧩 getStudentsByCourse normalized:", normalized);

    if (normalized.success && normalized.students.length > 0) {
      renderStudentsTable(normalized.students, container);
      if (loadingMessage) loadingMessage.style.display = 'none';
    } else if (normalized.success) {
      if (container) container.innerHTML = "<p class='info-message'>Aún no hay estudiantes inscritos en este curso.</p>";
      if (loadingMessage) loadingMessage.style.display = 'none';
    } else {
      if (container) container.innerHTML = `<p class='error'>Error al cargar estudiantes: ${normalized.message || 'Error desconocido'}</p>`;
      if (loadingMessage) loadingMessage.style.display = 'none';
    }
  } catch (error) {
    console.error("Error al obtener estudiantes por curso:", error);
    if (container) container.innerHTML = `<p class='error'>Fallo de conexión con el servicio de estudiantes.</p>`;
    if (loadingMessage) loadingMessage.style.display = 'none';
  }
}




function toNumberOrNull(value) {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}



function normalizeStudentsByCourseResponse(resp) {
  if (!resp) return { success: false, students: [], message: "Respuesta vacía del IPC" };

  if (resp.success === false) {
    return { success: false, students: [], message: resp.message || "Error desconocido" };
  }

  
  if (Array.isArray(resp.students)) {
    return { success: true, students: resp.students, message: resp.message || "" };
  }

  
  if (Array.isArray(resp.result)) {
    return { success: true, students: resp.result, message: resp.message || "" };
  }

  
  if (Array.isArray(resp.data)) {
    return { success: true, students: resp.data, message: resp.message || "" };
  }

  
  if (resp.data && Array.isArray(resp.data.students)) {
    return { success: true, students: resp.data.students, message: resp.message || resp.data.message || "" };
  }

  
  if (resp.result && Array.isArray(resp.result.students)) {
    return { success: true, students: resp.result.students, message: resp.message || resp.result.message || "" };
  }

  
  return { success: true, students: [], message: resp.message || "Sin estudiantes" };
}



function renderStudentsTable(students, container) {
  if (!container) {
    console.warn("⚠ No existe #responsesContainer en el DOM.");
    return;
  }

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
    const studentId = student.studentId ?? student.userId ?? student.id ?? 'N/D';

    const studentName =
      student.name ||
      student.fullName ||
      `${student.firstName || ""} ${student.lastName || ""}`.trim() ||
      'Desconocido';

    
    const avgNum = toNumberOrNull(student.average);
    const averageScore = avgNum !== null ? avgNum.toFixed(2) : 'N/A';


    html += `
      <tr>
        <td>${studentId}</td>
        <td>${studentName}</td>
        <td><strong>${averageScore}</strong></td>
        <td>
          <button class="btn-action btn-secondary btn-sm"
                  onclick="viewStudentReport('${studentId}', '${studentName.replace(/'/g, "\\'")}')">
            Ver Reporte
          </button>
        </td>
      </tr>
    `;
  });

  html += `</tbody></table>`;
  container.innerHTML = html;
}



function viewStudentReport(studentId, studentName) {
  const courseId = localStorage.getItem('CourseId'); 
  localStorage.setItem('ReportStudentId', String(studentId));
  localStorage.setItem('ReportStudentName', String(studentName));
  localStorage.setItem('ReportCourseId', courseId);
  
  alert(`Preparando para ver reporte detallado de ${studentName} (ID: ${studentId}) en el curso ${courseId}.`);
  window.location.href = 'studentReportView.html';

}