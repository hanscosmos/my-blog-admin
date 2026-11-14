<template>
  <section class="cash-section">
    <div class="section-head">
      <div class="section-title">
        <AppIcon name="wallet" :size="16" class="section-icon" />
        <span>现金 / 存款</span>
        <span v-if="portfolio" class="section-meta">
          余额 {{ formatAmount(portfolio.summary.totalBalance) }}
          · 昨日
          {{
            hasYesterdayPnl
              ? formatSignedAmount(portfolio.summary.totalYesterdayPnl)
              : '待更新'
          }}
          · 累计 {{ formatSignedAmount(portfolio.summary.totalPnl) }} · 综合年化
          {{ formatRate(portfolio.summary.weightedAnnualRate) }}
        </span>
      </div>
      <div class="section-actions">
        <el-button type="primary" plain size="small" @click="openAdd"
          >添加</el-button
        >
      </div>
    </div>

    <p v-if="errorMsg" class="text-xs text-amber-500 mb-3">{{ errorMsg }}</p>
    <p
      v-if="portfolio?.summary.incomplete"
      class="text-xs text-amber-500 mb-3"
    >
      部分货币基金缺少行情，昨日收益暂无法预估
    </p>

    <div v-if="!portfolio" class="cash-empty">
      <span class="cash-empty-title">{{
        loading ? '现金存款加载中…' : '现金存款加载失败'
      }}</span>
    </div>

    <div v-else-if="!portfolio.items.length" class="cash-empty">
      <AppIcon name="wallet" :size="32" class="cash-empty-icon"></AppIcon>
      <p class="cash-empty-title">还没有现金或存款</p>
      <p class="cash-empty-desc">
        余额宝按万份收益预估昨日收益，银行存款按本金和利率计算应计利息
      </p>
      <el-button type="primary" size="small" @click="openAdd"
        >添加余额宝</el-button
      >
    </div>

    <template v-else>
      <div class="cash-groups">
        <section
          v-for="group in groups"
          :key="group.kind"
          class="cash-group"
        >
          <div class="cash-group-header">
            <span class="group-title">
              <i :style="{ backgroundColor: group.color }"></i>
              {{ group.name }}
            </span>
            <span class="group-meta">
              {{ group.items.length }} 项 · 余额
              {{ formatAmount(group.balance) }} · 累计
              <span :class="pnlClass(group.totalPnl)">{{
                formatSignedAmount(group.totalPnl)
              }}</span>
            </span>
          </div>

          <div v-for="item in group.items" :key="item.id" class="cash-row">
            <div class="cash-identity">
              <div class="cash-name">
                <span>{{ item.name }}</span>
                <AppTag
                  v-if="item.kind === 'deposit' && item.status === 'matured'"
                  name="已到期"
                  color="#9ca3af"
                  size="small"
                />
                <AppTag
                  v-if="item.kind === 'money_fund'"
                  :name="item.dataMode === 'quote' ? '行情预估' : '手动记录'"
                  :color="item.dataMode === 'quote' ? '#14b8a6' : '#9ca3af'"
                  size="small"
                />
              </div>
              <div class="cash-meta">
                <span v-if="item.kind === 'money_fund'">
                  {{ item.fundCode }} · 万份收益
                  {{ formatIncome(item.dailyIncome) }}
                </span>
                <span v-else>
                  {{ interestTypeLabel(item) }} · 起存 {{ item.startDate }}
                  <template v-if="item.endDate">
                    · 到期 {{ item.endDate }}
                  </template>
                </span>
                <span v-if="item.remark" class="cash-remark">{{
                  item.remark
                }}</span>
              </div>
            </div>

            <div class="cash-balance">
              <span class="balance-main">{{ formatAmount(item.balance) }}</span>
              <span class="balance-sub">
                本金 {{ formatAmount(item.principal) }}
              </span>
            </div>

            <div class="cash-rate">
              <span>{{ formatRate(item.annualRate) }}</span>
              <span class="cash-rate-sub">{{
                item.kind === 'money_fund' ? '七日年化' : '年利率'
              }}</span>
            </div>

            <div class="cash-pnl">
              <span :class="pnlClass(item.yesterdayPnl)">{{
                yesterdayLabel(item)
              }}</span>
              <span :class="pnlClass(item.totalPnl)">
                累计 {{ formatSignedAmount(item.totalPnl) }}（{{
                  formatPercent(item.totalReturnRate)
                }}）
              </span>
            </div>

            <div class="cash-days">
              <span v-if="item.kind === 'deposit'">{{ item.days ?? 0 }} 天</span>
              <span v-else>{{ item.quoteDate || '—' }}</span>
              <span class="cash-days-sub">{{
                item.kind === 'deposit'
                  ? item.status === 'matured'
                    ? '已到期'
                    : '计息中'
                  : '收益日期'
              }}</span>
            </div>

            <div class="cash-actions">
              <el-button link type="primary" @click="openEdit(item)"
                >编辑</el-button
              >
              <el-button link type="danger" @click="remove(item)"
                >删除</el-button
              >
            </div>
          </div>
        </section>
      </div>

      <p class="cash-footer">
        余额宝收益按最近万份收益估算，余额需手动更新；存款利息按 365 天单利估算，实际以银行结算为准。
      </p>
    </template>

    <Teleport to="body">
      <MarketCashHoldingDialog
        v-if="dialogVisible"
        :visible="dialogVisible"
        :item="editingItem"
        @close="dialogVisible = false"
        @save="handleSave"
      />
    </Teleport>
  </section>
