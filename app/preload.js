const { contextBridge, ipcRenderer } = require("electron");
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

/**
 * =========================
 * Helpers de blindaje (preload)
 * =========================
 * - No cambian URLs ni channels.
 * - Convierten respuestas “raras” a {success,data,message}.
 * - En caso de error, NO lanzan: regresan {success:false,...}
 */
const isPlainObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

const ensureSuccessProp = (payload, defaultSuccess = true) => {
    // Si es objeto y ya trae success, lo dejamos igual
    if (isPlainObject(payload)) {
        if ("success" in payload) return payload;

        // Heurística: si solo trae message o trae error/rawText, asumimos fallo
        const keys = Object.keys(payload);
        const onlyMessage = keys.length === 1 && keys[0] === "message";
        const looksError = onlyMessage || ("error" in payload) || ("rawText" in payload);

        return { ...payload, success: looksError ? false : defaultSuccess };
    }

    // Si es array, lo envolvemos como lista
    if (Array.isArray(payload)) {
        return { success: true, data: payload, result: payload, message: "OK" };
    }

    // Otros tipos (string/null/number): envolvemos
    return { success: defaultSuccess, data: payload, result: payload };
};

const pickArray = (x) =>
    Array.isArray(x) ? x :
    Array.isArray(x?.data) ? x.data :
    Array.isArray(x?.result) ? x.result :
    Array.isArray(x?.courses) ? x.courses :
    Array.isArray(x?.data?.data) ? x.data.data :
    Array.isArray(x?.data?.result) ? x.data.result :
    Array.isArray(x?.data?.courses) ? x.data.courses :
    [];

const safeInvoke = async (channel, ...args) => {
    try {
        const raw = await ipcRenderer.invoke(channel, ...args); // usa tu invoke logueado
        return ensureSuccessProp(raw, true);
    } catch (error) {
        return {
            success: false,
            data: null,
            result: null,
            message: error?.message || String(error)
        };
    }
};

const safeInvokeList = async (channel, ...args) => {
    const base = await safeInvoke(channel, ...args);

    // Si viene success:false, igual garantizamos data como array
    if (base.success === false) {
        return {
            ...base,
            data: Array.isArray(base.data) ? base.data : [],
            result: Array.isArray(base.result) ? base.result : [],
            message: base.message || "fetch failed"
        };
    }

    // Si viene success:true pero la lista está en otra parte, la sacamos
    const rows = pickArray(base.data ?? base.result ?? base);
    return {
        ...base,
        success: true,
        data: rows,
        result: rows,
        message: base.message || "OK"
    };
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

    // ✅ BLINDADO: siempre regresa {success,data:[]|...,message}
    getAllCourses: () =>
        safeInvokeList("get-all-courses"),

    getCourseContent: (courseId) =>
        ipcRenderer.invoke("get-course-content", courseId),

    getQuizzesByCourse: (courseId) =>
        ipcRenderer.invoke("get-quizzes-by-course", courseId),

    updateQuestionnaire: (quizId, updatedData) =>
        ipcRenderer.invoke("update-questionnaire", quizId, updatedData),


    getQuizDetailForUser: (quizId, token) =>
        ipcRenderer.invoke("get-quiz-detail-for-user", quizId, token),

    answerQuiz: (studentUserId, quizId, answers, token) =>
        ipcRenderer.invoke("answer-quiz", studentUserId, quizId, answers, token),

    viewQuizResult: (quizId, studentUserId, attemptNumberOrToken, tokenMaybe) =>
        ipcRenderer.invoke("view-quiz-result", quizId, studentUserId, attemptNumberOrToken, tokenMaybe),


    createQuiz: (quizData) =>
        ipcRenderer.invoke("create-quiz", quizData),

    getQuizResponses: (quizId) =>
        ipcRenderer.invoke("get-quiz-responses", quizId),

    listQuizResponses: (quizId, token) =>
        ipcRenderer.invoke("list-quiz-responses", quizId, token),

      getStudentsAttempts: (quizId, studentUserId, token) =>
        ipcRenderer.invoke("get-students-attempts", quizId, studentUserId, token),


    Buffer: {
        from: (arrayBuffer) => Buffer.from(arrayBuffer)
    },


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

    getStudentReportHtml: (userId, cursoId) =>
        ipcRenderer.invoke('get-student-report-html', userId, cursoId),

    viewFileWindow: (fileUrl) => 
        ipcRenderer.invoke('view-file-window', fileUrl),

    clearSession: () => {
        localStorage.removeItem("userId");
        localStorage.removeItem("userName");
        localStorage.removeItem("userPaternalSurname");
        console.log("🧹 Sesión local eliminada.");
    }
});


contextBridge.exposeInMainWorld("nav", {
    goTo: (page) => ipcRenderer.send("navigate-to", page)
});
