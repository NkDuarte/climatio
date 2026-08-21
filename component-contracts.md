# Contratos de componentes — ClimaVivo

## Propósito

Este documento define las responsabilidades, propiedades, eventos y modelos de datos de ClimaVivo.

Objetivos:

- Evitar que dos componentes hagan la misma tarea.
- Evitar que componentes de presentación hagan `fetch`.
- Mantener nombres consistentes.
- Permitir que cada integrante trabaje en ramas separadas.
- Definir una API clara entre componentes antes de implementar.

---

# Equipo y responsabilidades

## Nicolás — lógica central e integración

Responsable de:

```text
<weather-dashboard>
<city-search>
Integración con Open-Meteo
Geocodificación
Fetch y cancelación con AbortController
Estado global de carga, error y conectividad
Comunicación entre componentes
Persistencia con localStorage
Ciclo de vida
```

Ramas sugeridas:

```text
feature/weather-dashboard
feature/city-search
feature/weather-api
feature/persistence
```

---

## Angie — componentes de presentación

Responsable de:

```text
<unit-selector>
<current-weather>
<forecast-strip>
<saved-cities>          ← presentación y eventos
Estilos visuales
Animaciones CSS del clima
Pruebas de interfaz y eventos públicos
Apoyo de integración visual
```

Ramas sugeridas:

```text
feature/unit-selector
feature/current-weather
feature/forecast-strip
feature/saved-cities
feature/weather-ui
```

---

# Decisión de nombres

Usaremos nombres consistentes.

```text
ciudad         → texto escrito o mostrado como nombre de ciudad.
city           → objeto normalizado de ciudad.
unit           → unidad actualmente seleccionada: "celsius" o "fahrenheit".
currentWeather → objeto normalizado de clima actual.
forecast       → array de días pronosticados.
favorites      → array de ciudades guardadas.
```

Aunque el proyecto menciona "unidades", se usará `unit` en JavaScript porque representa una sola unidad activa:

```js
this.unit = 'celsius';
```

Valores válidos:

```js
'celsius'
'fahrenheit'
```

---

# Arquitectura general

```text
<weather-dashboard>
│
├── <city-search>
├── <unit-selector>
├── <current-weather>
├── <forecast-strip>
└── <saved-cities>
```

Flujo principal:

```text
Usuario escribe una ciudad
        │
        ▼
<city-search>
        │ emite "city-search"
        ▼
<weather-dashboard>
        │
        ├── Geocoding API
        ├── Forecast API
        ├── normaliza datos
        └── actualiza estado
                 │
                 ▼
<current-weather> + <forecast-strip>
```

Regla principal:

> Solo `<weather-dashboard>` consulta APIs.  
> Los componentes de presentación reciben propiedades y emiten eventos.

---

# Modelos normalizados

Los componentes no deben depender directamente de la respuesta cruda de Open-Meteo.

El dashboard y los módulos de normalización entregarán objetos con una forma estable.

---

## `WeatherCity`

```js
/**
 * Ciudad normalizada obtenida desde Open-Meteo Geocoding.
 *
 * @typedef {Object} WeatherCity
 * @property {string} id Identificador estable de la ciudad.
 * @property {string} name Nombre principal de la ciudad.
 * @property {string} country País.
 * @property {string|null} admin1 Departamento, estado o región.
 * @property {number} latitude Latitud.
 * @property {number} longitude Longitud.
 * @property {string} timezone Zona horaria IANA.
 * @property {string} label Texto listo para mostrar.
 */
```

Ejemplo:

```js
const city = {
  id: '3688689',
  name: 'Bogotá',
  country: 'Colombia',
  admin1: 'Bogotá D.C.',
  latitude: 4.6097,
  longitude: -74.0817,
  timezone: 'America/Bogota',
  label: 'Bogotá, Bogotá D.C., Colombia'
};
```

---

## `CurrentWeather`

```js
/**
 * Clima actual normalizado.
 *
 * @typedef {Object} CurrentWeather
 * @property {number} temperature Temperatura actual.
 * @property {number} apparentTemperature Sensación térmica.
 * @property {number} windSpeed Velocidad del viento.
 * @property {number} weatherCode Código WMO.
 * @property {boolean} isDay Indica si es de día.
 * @property {string} condition Descripción traducida del clima.
 * @property {string} iconKey Clave visual del icono o tema.
 */
```

Ejemplo:

