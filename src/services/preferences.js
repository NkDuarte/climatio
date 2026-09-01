const STORAGE_KEY = 'climavivo-preferences';

const defaultPreferences = () => ({
  unit: 'celsius',
  favorites: []
});

export const loadPreferences = () => {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return defaultPreferences();
    }

    const preferences = JSON.parse(stored);
    const unit = preferences?.unit === 'fahrenheit' ? 'fahrenheit' : 'celsius';
    const favorites = Array.isArray(preferences?.favorites)
      ? preferences.favorites.filter((city) => city && typeof city.id === 'string')
      : [];

    return { unit, favorites };
  } catch {
    return defaultPreferences();
  }
};

export const savePreferences = ({ unit, favorites }) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
      unit: unit === 'fahrenheit' ? 'fahrenheit' : 'celsius',
      favorites: Array.isArray(favorites) ? favorites : []
    }));
  } catch {
    // La aplicación sigue funcionando aunque el almacenamiento no esté disponible.
  }
};