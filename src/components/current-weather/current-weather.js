import { LitElement, html, unsafeCSS } from 'lit';
import styles from './current-weather.scss?inline';

/**
 * Representa una ciudad pra mostrar información meteorológica
 *
 * El dashboard recibe datos crudos de Open-Meteo, los normaliza y pasa un
 * objeto con esta forma a <current-weather>.
 *
 * @typedef {Object} WeatherCity
 * @property {string} id Identificador estable de la ciudad.
 * @property {string} name Nombre principal de la ciudad.
 * @property {string} [country] País de la ciudad.
 * @property {string|null} [admin1] Región, departamento o estado.
 * @property {string} [label] Texto completo listo para mostrar.
 */

/**
 * Representa el clima actual normalizado.
 *
 * Este componente no debe depender de la respuesta de Open-Meteo.
 * Recibe un objeto simplificado y consistente desde <weather-dashboard>.
 *
 * @typedef {Object} CurrentWeatherData
 * @property {number} temperature Temperatura actual en la unidad seleccionada
 * @property {number} apparentTemperature Sensación térmica
 * @property {number} humidity Humedad relativa, expresada enn porcentaje
 * @property {number} windSpeed Velocidad del viento en km/h
 * @property {string} condition Descripción legible del clima
 * @property {string} iconKey Clave visual para elegir el icono CSS
 * @property {boolean} isDay Indica si la condición corresponde al día
 */

/**
 * Componente de presentación para mostrar el clima actual de una ciudad.
 *
 * Responsabilidades:
 * - Mostrar ciudad, temperatura, condición, sensación térmica, humedad y viento.
 * - Mostrar un icono visual basado en CSS.
 * - Emitir el evento público "favorite-toggle".
 *
 * No debe:
 * - Hacer fetch.
 * - Consultar Open-Meteo.
 * - Usar localStorage.
 * - Modificar favoritos directamente.
 *
 * El estado global pertenece a <weather-dashboard>.
 *
 * @extends LitElement
 */
export class CurrentWeather extends LitElement {
  /**
   * Propiedades públicas que recibe el componente desde fuera.
   *
   * @type {{
   *   city: { type: ObjectConstructor },
   *   weather: { type: ObjectConstructor },
   *   unit: { type: StringConstructor },
   *   isFavorite: { type: BooleanConstructor },
   *   disabled: { type: BooleanConstructor }
   * }}
   */
  static properties = {
    city: { type: Object },
    weather: { type: Object },
    unit: { type: String },
    isFavorite: { type: Boolean },
    disabled: { type: Boolean }
  };

  /**
   * Estilos SCSS compilados por Vite e inyectados dentro del Shadow DOM.
   *
   * @type {import('lit').CSSResult}
   */
  static styles = unsafeCSS(styles);

  constructor() {
    super();

    /**
     * Ciudad actualmente mostrada.
     *
     * @type {WeatherCity|null}
     */
    this.city = null;

    /**
     * Datos meteorológicos actuales.
     *
     * @type {CurrentWeatherData|null}
     */
    this.weather = null;

    /**
     * Unidad activa de temperatura.
     *
     * Valores esperados:
     * - "celsius"
     * - "fahrenheit"
     *
     * @type {"celsius"|"fahrenheit"}
     */
    this.unit = 'celsius';

    /**
     * Indica si la ciudad actual ya está guardada en favoritos.
     *
     * @type {boolean}
     */
    this.isFavorite = false;

    /**
     * Indica si el botón de favoritos debe permanecer deshabilitado.
     *
     * x ejemplo, el dashboard podría deshabilitarlo durante una carga.
     *
     * @type {boolean}
     */
    this.disabled = false;
  }

  /**
   * Convierte una temperatura numérica a texto visible con su unidad.
   *
   * @param {number} value Temperatura que se desea mostrar.
   * @returns {string} Temperatura formateada, por ejemplo "18°C" o "64°F".
   */
  _formatTemperature(value) {
    if (!Number.isFinite(value)) {
      return '—';
    }

    const symbol = this.unit === 'fahrenheit' ? '°F' : '°C';

    return `${Math.round(value)}${symbol}`;
  }

  /**
   * Convierte una velocidad de viento a texto visible.
   *
   * @param {number} value Velocidad del viento en kilómetros por hora.
   * @returns {string} Texto como "11 km/h" o "—" si el valor no es válido.
   */
  _formatWind(value) {
    if (!Number.isFinite(value)) {
      return '—';
    }

    return `${Math.round(value)} km/h`;
  }