```js
const currentWeather = {
  temperature: 18,
  apparentTemperature: 16,
  windSpeed: 11,
  weatherCode: 3,
  isDay: true,
  condition: 'Mayormente despejado',
  iconKey: 'partly-cloudy-day'
};
```

---

## `ForecastDay`

```js
/**
 * Día normalizado del pronóstico.
 *
 * @typedef {Object} ForecastDay
 * @property {string} date Fecha ISO: YYYY-MM-DD.
 * @property {string} label Texto listo para mostrar, por ejemplo "vie 21".
 * @property {number} max Temperatura máxima.
 * @property {number} min Temperatura mínima.
 * @property {number} weatherCode Código WMO.
 * @property {string} condition Descripción traducida.
 * @property {string} iconKey Clave visual para el icono.
 */
```

Ejemplo:

```js
const forecastDay = {
  date: '2026-06-21',
  label: 'sáb 21',
  max: 21,
  min: 13,
  weatherCode: 61,
  condition: 'Lluvia ligera',
  iconKey: 'rain'
};
```

---

## `WeatherPayload`

Resultado normalizado completo que recibe el dashboard desde el adaptador de Open-Meteo.

```js
/**
 * @typedef {Object} WeatherPayload
 * @property {WeatherCity} city Ciudad normalizada.
 * @property {CurrentWeather} current Clima actual.
 * @property {ForecastDay[]} forecast Pronóstico de cinco días.
 * @property {"celsius"|"fahrenheit"} unit Unidad usada en la consulta.
 */
```

---

# Contrato: `<weather-dashboard>`

## Responsable

```text
Nicolás
```

## Rol

Es el componente raíz y dueño del estado global.

Debe:

```text
- Escuchar eventos de componentes hijos.
- Buscar ciudades.
- Consultar Open-Meteo.
- Cancelar búsquedas anteriores.
- Manejar carga, error, estado vacío y conectividad.
- Pasar datos normalizados a componentes de presentación.
- Persistir/restaurar unidad y favoritos.
- No pasar respuestas crudas de Open-Meteo a los hijos.
```

---

## Propiedades públicas

```js
static properties = {
  city: { type: String },
  unit: { type: String }
};
```

Uso futuro posible:

```html
<weather-dashboard
  city="Bogotá"
  unit="celsius">
</weather-dashboard>
```

Valores por defecto recomendados:

```js
this.city = 'Bogotá';
this.unit = 'celsius';
```

---

## Estado interno recomendado

```js
static properties = {
  city: { type: String },
  unit: { type: String },

  _selectedCity: { state: true },
  _currentWeather: { state: true },
  _forecast: { state: true },
  _favorites: { state: true },

  _isLoading: { state: true },
  _error: { state: true },
  _isOffline: { state: true },
  _activeRequest: { state: true }
};
```

Valores iniciales sugeridos:

```js
this._selectedCity = null;
this._currentWeather = null;
this._forecast = [];
this._favorites = [];

this._isLoading = false;
this._error = null;
this._isOffline = !navigator.onLine;
this._activeRequest = null;
```

`_activeRequest` podría no necesitar ser reactivo porque no aparece en el template. Se puede mantener como propiedad normal:

```js
this._activeRequest = null;
```

---

## Eventos que escucha

El dashboard escucha eventos por delegación:

```text
city-search
unit-change
favorite-toggle
city-select
city-remove
```

Ejemplo:

```js
render() {
  return html`
    <section
      @city-search="${this._handleCitySearch}"
      @unit-change="${this._handleUnitChange}"
      @favorite-toggle="${this._handleFavoriteToggle}"
      @city-select="${this._handleCitySelect}"
      @city-remove="${this._handleCityRemove}">
      
      ...
    </section>
  `;
}
```

---

## Reglas funcionales importantes

```text
1. Antes de una nueva búsqueda:
   - abortar el AbortController anterior;
   - crear un AbortController nuevo.

2. La misma AbortSignal debe viajar a:
   - geocodificación;
   - pronóstico.

3. AbortError:
   - no se muestra como error al usuario.

4. HTTP 429:
   - mostrar error visible de límite del servicio.

5. Respuestas incompletas:
   - mostrar error visible controlado.

6. Si ya hay pronóstico visible:
   - una búsqueda nueva no debe borrarlo;
   - mostrar indicador de carga sin reemplazar el contenido anterior.

7. No realizar fetch desde:
   - city-search;
   - current-weather;
   - forecast-strip;
   - unit-selector;
   - saved-cities.
```

---

# Contrato: `<city-search>`

## Responsable

```text
Nicolás
```

## Rol

