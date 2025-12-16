function runOnDOMContentLoaded(modulePath) {
  const realAdd = document.addEventListener.bind(document);

  const spy = jest
    .spyOn(document, "addEventListener")
    .mockImplementation((type, cb, opts) => {
      if (type === "DOMContentLoaded") {
        // Ejecuta el callback inmediatamente y NO lo registra
        // para evitar listeners acumulados entre tests.
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

describe("logic/displayStudentCourses.js (Student Courses screen)", () => {
  beforeEach(() => {
    jest.resetModules();

    document.body.innerHTML = `
      <span id="studentNameDisplay">[Nombre]</span>
      <div id="backButton">←</div>

      <input id="courseSearch" />
      <div id="coursesContainer"></div>
    `;

    window.nav = { goTo: jest.fn(), goBack: jest.fn() };

    window.api = {
      findUserByEmailJSON: jest.fn(),
      getCoursesByStudent: jest.fn()
    };

    jest.spyOn(console, "error").mockImplementation(() => {});

    localStorage.clear();
    localStorage.setItem("userEmail", "test@mail.com");
    localStorage.setItem("userId", "7");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("carga nombre + cursos; click Ver detalles guarda selectedCourseId y navega a EnrolledCourseDetails", async () => {
    window.api.findUserByEmailJSON.mockResolvedValueOnce({
      success: true,
      user: { userName: "Lilly", paternalSurname: "G" }
    });

    window.api.getCoursesByStudent.mockResolvedValueOnce({
      success: true,
      data: {
        data: [
          {
            cursoId: 2,
            name: "Curso X",
            state: "Activo",
            startDate: "2025-01-01",
            endDate: "2025-01-10"
          }
        ]
      }
    });

    runOnDOMContentLoaded("../../../logic/displayStudentCourses.js");

    // Espera: loadStudentName (await) + loadCourses (async) + render
    await flushPromises();
    await flushPromises();
    await flushPromises();

    expect(document.getElementById("studentNameDisplay").textContent).toBe("Lilly G");
    expect(localStorage.getItem("userName")).toBe("Lilly");
    expect(localStorage.getItem("userPaternalSurname")).toBe("G");

    const button = document.querySelector("button[data-courseid]");
    expect(button).toBeTruthy();

    button.click();

    expect(localStorage.getItem("selectedCourseId")).toBe("2");
    expect(localStorage.getItem("courseOrigin")).toBe("studentCourses");
    expect(window.nav.goTo).toHaveBeenCalledWith("EnrolledCourseDetails");
  });

  test("buscar filtra cursos", async () => {
    window.api.findUserByEmailJSON.mockResolvedValueOnce({
      success: true,
      user: { userName: "Lilly", paternalSurname: "G" }
    });

    window.api.getCoursesByStudent.mockResolvedValueOnce({
      success: true,
      data: {
        data: [
          { cursoId: 1, name: "Matemáticas", state: "Activo" },
          { cursoId: 2, name: "Historia", state: "Activo" }
        ]
      }
    });

    runOnDOMContentLoaded("../../../logic/displayStudentCourses.js");

    await flushPromises();
    await flushPromises();
    await flushPromises();

    document.getElementById("courseSearch").value = "his";
    document.getElementById("courseSearch").dispatchEvent(new Event("input"));

    expect(document.getElementById("coursesContainer").textContent).toMatch(/Historia/);
    expect(document.getElementById("coursesContainer").textContent).not.toMatch(/Matemáticas/);
  });

  test("backButton: llama nav.goBack", async () => {
    window.api.findUserByEmailJSON.mockResolvedValueOnce({
      success: true,
      user: { userName: "Lilly", paternalSurname: "G" }
    });

    window.api.getCoursesByStudent.mockResolvedValueOnce({
      success: true,
      data: { data: [] }
    });

    // Importante: este módulo registra el listener de backButton "afuera"
    require("../../../logic/displayStudentCourses.js");

    // Ejecutamos el DOMContentLoaded una sola vez (sin acumular listeners)
    const evt = new Event("DOMContentLoaded");
    document.dispatchEvent(evt);

    await flushPromises();
    await flushPromises();

    document.getElementById("backButton").click();
    expect(window.nav.goBack).toHaveBeenCalled();
  });
});
