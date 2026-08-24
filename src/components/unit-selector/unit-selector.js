import { LitElement, html, unsafeCSS } from 'lit';
import styles from './unit-selector.scss?inline';

export class UnitSelector extends LitElement {
  static properties = {
    unit: { type: String },
    disabled: { type: Boolean }
  };

  static styles = unsafeCSS(styles);

  constructor() {
    super();

    this.unit = 'celsius';
    this.disabled = false;
  }

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
          >
            °F
          </button>
        </div>
      </section>
    `;
  }
}

if (!customElements.get('unit-selector')) {
  customElements.define('unit-selector', UnitSelector);
}