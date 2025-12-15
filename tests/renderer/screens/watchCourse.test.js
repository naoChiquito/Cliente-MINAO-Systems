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

describe("logic/watchCourse.js (Watch Courses screen)", () => {
  beforeEach(() => {
    jest.resetModules();

    document.body.innerHTML = `
      <span id="studentNameDisplay">[Nombre]</span>
      <input id="courseSearch" />
      <div id="coursesContainer"></div>
    `;

    window.nav = { goTo: jest.fn() };
    window.api = { getAllCourses: jest.fn() };

    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(console, "log").mockImplementation(() => {});

    localStorage.clear();
    localStorage.setItem("userName", "Lilly");
    localStorage.setItem("userPaternalSurname", "G");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("carga cursos y renderiza tarjetas; click Ver detalles navega a JoinCourse", async () => {
    window.api.getAllCourses.mockResolvedValueOnce({
      success: true,
      data: [
        {
          cursoId: 1,
          name: "Curso A",
          category: "Cat",
          startDate: "2025-01-01",
          endDate: "2025-01-02",
          state: "Activo"
        },
        {
          cursoId: 2,
          name: "Curso B",
          category: "Cat",
          startDate: "2025-02-01",
          endDate: "2025-02-02",
          state: "Activo"
        }
      ]
    });

    runOnDOMContentLoaded("../../../logic/watchCourse.js");

    await flushPromises();
    await flushPromises();
    await flushPromises();

    expect(document.getElementById("studentNameDisplay").textContent).toBe("Lilly G");

    const buttons = document.querySelectorAll(".ver-detalles");
    expect(buttons.length).toBe(2);

    buttons[1].click();

    expect(localStorage.getItem("selectedCourseId")).toBe("2");
    expect(window.nav.goTo).toHaveBeenCalledWith("JoinCourse");
  });

  test("buscar filtra cursos por nombre", async () => {
    window.api.getAllCourses.mockResolvedValueOnce({
      success: true,
      data: [
        { cursoId: 1, name: "Matemáticas", state: "Activo" },
        { cursoId: 2, name: "Programación", state: "Activo" }
      ]
    });

    runOnDOMContentLoaded("../../../logic/watchCourse.js");

    await flushPromises();
    await flushPromises();
    await flushPromises();

    document.getElementById("courseSearch").value = "pro";
    document.getElementById("courseSearch").dispatchEvent(new Event("input"));

    const buttons = document.querySelectorAll(".ver-detalles");
    expect(buttons.length).toBe(1);
    expect(document.getElementById("coursesContainer").textContent).toMatch(/Programación/);
  });
});
