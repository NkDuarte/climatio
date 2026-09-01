import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import './weather-dashboard.js';

const cityResponse = {
  results: [{
    id: 3117735,
    name: 'Madrid',
    country: 'España',
    admin1: 'Comunidad de Madrid',
    latitude: 40.4165,
    longitude: -3.7026,
    timezone: 'Europe/Madrid'
  }]
};

const forecastResponse = {
  current: {
    temperature_2m: 22,
    apparent_temperature: 21,
    relative_humidity_2m: 57,
    wind_speed_10m: 10,
    weather_code: 2,
    is_day: 1
  },
  daily: {
    time: ['2026-08-26', '2026-08-27', '2026-08-28', '2026-08-29', '2026-08-30'],
    weather_code: [2, 3, 61, 0, 95],
    temperature_2m_max: [28, 29, 24, 27, 25],
    temperature_2m_min: [17, 18, 16, 15, 14]
  }
};

beforeEach(() => {
  window.localStorage.clear();
  vi.stubGlobal('fetch', vi.fn((url) => Promise.resolve({
    ok: true,
    status: 200,
    json: async () => url.pathname.endsWith('/search') ? cityResponse : forecastResponse
  })));
});

afterEach(() => {
  document.body.innerHTML = '';
  window.localStorage.clear();
  vi.unstubAllGlobals();
});

describe('weather-dashboard', () => {
  it('recibe la búsqueda de city-search y la refleja en su estado', async () => {
    const dashboard = document.createElement('weather-dashboard');
    document.body.append(dashboard);
    await dashboard.updateComplete;

    const search = dashboard.shadowRoot.querySelector('city-search');
    search.dispatchEvent(new CustomEvent('city-search', {
      detail: { query: 'Madrid' },
      bubbles: true,
      composed: true
    }));

    await vi.waitFor(() => expect(dashboard._selectedCity?.name).toBe('Madrid'));
    await dashboard.updateComplete;

    expect(dashboard.city).toBe('Madrid');
    expect(dashboard._currentWeather.temperature).toBe(22);
    expect(
      dashboard.shadowRoot.querySelector('current-weather').city.name
    ).toBe('Madrid');
    expect(
      dashboard.shadowRoot.querySelector('.dashboard').classList.contains('dashboard--cloudy')
    ).toBe(true);
  });

  it('actualiza la unidad al recibir unit-change', async () => {
    const dashboard = document.createElement('weather-dashboard');
    document.body.append(dashboard);
    await dashboard.updateComplete;

    dashboard.shadowRoot.querySelector('unit-selector').dispatchEvent(
      new CustomEvent('unit-change', {
        detail: { unit: 'fahrenheit' },
        bubbles: true,
        composed: true
      })
    );

    await dashboard.updateComplete;

    expect(dashboard.unit).toBe('fahrenheit');
  });

  it('guarda y elimina favoritas a partir de los eventos públicos', async () => {
    const dashboard = document.createElement('weather-dashboard');
    document.body.append(dashboard);

    await vi.waitFor(() => expect(dashboard._selectedCity?.name).toBe('Madrid'));

    const city = dashboard._selectedCity;
    dashboard.shadowRoot.querySelector('current-weather').dispatchEvent(
      new CustomEvent('favorite-toggle', {
        detail: { city },
        bubbles: true,
        composed: true
      })
    );

    await dashboard.updateComplete;

    expect(dashboard._favorites).toEqual([city]);
    expect(dashboard.shadowRoot.querySelector('saved-cities').cities).toEqual([city]);

    dashboard.shadowRoot.querySelector('saved-cities').dispatchEvent(
      new CustomEvent('city-remove', {
        detail: { cityId: city.id },
        bubbles: true,
        composed: true
      })
    );

    await dashboard.updateComplete;

    expect(dashboard._favorites).toEqual([]);
  });
});