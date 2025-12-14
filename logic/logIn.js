window.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("login_form");
    const errorMessageElement = document.getElementById("error-message");

    if (!form) return console.error("Error: Formulario con ID 'login_form' no encontrado.");
    if (errorMessageElement) errorMessageElement.textContent = '';

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        if (errorMessageElement) errorMessageElement.textContent = ''; 

        try {
            const response = await window.api.login(email, password);

            if (response.success) {
                const data = response.data;

                console.log("Login exitoso:", data);

                
                alert("Bienvenido " + data.name + " " + data.paternalSurname);
                
                
                localStorage.setItem('userId', data.userId);
                localStorage.setItem('userName', data.name);
                localStorage.setItem('token', data.token);
                localStorage.setItem('userPaternalSurname', data.paternalSurname);
                localStorage.setItem("userEmail", response.data.email);

                
                if (data.role.toLowerCase() === "instructor") {
                    window.location.href = 'InstructorMainMenu.html'; 
                } else if (data.role.toLowerCase() === "student") {
                    window.location.href = 'WatchCourse.html'; 
                } else {
                    
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
