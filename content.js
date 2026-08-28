// =========================================================================
// FUNCIÓN 1: EXTRACCIÓN DE COORDENADAS Y URL (CLIC Y DOBLE CLIC)
// =========================================================================
let contadorClicsDerechos = 0;
let temporizadorClics = null;

// Escuchar a nivel global (window)
window.addEventListener('mousedown', function(event) {
    if (event.button === 2) { // 2 = Clic derecho
        contadorClicsDerechos++;
        const elementoClickeado = event.target;

        if (contadorClicsDerechos === 1) {
            // Iniciar el temporizador de 800ms
            temporizadorClics = setTimeout(() => {
                extraerYCopiarCoordenadas(elementoClickeado, 'coordenadas');
                contadorClicsDerechos = 0; 
            }, 800); 
        } else if (contadorClicsDerechos === 2) {
            // Doble clic detectado
            clearTimeout(temporizadorClics); 
            extraerYCopiarCoordenadas(elementoClickeado, 'url');
            contadorClicsDerechos = 0; 
        }
    }
}, true);

function extraerYCopiarCoordenadas(elementoClickeado, formato) {
    let lat = null;
    let lng = null;
    let textoAAnalizar = "";

    const globoLeaflet = document.querySelector('.leaflet-popup-content');
    if (globoLeaflet) {
        textoAAnalizar = globoLeaflet.textContent;
    } else if (elementoClickeado && elementoClickeado.textContent) {
        textoAAnalizar = elementoClickeado.textContent;
    }

    if (textoAAnalizar) {
        const matchTexto = textoAAnalizar.match(/(-?\d+\.\d+),\s*(-?\d+\.\d+)/);
        if (matchTexto) {
            lat = matchTexto[1];
            lng = matchTexto[2];
        }
    }

    if (!lat || !lng) {
        const urlMatches = window.location.href.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
        const mapLink = document.querySelector('a[href*="maps.google.com/maps"]');
        const linkMatches = mapLink ? mapLink.href.match(/ll=(-?\d+\.\d+),(-?\d+\.\d+)/) : null;

        if (linkMatches) {
            lat = linkMatches[1];
            lng = linkMatches[2];
        } else if (urlMatches) {
            lat = urlMatches[1];
            lng = urlMatches[2];
        }
    }

    if (lat && lng) {
        let textoFinal = "";
        let mensajeToast = "";
        
        if (formato === 'url') {
            textoFinal = `https://www.google.com/maps?q=${lat},${lng}`;
            mensajeToast = "URL de ubicación copiada"; 
        } else {
            textoFinal = `${lat},${lng}`;
            mensajeToast = `Copiado: ${textoFinal}`;
        }
        
        forzarCopiado(textoFinal, mensajeToast);
    }
}

function forzarCopiado(texto, mensaje) {
    const textareaTemporal = document.createElement('textarea');
    textareaTemporal.value = texto;
    textareaTemporal.style.position = 'fixed';
    textareaTemporal.style.top = '-9999px';
    textareaTemporal.style.left = '-9999px';
    textareaTemporal.style.opacity = '0';
    
    document.body.appendChild(textareaTemporal);
    textareaTemporal.focus();
    textareaTemporal.select();
    
    try {
        document.execCommand('copy');
        mostrarNotificacion(mensaje);
    } catch (err) {
        console.error("Error al forzar el copiado: ", err);
    } finally {
        document.body.removeChild(textareaTemporal);
    }
}

function mostrarNotificacion(texto) {
    const idNotificacion = 'gps-plugin-notificacion';
    let divExistente = document.getElementById(idNotificacion);
    if (divExistente) divExistente.remove();

    let div = document.createElement('div');
    div.id = idNotificacion;
    div.innerText = texto;
    div.style.position = 'fixed';
    div.style.bottom = '20px';
    div.style.right = '20px';
    div.style.backgroundColor = '#2196F3';
    div.style.color = 'white';
    div.style.padding = '12px 20px';
    div.style.borderRadius = '8px';
    div.style.zIndex = '2147483647';
    div.style.fontFamily = 'system-ui, sans-serif';
    div.style.fontWeight = 'bold';
    div.style.boxShadow = '0 4px 6px rgba(0,0,0,0.3)';
    
    if (texto.length > 50) {
        div.style.maxWidth = '400px';
        div.style.whiteSpace = 'nowrap';
        div.style.overflow = 'hidden';
        div.style.textOverflow = 'ellipsis';
    }
    
    document.body.appendChild(div);
    
    setTimeout(() => {
        if (document.getElementById(idNotificacion)) {
            div.remove();
        }
    }, 3000);
}

// =========================================================================
// FUNCIÓN 2: ELIMINACIÓN AUTOMÁTICA DEL BANNER DE CREDENCIALES
// =========================================================================
function eliminarBannerCredenciales() {
    const banner = document.getElementById('missingCredential');
    if (banner) {
        banner.remove();
        console.log("Plugin GPS: Elemento 'missingCredential' eliminado.");
    }
}

// Ejecutar inmediatamente por si el elemento carga estáticamente
eliminarBannerCredenciales();

// Crear un observador para detectar si la plataforma lo inyecta dinámicamente
const observadorDOM = new MutationObserver(() => {
    eliminarBannerCredenciales();
});

// Iniciar la observación del DOM cuando el body esté disponible
const iniciarObservador = setInterval(() => {
    if (document.body) {
        observadorDOM.observe(document.body, { childList: true, subtree: true });
        clearInterval(iniciarObservador);
    }
}, 100);
