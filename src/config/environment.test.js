import { describe, expect, it } from 'vitest';
import { environment } from '@environment';

describe('environment', () => {
  it('uses the public Open-Meteo endpoints by default', () => {
    expect(environment.production).toBe(false);
    expect(environment.geocodingApiUrl).toBe(
      'https://geocoding-api.open-meteo.com/v1/search'
    );
    expect(environment.forecastApiUrl).toBe(
      'https://api.open-meteo.com/v1/forecast'
    );
    expect(environment.weatherApiKey).toBe('');
  });

  it('does not allow the configuration object to be mutated', () => {
    expect(Object.isFrozen(environment)).toBe(true);
  });
});
