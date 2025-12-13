document.addEventListener("DOMContentLoaded", async () => {
  const quizId = (localStorage.getItem("selectedQuizId") || "").trim();
  const courseId = (localStorage.getItem("selectedCourseId") || "").trim();
  const studentUserId = (localStorage.getItem("userId") || "").trim();
  const token = (localStorage.getItem("token") || "").trim();

  if (!quizId) {
    alert("No se encontró el ID del cuestionario. Regresa al curso e inténtalo otra vez.");
    goBackToCourse(courseId);
    return;
  }

  if (!studentUserId) {
    alert("Sesión no encontrada. Inicia sesión nuevamente.");
    goToLogin();
    return;
  }

  
  if (!token) {
    alert("No hay token de sesión. Inicia sesión nuevamente.");
    goToLogin();
    return;
  }

  
  const studentName = (localStorage.getItem("userName") || "").trim();
  const paternalSurname = (localStorage.getItem("userPaternalSurname") || "").trim();
  const nameEl = document.getElementById("studentNameDisplay");
  if (nameEl) nameEl.textContent = `${studentName} ${paternalSurname}`.trim() || "[Nombre]";

  const quizContainer = document.getElementById("quizContainer");
  const submitBtn = document.getElementById("submitQuizBtn");

  if (!quizContainer) {
    console.error("❌ No existe #quizContainer en el DOM.");
    return;
  }

  
  injectReviewStylesOnce();

  try {
    
    
    
   



const att = await getAttemptsInfoSafe(quizId, studentUserId, token);
const isContestato = att.attemptsCount > 1; 

if (isContestato && att.maxAttempt > 0) {
  

  const detail = await window.api.getQuizDetailForUser(quizId, token);
  const quiz = normalizeQuizDetail(detail);

  const title =
    quiz.title ||
    (localStorage.getItem("selectedQuizTitle") || "").trim() ||
    "Cuestionario";

  
  const reviewModel = buildReviewModelFromAttempts({
    quiz,
    attemptsRows: att.rows,
    lastAttemptNumber: att.maxAttempt,
    title
  });

  renderHeader(reviewModel.title, "Modo revisión: cuestionario contestado");
  renderAnsweredQuiz(reviewModel, quizContainer);

  if (submitBtn) {
    submitBtn.style.display = "none";   
    submitBtn.disabled = true;
    submitBtn.onclick = null;
  }

  return; 
}

    
    
    
    const detail = await window.api.getQuizDetailForUser(quizId, token);
    console.log("📥 getQuizDetailForUser:", detail);

    if (!detail || detail.success === false) {
      quizContainer.innerHTML = `<p class="error">No se pudo cargar el cuestionario: ${detail?.message || "Error desconocido"}</p>`;
      if (submitBtn) submitBtn.disabled = true;
      return;
    }

    
    
    const quiz = normalizeQuizDetail(detail);

    const title =
      quiz.title ||
      (localStorage.getItem("selectedQuizTitle") || "").trim() ||
      "Cuestionario";

    const description =
      quiz.description ||
      (localStorage.getItem("selectedQuizDescription") || "").trim() ||
      "Responde todas las preguntas del cuestionario";

    renderHeader(title, description);

    const questions = quiz.questions || [];
    if (!Array.isArray(questions) || questions.length === 0) {
      quizContainer.innerHTML = "<p>No hay preguntas disponibles para este cuestionario.</p>";
      if (submitBtn) submitBtn.disabled = true;
      return;
    }

    quizContainer.innerHTML = "";
    questions.forEach((q, idx) => {
      const questionId = q.questionId;
      const questionText = q.questionText || "Pregunta sin texto";
      const points = q.points ?? 1;

      const options = Array.isArray(q.options) ? q.options : [];

      const card = document.createElement("div");
      card.className = "form-container2";
      card.dataset.questionId = String(questionId);

      const optionsHtml = options
        .map((opt, optIdx) => {
          const optionId = opt.optionId;
          const optionText = opt.optionText || `Opción ${optIdx + 1}`;
          const name = `q_${questionId}`;

          return `
            <label class="option-row" style="display:flex; gap:10px; align-items:center; margin:10px 0;">
              <input type="radio" name="${name}" value="${optionId}">
              <span>${escapeHtml(optionText)}</span>
            </label>
          `;
        })
        .join("");

      card.innerHTML = `
        <h3 class="question-title">${idx + 1}. ${escapeHtml(questionText)}</h3>
        <p style="margin: 6px 0 14px 0;"><strong>Puntos:</strong> ${escapeHtml(points)}</p>
        <div class="options-block">
          <p style="margin: 0 0 8px 0;"><strong>Opciones de Respuesta:</strong></p>
          ${optionsHtml || "<p>Esta pregunta no tiene opciones.</p>"}
        </div>
      `;

      quizContainer.appendChild(card);
    });

    if (submitBtn) {
      submitBtn.disabled = false;

      
      submitBtn.onclick = async () => {
        submitBtn.disabled = true;
        const oldText = submitBtn.textContent;
        submitBtn.textContent = "Enviando respuestas...";

        try {
          const answers = collectAnswersForBackend(questions);
          console.log("📤 Payload answers (DAO expects):", answers);

       
          if (answers.some((a) => !a.optionId)) {
            alert("Responde todas las preguntas antes de enviar.");
            submitBtn.disabled = false;
            submitBtn.textContent = oldText;
            return;
          }
          const result = await window.api.answerQuiz(studentUserId, quizId, answers, token);
          console.log("📥 answerQuiz:", result);

          if (!result || result.success === false) {
            alert(`No se pudo enviar: ${result?.message || "Error desconocido"}`);
            submitBtn.disabled = false;
            submitBtn.textContent = oldText;
            return;
          }

          alert("¡Cuestionario enviado correctamente!");
          goBackToCourse(courseId);
        } catch (err) {
          console.error("❌ Error enviando respuestas:", err);
          alert("Error al enviar respuestas. Revisa consola.");
          submitBtn.disabled = false;
          submitBtn.textContent = oldText;
        }
      };
    }
  } catch (error) {
    console.error("❌ Error cargando cuestionario:", error);
    quizContainer.innerHTML = "<p class='error'>Error al cargar el cuestionario.</p>";
    if (submitBtn) submitBtn.disabled = true;
  }
});



