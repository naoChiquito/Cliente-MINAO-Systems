const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

const { login } = require('../services/loginservice'); 
const { signUp } = require('../services/signUpservice');
const { verifyEmail } = require('../services/verifyEmailService');

const { 
    getCoursesByInstructor, 
    addCourse, 
    getCourseDetails, 
    updateCourse, 
    setState, 
    getCoursesByStudent
} = require('../services/courseService');

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    mainWindow.loadFile('GUI/views/login.html');
    mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {

    createWindow();

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

    // -----------------------
    // COURSE IPC
    // -----------------------

    ipcMain.handle('get-instructor-courses', async (event, instructorId) => {
        try {
            const courses = await getCoursesByInstructor(instructorId);
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

    // -----------------------
    // GET ALL COURSES (REST)
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

// -----------------------
// APP EVENTS
// -----------------------

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
