# GPS Coordinates Extractor Extension

Este es un plugin ligero para Google Chrome (Manifest V3) diseñado para extraer y copiar automáticamente las coordenadas GPS (latitud y longitud) al portapapeles. Funciona al hacer clic derecho sobre mapas o globos de información en plataformas de rastreo vehicular como Command Omnitracs, entre otras.

## Características

* **Extracción Inteligente:** Identifica contenedores de mapas como Leaflet (`.leaflet-popup-content`) o Google Maps y extrae las coordenadas contenidas en el texto visible.
* **Acción Silenciosa:** Intercepta el evento `mousedown` (clic derecho) para capturar las coordenadas de forma rápida y sin interrumpir el flujo de trabajo del usuario.
* **Notificaciones Visuales (Toast):** Muestra una alerta temporal en la pantalla (`Copiado: lat, lng`) confirmando que la extracción fue exitosa.
* **Uso de la API del Portapapeles:** Implementa `navigator.clipboard.writeText` para garantizar copias limpias y confiables en el sistema operativo.
* **Sin Dependencias:** Desarrollado íntegramente en Vanilla JavaScript, lo que garantiza un consumo mínimo de recursos y una auditoría de código sencilla.

## Estructura del Proyecto

```text
GPS-Coordinates-Extractor/
├── manifest.json   # Configuración de permisos, versión y reglas (Manifest V3)
└── content.js      # Script de contenido inyectado en las páginas web