  /**
   * Convierte la humedad relativa a texto visible.
   *
   * @param {number} value Humedad relativa en porcentaje.
   * @returns {string} Texto como "78%" o "—" si el valor no es válido.
   */
  _formatHumidity(value) {
    if (!Number.isFinite(value)) {
      return '—';
    }

    return `${Math.round(value)}%`;
  }

  /**
   * Obtiene el texto completo de la ciudad.
   *
   * Si el dashboard envía `city.label`, se usa directamente.
   * Si no existe, construye una etiqueta a partir de nombre, región y país.
   *
   * @returns {string} Etiqueta legible de ciudad.
   */
  _getCityLabel() {
    if (!this.city) {
      return 'Ciudad no disponible';
    }

    if (this.city.label) {
      return this.city.label;
    }

    return [
      this.city.name,
      this.city.admin1,
      this.city.country
    ]
      .filter(Boolean)
      .join(', ');
  }

  /**
   * Comunica que la persona desea guardar o quitar la ciudad actual.
   *
   * El componente no altera `isFavorite` por cuenta propia.
   * Solo emite un evento para que <weather-dashboard> decida qué hacer.
   *
   * @returns {void}
   */
  _handleFavoriteToggle() {
    if (this.disabled || !this.city) {
      return;
    }

    /**
     * Evento público que atraviesa el Shadow DOM y sube por el árbol DOM.
     *
     * @event favorite-toggle
     * @type {CustomEvent<{city: WeatherCity}>}
     */
    this.dispatchEvent(
      new CustomEvent('favorite-toggle', {
        detail: {
          city: this.city
        },
        bubbles: true,
        composed: true
      })
    );
  }

  /**
   * Renderiza el estado vacío o la tarjeta de clima actual
   *
   * @returns {import('lit').TemplateResult} Template reactivo de Lit.
   */
  render() {
    if (!this.city || !this.weather) {
      return html`
        <section class="current-weather current-weather--empty">
          <p>Aún no hay información meteorológica para mostrar.</p>
        </section>
      `;
    }

    const cityLabel = this._getCityLabel();
    const condition = this.weather.condition ?? 'Condición no disponible';
    const iconKey = this.weather.iconKey ?? 'unknown';

    const dayClass = this.weather.isDay === false
      ? 'current-weather__icon--night'
      : 'current-weather__icon--day';

    return html`
      <section class="current-weather" aria-live="polite">
        <header class="current-weather__header">
          <div>
            <p class="current-weather__eyebrow">Ahora en</p>
            <h2 class="current-weather__city">${cityLabel}</h2>
          </div>

          <button
            class="current-weather__favorite"
            type="button"
            ?disabled="${this.disabled}"
            aria-pressed="${this.isFavorite ? 'true' : 'false'}"
            @click="${this._handleFavoriteToggle}"
          >
            ${this.isFavorite ? 'Quitar ciudad' : 'Guardar ciudad'}
          </button>
        </header>

        <div class="current-weather__main">
          <div
            class="current-weather__icon current-weather__icon--${iconKey} ${dayClass}"
            role="img"
            aria-label="${condition}"
          ></div>

          <div class="current-weather__temperature-group">
            <p class="current-weather__temperature">
              ${this._formatTemperature(this.weather.temperature)}
            </p>

            <p class="current-weather__condition">
              ${condition}
            </p>
          </div>
        </div>

        <dl class="current-weather__details">
          <div>
            <dt>Sensación</dt>
            <dd>
              ${this._formatTemperature(this.weather.apparentTemperature)}
            </dd>
          </div>

          <div>
            <dt>Humedad</dt>
            <dd>${this._formatHumidity(this.weather.humidity)}</dd>
          </div>

          <div>
            <dt>Viento</dt>
            <dd>${this._formatWind(this.weather.windSpeed)}</dd>
          </div>
        </dl>
      </section>
    `;
  }
}

/**
 * Registra el Custom Element una sola vez.
 *
 * La condición evita errores si Vite recarga módulos durante desarrollo
 * o si Vitest importa el componente en más de una prueba.
 */
if (!customElements.get('current-weather')) {
  customElements.define('current-weather', CurrentWeather);
}