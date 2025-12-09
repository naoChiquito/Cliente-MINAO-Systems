const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { login } = require('../services/loginservice'); 
const { signUp } = require('../services/signUpservice');
const { verifyEmail } = require('../services/verifyEmailService');
const { getCoursesByInstructor, addCourse, getCourseDetails, updateCourse, setState } = require('../services/courseService');
const { getCourseContent, updateModuleContent, deleteContent, createContent } = require('../services/contentService');
const { uploadContent, getFilesByContent, deleteContentFile } = require('../services/gRPCService');

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
    
    ipcMain.handle('get-course-content', async (event, courseId) => {
        try {
            const contentData = await getCourseContent(courseId); 
            return { success: true, data: contentData };
        } catch (error) {
            console.error("Error al obtener contenido del curso:", error.message);
            return { success: false, message: error.message };
        }
    });

    ipcMain.handle('update-module-content', async (event,contentId, moduleData) => {
        try {
            const result = await updateModuleContent(contentId, moduleData);
            return { success: true, message: result.message };
        } catch (error) {
            console.error("Error al actualizar contenido del módulo:", error.message);
            return { success: false, message: error.message };
        }
    });

    ipcMain.handle('delete-module-content', async (event, contentId) => {
        try {
            const result = await deleteContent(contentId);
            return { success: true, message: result.message };
        } catch (error) {
            console.error("Error al eliminar contenido del módulo:", error.message);
            return { success: false, message: error.message };
        }
    });

    ipcMain.handle('create-content', async (event, moduleData) => {
        try {
            const result = await createContent(moduleData);
            return { success: true, message: result.message };
        } catch (error) {
            console.error("Error al crear módulo:", error.message);
            return { success: false, message: error.message };
        }
    }); 

    ipcMain.handle('upload-content', async (event, uploadData) => {
        try {
            const result = await uploadContent(uploadData);
            return { success: true, message: result.message };
        } catch (error) {
            console.error('Error en la subida gRPC (Main Process):', error.message);
            return { success: false, message: error.message };
        }
    });

    ipcMain.handle('get-files-by-content', async (event, contentId) => {
        try {
            const result = await getFilesByContent(contentId);
            return { success: true, files: result.files };
        } catch (error) {
            console.error('Error al obtener archivos gRPC:', error.message);
            return { success: false, message: error.message };
        }
    });

    ipcMain.handle('delete-content-file', async (event, fileId) => {
        try {
            const result = await deleteContentFile(fileId);
            return { success: result.success, message: result.message };
        } catch (error) {
            console.error('Error al eliminar archivo gRPC:', error.message);
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
