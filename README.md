# ClimaVivo

Aplicación web de consulta meteorológica construida con [Lit](https://lit.dev/) y [Vite](https://vite.dev/). Permite buscar ciudades, consultar el clima actual y un pronóstico de cinco días usando la API pública de [Open-Meteo](https://open-meteo.com/).

## Características

- Búsqueda de ciudades mediante geocodificación de Open-Meteo.
- Clima actual: temperatura, sensación térmica, humedad, viento y condición meteorológica.
- Pronóstico diario para los próximos cinco días.
- Cambio entre grados Celsius y Fahrenheit.
- Ciudades favoritas persistidas en `localStorage`.
- Estados de carga, errores de API y ausencia de conexión.
- Interfaz compuesta por Web Components con Shadow DOM.

## Tecnologías

- [Lit 3](https://lit.dev/) para los componentes web reactivos.
- [Vite 8](https://vite.dev/) para el servidor de desarrollo y el empaquetado.
- [Sass](https://sass-lang.com/) para los estilos.
- [Vitest](https://vitest.dev/) y `happy-dom` para las pruebas unitarias.
- [Open-Meteo](https://open-meteo.com/) para geocodificación y datos meteorológicos.

## Requisitos

- Node.js 20 o superior.
- npm 10 o superior.

## Inicio rápido

Instala las dependencias:

```bash
npm install
```

Inicia el servidor de desarrollo:

```bash
npm run dev
```

Vite mostrará en la terminal la URL local para abrir la aplicación, normalmente `http://localhost:5173`.

## Scripts

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Inicia el servidor de desarrollo de Vite. |
| `npm run build` | Genera la versión de producción en `dist/`. |
| `npm run preview` | Sirve localmente la compilación ubicada en `dist/`. |
| `npm test` | Ejecuta las pruebas unitarias una vez con Vitest. |

## Configuración de la API

Los puntos de acceso de Open-Meteo se encuentran en `src/config/environment.js`:

```js
export const environment = Object.freeze({
  production: false,
  geocodingApiUrl: 'https://geocoding-api.open-meteo.com/v1/search',
  forecastApiUrl: 'https://api.open-meteo.com/v1/forecast',
  weatherApiKey: ''
});
```

Open-Meteo puede utilizarse sin clave para el uso público habitual. Si se dispone de una clave compatible, asígnala a `weatherApiKey`; la aplicación la enviará como el parámetro `apikey` en las solicitudes.

También existe `src/config/environment.prod.js` con los valores destinados a producción. Actualmente `src/services/open-meteo.js` importa `environment.js` de forma directa; para que la compilación use la configuración de producción, actualiza esa importación o configura el reemplazo correspondiente en Vite antes de desplegar.

## Arquitectura

```text
src/
├── main.js                         # Punto de entrada de la aplicación
├── main.scss                       # Estilos globales
├── components/
│   ├── weather-dashboard.js        # Estado global y coordinación de la interfaz
│   ├── city-search/                # Búsqueda de ciudades
│   ├── current-weather/            # Clima actual y acción de favoritos
│   ├── forecast-strip/             # Pronóstico de cinco días
│   ├── saved-cities/               # Lista de ciudades favoritas
│   └── unit-selector/              # Selector Celsius/Fahrenheit
├── config/                         # Configuración de servicios
└── services/
    ├── open-meteo.js               # Cliente, normalización y manejo de errores
    └── preferences.js               # Persistencia de preferencias locales
```

`weather-dashboard` concentra el estado de la aplicación. Los componentes hijos reciben datos mediante propiedades y notifican las acciones a través de eventos personalizados. El servicio `open-meteo.js` transforma las respuestas externas a modelos de presentación para que los componentes no dependan del formato de la API.

## Persistencia local

La unidad de temperatura y las ciudades favoritas se guardan en `localStorage` bajo la clave `climavivo-preferences`. La aplicación continúa funcionando cuando el almacenamiento no está disponible, aunque las preferencias no se conservarán entre sesiones.

## Pruebas

Ejecuta la suite completa:

```bash
npm test
```

Las pruebas cubren los componentes de clima actual, pronóstico y selector de unidades, además de los servicios de preferencias y Open-Meteo.

## Compilación para producción

```bash
npm run build
npm run preview
```

El primer comando genera los archivos estáticos en `dist/`. El segundo permite revisarlos localmente antes de desplegarlos en cualquier alojamiento de archivos estáticos.