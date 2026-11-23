<template>
  <el-drawer
    v-model="visible"
    title="持仓分析"
    :size="drawerSize"
    :lock-scroll="false"
    append-to-body
  >
    <el-tabs v-model="activeTab" class="analysis-tabs">
      <el-tab-pane label="资产配置" name="allocation">
        <div v-if="segments.length" class="analysis-pane">
          <p class="analysis-hint">
            点击扇区或图例可下钻查看类别内的单只基金，返回后可切换其他类别
          </p>
          <MarketAllocationChart
            :segments="segments"
            :breakdown="breakdown"
            :total-text="totalText"
            :hidden="hidden"
            @select="selectGroup"
          />
        </div>
        <el-empty
          v-else
          description="暂无资产配置数据"
          :image-size="80"
        />
      </el-tab-pane>

      <el-tab-pane label="趋势分析" name="trend" lazy>
        <MarketHoldingTrend
          :scope="scope"
          :snapshots="snapshots"
          :loading="loading"
          :recording="recording"
          :error-msg="errorMsg"
          :hidden="hidden"
          @change-scope="emit('update:scope', $event)"
          @retry="emit('retry')"
          @record="emit('record')"
        />
      </el-tab-pane>
    </el-tabs>
  </el-drawer>
</template>

<script setup lang="ts">
import type {
  AllocationBreakdownType,
  HoldingAnalysisTabType,
  HoldingTrendScopeType,
} from '../type';
import type { MarketHoldingSnapshotType } from '@/api/market/type';
import MarketAllocationChart from './MarketAllocationChart.vue';
import MarketHoldingTrend from './MarketHoldingTrend.vue';

type SegmentType = {
  key: string;
  name: string;
  value: number;
  color: string;
  ratio: number | null;
};

const props = defineProps<{
  visible: boolean;
  tab: HoldingAnalysisTabType;
  scope: HoldingTrendScopeType;
  segments: SegmentType[];
  breakdown: AllocationBreakdownType;
  totalText: string;
  hidden: boolean;
  snapshots: MarketHoldingSnapshotType[];
  loading: boolean;
  recording: boolean;
  errorMsg: string;
}>();

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'update:tab', value: HoldingAnalysisTabType): void;
  (e: 'update:scope', scope: HoldingTrendScopeType): void;
  (e: 'retry'): void;
  (e: 'record'): void;
}>();

const drawerSize = 'min(760px, 92vw)';

const visible = computed({
  get: () => props.visible,
  set: (value: boolean) => emit('update:visible', value),
});

const activeTab = computed({
  get: () => props.tab,
  set: (value: string) => emit('update:tab', value as HoldingAnalysisTabType),
});

/** 圆环图的 key 与快照 group 对齐 */
const segmentGroup = (key: string) =>
  key.startsWith('fund_') ? key.slice(5) : key;

const selectGroup = (key: string) => {
  const segment = props.segments.find((item) => item.key === key);
  emit('update:scope', {
    type: 'group',
    group: segmentGroup(key),
    name: segment?.name ?? segmentGroup(key),
  });
  emit('update:tab', 'trend');
};
</script>

<style lang="scss" scoped>
.analysis-tabs {
  // 全局把 el-tabs__header 的 margin-bottom 置 0 了，这里给内容区补间距
  :deep(.el-tabs__content) {
    padding-top: 20px;
  }
}

.analysis-pane {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.analysis-hint {
  margin: 0;
  font-size: 12px;
  color: var(--sys-text-secondary-color);
}
</style>
