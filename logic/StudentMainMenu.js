document.addEventListener("DOMContentLoaded", () => {

    
    document.getElementById("btnBuscarCursos")?.addEventListener("click", () => {
        window.nav.goTo("SearchCoursesView.html");
    });

    
    document.getElementById("btnMisCursos")?.addEventListener("click", () => {
        window.nav.goTo("displayStudentCourses.html");
    });

    
    document.getElementById("btnPerfil")?.addEventListener("click", () => {
        window.nav.goTo("Profile.html");
    });

    
    document.getElementById("logoutBtn")?.addEventListener("click", () => {
        window.api.clearSession();
        window.nav.goTo("Login.html");
    });
});
