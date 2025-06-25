document.addEventListener("DOMContentLoaded", async () => {

    try {
        // Realiza una peticion a la API para corroborar si esta logueado
        // Concatena el valor Bearer token almacenado en localStorage
        const token = localStorage.getItem("token");

        // Recibe el resultado de las Publicaciones
        const publicacionesRes = await fetch("http://localhost:8080/publicaciones/propias", {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        // Si la consulta es exitosa (HTTP 200 - 299)
        if (publicacionesRes.ok) {

            // Llama a la funcion y llena el muro
            renderizarMuro();

        } else {
            console.error("Token inválido o error en la API");
        }

    } catch (error) {
        // Si ocurre un error de red o backend caído
        console.error("Error en mis-publicaciones.js = ", error);
    }

    async function renderizarMuro() {

        const token = localStorage.getItem("token");

        let publicaciones = [];

        try {
            // Sin filtros, traer todas las publicaciones
            const res = await fetch("http://localhost:8080/publicaciones/propias", {
                method: "GET",
                headers: {
                    "Authorization": "Bearer " + token
                }
            });

            publicaciones = res.ok ? await res.json() : [];

            const contenedor = document.getElementById("contenedor-publicaciones");
            contenedor.innerHTML = ""; // Limpiar publicaciones previas

            for (const p of publicaciones) {

                const titulo = `${p.mascota.tipoMascota} (Mascota ${p.mascota.estadoMascota})`;
                const fotoUrl = p.mascota.fotoUrl;
                const nombreMascota = p.mascota.nombre || "Sin nombre";
                const calle = `${p.ubicacion.direccion} ${p.ubicacion.altura}`;
                const descripcion = p.descripcion;
                const autor = p.nombreCompleto;
                const fecha = p.fecha;

                const div = document.createElement("div");
                div.classList.add("publicacion");

                div.innerHTML = `
                    <h4>${titulo}</h4>
                    <img src="${fotoUrl}" alt="Foto de ${nombreMascota}">
                    <div class="info">
                        <strong>${nombreMascota}</strong>
                        <div class="direccion">${calle}</div>
                        <div class="descripcion">${descripcion}</div>
                    </div>
                    <div class="pie">
                        Publicado por <strong>${autor}</strong> el ${fecha}
                    </div>
                `;

                contenedor.appendChild(div);
            }

        } catch (error) {
            console.error("Error al renderizar el muro:", error);
        }
    }

});