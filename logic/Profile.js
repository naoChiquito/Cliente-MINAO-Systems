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

      
      if (u.profileImageUrl && profileImagePreview) {
        profileImagePreview.src = u.profileImageUrl;
      }

      
      const fullName = `${u.userName || ""} ${u.paternalSurname || ""}`.trim();
      if (studentNameDisplay) {
        studentNameDisplay.textContent = fullName || "[Nombre]";
      }

      
      localStorage.setItem("userName", u.userName || "");
      localStorage.setItem("userPaternalSurname", u.paternalSurname || "");
    } catch (error) {
      console.error("Error cargando perfil:", error);
    }
  }

  loadProfile();

 
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

 
  const form = document.getElementById("profileForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    
    const updatedData = {
      userName: nameInput.value,
      paternalSurname: patInput.value,
      maternalSurname: matInput.value,

      
      
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