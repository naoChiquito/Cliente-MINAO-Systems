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

    addQuestionBlock(); 
    document.getElementById('addQuestionBtn').addEventListener('click', addQuestionBlock);
    document.getElementById('quizCreationForm').addEventListener('submit', handleFormSubmit);

    document.getElementById('quizCreationForm').dataset.courseId = courseId;

});


const QUIZ_CONTAINER = document.getElementById('questionsContainer');
let questionCounter = 0; 
const MAX_OPTIONS = 4; 


function addQuestionBlock() {
    questionCounter++;
    const qid = `q${questionCounter}`;
    
    let optionsHtml = '';
    for (let i = 1; i <= MAX_OPTIONS; i++) {
        const optionId = `${qid}-opt-${i}`;
        optionsHtml += `
        <div class="option-item">
            <input type="radio" name="correct-option-${qid}" id="${optionId}" 
                   data-qid="${qid}" class="option-radio" ${i === 1 ? 'required' : ''}>
            <label for="${optionId}" class="radio-label">Opción ${i}</label>
            <input type="text" class="option-text" placeholder="Texto de la respuesta ${i}" required>
            </div>
        `;
    }
    

    const questionHtml = `
    <div class="question-block" data-qid="${qid}">
        <hr>
        <h4>Pregunta ${questionCounter}</h4>
        <div class="form-group">
            <label>Texto de la Pregunta:</label>
            <input type="text" class="question-text" placeholder="Escribe tu pregunta aquí" required>
        </div>
        <div class="form-group">
            <label>Puntos:</label>
            <input type="number" class="question-points" placeholder="Puntos (ej: 1)" value="1" min="1" required>
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


async function handleFormSubmit(e) {
    e.preventDefault();
    const statusElement = document.getElementById('formStatus');
    const courseId = e.target.dataset.courseId;
    
    try {
        const quizData = collectQuizData(courseId);
        
        const response = await window.api.createQuiz(quizData); 
        
        if (response.success) {
            alert(`Cuestionario creado exitosamente (ID: ${response.quizId}).`);
            document.getElementById('quizCreationForm').reset();
            QUIZ_CONTAINER.innerHTML = ''; 
            questionCounter = 0;
            addQuestionBlock();
        } else {
            alert(`Error: ${response.message}`);
        }

    } catch (error) {
       alert(`Fallo en la creación: ${error.message}`);
        console.error('Fallo en la creación del Quiz:', error);
    }
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
                radio.dataset.qid = newQid; 
            }
            
            if (label) {
                label.setAttribute('for', newOptionId);
            }
        });
    });
}