</template>

<script setup lang="ts">
import {
  deleteMarketCashHoldingApi,
  saveMarketCashHoldingApi,
} from '@/api/market';
import type {
  MarketCashHoldingFormType,
  MarketCashItemType,
  MarketCashKindType,
  MarketCashPortfolioType,
} from '@/api/market/type';
import { ElMessage } from 'element-plus';
import { confirmHandler } from '@/utils/tool';
import { formatCny } from '../hooks/useMarketFundPortfolio';
import {
  CASH_DEPOSIT_COLOR,
  CASH_MONEY_FUND_COLOR,
} from '../hooks/useMarketFundMeta';
import MarketCashHoldingDialog from './MarketCashHoldingDialog.vue';

type PropsType = {
  portfolio: MarketCashPortfolioType | null;
  loading: boolean;
  errorMsg: string;
};

const props = defineProps<PropsType>();

const emit = defineEmits<{
  (e: 'refresh'): void;
}>();

type GroupType = {
  kind: MarketCashKindType;
  name: string;
  color: string;
  items: MarketCashItemType[];
  balance: number;
  totalPnl: number;
};

const dialogVisible = ref(false);
const editingItem = ref<MarketCashItemType | null>(null);

const groups = computed<GroupType[]>(() => {
  const items = props.portfolio?.items ?? [];
  const moneyFunds = items.filter((item) => item.kind === 'money_fund');
  const deposits = items.filter((item) => item.kind === 'deposit');

  return [
    {
      kind: 'money_fund' as MarketCashKindType,
      name: '余额宝 / 货币基金',
      color: CASH_MONEY_FUND_COLOR,
      items: moneyFunds,
      balance: moneyFunds.reduce((sum, item) => sum + item.balance, 0),
      totalPnl: moneyFunds.reduce((sum, item) => sum + item.totalPnl, 0),
    },
    {
      kind: 'deposit' as MarketCashKindType,
      name: '银行存款',
      color: CASH_DEPOSIT_COLOR,
      items: deposits,
      balance: deposits.reduce((sum, item) => sum + item.balance, 0),
      totalPnl: deposits.reduce((sum, item) => sum + item.totalPnl, 0),
    },
  ].filter((group) => group.items.length > 0);
});

const hasYesterdayPnl = computed(() =>
  (props.portfolio?.items ?? []).some((item) => item.yesterdayPnl !== null)
);

const pnlClass = (value: number | null) =>
  value === null
    ? ''
    : value > 0
      ? 'text-red-500'
      : value < 0
        ? 'text-green-500'
        : '';

const formatAmount = (value: number | null) =>
  value === null ? '--' : formatCny(value);

const formatSignedAmount = (value: number | null) =>
  value === null ? '--' : formatCny(value, true);

