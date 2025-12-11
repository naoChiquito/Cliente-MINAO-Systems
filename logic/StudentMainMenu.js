document.addEventListener("DOMContentLoaded", () => {

    // Buscar cursos → SearchCoursesView.html
    document.getElementById("btnBuscarCursos")?.addEventListener("click", () => {
        window.nav.goTo("SearchCoursesView.html");
    });

    // Mis cursos → displayStudentCourses.html
    document.getElementById("btnMisCursos")?.addEventListener("click", () => {
        window.nav.goTo("displayStudentCourses.html");
    });

    // Perfil
    document.getElementById("btnPerfil")?.addEventListener("click", () => {
        window.nav.goTo("Profile.html");
    });

    // Cerrar sesión
    document.getElementById("logoutBtn")?.addEventListener("click", () => {
        window.api.clearSession();
        window.nav.goTo("Login.html");
    });
});
