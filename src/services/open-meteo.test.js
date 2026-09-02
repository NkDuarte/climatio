import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  WeatherApiError,
  buildGeocodingUrl,
  describeWeatherCode,
  loadWeatherForCity
} from './open-meteo.js';

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

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('open-meteo', () => {
  it('construye una URL de geocodificación codificada y sin API key', () => {
    const url = buildGeocodingUrl('Bogotá & Madrid');

    expect(url.searchParams.get('name')).toBe('Bogotá & Madrid');
    expect(url.searchParams.has('apikey')).toBe(false);
  });

  it('traduce códigos WMO y no interpreta un código desconocido como despejado', () => {
    expect(describeWeatherCode(61)).toMatchObject({
      condition: 'Lluvia ligera',
      iconKey: 'rain'
    });
    expect(describeWeatherCode(999)).toMatchObject({
      condition: 'Condición desconocida',
      iconKey: 'unknown'
    });
  });

  it('comparte la misma AbortSignal entre geocodificación y pronóstico', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => cityResponse })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => forecastResponse });
    vi.stubGlobal('fetch', fetchMock);
    const controller = new AbortController();

    const weather = await loadWeatherForCity('Madrid', {
      unit: 'fahrenheit',
      signal: controller.signal
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][1].signal).toBe(controller.signal);
    expect(fetchMock.mock.calls[1][1].signal).toBe(controller.signal);
    expect(weather.city.label).toBe('Madrid, Comunidad de Madrid, España');
    expect(weather.current.temperature).toBe(22);
    expect(weather.forecast).toHaveLength(5);
    expect(weather.unit).toBe('fahrenheit');
  });

  it('rechaza un pronóstico diario incompleto de forma controlada', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => cityResponse })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ ...forecastResponse, daily: { time: [] } })
      });
    vi.stubGlobal('fetch', fetchMock);

    await expect(loadWeatherForCity('Madrid')).rejects.toBeInstanceOf(WeatherApiError);
  });
});