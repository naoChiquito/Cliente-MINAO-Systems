const API_BASE = (process.env.API_BASE_URL || "https://nonrevocable-continuous-lakendra.ngrok-free.dev").replace(/\/$/, "");
const API = (p) => `${API_BASE}${p.startsWith("/") ? p : `/${p}`}`;
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");

/**
 * =========================
 * Helpers de “blindaje”
 * =========================
 * - No cambian URLs.
 * - Evitan crashes si la respuesta NO es JSON.
 * - Si el backend devuelve objeto sin `success`, se lo añadimos sin romper el shape.
 * - Si devuelve algo raro (string/array/null), lo envolvemos de forma consistente.
 */
const isPlainObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

const safeJsonParse = (text) => {
  try {
    return { ok: true, value: text ? JSON.parse(text) : null };
  } catch {
    return { ok: false, value: { rawText: text } };
  }
};

const ensureSuccessProp = (payload, defaultSuccess = true) => {
  if (isPlainObject(payload)) {
    if ("success" in payload) return payload;
    return { ...payload, success: defaultSuccess };
  }
  // Si no es objeto (array/string/null), lo envolvemos
  return { success: defaultSuccess, data: payload, result: payload };
};

const fetchJsonish = async (url, options) => {
  const res = await fetch(url, options);
  const text = await res.text();
  const parsed = safeJsonParse(text).value;
  return { res, text, parsed };
};

const httpFailEnvelope = (res, parsed) => {
  const msg =
    (isPlainObject(parsed) && (parsed.message || parsed.error)) ||
    `HTTP ${res.status}`;
  return { success: false, message: msg };
};




const {
  findUserByEmail,
  findUserByEmailJSON,
  updateUserBasicProfile
} = require("../services/userService");




const { login } = require("../services/loginservice");
const { signUp } = require("../services/signUpservice");
const { verifyEmail } = require("../services/verifyEmailService");




const {
  getCoursesByInstructor,
  getCoursesByInstructorJSON,
  addCourse,
  getCourseDetails,
  updateCourse,
  setState,
  getCoursesByStudent,
  getStudentsByCourse
} = require("../services/courseService");




const {
  getCourseContent,
  updateModuleContent,
  deleteContent,
  createContent
} = require("../services/contentService");




const {
  getQuizzesByCourse,
  updateQuestionnaire,
  getQuizDetailForUser,
  answerQuiz,
  viewQuizResult,
  listQuizResponses,

  
  createQuiz,
  getQuizResponsesList,
  getQuizDetails,
  deleteQuiz,
  getStudentsAttempts
} = require("../services/quizService");




const {
  uploadContent,
  getFilesByContent,
  deleteContentFile,
  getFileViewUrl
} = require("../services/gRPCService");

const { getStudentReportHtml } = require("../services/reportService");




let mainWindow;
let isClosing = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  
  mainWindow.loadFile(path.join(__dirname, "../GUI/views/login.html"));

  
  mainWindow.webContents.openDevTools();

  
  mainWindow.on("close", async (event) => {
    if (isClosing) return;
    isClosing = true;

    event.preventDefault();

    try {
      await mainWindow.webContents.executeJavaScript(`
        try {
          localStorage.removeItem("userId");
          localStorage.removeItem("userEmail");
          localStorage.removeItem("userName");
          localStorage.removeItem("userPaternalSurname");
          localStorage.removeItem("token");
        } catch (e) {}
      `);
      console.log("🧹 Sesión limpiada antes de cerrar.");
    } catch (err) {
      console.error("❌ Error limpiando sesión:", err);
    } finally {
      mainWindow.destroy();
    }
  });
}




