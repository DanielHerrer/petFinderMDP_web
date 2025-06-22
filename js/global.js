document.addEventListener("DOMContentLoaded", async () => {

    const token = localStorage.getItem("token");
    const loggedInItems = document.querySelectorAll(".logged-in-only");
    const logoutBtn = document.getElementById("logoutBtn");

    // Evento para el botón logout
    logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("token"); // Borrar token
        window.location.href = "../index.html"; // Redirigir a login/index
    });

    if (!token) {
        // Si NO hay token y NO estamos en index, login, registro → redirigir
        if (!token &&
            !window.location.pathname.endsWith("index.html") &&
            !window.location.pathname.endsWith("registro.html") &&
            !window.location.pathname.endsWith("login.html")) {

            window.location.href = "../index.html";
        }

    } else if (token) {
        // Si hay token entonces..

        // Realiza una peticion a la API para corroborar si esta logueado
        // Concatena el valor Bearer token almacenado en localStorage
        try {
            const response = await fetch("http://localhost:8080/publicaciones", {
                method: "GET",
                headers: {
                    "Authorization": "Bearer " + token
                }
            });

            if (response.ok) {
                // Si el token es válido

                // Si intenta a ir a INDEX que lo redirija a HOME
                if (window.location.pathname.endsWith("index.html")) {

                    window.location.href = "../html/home.html";
                }

                // Mostrar items del nav
                loggedInItems.forEach(el => el.style.display = "block");
                document.getElementById("menu-login").parentElement.style.display = "none";

            } else {
                // Token inválido o expirado → redirigir al index

                console.log("Token inválido o error:", response.status);
                localStorage.removeItem("token"); // Limpiarlo

                // Si NO estamos en index, login, registro → redirigir
                if (!window.location.pathname.endsWith("index.html") &&
                    !window.location.pathname.endsWith("registro.html") &&
                    !window.location.pathname.endsWith("login.html")) {

                    window.location.href = "../index.html";
                }
            }

        } catch (error) {
            // Token inválido → redirigir
            // Si ocurre un error de red o backend caído

            console.error("Error al verificar token:", error);
            localStorage.removeItem("token"); // Limpiarlo

            // Si NO estamos en index, login, registro → redirigir
            if (!window.location.pathname.endsWith("index.html") &&
                !window.location.pathname.endsWith("registro.html") &&
                !window.location.pathname.endsWith("login.html")) {

                window.location.href = "../index.html";
            }
        }
    }

});