import { LitElement, html, unsafeCSS } from 'lit';
import styles from './unit-selector.scss?inline';

/**
 * Unidades de temperatura disponibles en el selector.
 *
 * @typedef {'celsius' | 'fahrenheit'} TemperatureUnit
 */

/**
 * Detalle emitido por el evento `unit-change`.
 *
 * @typedef {Object} UnitChangeDetail
 * @property {TemperatureUnit} unit - Nueva unidad de temperatura seleccionada.
 */

/**
 * Componente web para seleccionar entre grados Celsius y Fahrenheit.
 *
 * El componente muestra dos botones mutuamente excluyentes y emite el evento
 * `unit-change` cuando el usuario selecciona una unidad diferente a la actual.
 *
 * @extends LitElement
 *
 * @property {TemperatureUnit} unit - Unidad de temperatura actualmente seleccionada.
 * @property {boolean} disabled - Indica si los controles del selector están deshabilitados.
 *
 * @fires unit-change - Se emite cuando cambia la unidad seleccionada.
 *
 * @example
 * ```html
 * <unit-selector unit="celsius"></unit-selector>
 * ```
 *
 * @example
 * ```js
 * const selector = document.querySelector('unit-selector');
 *
 * selector.addEventListener('unit-change', (event) => {
 *   console.log(event.detail.unit);
 * });
 * ```
 */
export class UnitSelector extends LitElement {
  /**
   * Propiedades reactivas del componente.
   *
   * @type {import('lit').PropertyDeclarations}
   */
  static properties = {
    unit: { type: String },
    disabled: { type: Boolean }
  };

  /**
   * Estilos encapsulados del componente.
   *
   * @type {import('lit').CSSResult}
   */
  static styles = unsafeCSS(styles);

  /**
   * Inicializa el componente con Celsius como unidad predeterminada
   * y los controles habilitados.
   */
  constructor() {
    super();

    /** @type {TemperatureUnit} */
    this.unit = 'celsius';

    /** @type {boolean} */
    this.disabled = false;
  }

  /**
   * Renderiza la interfaz del selector de unidades.
   *
   * @returns {import('lit').TemplateResult} Plantilla HTML del componente.
   */
  render() {
    return html`
      <section
        class="unit-selector"
        aria-label="Selector de unidad de temperatura"
      >
        <p class="unit-selector__label">Unidades</p>

        <div
          class="unit-selector__controls"
          role="group"
          aria-label="Unidad de temperatura"
        >
          <button
            type="button"
            class="${this.unit === 'celsius'
              ? 'unit-selector__button unit-selector__button--active'
              : 'unit-selector__button'}"
            data-unit="celsius"
            aria-pressed="${this.unit === 'celsius' ? 'true' : 'false'}"
            ?disabled="${this.disabled}"
            @click="${this._selectUnit}"
          >
            °C
          </button>

          <button
            type="button"
            class="${this.unit === 'fahrenheit'
              ? 'unit-selector__button unit-selector__button--active'
              : 'unit-selector__button'}"
            data-unit="fahrenheit"
            aria-pressed="${this.unit === 'fahrenheit' ? 'true' : 'false'}"
            ?disabled="${this.disabled}"
            @click="${this._selectUnit}"
          >
            °F
          </button>
        </div>
      </section>
    `;
  }

  /**
   * Gestiona la selección de una unidad de temperatura.
   *
   * No realiza ninguna acción si el componente está deshabilitado, si la unidad
   * recibida no es válida o si el usuario selecciona la unidad ya activa.
   *
   * @param {MouseEvent & { currentTarget: HTMLButtonElement }} event - Evento
   * de clic generado por uno de los botones de unidad.
   * @returns {void}
   *
   * @fires unit-change
   */
  _selectUnit(event) {
    if (this.disabled) {
      return;
    }

    const nextUnit = event.currentTarget.dataset.unit;

    /** @type {TemperatureUnit[]} */
    const validUnits = ['celsius', 'fahrenheit'];

    if (!validUnits.includes(nextUnit)) {
      return;
    }

    if (nextUnit === this.unit) {
      return;
    }

    /**
     * Evento emitido al seleccionar una nueva unidad de temperatura.
     *
     * @event unit-change
     * @type {CustomEvent<UnitChangeDetail>}
     * @property {UnitChangeDetail} detail - Información de la unidad seleccionada.
     * @property {boolean} bubbles - El evento se propaga por el árbol DOM.
     * @property {boolean} composed - El evento puede atravesar el Shadow DOM.
     */
    this.dispatchEvent(
      new CustomEvent('unit-change', {
        detail: {
          unit: nextUnit
        },
        bubbles: true,
        composed: true
      })
    );
  }
}

/**
 * Registra el componente personalizado si todavía no ha sido definido.
 */
if (!customElements.get('unit-selector')) {
  customElements.define('unit-selector', UnitSelector);
}