const { contextBridge, ipcRenderer } = require("electron");

/* =====================================================
   🎯 INTERCEPTOR DE INVOKE PARA DEBUG
===================================================== */
const originalInvoke = ipcRenderer.invoke.bind(ipcRenderer);

ipcRenderer.invoke = async (channel, ...args) => {
    console.log(`📤 IPC → ${channel}`, args);

    try {
        const result = await originalInvoke(channel, ...args);
        console.log(`📥 IPC ← ${channel}`, result);
        return result;
    } catch (error) {
        console.error(`❌ IPC ERROR ← ${channel}`, error);
        throw error;
    }
};


/* =====================================================
   🌐 API DISPONIBLE EN EL RENDERER (window.api)
===================================================== */
contextBridge.exposeInMainWorld("api", {

    /* ---------- AUTH ---------- */
    login: (email, password) =>
        ipcRenderer.invoke("perform-login", email, password),

    signUp: (formData) =>
        ipcRenderer.invoke("perform-signup", formData),

    verifyEmail: (email, code) =>
        ipcRenderer.invoke("perform-verifyEmail", email, code),


    /* ---------- COURSES (STUDENT) ---------- */
    getStudentCourses: (studentId) =>
        ipcRenderer.invoke("get-student-courses", studentId),

    /* ---------- COURSES (INSTRUCTOR) ---------- */
    getInstructorCourses: (instructorId) =>
        ipcRenderer.invoke("get-instructor-courses", instructorId),

    addCourse: (courseData) =>
        ipcRenderer.invoke("perform-add-course", courseData),

    getCourseDetails: (courseId) =>
        ipcRenderer.invoke("get-course-details", courseId),

    updateCourse: (courseData) =>
        ipcRenderer.invoke("update-course", courseData),

    changeCourseState: (courseId, newState) =>
        ipcRenderer.invoke("change-course-state", courseId, newState),


    /* ---------- COURSES (PUBLIC LIST) ---------- */
    getAllCourses: () =>
        ipcRenderer.invoke("get-all-courses"),


    /* ---------- CONTENT ---------- */
    getCourseContent: (courseId) =>
        ipcRenderer.invoke("get-course-content", courseId),

    updateModuleContent: (contentId, moduleData) =>
        ipcRenderer.invoke("update-module-content", contentId, moduleData),

    deleteModuleContent: (contentId) =>
        ipcRenderer.invoke("delete-module-content", contentId),

    createContent: (moduleData) =>
        ipcRenderer.invoke("create-content", moduleData),


    /* ---------- FILES / GRPC ---------- */
    uploadContent: (uploadData) =>
        ipcRenderer.invoke("upload-content", uploadData),

    getFilesByContent: (contentId) =>
        ipcRenderer.invoke("get-files-by-content", contentId),

    deleteContentFile: (fileId) =>
        ipcRenderer.invoke("delete-content-file", fileId),


    /* ---------- SESSION MGMT ---------- */
    clearSession: () => {
        localStorage.removeItem("userId");
        localStorage.removeItem("userName");
        localStorage.removeItem("userPaternalSurname");
        console.log("🧹 Sesión local eliminada.");
    }
});
