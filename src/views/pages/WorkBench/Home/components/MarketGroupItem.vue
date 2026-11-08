<template>
  <div ref="itemRef" class="market-item flex items-start justify-between px-2 -mx-2 rounded py-2.5" :class="{
    'market-item-clickable': canTrend,
    'is-dragging': isDragging,
    'is-drop-target': isDropTarget,
  }" :style="{
    borderTop: showTopBorder ? 'dashed 1px var(--sys-border-color)' : 'none',
  }" :title="itemTitle" @click="handleItemClick">
    <div class="market-item-main flex flex-col">
      <span class="market-item-name flex items-center gap-1 text-sm">
        <span class="market-item-name-text">{{ item.name }}</span>
        <button type="button" class="market-item-star" :class="{ 'is-active': favorite }"
          :title="favorite ? '移出自选' : '加入自选'" @click.stop="handleToggleFavorite">
          <AppIcon name="star" :size="12" :theme="favorite ? 'filled' : 'outline'"></AppIcon>
        </button>
        <span ref="dragHandleRef" class="market-item-handle" title="拖动排序" @click.stop>
          <AppIcon name="drag" :size="12"></AppIcon>
        </span>
        <AppIcon v-if="canTrend" name="trend" :size="12" class="market-item-trend"></AppIcon>
      </span>
      <span v-if="item.symbol" class="market-item-symbol text-xs" style="color: var(--sys-text-secondary-color)">
        {{ item.symbol }}
      </span>
    </div>
    <div class="market-item-value flex flex-col items-end">
      <span class="text-sm font-beauty">{{ formatPrice(item) }}</span>
      <span v-if="item.change !== null || item.changePercent !== null" class="text-xs"
        :class="changeClass(item.change)">
        {{ formatChange(item.change, item.precision) }}
        {{ formatPercent(item.changePercent) }}
      </span>
      <span v-else-if="item.price !== null" class="text-xs text-gray-400">
        {{ fmtTime(item.quoteTime, 'YYYY-MM-DD') || '暂无数据' }}
      </span>
      <span v-if="showPnl" class="market-item-pnl text-xs" :class="pnlClass" :title="pnlTitle">
        {{ pnl ? formatPnlValue(pnl) : '--' }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  draggable,
  dropTargetForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import type { MarketItemType } from '@/api/market/type';
import type {
  MarketDisplayItemType,
  MarketItemMovePayloadType,
} from '../hooks/useMarketLayout';
import {
  formatPnlValue,
  type MarketPnlType,
} from '../hooks/useMarketPortfolio';
import { fmtTime } from '@/utils/tool';

type PropsType = {
  item: MarketDisplayItemType;
  groupKey: string;
  favorite: boolean;
  canTrend: boolean;
  showTopBorder: boolean;
  showPnl: boolean;
  pnl: MarketPnlType | null;
};

type ItemDragDataType = {
  type: 'item';
  groupKey: string;
  uid: string;
};

const props = defineProps<PropsType>();

const emit = defineEmits<{
  (e: 'open-trend', item: MarketItemType): void;
  (e: 'toggle-favorite', groupKey: string, itemKey: string): void;
  (e: 'move', payload: MarketItemMovePayloadType): void;
}>();

const itemRef = ref<HTMLElement | null>(null);
const dragHandleRef = ref<HTMLElement | null>(null);
const isDragging = ref(false);
const isDropTarget = ref(false);

let cleanupDraggable: (() => void) | undefined;
let cleanupDropTarget: (() => void) | undefined;

const itemTitle = computed(() => {
  const parts: string[] = [];
  if (props.canTrend) parts.push('点击查看趋势');
  if (props.item.quoteTime) parts.push(`行情时间：${props.item.quoteTime}`);
  return parts.join(' · ');
});

const handleItemClick = () => {
  if (props.canTrend) emit('open-trend', props.item);
};

const handleToggleFavorite = () => {
  emit('toggle-favorite', props.item.sourceGroupKey, props.item.key);
};

const formatPrice = (item: MarketItemType) => {
  if (item.price === null || item.price === undefined) return '--';
  return item.price.toLocaleString('zh-CN', {
    minimumFractionDigits: item.precision,
    maximumFractionDigits: item.precision,
  });
};

const formatChange = (value: number | null, precision = 2) => {
  if (value === null || value === undefined) return '--';
  return `${value > 0 ? '+' : ''}${value.toFixed(precision)}`;
};

const formatPercent = (value: number | null) => {
  if (value === null || value === undefined) return '--';
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
};

const changeClass = (value: number | null) => {
  if (value === null || value === undefined || value === 0) {
    return 'text-gray-400';
  }
  return value > 0 ? 'text-red-500' : 'text-green-500';
};

const pnlValue = computed(() => props.pnl?.pnl ?? 0);

const pnlClass = computed(() =>
  props.pnl ? changeClass(pnlValue.value) : 'text-gray-400'
);

const pnlTitle = computed(() =>
  props.pnl
    ? '按持仓市值 × 当日涨跌幅估算'
    : '未设置持仓或暂无涨跌幅数据'
);

onMounted(() => {
  if (!itemRef.value || !dragHandleRef.value) return;

  cleanupDraggable = draggable({
    element: itemRef.value,
    dragHandle: dragHandleRef.value,
    getInitialData: (): ItemDragDataType => ({
      type: 'item',
      groupKey: props.groupKey,
      uid: props.item.uid,
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
    element: itemRef.value,
    getData: (): ItemDragDataType => ({
      type: 'item',
      groupKey: props.groupKey,
      uid: props.item.uid,
    }),
    canDrop: ({ source }) => {
      const data = source.data as unknown as ItemDragDataType;
      return (
        data.type === 'item' &&
        data.groupKey === props.groupKey &&
        data.uid !== props.item.uid
      );
    },
    onDragEnter: ({ self, source }) => {
      const sourceData = source.data as unknown as ItemDragDataType;
      const selfData = self.data as unknown as ItemDragDataType;
      isDropTarget.value = true;
      emit('move', {
        groupKey: props.groupKey,
        fromUid: sourceData.uid,
        toUid: selfData.uid,
      });
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
.market-item {
  box-shadow: inset 0 0 0 0 transparent;
  transition: background-color 0.2s ease-in-out, opacity 0.2s ease-in-out,
    box-shadow 0.2s ease-in-out;

  &.is-dragging {
    opacity: 0.45;
  }

  &.is-drop-target {
    box-shadow: inset 0 0 0 1px var(--el-color-primary);
  }
}

.market-item-clickable {
  cursor: pointer;

  &:hover {
    background-color: var(--theme-hover);
  }
}

.market-item-handle,
.market-item-trend {
  display: flex;
  align-items: center;
  color: var(--sys-text-secondary-color);
  opacity: 0;
  transition: opacity 0.2s ease-in-out;
}

.market-item-handle {
  cursor: grab;
}

.market-item:hover .market-item-handle,
.market-item:hover .market-item-trend {
  opacity: 1;
}

.market-item-star {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--sys-text-secondary-color);
  cursor: pointer;
  opacity: 0.35;
  transition: opacity 0.2s ease-in-out, color 0.2s ease-in-out;

  &:hover,
  &.is-active {
    color: #f59e0b;
    opacity: 1;
  }
}
</style>
