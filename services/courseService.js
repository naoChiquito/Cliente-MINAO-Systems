const FETCH_TIMEOUT = 10000;

async function getCoursesByInstructor(instructorId) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), FETCH_TIMEOUT); 
    
    try {
        const url = `http://127.0.0.1:8000/minao_systems/courses/instructor/${instructorId}`; 
        
        const response = await fetch(url, {
            method: "GET",
            signal: controller.signal, 
            headers: { 
                "Content-Type": "application/json"
            }
        });
        
        clearTimeout(id); 
        const responseText = await response.text(); 

        if (!response.ok) {
            try {
                const errorData = JSON.parse(responseText);
                throw new Error(errorData.message || `Error al cargar cursos. Código: ${response.status}`);
            } catch (e) {
                throw new Error(`Error al cargar cursos. Código: ${response.status}. Respuesta: ${responseText.substring(0, 50)}`);
            }
        }
        
        try {

            const responseData = JSON.parse(responseText);
            if (responseData && Array.isArray(responseData.result)) {
                return responseData; 
            }

            return { count: 0, result: [] }; 

        } catch (e) {
            console.warn("Respuesta 200/204 sin contenido JSON. Asumiendo array vacío.");
            return { count: 0, result: [] }; 
        }

    } catch (err) {
        clearTimeout(id); 
        throw err;
    }
}

async function addCourse(courseData) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
    
    try {
        const url = 'http://localhost:8000/minao_systems/courses/createCourse'; 
        
        const response = await fetch(url, {
            method: "POST",
            signal: controller.signal,
            headers: { 
                "Content-Type": "application/json"
            },
            body: JSON.stringify(courseData) 
        });
        
        clearTimeout(id); 

        if (response.status >= 400 && response.status < 500) {
            const errorData = await response.json().catch(() => ({})); 
            throw new Error(errorData.message || "Error de validación al crear el curso. Código: ${response.status}");
        }
        
        if (response.ok) {
            const data = await response.json().catch(() => ({ message: "Curso creado exitosamente." })); 
            return data;
        }

        throw new Error(`Error inesperado del servidor. Código: ${response.status}`);

    } catch (err) {
        clearTimeout(id); 
        if (err.name === 'AbortError') {
            throw new Error(`La conexión ha expirado (Timeout de 20s).`);
        }
        throw err;
    }
}




module.exports = { getCoursesByInstructor, addCourse };