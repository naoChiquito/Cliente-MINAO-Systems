const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { login } = require('../services/loginservice'); 
const { signUp } = require('../services/signUpservice');
const { verifyEmail } = require('../services/verifyEmailService');
const { getCoursesByInstructor, addCourse, getCourseDetails, updateCourse, setState } = require('../services/courseService');
const { getCoursesByStudent } = require('../services/courseService');

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

    // Cargar la página de login
    mainWindow.loadFile('GUI/views/login.html'); 

    // Habilitar las herramientas de desarrollo para la consola de la aplicación
    mainWindow.webContents.openDevTools(); // Esto abre las DevTools automáticamente

    // Evento de cierre de ventana
    mainWindow.on('close', (event) => {
        if (mainWindow) {
            mainWindow.webContents.executeJavaScript('window.api.clearSession();', true)
                .then(() => {
                    console.log('Datos de sesión limpiados antes de cerrar.');
                    mainWindow.destroy();
                })
                .catch(err => {
                    console.error('Error al limpiar la sesión:', err);
                    mainWindow.destroy(); 
                });
            event.preventDefault(); 
        }
    });
}

app.whenReady().then(() => {
    createWindow();

    ipcMain.handle('perform-login', async (event, email, password) => {
        try {
            const userData = await login(email, password);
            return { success: true, data: userData }; 
        } catch (error) {
            console.error("Error al iniciar sesión en el Main Process:", error.message);
            return { success: false, message: error.message }; 
        }
    });

    ipcMain.handle('perform-signup', async (event, formData) => {
        try {
            const userData = await signUp(formData);
            return { success: true, data: userData };
        } catch (error) {
            console.error("Error al registrar usuario en el Main Process:", error.message);
            return { success: false, message: error.message };
        }
    });

    ipcMain.handle('perform-verifyEmail', async (event, email, code) => {
        try {
            const userData = await verifyEmail(email, code);
            return { success: true, data: userData }; 
        } catch (error) {
            console.error("Error al verificar el correo en el Main Process:", error.message);
            return { success: false, message: error.message }; 
        }
    });

    ipcMain.handle('get-instructor-courses', async (event, instructorId) => {
        try {
            const courses = await getCoursesByInstructor(instructorId);
            return { success: true, data: courses };
        } catch (error) {
            console.error("Error al obtener cursos:", error.message);
            return { success: false, message: error.message };
        }
    });

    ipcMain.handle('perform-add-course', async (event, courseData) => {
        try{
            const result = await addCourse(courseData);
            return {success: true, data: result};
        } catch (error) {
            console.error("Error al crear curso:", error.message);
            return { success: false, message: error.message };
        }

    });

    ipcMain.handle('get-course-details', async (event, courseId) => {
        try {
            const details = await getCourseDetails(courseId); 
            return { success: true, data: details };
        } catch (error) {
            console.error("Error al obtener detalles del curso:", error.message);
            return { success: false, message: error.message };
        }
    });

    ipcMain.handle('update-course', async (event, courseData) => {
        try {
            const result = await updateCourse(courseData);
            return { success: true, message: result.message };
        } catch (error) {
            console.error("Error al editar curso:", error.message);
            return { success: false, message: error.message };
        }
    });

    ipcMain.handle('change-course-state', async (event, courseId, newState) => {
        try {
            const result = await setState(courseId, newState);
            return { success: true, message: result.message };
        } catch (error) {
            console.error("Error al cambiar estado:", error.message);
            return { success: false, message: error.message };
        }
    });    

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });

});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
