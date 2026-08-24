import { afterEach, describe, expect, it } from 'vitest';
import './unit-selector.js';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('unit-selector', () => {
  it('marca Celsius como la unidad activa cuando unit es celsius', async () => {
    const selector = document.createElement('unit-selector');

    selector.unit = 'celsius';

    document.body.append(selector);

    await selector.updateComplete;

    const celsiusButton = selector.shadowRoot.querySelector(
      '[data-unit="celsius"]'
    );

    const fahrenheitButton = selector.shadowRoot.querySelector(
      '[data-unit="fahrenheit"]'
    );

    expect(celsiusButton.getAttribute('aria-pressed')).toBe('true');
    expect(fahrenheitButton.getAttribute('aria-pressed')).toBe('false');
  });

  it('deshabilita los botones cuando disabled es true', async () => {
    const selector = document.createElement('unit-selector');

    selector.disabled = true;

    document.body.append(selector);

    await selector.updateComplete;

    const buttons = selector.shadowRoot.querySelectorAll('button');

    expect(buttons[0].disabled).toBe(true);
    expect(buttons[1].disabled).toBe(true);
  });
});