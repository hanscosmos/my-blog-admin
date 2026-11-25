<template>
  <div ref="rootRef" class="physical-panel">
    <el-skeleton v-if="initialLoading" animated>
      <template #template>
        <div
          class="rounded-lg px-4 py-4 mb-4"
          style="border: 1px solid var(--sys-border-color)"
        >
          <el-skeleton-item variant="text" style="width: 20%" />
          <div class="mt-3">
            <el-skeleton-item variant="h1" style="width: 40%" />
          </div>
        </div>
        <div
          class="rounded-lg px-4 py-4"
          style="border: 1px solid var(--sys-border-color)"
        >
          <div
            v-for="n in 4"
            :key="n"
            class="flex items-center justify-between py-3"
          >
            <el-skeleton-item variant="text" style="width: 35%" />
            <el-skeleton-item variant="text" style="width: 18%" />
            <el-skeleton-item variant="text" style="width: 18%" />
          </div>
        </div>
      </template>
    </el-skeleton>

    <div v-else-if="initialFailed" class="physical-empty">
      实物资产加载失败，点击右上角刷新重试
    </div>

    <template v-else>
      <div class="physical-summary">
        <div class="physical-total">
          <span class="summary-label">实物资产合计</span>
          <span class="physical-total-value">{{
            formatAmount(totalValue)
          }}</span>
          <span class="physical-total-sub">
            共 {{ totalCount }} 项 · 购入成本 {{ formatAmount(totalCost) }}
          </span>
        </div>

        <div class="physical-stats">
          <div class="summary-item">
            <span class="summary-label">累计盈亏</span>
            <span class="summary-value" :class="pnlClass(totalPnl)">
              {{ formatSignedAmount(totalPnl) }}
            </span>
            <span class="summary-sub" :class="pnlClass(totalPnl)">
              {{ formatPercent(totalReturnRate) }}
            </span>
          </div>
        </div>

        <div class="physical-actions" data-export-ignore>
          <el-button type="primary" plain size="small" @click="openAdd">
            添加资产
          </el-button>
        </div>
      </div>

      <div v-if="segments.length" class="physical-allocation">
        <div class="allocation-bar">
          <div
            v-for="segment in segments"
            :key="segment.key"
            class="allocation-segment"
            :style="{
              width: `${segment.ratio ?? 0}%`,
              backgroundColor: physicalCategoryColor(
                segment.key,
                categoryOptions
              ),
            }"
            :title="`${segment.name} ${formatRatio(segment.ratio)}`"
          ></div>
        </div>
      </div>

      <p v-if="errorMsg" class="text-xs text-amber-500 mb-3">
        {{ errorMsg }}
      </p>

      <div class="physical-scroll">
        <div v-if="!items.length" class="physical-empty">
          <AppIcon name="pic" :size="32" class="physical-empty-icon" />
          <p class="physical-empty-title">还没有实物资产</p>
          <p class="physical-empty-desc">
            可以记录房产、车辆、贵金属、收藏品等，估值和图片都由你手动维护
          </p>
          <el-button type="primary" size="small" @click="openAdd">
            添加第一项资产
          </el-button>
        </div>

        <template v-else>
          <div class="physical-groups">
            <section
              v-for="group in groups"
              :key="group.key"
              class="physical-group"
            >
              <div class="physical-group-header">
                <span class="group-title">
                  <i
                    :style="{
                      backgroundColor: physicalCategoryColor(
                        group.key,
                        categoryOptions
                      ),
                    }"
                  ></i>
                  {{ group.name }}
                </span>
                <span class="group-meta">
                  {{ group.count }} 项 · 估值 {{ formatAmount(group.value) }} ·
                  成本 {{ formatAmount(group.cost) }} · 累计
                  <span :class="pnlClass(group.pnl)">{{
                    formatSignedAmount(group.pnl)
                  }}</span>
                </span>
              </div>

              <div
                v-for="item in group.items"
                :key="item.id"
                class="physical-row"
              >
                <div class="physical-identity">
                  <el-image
                    v-if="itemImages(item).length"
                    :src="itemImages(item)[0]"
                    :preview-src-list="itemImages(item)"
                    :initial-index="0"
                    preview-teleported
                    fit="cover"
                    class="physical-cover"
                  />
                  <div v-else class="physical-cover physical-cover-placeholder">
                    <AppIcon name="pic" :size="20" />
                  </div>
                  <div class="physical-name-block">
                    <div class="physical-name">{{ item.name }}</div>
                    <div class="physical-meta">
                      <span v-if="item.remark">{{ item.remark }}</span>
                      <span v-if="item.purchaseDate">
                        购入 {{ item.purchaseDate }}
                      </span>
                    </div>
                  </div>
                </div>

                <div class="physical-value">
                  <span class="value-main">{{
                    formatAmount(item.currentValue)
                  }}</span>
                  <span class="value-sub">
                    成本 {{ formatAmount(item.costValue) }}
                  </span>
                </div>

                <div class="physical-pnl">
                  <span :class="pnlClass(item.pnl)">{{
                    formatSignedAmount(item.pnl)
                  }}</span>
                  <span class="pnl-sub" :class="pnlClass(item.pnl)">{{
                    formatPercent(item.returnRate)
                  }}</span>
                </div>

                <div class="physical-date">
                  <span>{{ item.valuationDate || '—' }}</span>
                  <span class="date-sub">估值日期</span>
                </div>

                <div class="physical-row-actions" data-export-ignore>
                  <el-button link type="primary" @click="openEdit(item)">
                    编辑
                  </el-button>
                  <el-button link type="danger" @click="remove(item)">
                    删除
                  </el-button>
                </div>
              </div>
            </section>
          </div>

          <p class="physical-footer">
            实物资产仅在本页独立统计，不计入金融资产总资产、资产配置与持仓趋势；
            估值需要手动更新。
          </p>
        </template>
      </div>
    </template>

    <Teleport v-if="dialogVisible" to="body">
      <PhysicalAssetDialog
        :visible="dialogVisible"
        :item="editingItem"
        :category-options="categoryOptions"
        @close="dialogVisible = false"
        @save="handleSave"
      />
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import {
  deleteMarketPhysicalHoldingApi,
  saveMarketPhysicalHoldingApi,
} from '@/api/market';
import type {
  MarketPhysicalCategoryOptionType,
  MarketPhysicalHoldingFormType,
  MarketPhysicalItemType,
} from '@/api/market/type';
import { ElMessage } from 'element-plus';
import { confirmHandler } from '@/utils/tool';
import { exportElementAsImage } from '@/utils/exportImage';
import { formatCny } from '../hooks/useMarketFundPortfolio';
import { useAmountVisibility } from '../hooks/useAmountVisibility';
import { usePhysicalAssetPortfolio } from '../hooks/usePhysicalAssetPortfolio';
import { physicalCategoryColor } from '../hooks/usePhysicalAssetMeta';
import PhysicalAssetDialog from './PhysicalAssetDialog.vue';

