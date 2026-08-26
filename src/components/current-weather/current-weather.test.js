import { afterEach, describe, expect, it } from 'vitest';
import './current-weather.js';

/**
 * Ciudad de prueba con la misma forma esperada por <current-weather>.
 *
 * @type {import('./current-weather.js').WeatherCity}
 */
const city = {
  id: '3688689',
  name: 'Bogotá',
  country: 'Colombia',
  admin1: 'Bogotá D.C.',
  label: 'Bogotá, Bogotá D.C., Colombia'
};

/**
 * Clima de prueba con la misma forma esperada por <current-weather>.
 *
 * @type {import('./current-weather.js').CurrentWeatherData}
 */
const weather = {
  temperature: 18,
  apparentTemperature: 16,
  humidity: 78,
  windSpeed: 11,
  condition: 'Mayormente despejado',
  iconKey: 'partly-cloudy-day',
  isDay: true
};

/**
 * Limpia el DOM simulado después de cada prueba q se haga
 *
 * Evita que una instancia creada por una prueba afecte la siguiente
 */
afterEach(() => {
  document.body.innerHTML = '';
});

/**
 * Pruebas públicas de <current-weather>.
 *
 * No se prueban métodos privados como _handleFavoriteToggle().
 * En su lugar, se simula el click real sobre el botón, como lo podría hacer una persona 
 */
describe('current-weather', () => {
  it('muestra los datos meteorológicos recibidos', async () => {
    const component = document.createElement('current-weather');

    component.city = city;
    component.weather = weather;
    component.unit = 'celsius';

    document.body.append(component);

    /**
     * Lit actualiza el DOM de forma asíncrona.
     * updateComplete espera hasta que el template ya se haya renderizado
     */
    await component.updateComplete;

    expect(component.shadowRoot.textContent).toContain(
      'Bogotá, Bogotá D.C., Colombia'
    );

    expect(component.shadowRoot.textContent).toContain('18°C');

    expect(component.shadowRoot.textContent).toContain(
      'Mayormente despejado'
    );

    expect(component.shadowRoot.textContent).toContain('16°C');
    expect(component.shadowRoot.textContent).toContain('78%');
    expect(component.shadowRoot.textContent).toContain('11 km/h');
  });

  it('emite favorite-toggle con la ciudad actual', async () => {
    const component = document.createElement('current-weather');

    component.city = city;
    component.weather = weather;

    document.body.append(component);

    await component.updateComplete;

    /**
     * Espera el evento público favorite-toggle.
     *
     * `once: true` elimina automáticamente el listener después de recibir
     * el primer evento, evitando la duplicación d listeners  o listenners innecesarios entre pruebas
     */
    const eventPromise = new Promise((resolve) => {
      component.addEventListener('favorite-toggle', resolve, {
        once: true
      });
    });

    /**
     * Se busca el botón dentro del Shadow DOM y se hace click d vdd
     *
     * Esto prueba el contrato público del componente ( x ahora no va a probar sus métodos privados) 
     */
    const favoriteButton = component.shadowRoot.querySelector(
      '.current-weather__favorite'
    );

    favoriteButton.click();

    const event = await eventPromise;

    expect(event.detail.city).toEqual(city);
    expect(event.bubbles).toBe(true);
    expect(event.composed).toBe(true);
  });

  it('muestra el estado vacío si faltan city o weather', async () => {
    const component = document.createElement('current-weather');

    document.body.append(component);

    await component.updateComplete;

    expect(component.shadowRoot.textContent).toContain(
      'Aún no hay información meteorológica para mostrar.'
    );
  });
});