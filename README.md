# Extensión de Chrome: Extractor de Coordenadas GPS

Este es un plugin ligero para Google Chrome (Manifest V3) diseñado para extraer y copiar automáticamente las coordenadas GPS (latitud y longitud) o crear enlaces directos de Google Maps al portapapeles. Funciona al interactuar sobre mapas o globos de información en plataformas de rastreo vehicular (como Command Omnitracs).

## Características Principales

* **Extracción Inteligente:** Identifica contenedores de mapas como Leaflet (`.leaflet-popup-content`), el globo de la versión anterior de Omnitracs (`div id="infowindow_XXXXX"`) o Google Maps y extrae las coordenadas contenidas en el texto visible.
* **Pegado con atajo:** En cualquier página pega el portapapeles (por ejemplo, la coordenada copiada) en un cuadro de texto. Por defecto se presiona `AltGr` 2 veces rápido; las combinaciones como `AltGr+Q` (@) siguen funcionando normalmente. Pega igual que `Ctrl+V`, así la página lo maneja a su manera (por ejemplo, Google Sheets lo pone en la celda); si la página no deja pegar, el texto se escribe de todas formas. Funciona también en editores dentro de recuadros (iframes) y en componentes con Shadow DOM. No funciona en la barra de direcciones ni en las páginas internas de Chrome (`chrome://`, Nueva pestaña, Chrome Web Store): Chrome no permite que una extensión escriba ahí; usa `Ctrl+V`.
* **Ctrl+V en páginas que no dejan pegar:** Si una página bloquea el pegado en un cuadro de texto (con `Ctrl+V`, `Shift+Insert` o *Pegar* del menú del clic derecho), la extensión escribe el texto de todas formas. Siempre está activo y funciona en cualquier cuadro de texto: simples, editores de texto enriquecido, dentro de recuadros (iframes) o de componentes con Shadow DOM. Primero deja que la página pegue a su manera (por ejemplo, repartir un código en varios cuadros) y solo interviene si el pegado no cambió nada. No interviene en los cuadros invisibles que usan los editores de código, que pegan por su cuenta; ahí se usa el atajo.
* **Configuración:** Al hacer clic en el ícono de la extensión se elige:
  * **Pegar con:** una tecla (botón *Cambiar tecla* y presionar la deseada) o el botón central del mouse (rueda), que pega en el cuadro de texto donde se hace clic.
  * **Presionar 2 veces rápido para pegar:** si está desmarcado, basta una pulsación.* **Oculta el aviso de Bing Maps:** En Omnitracs elimina la barra "The specified credentials are invalid..." que aparece a mitad del mapa.
* **Sitios compatibles:** Omnitracs (`*.omnitracs.com`), Traffilog (`mx.traffilog.com`) y Google Maps (`google.com/maps`, `google.com.mx/maps`).
* **Acción Dinámica (Clic Inteligente):**
  * **Un solo clic derecho:** Copia las coordenadas en texto plano (ej. `19.9001378,-98.7812452`).
  * **Doble clic derecho rápido:** Genera y copia automáticamente un enlace directo a Google Maps.
* **Notificaciones Visuales (Toast):** Muestra una alerta temporal confirmando la acción (`Copiado: lat, lng` o `URL de ubicación copiada`).
* **Bypass de Restricciones:** Utiliza métodos de copiado avanzados para funcionar de manera fluida incluso bajo las estrictas políticas de seguridad del navegador o bloqueos de la página.
* **Sin Dependencias:** Desarrollado íntegramente en Vanilla JavaScript, garantizando un consumo mínimo de recursos y máxima privacidad operativa.

## Estructura del Proyecto

```text
GPS-Coordinates-Extractor/
├── manifest.json   # Configuración de permisos y reglas (Manifest V3)
├── content.js      # Copiado de coordenadas (Omnitracs, Traffilog y Google Maps)
├── pegar.js        # Pegado con tecla o rueda del mouse y desbloqueo de Ctrl+V (todas las páginas)
├── configuracion.js  # Configuración predeterminada del pegado
├── opciones.html   # Ventana de configuración (ícono de la extensión)
├── opciones.js     # Lógica de la ventana de configuración
├── segundo-plano.js  # Lee el portapapeles aparte cuando la página no deja (ej. Google Docs)
├── portapapeles.html # Documento oculto donde se lee el portapapeles
├── portapapeles.js   # Lógica del documento oculto
└── ocultar-aviso-bing.css  # Oculta la barra de credenciales de Bing Maps
