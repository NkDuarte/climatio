import { environment } from '../config/environment.js';

const currentVariables = [
  'temperature_2m',
  'apparent_temperature',
  'relative_humidity_2m', //agregué esta 
  'wind_speed_10m',
  'weather_code',
  'is_day'
];

const dailyVariables = [
  'weather_code',
  'temperature_2m_max',
  'temperature_2m_min'
];

export class WeatherApiError extends Error {
  constructor(message) {
    super(message);
    this.name = 'WeatherApiError';
  }
}

const addApiKey = (url) => {
  if (environment.weatherApiKey) {
    url.searchParams.set('apikey', environment.weatherApiKey);
  }

  return url;
};

export const buildGeocodingUrl = (query) => {
  const url = new URL(environment.geocodingApiUrl);
  url.search = new URLSearchParams({
    name: query,
    count: '1',
    language: 'es',
    format: 'json'
  }).toString();

  return addApiKey(url);
};

export const buildForecastUrl = (city, unit) => {
  const url = new URL(environment.forecastApiUrl);
  url.search = new URLSearchParams({
    latitude: String(city.latitude),
    longitude: String(city.longitude),
    current: currentVariables.join(','),
    daily: dailyVariables.join(','),
    temperature_unit: unit,
    wind_speed_unit: 'kmh',
    timezone: 'auto',
    forecast_days: '5'
  }).toString();

  return addApiKey(url);
};

/**
 * Traduce el código meteorológico de Open-Meteo a datos de presentación.
 *
 * Bueno y aqui iconKey ya usa valores compatibles con los estilos de current-weather
 * y forecast-strip.
 *
 * @param {number} weatherCode Código WMO entregado por Open-Meteo.
 * @param {boolean} [isDay=true] Indica si el clima actual ocurre de día.
 * @returns {{ condition: string, iconKey: string }}
 */
export const describeWeatherCode = (weatherCode, isDay = true) => {
  const clearIcon = isDay ? 'clear-day' : 'clear-night';
  const partlyCloudyIcon = isDay
    ? 'partly-cloudy-day'
    : 'partly-cloudy-night';

  const conditions = {
    0: ['Despejado', clearIcon],
    1: ['Mayormente despejado', partlyCloudyIcon],
    2: ['Parcialmente nublado', partlyCloudyIcon],
    3: ['Nublado', 'cloudy'],
    45: ['Niebla', 'fog'],
    48: ['Niebla con escarcha', 'fog'],
    51: ['Llovizna ligera', 'rain'],
    53: ['Llovizna moderada', 'rain'],
    55: ['Llovizna intensa', 'rain'],
    61: ['Lluvia ligera', 'rain'],
    63: ['Lluvia moderada', 'rain'],
    65: ['Lluvia intensa', 'rain'],
    71: ['Nieve ligera', 'snow'],
    73: ['Nieve moderada', 'snow'],
    75: ['Nieve intensa', 'snow'],
    80: ['Chubascos ligeros', 'rain'],
    81: ['Chubascos moderados', 'rain'],
    82: ['Chubascos intensos', 'rain'],
    95: ['Tormenta', 'storm'],
    96: ['Tormenta con granizo', 'storm'],
    99: ['Tormenta con granizo intenso', 'storm']
  };

  const [condition, iconKey] = conditions[weatherCode] ?? [
    'Condición desconocida',
    'unknown'
  ];

  return { condition, iconKey };
};

const requestJson = async (url, signal) => {
  const response = await fetch(url, { signal });

  if (response.status === 429) {
    throw new WeatherApiError('Open-Meteo está recibiendo demasiadas solicitudes. Intenta de nuevo en unos minutos.');
  }

  if (!response.ok) {
    throw new WeatherApiError('No fue posible consultar Open-Meteo. Intenta de nuevo.');
  }

  return response.json();
};

const normalizeCity = (result) => {
  if (!result || !Number.isFinite(result.latitude) || !Number.isFinite(result.longitude)) {
    throw new WeatherApiError('La ciudad encontrada no tiene coordenadas válidas.');
  }

  const locationParts = [result.name, result.admin1, result.country].filter(Boolean);

  return {
    id: String(result.id),
    name: result.name,
    country: result.country ?? '',
    admin1: result.admin1 ?? null,
    latitude: result.latitude,
    longitude: result.longitude,
    timezone: result.timezone ?? 'auto',
    label: locationParts.join(', ')
  };
};

const normalizeForecast = (daily) => {
  const { time, weather_code: weatherCodes, temperature_2m_max: max, temperature_2m_min: min } = daily ?? {};

  if (!Array.isArray(time) || !Array.isArray(weatherCodes) || !Array.isArray(max) || !Array.isArray(min) || time.length < 5 || weatherCodes.length < 5 || max.length < 5 || min.length < 5) {
    throw new WeatherApiError('El pronóstico recibido está incompleto. Intenta de nuevo.');
  }

  return time.slice(0, 5).map((date, index) => {
    const weather = describeWeatherCode(weatherCodes[index]);
    return {
      date,
      label: new Intl.DateTimeFormat('es-CO', {
        weekday: 'short',
        day: 'numeric'
      }).format(new Date(`${date}T12:00:00`)),
      max: max[index],
      min: min[index],
      weatherCode: weatherCodes[index],
      ...weather
    };
  });
};

/**
 * Convierte el objeto current de Open-Meteo a lo q consume
 * <current-weather>.
 *
 * @param {object} current Datos crudos de Open-Meteo.
 * @returns {object} Datos meteorológicos normalizados.
 * @throws {WeatherApiError} Si faltan datos esenciales
 */
const normalizeCurrentWeather = (current) => {
  const requiredValues = [
    current?.temperature_2m,
    current?.apparent_temperature,
    current?.relative_humidity_2m, 
    current?.wind_speed_10m,
    current?.weather_code,
    current?.is_day
  ];

  if (!requiredValues.every(Number.isFinite)) {
    throw new WeatherApiError(
      'El clima actual recibido está incompleto. Intenta de nuevo.'
    );
  }

  const weather = describeWeatherCode(
    current.weather_code,
    current.is_day === 1
  );

  return {
    temperature: current.temperature_2m,
    apparentTemperature: current.apparent_temperature,
    humidity: current.relative_humidity_2m, //le agregué esta
    windSpeed: current.wind_speed_10m,
    weatherCode: current.weather_code,
    isDay: current.is_day === 1,
    ...weather
  };
};

export async function loadWeatherForCity(city, { unit = 'celsius', signal } = {}) {
  const normalizedCity = typeof city === 'string'
    ? await resolveCity(city, signal)
    : city;
  const forecastResponse = await requestJson(buildForecastUrl(normalizedCity, unit), signal);

  return {
    city: normalizedCity,
    current: normalizeCurrentWeather(forecastResponse.current),
    forecast: normalizeForecast(forecastResponse.daily),
    unit
  };
}

async function resolveCity(query, signal) {
  const response = await requestJson(buildGeocodingUrl(query), signal);

  if (!Array.isArray(response.results) || response.results.length === 0) {
    throw new WeatherApiError('No encontramos una ciudad con ese nombre.');
  }

  return normalizeCity(response.results[0]);
}