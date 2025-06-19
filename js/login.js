document.addEventListener("DOMContentLoaded", () => {
    // Recibe el formulario de Login
    const form = document.getElementById('form-login');

    // Espera el evento de "SUBMIT" del boton del Formulario de Iniciar Sesion
    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const email = document.getElementById('email').value;
        const contrasenia = document.getElementById('contrasenia').value;

        // Crea un JSON con la informacion
        const data = {
            email,
            contrasenia
        };

        // Intenta realizar la peticion a la API
        try {
            const response = await fetch("http://localhost:8080/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                // Si la consulta es correcta, guarda el body que retorno
                const data = await response.json();

                // Se guarda el token del body en el localStorage
                // GUARDAR EL TOKEN EN LOCAL STORAGE NO ES SEGURO (pero es la opcion mas rapida)
                localStorage.setItem("token", data.token);

                alert("¡Inicio de sesión exitoso!");

                // Lo redirige a la ubicacion de la ventana Home
                window.location.href = "../html/home.html";
            } else {
                // Si la consulta es erronea, guarda el body de error
                const error = await response.json();
                alert("Error: " + error.message || "No se pudo iniciar sesión");
            }
        } catch (err) {
            alert("Error de red o del servidor");
            console.error(err);
        }
    });
});
