describe("logic/answerQuiz.js (Answer Quiz screen)", () => {
  beforeEach(() => {
    jest.resetModules();

    document.head.innerHTML = "";
    document.body.innerHTML = `
      <span id="studentNameDisplay">[Nombre]</span>

      <div class="content-header">
        <h1 id="quizTitle">Cuestionario</h1>
        <p id="quizSubtitle">Responde todas las preguntas del cuestionario</p>
      </div>

      <section id="quizContainer"></section>

      <button id="submitQuizBtn" class="btn-primary">
        Contestar cuestionario
      </button>
    `;

    // mocks globales comunes
    window.nav = { goTo: jest.fn(), goBack: jest.fn() };

    window.api = {
      getStudentsAttempts: jest.fn(),
      getQuizDetailForUser: jest.fn(),
      answerQuiz: jest.fn()
    };

    global.alert = jest.fn();

    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.spyOn(console, "log").mockImplementation(() => {});

    localStorage.clear();

    // sesión default (puedes sobrescribir en cada test)
    localStorage.setItem("selectedQuizId", "10");
    localStorage.setItem("selectedCourseId", "2");
    localStorage.setItem("userId", "7");
    localStorage.setItem("token", "tok");
    localStorage.setItem("userName", "Lilly");
    localStorage.setItem("userPaternalSurname", "G");
  });

  function runOnDOMContentLoaded(modulePath) {
    const realAdd = document.addEventListener.bind(document);

    const spy = jest
      .spyOn(document, "addEventListener")
      .mockImplementation((type, cb, opts) => {
        if (type === "DOMContentLoaded") {
          cb(new Event("DOMContentLoaded"));
          return;
        }
        return realAdd(type, cb, opts);
      });

    require(modulePath);
    spy.mockRestore();
  }

  function flushPromises() {
    return new Promise((resolve) => setTimeout(resolve, 0));
  }

  test("si falta quizId => alerta y regresa a EnrolledCourseDetails", async () => {
    localStorage.setItem("selectedQuizId", "");
    localStorage.setItem("selectedCourseId", "2");

    runOnDOMContentLoaded("../../../logic/answerQuiz.js");

    await flushPromises();

    expect(global.alert).toHaveBeenCalled();
    expect(window.nav.goTo).toHaveBeenCalledWith("EnrolledCourseDetails");
    expect(localStorage.getItem("selectedCourseId")).toBe("2");
  });

  test("si falta userId => alerta y navega a login", async () => {
    localStorage.setItem("userId", "");

    runOnDOMContentLoaded("../../../logic/answerQuiz.js");

    await flushPromises();

    expect(global.alert).toHaveBeenCalled();
    expect(window.nav.goTo).toHaveBeenCalledWith("login");
  });

  test("si falta token => alerta y navega a login", async () => {
    localStorage.setItem("token", "");

    runOnDOMContentLoaded("../../../logic/answerQuiz.js");

    await flushPromises();

    expect(global.alert).toHaveBeenCalled();
    expect(window.nav.goTo).toHaveBeenCalledWith("login");
  });

  test("carga quiz (modo contestar): renderiza preguntas y habilita submit", async () => {
    window.api.getStudentsAttempts.mockResolvedValueOnce({
      success: true,
      attempts: [] // => attemptsCount 0
    });

    window.api.getQuizDetailForUser.mockResolvedValueOnce({
      success: true,
      result: {
        title: "Quiz Demo",
        description: "Desc Demo",
        questions: [
          {
            questionId: 101,
            questionText: "¿1+1?",
            points: 1,
            options: [
              { optionId: 1, optionText: "2" },
              { optionId: 2, optionText: "3" }
            ]
          },
          {
            questionId: 102,
            questionText: "¿2+2?",
            points: 1,
            options: [
              { optionId: 3, optionText: "4" },
              { optionId: 4, optionText: "5" }
            ]
          }
        ]
      }
    });

    runOnDOMContentLoaded("../../../logic/answerQuiz.js");

    await flushPromises();
    await flushPromises();

    expect(document.getElementById("studentNameDisplay").textContent).toBe("Lilly G");

    // header actualizado
    expect(document.querySelector(".content-header h1").textContent).toBe("Quiz Demo");
    expect(document.querySelector(".content-header p").textContent).toBe("Desc Demo");

    // preguntas renderizadas
    const quizContainer = document.getElementById("quizContainer");
    expect(quizContainer.textContent).toMatch(/¿1\+1\?/);
    expect(quizContainer.textContent).toMatch(/¿2\+2\?/);

    // radios renderizados
    expect(document.querySelectorAll('input[type="radio"]').length).toBeGreaterThan(0);

    // submit habilitado
    const submitBtn = document.getElementById("submitQuizBtn");
    expect(submitBtn.disabled).toBe(false);
  });

  test("submit: si faltan respuestas => alerta y NO llama answerQuiz", async () => {
    window.api.getStudentsAttempts.mockResolvedValueOnce({ success: true, attempts: [] });

    window.api.getQuizDetailForUser.mockResolvedValueOnce({
      success: true,
      result: {
        title: "Quiz Demo",
        description: "Desc Demo",
        questions: [
          {
            questionId: 101,
            questionText: "Q1",
            points: 1,
            options: [
              { optionId: 1, optionText: "A" },
              { optionId: 2, optionText: "B" }
            ]
          },
          {
            questionId: 102,
            questionText: "Q2",
            points: 1,
            options: [
              { optionId: 3, optionText: "C" },
              { optionId: 4, optionText: "D" }
            ]
          }
        ]
      }
    });

    runOnDOMContentLoaded("../../../logic/answerQuiz.js");
    await flushPromises();
    await flushPromises();

    // selecciona SOLO la primera pregunta
    const opt = document.querySelector('input[name="q_101"][value="1"]');
    opt.checked = true;

    document.getElementById("submitQuizBtn").click();

    await flushPromises();
    await flushPromises();

    expect(global.alert).toHaveBeenCalledWith("Responde todas las preguntas antes de enviar.");
    expect(window.api.answerQuiz).not.toHaveBeenCalled();

    const submitBtn = document.getElementById("submitQuizBtn");
    expect(submitBtn.disabled).toBe(false);
  });

  test("submit: con respuestas completas => llama answerQuiz y regresa al curso", async () => {
    window.api.getStudentsAttempts.mockResolvedValueOnce({ success: true, attempts: [] });

    window.api.getQuizDetailForUser.mockResolvedValueOnce({
      success: true,
      result: {
        title: "Quiz Demo",
        description: "Desc Demo",
        questions: [
          {
            questionId: 101,
            questionText: "Q1",
            points: 1,
            options: [
              { optionId: 1, optionText: "A" },
              { optionId: 2, optionText: "B" }
            ]
          },
          {
            questionId: 102,
            questionText: "Q2",
            points: 1,
            options: [
              { optionId: 3, optionText: "C" },
              { optionId: 4, optionText: "D" }
            ]
          }
        ]
      }
    });

    window.api.answerQuiz.mockResolvedValueOnce({ success: true });

    runOnDOMContentLoaded("../../../logic/answerQuiz.js");
    await flushPromises();
    await flushPromises();

    // selecciona respuestas
    document.querySelector('input[name="q_101"][value="2"]').checked = true;
    document.querySelector('input[name="q_102"][value="3"]').checked = true;

    document.getElementById("submitQuizBtn").click();

    await flushPromises();
    await flushPromises();

    expect(window.api.answerQuiz).toHaveBeenCalledWith(
      "7",
      "10",
      [
        { questionId: 101, optionId: 2 },
        { questionId: 102, optionId: 3 }
      ],
      "tok"
    );

    expect(global.alert).toHaveBeenCalledWith("¡Cuestionario enviado correctamente!");
    expect(window.nav.goTo).toHaveBeenCalledWith("EnrolledCourseDetails");
    expect(localStorage.getItem("selectedCourseId")).toBe("2");
  });

  test("modo revisión: si ya contestó => renderiza resultado y oculta submit", async () => {
    // attemptsCount > 1 y maxAttempt > 0
    window.api.getStudentsAttempts.mockResolvedValueOnce({
      success: true,
      attempts: [
        // intento 1
        { attemptNumber: 1, questionId: 101, optionId: 1, isCorrect: 1 },
        { attemptNumber: 1, questionId: 102, optionId: 3, isCorrect: 1 },
        // intento 2 (último): seleccionó una correcta y una incorrecta
        { attemptNumber: 2, questionId: 101, optionId: 1, isCorrect: 1 },
        { attemptNumber: 2, questionId: 102, optionId: 4, isCorrect: 0 }
      ]
    });

    window.api.getQuizDetailForUser.mockResolvedValueOnce({
      success: true,
      result: {
        title: "Quiz Demo",
        description: "Desc Demo",
        questions: [
          {
            questionId: 101,
            questionText: "Q1",
            points: 2,
            options: [
              { optionId: 1, optionText: "A" },
              { optionId: 2, optionText: "B" }
            ]
          },
          {
            questionId: 102,
            questionText: "Q2",
            points: 3,
            options: [
              { optionId: 3, optionText: "C" },
              { optionId: 4, optionText: "D" }
            ]
          }
        ]
      }
    });

    runOnDOMContentLoaded("../../../logic/answerQuiz.js");

    await flushPromises();
    await flushPromises();
    await flushPromises();

    // header modo revisión
    expect(document.querySelector(".content-header p").textContent).toMatch(/Modo revisión/i);

    // submit oculto
    const submitBtn = document.getElementById("submitQuizBtn");
    expect(submitBtn.style.display).toBe("none");
    expect(submitBtn.disabled).toBe(true);

    // resultado renderizado (pills / calificación)
    expect(document.getElementById("quizContainer").textContent).toMatch(/Calificación/i);

    // no debe intentar enviar
    expect(window.api.answerQuiz).not.toHaveBeenCalled();
  });
});
