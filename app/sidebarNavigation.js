console.log("sidebarNavigation LOADED");
   
    
    document.getElementById("navMisCursos")?.addEventListener("click", () => {
        window.nav.goTo("displayStudentCourses");
    });

    
    document.getElementById("navVerCursos")?.addEventListener("click", () => {
        window.nav.goTo("WatchCourse");
    });

    
    document.getElementById("navChat")?.addEventListener("click", () => {
        window.nav.goTo("UnderConstruction");
    });

    
    document.getElementById("navPerfil")?.addEventListener("click", () => {
        window.nav.goTo("Profile");
    });

    
    document.getElementById("navLogout")?.addEventListener("click", () => {
        
        window.api.clearSession();
       
        window.nav.goTo("login");
    });
