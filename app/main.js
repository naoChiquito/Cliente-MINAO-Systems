const { app, BrowserWindow, ipcMain } = require('electron');
const { findUserByEmail, findUserByEmailJSON, 
                        updateUserBasicProfile } = require('../services/userService');

const path = require('path');

// -----------------------
// MAKE mainWindow GLOBAL
// -----------------------
let mainWindow;

// -----------------------
// AUTH SERVICES
// -----------------------
const { login } = require('../services/loginservice'); 
const { signUp } = require('../services/signUpservice');
const { verifyEmail } = require('../services/verifyEmailService');

// -----------------------
// COURSE SERVICES
// -----------------------
const { 
    getCoursesByInstructor,
    getCoursesByInstructorJSON, 
    addCourse, 
    getCourseDetails, 
    updateCourse, 
    setState, 
    getCoursesByStudent
} = require('../services/courseService');

// -----------------------
// CONTENT SERVICES
// -----------------------
const { 
    getCourseContent, 
    updateModuleContent, 
    deleteContent, 
    createContent 
} = require('../services/contentService');

const {
    getQuizzesByCourse,
    updateQuestionnaire,
    getQuizDetailForUser,
    answerQuiz,
    viewQuizResult,
    listQuizResponses
} = require('../services/quizService');

// -----------------------
// GRPC SERVICES
// -----------------------
const { uploadContent, getFilesByContent, deleteContentFile } = require('../services/gRPCService');


// -----------------------
// WINDOW CREATION
// -----------------------
function createWindow() {

    // IMPORTANT: assign to global variable
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false
        },
    });

    mainWindow.loadFile(path.join(__dirname, "../GUI/views/login.html"));
    mainWindow.webContents.openDevTools();
}


