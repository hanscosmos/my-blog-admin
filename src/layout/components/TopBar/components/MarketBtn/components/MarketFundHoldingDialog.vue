<template>
  <AppDialog :visible="visible" :title="isEdit ? '编辑基金持仓' : '添加基金持仓'" width="620px"
    @close="emit('close')" @confirm="handleConfirm">
    <el-form ref="formRef" :model="form" label-width="96px">
      <el-form-item label="基金" prop="fundCode">
        <div v-if="isEdit" class="fund-selected">
          <div class="fund-selected-name">{{ form.fundName }}</div>
          <div class="fund-selected-meta">{{ form.fundCode }} · {{ form.fundType }}</div>
        </div>
        <el-select v-else v-model="form.fundCode" filterable remote reserve-keyword
          :remote-method="handleSearch" :loading="searching" placeholder="输入基金代码或名称搜索"
          class="!w-full" @change="handleFundChange">
          <el-option v-for="option in searchOptions" :key="option.code"
            :label="`${option.name}（${option.code}）`" :value="option.code">
            <div class="fund-option">
              <span class="fund-option-name">{{ option.name }}</span>
              <span class="fund-option-meta">{{ option.code }} · {{ option.type }}</span>
            </div>
          </el-option>
        </el-select>
      </el-form-item>

      <div v-if="form.fundCode" class="fund-info">
        <span>{{ form.fundName }}</span>
        <span v-if="form.fundType">{{ form.fundType }}</span>
        <span v-if="form.company">{{ form.company }}</span>
        <span v-if="form.manager">基金经理 {{ form.manager }}</span>
        <span v-if="form.nav !== null">最新净值 {{ form.nav.toFixed(4) }}（{{ form.navDate }}）</span>
      </div>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="持有份额" prop="shares">
            <el-input-number v-model="form.shares" :min="0" :precision="4" :controls="false"
              class="!w-full" placeholder="如 12345.67" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="成本价" prop="costNav">
            <el-input-number v-model="form.costNav" :min="0" :precision="4" :controls="false"
              class="!w-full" placeholder="如 1.2345" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="资产类别">
            <el-select v-model="form.category" class="!w-full">
              <el-option v-for="option in categoryOptions" :key="option.value" :label="option.label"
                :value="option.value" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="管理方式">
            <el-select v-model="form.style" class="!w-full">
              <el-option v-for="option in styleOptions" :key="option.value" :label="option.label"
                :value="option.value" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <div class="fund-calc">
        <span>成本金额 {{ formatAmount(costAmount) }}</span>
        <span v-if="referenceMarketValue !== null">按最新净值估算市值 {{ formatAmount(referenceMarketValue) }}</span>
      </div>

      <el-form-item label="备注">
        <el-input v-model="form.remark" maxlength="255" placeholder="可选，如：定投 / 养老账户" />
      </el-form-item>
    </el-form>

    <p class="fund-tip">
      净值与基金类型由东方财富公开数据自动带出，估值仅供参考；份额和成本价请以基金账户为准。
    </p>
  </AppDialog>
</template>

<script setup lang="ts">
import { searchMarketFundApi } from '@/api/market';
import type {
  MarketFundCategoryType,
  MarketFundHoldingFormType,
  MarketFundHoldingItemType,
  MarketFundSearchItemType,
  MarketFundStyleType,
} from '@/api/market/type';
import { useDebounceFn } from '@vueuse/core';
import { ElMessage } from 'element-plus';
import { formatCny } from '../hooks/useMarketFundPortfolio';

type PropsType = {
  visible: boolean;
  item: MarketFundHoldingItemType | null;
};

const props = defineProps<PropsType>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'save', form: MarketFundHoldingFormType): void;
}>();

const formRef = ref();

const form = reactive({
  id: undefined as string | undefined,
  fundCode: '',
  fundName: '',
  fundType: '',
  company: '',
  manager: '',
  nav: null as number | null,
  navDate: '',
  shares: undefined as number | undefined,
  costNav: undefined as number | undefined,
  category: 'equity' as MarketFundCategoryType,
  style: 'passive' as MarketFundStyleType,
  remark: '',
  sort: 0,
});

const searchOptions = ref<MarketFundSearchItemType[]>([]);
const searching = ref(false);

const isEdit = computed(() => Boolean(form.id));

const categoryOptions: { label: string; value: MarketFundCategoryType }[] = [
  { label: '债券型', value: 'bond' },
  { label: '股票/指数', value: 'equity' },
  { label: '混合型', value: 'mixed' },
  { label: '海外/QDII', value: 'overseas' },
  { label: '货币型', value: 'money' },
  { label: '商品型', value: 'commodity' },
  { label: '其他', value: 'other' },
];

