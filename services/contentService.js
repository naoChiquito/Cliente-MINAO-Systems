const {API_BASE_URL} = require ("../app/config");
async function getCourseContent(courseId) {
    const FETCH_TIMEOUT = 10000;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), FETCH_TIMEOUT); 
    
    try {
        const url = `${API_BASE_URL}/content/byCourse/${courseId}`;
        
        const response = await fetch(url, {
            method: "GET",
            signal: controller.signal,
            headers: { "Content-Type": "application/json" }
        });
        
        clearTimeout(id); 

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Fallo al obtener contenido. Código: ${response.status}`);
        }
        
        return await response.json().catch(() => ({})); 

    } catch (err) {
        clearTimeout(id); 
        if (err.name === 'AbortError') {
            throw new Error(`La conexión ha expirado (Timeout).`);
        }
        throw err;
    }
}

async function updateModuleContent(contentId, moduleData) {
    const FETCH_TIMEOUT = 15000;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), FETCH_TIMEOUT); 
    
    try {
        const url = `${API_BASE_URL}/content/updateContent/${contentId}`;
        
        const response = await fetch(url, {
            method: "PATCH", 
            signal: controller.signal,
            headers: { 
                "Content-Type": "application/json"
            },
            body: JSON.stringify(moduleData) 
        });

        clearTimeout(id); 

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Fallo al actualizar el contenido. Código: ${response.status}`);
        }
        
        return { success: true, message: "Contenido del módulo actualizado exitosamente." }; 

    } catch (err) {
        clearTimeout(id); 
        if (err.name === 'AbortError') {
            throw new Error("La solicitud ha expirado (Timeout).");
        }
        throw err;
    }
}

async function deleteContent(contentId) {
    const FETCH_TIMEOUT = 10000;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), FETCH_TIMEOUT); 
    
    try {
        const url = `${API_BASE_URL}/content/deleteContent/${contentId}`;
        
        const response = await fetch(url, {
            method: "DELETE", 
            signal: controller.signal
        });

        clearTimeout(id); 

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Fallo al eliminar el contenido. Código: ${response.status}`);
        }
       
        return { success: true, message: "Módulo eliminado permanentemente." }; 

    } catch (err) {
        clearTimeout(id); 
        if (err.name === 'AbortError') {
            throw new Error("La conexión ha expirado (Timeout).");
        }
        throw err;
    }
}

async function createContent(moduleData) {
    const FETCH_TIMEOUT = 10000;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), FETCH_TIMEOUT); 
    
    try {
        const url = `${API_BASE_URL}/content/createNewContent`;
        
        const response = await fetch(url, {
            method: "POST", 
            signal: controller.signal,
            headers: { 
                "Content-Type": "application/json"
            },
            body: JSON.stringify(moduleData) 
        });

        clearTimeout(id); 

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Fallo al crear el módulo. Código: ${response.status}`);
        }
        
        const result = await response.json().catch(() => ({}));
        return { success: true, message: result.message || "Módulo creado exitosamente." }; 

    } catch (err) {
        clearTimeout(id); 
        if (err.name === 'AbortError') {
            throw new Error("La solicitud ha expirado (Timeout).");
        }
        throw err;
    }
}

module.exports = { getCourseContent, updateModuleContent, deleteContent, createContent };