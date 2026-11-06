<template>
  <AppDialog :visible="visible" title="持仓设置" width="520px" @close="emit('close')" @confirm="handleConfirm">
    <p class="portfolio-tip">
      持仓市值请按人民币填写，当日盈亏 = 持仓市值 × 当日涨跌幅（估算）。
    </p>

    <div v-if="!rows.length" class="portfolio-empty">
      暂无可设置持仓的自选资产
    </div>
    <div v-else class="portfolio-list">
      <div v-for="row in rows" :key="row.item.uid" class="portfolio-row">
        <div class="portfolio-info">
          <div class="text-sm font-medium">{{ row.item.name }}</div>
          <div class="portfolio-preview">
            <span v-if="row.pnl" :class="pnlClass(row.pnl.pnl)">
              今日 {{ formatPnlValue(row.pnl) }}
            </span>
            <span v-else class="portfolio-native">今日 --</span>
          </div>
        </div>
        <div class="portfolio-input">
          <span class="portfolio-symbol">¥</span>
          <el-input-number v-model="draft[row.item.uid]" :min="0" :precision="2" :controls="false"
            class="!w-36" placeholder="人民币市值" />
        </div>
      </div>
    </div>
  </AppDialog>
</template>

<script setup lang="ts">
import type { MarketDisplayItemType } from '../hooks/useMarketLayout';
import {
  calcMarketPnl,
  formatPnlValue,
  type MarketPnlType,
} from '../hooks/useMarketPortfolio';

type PropsType = {
  visible: boolean;
  items: MarketDisplayItemType[];
  positions: Record<string, number>;
};

type PortfolioRowType = {
  item: MarketDisplayItemType;
  pnl: MarketPnlType | null;
};

const props = defineProps<PropsType>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'save', positions: Record<string, number>): void;
}>();

const draft = ref<Record<string, number | undefined>>({ ...props.positions });

/** 纯汇率报价不作为持仓资产；国内金价（折算）虽在外汇组，但属于可持有资产 */
const NON_POSITION_KEYS = new Set([
  'fx_susdcnh',
  'usdcny_ccpr',
  'usd_index',
]);

const rows = computed<PortfolioRowType[]>(() =>
  props.items
    .filter((item) => !NON_POSITION_KEYS.has(item.key))
    .map((item) => ({
      item,
      pnl: calcMarketPnl(item, draft.value[item.uid]),
    }))
);

const pnlClass = (value: number) =>
  value > 0 ? 'text-red-500' : value < 0 ? 'text-green-500' : 'text-gray-400';

const handleConfirm = () => {
  const next: Record<string, number> = {};
  Object.entries(draft.value).forEach(([uid, amount]) => {
    if (typeof amount === 'number' && Number.isFinite(amount) && amount > 0) {
      next[uid] = amount;
    }
  });
  emit('save', next);
};
</script>

<style lang="scss" scoped>
.portfolio-tip {
  margin-bottom: 12px;
  font-size: 12px;
  color: var(--sys-text-secondary-color);
}

.portfolio-list {
  display: flex;
  flex-direction: column;
  max-height: 360px;
  padding-right: 4px;
  overflow-y: auto;
}

.portfolio-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 0;
  border-bottom: 1px dashed var(--sys-border-color);

  &:last-child {
    border-bottom: none;
  }
}

.portfolio-info {
  min-width: 0;
}

.portfolio-preview {
  margin-top: 4px;
  font-size: 12px;
}

.portfolio-native {
  color: var(--sys-text-secondary-color);
}

.portfolio-input {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 6px;
}

.portfolio-symbol {
  font-size: 12px;
  color: var(--sys-text-secondary-color);
}

.portfolio-empty {
  padding: 24px 0;
  font-size: 13px;
  color: var(--sys-text-secondary-color);
  text-align: center;
}
</style>