const styleOptions: { label: string; value: MarketFundStyleType }[] = [
  { label: '被动指数', value: 'passive' },
  { label: '主动管理', value: 'active' },
  { label: '未知', value: 'unknown' },
];

const costAmount = computed(() => (form.shares ?? 0) * (form.costNav ?? 0));

const referenceMarketValue = computed(() =>
  form.nav !== null && form.shares ? form.nav * form.shares : null
);

const formatAmount = (value: number | null) =>
  value === null ? '--' : formatCny(value);

const resetForm = () => {
  form.id = undefined;
  form.fundCode = '';
  form.fundName = '';
  form.fundType = '';
  form.company = '';
  form.manager = '';
  form.nav = null;
  form.navDate = '';
  form.shares = undefined;
  form.costNav = undefined;
  form.category = 'equity';
  form.style = 'passive';
  form.remark = '';
  form.sort = 0;
  searchOptions.value = [];
};

const fillFromItem = (item: MarketFundHoldingItemType) => {
  form.id = item.id;
  form.fundCode = item.fundCode;
  form.fundName = item.fundName;
  form.fundType = item.fundType;
  form.company = '';
  form.manager = '';
  form.nav = item.nav;
  form.navDate = item.navDate;
  form.shares = item.shares;
  form.costNav = item.costNav;
  form.category = item.category;
  form.style = item.style;
  form.remark = item.remark;
  form.sort = item.sort;
  searchOptions.value = [];
};

watch(
  () => props.visible,
  (visible) => {
    if (!visible) return;
    if (props.item) {
      fillFromItem(props.item);
    } else {
      resetForm();
    }
  },
  { immediate: true }
);

const handleFundChange = (code: string) => {
  const option = searchOptions.value.find((item) => item.code === code);
  if (!option) return;
  form.fundName = option.name;
  form.fundType = option.type;
  form.company = option.company;
  form.manager = option.manager;
  form.nav = option.nav;
  form.navDate = option.navDate;
  form.category = option.category;
  form.style = option.style;
};

const handleSearch = useDebounceFn(async (keyword: string) => {
  const value = keyword.trim();
  if (!value) {
    searchOptions.value = [];
    return;
  }
  searching.value = true;
  try {
    const { data } = await searchMarketFundApi(value);
    searchOptions.value = data ?? [];
    // 输入完整 6 位代码时自动选中，减少手动操作
    if (/^\d{6}$/.test(value)) {
      const exact = searchOptions.value.find((item) => item.code === value);
      if (exact) {
        form.fundCode = exact.code;
        handleFundChange(exact.code);
      }
    }
  } catch (err) {
    console.error('搜索基金失败:', err);
    searchOptions.value = [];
  } finally {
    searching.value = false;
  }
}, 300);

const handleConfirm = () => {
  if (!form.fundCode) {
    ElMessage.warning('请选择基金');
    return;
  }
  if (!form.shares || form.shares <= 0) {
    ElMessage.warning('请填写持有份额');
    return;
  }
  if (!form.costNav || form.costNav <= 0) {
    ElMessage.warning('请填写持仓成本价');
    return;
  }
  emit('save', {
    id: form.id,
    fundCode: form.fundCode,
    shares: form.shares,
    costNav: form.costNav,
    category: form.category,
    style: form.style,
    remark: form.remark.trim() || undefined,
    sort: form.sort,
  });
};
</script>

<style lang="scss" scoped>
.fund-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.fund-option-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fund-option-meta {
  flex-shrink: 0;
  font-size: 12px;
  color: var(--sys-text-secondary-color);
}

.fund-selected {
  width: 100%;
  padding: 6px 12px;
  border: 1px solid var(--sys-border-color);
  border-radius: 6px;
  background: var(--theme-hover);
}

.fund-selected-name {
  font-size: 14px;
  font-weight: 600;
}

.fund-selected-meta {
  margin-top: 2px;
  font-size: 12px;
  color: var(--sys-text-secondary-color);
}

.fund-info {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 16px;
  margin: -8px 0 14px 96px;
  font-size: 12px;
  color: var(--sys-text-secondary-color);
}

.fund-calc {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 20px;
  margin: -4px 0 14px 96px;
  font-size: 12px;
  color: var(--sys-text-secondary-color);
}

.fund-tip {
  margin-top: 4px;
  font-size: 12px;
  color: var(--sys-text-secondary-color);
}
</style>
