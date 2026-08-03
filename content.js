// Escuchar el clic derecho y pasar el elemento clickeado a la función
document.addEventListener('mousedown', function(event) {
    if (event.button === 2) { // 2 = Clic derecho
        extraerYCopiarCoordenadas(event.target);
    }
}, true);

function extraerYCopiarCoordenadas(elementoClickeado) {
    let lat = null;
    let lng = null;
    let textoAAnalizar = "";

    // Estrategia 1: Buscar directamente el globo de información de Leaflet/Omnitracs
    const globoLeaflet = document.querySelector('.leaflet-popup-content');
    
    if (globoLeaflet) {
        // Si el globo está abierto, leemos todo su contenido
        textoAAnalizar = globoLeaflet.textContent;
    } else if (elementoClickeado && elementoClickeado.textContent) {
        // Estrategia 2: Respaldo para leer el texto del elemento clickeado directamente
        textoAAnalizar = elementoClickeado.textContent;
    }

    // Aplicar la expresión regular para extraer los números de latitud y longitud
    if (textoAAnalizar) {
        const matchTexto = textoAAnalizar.match(/(-?\d+\.\d+),\s*(-?\d+\.\d+)/);
        if (matchTexto) {
            lat = matchTexto[1];
            lng = matchTexto[2];
        }
    }

    // Estrategia 3: Si no encontró nada en los textos, usar respaldos de URL y Google Maps
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

    // Si finalmente se obtuvieron coordenadas por cualquier método, copiarlas
    if (lat && lng) {
        const coords = `${lat},${lng}`;
        
        // Copiar al portapapeles
        navigator.clipboard.writeText(coords).then(() => {
            mostrarNotificacion(`Copiado: ${coords}`);
        }).catch(err => {
            console.error("Error al copiar al portapapeles: ", err);
        });
    }
}

// Interfaz visual rápida para confirmar que se copió
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
    div.style.zIndex = '2147483647'; // Máximo z-index posible
    div.style.fontFamily = 'system-ui, sans-serif';
    div.style.fontWeight = 'bold';
    div.style.boxShadow = '0 4px 6px rgba(0,0,0,0.3)';
    
    document.body.appendChild(div);
    
    // Desaparecer después de 3 segundos
    setTimeout(() => {
        if (document.getElementById(idNotificacion)) {
            div.remove();
        }
    }, 3000);
}