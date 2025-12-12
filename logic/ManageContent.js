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

    loadCourseContent(courseId);

     document.getElementById('createModuleBtn').addEventListener('click', () => {
        window.location.href = 'addContent.html';
   });
    

});


async function loadCourseContent(courseId) {
    const container = document.getElementById('modulesContainer');
    const loadingMessage = document.getElementById('loadingMessage');
    
    if (loadingMessage) loadingMessage.textContent = 'Cargando contenido...';

    try {
        const response = await window.api.getCourseContent(courseId);
        
        if (response.success) {
            const modules = response.data.results || response.data; 
            
            if (modules && modules.length > 0) {
                 loadedModules = modules;
                renderModules(modules, container); 
            } else {
                container.innerHTML = '<p>Este curso no tiene módulos cargados. ¡Crea uno nuevo!</p>';
            }
            
        } else {
            container.innerHTML = `<p style="color: red;">Error: ${response.message}</p>`;
        }
    } catch (err) {
        container.innerHTML = '<p style="color: red;">Error de conexión con el microservicio.</p>';
        console.error("Fallo de red:", err);
    }
}

function renderModules(modules, container) {
    let htmlContent = '';
    
    modules.forEach(module => {
        const moduleId = module.contentId;
        const title = module.title;
        const description = module.descripcion;
        const type = module.type;
        
        htmlContent += `
            <div class="module-card clickable" data-module-id="${moduleId}">
                <span class="module-id">ID: ${moduleId}</span>
                <h2>${title}</h2>
                <p class="module-desc">${description}</p>
                <span class="module-link">Gestionar contenido →</span>
            </div>
        `;
    });
    
    container.innerHTML = htmlContent;
    attachNavigationListeners(modules); 
}


function attachNavigationListeners(modules) {
    const moduleCards = document.querySelectorAll('.module-card.clickable');

    moduleCards.forEach(card => {
        card.addEventListener('click', () => {
            const moduleId = card.dataset.moduleId; 
            
            if (moduleId) {
                const selectedModule = modules.find(m => String(m.contentId) === moduleId);
                if (selectedModule) {
                    localStorage.setItem('selectedModuleData', JSON.stringify(selectedModule));
                    localStorage.setItem('selectedModuleId', moduleId);
                    window.location.href = 'editContent.html'; 
                } else {
                    console.error('Módulo seleccionado no encontrado en la lista local.');
                }
            }
        });
    });
    
   
}