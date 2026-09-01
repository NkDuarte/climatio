import { LitElement, html, unsafeCSS } from 'lit';
import { loadWeatherForCity } from '../services/open-meteo.js';
import './city-search/city-search.js';
import './unit-selector/unit-selector.js';
import './current-weather/current-weather.js'; // faltaba el import de clima actual
import './forecast-strip/forecast-strip.js'; // faltaba el import d pronóstico
import './saved-cities/saved-cities.js'; //último: lista de ciudades favoritas
import styles from './weather-dashboard.scss?inline';
/**
 * Add: Llave usada para guardar favoritas en localStorage
 *
 * El dashboard es dueño de persistencia y estado global
 * ercordatorio: saved-cities solo recibe datos y emite eventos
 */
const FAVORITES_STORAGE_KEY = 'climavivo:favorites';

export class WeatherDashboard extends LitElement {
  static properties = {
    city: { type: String },
    unit: { type: String },

    _isLoading: { state: true },
    _error: { state: true },
    _selectedCity: { state: true },
    _currentWeather: { state: true },
    _forecast: { state: true },
    _favorites: { state: true } //agregué favorites 
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
    this._favorites = this._readFavorites(); //agregué este (para recuperar las ciudades guardadas del nav)
    this._activeRequest = null;
  }

  render() {
    const weatherScene = this._getWeatherScene();

    return html`
      <section
        class="dashboard dashboard--${weatherScene}"
        @city-search=${this._handleCitySearch}
        @unit-change=${this._handleUnitChange}
        @favorite-toggle=${this._handleFavoriteToggle}  
        @city-select=${this._handleCitySelect}
        @city-remove=${this._handleCityRemove}
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
                        .isFavorite=${this._isFavorite(this._selectedCity)} 
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

        <!--
        Agregué: integración de ciudades guardadas
        saved-cities siempre aparece.

        Si no hay favoritas, muestra su estado vacío.
        Si existen favoritas, permite seleccionarlas o eliminarlas.
        saved-cities no hace fetch ni localStorage.
        El dashboard le pasa favoritas y escucha sus eventos.
        -->
        <aside
          class="dashboard__saved-cities"
          aria-label="Ciudades guardadas"
        >
          <saved-cities
            .cities=${this._favorites}
            .selectedCityId=${this._selectedCity?.id ?? ''}
            ?disabled=${this._isLoading}
          ></saved-cities>
        </aside>
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

    /**
   * Guarda o elimina la ciudad actual de favoritas.
   *
   * current-weather emite favorite-toggle, pero no administra
   * localStorage ni el estado global. Esa responsabilidad queda aquí.
   *
   * @param {CustomEvent<{ city?: object }>} event Evento favorite-toggle.
   * @returns {void}
   */
  _handleFavoriteToggle(event) {
    const city = event.detail?.city ?? this._selectedCity;

    if (!city?.id) {
      return;
    }

    if (this._isFavorite(city)) {
      this._favorites = this._favorites.filter(
        (favorite) => favorite.id !== city.id
      );
    } else {
      this._favorites = [...this._favorites, city];
    }

    this._persistFavorites();
  }

  /**
   * Consulta el clima de una ciudad seleccionada desde saved-cities.
   *
   * La ciudad ya viene normalizada, por eso _loadWeather puede recibirla
   * directamente sin repetir geocodificación c:
   *
   * @param {CustomEvent<{ city: object }>} event Evento city-select.
   * @returns {void}
   */
  _handleCitySelect(event) {
    const city = event.detail?.city;

    if (!city?.id) {
      return;
    }

    this.city = city.name;
    this._loadWeather(city);
  }

  /**
   * Elimina una ciudad de la lista de favoritas.
   *
   * @param {CustomEvent<{ cityId: string }>} event Evento city-remove.
   * @returns {void}
   */
  _handleCityRemove(event) {
    const cityId = event.detail?.cityId;

    if (!cityId) {
      return;
    }

    this._favorites = this._favorites.filter(
      (favorite) => favorite.id !== cityId
    );

    this._persistFavorites();
  }

  /**
   * Verifica si una ciudad ya se encuentra guardada.
   *
   * @param {object | null} city Ciudad por comprobar.
   * @returns {boolean} True si está dentro de favoritas.
   */
  _isFavorite(city) {
    if (!city?.id) {
      return false;
    }

    return this._favorites.some(
      (favorite) => favorite.id === city.id
    );
  }

  /**
   * Lee favoritas desde localStorage.
   *
   * Si no existen datos, localStorage está bloqueado o el JSON es inválido,
   * devuelve un array vacío para que la app siga funcionando.
   *
   * @returns {object[]} Lista de ciudades favoritas.
   */
  _readFavorites() {
    try {
      const storedFavorites = localStorage.getItem(
        FAVORITES_STORAGE_KEY
      );

      if (!storedFavorites) {
        return [];
      }

      const parsedFavorites = JSON.parse(storedFavorites);

      return Array.isArray(parsedFavorites)
        ? parsedFavorites.filter((city) => city?.id)
        : [];
    } catch {
      return [];
    }
  }

  /**
   * Persiste las favoritas actuales en localStorage.
   *
   * @returns {void}
   */
  _persistFavorites() {
    try {
      localStorage.setItem(
        FAVORITES_STORAGE_KEY,
        JSON.stringify(this._favorites)
      );
    } catch {
      // La app sigue funcionando aunque localStorage esté bloqueado.
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
