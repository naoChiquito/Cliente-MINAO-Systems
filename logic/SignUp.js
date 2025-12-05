window.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("signup_form"); 
    const errorMessageElement = document.getElementById("error-message");

    if (!form) return console.error("Error: Formulario con ID 'signup_form' no encontrado.");
    
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const userName = document.getElementById("userName").value;
        const paternalSurname = document.getElementById("paternalSurname").value;
        const maternalSurname = document.getElementById("maternalSurname").value;
        const email = document.getElementById("email").value;
        const userPassword = document.getElementById("userPassword").value;
        const userType = document.getElementById("rol").value; 

        if (errorMessageElement) errorMessageElement.textContent = ''; 
        

        const formData = {
            userName: userName, 
            paternalSurname: paternalSurname,
            maternalSurname: maternalSurname, 
            email: email, 
            userPassword: userPassword, 
            userType: userType 
        };


        try {
            const response = await window.api.signUp(formData); 

            if (response.success) { 
                const data = response.data; 

                console.log("Registro exitoso:", data);
                
                alert("¡Registro exitoso! Se ha enviado un código de verificación a tu correo."); 
                window.location.href = `VerifyEmail.html?email=${encodeURIComponent(email)}`;
                 
            } else {
                console.error("Fallo al registrar:", response.message);
                throw new Error(response.message || "Fallo en el registro.");
            }

        } catch (err) {
            const message = "Información inválida. Verifica tus datos o el correo ya está registrado.";
            if (errorMessageElement) {
                errorMessageElement.textContent = message;
            } else {
                alert(message);
            }
            console.error("Fallo de registro/conexión:", err.message); 
        }
    });

});