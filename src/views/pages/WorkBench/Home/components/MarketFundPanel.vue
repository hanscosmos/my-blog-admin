<template>
  <div class="market-fund-panel">
    <p v-if="errorMsg" class="text-xs text-amber-500 mb-3">{{ errorMsg }}</p>

    <el-skeleton v-if="!portfolio && !errorMsg" animated>
      <template #template>
        <el-row :gutter="16">
          <el-col v-for="n in 4" :key="n" :xs="24" :sm="12" :lg="6" class="mb-4">
            <div class="h-full rounded-lg px-4 py-4" style="border: 1px solid var(--sys-border-color)">
              <el-skeleton-item variant="text" style="width: 40%" />
              <div class="mt-3">
                <el-skeleton-item variant="h1" style="width: 70%" />
              </div>
            </div>
          </el-col>
        </el-row>
        <div class="rounded-lg px-4 py-4" style="border: 1px solid var(--sys-border-color)">
          <div v-for="n in 5" :key="n" class="flex items-center justify-between py-3">
            <el-skeleton-item variant="text" style="width: 35%" />
            <el-skeleton-item variant="text" style="width: 18%" />
            <el-skeleton-item variant="text" style="width: 18%" />
          </div>
        </div>
      </template>
    </el-skeleton>

    <div v-else-if="!portfolio" class="fund-empty">
      持仓加载失败，点击右上角刷新重试
    </div>

    <div v-else-if="!portfolio.items.length" class="fund-empty">
      <AppIcon name="funds" :size="36" class="fund-empty-icon"></AppIcon>
      <p class="fund-empty-title">还没有基金持仓</p>
      <p class="fund-empty-desc">添加后会按净值自动计算今日盈亏和累计收益</p>
      <el-button type="primary" @click="openAdd">添加第一支基金</el-button>
    </div>

    <template v-else>
      <div class="fund-summary">
        <div class="summary-item">
          <span class="summary-label">总市值</span>
          <span class="summary-value">{{ formatAmount(portfolio.summary.totalMarketValue) }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">今日盈亏</span>
          <span class="summary-value" :class="pnlClass(portfolio.summary.totalTodayPnl)">
            {{ formatSignedAmount(portfolio.summary.totalTodayPnl) }}
          </span>
          <span class="summary-sub" :class="pnlClass(portfolio.summary.totalTodayPnl)">
            {{ formatPercent(portfolio.summary.todayReturnRate) }}
          </span>
        </div>
        <div class="summary-item">
          <span class="summary-label">累计收益</span>
          <span class="summary-value" :class="pnlClass(portfolio.summary.totalPnl)">
            {{ formatSignedAmount(portfolio.summary.totalPnl) }}
          </span>
          <span class="summary-sub" :class="pnlClass(portfolio.summary.totalPnl)">
            {{ formatPercent(portfolio.summary.totalReturnRate) }}
          </span>
        </div>
        <div class="summary-item">
          <span class="summary-label">总成本</span>
          <span class="summary-value">{{ formatAmount(portfolio.summary.totalCost) }}</span>
        </div>
        <div class="summary-actions">
          <el-button type="primary" plain size="small" @click="openAdd">添加持仓</el-button>
        </div>
      </div>

      <p v-if="portfolio.summary.incomplete" class="text-xs text-amber-500 mb-3">
        部分基金缺少行情，汇总数据不完整
      </p>

      <div v-if="portfolio.categories.length" class="fund-allocation">
        <div class="allocation-bar">
          <div v-for="category in portfolio.categories" :key="category.category" class="allocation-segment"
            :style="{ width: `${category.ratio ?? 0}%`, backgroundColor: categoryColor(category.category) }"
            :title="`${category.name} ${formatPercent(category.ratio)}`"></div>
        </div>
        <div class="allocation-legend">
          <span v-for="category in portfolio.categories" :key="category.category" class="legend-item">
            <i :style="{ backgroundColor: categoryColor(category.category) }"></i>
            {{ category.name }} {{ formatPercent(category.ratio) }}
          </span>
        </div>
      </div>

      <div class="fund-groups">
        <section v-for="group in groupedItems" :key="group.category" class="fund-group">
          <div class="fund-group-header">
            <span class="group-title">
              <i :style="{ backgroundColor: categoryColor(group.category) }"></i>
              {{ group.name }}
            </span>
            <span class="group-meta">
              {{ group.items.length }} 支 · 市值 {{ formatAmount(group.marketValue) }} · 占比
              {{ formatPercent(group.ratio) }}
            </span>
          </div>

          <div v-for="item in group.items" :key="item.id" class="fund-row">
            <div class="fund-identity">
              <div class="fund-name">
                <span>{{ item.fundName }}</span>
                <AppTag :name="styleLabel(item.style)" :color="styleColor(item.style)" size="small" />
              </div>
              <div class="fund-meta">
                <span>{{ item.fundCode }}</span>
                <span v-if="item.fundType">{{ item.fundType }}</span>
                <span v-if="item.remark" class="fund-remark">{{ item.remark }}</span>
              </div>
            </div>

            <div class="fund-quote">
              <span class="quote-nav">{{ formatNav(item.currentNav) }}</span>
              <span class="quote-change" :class="pnlClass(item.changePercent)">
                {{ formatPercent(item.changePercent) }}
              </span>
              <span class="quote-mode">{{ quoteModeText(item) }}</span>
            </div>

            <div class="fund-position">
              <span class="position-main">{{ formatAmount(item.marketValue) }}</span>
              <span class="position-sub">
                份额 {{ formatShares(item.shares) }} · 成本 {{ formatNav(item.costNav) }}
              </span>
            </div>

            <div class="fund-pnl">
              <span :class="pnlClass(item.todayPnl)">今日 {{ formatSignedAmount(item.todayPnl) }}</span>
              <span :class="pnlClass(item.totalPnl)">
                累计 {{ formatSignedAmount(item.totalPnl) }}（{{ formatPercent(item.totalReturnRate) }}）
              </span>
            </div>

            <div class="fund-ratio">{{ formatPercent(item.ratio) }}</div>

            <div class="fund-actions">
              <el-button link type="primary" @click="openEdit(item)">编辑</el-button>
              <el-button link type="danger" @click="remove(item)">删除</el-button>
            </div>
          </div>
        </section>
      </div>

      <p class="fund-footer">
        数据来源：东方财富公开基金数据；盘中为估值，净值以基金公司公布为准。
      </p>
    </template>

    <MarketFundHoldingDialog v-if="dialogVisible" :visible="dialogVisible" :item="editingItem"
      @close="dialogVisible = false" @save="handleSave" />
  </div>
</template>

<script setup lang="ts">
import {
  deleteMarketFundHoldingApi,
  saveMarketFundHoldingApi,
} from '@/api/market';
import type {
  MarketFundCategoryType,
  MarketFundHoldingFormType,
  MarketFundHoldingItemType,
  MarketFundStyleType,
} from '@/api/market/type';
import { ElMessage } from 'element-plus';
import { confirmHandler } from '@/utils/tool';
import {
  formatCny,
  useMarketFundPortfolio,
} from '../hooks/useMarketFundPortfolio';
import MarketFundHoldingDialog from './MarketFundHoldingDialog.vue';

type GroupType = {
  category: MarketFundCategoryType;
  name: string;
  items: MarketFundHoldingItemType[];
  marketValue: number;
  ratio: number | null;
};

const { portfolio, loading, errorMsg, refresh } = useMarketFundPortfolio();

const dialogVisible = ref(false);
const editingItem = ref<MarketFundHoldingItemType | null>(null);

const CATEGORY_ORDER: MarketFundCategoryType[] = [
  'bond',
  'equity',
  'mixed',
  'overseas',
  'money',
  'commodity',
  'other',
];

const CATEGORY_NAMES: Record<MarketFundCategoryType, string> = {
  bond: '债券型',
  equity: '股票/指数',
  mixed: '混合型',
  overseas: '海外/QDII',
  money: '货币型',
  commodity: '商品型',
  other: '其他',
};

const CATEGORY_COLORS: Record<MarketFundCategoryType, string> = {
  bond: '#3b82f6',
  equity: '#ef4444',
  mixed: '#f59e0b',
  overseas: '#8b5cf6',
  money: '#10b981',
  commodity: '#eab308',
  other: '#9ca3af',
};

const STYLE_LABELS: Record<MarketFundStyleType, string> = {
  passive: '被动',
  active: '主动',
  unknown: '未知',
};

const STYLE_COLORS: Record<MarketFundStyleType, string> = {
  passive: '#3b82f6',
  active: '#f59e0b',
  unknown: '#9ca3af',
};

const groupedItems = computed<GroupType[]>(() => {
  if (!portfolio.value) return [];

  const groupMap = new Map<MarketFundCategoryType, MarketFundHoldingItemType[]>();
  CATEGORY_ORDER.forEach((category) => groupMap.set(category, []));
  portfolio.value.items.forEach((item) => {
    const list = groupMap.get(item.category) ?? groupMap.get('other');
    list?.push(item);
  });

  const statMap = new Map(
    portfolio.value.categories.map((item) => [item.category, item])
  );

  return CATEGORY_ORDER.map((category) => {
    const stat = statMap.get(category);
    return {
      category,
      name: CATEGORY_NAMES[category],
      items: groupMap.get(category) ?? [],
      marketValue: stat?.marketValue ?? 0,
      ratio: stat?.ratio ?? null,
    };
  }).filter((group) => group.items.length > 0);
});

const categoryColor = (category: MarketFundCategoryType) =>
  CATEGORY_COLORS[category] ?? CATEGORY_COLORS.other;

const styleLabel = (style: MarketFundStyleType) =>
  STYLE_LABELS[style] ?? STYLE_LABELS.unknown;

const styleColor = (style: MarketFundStyleType) =>
  STYLE_COLORS[style] ?? STYLE_COLORS.unknown;

const pnlClass = (value: number | null) =>
  value === null ? '' : value > 0 ? 'text-red-500' : value < 0 ? 'text-green-500' : '';

const formatAmount = (value: number | null) =>
  value === null ? '--' : formatCny(value);

const formatSignedAmount = (value: number | null) =>
  value === null ? '--' : formatCny(value, true);

const formatPercent = (value: number | null) =>
  value === null ? '--' : `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;

const formatNav = (value: number | null) =>
  value === null ? '--' : value.toFixed(4);

const formatShares = (value: number) =>
  value.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });

const quoteModeText = (item: MarketFundHoldingItemType) => {
  if (item.dataMode === 'estimate') {
    const time = item.estimateTime.slice(11, 16);
    return time ? `估值 ${time}` : '估值';
  }
  if (item.dataMode === 'nav' && item.navDate) {
    return `净值 ${item.navDate}`;
  }
  return '暂无行情';
};

const openAdd = () => {
  editingItem.value = null;
  dialogVisible.value = true;
};

const openEdit = (item: MarketFundHoldingItemType) => {
  editingItem.value = item;
  dialogVisible.value = true;
};

const handleSave = async (form: MarketFundHoldingFormType) => {
  try {
    const res = await saveMarketFundHoldingApi(form);
    if (res.code !== 0) return;
    ElMessage.success(form.id ? '修改成功' : '添加成功');
    dialogVisible.value = false;
    refresh();
  } catch (err) {
    console.error('保存基金持仓失败:', err);
  }
};

const remove = (item: MarketFundHoldingItemType) => {
  confirmHandler(`您将删除「${item.fundName}」的持仓`, async () => {
    try {
      const res = await deleteMarketFundHoldingApi({ ids: [item.id] });
      if (res.code !== 0) return;
      ElMessage.success('删除成功');
      refresh();
    } catch (err) {
      console.error('删除基金持仓失败:', err);
    }
  });
};

defineExpose({
  updateTime: computed(() => portfolio.value?.updateTime ?? ''),
  stale: computed(() => portfolio.value?.stale ?? false),
  loading,
  refresh,
});
</script>

<style lang="scss" scoped>
.market-fund-panel {
  min-height: 320px;
}

.fund-summary {
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  gap: 12px 32px;
  padding: 16px 20px;
  margin-bottom: 16px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.07), transparent 62%);
  border: 1px solid var(--sys-border-color);
  border-radius: 8px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 130px;
}

.summary-label {
  font-size: 12px;
  color: var(--sys-text-secondary-color);
}

.summary-value {
  font-size: 20px;
  font-weight: 600;
  line-height: 1.2;
}

.summary-sub {
  font-size: 12px;
}

.summary-actions {
  display: flex;
  align-items: center;
  margin-left: auto;
}

.fund-allocation {
  margin-bottom: 16px;
}

.allocation-bar {
  display: flex;
  height: 8px;
  overflow: hidden;
  background: var(--theme-hover);
  border-radius: 4px;
}

.allocation-segment {
  height: 100%;
  transition: width 0.3s ease-in-out;
}

.allocation-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 16px;
  margin-top: 8px;
  font-size: 12px;
  color: var(--sys-text-secondary-color);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 4px;

  i {
    width: 8px;
    height: 8px;
    border-radius: 2px;
  }
}

.fund-groups {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.fund-group {
  overflow: hidden;
  border: 1px solid var(--sys-border-color);
  border-radius: 8px;
}

.fund-group-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 12px;
  padding: 10px 16px;
  background: var(--theme-hover);
}

.group-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;

  i {
    width: 8px;
    height: 8px;
    border-radius: 2px;
  }
}

.group-meta {
  font-size: 12px;
  color: var(--sys-text-secondary-color);
}

.fund-row {
  display: grid;
  grid-template-columns:
    minmax(220px, 2fr) 130px minmax(150px, 1.2fr) minmax(180px, 1.4fr) 80px 100px;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-top: 1px solid var(--sys-border-color);
  transition: background-color 0.2s ease-in-out;

  &:hover {
    background: var(--theme-hover);
  }
}

.fund-identity {
  min-width: 0;
}

.fund-name {
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

.fund-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 8px;
  margin-top: 3px;
  font-size: 11px;
  color: var(--sys-text-secondary-color);
}

.fund-remark {
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fund-quote,
.fund-position,
.fund-pnl {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 12px;
}

.quote-nav,
.position-main {
  font-size: 14px;
  font-weight: 600;
}

.quote-change {
  font-weight: 600;
}

.quote-mode,
.position-sub {
  color: var(--sys-text-secondary-color);
}

.fund-ratio {
  font-size: 12px;
  color: var(--sys-text-secondary-color);
  text-align: right;
}

.fund-actions {
  display: flex;
  justify-content: flex-end;
  gap: 4px;
}

.fund-footer {
  margin-top: 8px;
  font-size: 12px;
  color: var(--sys-text-secondary-color);
}

.fund-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 240px;
  color: var(--sys-text-secondary-color);
}

.fund-empty-icon {
  color: var(--el-color-primary);
  opacity: 0.6;
}

.fund-empty-title {
  font-size: 14px;
  color: var(--sys-text-color);
}

.fund-empty-desc {
  font-size: 12px;
}

@media (max-width: 1199px) {
  .fund-row {
    grid-template-columns:
      minmax(180px, 1.6fr) 110px minmax(140px, 1fr) minmax(160px, 1.2fr) 70px 90px;
    gap: 8px;
  }
}

@media (max-width: 767px) {
  .fund-row {
    grid-template-columns: 1fr 1fr;
  }

  .fund-identity {
    grid-column: 1 / -1;
  }

  .fund-ratio {
    text-align: left;
  }

  .fund-actions {
    justify-content: flex-start;
  }

  .summary-actions {
    margin-left: 0;
  }
}
</style>
