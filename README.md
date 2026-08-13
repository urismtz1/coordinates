# Extensión de Chrome: Extractor de Coordenadas GPS

Este es un plugin ligero para Google Chrome (Manifest V3) diseñado para extraer y copiar automáticamente las coordenadas GPS (latitud y longitud) o crear enlaces directos de Google Maps al portapapeles. Funciona al interactuar sobre mapas o globos de información en plataformas de rastreo vehicular (como Command Omnitracs).

## Características Principales

* **Extracción Inteligente:** Identifica contenedores de mapas como Leaflet (`.leaflet-popup-content`) o Google Maps y extrae las coordenadas contenidas en el texto visible.
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
└── content.js      # Script de contenido inyectado en las páginas web
