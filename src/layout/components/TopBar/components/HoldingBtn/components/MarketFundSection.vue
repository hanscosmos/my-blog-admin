<template>
  <section class="fund-section">
    <div class="section-head">
      <div class="section-title">
        <AppIcon name="funds" :size="16" class="section-icon" />
        <span>基金持仓</span>
        <span v-if="portfolio" class="section-meta">
          市值 {{ formatAmount(portfolio.summary.totalMarketValue) }}
          · 当日
          {{
            hasTodayPnl
              ? formatSignedAmount(portfolio.summary.totalTodayPnl)
              : '待更新'
          }}
          · 累计
          {{
            formatSignedAmount(portfolio.summary.totalPnlIncludingRealized)
          }}
        </span>
      </div>
      <div class="section-actions">
        <el-button
          v-if="clearedItems.length"
          plain
          size="small"
          @click="clearedVisible = true"
        >
          已清仓 {{ clearedItems.length }} 支
        </el-button>
        <el-button type="primary" plain size="small" @click="openAdd"
          >添加持仓</el-button
        >
      </div>
    </div>

    <p v-if="errorMsg" class="text-xs text-amber-500 mb-3">{{ errorMsg }}</p>
    <p
      v-if="portfolio?.summary.incomplete"
      class="text-xs text-amber-500 mb-3"
    >
      部分基金缺少行情，汇总数据不完整
    </p>
    <p class="fund-pnl-tip">
      当日收益：海外/QDII 取昨日净值的变化（覆盖海外隔夜行情，通常今晚公布）；
      其余基金取今日盘中估值或今日已公布净值，对应日期的数据未出时暂不计入。
    </p>

    <div v-if="!portfolio" class="fund-empty">
      <span class="fund-empty-title">{{
        loading ? '基金持仓加载中…' : '基金持仓加载失败'
      }}</span>
    </div>

    <div v-else-if="!portfolio.items.length" class="fund-empty">
      <AppIcon name="funds" :size="32" class="fund-empty-icon"></AppIcon>
      <p class="fund-empty-title">还没有基金持仓</p>
      <p class="fund-empty-desc">
        添加后会按估值/净值自动计算当日收益和累计收益
      </p>
      <el-button type="primary" size="small" @click="openAdd"
        >添加第一支基金</el-button
      >
    </div>

    <template v-else>
      <div class="fund-groups">
        <section
          v-for="group in groupedItems"
          :key="group.category"
          class="fund-group"
        >
          <div class="fund-group-header">
            <span class="group-title">
              <i
                :style="{ backgroundColor: fundCategoryColor(group.category) }"
              ></i>
              {{ group.name }}
            </span>
            <span class="group-meta">
              {{ group.items.length }} 支 · 市值
              {{ formatAmount(group.marketValue) }} · 占比
              {{ formatPercent(group.ratio) }} ·
              <span :class="pnlClass(group.todayPnl)">
                今日
                {{
                  group.todayPnl === null
                    ? '--'
                    : formatSignedAmount(group.todayPnl)
                }}
              </span>
              ·
              <span :class="pnlClass(group.holdingPnl)">
                持仓 {{ formatSignedAmount(group.holdingPnl) }}
              </span>
              ·
              <span :class="pnlClass(group.totalPnl)">
                累计 {{ formatSignedAmount(group.totalPnl) }}
              </span>
            </span>
          </div>

          <div v-for="item in group.items" :key="item.id" class="fund-row">
            <div class="fund-identity">
              <div class="fund-name">
                <span>{{ item.fundName }}</span>
                <AppTag
                  v-if="item.status === 'partial'"
                  name="部分卖出"
                  color="#f59e0b"
                  size="small"
                />
                <AppTag
                  :name="fundStyleLabel(item.style)"
                  :color="fundStyleColor(item.style)"
                  size="small"
                />
              </div>
              <div class="fund-meta">
                <span>{{ item.fundCode }}</span>
                <span v-if="item.fundType">{{ item.fundType }}</span>
                <span v-if="item.remark" class="fund-remark">{{
                  item.remark
                }}</span>
              </div>
            </div>

            <div class="fund-quote">
              <span class="quote-nav">{{ formatNav(item.currentNav) }}</span>
              <span
                class="quote-change"
                :class="pnlClass(item.changePercent)"
              >
                {{ formatPercent(item.changePercent) }}
              </span>
              <span class="quote-mode">{{ quoteModeText(item) }}</span>
            </div>

            <div class="fund-position">
              <span class="position-main">{{
                formatAmount(item.marketValue)
              }}</span>
              <span class="position-sub">
                份额 {{ formatShares(item.shares) }} · 成本
                {{ formatNav(item.costNav) }}
              </span>
            </div>

            <div class="fund-pnl">
              <span :class="pnlClass(item.todayPnl)">{{
                formatItemPnl(item)
              }}</span>
              <span :class="pnlClass(item.totalPnl)">
                持仓 {{ formatSignedAmount(item.totalPnl) }}（{{
                  formatPercent(item.totalReturnRate)
                }}）
              </span>
              <span
                v-if="item.status === 'partial'"
                class="fund-realized"
                :class="pnlClass(item.realizedPnl)"
              >
                已实现 {{ formatSignedAmount(item.realizedPnl) }}
              </span>
            </div>

            <div class="fund-ratio">{{ formatPercent(item.ratio) }}</div>

            <div class="fund-actions">
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

      <div v-if="!groupedItems.length" class="fund-empty">
        <p class="fund-empty-title">当前没有持仓</p>
        <p v-if="clearedItems.length" class="fund-empty-desc">
          已清仓基金可点击上方「已清仓」按钮查看
        </p>
      </div>

      <p class="fund-footer">
        数据来源：东方财富公开基金数据；盘中为估值，净值以基金公司公布为准。
      </p>
    </template>

    <!-- 面板是固定高度的 flex 容器，弹窗 teleport 出去避免占位挤压内容 -->
    <Teleport to="body">
      <MarketFundHoldingDialog
        v-if="dialogVisible"
        :visible="dialogVisible"
        :item="editingItem"
        @close="dialogVisible = false"
        @save="handleSave"
      />
      <MarketFundClearedDialog
        v-if="clearedVisible"
        :visible="clearedVisible"
        :items="clearedItems"
        @close="clearedVisible = false"
        @edit="handleClearedEdit"
        @remove="remove"
      />
    </Teleport>
  </section>
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
  MarketFundPortfolioType,
} from '@/api/market/type';
import { ElMessage } from 'element-plus';
import { confirmHandler } from '@/utils/tool';
import { formatCny } from '../hooks/useMarketFundPortfolio';
import {
  FUND_CATEGORY_NAMES,
  FUND_CATEGORY_ORDER,
  fundCategoryColor,
  fundStyleColor,
  fundStyleLabel,
} from '../hooks/useMarketFundMeta';
import MarketFundClearedDialog from './MarketFundClearedDialog.vue';
import MarketFundHoldingDialog from './MarketFundHoldingDialog.vue';

