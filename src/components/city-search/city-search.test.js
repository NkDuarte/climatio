import { afterEach, describe, expect, it } from 'vitest';
import './city-search.js';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('city-search', () => {
  it('emite el texto limpio con un evento compuesto', async () => {
    const search = document.createElement('city-search');
    document.body.append(search);
    await search.updateComplete;

    const eventPromise = new Promise((resolve) => {
      search.addEventListener('city-search', resolve, { once: true });
    });
    const input = search.shadowRoot.querySelector('input');
    input.value = '  Bogotá  ';
    search.shadowRoot.querySelector('form').requestSubmit();

    const event = await eventPromise;
    expect(event.detail).toEqual({ query: 'Bogotá' });
    expect(event.bubbles).toBe(true);
    expect(event.composed).toBe(true);
  });

  it('no emite si el texto está vacío', async () => {
    const search = document.createElement('city-search');
    document.body.append(search);
    await search.updateComplete;
    let emitted = false;
    search.addEventListener('city-search', () => { emitted = true; });

    search.shadowRoot.querySelector('form').requestSubmit();

    expect(emitted).toBe(false);
    expect(search._validationMessage).toBeTruthy();
  });
});