window.addEventListener('DOMContentLoaded', () => {
    
    const courseId = localStorage.getItem('CourseId');
    const instructorName = localStorage.getItem('userName') + ' ' + localStorage.getItem('userPaternalSurname');
    const moduleId = localStorage.getItem('selectedModuleId');
    

    if (!moduleId) {
        alert('Error: ID del modulo no encontrado. Volviendo al menú de gestión de contenido.');
        window.location.href = 'contentManagement.html';
        return;
    }
    
    const instructorNameDisplay = document.getElementById('instructorNameDisplay');
    if (instructorNameDisplay) {
        instructorNameDisplay.textContent = instructorName.trim();
    }

    const courseIdDisplay = document.getElementById('courseIdDisplay');
    if (courseIdDisplay) {
        courseIdDisplay.textContent = courseId;
    }

    const moduleIdDisplay = document.getElementById('moduleIdDisplay');
    if (moduleIdDisplay) {
        moduleIdDisplay.textContent = moduleId;
    }


    const moduleDataString = localStorage.getItem('selectedModuleData');
    const selectedModule = JSON.parse(moduleDataString);

    const moduleTitleDisplay = document.getElementById('moduleTitleDisplay');
    if (moduleTitleDisplay) {
        moduleTitleDisplay.textContent = selectedModule.title;
    }


    document.getElementById('title').value = selectedModule.title;
    document.getElementById('descripcion').value = selectedModule.descripcion;
    document.getElementById('type').value = selectedModule.type;

    setupFormSubmission(courseId)

    const deleteButton = document.getElementById('deleteModuleBtn');
        if (deleteButton) {
            deleteButton.addEventListener('click', (e) => {
                e.preventDefault();
                deleteContent(moduleId); 
            });
        }

    setupUploadForm(moduleId);
    loadModuleFiles(moduleId); 

 });



function setupFormSubmission(courseId) {

    const form = document.getElementById('editModuleForm');
    const moduleId = localStorage.getItem('selectedModuleId');
    if (!form) return;

    form.addEventListener('submit', async (e) => {

        const isConfirmed = confirm("ADVERTENCIA: ¿Estás seguro de que deseas editar esta información?");
    
        if (!isConfirmed) {
            return; 
        }

        e.preventDefault();
        const moduleData = {
            title: document.getElementById('title').value,
            type: document.getElementById('type').value,
            descripcion: document.getElementById('descripcion').value,
            cursoId: courseId,
        };

        try {
            const response = await window.api.updateModuleContent(moduleId, moduleData); 
            
            if (response.success) {
                alert('Modulo actualizado exitosamente.');
                window.location.href = 'contentManagement.html'; 
            } else {
                alert(`Error: ${response.message || 'No se pudo guardar la edición.'}`);
            }
        } catch (error) {
            alert(`Error de Conexión: No se pudo contactar al microservicio.`);
            console.error('Fallo en la petición PATCH:', error);
        }
    });
}


async function deleteContent(contentId) {
    const isConfirmed = confirm("ADVERTENCIA: ¿Estás seguro de que deseas eliminar este módulo y todo su contenido? Esta acción es irreversible.");
    
    if (!isConfirmed) {
        return; 
    }
    
    try {
        const response = await window.api.deleteModuleContent(contentId); 
        
        if (response.success) {
            alert("Módulo eliminado exitosamente.");
            
            window.location.href = 'contentManagement.html'; 
            
        } else {
            alert(`Error al eliminar: ${response.message || 'Fallo de servidor.'}`);
            console.error("Fallo de eliminación:", response.message);
        }
    } catch (error) {
        alert("Error de conexión: No se pudo contactar al microservicio para eliminar el módulo.");
    }
}


function setupUploadForm(moduleId) {
    const form = document.getElementById('uploadContentForm');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const lessonTitle = document.getElementById('lessonTitle').value;
        const fileInput = document.getElementById('contentFile');
        const file = fileInput.files[0]; 
        
        if (!file || !lessonTitle) {
            alert("Por favor, ingresa un título y selecciona un archivo.");
            return;
        }

        const statusElement = document.getElementById('uploadStatus');
        statusElement.textContent = 'Leyendo archivo...';
        
        try {
            const fileDataBuffer = await readFileAsync(file);

            const uploadData = {
                moduleId: moduleId, 
                courseId: localStorage.getItem('CourseId'),
                lessonTitle: lessonTitle,
                fileName: file.name,
                fileContent: fileDataBuffer, 
                fileMimeType: file.type
            };

            statusElement.textContent = 'Subiendo a servidor gRPC...';
            
            const response = await window.api.uploadContent(uploadData); 
            
            if (response.success) {
                alert(`Subida exitosa`);
                form.reset();
                loadModuleFiles(moduleId); 
            } else {
                alert(`Error de subida: ${response.message}`);
                console.error('Detalles del error gRPC:', response.message);
            }
        } catch (error) {
            alert('Fallo en la subida o conexión.');
            console.error('Fallo general en la subida:', error);
        }
    });
}

function readFileAsync(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            resolve(window.api.Buffer.from(reader.result));
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}


async function loadModuleFiles(moduleId) {
    const fileListContainer = document.getElementById('fileListContainer'); 
    if (!fileListContainer) return;

    fileListContainer.innerHTML = 'Cargando archivos...';

    try {
        const response = await window.api.getFilesByContent(moduleId); 
        
        if (response.success && response.files.length > 0) {
            
            let html = '<ul>';
            response.files.forEach(file => {
                html += `<li>[${file.fileType}]
                            (<button onclick="deleteContentFile('${file.fileId}', '${moduleId}')">Eliminar</button>)</li>`;
            });
            html += '</ul>';
            fileListContainer.innerHTML = html;
            
        } else if (response.success && response.files.length === 0) {
            fileListContainer.innerHTML = 'No hay archivos cargados para este módulo.';
        } else {
            fileListContainer.innerHTML = `Error: ${response.message || 'Fallo al obtener la lista.'}`;
        }
    } catch (error) {
        fileListContainer.innerHTML = 'Error de conexión con el servicio de archivos.';
        console.error('Error al cargar archivos:', error);
    }
}

async function deleteContentFile(fileId, moduleId) {
    if (!confirm('¿Estás seguro de que deseas eliminar este archivo? Esta acción es irreversible.')) {
        return;
    }

    const statusElement = document.getElementById('fileListContainer');
    const originalContent = statusElement.innerHTML;
    statusElement.innerHTML = `Eliminando archivo ID: ${fileId}...`;

    try {
        const response = await window.api.deleteContentFile(fileId); 

        if (response.success) {
            alert(`Archivo ID ${fileId} eliminado exitosamente.`);
            loadModuleFiles(moduleId); 
        } else {
            statusElement.innerHTML = originalContent; 
            alert(`Error al eliminar archivo: ${response.message || 'Fallo en el servidor.'}`);
        }
    } catch (error) {
        statusElement.innerHTML = originalContent; 
        console.error('Fallo en la comunicación IPC para eliminar:', error);
        alert('Fallo de conexión o error interno al intentar eliminar.');
    }
}