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

    getCourseDetails: (courseId) => 
        ipcRenderer.invoke('get-course-details', courseId),

    updateCourse: (courseData) => 
        ipcRenderer.invoke('update-course', courseData),

    setState: (courseId, newState) => 
        ipcRenderer.invoke('change-course-state', courseId, newState),

    getCourseContent: (courseId) => 
        ipcRenderer.invoke('get-course-content', courseId),

    updateModuleContent: (contentId, moduleData) => 
        ipcRenderer.invoke('update-module-content', contentId, moduleData),

    deleteContent: (contentId) => 
        ipcRenderer.invoke('delete-module-content', contentId),

    createContent: (moduleData) => 
        ipcRenderer.invoke('create-content', moduleData), 

    uploadContent: (uploadData) => 
        ipcRenderer.invoke('upload-content', uploadData),

    getFilesByContent: (contentId) => 
        ipcRenderer.invoke('get-files-by-content', contentId),

    deleteContentFile: (fileId) => 
        ipcRenderer.invoke('delete-content-file', fileId),

    Buffer: {
        from: (arrayBuffer) => Buffer.from(arrayBuffer)
    },

    clearSession: () => {
        localStorage.removeItem('userId');
        localStorage.removeItem('userName');
        localStorage.removeItem('userPaternalSurname');
        console.log("Sesión local limpiada por orden del Main Process.");
    }

});


