<template>
  <div ref="cardRef" class="market-group-card h-full rounded-lg px-4 py-2" :class="{
    'is-favorite': group.isFavorite,
    'is-dragging': isDragging,
    'is-drop-target': isDropTarget,
  }">
    <div ref="headerRef" class="market-group-header flex items-center justify-between py-1.5"
      :class="{ 'is-draggable': !group.isFavorite }" :title="group.isFavorite ? '' : '拖动调整板块顺序'">
      <span class="flex items-center gap-1.5 text-sm font-bold">
        <AppIcon v-if="group.isFavorite" name="star" theme="filled" :size="14" class="favorite-star"></AppIcon>
        <span class="market-group-title">{{ group.name }}</span>
        <AppIcon v-if="!group.isFavorite" name="drag" :size="12" class="group-drag-handle"></AppIcon>
      </span>
      <span v-if="group.isFavorite" class="favorite-summary">
        <span class="text-xs favorite-count">{{ group.statusText }}</span>
        <span class="portfolio-pnl" :class="pnlClass(totalPnlCny)" :title="portfolioTitle">
          今日 {{ hasPnlData ? formatCny(totalPnlCny, true) : '--' }}
        </span>
        <button type="button" class="portfolio-setting" title="设置持仓" @click.stop="emit('open-portfolio')">
          <AppIcon name="setting-one" :size="14"></AppIcon>
        </button>
      </span>
      <span v-else class="flex items-center gap-1.5 text-xs" style="color: var(--sys-text-secondary-color)">
        <span class="w-2 h-2 rounded-full" :style="{ backgroundColor: statusColor(group.status) }"></span>
        {{ group.statusText }}
      </span>
    </div>

    <div v-if="group.isFavorite && !group.items.length" class="favorite-empty">
      <AppIcon name="star" :size="14" class="favorite-empty-icon"></AppIcon>
      <span>点击行情条目的 ☆ 加入自选</span>
    </div>

    <div class="market-group-items" :class="{ 'is-grid': group.isFavorite }">
      <MarketGroupItem v-for="(item, index) in group.items" :key="item.uid" :item="item" :group-key="group.key"
        :favorite="isFavorite(item.uid)" :can-trend="canTrend(item)"
        :show-top-border="!group.isFavorite && index > 0" :show-pnl="group.isFavorite"
        :pnl="group.isFavorite ? getPnl(item) : null" @open-trend="emit('open-trend', $event)"
        @toggle-favorite="handleToggleFavorite" @move="(payload) => emit('move-item', payload)" />
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  draggable,
  dropTargetForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import type { MarketItemType, MarketStatusType } from '@/api/market/type';
import type {
  MarketDisplayGroupType,
  MarketDisplayItemType,
  MarketItemMovePayloadType,
} from '../hooks/useMarketLayout';
import {
  formatCny,
  type MarketPnlType,
} from '../hooks/useMarketPortfolio';
import MarketGroupItem from './MarketGroupItem.vue';

type PropsType = {
  group: MarketDisplayGroupType;
  isFavorite: (uid: string) => boolean;
  canTrend: (item: MarketItemType) => boolean;
  getPnl: (item: MarketDisplayItemType) => MarketPnlType | null;
  totalPnlCny: number;
  hasPnlData: boolean;
};

type GroupDragDataType = {
  type: 'group';
  key: string;
};

const props = defineProps<PropsType>();

const emit = defineEmits<{
  (e: 'move-group', fromKey: string, toKey: string): void;
  (e: 'move-item', payload: MarketItemMovePayloadType): void;
  (e: 'toggle-favorite', groupKey: string, itemKey: string): void;
  (e: 'open-trend', item: MarketItemType): void;
  (e: 'open-portfolio'): void;
}>();

const cardRef = ref<HTMLElement | null>(null);
const headerRef = ref<HTMLElement | null>(null);
const isDragging = ref(false);
const isDropTarget = ref(false);

let cleanupDraggable: (() => void) | undefined;
let cleanupDropTarget: (() => void) | undefined;

const statusColor = (status: MarketStatusType) => {
  if (status === 'open') return '#22c55e';
  if (status === 'break') return '#f59e0b';
  return '#9ca3af';
};

const pnlClass = (value: number) =>
  value > 0 ? 'is-up' : value < 0 ? 'is-down' : '';

const portfolioTitle = computed(() =>
  props.hasPnlData
    ? '按人民币持仓市值 × 最新涨跌幅估算'
    : '点击设置图标填写人民币持仓市值，按当日涨跌幅估算盈亏'
);

