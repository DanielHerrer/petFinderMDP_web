document.addEventListener("DOMContentLoaded", () => {

    // Imagen vista previa URL
    const fotoUrlInput = document.getElementById('fotoUrl');
    const imagenPreview = document.getElementById('imagenPreview');

    fotoUrlInput.addEventListener('input', () => {
        const url = fotoUrlInput.value.trim();
        if (url && url.startsWith('http')) {
            imagenPreview.src = url;
            imagenPreview.style.display = 'block';
        } else {
            imagenPreview.src = '';
            imagenPreview.style.display = 'none';
        }
    });

    // Recibe el formulario de Publicacion
    const form = document.getElementById('form-publicacion');

    // Espera el evento de "SUBMIT" del boton del Formulario de Nueva Publicación
    form.addEventListener("submit", async (event) => {
        event.preventDefault(); // evita el envío tradicional con el "action"

        const nombre = document.getElementById('nombre').value;
        const estadoMascota = document.getElementById('estadoMascota').value;
        const tipoMascota = document.getElementById('tipoMascota').value;
        const fotoUrl = document.getElementById('fotoUrl').value;
        const descripcion = document.getElementById('descripcion').value;
        const direccion = document.getElementById('direccion').value;
        const altura = document.getElementById('altura').value;

        // Intenta realizar la peticion a la API
        try {
            
            // Concatena el valor Bearer token almacenado en localStorage
            const token = localStorage.getItem("token");

            // Crea un JSON con la informacion
            const mascotaRequestDto = {
                nombre,
                estadoMascota,
                tipoMascota,
                fotoUrl
            };

            console.log(mascotaRequestDto);

            const responseMascota = await fetch("http://localhost:8080/mascotas", {
                method: "POST",
                headers: {
                    "Authorization": "Bearer " + token,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(mascotaRequestDto)
            });

            if (responseMascota.ok) {

                // Si la consulta es correcta, guarda el body que retorno
                const dataMascota = await responseMascota.json();

                const publicacionRequestDto = {
                    descripcion,
                    mascotaId : dataMascota.id,
                    ubicacion: {
                        direccion: direccion,
                        altura: altura,
                        ciudad: 'Mar del Plata',
                        region: 'Buenos Aires',
                        pais: 'Argentina'
                    }
                };

                console.log(publicacionRequestDto);

                const responsePublicacion = await fetch("http://localhost:8080/publicaciones", {
                    method: "POST",
                    headers: {
                        "Authorization": "Bearer " + token,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(publicacionRequestDto)
                });

                if (responsePublicacion.ok) {

                    // Si la consulta es correcta, guarda el body que retorno
                    const dataPublicacion = await responsePublicacion.json();

                    console.log(dataPublicacion);

                    alert("¡Mascota publicada correctamente!");

                    // MASCOTA PUBLICADA CORRECTAMENTE - recarga la pagina
                    window.location.reload();

                } else {
                const errorData = await response.json();
                if (errorData && errorData.error) {
                    alert("Error: " + errorData.error);
                } else {
                    alert("Ocurrió un error inesperado.");
                }
                return;
            }

            } else {
                const errorData = await response.json();
                if (errorData && errorData.error) {
                    alert("Error: " + errorData.error);
                } else {
                    alert("Ocurrió un error inesperado.");
                }
                return;
            }

        } catch (error) {
            alert("Error de red: " + error.message);
        }
    });

});