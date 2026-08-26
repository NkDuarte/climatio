import { LitElement, html, unsafeCSS } from 'lit';
import styles from './city-search.scss?inline';

export class CitySearch extends LitElement {
  static properties = {
    value: { type: String },
    disabled: { type: Boolean },
    _validationMessage: { state: true }
  };

  static styles = unsafeCSS(styles);

  constructor() {
    super();
    this.value = '';
    this.disabled = false;
    this._validationMessage = '';
  }

  render() {
    return html`
      <form class="search" @submit=${this._submit}>
        <label for="city">Buscar ciudad</label>
        <div class="search__controls">
          <input
            id="city"
            name="city"
            type="search"
            placeholder="Bogotá, Lima, Madrid..."
            autocomplete="address-level2"
            .value=${this.value}
            ?disabled=${this.disabled}
          />
          <button type="submit" ?disabled=${this.disabled}>Consultar</button>
        </div>
        ${this._validationMessage
          ? html`<p class="search__message" role="alert">${this._validationMessage}</p>`
          : ''}
      </form>
    `;
  }

  _submit(event) {
    event.preventDefault();
    const input = event.currentTarget.elements.city;
    const query = input.value.trim();

    if (!query) {
      this._validationMessage = 'Escribe una ciudad para continuar.';
      return;
    }

    this.value = query;
    this._validationMessage = '';
    this.dispatchEvent(new CustomEvent('city-search', {
      detail: { query },
      bubbles: true,
      composed: true
    }));
  }
}

if (!customElements.get('city-search')) {
  customElements.define('city-search', CitySearch);
}