// -----------------------
// APP READY
// -----------------------
app.whenReady().then(() => {

    createWindow();

    // -----------------------
    // NAVIGATION (🔥 MOVIDO AQUÍ)
    // -----------------------
    ipcMain.on("navigate-to", (event, page) => {

        if (!mainWindow) return;

        const fullPath = path.join(__dirname, "../GUI/views", `${page}.html`);
        console.log("➡ Loading page:", fullPath);

        mainWindow.loadFile(fullPath).catch(err => {
            console.error("❌ Error loading page:", err);
        });
    });

    // -----------------------
    // AUTH IPC
    // -----------------------
    ipcMain.handle('perform-login', async (event, email, password) => {
        try {
            const userData = await login(email, password);
            return { success: true, data: userData };
        } catch (error) {
            return { success: false, message: error.message };
        }
    });

    ipcMain.handle('perform-signup', async (event, formData) => {
        try {
            const userData = await signUp(formData);
            return { success: true, data: userData };
        } catch (error) {
            return { success: false, message: error.message };
        }
    });

    ipcMain.handle('perform-verifyEmail', async (event, email, code) => {
        try {
            const userData = await verifyEmail(email, code);
            return { success: true, data: userData };
        } catch (error) {
            return { success: false, message: error.message };
        }
    });

    ipcMain.handle("get-user-profile", async (event, email) => {
        try {
            const user = await findUser(email);
            return { success: true, data: user };
        } catch (error) {
            return { success: false, message: error.message };
        }
    });

    ipcMain.handle("update-user-basic-profile", async (event, userId, formData) => {
        try {
            const result = await updateUserBasicProfile(userId, formData);
            return { success: true, data: result };
        } catch (error) {
            return { success: false, message: error.message };
        }
    });




    ipcMain.handle("find-user-by-email", async (event, email) => {
    try {
        const user = await findUserByEmail(email);
        return { success: true, data: user };
    } catch (error) {
        return { success: false, message: error.message };
    }
    });

    ipcMain.handle("find-user-by-email-json", async (event, email) => {
        try {
            const userData = await findUserByEmailJSON(email);

            return {
                success: true,
                user: userData.user
            };

        } catch (error) {
            return { success: false, message: error.message };
        }
    });


    // -----------------------
    // COURSE IPC
    // -----------------------
    ipcMain.handle('get-instructor-courses', async (event, instructorId) => {
        try {
            const courses = await getCoursesByInstructor(instructorId);
            return { success: true, data: courses };
        } catch (error) {
            console.error("Error al obtener cursos:", error.message);
            return { success: false, message: error.message };
        }
    });

    ipcMain.handle('get-instructor-courses-json', async (event, instructorId) => {
        try {
            const courses = await getCoursesByInstructorJSON(instructorId);
            return { success: true, data: courses };
        } catch (error) {
            return { success: false, message: error.message };
        }
    });

    ipcMain.handle('perform-add-course', async (event, courseData) => {
        try {
            const result = await addCourse(courseData);
            return { success: true, data: result };
        } catch (error) {
            return { success: false, message: error.message };
        }
    });

    ipcMain.handle('get-course-details', async (event, courseId) => {
        try {
            const details = await getCourseDetails(courseId);
            return { success: true, data: details };
        } catch (error) {
            return { success: false, message: error.message };
        }
    });

    ipcMain.handle('update-course', async (event, courseData) => {
        try {
            const result = await updateCourse(courseData);
            return { success: true, data: result };
        } catch (error) {
            return { success: false, message: error.message };
        }
    });

    ipcMain.handle('change-course-state', async (event, courseId, newState) => {
        try {
            const result = await setState(courseId, newState);
            return { success: true, data: result };
        } catch (error) {
            return { success: false, message: error.message };
        }
    });

    ipcMain.handle('get-student-courses', async (event, studentId) => {
        try {
            const courses = await getCoursesByStudent(studentId);
            return { success: true, data: courses };
        } catch (error) {
            return { success: false, message: error.message };
        }
    });

    ipcMain.handle('get-courses-by-student', async (event, studentId) => {
        try {
            const courses = await getCoursesByStudent(studentId);
            return { success: true, data: courses };
        } catch (error) {
            console.error("IPC get-courses-by-student error:", error);
            return { success: false, message: error.message };
        }
    });

    // =========================
    // GET INSTRUCTOR FROM COURSE
    // =========================
    ipcMain.handle("get-instructor-from-course", async (event, courseId) => {
        try {
            const url = `http://127.0.0.1:8000/minao_systems/instructor/${courseId}/instructor`;
            const response = await fetch(url);
            const json = await response.json();
            return { success: true, data: json };
        } catch (error) {
            console.error("Error IPC get-instructor-from-course:", error);
            return { success: false, message: error.message };
        }
    });

    // =========================
    // JOIN COURSE
    // =========================
    ipcMain.handle("join-course", async (event, data) => {
        try {
            const url = "http://127.0.0.1:8000/minao_systems/courses/join";

            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    studentUserId: data.studentUserId,
                    cursoId: data.cursoId
                })
            });

            return await response.json();
        } catch (e) {
            return { success: false, message: e.message };
        }
    });



    // =========================
    // UNENROLL STUDENT FROM COURSE
    // =========================
    ipcMain.handle("unenroll-student-from-course", async (event, data) => {
        try {
            const url = `http://127.0.0.1:8000/minao_systems/courses/${data.courseId}/students/${data.studentId}/unenroll`;
            
            const response = await fetch(url, { method: "DELETE" });
            const json = await response.json();
            
            return json;
        } catch (error) {
            console.error("Error IPC unenroll:", error);
            return { success: false, message: error.message };
        }
    });


    // -----------------------
    // CONTENT IPC
    // -----------------------
    ipcMain.handle('get-course-content', async (event, courseId) => {
        try {
            const contentData = await getCourseContent(courseId); 
            return { success: true, data: contentData };
        } catch (error) {
            return { success: false, message: error.message };
        }
    });

    ipcMain.handle('update-module-content', async (event, contentId, moduleData) => {
        try {
            const result = await updateModuleContent(contentId, moduleData);
            return { success: true, message: result.message };
        } catch (error) {
            return { success: false, message: error.message };
        }
    });

    ipcMain.handle('delete-module-content', async (event, contentId) => {
        try {
            const result = await deleteContent(contentId);
            return { success: true, message: result.message };
        } catch (error) {
            return { success: false, message: error.message };
        }
    });

    ipcMain.handle('create-content', async (event, moduleData) => {
        try {
            const result = await createContent(moduleData);
            return { success: true, message: result.message };
        } catch (error) {
            return { success: false, message: error.message };
        }
    });

    // -----------------------
    // GRPC UPLOADS
    // -----------------------
    ipcMain.handle('upload-content', async (event, uploadData) => {
        try {
            const result = await uploadContent(uploadData);
            return { success: true, message: result.message };
        } catch (error) {
            return { success: false, message: error.message };
        }
    });

    ipcMain.handle('get-files-by-content', async (event, contentId) => {
        try {
            const result = await getFilesByContent(contentId);
            return { success: true, files: result.files };
        } catch (error) {
            return { success: false, message: error.message };
        }
    });

    ipcMain.handle('delete-content-file', async (event, fileId) => {
        try {
            const result = await deleteContentFile(fileId);
            return { success: result.success, message: result.message };
        } catch (error) {
            return { success: false, message: error.message };
        }
    });

    // -----------------------
    // GET ALL COURSES
    // -----------------------
    ipcMain.handle('get-all-courses', async () => {
        try {
            const res = await fetch("http://127.0.0.1:8000/minao_systems/courses/all");
            const data = await res.json();
            return data;
        } catch (error) {
            return { success: false, message: error.message };
        }
    });

});

