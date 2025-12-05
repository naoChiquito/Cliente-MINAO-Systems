const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
    login: (email, password) => 
        ipcRenderer.invoke('perform-login', email, password),
    
    
    signUp: (formData) => 
        ipcRenderer.invoke('perform-signup', formData),

    verifyEmail: (email, code) => 
        ipcRenderer.invoke('perform-verifyEmail', email, code),

    getCourses: (instructorId) =>
        ipcRenderer.invoke('get-instructor-courses', instructorId),

    addCourse: (courseData) => 
        ipcRenderer.invoke('perform-add-course', courseData),

    clearSession: () => {
        localStorage.removeItem('userId');
        localStorage.removeItem('userName');
        localStorage.removeItem('userPaternalSurname');
        console.log("Sesión local limpiada por orden del Main Process.");
    }

});


