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

    loadQuizzes(courseId);    

    document.getElementById('createQuizBtn').addEventListener('click', () => {
        window.location.href = 'addQuiz.html';
   });
    

});



function handleCardClick(quizId, quizTitle) {
    localStorage.setItem('CurrentQuizId', quizId);
    localStorage.setItem('CurrentQuizTitle', quizTitle);
    window.location.href = 'editQuiz.html'; 

}


async function loadQuizzes(courseId) {
    const quizzesContainer = document.getElementById('quizzesContainer');
    quizzesContainer.innerHTML = "<p id='loadingMessage'>Cargando cuestionarios...</p>";
    
    try {
        const result = await window.api.getQuizzesByCourse(courseId); 
        const quizzesArray = result.result;

        if (result.success && quizzesArray && quizzesArray.length > 0) {
            renderQuizzes(quizzesArray, quizzesContainer);
        } else if (result.success) {
            quizzesContainer.innerHTML = "<p>No hay cuestionarios creados para este curso. ¡Usa el botón para agregar uno!</p>";
        } else {
            quizzesContainer.innerHTML = `<p class='error'>Error al cargar: ${result.message || 'Fallo de servidor'}</p>`;
        }
    } catch (error) {
        console.error('Fallo de comunicación IPC para Quizzes:', error);
        quizzesContainer.innerHTML = `<p class='error'>Fallo de conexión o error interno. (Ver consola)</p>`;
    }
}


function renderQuizzes(quizzes, containerElement) {
    let html = '';
    
    quizzes.forEach(quiz => {
        const quizId = quiz.quizId || quiz.id;
        const statusText = quiz.numberQuestion > 0 ? 'Activo' : 'Borrador';
        const statusClass = quiz.numberQuestion > 0 ? 'status-published' : 'status-draft';
        const formattedDate = quiz.creationDate 
            ? new Date(quiz.creationDate).toLocaleDateString()
            : 'N/D';

        html += `
        <div class="quiz-card clickable-card" data-quiz-id="${quizId}">
            
            <div class="card-content" onclick="handleCardClick('${quizId}')">
                <div class="card-header">
                    <span class="quiz-status ${statusClass}">${statusText}</span>
                </div>
                <div class="card-body">
                    <h4>${quiz.title}</h4>
                    <p class="quiz-metadata">
                        Preguntas: <strong>${quiz.numberQuestion || 0}</strong> | 
                        Creación: ${formattedDate}
                    </p>
                    <p class="quiz-description">${quiz.description ? quiz.description.substring(0, 150) + (quiz.description.length > 150 ? '...' : '') : 'Sin descripción'}</p>
                </div>
            </div>

            /*<div class="card-footer">
                <button onclick="handleAnswers('${quizId}', '${quiz.title}')" class="btn-action btn-answers">Ver resultados</button>
            </div>
            
            </div> `;
            
    });
    
    containerElement.innerHTML = `<div class="cards-grid">${html}</div>`;
}


async function handleDeleteQuiz(quizId, quizTitle) {
    if (!confirm(`¿Está seguro de que desea eliminar el cuestionario "${quizTitle}"?`)) {
        return;
    }
    
    try {
        const response = await window.api.deleteQuiz(quizId);
        
        if (response.success) {
            alert(`Cuestionario "${quizTitle}" eliminado exitosamente.`);
            const courseId = localStorage.getItem('CourseId'); 
            loadQuizzes(courseId); 
        } else {
            alert(`Error al eliminar: ${response.message || 'Fallo de servidor.'}`);
        }
    } catch (error) {
        console.error('Fallo en la eliminación de Quiz:', error);
        alert('Error de conexión al intentar eliminar el cuestionario.');
    }
}


async function handleAnswers(quizId, quizTitle) {
    window.location.href = 'studentsAnswersQuiz.html';
    
}
