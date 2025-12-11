window.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("login_form");
    const errorMessageElement = document.getElementById("error-message");

    if (!form) return console.error("Error: Formulario con ID 'login_form' no encontrado.");
    if (errorMessageElement) errorMessageElement.textContent = '';

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        if (errorMessageElement) errorMessageElement.textContent = ''; // Limpiar el mensaje de error

        try {
            const response = await window.api.login(email, password);

            if (response.success) {
                const data = response.data;

                console.log("Login exitoso:", data);

                // Alerta de bienvenida
                alert("Bienvenido " + data.name + " " + data.paternalSurname);
                
                // Guardar datos del usuario en localStorage
                localStorage.setItem('userId', data.userId);
                localStorage.setItem('userName', data.name);
                localStorage.setItem('userPaternalSurname', data.paternalSurname);
                localStorage.setItem("userEmail", response.data.email);

                // Redirigir según el rol del usuario
                if (data.role.toLowerCase() === "instructor") {
                    window.location.href = 'InstructorMainMenu.html'; 
                } else if (data.role.toLowerCase() === "student") {
                    window.location.href = 'WatchCourse.html'; 
                } else {
                    // En caso de que el rol no sea ni instructor ni estudiante
                    console.error("Rol desconocido:", data.role);
                    alert("Error: Rol desconocido.");
                }

            } else {
                console.error("Fallo de autenticación reportado por el servidor:", response.message);
                throw new Error(response.message || "Fallo en la autenticación.");
            }

        } catch (err) {
            const message = "Correo o contraseña incorrectos.";
            if (errorMessageElement) {
                errorMessageElement.textContent = message;
            } else {
                alert(message);
            }
            console.error("Fallo de login:", err.message);
        }
    });

});
