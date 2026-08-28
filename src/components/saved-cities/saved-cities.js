import { LitElement, html, unsafeCSS } from 'lit';
import styles from './saved-cities.scss?inline';

/**
 * Para guardar dentro de ciudad:
 *
 * @typedef {object} SavedCity
 * @property {string} id Identificador único entregado por el geocodificador
 * @property {string} name Nombre principal de la ciudad
 * @property {string} [country] País de la ciudad
 * @property {string | null} [admin1] Región o depto
 * @property {string} [label] Etiqueta legible, x ejemplo:
 * "Bogotá, Bogotá D.C., Colombia".
 */

/**
 * Evento emitido cuando la persona selecciona una ciudad guardada
 *
 * @typedef {CustomEvent<{ city: SavedCity }>} CitySelectEvent
 */

/**
 * Evento emitido cuando la persona elimina una ciudad  q ya estaba guardada
 *
 * @typedef {CustomEvent<{ city: SavedCity, cityId: string }>} CityRemoveEvent
 */

/**
 * Lista de ciudades guardadas de la app
 *
 * El componente recibe ciudades desde <weather-dashboard> y emite eventos
 * para informar las interacciones del usuario
 *
 * No hace fetch, no maneja localStorage y no modifica el estado global
 * <weather-dashboard> es quien maneja favoritos y persistencia
 *
 * @element saved-cities
 * @fires city-select
 * @fires city-remove
 */
export class SavedCities extends LitElement {
  /**
   * Propiedades públicas reactivas.
   *
   * `cities` debe llegar como property binding:
   *
   * <saved-cities .cities=${this._favorites}></saved-cities>
   *
   *  ((se pasa un array real de Js))
   */
  static properties = {
    cities: { type: Array },
    selectedCityId: { type: String },
    disabled: { type: Boolean }
  };

  /**
   * Estilos encapsulados mediante ShadowDOM
   */
  static styles = unsafeCSS(styles);

  constructor() {
    super();

    /**
     * Ciudades guardadas actualmente.
     *
     * @type {SavedCity[]}
     */
    this.cities = [];

    /**
     * Id de la ciudad actualmente seleccionada.
     *
     * @type {string}
     */
    this.selectedCityId = '';

    /**
     * Permite deshabilitar acciones mientras la aplicación carga datos
     *
     * @type {boolean}
     */
    this.disabled = false;
  }

  /**
   * Renderiza el componente.
   *
   * Muestra un estado vacío si no hay ciudades guardadas y una lista
   * interactiva si el array DE cities tiene elementos
   *
   * @returns {import('lit').TemplateResult}
   */
  render() {
    return html`
      <section
        class="saved-cities"
        aria-labelledby="saved-cities-title"
      >
        <header class="saved-cities__header">
          <div>
            <p class="saved-cities__eyebrow">Acceso rápido</p>
            <h2 id="saved-cities-title">Ciudades guardadas</h2>
          </div>

          <span class="saved-cities__count" aria-label="Cantidad de ciudades">
            ${this.cities.length}
          </span>
        </header>

        ${this.cities.length === 0
          ? this._renderEmptyState()
          : this._renderCityList()}
      </section>
    `;
  }

  /**
   * Renderiza el estado vacío cuando aún no existen ciudades favs
   *
   * @returns {import('lit').TemplateResult}
   */
  _renderEmptyState() {
    return html`
      <div class="saved-cities__empty">
        <div class="saved-cities__empty-icon" aria-hidden="true">
          <span></span>
        </div>

        <div>
          <p class="saved-cities__empty-title">
            Aún no guardas ciudades.
          </p>

          <p class="saved-cities__empty-copy">
            Guarda una ciudad para volver a consultar su clima rápidamente.
          </p>
        </div>
      </div>
    `;
  }

  /**
   * Renderiza una lista de ciudades guardadas
   *
   * @returns {import('lit').TemplateResult}
   */
  _renderCityList() {
    return html`
      <ul class="saved-cities__list">
        ${this.cities.map((city) => {
          const isSelected = city.id === this.selectedCityId;

          return html`
            <li class="saved-cities__item">
              <button
                type="button"
                class=${isSelected
                  ? 'saved-cities__city saved-cities__city--selected'
                  : 'saved-cities__city'}
                data-city-id=${city.id}
                data-action="select"
                aria-current=${isSelected ? 'true' : 'false'}
                ?disabled=${this.disabled}
                @click=${this._handleCitySelect}
              >
                <span class="saved-cities__location" aria-hidden="true"></span>

                <span class="saved-cities__city-content">
                  <strong>${city.name}</strong>
                  <small>${this._getCityMeta(city)}</small>
                </span>

                ${isSelected
                  ? html`
                      <span class="saved-cities__active-label">
                        Actual
                      </span>
                    `
                  : ''}
              </button>

              <button
                type="button"
                class="saved-cities__remove"
                data-city-id=${city.id}
                data-action="remove"
                aria-label=${`Eliminar ${this._getCityLabel(city)} de ciudades guardadas`}
                ?disabled=${this.disabled}
                @click=${this._handleCityRemove}
              >
                <span aria-hidden="true">×</span>
              </button>
            </li>
          `;
        })}
      </ul>
    `;
  }

  /**
   * Obtiene la ciudad asociada al botón que disparó el evento
   *
   * @param {Event} event Evento generado por un botón
   * @returns {SavedCity | undefined} Ciudad encontrada
   */
  _getCityFromEvent(event) {
    const button = event.currentTarget;

    if (!(button instanceof HTMLButtonElement)) {
      return undefined;
    }

    const cityId = button.dataset.cityId;

    return this.cities.find((city) => city.id === cityId);
  }

  /**
   * Emite "city-select" para solicitar que el dashboard consulte una ciudad
   *
   * @param {MouseEvent} event Evento click sobre una ciudad guardada.
   * @returns {void}
   */
  _handleCitySelect(event) {
    if (this.disabled) {
      return;
    }

    const city = this._getCityFromEvent(event);

    if (!city || city.id === this.selectedCityId) {
      return;
    }

    this.dispatchEvent(
      new CustomEvent('city-select', {
        detail: { city },
        bubbles: true,
        composed: true
      })
    );
  }

  /**
   * Emite "city-remove" para solicitar que el dashboard elimine una ciudad
   *
   * stopPropagation evita que el click del botón eliminar active también
   * la selección de la ciudad
   *
   * @param {MouseEvent} event Evento click sobre el botón eliminar
   * @returns {void}
   */
  _handleCityRemove(event) {
    event.stopPropagation();

    if (this.disabled) {
      return;
    }

    const city = this._getCityFromEvent(event);

    if (!city) {
      return;
    }

    this.dispatchEvent(
      new CustomEvent('city-remove', {
        detail: {
          city,
          cityId: city.id
        },
        bubbles: true,
        composed: true
      })
    );
  }

  /**
   * Genera texto secundario para una ciudad
   *
   * @param {SavedCity} city Ciudad guardada
   * @returns {string} Región y/o país
   */
  _getCityMeta(city) {
    return [city.admin1, city.country].filter(Boolean).join(', ') || 'Ubicación guardada';
  }

  /**
   * Genera una etiqueta completa y legible
   *
   * @param {SavedCity} city Ciudad guardada
   * @returns {string} Etiqueta de ciudad
   */
  _getCityLabel(city) {
    return city.label || [
      city.name,
      city.admin1,
      city.country
    ].filter(Boolean).join(', ');
  }
}

/**
 * Evita errores por registrar dos veces el custom element durante
 * desarrollo con Vite
 */
if (!customElements.get('saved-cities')) {
  customElements.define('saved-cities', SavedCities);
}