<template>
  <AppDialog
    :visible="visible"
    :title="isEdit ? '编辑实物资产' : '添加实物资产'"
    width="760px"
    @close="emit('close')"
    @confirm="handleConfirm"
  >
    <el-form :model="form" label-width="100px">
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="资产类别" required>
            <el-select
              v-model="form.category"
              filterable
              placeholder="选择类别"
              class="!w-full"
            >
              <el-option-group label="预设类别">
                <el-option
                  v-for="item in presetOptions"
                  :key="item.key"
                  :label="item.name"
                  :value="item.key"
                />
              </el-option-group>
              <el-option-group v-if="customOptions.length" label="自定义类别">
                <el-option
                  v-for="item in customOptions"
                  :key="item.key"
                  :label="item.name"
                  :value="item.key"
                />
              </el-option-group>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="资产名称" required>
            <el-input
              v-model="form.name"
              maxlength="128"
              placeholder="如：自住房、家用车、黄金 100g"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="当前估值" required>
            <el-input-number
              v-model="form.currentValue"
              :min="0"
              :precision="2"
              :controls="false"
              class="!w-full"
              placeholder="当前市场价值"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="购入成本" required>
            <el-input-number
              v-model="form.costValue"
              :min="0"
              :precision="2"
              :controls="false"
              class="!w-full"
              placeholder="购买时花费"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="购入日期">
            <el-date-picker
              v-model="form.purchaseDate"
              type="date"
              value-format="YYYY-MM-DD"
              placeholder="选择日期"
              class="!w-full"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="估值日期">
            <el-date-picker
              v-model="form.valuationDate"
              type="date"
              value-format="YYYY-MM-DD"
              placeholder="选择日期"
              class="!w-full"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <div class="physical-calc">
        <span>累计盈亏 {{ formatAmount(pnl) }}</span>
        <span>收益率 {{ formatPercent(returnRate) }}</span>
      </div>

      <el-form-item label="资产图片">
        <PhysicalImageUploader
          v-model:cover="form.cover"
          v-model:images="form.images"
        />
      </el-form-item>

      <el-form-item label="备注">
        <el-input
          v-model="form.remark"
          maxlength="255"
          placeholder="可选，如：位置、型号、购入渠道"
        />
      </el-form-item>
    </el-form>

    <p class="physical-tip">
      实物资产独立统计，不计入金融资产总资产、资产配置和持仓趋势。估值需要手动更新；
      自定义类别可在「系统管理 → 字典 → 实物资产类别」中维护。
    </p>
  </AppDialog>
</template>

<script setup lang="ts">
import type {
  MarketPhysicalCategoryOptionType,
  MarketPhysicalHoldingFormType,
  MarketPhysicalItemType,
} from '@/api/market/type';
import dayjs from 'dayjs';
import { ElMessage } from 'element-plus';
import { formatCny } from '../hooks/useMarketFundPortfolio';
import PhysicalImageUploader from './PhysicalImageUploader.vue';

type PropsType = {
  visible: boolean;
  item: MarketPhysicalItemType | null;
  categoryOptions: MarketPhysicalCategoryOptionType[];
};

const props = defineProps<PropsType>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'save', form: MarketPhysicalHoldingFormType): void;
}>();

const form = reactive({
  id: undefined as string | undefined,
  category: '',
  name: '',
  currentValue: undefined as number | undefined,
  costValue: undefined as number | undefined,
  cover: '',
  images: [] as string[],
  purchaseDate: '',
  valuationDate: '',
  remark: '',
  sort: 0,
});

const isEdit = computed(() => Boolean(form.id));

/** 历史类别被删除后仍保留在下拉中，便于编辑其他字段 */
const selectOptions = computed<MarketPhysicalCategoryOptionType[]>(() => {
  const options = [...props.categoryOptions];
  const current = props.item;
  if (current && !options.some((option) => option.key === current.category)) {
    options.push({
      key: current.category,
      name: current.categoryName || '其他',
      preset: false,
    });
  }
  return options;
});

const presetOptions = computed(() =>
  selectOptions.value.filter((item) => item.preset)
);
const customOptions = computed(() =>
  selectOptions.value.filter((item) => !item.preset)
);

const pnl = computed(() => (form.currentValue ?? 0) - (form.costValue ?? 0));
const returnRate = computed(() => {
  const cost = form.costValue ?? 0;
  return cost > 0 ? (pnl.value / cost) * 100 : null;
});

const formatAmount = (value: number | null) =>
  value === null ? '--' : formatCny(value, true);

const formatPercent = (value: number | null) =>
  value === null ? '--' : `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;

const resetForm = () => {
  form.id = undefined;
  form.category =
    presetOptions.value.find((item) => item.key === 'house')?.key ??
    presetOptions.value[0]?.key ??
    'other';
  form.name = '';
  form.currentValue = undefined;
  form.costValue = undefined;
  form.cover = '';
  form.images = [];
  form.purchaseDate = '';
  form.valuationDate = dayjs().format('YYYY-MM-DD');
  form.remark = '';
  form.sort = 0;
};

const fillFromItem = (item: MarketPhysicalItemType) => {
  form.id = item.id;
  form.category = item.category;
  form.name = item.name;
  form.currentValue = item.currentValue;
  form.costValue = item.costValue;
  form.cover = item.cover;
  form.images = [...item.images];
  form.purchaseDate = item.purchaseDate;
  form.valuationDate = item.valuationDate;
  form.remark = item.remark;
  form.sort = item.sort;
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

const handleConfirm = () => {
  if (!form.category) {
    ElMessage.warning('请选择资产类别');
    return;
  }
  const name = form.name.trim();
  if (!name) {
    ElMessage.warning('请填写资产名称');
    return;
  }
  if (
    form.currentValue === undefined ||
    form.currentValue === null ||
    form.currentValue < 0
  ) {
    ElMessage.warning('请填写当前估值');
    return;
  }
  if (
    form.costValue === undefined ||
    form.costValue === null ||
    form.costValue < 0
  ) {
    ElMessage.warning('请填写购入成本');
    return;
  }

  emit('save', {
    id: form.id,
    category: form.category,
    name,
    currentValue: form.currentValue,
    costValue: form.costValue,
    cover: form.cover,
    images: form.images,
    purchaseDate: form.purchaseDate,
    valuationDate: form.valuationDate,
    remark: form.remark.trim() || undefined,
    sort: form.sort,
  });
};
</script>

<style lang="scss" scoped>
.physical-calc {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 20px;
  margin: -4px 0 14px 100px;
  font-size: 12px;
  color: var(--sys-text-secondary-color);
}

.physical-tip {
  margin: 0;
  font-size: 12px;
  color: var(--sys-text-secondary-color);
}
</style>
