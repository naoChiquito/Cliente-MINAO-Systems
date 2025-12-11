console.log("🔥 sidebarNavigation LOADED");
    /* ============================
       6. Navegación desde Sidebar
    ============================ */
    // Mis Cursos (estudiante)
    document.getElementById("navMisCursos")?.addEventListener("click", () => {
        window.nav.goTo("displayStudentCourses");
    });

    // Ver Cursos del estudiante
    document.getElementById("navVerCursos")?.addEventListener("click", () => {
        window.nav.goTo("WatchCourse");
    });

    // Chat
    document.getElementById("navChat")?.addEventListener("click", () => {
        window.nav.goTo("ChatView");
    });

    // Perfil
    document.getElementById("navPerfil")?.addEventListener("click", () => {
        window.nav.goTo("Profile");
    });

    // Logout
    document.getElementById("navLogout")?.addEventListener("click", () => {
        
        window.api.clearSession();
       
        window.nav.goTo("login");
    });
