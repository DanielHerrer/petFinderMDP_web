document.addEventListener("DOMContentLoaded", () => {
    // Recibe el formulario de Registro
    const form = document.getElementById('form-registro');

    // Espera el evento de "SUBMIT" del boton del Formulario de Registrar Usuario
    form.addEventListener("submit", async (event) => {
        e.preventDefault(); // evita el envío tradicional con el "action"

        const nombre = document.getElementById('nombre').value;
        const apellido = document.getElementById('apellido').value;
        const email = document.getElementById('email').value;

        const contrasenia = document.getElementById('contrasenia').value;
        const confirmarContrasenia = document.getElementById('confirmar-contrasenia').value;

        // Valida que el usuario haya ingresado bien su nueva contrasenia
        if (contrasenia !== confirmarContrasenia) {
            alert("Las contraseñas no coinciden.");
            return;
        }

        // Crea un JSON con la informacion
        const data = {
            nombre,
            apellido,
            email,
            contrasenia
        };

        // Intenta realizar la peticion a la API
        try {
            const response = await fetch("http://localhost:8080/auth/registro", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                alert("¡Registro exitoso!");
                // Lo redirige a la ubicacion de la ventana Login
                window.location.href = "../html/login.html";
            } else {
                const errorData = await response.json();
                alert("Error: " + errorData.message);
            }

        } catch (error) {
            alert("Error de red: " + error.message);
        }
    });
});
