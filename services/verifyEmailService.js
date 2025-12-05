async function verifyEmail(email, code) {
    try {
        const response = await fetch("http://localhost:3000/minao_systems/users/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email, verificationCode: code })
        });

        if (response.status >= 400 && response.status < 500) {
            const errorData = await response.json().catch(() => ({})); 
            throw new Error(errorData.message || "Código inválido.");
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

module.exports = { verifyEmail };