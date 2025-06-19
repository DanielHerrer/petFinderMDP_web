document.addEventListener("DOMContentLoaded", async () => {

    // Recibe el mapa y lo configura
    const map = L.map('map').setView([-38.0055, -57.5426], 13); // Mar del Plata

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
    }).addTo(map);

    // Realiza una peticion a la API para corroborar si esta logueado
    // Concatena el valor Bearer token almacenado en localStorage
    try {
        const token = localStorage.getItem("token");

        const publicacionesRes = await fetch("http://localhost:8080/publicaciones", {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        const mascotasRes = await fetch("http://localhost:8080/mascotas", {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        if (publicacionesRes.ok && mascotasRes.ok) {
            const publicaciones = await publicacionesRes.json(); // array de objetos
            const mascotas = await mascotasRes.json(); // array de objetos

            // console.log("Publicaciones:", publicaciones);
            // console.log("Mascotas:", mascotas);

            agregarMascotasAlMapa(publicaciones, mascotas);

        } else {
            console.error("Token inválido o error en la API");
        }



    } catch (error) {

        // Token inválido
        // Si ocurre un error de red o backend caído
        console.error("Error en mapa.js = ", error);

    }

    function geocodeDireccion(direccion) {
        const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(direccion)}`;
        return fetch(url, {
            headers: {
                'Accept': 'application/json'
            }
        })
            .then(res => res.json())
            .then(data => {
                if (data && data.length > 0) {
                    return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
                } else {
                    return null;
                }
            })
            .catch(() => null);
    }

    async function agregarMascotasAlMapa(publicaciones, mascotas) {
        for (const mascota of mascotas) {
            if (mascota.estadoMascota === "REENCONTRADA") {
                // No mostrar ni marcador ni círculo
                continue;
            }

            // Busca la Publicacion que esta relacionada al ID de la Mascota
            const publicacion = publicaciones.find(p => p.mascotaId === mascota.id);

            // Extrae la UbicacionDetailDTO de la Publicacion
            const u = publicacion.ubicacion;
            // Arma una cadena (ej: "Rivadavia 3470")
            const direccion = u.direccion + " " + u.altura;
            // Consigue las Coordenadas de la Direccion
            // (ej: "Rivadavia 3470, Mar del Plata, Buenos Aires, Argentina")
            const coords = await geocodeDireccion(direccion + ", Mar del Plata, Buenos Aires, Argentina");

            if (!coords) {
                console.warn(`No se pudo geocodificar la dirección: ${direccion}`);
                continue;
            }

            const icon = L.divIcon({
                className: 'circular-icon',
                html: `<div class='circle-image' style="background-image: url('${mascota.fotoUrl}')"></div>`,
                iconSize: [60, 60],
                iconAnchor: [29, 29] // 30, 30 
            });

            const marker = L.marker(coords, { icon }).addTo(map);

            // Si existe un nombre, se muestra el nombre, SINO, se muestra "Sin nombre"
            marker.bindPopup(`<strong>
                ${mascota.nombre && mascota.nombre.trim() !== "" ? mascota.nombre : "Sin nombre"}</strong>
                <br>${direccion}<br>
                <em>Estado: ${mascota.estadoMascota}</em>`);

            // Abrir popup en hover
            marker.on('mouseover', () => marker.openPopup());
            marker.on('mouseout', () => marker.closePopup());

            let colorCirculo = 'red'; // PERDIDA por defecto
            if (mascota.estadoMascota === "ENCONTRADA") colorCirculo = 'blue'; // si es ENCONTRADA

            L.circle(coords, {
                color: colorCirculo,
                fillColor: colorCirculo,
                fillOpacity: 0.2,
                radius: 700,
                weight: 1
            }).addTo(map);
        }
    }

});