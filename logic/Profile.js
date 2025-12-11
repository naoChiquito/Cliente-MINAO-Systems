document.addEventListener("DOMContentLoaded", () => {

    const userId = localStorage.getItem("userId");
    const email = localStorage.getItem("userEmail");

    if (!userId || !email) {
        window.nav.goTo("login.html");
        return;
    }

    const nameInput = document.getElementById("userName");
    const patInput = document.getElementById("paternalSurname");
    const matInput = document.getElementById("maternalSurname");
    const emailInput = document.getElementById("email");
    const profileImageInput = document.getElementById("profileImageInput");
    const profileImagePreview = document.getElementById("profileImagePreview");

    const studentNameDisplay = document.getElementById("studentNameDisplay");

    /* ============================
       1. Cargar perfil desde BD
    ============================ */
    async function loadProfile() {
        try {
            const response = await window.api.findUserByEmailJSON(email);

            if (!response.success) {
                console.error("Error obteniendo perfil:", response.message);
                return;
            }

            const u = response.user;
            if (!u) {
                console.error("Usuario no encontrado.");
                return;
            }

            // Inputs editables
            nameInput.value = u.userName || "";
            patInput.value = u.paternalSurname || "";
            matInput.value = u.maternalSurname || "";

            // Email NO editable
            emailInput.value = u.email || "";
            emailInput.disabled = true;

            // Foto
            if (u.profileImageUrl) {
                profileImagePreview.src = u.profileImageUrl;
            }

            /* ===========================================
               🔥 Mostrar nombre en el sidebar automáticamente
            ============================================ */
            const fullName = `${u.userName || ""} ${u.paternalSurname || ""}`.trim();
            if (studentNameDisplay) {
                studentNameDisplay.textContent = fullName || "[Nombre]";
            }

            // Guardar en localStorage para las otras vistas
            localStorage.setItem("userName", u.userName || "");
            localStorage.setItem("userPaternalSurname", u.paternalSurname || "");

        } catch (error) {
            console.error("Error cargando perfil:", error);
        }
    }

    loadProfile();



    /* ============================
       2. Mostrar vista previa de foto
    ============================ */
    profileImageInput.addEventListener("change", () => {
        const file = profileImageInput.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            profileImagePreview.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });

    /* ============================
       3. Guardar cambios
    ============================ */
    document.getElementById("profileForm").addEventListener("submit", async (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append("userName", nameInput.value);
        formData.append("paternalSurname", patInput.value);
        formData.append("maternalSurname", matInput.value);
        formData.append("profileImage", profileImageInput.files[0]); // Se agrega el archivo de imagen

        const res = await window.api.updateUserBasicProfile(userId, formData);

        if (res.success) {
            alert("Perfil actualizado correctamente.");
            loadProfile(); // recargar datos
        } else {
            alert("Error al actualizar: " + res.message);
        }
    });


});