Permite escribir y enviar una ciudad.

No consulta APIs. Solo valida y emite un evento público.

---

## Propiedades públicas

```js
static properties = {
  value: { type: String },
  disabled: { type: Boolean }
};
```

Valores recomendados:

```js
this.value = '';
this.disabled = false;
```

---

## Evento emitido: `city-search`

```js
this.dispatchEvent(
  new CustomEvent('city-search', {
    detail: {
      query: ciudadLimpia
    },
    bubbles: true,
    composed: true
  })
);
```

Contrato:

```text
Nombre:
city-search

detail:
{
  query: string
}

bubbles:
true

composed:
true
```

Ejemplo:

```js
{
  query: 'Bogotá'
}
```

Validación mínima:

```text
- eliminar espacios al inicio y final;
- no emitir si el texto está vacío;
- idealmente mostrar mensaje local de validación.
```

---

# Contrato: `<unit-selector>`

## Responsable

```text
Angie
```

## Rol

Permite elegir la unidad meteorológica activa:

```text
°C → celsius
°F → fahrenheit
```

No realiza fetch. No guarda datos en localStorage. Solo emite el cambio.

---

## Propiedades públicas

```js
static properties = {
  unit: { type: String },
  disabled: { type: Boolean }
};
```

Valores válidos:

```js
this.unit = 'celsius';
this.disabled = false;
```

Uso esperado desde el dashboard:

```html
<unit-selector
  .unit="${this.unit}"
  ?disabled="${this._isLoading}">
</unit-selector>
```

---

## Evento emitido: `unit-change`

```js
this.dispatchEvent(
  new CustomEvent('unit-change', {
    detail: {
      unit: nuevaUnidad
    },
    bubbles: true,
    composed: true
  })
);
```

Contrato:

```text
Nombre:
unit-change

detail:
{
  unit: "celsius" | "fahrenheit"
}

bubbles:
true

composed:
true
```

Ejemplo:

```js
{
  unit: 'fahrenheit'
}
```

---

## Reglas de implementación

```text
- Mostrar claramente qué unidad está activa.
- Tener controles accesibles:
  - button o input radio.
- No hacer fetch.
- No modificar directamente el estado del dashboard.
- El dashboard recibe unit-change y actualiza this.unit.
- El dashboard pasa de nuevo la propiedad unit al selector.
```

---

# Contrato: `<current-weather>`

## Responsable

```text
Angie
```

## Rol

Muestra la información meteorológica actual de una ciudad.

Debe mostrar:

```text
- ciudad;
- temperatura;
- condición;
- sensación térmica;
- viento;
- icono visual;
- acción para guardar/eliminar de favoritos.
```

No consulta APIs.

---

## Propiedades públicas

```js
static properties = {
  city: { type: Object },
  weather: { type: Object },
  unit: { type: String },
  isFavorite: { type: Boolean },
  disabled: { type: Boolean }
};
```

Uso esperado desde dashboard:

```html
<current-weather
  .city="${this._selectedCity}"
  .weather="${this._currentWeather}"
  .unit="${this.unit}"
  ?isFavorite="${this._isFavorite(this._selectedCity)}"
  ?disabled="${this._isLoading}">
</current-weather>
```

---

## Datos esperados

```js
city = {
  id: '3688689',
  name: 'Bogotá',
  label: 'Bogotá, Bogotá D.C., Colombia'
};
```

```js
weather = {
  temperature: 18,
  apparentTemperature: 16,
  windSpeed: 11,
  condition: 'Mayormente despejado',
  iconKey: 'partly-cloudy-day',
  isDay: true
};
```

---

## Evento emitido: `favorite-toggle`

Se emite cuando la persona pulsa guardar o quitar ciudad.

```js
this.dispatchEvent(
  new CustomEvent('favorite-toggle', {
    detail: {
      city: this.city
    },
    bubbles: true,
    composed: true
  })
);
```

Contrato:

```text
Nombre:
favorite-toggle

detail:
{
  city: WeatherCity
}

bubbles:
true

composed:
true
```

---

## Reglas de implementación

```text
- No mostrar datos si city o weather son null.
- No hacer fetch.
- No almacenar favoritos directamente.
- El texto del botón depende de isFavorite:
  false → "Guardar ciudad"
  true  → "Quitar ciudad"
- El icono debe depender de iconKey e isDay.
- No usar emojis como iconos del clima.
- La animación debe usar CSS:
  transform y opacity.
- Respetar prefers-reduced-motion.
```

---

# Contrato: `<forecast-strip>`

