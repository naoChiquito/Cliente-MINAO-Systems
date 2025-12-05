const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { login } = require('../services/loginservice'); 
const { signUp } = require('../services/signUpservice');
const { verifyEmail } = require('../services/verifyEmailService');
const { getCoursesByInstructor, addCourse } = require('../services/courseService');

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