function flushPromises() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe("logic/enrolledCourseDetails.js (Enrolled Course Details)", () => {
  beforeEach(() => {
    jest.resetModules();

    document.body.innerHTML = `
      <span id="studentNameDisplay"></span>

      <div id="backButton">←</div>

      <h1 id="course-title">Curso</h1>
      <p id="course-description"></p>

      <div id="contents-container"></div>
      <div id="quizzes-container"></div>

      <button id="drop-course-btn">Darse de baja</button>
    `;

    window.nav = { goTo: jest.fn(), goBack: jest.fn() };


    global.alert = jest.fn();
    global.confirm = jest.fn();

    jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});

    localStorage.setItem("selectedCourseId", "2");
    localStorage.setItem("userName", "Lilly");
    localStorage.setItem("userPaternalSurname", "G");
    localStorage.setItem("userId", "7");
    localStorage.setItem("token", "tok");

    window.api = {
      getCourseDetails: jest.fn(),
      getCourseContent: jest.fn(),
      getQuizzesByCourse: jest.fn(),
      getStudentsAttempts: jest.fn(),
      unenrollStudentFromCourse: jest.fn()
    };
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


  test("carga header + contenido + quizzes y permite click en quiz", async () => {
    window.api.getCourseDetails.mockResolvedValueOnce({
      data: { result: { name: "Fundamentos", description: "Intro" } }
    });

    window.api.getCourseContent.mockResolvedValueOnce({
      success: true,
      data: { results: [{ title: "M1", descripcion: "Desc", type: "Video" }] }
    });

    window.api.getQuizzesByCourse.mockResolvedValueOnce({
      result: [
        { quizId: 1, title: "Quiz 1", description: "D1", numberQuestion: 3 },
        { quizId: 2, title: "Quiz 2", description: "D2", numberQuestion: 5 }
      ]
    });

    window.api.getStudentsAttempts.mockImplementation(async (quizId) => {
      if (Number(quizId) === 1) return { attempts: [{ attemptNumber: 1 }] };
      return { attempts: [{ attemptNumber: 1 }, { attemptNumber: 2 }] };
    });

    require("../../../logic/enrolledCourseDetails.js");
    document.dispatchEvent(new Event("DOMContentLoaded"));

    await flushPromises();
    await flushPromises();

    expect(document.getElementById("studentNameDisplay").textContent).toBe("Lilly G");

    expect(document.getElementById("course-title").textContent).toBe("Fundamentos");
    expect(document.getElementById("course-description").textContent).toBe("Intro");

    expect(document.getElementById("contents-container").textContent).toMatch(/M1/);

    const quizzesContainer = document.getElementById("quizzes-container");
    expect(quizzesContainer.textContent).toMatch(/Quiz 1/);
    expect(quizzesContainer.textContent).toMatch(/Quiz 2/);
    expect(quizzesContainer.textContent).toMatch(/Sin contestar/);
    expect(quizzesContainer.textContent).toMatch(/CONTESTADO/);

    const cards = quizzesContainer.querySelectorAll(".module-card");
    expect(cards.length).toBe(2);

    cards[1].dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(localStorage.getItem("selectedQuizId")).toBe("2");
    expect(localStorage.getItem("selectedQuizTitle")).toBe("Quiz 2");
    expect(localStorage.getItem("quizReviewMode")).toBe("1"); // contestado
    expect(window.nav.goTo).toHaveBeenCalledWith("AnswerQuiz");
  });

  test("darse de baja: llama api.unenrollStudentFromCourse y navega a displayStudentCourses", async () => {
    window.api.getCourseDetails.mockResolvedValueOnce({ data: { result: { name: "X" } } });
    window.api.getCourseContent.mockResolvedValueOnce({ success: true, data: { results: [] } });
    window.api.getQuizzesByCourse.mockResolvedValueOnce({ result: [] });

    window.api.unenrollStudentFromCourse.mockResolvedValueOnce({ success: true });
    global.confirm.mockReturnValueOnce(true);

    require("../../../logic/enrolledCourseDetails.js");
    document.dispatchEvent(new Event("DOMContentLoaded"));

    await flushPromises();

    document.getElementById("drop-course-btn").click();
    await flushPromises();

    expect(window.api.unenrollStudentFromCourse).toHaveBeenCalledWith("2", "7");
    expect(localStorage.getItem("selectedCourseId")).toBe(null);
    expect(window.nav.goTo).toHaveBeenCalledWith("displayStudentCourses");
  });
});