const rootRef = ref<HTMLElement | null>(null);
const dialogVisible = ref(false);
const editingItem = ref<MarketPhysicalItemType | null>(null);

const { maskAmount } = useAmountVisibility();
const { portfolio, loading, errorMsg, refresh } = usePhysicalAssetPortfolio();

const initialLoading = computed(
  () =>
    !portfolio.value && (loading.value || (!errorMsg.value && !portfolio.value))
);
const initialFailed = computed(
  () => !portfolio.value && !loading.value && Boolean(errorMsg.value)
);

const items = computed(() => portfolio.value?.items ?? []);
const categories = computed(() => portfolio.value?.categories ?? []);
const categoryOptions = computed<MarketPhysicalCategoryOptionType[]>(
  () => portfolio.value?.categoryOptions ?? []
);
const summary = computed(() => portfolio.value?.summary ?? null);

const totalCount = computed(() => summary.value?.count ?? 0);
const totalValue = computed(() => summary.value?.totalValue ?? 0);
const totalCost = computed(() => summary.value?.totalCost ?? 0);
const totalPnl = computed(() => summary.value?.totalPnl ?? 0);
const totalReturnRate = computed(() => summary.value?.totalReturnRate ?? null);

const segments = computed(() =>
  categories.value.filter((category) => category.value > 0)
);

type GroupType = {
  key: string;
  name: string;
  count: number;
  value: number;
  cost: number;
  pnl: number;
  items: MarketPhysicalItemType[];
};

const groups = computed<GroupType[]>(() =>
  categories.value
    .map((category) => ({
      key: category.key,
      name: category.name,
      count: category.count,
      value: category.value,
      cost: category.cost,
      pnl: category.pnl,
      items: items.value.filter((item) => item.category === category.key),
    }))
    .filter((group) => group.items.length > 0)
);

const itemImages = (item: MarketPhysicalItemType) => {
  const list = [item.cover, ...item.images].filter(Boolean);
  return [...new Set(list)];
};

const pnlClass = (value: number | null) =>
  value === null
    ? ''
    : value > 0
      ? 'text-red-500'
      : value < 0
        ? 'text-green-500'
        : '';

const formatAmount = (value: number | null) =>
  value === null ? '--' : maskAmount(formatCny(value));

const formatSignedAmount = (value: number | null) =>
  value === null ? '--' : maskAmount(formatCny(value, true));

