import { useDocumentVisibility, useIntervalFn } from '@vueuse/core';
import { getWeatherApi } from '@/api/system/sys';

const LOCATION_TIMEOUT = 8000;
const LOCATION_MAX_AGE = 30 * 60 * 1000;
const WEATHER_REFRESH_INTERVAL = 30 * 60 * 1000;

type CoordinateType = {
  latitude: number;
  longitude: number;
};

/** 区县级展示无需过高精度，约 1.1km 精度即可 */
const roundCoordinate = (value: number) => Math.round(value * 100) / 100;

const getCurrentCoordinate = (force = false) =>
  new Promise<CoordinateType | null>((resolve) => {
    if (!('geolocation' in navigator)) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: roundCoordinate(position.coords.latitude),
          longitude: roundCoordinate(position.coords.longitude),
        });
      },
      () => resolve(null),
      {
        enableHighAccuracy: false,
        timeout: LOCATION_TIMEOUT,
        maximumAge: force ? 0 : LOCATION_MAX_AGE,
      }
    );
  });

export const useWeather = () => {
  const weather = ref<WeatherInfoType | null>(null);
  const loading = ref(false);
  const locating = ref(false);

  const fetchWeather = async (force = false) => {
    if (loading.value) return;
    loading.value = true;
    locating.value = true;
    try {
      const coordinate = await getCurrentCoordinate(force);
      locating.value = false;

      const { data } = await getWeatherApi(
        coordinate ? { ...coordinate, force } : { force }
      );
      weather.value = data;
    } catch (err) {
      console.error('获取天气失败:', err);
    } finally {
      loading.value = false;
      locating.value = false;
    }
  };

  const visibility = useDocumentVisibility();
  const { pause } = useIntervalFn(
    () => {
      if (visibility.value === 'visible') {
        fetchWeather();
      }
    },
    WEATHER_REFRESH_INTERVAL,
    { immediate: false }
  );

  const reload = () => fetchWeather(true);

  onMounted(() => fetchWeather());
  onUnmounted(() => pause());

  return { weather, loading, locating, reload };
};
