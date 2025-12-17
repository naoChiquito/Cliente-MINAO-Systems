const FETCH_TIMEOUT = 60000; 
const {API_BASE_URL} = require ("../app/config");
async function signUp(formData) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), FETCH_TIMEOUT); 

    try {
        const url = `${API_BASE_URL}/users/registerUser`;
        
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData), 
            signal: controller.signal 
        });

        clearTimeout(id); 

        if (response.status >= 400 && response.status < 500) {
            const errorData = await response.json().catch(() => ({})); 
            throw new Error(errorData.message || "Error de validación del servidor.");
        }
        
        if (response.ok) {
            const data = await response.json().catch(() => ({ 
                message: "Registro exitoso."
            }));
            return data;
        }

        throw new Error(`Error inesperado del servidor. Código: ${response.status}`);

    } catch (err) {
        clearTimeout(id); 
        if (err.name === 'AbortError') {
            throw new Error(`La conexión ha expirado (Timeout después de ${FETCH_TIMEOUT / 1000} segundos).`);
        }
        throw err;
    }
}

module.exports = { signUp };