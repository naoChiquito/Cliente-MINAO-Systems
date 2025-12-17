const {API_BASE_URL} = require ("../app/config");
async function login(email, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/users/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email, userPassword: password })
        });

        if (response.status >= 400 && response.status < 500) {
            const errorData = await response.json().catch(() => ({})); 
            throw new Error(errorData.message || "Credenciales incorrectas o usuario no encontrado.");
        }
        
        try {
            return await response.json();
        } catch (e) {
            console.error("Error al parsear la respuesta JSON del servidor:", e);
            throw new Error("Respuesta de éxito inválida del servidor. (Consola para detalles)");
        }

    } catch (err) {
        throw err;
    }
}

module.exports = { login };