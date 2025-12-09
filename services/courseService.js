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

async function getCoursesByStudent(studentId) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    try {
        // Construct the URL based on the studentId
        const url = `http://127.0.0.1:8000/minao_systems/courses/student/${studentId}`;

        const response = await fetch(url, {
            method: "GET",
            signal: controller.signal,
            headers: { 
                "Content-Type": "application/json"
            }
        });

        clearTimeout(id);
        const responseText = await response.text();

        // Handle errors if the response status is not OK
        if (!response.ok) {
            try {
                const errorData = JSON.parse(responseText);
                throw new Error(errorData.message || `Error al cargar los cursos del estudiante. Código: ${response.status}`);
            } catch (e) {
                throw new Error(`Error al cargar los cursos. Código: ${response.status}. Respuesta: ${responseText.substring(0, 50)}`);
            }
        }

        // Process the response data
        try {
            const responseData = JSON.parse(responseText);
            if (responseData && Array.isArray(responseData.data)) {
                return { success: true, data: responseData.data };  // Return success and courses in 'data'
            }

            // If no data or empty data array, return an empty result
            return { success: true, data: [] };

        } catch (e) {
            console.warn("Respuesta 200/204 sin contenido JSON. Asumiendo array vacío.");
            return { success: true, data: [] };
        }

    } catch (err) {
        clearTimeout(id);
        throw err;  // Propagate error to be handled by the caller
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

async function getCourseDetails(courseId) {
    const FETCH_TIMEOUT = 10000;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), FETCH_TIMEOUT); 
    
    try {
        const url = `http://localhost:8000/minao_systems/courses/${courseId}`;
        
        const response = await fetch(url, {
            method: "GET",
            signal: controller.signal,
            headers: { "Content-Type": "application/json" }
        });
        
        clearTimeout(id); 

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Fallo al obtener detalles del curso. Código: ${response.status}`);
        }
     
        return await response.json().catch(() => ({})); 

    } catch (err) {
        clearTimeout(id); 
        throw err;
    }
}

async function updateCourse(courseData) {
    const FETCH_TIMEOUT = 15000;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), FETCH_TIMEOUT); 
    
    try {
        const url = `http://localhost:8000/minao_systems/courses/updateCourse`;
        
        const response = await fetch(url, {
            method: "PATCH",
            signal: controller.signal,
            headers: { 
                "Content-Type": "application/json",
            },
            body: JSON.stringify(courseData) 
        });

        clearTimeout(id); 

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Fallo al actualizar. Código: ${response.status}`);
        }
        
        return { success: true, message: "Curso actualizado exitosamente." }; 

    } catch (err) {
        clearTimeout(id); 
        if (err.name === 'AbortError') {
            throw new Error("La conexión ha expirado (Timeout).");
        }
        throw err;
    }
}


async function setState(courseId, newState) {
    const FETCH_TIMEOUT = 15000;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), FETCH_TIMEOUT); 
    
    try {
        const url = `http://localhost:8000/minao_systems/courses/setCourseState`; 
        
        const response = await fetch(url, {
            method: "PATCH", 
            signal: controller.signal,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({cursoId: courseId, state: newState }) 
        });

        clearTimeout(id); 

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Fallo al cambiar el estado. Código: ${response.status}`);
        }
        
        return { success: true, message: "Estado del curso actualizado." }; 

    } catch (err) {
        clearTimeout(id); 
        if (err.name === 'AbortError') {
            throw new Error("La conexión ha expirado (Timeout).");
        }
        throw err;
    }
}




module.exports = { getCoursesByInstructor, addCourse,  getCourseDetails, updateCourse, setState, getCoursesByStudent };