## Responsable

```text
Angie
```

## Rol

Muestra los próximos cinco días del pronóstico.

Debe usar `.map()` para generar cada tarjeta de día.

No consulta APIs.

---

## Propiedades públicas

```js
static properties = {
  forecast: { type: Array },
  unit: { type: String }
};
```

Valores iniciales recomendados:

```js
this.forecast = [];
this.unit = 'celsius';
```

Uso esperado desde dashboard:

```html
<forecast-strip
  .forecast="${this._forecast}"
  .unit="${this.unit}">
</forecast-strip>
```

---

## Datos esperados

```js
forecast = [
  {
    date: '2026-06-21',
    label: 'sáb 21',
    max: 21,
    min: 13,
    weatherCode: 61,
    condition: 'Lluvia ligera',
    iconKey: 'rain'
  }
];
```

---

## Reglas de implementación

```text
- Mostrar cinco días cuando existan.
- Usar forecast.map(...).
- Mostrar:
  - fecha;
  - condición;
  - máxima;
  - mínima;
  - icono o indicador visual.
- Mostrar estado vacío si forecast.length === 0.
- No hacer fetch.
- No mutar forecast.
```

Ejemplo conceptual:

```js
render() {
  return html`
    <section>
      <h2>Próximos cinco días</h2>

      ${this.forecast.length === 0
        ? html`<p>No hay pronóstico disponible.</p>`
        : html`
            <div class="forecast-list">
              ${this.forecast.map(day => html`
                <article>
                  <h3>${day.label}</h3>
                  <p>${day.condition}</p>
                  <p>${day.max}° / ${day.min}°</p>
                </article>
              `)}
            </div>
          `
      }
    </section>
  `;
}
```

---

# Contrato: `<saved-cities>`

## Responsable

```text
Angie → interfaz y eventos.
Nicolás → estado, persistencia e integración.
```

## Rol

Muestra las ciudades favoritas guardadas.

Permite:

```text
- seleccionar una ciudad guardada;
- eliminar una ciudad guardada.
```

No consulta APIs ni escribe directamente en localStorage.

---

## Propiedades públicas

```js
static properties = {
  favorites: { type: Array },
  selectedCityId: { type: String },
  disabled: { type: Boolean }
};
```

Valores iniciales sugeridos:

```js
this.favorites = [];
this.selectedCityId = '';
this.disabled = false;
```

Uso esperado desde dashboard:

```html
<saved-cities
  .favorites="${this._favorites}"
  .selectedCityId="${this._selectedCity?.id ?? ''}"
  ?disabled="${this._isLoading}">
</saved-cities>
```

---

## Datos esperados

```js
favorites = [
  {
    id: '3688689',
    name: 'Bogotá',
    country: 'Colombia',
    admin1: 'Bogotá D.C.',
    latitude: 4.6097,
    longitude: -74.0817,
    timezone: 'America/Bogota',
    label: 'Bogotá, Bogotá D.C., Colombia'
  }
];
```

---

## Evento emitido: `city-select`

```js
this.dispatchEvent(
  new CustomEvent('city-select', {
    detail: {
      city
    },
    bubbles: true,
    composed: true
  })
);
```

Contrato:

```text
Nombre:
city-select

detail:
{
  city: WeatherCity
}

bubbles:
true

composed:
true
```

---

## Evento emitido: `city-remove`

```js
this.dispatchEvent(
  new CustomEvent('city-remove', {
    detail: {
      cityId: city.id
    },
    bubbles: true,
    composed: true
  })
);
```

Contrato:

```text
Nombre:
city-remove

detail:
{
  cityId: string
}

bubbles:
true

composed:
true
```

---

## Reglas de implementación

```text
- Mostrar mensaje vacío si no hay favoritas.
- Renderizar favoritas con .map().
- No mutar el array favorites.
- No escribir directamente en localStorage.
- No hacer fetch.
- Permitir seleccionar una ciudad.
- Permitir eliminar una ciudad.
- No emitir eventos si disabled es true.
```

---

# Eventos globales del proyecto

Todos los eventos personalizados deben usar:

```js
bubbles: true,
composed: true
```

Motivo:

```text
bubbles: true
→ permite que el evento suba por el árbol DOM.

composed: true
→ permite que el evento atraviese Shadow DOM.
```

Tabla oficial:

