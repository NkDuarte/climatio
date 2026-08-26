import { afterEach, describe, expect, it } from 'vitest';
import './forecast-strip.js';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('forecast-strip', () => {
  it('muestra un estado vacío cuando no recibe pronóstico', async () => {
    const component = document.createElement('forecast-strip');

    document.body.append(component);

    await component.updateComplete;

    expect(component.shadowRoot.textContent).toContain(
      'No hay pronóstico disponible.'
    );
  });

  it('renderiza una tarjeta por cada día recibido', async () => {
    const component = document.createElement('forecast-strip');

    component.forecast = [
      {
        date: '2026-06-21',
        label: 'sáb 21',
        max: 21,
        min: 13,
        condition: 'Lluvia ligera',
        iconKey: 'rain'
      },
      {
        date: '2026-06-22',
        label: 'dom 22',
        max: 23,
        min: 14,
        condition: 'Nublado',
        iconKey: 'cloudy'
      }
    ];

    document.body.append(component);

    await component.updateComplete;

    const days = component.shadowRoot.querySelectorAll(
      '.forecast-strip__day'
    );

    expect(days.length).toBe(2);
    expect(component.shadowRoot.textContent).toContain('Lluvia ligera');
    expect(component.shadowRoot.textContent).toContain('Nublado');
    expect(days[0].style.getPropertyValue('--forecast-index')).toBe('0');
    expect(days[1].style.getPropertyValue('--forecast-index')).toBe('1');
    expect(days[0].querySelectorAll('.forecast-strip__rain span')).toHaveLength(3);
  });
});