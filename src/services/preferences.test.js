import { afterEach, describe, expect, it } from 'vitest';
import { loadPreferences, savePreferences } from './preferences.js';

afterEach(() => {
  window.localStorage.clear();
});

describe('preferences', () => {
  it('restaura la unidad y las ciudades favoritas guardadas', () => {
    const favorites = [{ id: '3688689', name: 'Bogotá' }];

    savePreferences({ unit: 'fahrenheit', favorites });

    expect(loadPreferences()).toEqual({ unit: 'fahrenheit', favorites });
  });

  it('usa preferencias predeterminadas ante almacenamiento corrupto', () => {
    window.localStorage.setItem('climavivo-preferences', '{invalido');

    expect(loadPreferences()).toEqual({
      unit: 'celsius',
      favorites: []
    });
  });
});