document.addEventListener('DOMContentLoaded', () => {
    const quizId = localStorage.getItem('CurrentQuizId');
    console.log("id: ", quizId);
    const instructorName = localStorage.getItem('userName') + ' ' + localStorage.getItem('userPaternalSurname');
    const quizTitle = localStorage.getItem('CurrentQuizTitle'); 

    
    if (!quizId) {
        alert('Error: ID del cuestionario no encontrado.');
        window.location.href = 'QuizManagement.html';
        return;
    }

    const instructorNameDisplay = document.getElementById('instructorNameDisplay');
    if (instructorNameDisplay) {
        instructorNameDisplay.textContent = instructorName.trim();
    }

    document.getElementById('quizTitleDisplay').textContent = quizTitle || quizId;
    loadQuizResponses(quizId);
});


async function loadQuizResponses(quizId) {
    const container = document.getElementById('responsesContainer');
    const loadingMessage = document.getElementById('loadingMessage');
    
    loadingMessage.textContent = `Cargando respuestas para Quiz ID: ${quizId}...`;

    try {
        const result = await window.api.getQuizResponses(quizId);

        const responses =
            Array.isArray(result?.responses) ? result.responses :
            Array.isArray(result?.data?.responses) ? result.data.responses :
            Array.isArray(result?.result?.responses) ? result.result.responses :
            [];

        if (result.success && responses.length > 0) {
            renderResponsesTable(responses, container);
            loadingMessage.style.display = 'none';
        } else if (result.success) {
            container.innerHTML = "<p class='info-message'>Aún no hay estudiantes que hayan respondido este cuestionario.</p>";
            loadingMessage.style.display = 'none';
        } else {
            container.innerHTML = `<p class='error'>Error al cargar resultados: ${result.message}</p>`;
        }

    } catch (error) {
        console.error("Error al obtener respuestas del quiz:", error);
        container.innerHTML = `<p class='error'>Fallo de conexión con el servicio de resultados.</p>`;
    }
}


function renderResponsesTable(responses, container) {
    let html = `
    <table class="data-table">
        <thead>
            <tr>
                <th>ID Estudiante</th>
                <th>Último Intento</th>
                <th>Puntuación Final (%)</th>
                <th>Detalles</th>
            </tr>
        </thead>
        <tbody>
    `;

    responses.forEach(response => {
        const scorePercentage = response.latestScore ? `${response.latestScore}%` : 'N/D';
        
        html += `
        <tr>
            <td>${response.studentUserId}</td>
            <td>${response.latestAttempt}</td>
            <td><strong>${scorePercentage}</strong></td>
            <td>
                <button class="btn-action btn-secondary" onclick="viewDetailedAttempt('${response.studentUserId}')">Ver Intentos</button>
            </td>
        </tr>
        `;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;
}

