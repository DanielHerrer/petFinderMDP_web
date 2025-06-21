document.addEventListener("DOMContentLoaded", async () => {

    // Setea los FILTROS con un valor de entrada
    const filtrosActivos = {
        tipoMascota: {
            GATO: false,
            PERRO: false
        },
        estadoMascota: {
            PERDIDA: false,
            ENCONTRADA: false
        }
    };

    // Setea arrays vacios que sirven para ser reutilizados dentro del codigo
    let publicaciones = [];
    let marcadores = [];
    let circulos = [];

    // Recibe el mapa y lo configura
    const map = L.map('map').setView([-38.0055, -57.5426], 13); // Mar del Plata
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
    }).addTo(map);

    // Recibe los botones
    const btnGatos = document.getElementById("filtroGatos");
    const btnPerros = document.getElementById("filtroPerros");
    const btnPerdidas = document.getElementById("filtroPerdidas");
    const btnEncontradas = document.getElementById("filtroEncontradas");

    function alternarTipo(seleccion) {
        const filtros = filtrosActivos.tipoMascota;

        // Si ya estaba activado, lo desactiva
        if (filtros[seleccion]) {
            filtros.GATO = false;
            filtros.PERRO = false;
        } else {
            filtros.GATO = seleccion === "GATO";
            filtros.PERRO = seleccion === "PERRO";
        }

        actualizarEstiloBoton(btnGatos, filtros.GATO);
        actualizarEstiloBoton(btnPerros, filtros.PERRO);
        renderizarMapa();
    }

    function alternarEstado(seleccion) {
        const filtros = filtrosActivos.estadoMascota;

        if (filtros[seleccion]) {
            filtros.PERDIDA = false;
            filtros.ENCONTRADA = false;
        } else {
            filtros.PERDIDA = seleccion === "PERDIDA";
            filtros.ENCONTRADA = seleccion === "ENCONTRADA";
        }

        actualizarEstiloBoton(btnPerdidas, filtros.PERDIDA);
        actualizarEstiloBoton(btnEncontradas, filtros.ENCONTRADA);
        renderizarMapa();
    }


    // Espera los eventos de click para ALTERNAR entre el filtro de GATO
    btnGatos.addEventListener("click", () => {
        alternarTipo("GATO");
    });
    // Espera los eventos de click para ALTERNAR entre el filtro de PERRO
    btnPerros.addEventListener("click", () => {
        alternarTipo("PERRO");
    });
    // Espera los eventos de click para ALTERNAR entre el filtro de PERDIDA
    btnPerdidas.addEventListener("click", () => {
        alternarEstado("PERDIDA");
    });
    // Espera los eventos de click para ALTERNAR entre el filtro de ENCONTRADA
    btnEncontradas.addEventListener("click", () => {
        alternarEstado("ENCONTRADA");
    });


    try {
        // Realiza una peticion a la API para corroborar si esta logueado
        // Concatena el valor Bearer token almacenado en localStorage
        const token = localStorage.getItem("token");

        // Recibe el resultado de las Publicaciones
        const publicacionesRes = await fetch("http://localhost:8080/publicaciones", {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        // Si la consulta es exitosa (HTTP 200 - 299)
        if (publicacionesRes.ok) {
            // Extrae el array de Publicaciones de la consulta
            publicaciones = await publicacionesRes.json(); // array de objetos

            console.log("Publicaciones:", publicaciones);

            // Llama a la funcion y dibuja las mascotas en el mapa
            renderizarMapa();

        } else {
            console.error("Token inválido o error en la API");
        }

    } catch (error) {
        // Si ocurre un error de red o backend caído
        console.error("Error en mapa.js = ", error);

    }

    // Funcion que retorna las coordenadas segun la direccion recibida
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

    // Funcion que recibe una lista de publicaciones y una lista de mascotas, y lo agrega al mapa visualmente
    async function agregarMascotasAlMapa(publicaciones) {

        for (const p of publicaciones) {

            // Si ya fue reencontrada o es inactiva entonces no se muestra
            if (p.mascota.estadoMascota === "REENCONTRADA" || p.mascota.esActivo === false) {
                // No mostrar ni marcador ni círculo
                continue;
            }

            // Arma una cadena (ej: "Rivadavia 3470")
            const calle = p.ubicacion.direccion + " " + p.ubicacion.altura;
            // Consigue las Coordenadas de la Direccion
            // (ej: "Rivadavia 3470, Mar del Plata, Buenos Aires, Argentina")
            const coords = await geocodeDireccion(calle + ", Mar del Plata, Buenos Aires, Argentina");

            // Si la ubicacion es invalida
            if (!coords) {
                console.warn(`No se pudo geocodificar la ubicación: ${calle}`);
                continue;
            }

            // Si la ubicacion es exitosa, procede a dibujar el punto en el mapa
            const icon = L.divIcon({
                className: 'circular-icon',
                html: `<div class='circle-image' style="background-image: url('${p.mascota.fotoUrl}')"></div>`,
                iconSize: [60, 60],
                iconAnchor: [30, 30] // 30, 30 
            });
            // Le configura las coordenadas al punto
            const marker = L.marker(coords, { icon }).addTo(map);
            // Si existe un nombre, se muestra el nombre, SINO, se muestra "Sin nombre"
            marker.bindPopup(`<strong>
                ${p.mascota.nombre && p.mascota.nombre.trim() !== "" ? p.mascota.nombre : "Sin nombre"}</strong>
                <br>${calle}<br>
                <em>Estado: ${p.mascota.estadoMascota}</em>`);
            // Abrir un "popup" con un CARTEL de informacion al hacer "hover" sobre el punto
            marker.on('mouseover', () => marker.openPopup());
            marker.on('mouseout', () => marker.closePopup());
            // Le configura ROJO como Mascota PERDIDA por defecto 
            let colorCirculo = 'red';
            // Le configura AZUL si la Mascota es ENCONTRADA
            if (p.mascota.estadoMascota === "ENCONTRADA") colorCirculo = 'blue';

            // Añade el punto al mapa
            L.circle(coords, {
                color: colorCirculo,
                fillColor: colorCirculo,
                fillOpacity: 0.2,
                radius: 700,
                weight: 1
            }).addTo(map);
        }
    }

    function actualizarEstiloBoton(boton, activo) {
        if (activo) {
            boton.classList.remove("inactivo");
            boton.classList.add("activo");
        } else {
            boton.classList.remove("activo");
            boton.classList.add("inactivo");
        }
    }

    async function renderizarMapa() {
        // Eliminar marcadores y círculos anteriores
        marcadores.forEach(m => map.removeLayer(m));
        circulos.forEach(c => map.removeLayer(c));
        marcadores = [];
        circulos = [];

        for (const p of publicaciones) {
            // Si ya fue reencontrada o es inactiva, saltearla
            if (p.mascota.estadoMascota === "REENCONTRADA" || p.mascota.esActivo === false) continue;

            // Recibe los valores activos en los FILTROS
            const tipoFiltro = filtrosActivos.tipoMascota;
            const estadoFiltro = filtrosActivos.estadoMascota;
            const tipoActiva = Object.values(tipoFiltro).some(v => v);
            const estadoActiva = Object.values(estadoFiltro).some(v => v);

            // Si hay filtros activos, pero la mascota no los cumple, saltearla
            if (tipoActiva && !tipoFiltro[p.mascota.tipoMascota]) continue;
            if (estadoActiva && !estadoFiltro[p.mascota.estadoMascota]) continue;

            const calle = `${p.ubicacion.direccion} ${p.ubicacion.altura}, Mar del Plata, Buenos Aires, Argentina`;
            const coords = await geocodeDireccion(calle);
            if (!coords) continue;

            const icon = L.divIcon({
                className: 'circular-icon',
                html: `<div class='circle-image' style="background-image: url('${p.mascota.fotoUrl}')"></div>`,
                iconSize: [60, 60],
                iconAnchor: [30, 30]
            });

            const marker = L.marker(coords, { icon }).addTo(map);
            marker.bindPopup(`<strong>${p.mascota.nombre || "Sin nombre"}</strong><br>${p.ubicacion.direccion + " " + p.ubicacion.altura}<br>${p.mascota.tipoMascota}<br><em>Estado: ${p.mascota.estadoMascota}</em>`);
            marker.on('mouseover', () => marker.openPopup());
            marker.on('mouseout', () => marker.closePopup());
            marcadores.push(marker);

            let colorCirculo = p.mascota.estadoMascota === "ENCONTRADA" ? "blue" : "red";
            const circle = L.circle(coords, {
                color: colorCirculo,
                fillColor: colorCirculo,
                fillOpacity: 0.2,
                radius: 700,
                weight: 1
            }).addTo(map);

            circulos.push(circle);
        }
    }

});