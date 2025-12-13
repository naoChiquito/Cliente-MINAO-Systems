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

  // Sidebar: nombre alumno
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

  try {
    // ✅ ahora mandamos token
    const detail = await window.api.getQuizDetailForUser(quizId, token);
    console.log("📥 getQuizDetailForUser:", detail);

    if (!detail || detail.success === false) {
      quizContainer.innerHTML = `<p class="error">No se pudo cargar el cuestionario: ${detail?.message || "Error desconocido"}</p>`;
      if (submitBtn) submitBtn.disabled = true;
      return;
    }

    // Tu DAO getQuizForStudent regresa algo como:
    // { quizId, title, description, questions: [{questionId, questionText, points, options:[{optionId, optionText}]}] }
    const quiz = detail.result || detail.data || detail.quiz || detail;

    const title =
      quiz.title ||
      localStorage.getItem("selectedQuizTitle") ||
      "Cuestionario";

    const description =
      quiz.description ||
      localStorage.getItem("selectedQuizDescription") ||
      "Responde todas las preguntas del cuestionario";

    const headerH1 = document.querySelector(".content-header h1");
    const headerP = document.querySelector(".content-header p");
    if (headerH1) headerH1.textContent = title;
    if (headerP) headerP.textContent = description;

    const questions = quiz.questions || [];
    if (!Array.isArray(questions) || questions.length === 0) {
      quizContainer.innerHTML = "<p>No hay preguntas disponibles para este cuestionario.</p>";
      if (submitBtn) submitBtn.disabled = true;
      return;
    }

    // Render
    quizContainer.innerHTML = "";
    questions.forEach((q, idx) => {
      const questionId = q.questionId;
      const questionText = q.questionText || "Pregunta sin texto";
      const points = q.points ?? 1;

      const options = Array.isArray(q.options) ? q.options : [];

      const card = document.createElement("div");
      card.className = "form-container2";
      card.dataset.questionId = String(questionId);

      const optionsHtml = options.map((opt, optIdx) => {
        const optionId = opt.optionId;
        const optionText = opt.optionText || `Opción ${optIdx + 1}`;
        const name = `q_${questionId}`;

        return `
          <label class="option-row" style="display:flex; gap:10px; align-items:center; margin:10px 0;">
            <input type="radio" name="${name}" value="${optionId}">
            <span>${escapeHtml(optionText)}</span>
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

      quizContainer.appendChild(card);
    });

    if (submitBtn) {
      submitBtn.disabled = false;

      submitBtn.addEventListener("click", async () => {
        submitBtn.disabled = true;
        const oldText = submitBtn.textContent;
        submitBtn.textContent = "Enviando respuestas...";

        try {
          const answers = collectAnswersForBackend(questions);
          console.log("📤 Payload answers (DAO expects):", answers);

          // Validación: todas contestadas
          if (answers.some(a => !a.optionId)) {
            alert("Responde todas las preguntas antes de enviar.");
            submitBtn.disabled = false;
            submitBtn.textContent = oldText;
            return;
          }

          // ✅ ahora mandamos token
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
      });
    }

  } catch (error) {
    console.error("❌ Error cargando cuestionario:", error);
    quizContainer.innerHTML = "<p class='error'>Error al cargar el cuestionario.</p>";
    if (submitBtn) submitBtn.disabled = true;
  }
});

function collectAnswersForBackend(questions) {
  // Regla del DAO: answers = [{ questionId, optionId }, ...]
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
