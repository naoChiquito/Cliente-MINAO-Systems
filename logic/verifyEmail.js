window.addEventListener("DOMContentLoaded", () => {
    
    
    const urlParams = new URLSearchParams(window.location.search);
    const userEmail = urlParams.get('email'); 
    
    if (!userEmail) { 
        console.error("Error Crítico: No se encontró el correo del usuario en la URL.");
        alert("Error: Regresa a la página de registro para continuar.");
        return; 
    }
    
    const form = document.getElementById("signup_form"); 
    const errorMessageElement = document.getElementById("error-message");

    if (!form) return console.error("Error: Formulario con ID 'signup_form' no encontrado.");
    if (errorMessageElement) errorMessageElement.textContent = '';
    
    if (document.getElementById('emailDisplay')) {
      document.getElementById('emailDisplay').textContent = userEmail;
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const code = document.getElementById("code").value;

        if (errorMessageElement) errorMessageElement.textContent = ''; 

        try {
            const response = await window.api.verifyEmail(userEmail, code); 

            if (response.success) { 
                
                console.log("Verificación exitosa. Redirigiendo...");
                alert("¡Verificación exitosa! Puedes iniciar sesión.");
                
                window.location.href = 'Login.html'; 
                 
            } else {
                
                console.error("Fallo de verificación reportado por el servidor:", response.message);
                throw new Error(response.message || "Fallo en la verificación.");
            }

        } catch (err) {
            const message = "Código incorrecto o error de red.";
            if (errorMessageElement) {
                errorMessageElement.textContent = message;
            } else {
                alert(message);
            }
            console.error("Fallo de verificación:", err.message);
        }
    });
                

});
