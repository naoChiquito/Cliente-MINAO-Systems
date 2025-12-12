const { contextBridge, ipcRenderer } = require("electron");

/* =====================================================
   INTERCEPTOR DE INVOKE PARA DEBUG
===================================================== */
const originalInvoke = ipcRenderer.invoke.bind(ipcRenderer);

ipcRenderer.invoke = async (channel, ...args) => {
    console.log(`IPC → ${channel}`, args);

    try {
        const result = await originalInvoke(channel, ...args);
        console.log(`IPC ← ${channel}`, result);
        return result;
    } catch (error) {
        console.error(`IPC ERROR ← ${channel}`, error);
        throw error;
    }
};



contextBridge.exposeInMainWorld("api", {
    login: (email, password) =>
        ipcRenderer.invoke("perform-login", email, password),

    updateUserBasicProfile: (userId, data) =>
    ipcRenderer.invoke("update-user-basic-profile", userId, data),

    signUp: (formData) =>
        ipcRenderer.invoke("perform-signup", formData),

    verifyEmail: (email, code) =>
        ipcRenderer.invoke("perform-verifyEmail", email, code),

    getUserProfile: (email) =>
        ipcRenderer.invoke("get-user-profile", email),

    findUserByEmail: (email) =>
        ipcRenderer.invoke("find-user-by-email", email),

    findUserByEmailJSON: (email) =>
        ipcRenderer.invoke("find-user-by-email-json", email),

    getInstructorFromCourse: (courseId) =>
        ipcRenderer.invoke("get-instructor-from-course", courseId),

    joinCourse: (data) =>
        ipcRenderer.invoke("join-course", data),

    unenrollStudentFromCourse: (courseId, studentId) =>
        ipcRenderer.invoke("unenroll-student-from-course", { courseId, studentId }),

    getCoursesByStudent: (studentId) =>
        ipcRenderer.invoke("get-courses-by-student", studentId),

    getStudentCourses: (studentId) =>
        ipcRenderer.invoke("get-student-courses", studentId),

    getCourses: (instructorId) =>
        ipcRenderer.invoke('get-instructor-courses', instructorId),

    getInstructorCoursesJSON: (instructorId) =>
        ipcRenderer.invoke("get-instructor-courses-json", instructorId),

    addCourse: (courseData) =>
        ipcRenderer.invoke("perform-add-course", courseData),

    getCourseDetails: (courseId) =>
        ipcRenderer.invoke("get-course-details", courseId),

    updateCourse: (courseData) =>
        ipcRenderer.invoke("update-course", courseData),

    changeCourseState: (courseId, newState) =>
        ipcRenderer.invoke("change-course-state", courseId, newState),

    getAllCourses: () =>
        ipcRenderer.invoke("get-all-courses"),

    getCourseContent: (courseId) =>
        ipcRenderer.invoke("get-course-content", courseId),

    getQuizzesByCourse: (courseId) =>
        ipcRenderer.invoke("get-quizzes-by-course", courseId),

    updateQuestionnaire: (quizId, updatedData) =>
        ipcRenderer.invoke("update-questionnaire", quizId, updatedData),

    getQuizDetailForUser: (quizId) =>
        ipcRenderer.invoke("get-quiz-detail-for-user", quizId),

    answerQuiz: (studentUserId, quizId, answers) =>
        ipcRenderer.invoke("answer-quiz", studentUserId, quizId, answers),

    getQuizzesByCourse: (courseId) => 
        ipcRenderer.invoke('get-quizzes-by-course', courseId),
        
    createQuiz: (quizData) => 
        ipcRenderer.invoke('create-quiz', quizData),

    getQuizResponses: (quizId) => 
        ipcRenderer.invoke('get-quiz-responses', quizId),

    Buffer: {
        from: (arrayBuffer) => Buffer.from(arrayBuffer)
    },

    viewQuizResult: (quizId, studentUserId) =>
        ipcRenderer.invoke("view-quiz-result", quizId, studentUserId),

    listQuizResponses: (quizId) =>
        ipcRenderer.invoke("list-quiz-responses", quizId),

    updateModuleContent: (contentId, moduleData) =>
        ipcRenderer.invoke("update-module-content", contentId, moduleData),

    deleteModuleContent: (contentId) =>
        ipcRenderer.invoke("delete-module-content", contentId),

    createContent: (moduleData) =>
        ipcRenderer.invoke("create-content", moduleData),

    uploadContent: (uploadData) =>
        ipcRenderer.invoke("upload-content", uploadData),

    getFilesByContent: (contentId) =>
        ipcRenderer.invoke("get-files-by-content", contentId),

    deleteContentFile: (fileId) =>
        ipcRenderer.invoke("delete-content-file", fileId),

    setState: (courseId, newState) => 
        ipcRenderer.invoke('change-course-state', courseId, newState),

    getQuizDetails: (quizId) => 
        ipcRenderer.invoke('get-details-quiz', quizId),

    deleteQuiz: (quizId) =>
        ipcRenderer.invoke('delete-quiz', quizId),

    getStudentsByCourse: (courseId) => 
        ipcRenderer.invoke('get-students-by-course', courseId),


    clearSession: () => {
        localStorage.removeItem("userId");
        localStorage.removeItem("userName");
        localStorage.removeItem("userPaternalSurname");
        console.log("🧹 Sesión local eliminada.");
    }
});


/* =====================================================
   NAVIGATION (renombrado a window.nav)
===================================================== */
contextBridge.exposeInMainWorld("nav", {
    goTo: (page) => ipcRenderer.send("navigate-to", page)
});