const handleToggleFavorite = (groupKey: string, itemKey: string) => {
  emit('toggle-favorite', groupKey, itemKey);
};

onMounted(() => {
  // 自选板块固定置顶，不参与拖拽
  if (props.group.isFavorite || !cardRef.value || !headerRef.value) return;

  cleanupDraggable = draggable({
    element: cardRef.value,
    dragHandle: headerRef.value,
    getInitialData: (): GroupDragDataType => ({
      type: 'group',
      key: props.group.key,
    }),
    onDragStart: () => {
      isDragging.value = true;
    },
    onDrop: () => {
      isDragging.value = false;
      isDropTarget.value = false;
    },
  });

  cleanupDropTarget = dropTargetForElements({
    element: cardRef.value,
    getData: (): GroupDragDataType => ({
      type: 'group',
      key: props.group.key,
    }),
    canDrop: ({ source }) => {
      const data = source.data as unknown as GroupDragDataType;
      return data.type === 'group' && data.key !== props.group.key;
    },
    onDragEnter: ({ self, source }) => {
      const sourceData = source.data as unknown as GroupDragDataType;
      const selfData = self.data as unknown as GroupDragDataType;
      isDropTarget.value = true;
      emit('move-group', sourceData.key, selfData.key);
    },
    onDragLeave: () => {
      isDropTarget.value = false;
    },
    onDrop: () => {
      isDropTarget.value = false;
    },
  });
});

onBeforeUnmount(() => {
  cleanupDraggable?.();
  cleanupDropTarget?.();
});
</script>

<style lang="scss" scoped>
.market-group-card {
  border: 1px solid var(--sys-border-color);
  transition: border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out,
    opacity 0.2s ease-in-out;

  &.is-dragging {
    opacity: 0.45;
  }

  &.is-drop-target {
    border-color: var(--el-color-primary);
  }

  &.is-favorite {
    border-color: rgba(245, 158, 11, 0.55);
    background: linear-gradient(135deg,
        rgba(245, 158, 11, 0.14),
        rgba(245, 158, 11, 0.03) 55%,
        transparent);
    box-shadow: 0 0 0 1px rgba(245, 158, 11, 0.08),
      0 6px 18px rgba(245, 158, 11, 0.12);

    .market-group-title {
      color: #d97706;
    }
  }
}

.market-group-header {
  &.is-draggable {
    cursor: grab;
    user-select: none;

    &:active {
      cursor: grabbing;
    }
  }
}

.group-drag-handle {
  display: flex;
  align-items: center;
  color: var(--sys-text-secondary-color);
  opacity: 0;
  transition: opacity 0.2s ease-in-out;
}

.market-group-header:hover .group-drag-handle {
  opacity: 1;
}

.market-group-items.is-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-auto-rows: minmax(54px, auto);
  column-gap: 24px;
  padding-bottom: 2px;

  :deep(.market-item) {
    align-items: center;
    margin-right: 0;
    margin-left: 0;
  }

  :deep(.market-item-name),
  :deep(.market-item-name-text),
  :deep(.market-item-symbol),
  :deep(.market-item-value) {
    white-space: nowrap;
  }

  :deep(.market-item-value),
  :deep(.market-item-handle),
  :deep(.market-item-trend),
  :deep(.market-item-star) {
    flex-shrink: 0;
  }

  @media (max-width: 767px) {
    grid-template-columns: 1fr;
  }
}

.favorite-star {
  display: flex;
  color: #f59e0b;
}

.favorite-summary {
  display: flex;
  align-items: center;
  gap: 8px;
}

.favorite-count {
  color: #d97706;
}

.portfolio-pnl {
  font-weight: 600;
  color: var(--sys-text-secondary-color);
  white-space: nowrap;

  &.is-up {
    color: #ef4444;
  }

  &.is-down {
    color: #22c55e;
  }
}

.portfolio-setting {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;
  color: var(--sys-text-secondary-color);
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 4px;
  transition: color 0.2s ease-in-out, background-color 0.2s ease-in-out;

  &:hover {
    color: var(--el-color-primary);
    background-color: var(--theme-hover);
  }
}

.favorite-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 18px 0;
  font-size: 12px;
  color: var(--sys-text-secondary-color);
}

.favorite-empty-icon {
  display: flex;
  color: #f59e0b;
  opacity: 0.7;
}
</style>