// =========================================================
// GET QUIZZES BY COURSE
// =========================================================
ipcMain.handle('get-quizzes-by-course', async (event, courseId) => {
    try {
        const quizzes = await getQuizzesByCourse(courseId);
        return quizzes;
    } catch (error) {
        console.error('Error fetching quizzes:', error);
        return { success: false, message: error.message };
    }
});

// =========================================================
// UPDATE QUESTIONNAIRE
// =========================================================
ipcMain.handle('update-questionnaire', async (event, quizId, updatedData) => {
    try {
        const result = await updateQuestionnaire(quizId, updatedData);
        return result;
    } catch (error) {
        console.error('Error updating questionnaire:', error);
        return { success: false, message: error.message };
    }
});

// =========================================================
// GET QUIZ DETAIL FOR USER
// =========================================================
ipcMain.handle('get-quiz-detail-for-user', async (event, quizId) => {
    try {
        const quizDetail = await getQuizDetailForUser(quizId);
        return quizDetail;
    } catch (error) {
        console.error('Error fetching quiz detail:', error);
        return { success: false, message: error.message };
    }
});

// =========================================================
// ANSWER QUIZ
// =========================================================
ipcMain.handle('answer-quiz', async (event, studentUserId, quizId, answers) => {
    try {
        const result = await answerQuiz(studentUserId, quizId, answers);
        return result;
    } catch (error) {
        console.error('Error answering quiz:', error);
        return { success: false, message: error.message };
    }
});

// =========================================================
// VIEW QUIZ RESULT
// =========================================================
ipcMain.handle('view-quiz-result', async (event, quizId, studentUserId) => {
    try {
        const result = await viewQuizResult(quizId, studentUserId);
        return result;
    } catch (error) {
        console.error('Error viewing quiz result:', error);
        return { success: false, message: error.message };
    }
});

// =========================================================
// LIST QUIZ RESPONSES
// =========================================================
ipcMain.handle('list-quiz-responses', async (event, quizId) => {
    try {
        const responses = await listQuizResponses(quizId);
        return responses;
    } catch (error) {
        console.error('Error listing quiz responses:', error);
        return { success: false, message: error.message };
    }
});


// -----------------------
// APP EVENTS
// -----------------------
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