| Evento | Origen | Detail | Escuchado por |
|---|---|---|---|
| `city-search` | `<city-search>` | `{ query }` | `<weather-dashboard>` |
| `unit-change` | `<unit-selector>` | `{ unit }` | `<weather-dashboard>` |
| `favorite-toggle` | `<current-weather>` | `{ city }` | `<weather-dashboard>` |
| `city-select` | `<saved-cities>` | `{ city }` | `<weather-dashboard>` |
| `city-remove` | `<saved-cities>` | `{ cityId }` | `<weather-dashboard>` |

---

# Adaptador de Open-Meteo

## Responsable

```text
Nicolás
```

Archivo sugerido:

```text
src/services/open-meteo.js
```

API pública sugerida:

```js
/**
 * Resuelve una ciudad y obtiene su pronóstico.
 *
 * @param {string|WeatherCity} city Consulta de texto o ciudad persistida.
 * @param {{
 *   unit?: "celsius"|"fahrenheit",
 *   signal?: AbortSignal
 * }} options
 *
 * @returns {Promise<WeatherPayload>}
 */
export async function loadWeatherForCity(city, options = {}) {
  // Implementación.
}
```

Responsabilidades:

```text
- Crear URL de geocodificación usando URLSearchParams.
- Resolver texto a WeatherCity.
- Consultar forecast usando coordenadas.
- Enviar la misma AbortSignal a ambas solicitudes.
- Validar respuestas HTTP.
- Detectar HTTP 429.
- Detectar respuestas incompletas.
- Normalizar datos.
- No guardar respuestas completas en localStorage.
```

---

# Persistencia

## Responsable

```text
Nicolás
```

Archivo sugerido:

```text
src/services/preferences.js
```

Datos persistidos:

```text
- unidad seleccionada;
- ciudades favoritas.
```

No persistir:

```text
- respuesta completa de clima;
- pronóstico completo;
- errores;
- estado de carga;
- AbortController.
```

Ejemplo de estructura persistida:

```js
{
  unit: 'celsius',
  favorites: [
    {
      id: '3688689',
      name: 'Bogotá',
      country: 'Colombia',
      admin1: 'Bogotá D.C.',
      latitude: 4.6097,
      longitude: -74.0817,
      timezone: 'America/Bogota',
      label: 'Bogotá, Bogotá D.C., Colombia'
    }
  ]
}
```

Si el almacenamiento está corrupto:

```text
- no romper la aplicación;
- usar valores predeterminados;
- continuar funcionando.
```

---

# Ciclo de vida esperado

## `connectedCallback()`

Responsable: `<weather-dashboard>`.

Debe:

```text
- restaurar preferencias;
- escuchar online;
- escuchar offline;
- cargar ciudad inicial.
```

Ejemplo conceptual:

```js
connectedCallback() {
  super.connectedCallback();

  window.addEventListener('online', this._handleOnline);
  window.addEventListener('offline', this._handleOffline);

  // Restaurar preferencias y cargar ciudad inicial.
}
```

---

## `updated(changedProperties)`

Debe:

```text
- persistir unit solo si unit cambió;
- persistir favorites solo si favorites cambió.
```

No guardar todo en cada render.

---

## `disconnectedCallback()`

Debe:

```text
- abortar solicitud activa;
- retirar listeners globales.
```

Ejemplo conceptual:

```js
disconnectedCallback() {
  this._activeRequest?.abort();

  window.removeEventListener('online', this._handleOnline);
  window.removeEventListener('offline', this._handleOffline);

  super.disconnectedCallback();
}
```

---

# Estado visual del dashboard

El dashboard debe poder mostrar:

```text
1. Vacío
   → aún no hay clima disponible.

2. Cargando
   → hay una consulta activa.

3. Éxito
   → hay clima actual y pronóstico.

4. Error
   → ocurrió un fallo visible.

5. Offline
   → no hay conexión.
```

Regla importante:

```text
Si ya existe un pronóstico visible y comienza otra búsqueda:

NO:
- borrar el pronóstico;
- reemplazarlo por un spinner completo.

SÍ:
- conservar los datos anteriores;
- mostrar un indicador de actualización/carga.
```

---

# Estructura de archivos sugerida

