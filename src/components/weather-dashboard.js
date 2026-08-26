import { LitElement, html, unsafeCSS } from 'lit';
import { loadWeatherForCity } from '../services/open-meteo.js';
import './city-search/city-search.js';
import './unit-selector/unit-selector.js';
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
    return html`
      <section
        class="dashboard"
        @city-search=${this._handleCitySearch}
        @unit-change=${this._handleUnitChange}
      >
        <header class="dashboard__header">
          <div>
            <p class="dashboard__eyebrow">Open-Meteo · pronóstico público</p>
            <h1>ClimaVivo</h1>
            <p>Consulta el cielo de cualquier ciudad.</p>
          </div>
          <unit-selector
            unit=${this.unit}
            ?disabled=${this._isLoading}
          ></unit-selector>
        </header>

        <city-search
          .value=${this.city}
          ?disabled=${this._isLoading}
        ></city-search>

        <div class="dashboard__status" aria-live="polite">
          ${this._isLoading
            ? html`<p class="status status--loading">Cargando información meteorológica...</p>`
            : ''}
          ${this._error
            ? html`<p class="status status--error" role="alert">${this._error}</p>`
            : ''}
          ${!this._isLoading && !this._error && !this._selectedCity
            ? html`<p class="status">Busca una ciudad para consultar su pronóstico.</p>`
            : ''}
        </div>

        ${this._selectedCity
          ? html`
              <section class="selected-city">
                <p>Pronóstico para ${this._selectedCity.label}</p>
                ${this._currentWeather
                  ? html`
                      <p>
                        ${this._currentWeather.temperature}° · ${this._currentWeather.condition}
                      </p>
                    `
                  : ''}
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