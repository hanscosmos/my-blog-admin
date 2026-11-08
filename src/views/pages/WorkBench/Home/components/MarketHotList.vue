<template>
  <div class="hot-list">
    <p class="hot-list-title">{{ source.name }}</p>
    <div class="hot-list-body">
      <a v-for="item in source.items" :key="`${source.key}-${item.rank}`" :href="item.url || undefined" target="_blank"
        rel="noopener noreferrer" class="hot-item">
        <span class="hot-rank" :class="rankClass(item.rank)">{{ item.rank }}</span>
        <span class="hot-title">{{ item.title }}</span>
        <span v-if="item.tag" class="hot-tag">{{ item.tag }}</span>
        <span v-if="item.hot" class="hot-score">{{ formatHot(item.hot) }}</span>
      </a>
      <div v-if="!source.items.length" class="hot-empty">暂无数据</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { MarketHotSourceType } from '@/api/market/type';

defineProps<{ source: MarketHotSourceType }>();

const rankClass = (rank: number) => {
  if (rank === 1) return 'is-first';
  if (rank === 2) return 'is-second';
  if (rank === 3) return 'is-third';
  return '';
};

const formatHot = (value: number) => {
  if (value >= 100000000) return `${(value / 100000000).toFixed(1)}亿`;
  if (value >= 10000) return `${(value / 10000).toFixed(1)}万`;
  return String(value);
};
</script>

<style lang="scss" scoped>
.hot-list {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.hot-list-title {
  flex: none;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--sys-text-color);
}

.hot-list-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-right: 4px;
}

.hot-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 4px;
  border-radius: 6px;
  text-decoration: none;
  transition: background-color 0.2s ease-in-out;

  &:hover {
    background-color: var(--theme-hover);
  }
}

.hot-rank {
  flex: none;
  width: 18px;
  font-size: 12px;
  font-weight: 600;
  line-height: 18px;
  text-align: center;
  color: var(--sys-text-secondary-color);
  font-variant-numeric: tabular-nums;

  &.is-first {
    color: var(--el-color-danger);
  }

  &.is-second {
    color: var(--el-color-warning);
  }

  &.is-third {
    color: var(--el-color-primary);
  }
}

.hot-title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  font-size: 13px;
  line-height: 18px;
  color: var(--sys-text-color);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hot-tag {
  flex: none;
  padding: 0 4px;
  font-size: 10px;
  line-height: 15px;
  border-radius: 3px;
  color: var(--el-color-danger);
  background-color: var(--theme-hover);
}

.hot-score {
  flex: none;
  font-size: 11px;
  color: var(--sys-text-secondary-color);
  font-variant-numeric: tabular-nums;
}

.hot-empty {
  padding: 24px 0;
  font-size: 12px;
  text-align: center;
  color: var(--sys-text-secondary-color);
}

@media (max-width: 1199px) {
  .hot-list {
    height: 360px;
  }
}
</style>
