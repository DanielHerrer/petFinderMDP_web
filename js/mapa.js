document.addEventListener("DOMContentLoaded", async () => {

    // Setear el valor de cargando..
    let cargando = false;

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

        mostrarSpinner(); // Mostrar spinner de "Cargando" desde el principio

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
            // publicaciones = await publicacionesRes.json(); // array de objetos

            //console.log("Publicaciones:", publicaciones);

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

    function mostrarSpinner() {
        document.getElementById("spinner").style.display = "flex";
    }

    function ocultarSpinner() {
        document.getElementById("spinner").style.display = "none";
    }

    function bloquearBotones(bloquear) {
        [btnGatos, btnPerros, btnPerdidas, btnEncontradas].forEach(btn => {
            btn.disabled = bloquear;
        });
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

    // nueva funcion
    async function renderizarMapa() {
        if (cargando) return;
        cargando = true;
        bloquearBotones(true);
        mostrarSpinner();

        // Limpiar marcadores anteriores
        marcadores.forEach(m => map.removeLayer(m));
        circulos.forEach(c => map.removeLayer(c));
        marcadores = [];
        circulos = [];

        const token = localStorage.getItem("token");
        const tipoFiltro = filtrosActivos.tipoMascota;
        const estadoFiltro = filtrosActivos.estadoMascota;

        const tipoSeleccionado = Object.entries(tipoFiltro).find(([_, v]) => v)?.[0]; // GATO o PERRO
        const estadoSeleccionado = Object.entries(estadoFiltro).find(([_, v]) => v)?.[0]; // PERDIDA o ENCONTRADA

        let publicacionesFiltradas = [];

        try {
            if (tipoSeleccionado && estadoSeleccionado) {
                // Filtrado combinado (ej: GATO + PERDIDA)
                const res = await fetch (`http://localhost:8080/publicaciones/filtro?tipoMascota=${tipoSeleccionado}&estadoMascota=${estadoSeleccionado}`, {
                    headers: { "Authorization": "Bearer " + token }
                });
                publicacionesFiltradas = res.ok ? await res.json() : [];

            } else if (tipoSeleccionado) {
                // Solo filtro de TIPO MASCOTA (ej: PERRO)
                const res = await fetch(`http://localhost:8080/publicaciones/tipoMascota/${tipoSeleccionado}`, {
                    headers: { "Authorization": "Bearer " + token }
                });
                publicacionesFiltradas = res.ok ? await res.json() : [];

            } else if (estadoSeleccionado) {
                // Solo filtro de ESTADO MASCOTA (ej: ENCONTRADA)
                const res = await fetch(`http://localhost:8080/publicaciones/estadoMascota/${estadoSeleccionado}`, {
                    headers: { "Authorization": "Bearer " + token }
                });
                publicacionesFiltradas = res.ok ? await res.json() : [];

            } else {
                // Sin filtros, traer todas las publicaciones
                const res = await fetch("http://localhost:8080/publicaciones", {
                    headers: { "Authorization": "Bearer " + token }
                });
                publicacionesFiltradas = res.ok ? await res.json() : [];
            }

            for (const p of publicacionesFiltradas) {
                if (p.mascota.estadoMascota === "REENCONTRADA" || p.mascota.esActivo === false) continue;

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
                marker.bindPopup(`<strong>${p.mascota.nombre || "Sin nombre"}</strong><br>${p.ubicacion.direccion} ${p.ubicacion.altura}<br>${p.mascota.tipoMascota}<br><em>Estado: ${p.mascota.estadoMascota}</em>`);
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

        } catch (error) {
            console.error("Error al renderizar el mapa:", error);
        } finally {
            ocultarSpinner();
            cargando = false;
            bloquearBotones(false);
        }
    }


    // vieja funcion
    async function renderizarMapaOld() {
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