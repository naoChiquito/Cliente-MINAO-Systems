console.log("✅ watchCourse.js cargado");

document.addEventListener("DOMContentLoaded", async function () {
  const studentNameDisplay = document.getElementById("studentNameDisplay");
  const coursesContainer = document.getElementById("coursesContainer");
  const courseSearchInput = document.getElementById("courseSearch");

  // 🔒 Si falta algo en el HTML, no te rompe todo y lo reporta
  if (!coursesContainer) {
    console.error("❌ Falta #coursesContainer en el HTML");
    return;
  }
  if (!courseSearchInput) {
    console.error("❌ Falta #courseSearch en el HTML");
    coursesContainer.innerHTML =
      `<p style="color:#b00;font-size:14px;">Error: Falta el input #courseSearch en el HTML.</p>`;
    return;
  }

  const userName = localStorage.getItem("userName");
  const userPaternalSurname = localStorage.getItem("userPaternalSurname");
  if (studentNameDisplay && userName && userPaternalSurname) {
    studentNameDisplay.textContent = `${userName} ${userPaternalSurname}`;
  }

  let allCourses = [];
  let lastLoadError = null;

  const pickArray = (x) =>
    Array.isArray(x) ? x :
    Array.isArray(x?.data) ? x.data :
    Array.isArray(x?.result) ? x.result :
    Array.isArray(x?.courses) ? x.courses :
    Array.isArray(x?.data?.data) ? x.data.data :
    Array.isArray(x?.data?.result) ? x.data.result :
    Array.isArray(x?.data?.courses) ? x.data.courses :
    [];

  const normalizeCourses = (raw) => {
    const arr = pickArray(raw);
    const success = raw?.success === false ? false : true;
    const message = raw?.message || (success ? "OK" : "No se pudo cargar cursos.");
    return { success, data: Array.isArray(arr) ? arr : [], message };
  };

  const displayCourses = (courses) => {
    coursesContainer.innerHTML = "";

    if (!courses || courses.length === 0) {
      coursesContainer.innerHTML = `
        <p style="color:#666; font-size: 14px;">
          ${lastLoadError ? `No se pudieron cargar los cursos: ${lastLoadError}` : "No hay cursos disponibles."}
        </p>
      `;
      return;
    }

    courses.forEach((course) => {
      const div = document.createElement("div");
      div.classList.add("course-item");

      const start = formatDate(course.startDate);
      const end = formatDate(course.endDate);

      const id =
        course.cursoId ?? course.courseId ?? course.id ?? "";

      div.innerHTML = `
        <div>
          <h4>${course.name ?? "(Sin nombre)"}</h4>
          <p style="margin: 0; color:#555;">
            ${course.category ? `<b>Categoría:</b> ${course.category}<br>` : ""}
            ${start ? `<b>Inicio:</b> ${start}<br>` : ""}
            ${end ? `<b>Fin:</b> ${end}<br>` : ""}
            <b>Estado:</b> ${course.state ?? "N/D"}
          </p>
        </div>

        <button class="btn-primary ver-detalles" data-courseid="${id}">
          Ver detalles
        </button>
      `;

      coursesContainer.appendChild(div);
    });
  };

  async function loadCourses() {
    try {
      console.log("📡 Solicitando TODOS los cursos...");
      console.log("window.api existe?", !!window.api, "getAllCourses existe?", !!window.api?.getAllCourses);

      const raw = await window.api.getAllCourses();
      console.log("📥 Cursos recibidos:", raw);

      const norm = normalizeCourses(raw);
      lastLoadError = norm.success ? null : norm.message;
      allCourses = norm.data;

      displayCourses(allCourses);
    } catch (error) {
      console.error("❌ Error al cargar cursos:", error);
      lastLoadError = error?.message || String(error);
      allCourses = [];
      displayCourses(allCourses);
    }
  }

  function formatDate(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}/${month}/${day}`;
  }

  // 🔎 búsqueda robusta (por si viene name null)
  courseSearchInput.addEventListener("input", () => {
    const text = courseSearchInput.value.trim().toLowerCase();
    const filtered = allCourses.filter((c) =>
      String(c?.name ?? "").toLowerCase().includes(text)
    );
    displayCourses(filtered);
  });

  // ✅ Un solo listener para botones (delegación)
  coursesContainer.addEventListener("click", (e) => {
    const btn = e.target.closest(".ver-detalles");
    if (!btn) return;

    const id = btn.dataset.courseid;
    if (!id) return;

    localStorage.setItem("selectedCourseId", id);
    localStorage.setItem("courseOrigin", "watchCourses");
    console.log("➡ Guardado selectedCourseId:", id);

    window.nav.goTo("JoinCourse");
  });

  loadCourses();
});
