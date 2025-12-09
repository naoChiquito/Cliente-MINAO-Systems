const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
    login: (email, password) => 
        ipcRenderer.invoke('perform-login', email, password),
    
    signUp: (formData) => 
        ipcRenderer.invoke('perform-signup', formData),

    verifyEmail: (email, code) => 
        ipcRenderer.invoke('perform-verifyEmail', email, code),

    // Función para obtener los cursos del estudiante
    getCourses: (studentId) => 
        ipcRenderer.invoke('get-courses-by-student', studentId),  // Llamamos al backend con el studentId

    addCourse: (courseData) => 
        ipcRenderer.invoke('perform-add-course', courseData),

    getCourseDetails: (courseId) => 
        ipcRenderer.invoke('get-course-details', courseId),

    updateCourse: (courseData) => 
        ipcRenderer.invoke('update-course', courseData),

    setState: (courseId, newState) => 
        ipcRenderer.invoke('change-course-state', courseId, newState),

    clearSession: () => {
        localStorage.removeItem('userId');
        localStorage.removeItem('userName');
        localStorage.removeItem('userPaternalSurname');
        console.log("Sesión local limpiada por orden del Main Process.");
    }
});