app.whenReady().then(() => {
  createWindow();

  
  
  
  
  ipcMain.on("navigate-to", (event, page) => {
    if (!mainWindow) return;

    const safePage = typeof page === "string" ? page.trim() : "";
    if (!safePage) return;

    const fileName = safePage.endsWith(".html") ? safePage : `${safePage}.html`;
    const fullPath = path.join(__dirname, "../GUI/views", fileName);

    console.log("➡ Loading page:", fullPath);

    mainWindow.loadFile(fullPath).catch((err) => {
      console.error("Error loading page:", err);
    });
  });

  
  
  
  ipcMain.handle("get-students-attempts", async (event, quizId, studentUserId, token) => {
    try {
      const result = await getStudentsAttempts(quizId, studentUserId, token);
      return ensureSuccessProp(result, true); // <-- blindaje suave
    } catch (error) {
      console.error(
        `Error get-students-attempts (quizId=${quizId}, studentUserId=${studentUserId}):`,
        error.message
      );
      return { success: false, message: error.message };
    }
  });

  
  
  
  
  
  
  
  
  ipcMain.handle("view-quiz-result", async (event, quizId, studentUserId, attemptOrToken, tokenMaybe) => {
    try {
      let attemptNumber = null;
      let token = null;

      if (typeof tokenMaybe !== "undefined") {
        attemptNumber = attemptOrToken; 
        token = tokenMaybe;             
      } else {
        token = attemptOrToken;         
      }

      const result = await viewQuizResult(quizId, studentUserId, attemptNumber, token);
      return ensureSuccessProp(result, true); // <-- blindaje suave
    } catch (error) {
      console.error("Error view-quiz-result:", error);
      return { success: false, message: error.message };
    }
  });

  
  
  
  ipcMain.handle("perform-login", async (event, email, password) => {
    try {
      const userData = await login(email, password);
      return { success: true, data: userData };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle("perform-signup", async (event, formData) => {
    try {
      const userData = await signUp(formData);
      return { success: true, data: userData };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle("perform-verifyEmail", async (event, email, code) => {
    try {
      const userData = await verifyEmail(email, code);
      return { success: true, data: userData };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  
  
  
  ipcMain.handle("get-user-profile", async (event, email) => {
    try {
      const user = await findUserByEmail(email);
      return { success: true, data: user };
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
      return { success: true, user: userData.user };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  
  ipcMain.handle("update-user-basic-profile", async (event, userId, data) => {
    try {
      const result = await updateUserBasicProfile(userId, data);
      return { success: true, data: result };
    } catch (error) {
      console.error("IPC update-user-basic-profile error:", error);
      return { success: false, message: error.message };
    }
  });

  
  
  
  ipcMain.handle("get-instructor-courses", async (event, instructorId) => {
    try {
      const courses = await getCoursesByInstructor(instructorId);
      return { success: true, data: courses };
    } catch (error) {
      console.error("Error al obtener cursos:", error.message);
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle("get-instructor-courses-json", async (event, instructorId) => {
    try {
      const courses = await getCoursesByInstructorJSON(instructorId);
      return { success: true, data: courses };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle("perform-add-course", async (event, courseData) => {
    try {
      const result = await addCourse(courseData);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle("get-course-details", async (event, courseId) => {
    try {
      const details = await getCourseDetails(courseId);
      return { success: true, data: details };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle("update-course", async (event, courseData) => {
    try {
      const result = await updateCourse(courseData);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle("change-course-state", async (event, courseId, newState) => {
    try {
      const result = await setState(courseId, newState);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle("get-student-courses", async (event, studentId) => {
    try {
      const courses = await getCoursesByStudent(studentId);
      return { success: true, data: courses };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

    ipcMain.handle("get-courses-by-student", async (event, studentId) => {
    try {
      const courses = await getCoursesByStudent(studentId);
      return { success: true, data: courses };
    } catch (error) {
      console.error("IPC get-courses-by-student error:", error);
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle("get-students-by-course", async (event, courseId) => {
    try {
      const result = await getStudentsByCourse(courseId);
      // Blindaje sin cambiar estructura si ya venía “bien”
      if (isPlainObject(result) && ("success" in result)) return result;
      return ensureSuccessProp(result, true);
    } catch (error) {
      console.error(`Error get-students-by-course (${courseId}):`, error.message);
      return { success: false, students: [], message: error.message };
    }
  });

  ipcMain.handle("get-instructor-from-course", async (event, courseId) => {
    try {
      const url = API(`/minao_systems/instructor/${courseId}/instructor`);
      const { res, parsed } = await fetchJsonish(url);

      if (!res.ok) {
        const base = httpFailEnvelope(res, parsed);
        return { ...base, data: parsed };
      }

      const payload = ensureSuccessProp(parsed, true);

      if (isPlainObject(parsed) && parsed.success === false) {
        return payload;
      }
      return { success: true, data: payload };
    } catch (error) {
      console.error("Error IPC get-instructor-from-course:", error);
      const causeCode = error?.cause?.code;
      const causeMsg = error?.cause?.message;
      const extra = causeCode || causeMsg ? ` (${causeCode || causeMsg})` : "";
      return { success: false, message: `${error.message}${extra}` };
    }
  });


  ipcMain.handle("join-course", async (event, data) => {
    try {
      const url = API("/minao_systems/courses/join");
      const { res, parsed } = await fetchJsonish(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentUserId: data.studentUserId,
          cursoId: data.cursoId
        })
      });

      if (!res.ok) {
        const base = httpFailEnvelope(res, parsed);
        return ensureSuccessProp({ ...base, data: parsed }, false);
      }

      if (isPlainObject(parsed) && ("success" in parsed)) return parsed;

      return ensureSuccessProp(parsed, true);
    } catch (e) {
      const causeCode = e?.cause?.code;
      const causeMsg = e?.cause?.message;
      const extra = causeCode || causeMsg ? ` (${causeCode || causeMsg})` : "";
      return { success: false, message: `${e.message}${extra}` };
    }
  });


  ipcMain.handle("unenroll-student-from-course", async (event, data) => {
    try {
      const url = API(`/minao_systems/courses/${data.courseId}/students/${data.studentId}/unenroll`);
      const { res, parsed } = await fetchJsonish(url, { method: "DELETE" });

      if (!res.ok) {
        const base = httpFailEnvelope(res, parsed);
        return ensureSuccessProp({ ...base, data: parsed }, false);
      }

      if (isPlainObject(parsed) && ("success" in parsed)) return parsed;

      return ensureSuccessProp(parsed, true);
    } catch (error) {
      console.error("Error IPC unenroll:", error);
      const causeCode = error?.cause?.code;
      const causeMsg = error?.cause?.message;
      const extra = causeCode || causeMsg ? ` (${causeCode || causeMsg})` : "";
      return { success: false, message: `${error.message}${extra}` };
    }
  });


  ipcMain.handle("get-course-content", async (event, courseId) => {
    try {
      const contentData = await getCourseContent(courseId);
      return { success: true, data: contentData };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle("update-module-content", async (event, contentId, moduleData) => {
    try {
      const result = await updateModuleContent(contentId, moduleData);
      return { success: true, message: result.message };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle("delete-module-content", async (event, contentId) => {
    try {
      const result = await deleteContent(contentId);
      return { success: true, message: result.message };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle("create-content", async (event, moduleData) => {
    try {
      const result = await createContent(moduleData);
      return { success: true, message: result.message };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle("upload-content", async (event, uploadData) => {
    try {
      const result = await uploadContent(uploadData);
      return { success: true, message: result.message };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle("get-files-by-content", async (event, contentId) => {
    try {
      const result = await getFilesByContent(contentId);
      // blindaje suave: si no trae success, lo añadimos (sin tocar el objeto si ya está bien)
      const safe = ensureSuccessProp(result, true);
      return safe; 
      console.log("[IPC] get-files-by-content contentId:", contentId);
      console.log("[ENV] GRPC_HOST:", process.env.GRPC_HOST);

      
    } catch (error) {
      return { success: false, message: error.message, files: [] };
    }
});

  ipcMain.handle("delete-content-file", async (event, fileId) => {
    try {
      const result = await deleteContentFile(fileId);
      return { success: result.success, message: result.message };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

ipcMain.handle("get-all-courses", async () => {
  const pickArray = (x) =>
    Array.isArray(x) ? x :
    Array.isArray(x?.data) ? x.data :
    Array.isArray(x?.result) ? x.result :
    Array.isArray(x?.courses) ? x.courses :
    Array.isArray(x?.data?.data) ? x.data.data :
    Array.isArray(x?.data?.result) ? x.data.result :
    Array.isArray(x?.data?.courses) ? x.data.courses :
    [];

  try {
    const res = await fetch(API("/minao_systems/courses/all"));

    const text = await res.text();
    let parsed = null;

    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      parsed = { rawText: text }; // si te llega HTML/texto
    }

    // HTTP no-OK
    if (!res.ok) {
      const msg = parsed?.message || parsed?.error || `HTTP ${res.status}`;
      return { success: false, data: [], message: msg };
    }

    // backend ya reportó success:false
    if (parsed && typeof parsed === "object" && parsed.success === false) {
      return {
        success: false,
        data: pickArray(parsed),
        message: parsed.message || "Error obteniendo cursos."
      };
    }

    // normaliza a array
    const rows = pickArray(parsed);

    return {
      success: true,
      data: rows,
      message: parsed?.message || "OK"
    };
  } catch (error) {
    const causeCode = error?.cause?.code;
    const causeMsg = error?.cause?.message;
    const extra = causeCode || causeMsg ? ` (${causeCode || causeMsg})` : "";
    console.error("get-all-courses fetch error:", error, "cause:", error?.cause);
    return { success: false, data: [], message: `${error.message}${extra}` };
  }
});



  ipcMain.handle("get-quizzes-by-course", async (event, courseId) => {
    try {
      const result = await getQuizzesByCourse(courseId);
      return ensureSuccessProp(result, true); // <-- blindaje suave
    } catch (error) {
      console.error(`Error get-quizzes-by-course (${courseId}):`, error.message);
      return { success: false, result: [], message: error.message };
    }
  });

  ipcMain.handle("update-questionnaire", async (event, quizId, updatedData) => {
    try {
      const result = await updateQuestionnaire(quizId, updatedData);
      return ensureSuccessProp(result, true); // <-- blindaje suave
    } catch (error) {
      console.error("Error update-questionnaire:", error.message);
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle("get-quiz-detail-for-user", async (event, quizId, token) => {
    try {
      const quizDetail = await getQuizDetailForUser(quizId, token);
      return ensureSuccessProp(quizDetail, true); // <-- blindaje suave
    } catch (error) {
      console.error("Error get-quiz-detail-for-user:", error);
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle("answer-quiz", async (event, studentUserId, quizId, answers, token) => {
    try {
      const result = await answerQuiz(studentUserId, quizId, answers, token);
      return ensureSuccessProp(result, true); // <-- blindaje suave
    } catch (error) {
      console.error("Error answer-quiz:", error);
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle("get-quiz-responses", async (event, quizId) => {
    try {
      const raw = await getQuizResponsesList(quizId);

      if (raw && typeof raw === "object" && raw.success === false) {
        return {
          success: false,
          count: 0,
          responses: [],
          result: [],
          data: [],
          message: raw.message || "Error obteniendo respuestas."
        };
      }

      const rows =
        Array.isArray(raw) ? raw :
        Array.isArray(raw?.responses) ? raw.responses :
        Array.isArray(raw?.result) ? raw.result :
        Array.isArray(raw?.data) ? raw.data :
        Array.isArray(raw?.data?.responses) ? raw.data.responses :
        Array.isArray(raw?.result?.responses) ? raw.result.responses :
        [];

      return {
        success: true,
        count: rows.length,
        responses: rows,
        result: rows,
        data: rows,
        message: raw?.message || "OK"
      };
    } catch (error) {
      console.error(`Error get-quiz-responses (quizId=${quizId}):`, error.message);
      return {
        success: false,
        count: 0,
        responses: [],
        result: [],
        data: [],
        message: error.message
      };
    }
  });

  ipcMain.handle("create-quiz", async (event, quizData) => {
    try {
      const result = await createQuiz(quizData);
      return ensureSuccessProp(result, true); // <-- blindaje suave
    } catch (error) {
      console.error("Error create-quiz:", error.message);
      return { success: false, quizId: null, message: error.message };
    }
  });

  ipcMain.handle("get-details-quiz", async (event, quizId) => {
    try {
      const raw = await getQuizDetails(quizId);

      if (raw && typeof raw === "object" && "success" in raw) {
        return raw;
      }

      return { success: true, result: raw, data: raw };
    } catch (error) {
      console.error(`Error get-details-quiz (${quizId}):`, error.message);
      return { success: false, result: null, data: null, message: error.message };
    }
  });

  ipcMain.handle("delete-quiz", async (event, quizId) => {
    try {
      const result = await deleteQuiz(quizId);
      return ensureSuccessProp(result, true); // <-- blindaje suave
    } catch (error) {
      console.error(`Error delete-quiz (${quizId}):`, error.message);
      return { success: false, result: null, message: error.message };
    }
  });
});

ipcMain.handle('get-student-report-html', async (event, userId, cursoId) => {
    try {
        const result = await getStudentReportHtml(userId, cursoId);
        return ensureSuccessProp(result, true); 
        
    } catch (error) {
        return { 
            success: false, 
            message: error.message 
        };
    }
});

ipcMain.handle('view-file-window', async (event, fileUrl) => {
    try {
        const fullUrl = getFileViewUrl(fileUrl);

        let viewWindow = new BrowserWindow({
            width: 1000,
            height: 800,
            title: "Visor de Documentos - Minao Systems",
            autoHideMenuBar: true,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true
            }
        });
        viewWindow.loadURL(fullUrl);

        viewWindow.on('closed', () => {
            viewWindow = null;
        });

        return { success: true };
    } catch (error) {
        console.error("Error al abrir la ventana de visor:", error);
        return { success: false, message: error.message };
    }
});



app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
