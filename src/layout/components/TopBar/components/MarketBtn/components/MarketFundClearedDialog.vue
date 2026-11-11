<template>
  <AppDialog
    :visible="visible"
    title="已清仓基金"
    width="760px"
    hide-footer
    @close="emit('close')"
  >
    <div v-if="!items.length" class="cleared-empty">
      <AppIcon name="funds" :size="32" class="cleared-empty-icon" />
      <p>暂无已清仓基金</p>
    </div>

    <div v-else class="cleared-list">
      <div v-for="item in items" :key="item.id" class="cleared-row">
        <div class="cleared-identity">
          <div class="cleared-name">
            <span>{{ item.fundName }}</span>
            <AppTag name="已清仓" color="#9ca3af" size="small" />
          </div>
          <div class="cleared-meta">
            <span>{{ item.fundCode }}</span>
            <span v-if="item.fundType">{{ item.fundType }}</span>
            <span v-if="item.remark" class="cleared-remark">{{
              item.remark
            }}</span>
          </div>
        </div>

        <div class="cleared-stat">
          <span class="stat-label">累计已实现收益</span>
          <span class="stat-value" :class="pnlClass(item.realizedPnl)">
            {{ formatSignedAmount(item.realizedPnl) }}
          </span>
        </div>

        <div class="cleared-actions">
          <el-button link type="primary" @click="emit('edit', item)"
            >编辑</el-button
          >
          <el-button link type="danger" @click="emit('remove', item)"
            >删除</el-button
          >
        </div>
      </div>
    </div>

    <p class="cleared-tip">
      已清仓基金不计入当前市值、分类占比和当日收益；已实现收益为手动填写的累计值。
    </p>
  </AppDialog>
</template>

<script setup lang="ts">
import type { MarketFundHoldingItemType } from '@/api/market/type';
import { formatCny } from '../hooks/useMarketFundPortfolio';

type PropsType = {
  visible: boolean;
  items: MarketFundHoldingItemType[];
};

defineProps<PropsType>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'edit', item: MarketFundHoldingItemType): void;
  (e: 'remove', item: MarketFundHoldingItemType): void;
}>();

const pnlClass = (value: number | null) =>
  value === null
    ? ''
    : value > 0
      ? 'text-red-500'
      : value < 0
        ? 'text-green-500'
        : '';

const formatSignedAmount = (value: number | null) =>
  value === null ? '--' : formatCny(value, true);
</script>

<style lang="scss" scoped>
.cleared-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 60vh;
  padding-right: 4px;
  overflow-y: auto;
}

.cleared-row {
  display: grid;
  grid-template-columns: minmax(180px, 2fr) minmax(140px, 1fr) 90px;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border: 1px solid var(--sys-border-color);
  border-radius: 8px;
}

.cleared-identity {
  min-width: 0;
}

.cleared-name {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  font-size: 13px;
  font-weight: 600;

  > span:first-child {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.cleared-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 8px;
  margin-top: 3px;
  font-size: 11px;
  color: var(--sys-text-secondary-color);
}

.cleared-remark {
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cleared-stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 12px;
  text-align: right;
}

.stat-label {
  font-size: 11px;
  color: var(--sys-text-secondary-color);
}

.stat-value {
  font-size: 13px;
  font-weight: 600;
}

.cleared-actions {
  display: flex;
  justify-content: flex-end;
  gap: 4px;
}

.cleared-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 180px;
  color: var(--sys-text-secondary-color);
}

.cleared-empty-icon {
  color: var(--el-color-primary);
  opacity: 0.6;
}

.cleared-tip {
  margin-top: 12px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--sys-text-secondary-color);
}

@media (max-width: 767px) {
  .cleared-row {
    grid-template-columns: 1fr 1fr;
  }

  .cleared-identity {
    grid-column: 1 / -1;
  }

  .cleared-stat {
    text-align: left;
  }

  .cleared-actions {
    justify-content: flex-start;
  }
}
</style>
