import { LitElement, html } from 'lit';

class WeatherDashboard extends LitElement {
  static properties = {
    ciudad: { type: String }
  };

  constructor() {
    super();
    this.ciudad = 'Bogotá';
  }

  render() {
    return html`
      <section>
        <h1>ClimaVivo</h1>
        <p>Busca una ciudad para consultar su pronóstico.</p>
        <p>Ciudad actual: ${this.ciudad}</p>
      </section>
    `;
  }
}

customElements.define('weather-dashboard', WeatherDashboard);