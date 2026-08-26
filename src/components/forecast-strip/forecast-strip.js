import { LitElement, html, unsafeCSS } from 'lit';
import styles from './forecast-strip.scss?inline';

/**
 * @typedef {Object} ForecastDay
 * @property {string} date Fecha ISO: YYYY-MM-DD.
 * @property {string} label Etiqueta lista para mostrar.
 * @property {number} max Temperatura máxima.
 * @property {number} min Temperatura mínima.
 * @property {string} condition Descripción del clima.
 * @property {string} iconKey Clave visual del clima.
 */

/**
 * Muestra el pronóstico de los próximos días.
 *
 * Es un componente de presentación:
 * recibe el array normalizado y no consulta APIs.
 *
 * @element forecast-strip
 */
export class ForecastStrip extends LitElement {
  static properties = {
    forecast: { type: Array },
    unit: { type: String }
  };

  static styles = unsafeCSS(styles);

  constructor() {
    super();

    /** @type {ForecastDay[]} */
    this.forecast = [];

    /** @type {"celsius"|"fahrenheit"} */
    this.unit = 'celsius';
  }

  /**
   * Obtiene el símbolo de temperatura de la unidad actual.
   *
   * @returns {"°C"|"°F"} Símbolo de temperatura.
   */
  get temperatureUnit() {
    return this.unit === 'fahrenheit' ? '°F' : '°C';
  }

  /**
   * Formatea un valor numérico de temperatura.
   *
   * @param {number} value Temperatura a mostrar.
   * @returns {string} Temperatura redondeada o guion.
   */
  _formatTemperature(value) {
    return Number.isFinite(value) ? String(Math.round(value)) : '—';
  }

  /**
   * Renderiza una tarjeta individual de pronóstico.
   *
   * @param {ForecastDay} day Día normalizado.
   * @returns {import('lit').TemplateResult} Template del día.
   */
  _renderDay(day) {
    return html`
      <article class="forecast-strip__day">
        <h3>${day.label}</h3>

        <div
          class="forecast-strip__icon forecast-strip__icon--${day.iconKey || 'unknown'}"
          role="img"
          aria-label="${day.condition}"
        >
          <span></span>
        </div>

        <p class="forecast-strip__condition">${day.condition}</p>

        <p class="forecast-strip__temperatures">
          <strong>
            ${this._formatTemperature(day.max)}${this.temperatureUnit}
          </strong>

          <span>
            ${this._formatTemperature(day.min)}${this.temperatureUnit}
          </span>
        </p>
      </article>
    `;
  }

  render() {
    return html`
      <section class="forecast-strip" aria-label="Pronóstico de cinco días">
        <header class="forecast-strip__header">
          <h2>Próximos cinco días</h2>
        </header>

        ${this.forecast.length === 0
          ? html`
              <p class="forecast-strip__empty">
                No hay pronóstico disponible.
              </p>
            `
          : html`
              <div class="forecast-strip__list">
                ${this.forecast.map((day) => this._renderDay(day))}
              </div>
            `}
      </section>
    `;
  }
}

if (!customElements.get('forecast-strip')) {
  customElements.define('forecast-strip', ForecastStrip);
}