window.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('addCourseForm');
    const endDateInput = document.getElementById('endDate');
    const name = localStorage.getItem('userName');
    const surname = localStorage.getItem('userPaternalSurname');
    const instructorId = localStorage.getItem('userId');

    const nameDisplayElement = document.getElementById('instructorNameDisplay');
    
    if (nameDisplayElement) {
        nameDisplayElement.textContent = `${name} ${surname}`;
    }
    
    if (endDateInput) {
        const today = new Date();
        today.setDate(today.getDate() + 1); 
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0'); 
        const year = today.getFullYear();
        const tomorrowFormatted = `${year}-${month}-${day}`;
        
        endDateInput.setAttribute('min', tomorrowFormatted);
    }
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
    
        if (!instructorId) {
            alert('Error: ID del instructor no encontrado. Vuelve a iniciar sesión.');
            return;
        }
        const startDateValue = document.getElementById('startDate').value;
        const endDateValue = document.getElementById('endDate').value;
        
        const startDate = new Date(startDateValue);
        const endDate = new Date(endDateValue);
        
        if (endDate <= startDate) {
            alert('Error: La fecha de fin debe ser posterior a la fecha de inicio.');
            return;
        }
    
        const courseData = {
            name: document.getElementById('name').value,
            description: document.getElementById('description').value,
            category: document.getElementById('category').value,
            startDate: startDateValue, 
            endDate: endDateValue, 
            state: "Activo",    
            instructorUserId: parseInt(instructorId)
        };
        
        try {
            const response = await window.api.addCourse(courseData); 
            
            if (response.success) {
                alert('Curso creado exitosamente.');
                form.reset(); 
                window.location.href = 'InstructorMainMenu.html';

            } else {
                alert(`Error del servidor: ${response.message || 'No se pudo crear el curso.'}`);
            }
            
        } catch (error) {
            alert(`Error de conexión o aplicación: ${error.message}`);
            console.error('Error al intentar crear el curso:', error);
        }
    });
});