```text
src/
├── components/
│   ├── weather-dashboard/
│   │   ├── weather-dashboard.js
│   │   ├── weather-dashboard.scss
│   │   └── weather-dashboard.test.js
│   │
│   ├── city-search/
│   │   ├── city-search.js
│   │   ├── city-search.scss
│   │   └── city-search.test.js
│   │
│   ├── unit-selector/
│   │   ├── unit-selector.js
│   │   ├── unit-selector.scss
│   │   └── unit-selector.test.js
│   │
│   ├── current-weather/
│   │   ├── current-weather.js
│   │   ├── current-weather.scss
│   │   └── current-weather.test.js
│   │
│   ├── forecast-strip/
│   │   ├── forecast-strip.js
│   │   ├── forecast-strip.scss
│   │   └── forecast-strip.test.js
│   │
│   └── saved-cities/
│       ├── saved-cities.js
│       ├── saved-cities.scss
│       └── saved-cities.test.js
│
├── services/
│   ├── open-meteo.js
│   ├── open-meteo.test.js
│   └── preferences.js
│
├── utils/
│   ├── weather-codes.js
│   └── weather-codes.test.js
│
├── main.js
└── main.scss
```

---

# Estilos

El proyecto pide SCSS externo por componente.

Patrón esperado:

```js
import { LitElement, html, unsafeCSS } from 'lit';
import styles from './current-weather.scss?inline';

export class CurrentWeather extends LitElement {
  static styles = unsafeCSS(styles);

  render() {
    return html`...`;
  }
}
```

Regla:

```text
- Cada componente tiene su archivo .scss.
- El Shadow DOM encapsula los estilos.
- No usar un CSS global para estilos internos de componentes.
```

---

# Pruebas obligatorias

## Nicolás

```text
- URLs sin API key.
- Ciudad correctamente codificada.
- Códigos WMO representativos.
- Código WMO desconocido no se interpreta como despejado.
- Misma AbortSignal llega a geocodificación y forecast.
- Pronóstico diario incompleto genera error controlado.
- Preferencias corruptas vuelven al valor predeterminado.
- Respuesta anterior no reemplaza búsqueda reciente.
```

---

## Angie

```text
- unit-selector emite unit-change.
- unit-change contiene detail.unit correcto.
- unit-change usa bubbles: true.
- unit-change usa composed: true.
- current-weather emite favorite-toggle.
- favorite-toggle contiene detail.city correcto.
- saved-cities emite city-select.
- saved-cities emite city-remove.
- city-select y city-remove usan bubbles/composed.
- forecast-strip muestra correctamente una lista recibida.
- forecast-strip muestra estado vacío sin romperse.
```

Ejemplo de prueba pública de evento:

```js
search.addEventListener('unit-change', (event) => {
  assert.equal(event.detail.unit, 'fahrenheit');
  assert.equal(event.bubbles, true);
  assert.equal(event.composed, true);
});
```

No probar métodos privados:

```js
// Incorrecto:
component._handleSomething();

// Correcto:
component.shadowRoot.querySelector('button').click();
```

---

# Estrategia Git

No trabajar directamente en `main`.

Flujo recomendado:

```text
main actualizado
      ↓
crear rama feature/nombre-del-componente
      ↓
desarrollar una responsabilidad clara
      ↓
probar localmente
      ↓
commit descriptivo
      ↓
push
      ↓
Pull Request
      ↓
revisión del compañero
      ↓
merge a main
```

Ejemplos de commits:

```bash
git commit -m "feat: add unit selector component"
git commit -m "feat: render current weather details"
git commit -m "feat: add forecast strip component"
git commit -m "feat: emit favorite toggle event"
git commit -m "test: cover unit selector custom event"
git commit -m "fix: handle empty saved cities list"
```

---

# Orden recomendado de implementación

## Día 1

```text
1. Confirmar contratos.
2. Crear estructura de carpetas.
3. Crear esqueletos de componentes.
4. Implementar:
   - city-search;
   - unit-selector;
   - current-weather básico.
5. Crear eventos públicos.
```

## Día 2

```text
1. Implementar Open-Meteo.
2. Conectar dashboard con city-search.
3. Implementar carga, error y éxito.
4. Implementar forecast-strip.
5. Integrar cambio de unidad.
```

## Día 3

```text
1. Implementar favoritos y saved-cities.
2. Agregar AbortController.
3. Agregar online/offline.
4. Persistencia con localStorage.
5. Tests Vitest.
6. README.
7. Prueba completa de demo.
```

---

# Definición de terminado

Una tarea no se considera terminada solo porque “se ve bonita”.

Un componente está terminado cuando:

```text
- tiene una responsabilidad clara;
- recibe propiedades según contrato;
- emite eventos según contrato;
- no hace trabajo que corresponde a otro componente;
- maneja datos vacíos sin romperse;
- tiene estilos encapsulados;
- tiene prueba de sus eventos públicos cuando aplique;
- está documentado y listo para integrar.
```