

window.addEventListener('DOMContentLoaded', () => {
    
    const courseId = localStorage.getItem('CourseId');
    const instructorName = localStorage.getItem('userName') + ' ' + localStorage.getItem('userPaternalSurname');
    const courseName = localStorage.getItem('CourseName'); 
    const quizName = localStorage.getItem('CurrentQuizTitle');
    const quizId = localStorage.getItem('CurrentQuizId');



    if (!courseId) {
        alert('Error: ID del curso no encontrado. Volviendo al menú principal.');
        window.location.href = 'InstructorMainMenu.html';
        return;
    }
    
    const instructorNameDisplay = document.getElementById('instructorNameDisplay');
    if (instructorNameDisplay) {
        instructorNameDisplay.textContent = instructorName.trim();
    }

    const CurrentQuizIdNameDisplay = document.getElementById('quizIdDisplay');
    if (CurrentQuizIdNameDisplay) {
        CurrentQuizIdNameDisplay.textContent = quizId.trim();
    }

    const CurrentQuizTitleNameDisplay = document.getElementById('quizTitleDisplay');
    if (CurrentQuizTitleNameDisplay) {
        CurrentQuizTitleNameDisplay.textContent = quizName.trim();
    }

    fetchQuizDetails(quizId);


    document.getElementById('addQuestionBtn').addEventListener('click', () => {
        addQuestionBlock(null);
        renumberQuestions();
    });

    document.getElementById('quizEditForm').addEventListener('submit', handleUpdateSubmit);
    document.getElementById('deleteQuizBtn').addEventListener('click', () => {
        handleDeleteQuiz(quizId); 
    });

});

const QUIZ_CONTAINER = document.getElementById('questionsContainer');
let questionCounter = 0; 
const MAX_OPTIONS = 4;

function addQuestionBlock(questionData) {
    questionCounter++;
    const qid = `q${questionCounter}`; 

    const isExisting = !!questionData;
    const initialText = isExisting ? questionData.questionText : '';
    const initialPoints = isExisting ? questionData.points : 1;
    
    let optionsHtml = '';
    const optionsToRender = isExisting ? questionData.options : [];
    
   
    for (let i = 0; i < MAX_OPTIONS; i++) {
        const option = optionsToRender[i];
        const optionId = `${qid}-opt-${i + 1}`;
        
        
        const isCorrect = option ? option.isCorrect === 1 : (i === 0 && !isExisting);
        const optionText = option ? option.optionText : '';
        

        const dbOptionId = option ? option.optionId : '';

        optionsHtml += `
        <div class="option-item" data-db-id="${dbOptionId}">
            <input type="radio" name="correct-option-${qid}" id="${optionId}" 
                   class="option-radio" ${isCorrect ? 'checked' : ''} required>
            <label for="${optionId}" class="radio-label">Opción ${i + 1}</label>
            <input type="text" class="option-text" placeholder="Texto de la respuesta ${i + 1}" value="${optionText}" required>
        </div>
        `;
    }
    
    const dbQuestionId = questionData ? questionData.questionId : '';

    const questionHtml = `
    <div class="question-block" data-qid="${qid}" data-db-id="${dbQuestionId}">
        <hr>
        <h4>Pregunta ${questionCounter}</h4>
        <div class="form-group">
            <label>Texto de la Pregunta:</label>
            <input type="text" class="question-text" value="${initialText}" placeholder="Escribe tu pregunta aquí" required>
        </div>
        <div class="form-group">
            <label>Puntos:</label>
            <input type="number" class="question-points" value="${initialPoints}" min="1" required>
        </div>
        
        <div class="options-container" data-qid="${qid}">
            <h5>Opciones de Respuesta (Selecciona la Correcta):</h5>
            ${optionsHtml}
        </div>
        
        <div class="question-actions">
            <button type="button" class="btn-delete-q btn-action btn-danger" onclick="removeQuestion('${qid}')">Eliminar Pregunta</button>
        </div>
    </div>
    `;

    QUIZ_CONTAINER.insertAdjacentHTML('beforeend', questionHtml);
}


function removeQuestion(qid) {
    const blockToRemove = document.querySelector(`.question-block[data-qid="${qid}"]`);
    if (!blockToRemove) return;

    if (document.querySelectorAll('.question-block').length > 1 && confirm('¿Desea eliminar esta pregunta?')) {
        blockToRemove.remove();
        renumberQuestions();
    } else if (document.querySelectorAll('.question-block').length === 1) {
        alert('El cuestionario debe tener al menos una pregunta.');
    }
}


