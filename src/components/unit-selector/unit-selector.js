import { LitElement, html, unsafeCSS } from 'lit';
import styles from './unit-selector.scss?inline';

/**
 * Unidades de temperatura permitidas en ClimaVivo.
 *
 * @typedef {'celsius' | 'fahrenheit'} TemperatureUnit
 */

/**
 * Evento público emitido cuando la persona selecciona una unidad diferente.
 *
 * @typedef {CustomEvent<{ unit: TemperatureUnit }>} UnitChangeEvent
 */

/**
 * Selector visual de unidades de temperatura.
 *
 * Este componente es controlado por <weather-dashboard>:
 *
 * 1. Recibe la unidad actual mediante la propiedad pública `unit`.
 * 2. Muestra qué botón está activo.
 * 3. Emite `unit-change` cuando el usuario elige otra unidad.
 * 4. No hace fetch ni modifica directamente el estado del dashboard.
 *
 * @element unit-selector
 * @fires unit-change
 */
export class UnitSelector extends LitElement {
  /**
   * Propiedades públicas reactivas.
   *
   * `unit` llega desde <weather-dashboard>.
   * `disabled` permite bloquear temporalmente los botones durante una carga.
   */
  static properties = {
    unit: { type: String },
    disabled: { type: Boolean }
  };

  /**
   * Estilos encapsulados del componente.
   *
   * Vite procesa el archivo SCSS y `?inline` lo entrega como string.
   * unsafeCSS permite a Lit aplicar ese string dentro del Shadow DOM.
   */
  static styles = unsafeCSS(styles);

  constructor() {
    super();

    /**
     * Unidad seleccionada actualmente.
     *
     * @type {TemperatureUnit}
     */
    this.unit = 'celsius';

    /**
     * Indica si los botones deben estar deshabilitados.
     *
     * @type {boolean}
     */
    this.disabled = false;
  }

  /**
   * Renderiza el selector segmentado de Celsius y Fahrenheit.
   *
   * La clase activa, aria-pressed y disabled dependen de propiedades
   * reactivas. Si el dashboard cambia `unit`, Lit actualiza la vista.
   *
   * @returns {import('lit').TemplateResult}
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
            class=${this.unit === 'celsius'
              ? 'unit-selector__button unit-selector__button--active'
              : 'unit-selector__button'}
            data-unit="celsius"
            aria-pressed=${this.unit === 'celsius' ? 'true' : 'false'}
            ?disabled=${this.disabled}
            @click=${this._selectUnit}
          >
            °C
          </button>

          <button
            type="button"
            class=${this.unit === 'fahrenheit'
              ? 'unit-selector__button unit-selector__button--active'
              : 'unit-selector__button'}
            data-unit="fahrenheit"
            aria-pressed=${this.unit === 'fahrenheit' ? 'true' : 'false'}
            ?disabled=${this.disabled}
            @click=${this._selectUnit}
          >
            °F
          </button>
        </div>
      </section>
    `;
  }

  /**
   * Gestiona el clic en un botón de unidad.
   *
   * El componente no cambia directamente `this.unit`, porque el dueño
   * del estado global es <weather-dashboard>. En su lugar emite un evento
   * público para que el dashboard actualice el estado y vuelva a enviar
   * la propiedad `unit` al selector.
   *
   * @param {MouseEvent} event Evento click originado en un botón.
   * @returns {void}
   */
  _selectUnit(event) {
    if (this.disabled) {
      return;
    }

    const button = event.currentTarget;

    if (!(button instanceof HTMLButtonElement)) {
      return;
    }

    const nextUnit = button.dataset.unit;

    /**
     * @type {TemperatureUnit[]}
     */
    const validUnits = ['celsius', 'fahrenheit'];

    if (
      !nextUnit ||
      !validUnits.includes(/** @type {TemperatureUnit} */ (nextUnit))
    ) {
      return;
    }

    if (nextUnit === this.unit) {
      return;
    }

    /**
     * El evento debe usar bubbles y composed para poder atravesar el
     * Shadow DOM y llegar al listener delegado de <weather-dashboard>.
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
 * Evita registrar dos veces el mismo Custom Element durante desarrollo
 * con Vite o durante pruebas de Vitest.
 */
if (!customElements.get('unit-selector')) {
  customElements.define('unit-selector', UnitSelector);
}