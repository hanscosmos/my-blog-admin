<template>
  <div class="h-full px-4 py-2.5 flex flex-col justify-between overflow-hidden">
    <div class="flex items-start justify-between gap-2">
      <div class="min-w-0">
        <el-tooltip :content="locationTooltip" placement="top">
          <div
            class="flex items-center gap-1 text-xs text-gray-500 cursor-pointer w-fit"
            @click="reload"
          >
            <AppIcon name="local" :size="12" />
            <span class="truncate">{{ displayName }}</span>
            <AppIcon name="refresh" :size="10" class="opacity-60" />
          </div>
        </el-tooltip>
        <div class="mt-1 flex items-end gap-2">
          <span class="text-3xl leading-none font-beauty">{{ temperature }}</span>
          <span class="text-xs text-gray-500 mb-0.5 truncate">
            {{ description }}
          </span>
        </div>
      </div>
      <el-tooltip :content="forecastTooltip" placement="top">
        <div
          class="xy-center w-11 h-11 rounded-full flex-shrink-0"
          :style="{ backgroundColor: iconBgColor }"
        >
          <AppIcon :name="weatherIcon" :size="26" :color="systemColor" />
        </div>
      </el-tooltip>
    </div>
    <div class="flex items-center justify-between gap-2 text-xs text-gray-500">
      <span>{{ todayRange }}</span>
      <span>湿度 {{ humidity }}</span>
      <span v-if="weather?.stale" class="flex items-center gap-0.5">
        <AppIcon name="time" :size="10" />
        缓存数据
      </span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { useSystemStore } from '@/store/system';
import { toRgba } from '@/utils/tool';
import { useWeather } from '../hooks/useWeather';

const { systemColor } = storeToRefs(useSystemStore());
const { weather, locating, reload } = useWeather();

const iconBgColor = computed(() => toRgba(systemColor.value, 0.12));

const current = computed(() => weather.value?.current ?? null);

const displayName = computed(() => {
  if (weather.value?.location.displayName) {
    return weather.value.location.displayName;
  }
  return locating.value ? '定位中…' : '定位失败';
});

const temperature = computed(() =>
  current.value?.temperature == null ? '--' : `${current.value.temperature}°C`
);

const description = computed(
  () => current.value?.description || (locating.value ? '正在获取位置' : '')
);

const todayRange = computed(() => {
  const today = weather.value?.today;
  if (today?.min == null || today?.max == null) return '--';
  return `${today.min}°~${today.max}°`;
});

const humidity = computed(() =>
  current.value?.humidity == null ? '--' : `${current.value.humidity}%`
);

const RAIN_CODES = [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82];
const SNOW_CODES = [71, 73, 75, 77, 85, 86];
const THUNDER_CODES = [95, 96, 99];

const resolveWeatherIcon = (code?: number | null, isDay = true) => {
  if (code == null) return isDay ? 'sunny' : 'moon';
  if (THUNDER_CODES.includes(code)) return 'thunderstorm';
  if (SNOW_CODES.includes(code)) return 'snow';
  if (RAIN_CODES.includes(code)) return 'umbrella';
  if ([45, 48].includes(code)) return 'fog';
  if (code === 3) return 'cloudy';
  if (code === 2) return isDay ? 'cloudy' : 'cloudy-night';
  return isDay ? 'sunny' : 'moon';
};

const weatherIcon = computed(() =>
  resolveWeatherIcon(current.value?.weatherCode, current.value?.isDay)
);

const forecastTooltip = computed(() => {
  const tomorrow = weather.value?.tomorrow;
  const parts: string[] = [];
  if (current.value?.apparentTemperature != null) {
    parts.push(`体感 ${current.value.apparentTemperature}°C`);
  }
  if (current.value?.windSpeed != null) {
    parts.push(`风速 ${current.value.windSpeed}km/h`);
  }
  if (tomorrow?.min != null && tomorrow?.max != null) {
    parts.push(`明日 ${tomorrow.description} ${tomorrow.min}°~${tomorrow.max}°`);
  }
  return parts.join(' · ') || '天气数据加载中';
});

const sourceLabel: Record<WeatherLocationType['source'], string> = {
  gps: '基于浏览器定位',
  ip: '基于 IP 粗略定位',
  server: '基于服务器所在位置',
  none: '定位失败',
};

const locationTooltip = computed(() => {
  const location = weather.value?.location;
  const parts = [sourceLabel[location?.source ?? 'none']];
  if (weather.value?.updatedAt) {
    parts.push(`更新于 ${weather.value.updatedAt}`);
  }
  if (weather.value?.stale) {
    parts.push('数据可能延迟');
  }
  return `${parts.join(' · ')}（点击重新定位）`;
});
</script>

<style lang="scss" scoped></style>