function renumberQuestions() {
    const questionBlocks = document.querySelectorAll('.question-block');
    
    questionCounter = questionBlocks.length; 

    questionBlocks.forEach((block, index) => {
        const newIndex = index + 1;
        const oldQid = block.dataset.qid;
        const newQid = `q${newIndex}`;

       
        block.querySelector('h4').textContent = `Pregunta ${newIndex}`;
        block.dataset.qid = newQid;

       
        const deleteButton = block.querySelector('.btn-delete-q');
        if (deleteButton) {
            deleteButton.setAttribute('onclick', `removeQuestion('${newQid}')`);
        }

        block.querySelectorAll('.option-item').forEach((item, optionIndex) => {
            const newOptionId = `${newQid}-opt-${optionIndex + 1}`;
            
            const radio = item.querySelector('.option-radio');
            const label = item.querySelector('.radio-label');
            
            if (radio) {
                radio.name = `correct-option-${newQid}`;
                radio.id = newOptionId;
            }
            if (label) {
                label.setAttribute('for', newOptionId);
            }
        });
    });
}

function collectQuizData(courseId) {
    const questions = [];
    const questionBlocks = document.querySelectorAll('.question-block');

    if (questionBlocks.length === 0) {
        throw new Error("El cuestionario debe tener al menos una pregunta.");
    }

    questionBlocks.forEach(block => {
        const qText = block.querySelector('.question-text').value.trim();
        const qPoints = parseInt(block.querySelector('.question-points').value);
        
        if (!qText || isNaN(qPoints) || qPoints <= 0) {
            throw new Error(`La pregunta ${block.dataset.qid} tiene texto o puntos inválidos.`);
        }

        const options = [];
        let hasCorrectOption = false;

        block.querySelectorAll('.option-item').forEach((item, index) => {
            const isCorrect = item.querySelector('.option-radio').checked;
            const oText = item.querySelector('.option-text').value.trim();
            
            if (!oText && index < MAX_OPTIONS) { 
                 throw new Error(`La opción ${index + 1} de la pregunta ${block.dataset.qid} está vacía.`);
            }
            
            if (isCorrect) hasCorrectOption = true;

            options.push({
                text: oText,
                isCorrect: isCorrect
            });
        });

        if (!hasCorrectOption) {
            throw new Error(`La pregunta ${block.dataset.qid} debe tener una respuesta marcada como correcta.`);
        }
        
        questions.push({
            text: qText,
            points: qPoints,
            options: options
        });
    });

    return {
        title: document.getElementById('quizTitle').value.trim(),
        description: document.getElementById('quizDescription').value.trim(),
        cursoId: courseId, 
        status: 'Activo',
        questions: questions
    };
}



async function fetchQuizDetails(quizId) {

    try {
        const response = await window.api.getQuizDetails(quizId); 
        
        if (response.success && response.result) {
            renderQuizDetails(response.result);
        } else {
            throw new Error(response.message || 'No se pudo cargar la información del quiz.');
        }

    } catch (error) {
        alert(`Error al cargar: ${error.message}`);
        console.error('Fallo al obtener detalles del Quiz:', error);
    }
}

function renderQuizDetails(quiz) {
    document.getElementById('quizTitleDisplay').textContent = quiz.title;
    document.getElementById('quizTitle').value = quiz.title;
    document.getElementById('quizDescription').value = quiz.description || '';
    
    QUIZ_CONTAINER.innerHTML = ''; 

    if (quiz.questions && quiz.questions.length > 0) {
        quiz.questions.forEach(question => {
            addQuestionBlock(question); 
        });
    } else {
        addQuestionBlock(null);
    }
    
    renumberQuestions();
}

async function handleUpdateSubmit(e) {
    e.preventDefault();
    const quizId = localStorage.getItem('CurrentQuizId');
    
    try {
        const quizData = collectQuizData(quizId);
        console.log("log: ", quizId);
        
        const response = await window.api.updateQuestionnaire(quizId, quizData); 
        
        if (response.success) {
            alert(`Cuestionario actualizado exitosamente.`);
        } else {
            alert(`Error al actualizar: ${response.message}`);
        }

    } catch (error) {
        alert(`Fallo en la actualización: ${error.message}`);
        console.error('Fallo en la actualización del Quiz:', error);
    }
}

async function handleDeleteQuiz(quizId) {
    const quizTitle = localStorage.getItem('CurrentQuizTitle');
    
    if (!confirm(`¿Está seguro de eliminar el cuestionario "${quizTitle}" (ID: ${quizId})? Esta acción es permanente.`)) {
        return;
    }
    
    try {
        const response = await window.api.deleteQuiz(quizId);
        
        if (response.success) {
            alert(`Cuestionario "${quizTitle}" eliminado exitosamente.`);
            window.location.href = 'QuizManagement.html'; 
        } else {
            alert(`Error al eliminar: ${response.message || 'Fallo de servidor.'}`);
        }
    } catch (error) {
        console.error('Fallo en la eliminación de Quiz:', error);
        alert('Error de conexión al intentar eliminar el cuestionario.');
    }
}