const formatPercent = (value: number | null) =>
  value === null ? '--' : `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;

const formatRatio = (value: number | null) =>
  value === null ? '--' : `${value.toFixed(2)}%`;

const openAdd = () => {
  editingItem.value = null;
  dialogVisible.value = true;
};

const openEdit = (item: MarketPhysicalItemType) => {
  editingItem.value = item;
  dialogVisible.value = true;
};

const handleSave = async (form: MarketPhysicalHoldingFormType) => {
  try {
    const res = await saveMarketPhysicalHoldingApi(form);
    if (res.code !== 0) return;
    ElMessage.success(form.id ? '修改成功' : '添加成功');
    dialogVisible.value = false;
    refresh();
  } catch (err) {
    console.error('保存实物资产失败:', err);
  }
};

const remove = (item: MarketPhysicalItemType) => {
  confirmHandler(`您将删除「${item.name}」的记录`, async () => {
    try {
      const res = await deleteMarketPhysicalHoldingApi({ ids: [item.id] });
      if (res.code !== 0) return;
      ElMessage.success('删除成功');
      refresh();
    } catch (err) {
      console.error('删除实物资产失败:', err);
    }
  });
};

const exportImage = () =>
  exportElementAsImage(rootRef.value, {
    title: '我的资产 · 实物资产',
    subtitle: portfolio.value?.updateTime
      ? `更新于 ${portfolio.value.updateTime}`
      : '',
    filename: '我的资产-实物资产',
  });

defineExpose({
  updateTime: computed(() => portfolio.value?.updateTime ?? ''),
  stale: computed(() => false),
  ready: computed(() => Boolean(portfolio.value)),
  loading: computed(() => loading.value),
  refresh,
  exportImage,
});
</script>

<style lang="scss" scoped>
.physical-panel {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  padding-bottom: 1rem;
}

.physical-summary {
  --physical-value-color: #7c3aed;
  --physical-value-gradient: linear-gradient(180deg, #a78bfa 0%, #6d28d9 100%);

  display: flex;
  flex: none;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px 40px;
  padding: 16px 20px;
  margin-bottom: 12px;
  background: linear-gradient(
    135deg,
    rgba(139, 92, 246, 0.1),
    rgba(14, 165, 233, 0.05) 55%,
    transparent 78%
  );
  border: 1px solid var(--sys-border-color);
  border-radius: 8px;
}

:global(html.dark) .physical-summary {
  --physical-value-color: #c4b5fd;
  --physical-value-gradient: linear-gradient(180deg, #ddd6fe 0%, #a78bfa 100%);
}

.physical-total {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 200px;
}

.physical-total-value {
  font-size: 28px;
  font-weight: 600;
  line-height: 1.1;
  color: var(--physical-value-color);
  background: var(--physical-value-gradient);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.physical-total-sub {
  font-size: 12px;
  color: var(--sys-text-secondary-color);
}

.physical-stats {
  display: flex;
  flex: none;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 36px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 120px;
}

.summary-label {
  font-size: 12px;
  color: var(--sys-text-secondary-color);
}

.summary-value {
  font-size: 18px;
  font-weight: 600;
  line-height: 1.2;
}

.summary-sub {
  font-size: 12px;
}

.physical-actions {
  display: flex;
  flex: none;
  align-items: center;
  gap: 4px;
  margin-left: auto;
}

.physical-allocation {
  flex: none;
  margin-bottom: 14px;
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

.physical-scroll {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
}

.physical-groups {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.physical-group {
  overflow: hidden;
  border: 1px solid var(--sys-border-color);
  border-radius: 8px;
}

.physical-group-header {
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

.physical-row {
  display: grid;
  grid-template-columns:
    minmax(240px, 2.2fr) minmax(140px, 1.2fr) minmax(150px, 1.2fr)
    100px 120px;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-top: 1px solid var(--sys-border-color);
  transition: background-color 0.2s ease-in-out;

  &:hover {
    background: var(--theme-hover);
  }
}

.physical-identity {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.physical-cover {
  flex: none;
  width: 56px;
  height: 56px;
  border-radius: 6px;
  overflow: hidden;
}

.physical-cover-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--sys-text-secondary-color);
  background: var(--theme-hover);
  border: 1px dashed var(--sys-border-color);
}

.physical-name-block {
  min-width: 0;
}

.physical-name {
  overflow: hidden;
  font-size: 13px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.physical-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 8px;
  margin-top: 3px;
  font-size: 11px;
  color: var(--sys-text-secondary-color);
}

.physical-value,
.physical-pnl,
.physical-date {
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: 13px;
}

.value-main {
  font-weight: 600;
}

.value-sub,
.pnl-sub,
.date-sub {
  font-size: 11px;
  color: var(--sys-text-secondary-color);
}

.date-sub {
  color: var(--sys-text-secondary-color);
}

.physical-row-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;

  :deep(.el-button + .el-button) {
    margin-left: 0;
  }
}

.physical-footer {
  margin: 0 0 8px;
  font-size: 12px;
  color: var(--sys-text-secondary-color);
}

.physical-empty {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 240px;
  font-size: 13px;
  color: var(--sys-text-secondary-color);
}

.physical-empty-icon {
  color: var(--sys-text-secondary-color);
}

.physical-empty-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--sys-text-color);
}

.physical-empty-desc {
  margin: 0 0 6px;
  font-size: 12px;
  color: var(--sys-text-secondary-color);
}

@media (max-width: 767px) {
  .physical-summary {
    gap: 14px 20px;
  }

  .physical-total {
    min-width: 100%;
  }

  .physical-row {
    grid-template-columns: minmax(200px, 1fr) 120px;
    row-gap: 8px;
  }

  .physical-date,
  .physical-row-actions {
    grid-column: span 1;
  }
}
</style>