type PropsType = {
  portfolio: MarketFundPortfolioType | null;
  loading: boolean;
  errorMsg: string;
};

const props = defineProps<PropsType>();

const emit = defineEmits<{
  (e: 'refresh'): void;
}>();

type GroupType = {
  category: MarketFundCategoryType;
  name: string;
  items: MarketFundHoldingItemType[];
  marketValue: number;
  ratio: number | null;
  todayPnl: number | null;
  holdingPnl: number;
  totalPnl: number;
};

const dialogVisible = ref(false);
const clearedVisible = ref(false);
const editingItem = ref<MarketFundHoldingItemType | null>(null);

const clearedItems = computed(() =>
  (props.portfolio?.items ?? []).filter((item) => item.status === 'cleared')
);

const groupedItems = computed<GroupType[]>(() => {
  if (!props.portfolio) return [];

  const groupMap = new Map<
    MarketFundCategoryType,
    MarketFundHoldingItemType[]
  >();
  FUND_CATEGORY_ORDER.forEach((category) => groupMap.set(category, []));
  props.portfolio.items
    .filter((item) => item.status !== 'cleared')
    .forEach((item) => {
      const list = groupMap.get(item.category) ?? groupMap.get('other');
      list?.push(item);
    });

  const statMap = new Map(
    props.portfolio.categories.map((item) => [item.category, item])
  );

  return FUND_CATEGORY_ORDER.map((category) => {
    const stat = statMap.get(category);
    return {
      category,
      name: FUND_CATEGORY_NAMES[category],
      items: groupMap.get(category) ?? [],
      marketValue: stat?.marketValue ?? 0,
      ratio: stat?.ratio ?? null,
      todayPnl: stat?.todayPnl ?? null,
      holdingPnl: stat?.totalPnl ?? 0,
      totalPnl: stat?.totalPnlIncludingRealized ?? 0,
    };
  }).filter((group) => group.items.length > 0);
});

/** 是否已有基金给出当日收益，否则汇总显示「待更新」 */
const hasTodayPnl = computed(() =>
  (props.portfolio?.items ?? []).some((item) => item.todayPnl !== null)
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

const formatNav = (value: number | null) =>
  value === null ? '--' : value.toFixed(4);

const formatShares = (value: number) =>
  value.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });

/**
 * 单只基金当日收益口径（与后端一致）：
 * 海外/QDII 取最新公布净值（通常为昨日净值），其余取今日估值或今日已公布净值。
 */
const formatItemPnl = (item: MarketFundHoldingItemType) => {
  if (item.todayPnl === null) return '今日待更新';
  if (item.category === 'overseas') {
    const date = item.navDate ? `${item.navDate.slice(5)} ` : '';
    return `${date}净值 ${formatSignedAmount(item.todayPnl)}`;
  }
  if (item.dataMode === 'estimate') {
    return `今日估算 ${formatSignedAmount(item.todayPnl)}`;
  }
  if (item.dataMode === 'nav') {
    return `今日净值 ${formatSignedAmount(item.todayPnl)}`;
  }
  return `最新 ${formatSignedAmount(item.todayPnl)}`;
};

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

const handleClearedEdit = (item: MarketFundHoldingItemType) => {
  clearedVisible.value = false;
  openEdit(item);
};

const handleSave = async (form: MarketFundHoldingFormType) => {
  try {
    const res = await saveMarketFundHoldingApi(form);
    if (res.code !== 0) return;
    ElMessage.success(form.id ? '修改成功' : '添加成功');
    dialogVisible.value = false;
    emit('refresh');
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
      emit('refresh');
      if (clearedVisible.value) {
        clearedVisible.value = false;
      }
    } catch (err) {
      console.error('删除基金持仓失败:', err);
    }
  });
};
</script>

<style lang="scss" scoped>
.fund-section {
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
  color: var(--el-color-primary);
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

.fund-pnl-tip {
  margin: 0 0 12px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--sys-text-secondary-color);
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
  grid-template-columns: minmax(220px, 2fr) 130px minmax(150px, 1.2fr) minmax(
      180px,
      1.4fr
    ) 80px 100px;
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
  min-height: 180px;
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
    grid-template-columns: minmax(180px, 1.6fr) 110px minmax(140px, 1fr) minmax(
        160px,
        1.2fr
      ) 70px 90px;
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
}
</style>
