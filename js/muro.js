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
        renderizarMuro();
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
        renderizarMuro();
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

            // Llama a la funcion y llena el muro
            renderizarMuro();

        } else {
            console.error("Token inválido o error en la API");
        }

    } catch (error) {
        // Si ocurre un error de red o backend caído
        console.error("Error en mapa.js = ", error);

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

    async function renderizarMuro() {
        if (cargando) return;
        cargando = true;
        bloquearBotones(true);
        mostrarSpinner();

        // Limpiar marcadores anteriores

        // marcadores.forEach(m => map.removeLayer(m));
        // circulos.forEach(c => map.removeLayer(c));
        // marcadores = [];
        // circulos = [];

        const token = localStorage.getItem("token");

        const tipoFiltro = filtrosActivos.tipoMascota;
        const estadoFiltro = filtrosActivos.estadoMascota;
        const tipoSeleccionado = Object.entries(tipoFiltro).find(([_, v]) => v)?.[0]; // GATO o PERRO
        const estadoSeleccionado = Object.entries(estadoFiltro).find(([_, v]) => v)?.[0]; // PERDIDA o ENCONTRADA

        let publicacionesFiltradas = [];

        try {
            if (tipoSeleccionado && estadoSeleccionado) {
                // Filtrado combinado (ej: GATO + PERDIDA)
                const res = await fetch(`http://localhost:8080/publicaciones/filtro?tipoMascota=${tipoSeleccionado}&estadoMascota=${estadoSeleccionado}`, {
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

            const contenedor = document.getElementById("contenedor-publicaciones");
            contenedor.innerHTML = ""; // Limpiar publicaciones previas

            for (const p of publicacionesFiltradas) {
                if (p.mascota.estadoMascota === "REENCONTRADA" || p.mascota.esActivo === false) continue;

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
        } finally {
            ocultarSpinner();
            cargando = false;
            bloquearBotones(false);
        }
    }

});