const BASE_URL = "http://localhost:3000/minao_systems/users";

/* ============================================================
   ✔  GET USER JSON BY EMAIL
============================================================ */
async function findUserByEmailJSON(email) {
    try {
        const response = await fetch(
            `${BASE_URL}/findUserByEmailJSON/${encodeURIComponent(email)}`,
            {
                method: "GET",
                headers: { "Content-Type": "application/json" }
            }
        );

        const raw = await response.text();
        console.log("📥 RAW RESPONSE FROM SERVER:", raw);

        let parsed;
        try {
            parsed = JSON.parse(raw);
        } catch (err) {
            console.error("❌ No se pudo parsear JSON:", err);
            throw new Error("El servidor devolvió una respuesta NO JSON.");
        }

        if (!response.ok) {
            throw new Error(parsed.message || "Error obteniendo usuario.");
        }

        return parsed;

    } catch (err) {
        console.error("❌ ERROR EN findUserByEmailJSON:", err);
        return { success: false, message: err.message };
    }
}

/* ============================================================
   ✔  UPDATE USER BASIC PROFILE
============================================================ */
async function updateUserBasicProfile(userId, formData) {
    try {
        const response = await fetch(
            `${BASE_URL}/users/${encodeURIComponent(userId)}`,
            {
                method: "PUT",
                body: formData // 🚨 Usamos formData para enviar el archivo junto con los datos
            }
        );

        const data = await response.json();

        if (!response.ok) throw new Error(data.message);

        return { success: true, data };
    } catch (err) {
        console.error("❌ ERROR EN updateUserBasicProfile:", err);
        return { success: false, message: err.message };
    }
}


module.exports = {
    findUserByEmailJSON,
    updateUserBasicProfile
};
