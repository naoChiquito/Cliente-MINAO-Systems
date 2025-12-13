document.addEventListener("DOMContentLoaded", () => {
  const userId = localStorage.getItem("userId");
  const email = localStorage.getItem("userEmail");
  const token = localStorage.getItem("token");

  if (!userId || !email || !token) {
    window.nav.goTo("login");
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
     1. Cargar perfil (LECTURA)
  ============================ */
  async function loadProfile() {
    try {
      const response = await window.api.findUserByEmailJSON(email);

      if (!response.success || !response.user) {
        console.error("Error obteniendo perfil:", response.message);
        return;
      }

      const u = response.user;

      nameInput.value = u.userName || "";
      patInput.value = u.paternalSurname || "";
      matInput.value = u.maternalSurname || "";

      emailInput.value = u.email || "";
      emailInput.disabled = true;

      // Mostrar foto si existe (solo display)
      if (u.profileImageUrl && profileImagePreview) {
        profileImagePreview.src = u.profileImageUrl;
      }

      // Nombre en sidebar
      const fullName = `${u.userName || ""} ${u.paternalSurname || ""}`.trim();
      if (studentNameDisplay) {
        studentNameDisplay.textContent = fullName || "[Nombre]";
      }

      // Guardar en localStorage para otras vistas
      localStorage.setItem("userName", u.userName || "");
      localStorage.setItem("userPaternalSurname", u.paternalSurname || "");
    } catch (error) {
      console.error("Error cargando perfil:", error);
    }
  }

  loadProfile();

  /* ============================
     2. Vista previa de imagen (SOLO UI)
     ⚠️ NO se sube al backend
  ============================ */
  if (profileImageInput && profileImagePreview) {
    profileImageInput.addEventListener("change", () => {
      const file = profileImageInput.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        profileImagePreview.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  /* ============================
     3. Guardar cambios (SOLO TEXTO)
  ============================ */
  const form = document.getElementById("profileForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // ✅ Solo campos de texto (como anoche)
    const updatedData = {
      userName: nameInput.value,
      paternalSurname: patInput.value,
      maternalSurname: matInput.value,

      // ✅ si tu backend requiere token, lo enviamos aquí
      // (sin cambiar la firma del preload)
      token
    };

    const res = await window.api.updateUserBasicProfile(userId, updatedData);

    if (res.success) {
      alert("Perfil actualizado correctamente.");
      loadProfile();
    } else {
      alert("Error al actualizar: " + (res.message || "Desconocido"));
    }
  });
});

    const backButton = document.getElementById("backButton");

if (backButton) {
    backButton.addEventListener("click", () => {

    
        if (window.nav && typeof window.nav.goBack === "function") {
            window.nav.goBack();
            return;
        }

 
        window.history.back();
    });
}