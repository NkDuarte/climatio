import { afterEach, describe, expect, it } from 'vitest';
import './unit-selector.js';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('unit-selector', () => {
  it('emite unit-change con la unidad seleccionada', async () => {
    const selector = document.createElement('unit-selector');

    selector.unit = 'celsius';

    document.body.append(selector);

    await selector.updateComplete;

    const eventPromise = new Promise((resolve) => {
      selector.addEventListener('unit-change', resolve, { once: true });
    });

    const fahrenheitButton = selector.shadowRoot.querySelector(
      '[data-unit="fahrenheit"]'
    );

    fahrenheitButton.click();

    const event = await eventPromise;

    expect(event.detail.unit).toBe('fahrenheit');
    expect(event.bubbles).toBe(true);
    expect(event.composed).toBe(true);
  });

  it('no emite unit-change si está deshabilitado', async () => {
    const selector = document.createElement('unit-selector');

    selector.unit = 'celsius';
    selector.disabled = true;

    document.body.append(selector);

    await selector.updateComplete;

    let eventWasEmitted = false;

    selector.addEventListener('unit-change', () => {
      eventWasEmitted = true;
    });

    const fahrenheitButton = selector.shadowRoot.querySelector(
      '[data-unit="fahrenheit"]'
    );

    fahrenheitButton.click();

    expect(eventWasEmitted).toBe(false);
  });
});