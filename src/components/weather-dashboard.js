import { LitElement, html } from 'lit';

class WeatherDashboard extends LitElement {
  static properties = {
    // Propiedades públicas: pueden configurarse desde fuera.
    ciudad: { type: String },
    unidades: { type: String },

    // Estado interno: lo administra el dashboard.
    _cargando: { state: true },
    _error: { state: true },
    _pronostico: { state: true }
  };

  constructor() {
    super();

    // Valores públicos iniciales x ahora: 
    this.ciudad = 'Bogotá';
    this.unidades = 'celsius';

    // Estado interno inicial:
    this._cargando = false;
    this._error = null;
    this._pronostico = [];
  }

  render() {
    return html`
      <section>
        <h1>ClimaVivo</h1>

        <p>
          Busca una ciudad para consultar su pronóstico.
        </p>

        <p>Ciudad actual: ${this.ciudad}</p>

        <p>Unidad seleccionada: ${this.unidades}</p>

        ${this._cargando
          ? html`<p>Cargando información meteorológica...</p>`
          : ''
        }

        ${this._error
          ? html`<p>Error: ${this._error}</p>`
          : ''
        }

        ${!this._cargando && !this._error
          ? html`<p>Listo para consultar el clima.</p>`
          : ''
        }
      </section>
    `;
  }
}

customElements.define('weather-dashboard', WeatherDashboard);