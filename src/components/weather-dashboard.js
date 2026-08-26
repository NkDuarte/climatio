import { LitElement, html, unsafeCSS } from 'lit';
import { loadWeatherForCity } from '../services/open-meteo.js';
import './city-search/city-search.js';
import './unit-selector/unit-selector.js';
import './current-weather/current-weather.js'; // faltaba el import de clima actual
import './forecast-strip/forecast-strip.js'; // faltaba el import d pronóstico
import styles from './weather-dashboard.scss?inline';

export class WeatherDashboard extends LitElement {
  static properties = {
    city: { type: String },
    unit: { type: String },

    _isLoading: { state: true },
    _error: { state: true },
    _selectedCity: { state: true },
    _currentWeather: { state: true },
    _forecast: { state: true }
  };

  static styles = unsafeCSS(styles);

  constructor() {
    super();

    this.city = 'Bogotá';
    this.unit = 'celsius';
    this._isLoading = false;
    this._error = null;
    this._selectedCity = null;
    this._currentWeather = null;
    this._forecast = [];
    this._activeRequest = null;
  }

  render() {
    const weatherScene = this._getWeatherScene();

    return html`
      <section
        class="dashboard dashboard--${weatherScene}"
        @city-search=${this._handleCitySearch}
        @unit-change=${this._handleUnitChange}
      >
        <div class="dashboard__atmosphere" aria-hidden="true">
          <span class="dashboard__sun"></span>
          <span class="dashboard__moon"></span>
          <span class="dashboard__cloud dashboard__cloud--one"></span>
          <span class="dashboard__cloud dashboard__cloud--two"></span>
          <span class="dashboard__rain"></span>
          <span class="dashboard__snow"></span>
          <span class="dashboard__lightning"></span>
        </div>

        <header class="dashboard__header">
          <div>
            <p class="dashboard__eyebrow">Open-Meteo · pronóstico público</p>
            <h1>ClimaVivo</h1>
            <p>Consulta el cielo de cualquier ciudad.</p>
          </div>

          <unit-selector
            .unit=${this.unit}
            ?disabled=${this._isLoading}
          ></unit-selector>
        </header>

        <city-search
          .value=${this.city}
          ?disabled=${this._isLoading}
        ></city-search>

        <div class="dashboard__status" aria-live="polite">
          ${this._isLoading
            ? html`
                <p class="status status--loading">
                  Cargando información meteorológica...
                </p>
              `
            : ''}

          ${this._error
            ? html`
                <p class="status status--error" role="alert">
                  ${this._error}
                </p>
              `
            : ''}

          ${!this._isLoading && !this._error && !this._selectedCity
            ? html`
                <p class="status">
                  Busca una ciudad para consultar su pronóstico.
                </p>
              `
            : ''}
        </div>

        ${this._selectedCity
          ? html`
              <!--
                ¿Q cambié? Sólo la integración de componentes faltantes. 

                weather-dashboard sigue siendo dueño de:
                - fetch;
                - AbortController;
                - estado global;
                - ciudad seleccionada;
                - clima actual;
                - pronóstico.

                Los componentes hijos solo reciben propiedades normalizadas
                y se encargan de mostrar la información.
              -->
              <section
                class="dashboard__weather"
                aria-label="Información meteorológica"
              >
                ${this._currentWeather
                  ? html`
                      <current-weather
                        .city=${this._selectedCity}
                        .weather=${this._currentWeather}
                        .unit=${this.unit}
                        ?disabled=${this._isLoading}
                      ></current-weather>
                    `
                  : ''}

                <!--
                  forecast-strip recibe el array normalizado _forecast
                  Ahora ese componente usa forecast.map(...) internamente para
                  renderizar una tarjeta en teoria x cada día del pronóstico
                -->
                <forecast-strip
                  .forecast=${this._forecast}
                  .unit=${this.unit}
                ></forecast-strip>
              </section>
            `
          : ''}
      </section>
    `;
  }

  _handleCitySearch(event) {
    this.city = event.detail.query;
    this._loadWeather(event.detail.query);
  }

  _getWeatherScene() {
    const iconKey = this._currentWeather?.iconKey;

    if (iconKey === 'clear-day') {
      return 'clear-day';
    }

    if (iconKey === 'clear-night' || this._currentWeather?.isDay === false) {
      return 'clear-night';
    }

    if (iconKey === 'rain' || iconKey === 'drizzle') {
      return 'rain';
    }

    if (iconKey === 'thunderstorm') {
      return 'thunderstorm';
    }

    if (iconKey === 'snow') {
      return 'snow';
    }

    if (iconKey === 'fog') {
      return 'fog';
    }

    if (iconKey === 'cloudy' || iconKey?.startsWith('partly-cloudy')) {
      return 'cloudy';
    }

    return 'default';
  }

  _handleUnitChange(event) {
    this.unit = event.detail.unit;

    if (this._selectedCity) {
      this._loadWeather(this._selectedCity);
    }
  }

  disconnectedCallback() {
    this._activeRequest?.abort();
    super.disconnectedCallback();
  }

  async _loadWeather(city) {
    this._activeRequest?.abort();

    const request = new AbortController();
    this._activeRequest = request;
    this._isLoading = true;
    this._error = null;

    try {
      const weather = await loadWeatherForCity(city, {
        unit: this.unit,
        signal: request.signal
      });

      if (this._activeRequest !== request) {
        return;
      }

      this._selectedCity = weather.city;
      this._currentWeather = weather.current;
      this._forecast = weather.forecast;
    } catch (error) {
      if (error.name !== 'AbortError' && this._activeRequest === request) {
        this._error = error.message || 'No fue posible cargar el pronóstico.';
      }
    } finally {
      if (this._activeRequest === request) {
        this._isLoading = false;
        this._activeRequest = null;
      }
    }
  }
}

if (!customElements.get('weather-dashboard')) {
  customElements.define('weather-dashboard', WeatherDashboard);
}