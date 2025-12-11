const FETCH_TIMEOUT = 10000;

/* ============================================================
   Helper para timeouts con AbortController
============================================================ */
function withTimeout(ms = FETCH_TIMEOUT) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), ms);
    return { controller, timeoutId };
}

/* ============================================================
   Cursos por instructor
============================================================ */
async function getCoursesByInstructorJSON(instructorId) {
    const { controller, timeoutId } = withTimeout();

    try {
        const url = `http://127.0.0.1:8000/minao_systems/courses/instructor/${instructorId}`;

        const response = await fetch(url, {
            method: "GET",
            signal: controller.signal,
            headers: { "Content-Type": "application/json" }
        });

        clearTimeout(timeoutId);
        const text = await response.text();

        if (!response.ok) {
            let errorMsg = `Error al cargar cursos (HTTP ${response.status})`;

            try {
                const json = JSON.parse(text);
                errorMsg = json.message || json.details || errorMsg;
            } catch {}

            throw new Error(errorMsg);
        }

        // Backend devuelve { success, data }
        try {
            const json = JSON.parse(text);
            return {
                success: true,
                data: Array.isArray(json.data) ? json.data : []
            };
        } catch {
            console.warn("Instructor: respuesta no JSON, devolviendo vacío.");
            return { success: true, data: [] };
        }

    } catch (err) {
        clearTimeout(timeoutId);
        if (err.name === "AbortError") throw new Error("Timeout al obtener cursos del instructor.");
        throw err;
    }
}

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

/* ============================================================
   Cursos por estudiante — CORREGIDO Y OPTIMIZADO
============================================================ */
async function getCoursesByStudent(studentId) {
    const { controller, timeoutId } = withTimeout();

    try {
        const url = `http://127.0.0.1:8000/minao_systems/courses/student/${studentId}`;

        const response = await fetch(url, {
            method: "GET",
            signal: controller.signal,
            headers: { "Content-Type": "application/json" }
        });

        clearTimeout(timeoutId);
        const text = await response.text();

        if (!response.ok) {
            let errorMsg = `Error al obtener cursos del estudiante (HTTP ${response.status})`;

            try {
                const json = JSON.parse(text);
                errorMsg = json.message || json.details || errorMsg;
            } catch {}

            throw new Error(errorMsg);
        }

        // Backend correcto: { success, data: [] }
        try {
            const json = JSON.parse(text);

            if (json.success && Array.isArray(json.data)) {
                return { success: true, data: json.data };
            }

            return { success: true, data: [] };
        } catch {
            console.warn("Student: Respuesta 200 sin JSON válido, devolviendo vacío.");
            return { success: true, data: [] };
        }

    } catch (err) {
        clearTimeout(timeoutId);
        if (err.name === "AbortError") throw new Error("Timeout al obtener cursos del estudiante.");
        throw err;
    }
}

/* ============================================================
   Crear curso
============================================================ */
async function addCourse(courseData) {
    const { controller, timeoutId } = withTimeout();

    try {
        const url = 'http://localhost:8000/minao_systems/courses/createCourse';

        const response = await fetch(url, {
            method: "POST",
            signal: controller.signal,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(courseData)
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const json = await response.json().catch(() => ({}));
            throw new Error(json.message || "Error al crear el curso.");
        }

        return await response.json().catch(() => ({ success: true }));

    } catch (err) {
        clearTimeout(timeoutId);
        if (err.name === "AbortError") throw new Error("Timeout al crear curso.");
        throw err;
    }
}

/* ============================================================
   Obtener detalles de curso
============================================================ */
async function getCourseDetails(courseId) {
    const { controller, timeoutId } = withTimeout();

    try {
        const url = `http://localhost:8000/minao_systems/courses/${courseId}`;

        const response = await fetch(url, {
            method: "GET",
            signal: controller.signal,
            headers: { "Content-Type": "application/json" }
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const json = await response.json().catch(() => ({}));
            throw new Error(json.message || "No se pudieron obtener los detalles del curso.");
        }

        return await response.json().catch(() => ({}));

    } catch (err) {
        clearTimeout(timeoutId);
        if (err.name === "AbortError") throw new Error("Timeout cargando detalles del curso.");
        throw err;
    }
}

/* ============================================================
   Actualizar curso
============================================================ */
async function updateCourse(courseData) {
    const { controller, timeoutId } = withTimeout();

    try {
        const url = `http://localhost:8000/minao_systems/courses/updateCourse`;

        const response = await fetch(url, {
            method: "PATCH",
            signal: controller.signal,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(courseData)
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const json = await response.json().catch(() => ({}));
            throw new Error(json.message || "Error al actualizar el curso.");
        }

        return { success: true, message: "Curso actualizado exitosamente." };

    } catch (err) {
        clearTimeout(timeoutId);
        if (err.name === "AbortError") throw new Error("Timeout al actualizar curso.");
        throw err;
    }
}

/* ============================================================
   Cambiar estado del curso
============================================================ */
async function setState(courseId, newState) {
    const { controller, timeoutId } = withTimeout();

    try {
        const url = `http://localhost:8000/minao_systems/courses/setCourseState`;

        const response = await fetch(url, {
            method: "PATCH",
            signal: controller.signal,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cursoId: courseId, state: newState })
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const json = await response.json().catch(() => ({}));
            throw new Error(json.message || "Error al cambiar estado del curso.");
        }

        return { success: true, message: "Estado actualizado correctamente." };

    } catch (err) {
        clearTimeout(timeoutId);
        if (err.name === "AbortError") throw new Error("Timeout al cambiar estado.");
        throw err;
    }
}

/* ============================================================
   Obtener TODOS los cursos (solo si lo sigues usando)
============================================================ */
async function getAllCourses() {
    const { controller, timeoutId } = withTimeout();

    try {
        const url = `http://127.0.0.1:8000/minao_systems/courses/all`;

        const response = await fetch(url, {
            method: "GET",
            signal: controller.signal,
            headers: { "Content-Type": "application/json" }
        });

        clearTimeout(timeoutId);
        const text = await response.text();

        if (!response.ok) {
            let msg = `Error al obtener todos los cursos (HTTP ${response.status})`;
            try {
                const json = JSON.parse(text);
                msg = json.details || json.message || msg;
            } catch {}
            throw new Error(msg);
        }

        let json;
        try {
            json = JSON.parse(text);
        } catch {
            throw new Error("Respuesta del servidor inválida.");
        }

        return {
            success: true,
            data: Array.isArray(json.data) ? json.data : []
        };

    } catch (err) {
        clearTimeout(timeoutId);
        if (err.name === "AbortError") throw new Error("Timeout al cargar cursos.");
        throw err;
    }
}

module.exports = { 
    getCoursesByInstructor,
    getCoursesByInstructorJSON,
    addCourse,  
    getCourseDetails, 
    updateCourse, 
    setState, 
    getCoursesByStudent,
    getAllCourses
};