function collectAnswersForBackend(questions) {
  return questions.map((q) => {
    const questionId = q.questionId;
    const selected = document.querySelector(`input[name="q_${questionId}"]:checked`);
    const optionId = selected ? Number(selected.value) : null;
    return { questionId, optionId };
  });
}

function goBackToCourse(courseId) {
  if (courseId) localStorage.setItem("selectedCourseId", String(courseId));

  if (window.nav && typeof window.nav.goTo === "function") {
    window.nav.goTo("EnrolledCourseDetails");
  } else {
    window.location.href = "EnrolledCourseDetails.html";
  }
}

function goToLogin() {
  if (window.nav && typeof window.nav.goTo === "function") {
    window.nav.goTo("login");
  } else {
    window.location.href = "login.html";
  }
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}



function normalizeQuizDetail(detail) {
  return detail?.result || detail?.data || detail?.quiz || detail;
}

function normalizeQuizResult(result) {

  if (!result) return null;
  if (result.success === false) return null;

  const r = result.result || result.data || result;

  const questions = Array.isArray(r.questions) ? r.questions : null;
  const scoreObtained = r.scoreObtained;
  const totalWeighing = r.totalWeighing;


  const answered =
    Array.isArray(questions) &&
    typeof scoreObtained === "number" &&
    typeof totalWeighing === "number";

  return {
    answered,
    title: r.title || (localStorage.getItem("selectedQuizTitle") || "").trim() || "Cuestionario",
    description:
      r.description ||
      (localStorage.getItem("selectedQuizDescription") || "").trim() ||
      "Revisión de tu intento",
    scoreObtained,
    totalWeighing,
    questions: questions || []
  };
}



