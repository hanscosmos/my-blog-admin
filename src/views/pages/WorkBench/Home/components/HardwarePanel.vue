<template>
  <div
    class="h-full px-4 py-2.5 flex flex-col justify-between overflow-hidden"
    :title="hostTooltip"
  >
    <div v-if="hardware && !hardware.available" class="text-xs text-gray-500">
      硬件信息暂不可用
    </div>
    <div v-else class="flex flex-col gap-2">
      <div v-for="metric in metrics" :key="metric.key">
        <div class="flex items-center justify-between text-xs leading-4">
          <span class="flex items-center gap-1 text-gray-500">
            <AppIcon :name="metric.icon" :size="12" />
            {{ metric.label }}
          </span>
          <span>{{ metric.percent == null ? '--' : `${metric.percent}%` }}</span>
        </div>
        <div class="metric-track mt-0.5">
          <div
            class="metric-fill"
            :style="{
              width: `${metric.percent ?? 0}%`,
              backgroundColor: metric.color,
            }"
          ></div>
        </div>
      </div>
    </div>
    <div class="flex items-center justify-between gap-2 text-xs text-gray-500">
      <el-tooltip :content="diskTooltip" placement="top">
        <span>磁盘 {{ diskPercent }}</span>
      </el-tooltip>
      <span>运行 {{ uptimeText }}</span>
      <span v-if="hardware?.battery" class="flex items-center gap-1">
        <AppIcon
          :name="hardware.battery.charging ? 'battery-working' : 'battery-full'"
          :size="12"
        />
        {{ hardware.battery.percent }}%
      </span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useDocumentVisibility, useIntervalFn } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { getHardwareApi } from '@/api/system/sys';
import { useSystemStore } from '@/store/system';

const HARDWARE_REFRESH_INTERVAL = 10 * 1000;

const { systemColor } = storeToRefs(useSystemStore());

const hardware = ref<HardwareInfoType | null>(null);
const loading = ref(false);

const barColor = (percent?: number | null) => {
  if (percent == null) return 'var(--sys-border-color)';
  if (percent >= 90) return '#ef4444';
  if (percent >= 80) return '#f59e0b';
  return systemColor.value;
};

const metrics = computed(() => [
  {
    key: 'cpu',
    label: 'CPU',
    icon: 'cpu',
    percent: hardware.value?.cpu.percent ?? null,
    color: barColor(hardware.value?.cpu.percent),
  },
  {
    key: 'memory',
    label: '内存',
    icon: 'memory',
    percent: hardware.value?.memory.percent ?? null,
    color: barColor(hardware.value?.memory.percent),
  },
]);

const diskPercent =
  hardware.value?.disk.percent == null ? '--' : `${hardware.value.disk.percent}%`;

const formatBytes = (bytes?: number | null) => {
  if (bytes == null || bytes <= 0) return '--';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let index = 0;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  const digits = value >= 10 || index === 0 ? 0 : 1;
  return `${value.toFixed(digits)}${units[index]}`;
};

const formatUptime = (seconds?: number | null) => {
  if (seconds == null) return '--';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}天${hours}时`;
  if (hours > 0) return `${hours}时${minutes}分`;
  return `${minutes}分`;
};

const uptimeText = computed(() =>
  formatUptime(hardware.value?.uptimeSeconds)
);

const diskTooltip = computed(() => {
  const disk = hardware.value?.disk;
  if (disk?.used == null || disk?.total == null) return '磁盘信息不可用';
  return `已用 ${formatBytes(disk.used)} / 共 ${formatBytes(disk.total)}`;
});

const hostTooltip = computed(() => {
  const info = hardware.value;
  if (!info) return '';
  return [
    info.hostname,
    info.os,
    info.arch,
    info.cpu.model,
    `${info.cpu.cores} 核`,
  ]
    .filter(Boolean)
    .join(' · ');
});

const fetchHardware = async () => {
  if (loading.value) return;
  loading.value = true;
  try {
    const { data } = await getHardwareApi();
    hardware.value = data;
  } catch (err) {
    console.error('获取硬件信息失败:', err);
  } finally {
    loading.value = false;
  }
};

const visibility = useDocumentVisibility();
const { pause } = useIntervalFn(
  () => {
    if (visibility.value === 'visible') {
      fetchHardware();
    }
  },
  HARDWARE_REFRESH_INTERVAL,
  { immediate: false }
);

watch(visibility, (value) => {
  if (value === 'visible') {
    fetchHardware();
  }
});

onMounted(() => fetchHardware());
onUnmounted(() => pause());
</script>

<style lang="scss" scoped>
.metric-track {
  height: 4px;
  border-radius: 999px;
  overflow: hidden;
  background-color: var(--sys-border-color);
}

.metric-fill {
  height: 100%;
  border-radius: 999px;
  transition:
    width 0.3s ease,
    background-color 0.3s ease;
}
</style>
