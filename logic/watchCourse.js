document.addEventListener("DOMContentLoaded", async function() {
    const studentNameDisplay = document.getElementById('studentNameDisplay');
    const coursesContainer = document.getElementById('coursesContainer');
    const courseSearchInput = document.getElementById('courseSearch');

    // Verificar si el nombre del alumno ya está en el localStorage
    const userName = localStorage.getItem('userName');
    const userPaternalSurname = localStorage.getItem('userPaternalSurname');

    if (userName && userPaternalSurname) {
        // Si los datos del usuario están en el localStorage, los mostramos
        studentNameDisplay.textContent = `${userName} ${userPaternalSurname}`;
    } else {
        // Si no están en el localStorage, hacemos una llamada para verificar el token
        try {
            const userEmail = localStorage.getItem('userEmail');
            const userPassword = localStorage.getItem('userPassword');

            // Validamos que los datos de login estén en localStorage antes de continuar
            if (!userEmail || !userPassword) {
                throw new Error("Email o contraseña no encontrados en localStorage");
            }

            const response = await window.api.login(userEmail, userPassword); // Llamada para verificar el login

            if (response.success) {
                const { name, paternalSurname } = response.data;
                studentNameDisplay.textContent = `${name} ${paternalSurname}`;

                // Guardar los datos en localStorage para futuras referencias
                localStorage.setItem('userName', name);
                localStorage.setItem('userPaternalSurname', paternalSurname);
            } else {
                throw new Error("Token inválido o expirado, por favor inicia sesión nuevamente.");
            }
        } catch (error) {
            console.error("Error al verificar el nombre del alumno:", error);
            window.location.href = "Login.html"; // Redirigir al login si no se puede verificar el token
        }
    }

    // Cargar la lista de cursos
    const loadCourses = async () => {
        try {
            const studentId = localStorage.getItem('userId'); // Obtener el ID del estudiante desde localStorage
            if (!studentId) {
                console.error("No se encontró el ID del estudiante en localStorage.");
                return;
            }

            const response = await window.api.getCourses(studentId); // Llamada a la API para obtener los cursos del estudiante
            console.log("Respuesta de la API:", response);  // Esto nos ayudará a entender la respuesta

            // Verificamos si la propiedad 'data' existe y es un array
            if (response && Array.isArray(response.data)) {
                displayCourses(response.data); // Suponemos que los cursos vienen en un array bajo "data"
            } else {
                console.error("La respuesta no contiene 'data' como se esperaba:", response);
            }
        } catch (error) {
            console.error("Error al cargar los cursos:", error);
        }
    };

    // Función para mostrar los cursos
    const displayCourses = (courses) => {
        coursesContainer.innerHTML = ''; // Limpiar el contenedor antes de agregar nuevos cursos
        courses.forEach(course => {
            const courseElement = document.createElement('div');
            courseElement.classList.add('course-item');
            courseElement.style.display = 'flex';
            courseElement.style.justifyContent = 'space-between';
            courseElement.style.alignItems = 'center';

            courseElement.innerHTML = `
                <div>
                    <h4>${course.name}</h4>
                    <p style="margin: 0; color:#555;">Impartido por: <b>${course.instructorName}</b></p>
                </div>
                <button class="btn-primary" style="margin: 0; height: 40px;" data-courseid="${course.cursoId}">
                    Ver detalles
                </button>
            `;
            coursesContainer.appendChild(courseElement);
        });

        // Agregar evento a los botones "Ver detalles"
        document.querySelectorAll('.btn-primary').forEach(button => {
            button.addEventListener('click', (event) => {
                const courseId = event.target.dataset.courseid;
                window.location.href = `JoinCourse.html?courseId=${courseId}`; // Redirigir a JoinCourse.html con el courseId
            });
        });
    };

    // Filtrar cursos por búsqueda
    courseSearchInput.addEventListener('input', async function() {
        const searchText = courseSearchInput.value.trim();
        try {
            const studentId = localStorage.getItem('userId'); // Obtener el ID del estudiante desde localStorage
            if (!studentId) {
                console.error("No se encontró el ID del estudiante en localStorage.");
                return;
            }
            const response = await window.api.getCourses(studentId, searchText); // Llamada de búsqueda por nombre
            displayCourses(response.data);
        } catch (error) {
            console.error("Error al buscar cursos:", error);
        }
    });

    // Inicializar la carga de cursos
    loadCourses();
});