function renderHeader(title, description) {
  const headerH1 = document.querySelector(".content-header h1");
  const headerP = document.querySelector(".content-header p");
  if (headerH1) headerH1.textContent = title;
  if (headerP) headerP.textContent = description;
}



function renderAnsweredQuiz(normalizedResult, container) {
  const { scoreObtained, totalWeighing, questions } = normalizedResult;


  let correctCount = 0;
  let wrongCount = 0;
  let unansweredCount = 0;

  (questions || []).forEach((q) => {
    const options = Array.isArray(q.options) ? q.options : [];
    const selectedOptionId = q.selectedOptionId ?? null;

    const correctOpt = options.find(o => o.isCorrect === 1 || o.isCorrect === true);
    const correctId = correctOpt ? Number(correctOpt.optionId) : null;

    if (!selectedOptionId || Number(selectedOptionId) === 0) {
      unansweredCount++;
      return;
    }

    if (correctId !== null && Number(selectedOptionId) === correctId) correctCount++;
    else wrongCount++;
  });

  const totalQuestions = Array.isArray(questions) ? questions.length : 0;

  
  const percentByPoints =
    Number(totalWeighing) > 0
      ? (Number(scoreObtained) / Number(totalWeighing)) * 100
      : 0;


  const percentByQuestions =
    totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;


  container.innerHTML = `
    <div style="margin: 10px 0 25px 0; display:flex; flex-direction:column; gap:10px;">
      <span class="score-pill">
        ✅ Calificación: <strong>${escapeHtml(scoreObtained)}</strong> / ${escapeHtml(totalWeighing)}
      </span>

      <span class="score-pill">
        ✅ Buenas: <strong>${correctCount}</strong> &nbsp; | &nbsp;
        ❌ Malas: <strong>${wrongCount}</strong>
        ${unansweredCount > 0 ? ` &nbsp; | &nbsp; ⏳ Sin responder: <strong>${unansweredCount}</strong>` : ""}
      </span>

      <span class="score-pill">
        📊 Porcentaje: <strong>${percentByPoints.toFixed(2)}%</strong>
      </span>
    </div>
  `;


  questions.forEach((q, idx) => {
    const questionId = q.questionId;
    const questionText = q.questionText || "Pregunta sin texto";
    const points = q.points ?? 1;

    const options = Array.isArray(q.options) ? q.options : [];
    const selectedOptionId = q.selectedOptionId;

    const correctOpt = options.find(o => o.isCorrect === 1 || o.isCorrect === true);
    const correctId = correctOpt ? correctOpt.optionId : null;

    const card = document.createElement("div");
    card.className = "form-container2";
    card.dataset.questionId = String(questionId);

    const optionsHtml = options.map((opt) => {
      const optionId = opt.optionId;
      const optionText = opt.optionText || "Opción";

      const isSelected = optionId === selectedOptionId;
      const isCorrect = correctId !== null && optionId === correctId;

      const classes = [
        "option-row-review",
        isCorrect ? "option-correct" : "",
        isSelected && !isCorrect ? "option-wrong-selected" : ""
      ].filter(Boolean).join(" ");

      let icon = "";
      if (isCorrect && isSelected) icon = "✅";
      else if (isCorrect && !isSelected) icon = "✅";
      else if (!isCorrect && isSelected) icon = "❌";

      return `
        <label class="${classes}">
          <input type="radio" disabled ${isSelected ? "checked" : ""} />
          <span>${escapeHtml(optionText)}</span>
          <span class="option-icon">${icon}</span>
        </label>
      `;
    }).join("");

    card.innerHTML = `
      <h3 class="question-title">${idx + 1}. ${escapeHtml(questionText)}</h3>
      <p style="margin: 6px 0 14px 0;"><strong>Puntos:</strong> ${escapeHtml(points)}</p>
      <div class="options-block">
        <p style="margin: 0 0 8px 0;"><strong>Opciones de Respuesta:</strong></p>
        ${optionsHtml || "<p>Esta pregunta no tiene opciones.</p>"}
      </div>
    `;

    container.appendChild(card);
  });
}




