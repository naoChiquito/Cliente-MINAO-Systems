const { contextBridge, ipcRenderer } = require("electron");

// ======================
// INTERCEPTOR DE IPC
// ======================
const originalInvoke = ipcRenderer.invoke.bind(ipcRenderer);

ipcRenderer.invoke = async (channel, ...args) => {
    console.log("📤 IPC INVOKE →", channel, "ARGS:", args);

    try {
        const result = await originalInvoke(channel, ...args);
        console.log("📥 IPC RESPONSE ←", channel, "RESULT:", result);
        return result;
    } catch (err) {
        console.error("❌ IPC ERROR ←", channel, err);
        throw err;
    }
};

// ======================
// API EXPOSED TO RENDERER
// ======================
contextBridge.exposeInMainWorld("api", {
    login: (email, password) => 
        ipcRenderer.invoke('perform-login', email, password),

    signUp: (formData) => 
        ipcRenderer.invoke('perform-signup', formData),

    verifyEmail: (email, code) => 
        ipcRenderer.invoke('perform-verifyEmail', email, code),

    // 🔥 Nombre corregido: este sí existe en el main
    getCourses: (studentId) => 
        ipcRenderer.invoke('get-student-courses', studentId),

    addCourse: (courseData) =>
        ipcRenderer.invoke('perform-add-course', courseData),

    getCourseDetails: (courseId) =>
        ipcRenderer.invoke('get-course-details', courseId),

    updateCourse: (courseData) =>
        ipcRenderer.invoke('update-course', courseData),


    getAllCourses: () => ipcRenderer.invoke('get-all-courses'),


    setState: (courseId, newState) =>
        ipcRenderer.invoke('change-course-state', courseId, newState),

    clearSession: () => {
        localStorage.removeItem('userId');
        localStorage.removeItem('userName');
        localStorage.removeItem('userPaternalSurname');
        console.log("🧹 Sesión local limpiada por orden del Main Process.");
    }
});
