describe("logic/joinCourse.js (Join Course screen)", () => {
  beforeEach(() => {
    jest.resetModules();

    // DOM mínimo equivalente a JoinCourse.html (IDs que usa joinCourse.js)
    document.body.innerHTML = `
      <span id="studentNameDisplay"></span>

      <a id="navMisCursos"></a>
      <a id="navVerCursos"></a>
      <a id="navChat"></a>
      <a id="navPerfil"></a>
      <a id="navLogout"></a>

      <div id="backButton">←</div>

      <h2 id="course-title">Cargando...</h2>
      <p id="course-description"></p>
      <p id="course-category"></p>
      <p id="course-dates"></p>
      <p id="course-instructor"></p>

      <ul id="contents-list"><li>Cargando contenido...</li></ul>
      <ul id="quizzes-list"><li>Cargando quizzes...</li></ul>

      <button id="join-button">Cargando...</button>
      <button id="drop-button" style="display:none;">Darse de baja</button>
    `;

    // mocks globales
    global.alert = jest.fn();
    global.confirm = jest.fn();

    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(console, "log").mockImplementation(() => {});

    // window.nav se usa en sidebar y back
    window.nav = { goTo: jest.fn(), goBack: jest.fn() };

    // localStorage requerido
    localStorage.clear();
    localStorage.setItem("selectedCourseId", "2");
    localStorage.setItem("userId", "7");
    localStorage.setItem("userName", "Lilly");
    localStorage.setItem("userPaternalSurname", "G");

    // mocks API (todos los que usa joinCourse.js)
    window.api = {
      getCourseDetails: jest.fn(),
      getInstructorFromCourse: jest.fn(),
      getCourseContent: jest.fn(),
      getCoursesByStudent: jest.fn(),
      joinCourse: jest.fn(),
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


  test("render inicial: muestra info del curso + instructor + contenido y enseña botón Unirme si NO está inscrito", async () => {
    window.api.getCourseDetails.mockResolvedValueOnce({
      data: { result: { name: "Fundamentos", description: "Intro", category: "Prog", startDate: "2025-01-15", endDate: "2025-02-15" } }
    });

    window.api.getInstructorFromCourse.mockResolvedValueOnce({
      data: { instructor: [{ name: "Profe", email: "profe@mail.com" }] }
    });

    window.api.getCourseContent.mockResolvedValueOnce({
      data: { results: [{ title: "Módulo 1", type: "Video", descripcion: "Desc 1" }] }
    });

    // NO inscrito: lista no contiene cursoId=2
    window.api.getCoursesByStudent.mockResolvedValueOnce({
      data: { data: [{ cursoId: 999 }] }
    });

    require("../../../logic/joinCourse.js");
    window.dispatchEvent(new Event("DOMContentLoaded"));

    // esperar awaits en cascada
    await flushPromises();
    await flushPromises();

    // Sidebar name
    expect(document.getElementById("studentNameDisplay").textContent).toBe("Lilly G");

    // Curso
    expect(document.getElementById("course-title").textContent).toBe("Fundamentos");
    expect(document.getElementById("course-description").textContent).toMatch(/Descripción:/);
    expect(document.getElementById("course-category").textContent).toMatch(/Categoría:/);
    expect(document.getElementById("course-dates").textContent).toMatch(/Fechas:/);

    // Instructor
    expect(document.getElementById("course-instructor").textContent).toMatch(/Instructor: Profe/);

    // Contenido
    expect(document.getElementById("contents-list").textContent).toMatch(/Módulo 1/);

    // Quizzes default
    expect(document.getElementById("quizzes-list").textContent).toMatch(/No hay cuestionarios disponibles/i);

    // Botones (NO inscrito)
    const joinBtn = document.getElementById("join-button");
    const dropBtn = document.getElementById("drop-button");
    expect(joinBtn.style.display).toBe("inline-block");
    expect(dropBtn.style.display).toBe("none");
    expect(joinBtn.textContent).toMatch(/Unirme al curso/i);
  });

  test("inscrito: oculta Unirme y muestra Darse de baja", async () => {
    window.api.getCourseDetails.mockResolvedValueOnce({
      data: { result: { name: "Fundamentos", description: "Intro" } }
    });
    window.api.getInstructorFromCourse.mockResolvedValueOnce({ data: { instructor: [] } });
    window.api.getCourseContent.mockResolvedValueOnce({ data: { results: [] } });

    // Inscrito: cursoId=2 presente
    window.api.getCoursesByStudent.mockResolvedValueOnce({
      data: { data: [{ cursoId: 2 }, { cursoId: 3 }] }
    });

    require("../../../logic/joinCourse.js");
    window.dispatchEvent(new Event("DOMContentLoaded"));

    await flushPromises();
    await flushPromises();

    const joinBtn = document.getElementById("join-button");
    const dropBtn = document.getElementById("drop-button");

    expect(joinBtn.style.display).toBe("none");
    expect(dropBtn.style.display).toBe("inline-block");
    expect(dropBtn.textContent).toMatch(/Darse de baja/i);
  });

  test("click Unirme: llama joinCourse, cambia UI y muestra alert", async () => {
    window.api.getCourseDetails.mockResolvedValueOnce({
      data: { result: { name: "Fundamentos", description: "Intro" } }
    });
    window.api.getInstructorFromCourse.mockResolvedValueOnce({ data: { instructor: [] } });
    window.api.getCourseContent.mockResolvedValueOnce({ data: { results: [] } });

    // No inscrito al inicio
    window.api.getCoursesByStudent.mockResolvedValueOnce({ data: { data: [] } });

    window.api.joinCourse.mockResolvedValueOnce({ success: true });

    require("../../../logic/joinCourse.js");
    window.dispatchEvent(new Event("DOMContentLoaded"));

    await flushPromises();
    await flushPromises();

    const joinBtn = document.getElementById("join-button");
    joinBtn.click();
    await flushPromises();

    expect(window.api.joinCourse).toHaveBeenCalledWith({
      studentUserId: "7",
      cursoId: "2"
    });

    expect(global.alert).toHaveBeenCalledWith("¡Te has unido al curso!");

    const dropBtn = document.getElementById("drop-button");
    expect(joinBtn.style.display).toBe("none");
    expect(dropBtn.style.display).toBe("inline-block");
  });

  test("click Darse de baja: confirm true => llama unenroll, cambia UI y muestra alert", async () => {
    window.api.getCourseDetails.mockResolvedValueOnce({
      data: { result: { name: "Fundamentos", description: "Intro" } }
    });
    window.api.getInstructorFromCourse.mockResolvedValueOnce({ data: { instructor: [] } });
    window.api.getCourseContent.mockResolvedValueOnce({ data: { results: [] } });

    // Arranca inscrito
    window.api.getCoursesByStudent.mockResolvedValueOnce({ data: { data: [{ cursoId: 2 }] } });

    window.api.unenrollStudentFromCourse.mockResolvedValueOnce({ success: true });
    global.confirm.mockReturnValueOnce(true);

    require("../../../logic/joinCourse.js");
    window.dispatchEvent(new Event("DOMContentLoaded"));

    await flushPromises();
    await flushPromises();

    const dropBtn = document.getElementById("drop-button");
    dropBtn.click();
    await flushPromises();

    expect(window.api.unenrollStudentFromCourse).toHaveBeenCalledWith("2", "7");
    expect(global.alert).toHaveBeenCalledWith("Te has dado de baja del curso.");

    const joinBtn = document.getElementById("join-button");
    expect(dropBtn.style.display).toBe("none");
    expect(joinBtn.style.display).toBe("inline-block");
  });

  test("sidebar navegación: clicks llaman window.nav.goTo", async () => {
    // Evitar que el script regrese temprano por falta de selectedCourseId
    // (ya lo tenemos), pero también necesita mocks básicos de carga:
    window.api.getCourseDetails.mockResolvedValueOnce({
      data: { result: { name: "X", description: "" } }
    });
    window.api.getInstructorFromCourse.mockResolvedValueOnce({ data: { instructor: [] } });
    window.api.getCourseContent.mockResolvedValueOnce({ data: { results: [] } });
    window.api.getCoursesByStudent.mockResolvedValueOnce({ data: { data: [] } });

    require("../../../logic/joinCourse.js");
    window.dispatchEvent(new Event("DOMContentLoaded"));

    await flushPromises();
    await flushPromises();

    document.getElementById("navMisCursos").click();
    expect(window.nav.goTo).toHaveBeenCalledWith("displayStudentCourses");

    document.getElementById("navVerCursos").click();
    expect(window.nav.goTo).toHaveBeenCalledWith("WatchCourse");

    document.getElementById("navChat").click();
    expect(window.nav.goTo).toHaveBeenCalledWith("UnderConstruction");

    document.getElementById("navPerfil").click();
    expect(window.nav.goTo).toHaveBeenCalledWith("Profile");

    document.getElementById("navLogout").click();
    expect(window.nav.goTo).toHaveBeenCalledWith("login");
  });
});