function injectReviewStylesOnce() {
  if (document.getElementById("quizReviewStyles")) return;

  const style = document.createElement("style");
  style.id = "quizReviewStyles";
  style.textContent = `
    .score-pill {
      display:inline-block;
      padding: 6px 10px;
      border-radius: 999px;
      background: rgba(0,0,0,0.06);
    }

    .option-row-review{
      display:flex;
      gap:10px;
      align-items:center;
      margin:10px 0;
      padding: 8px 10px;
      border-radius: 12px;
      border: 1px solid rgba(0,0,0,0.08);
    }

    .option-correct{
      background: rgba(0, 200, 0, 0.12);
      border-color: rgba(0, 200, 0, 0.35);
    }

    .option-wrong-selected{
      background: rgba(255, 0, 0, 0.10);
      border-color: rgba(255, 0, 0, 0.25);
    }

    .option-icon{
      margin-left:auto;
      font-size:18px;
      line-height:1;
    }
  `;
  document.head.appendChild(style);
}


async function getAttemptsInfoSafe(quizId, studentUserId, token) {
  try {
    const res = await window.api.getStudentsAttempts(quizId, studentUserId, token);

    if (!res || res.success === false) {
      return { attemptsCount: 0, maxAttempt: 0, rows: [] };
    }

    const rows =
      Array.isArray(res.attempts) ? res.attempts :
      Array.isArray(res.data) ? res.data :
      Array.isArray(res.result) ? res.result :
      Array.isArray(res) ? res :
      [];

    if (!rows.length) {
      return { attemptsCount: 0, maxAttempt: 0, rows: [] };
    }

    const attemptNums = rows
      .map(r => Number(r.attemptNumber))
      .filter(n => Number.isFinite(n) && n > 0);

    const unique = new Set(attemptNums);
    const attemptsCount = unique.size;
    const maxAttempt = attemptNums.length ? Math.max(...attemptNums) : 0;

    return { attemptsCount, maxAttempt, rows };
  } catch (e) {
    console.warn("⚠ getAttemptsInfoSafe falló:", e.message);
    return { attemptsCount: 0, maxAttempt: 0, rows: [] };
  }
}


function buildReviewModelFromAttempts({ quiz, attemptsRows, lastAttemptNumber, title }) {
  const questions = Array.isArray(quiz?.questions) ? quiz.questions : [];

  
  const selectedByQuestion = new Map();
  for (const r of attemptsRows) {
    const qid = Number(r.questionId);
    const att = Number(r.attemptNumber);
    const opt = Number(r.optionId);

    if (att === Number(lastAttemptNumber)) {
      
      selectedByQuestion.set(qid, opt > 0 ? opt : null);
    }
  }

  
  
  const correctByQuestion = new Map();
  for (const r of attemptsRows) {
    const qid = Number(r.questionId);
    const opt = Number(r.optionId);
    const ok = Number(r.isCorrect) === 1;

    if (ok && opt > 0 && !correctByQuestion.has(qid)) {
      correctByQuestion.set(qid, opt);
    }
  }

  
  let totalWeighing = 0;
  let scoreObtained = 0;

  const normalizedQuestions = questions.map((q) => {
    const qid = Number(q.questionId);
    const points = Number(q.points ?? 1);
    totalWeighing += points;

    const selectedOptionId = selectedByQuestion.get(qid) ?? null;
    const correctOptionId = correctByQuestion.get(qid) ?? null;

    
    const isCorrect = correctOptionId && selectedOptionId === correctOptionId;
    if (isCorrect) scoreObtained += points;

    const options = Array.isArray(q.options) ? q.options : [];
    const normalizedOptions = options.map((opt) => {
      const optionId = Number(opt.optionId);
      return {
        ...opt,
        optionId,
        isCorrect: correctOptionId !== null && optionId === correctOptionId ? 1 : 0
      };
    });

    return {
      ...q,
      questionId: qid,
      points,
      selectedOptionId,
      options: normalizedOptions
    };
  });

  return {
    answered: true,
    title,
    description: "Modo revisión: cuestionario contestado",
    scoreObtained,
    totalWeighing,
    questions: normalizedQuestions
  };
}

