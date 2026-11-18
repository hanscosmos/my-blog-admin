<template>
  <div class="gold-converter">
    <div class="gold-mode">
      <span class="gold-mode-label">换算方向</span>
      <el-segmented v-model="mode" :options="modeOptions" size="small" />
    </div>

    <el-form label-width="72px" class="gold-form">
      <el-row :gutter="12">
        <el-col :span="12">
          <el-form-item :label="mode === 'intl' ? '国际金价' : '国内金价'">
            <el-input-number v-if="mode === 'intl'" v-model="intlPrice" :min="0" :precision="2"
              :controls="false" class="!w-full" placeholder="美元/盎司" />
            <el-input-number v-else v-model="domesticPrice" :min="0" :precision="2" :controls="false"
              class="!w-full" placeholder="元/克" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="汇率">
            <el-input-number v-model="exchangeRate" :min="0" :precision="4" :controls="false"
              class="!w-full" placeholder="美元兑人民币" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <div class="tool-result">
      <span class="tool-result-label">{{ resultLabel }}</span>
      <div class="flex items-baseline gap-2">
        <span class="tool-result-value font-beauty">{{ resultText }}</span>
        <span class="tool-result-unit">{{ resultUnit }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
type ConvertModeType = 'intl' | 'dom';

const GRAMS_PER_OUNCE = 31.1035;

const modeOptions: { label: string; value: ConvertModeType }[] = [
  { label: '国际 → 国内', value: 'intl' },
  { label: '国内 → 国际', value: 'dom' },
];

const mode = ref<ConvertModeType>('intl');
const intlPrice = ref<number>();
const domesticPrice = ref<number>();
const exchangeRate = ref<number>();

const isPositive = (value: number | null | undefined): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0;

/** 元/克 = 美元/盎司 × 汇率 ÷ 31.1035；反向则按同一公式倒算 */
const resultValue = computed<number | null>(() => {
  if (!isPositive(exchangeRate.value)) return null;
  if (mode.value === 'intl') {
    if (!isPositive(intlPrice.value)) return null;
    return (intlPrice.value * exchangeRate.value) / GRAMS_PER_OUNCE;
  }
  if (!isPositive(domesticPrice.value)) return null;
  return (domesticPrice.value * GRAMS_PER_OUNCE) / exchangeRate.value;
});

const resultLabel = computed(() =>
  mode.value === 'intl' ? '折算国内金价' : '折算国际金价'
);

const resultUnit = computed(() => (mode.value === 'intl' ? '元/克' : '美元/盎司'));

const resultText = computed(() => {
  if (resultValue.value === null) return '--';
  return resultValue.value.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
});
</script>

<style lang="scss" scoped>
.gold-mode {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 16px;
}

.gold-mode-label {
  font-size: 13px;
  color: var(--sys-text-secondary-color);
}

.gold-form {
  :deep(.el-form-item) {
    margin-bottom: 0;
  }
}

.tool-result {
  padding: 12px;
  margin-top: 16px;
  border-radius: 6px;
  background-color: var(--theme-hover);
}

.tool-result-label {
  display: block;
  margin-bottom: 4px;
  font-size: 12px;
  color: var(--sys-text-secondary-color);
}

.tool-result-value {
  font-size: 32px;
  line-height: 1.2;
}

.tool-result-unit {
  font-size: 14px;
  color: var(--sys-text-secondary-color);
}
</style>
