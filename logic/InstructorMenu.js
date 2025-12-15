window.addEventListener("DOMContentLoaded", () => {
    
    const name = localStorage.getItem('userName');
    const surname = localStorage.getItem('userPaternalSurname');
    
    const instructorId = localStorage.getItem('userId'); 
    console.log("ID de Instructor leído:", instructorId);

    const nameDisplayElement = document.getElementById('instructorNameDisplay');

    if (nameDisplayElement) {
        nameDisplayElement.textContent = `${name} ${surname}`;
    }

    getInstructorCourses(instructorId); 
    
});


async function getInstructorCourses(instructorId) {
    try {

        const response = await window.api.getCourses(instructorId); 

        if (response.success) {
            const serverData = response.data; 
            const coursesArray = serverData.result || []; 
            const totalCount = serverData.count || 0; 
            
            renderCourses(coursesArray, totalCount); 

        } else {
            console.error("Error IPC al cargar cursos:", response.message);
            const container = document.getElementById('coursesContainer');
            if (container) {
                 container.innerHTML = `<p style="color: red;">Error al cargar cursos: ${response.message}</p>`;
            }
        }
    } catch (err) {
        console.error("Fallo de red o IPC:", err);
        const container = document.getElementById('coursesContainer');
        if (container) {
             container.innerHTML = '<p style="color: red;">Error de conexión con el microservicio de cursos.</p>';
        }
    }
}


function renderCourses(courses, totalCount) { 
    const container = document.getElementById('coursesContainer'); 
    const activeCoursesCount = document.getElementById('activeCoursesCount');
    
    if (!container) return; 
    if (activeCoursesCount) {
        activeCoursesCount.textContent = totalCount; 
    }
    
    if (courses && courses.length > 0) {
        let htmlContent = '';
        
        courses.forEach(course => {
            htmlContent += `
            <div class="course-item clickable" data-course-id="${course.cursoId}">
                <h4>${course.name} (${course.category})</h4>
                <p>Estado: ${course.state}</p>
                <p>${course.description.substring(0, 80)}...</p>
                <p>Inicio: ${new Date(course.startDate).toLocaleDateString()}</p>
            </div>
        `;
    });
        container.innerHTML = htmlContent;
        attachCourseCardListeners();
        
    } else {
        if (activeCoursesCount) {
            activeCoursesCount.textContent = '0';
        }
        container.innerHTML = '<p>No tienes cursos activos. ¡Crea uno nuevo!</p>';
    }
}

function attachCourseCardListeners() {
    const courseCards = document.querySelectorAll('.course-item.clickable');
    
    courseCards.forEach(card => {
        card.addEventListener('click', () => {
            const courseId = card.getAttribute('data-course-id');
            
            if (courseId) {

                localStorage.setItem('CourseId', courseId);
                window.location.href = 'CourseManagement.html'; 
            } else {
                console.error("No se pudo encontrar el ID del curso para esta tarjeta.");
            }
        });
    });
}