const formatPercent = (value: number | null) =>
  value === null ? '--' : `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;

const formatRate = (value: number | null) =>
  value === null ? '--' : `${value.toFixed(2)}%`;

const formatIncome = (value: number | null) =>
  value === null ? '--' : value.toFixed(4);

const interestTypeLabel = (item: MarketCashItemType) =>
  item.interestType === 'fixed' ? '定期存款' : '活期存款';

const yesterdayLabel = (item: MarketCashItemType) => {
  if (item.kind === 'deposit' && item.status === 'matured') return '已到期';
  if (item.yesterdayPnl === null) return '昨日待更新';
  return item.kind === 'money_fund'
    ? `昨日 ${formatSignedAmount(item.yesterdayPnl)}`
    : `日利息 ${formatSignedAmount(item.yesterdayPnl)}`;
};

const openAdd = () => {
  editingItem.value = null;
  dialogVisible.value = true;
};

const openEdit = (item: MarketCashItemType) => {
  editingItem.value = item;
  dialogVisible.value = true;
};

const handleSave = async (form: MarketCashHoldingFormType) => {
  try {
    const res = await saveMarketCashHoldingApi(form);
    if (res.code !== 0) return;
    ElMessage.success(form.id ? '修改成功' : '添加成功');
    dialogVisible.value = false;
    emit('refresh');
  } catch (err) {
    console.error('保存现金存款失败:', err);
  }
};

const remove = (item: MarketCashItemType) => {
  confirmHandler(`您将删除「${item.name}」的记录`, async () => {
    try {
      const res = await deleteMarketCashHoldingApi({ ids: [item.id] });
      if (res.code !== 0) return;
      ElMessage.success('删除成功');
      emit('refresh');
    } catch (err) {
      console.error('删除现金存款失败:', err);
    }
  });
};
</script>

<style lang="scss" scoped>
.cash-section {
  display: flex;
  flex-direction: column;
}

.section-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 12px;
  margin-bottom: 10px;
}

.section-title {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
}

.section-icon {
  color: #14b8a6;
}

.section-meta {
  font-size: 12px;
  font-weight: 400;
  color: var(--sys-text-secondary-color);
}

.section-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.cash-groups {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cash-group {
  overflow: hidden;
  border: 1px solid var(--sys-border-color);
  border-radius: 8px;
}

.cash-group-header {
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

.cash-row {
  display: grid;
  grid-template-columns: minmax(220px, 2fr) minmax(140px, 1.2fr) 110px minmax(
      180px,
      1.4fr
    ) 100px 100px;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-top: 1px solid var(--sys-border-color);
  transition: background-color 0.2s ease-in-out;

  &:hover {
    background: var(--theme-hover);
  }
}

.cash-identity {
  min-width: 0;
}

.cash-name {
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

.cash-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 8px;
  margin-top: 3px;
  font-size: 11px;
  color: var(--sys-text-secondary-color);
}

.cash-remark {
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cash-balance,
.cash-rate,
.cash-pnl,
.cash-days {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 12px;
}

.balance-main {
  font-size: 14px;
  font-weight: 600;
}

.balance-sub,
.cash-rate-sub,
.cash-days-sub {
  color: var(--sys-text-secondary-color);
}

.cash-days {
  font-size: 12px;
}

.cash-actions {
  display: flex;
  justify-content: flex-end;
  gap: 4px;
}

.cash-footer {
  margin-top: 8px;
  font-size: 12px;
  color: var(--sys-text-secondary-color);
}

.cash-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 160px;
  color: var(--sys-text-secondary-color);
}

.cash-empty-icon {
  color: #14b8a6;
  opacity: 0.6;
}

.cash-empty-title {
  font-size: 14px;
  color: var(--sys-text-color);
}

.cash-empty-desc {
  font-size: 12px;
}

@media (max-width: 1199px) {
  .cash-row {
    grid-template-columns: minmax(180px, 1.6fr) minmax(120px, 1fr) 90px minmax(
        160px,
        1.2fr
      ) 80px 90px;
    gap: 8px;
  }
}

@media (max-width: 767px) {
  .cash-row {
    grid-template-columns: 1fr 1fr;
  }

  .cash-identity {
    grid-column: 1 / -1;
  }

  .cash-actions {
    justify-content: flex-start;
  }
}
</style>
