<template>
  <AppDialog
    :visible="visible"
    :title="dialogTitle"
    width="640px"
    @close="emit('close')"
    @confirm="handleConfirm"
  >
    <el-form :model="form" label-width="108px">
      <el-form-item label="资产类型">
        <el-radio-group v-model="form.kind" :disabled="isEdit">
          <el-radio-button label="money_fund"
            >余额宝 / 货币基金</el-radio-button
          >
          <el-radio-button label="deposit">银行存款</el-radio-button>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="名称">
        <el-input
          v-model="form.name"
          maxlength="128"
          :placeholder="
            isMoneyFund ? '如：余额宝' : '如：招商银行 3 年定期'
          "
        />
      </el-form-item>

      <template v-if="isMoneyFund">
        <el-form-item label="基金代码">
          <el-input
            v-model="form.fundCode"
            maxlength="6"
            placeholder="默认 000198（天弘余额宝货币）"
          />
        </el-form-item>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="当前余额">
              <el-input-number
                v-model="form.balance"
                :min="0"
                :precision="2"
                :controls="false"
                class="!w-full"
                placeholder="以支付宝为准"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="累计收益">
              <el-input-number
                v-model="form.totalPnl"
                :precision="2"
                :controls="false"
                class="!w-full"
                placeholder="支付宝可查，用于计算本金"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="昨日收益">
              <el-input-number
                v-model="form.yesterdayPnl"
                :min="0"
                :precision="2"
                :controls="false"
                class="!w-full"
                placeholder="留空按行情预估"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="七日年化">
              <el-input-number
                v-model="form.annualRate"
                :min="0"
                :precision="4"
                :controls="false"
                class="!w-full"
                placeholder="留空使用行情"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <div class="cash-calc">
          <span>持有本金 {{ formatAmount(moneyFundPrincipal) }}</span>
          <span>预估昨日收益 {{ formatAmount(estimatedYesterdayPnl) }}</span>
          <span>累计收益率 {{ formatPercent(moneyFundReturnRate) }}</span>
        </div>
        <p v-if="quoteHint" class="cash-quote-hint">{{ quoteHint }}</p>
      </template>

      <template v-else>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="存款本金">
              <el-input-number
                v-model="form.principal"
                :min="0"
                :precision="2"
                :controls="false"
                class="!w-full"
                placeholder="存入金额"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="年利率(%)">
              <el-input-number
                v-model="form.annualRate"
                :min="0"
                :precision="4"
                :controls="false"
                class="!w-full"
                placeholder="如 1.75"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="计息方式">
              <el-radio-group v-model="form.interestType">
                <el-radio-button label="demand">活期</el-radio-button>
                <el-radio-button label="fixed">定期</el-radio-button>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="起存日">
              <el-date-picker
                v-model="form.startDate"
                type="date"
                value-format="YYYY-MM-DD"
                placeholder="选择日期"
                class="!w-full"
              />
            </el-form-item>
          </el-col>
          <el-col v-if="form.interestType === 'fixed'" :span="12">
            <el-form-item label="到期日">
              <el-date-picker
                v-model="form.endDate"
                type="date"
                value-format="YYYY-MM-DD"
                placeholder="选择日期"
                class="!w-full"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <div
          v-if="form.interestType === 'fixed'"
          class="quick-term"
        >
          <span class="quick-term-label">快捷期限</span>
          <el-button
            v-for="option in QUICK_TERMS"
            :key="option.label"
            link
            type="primary"
            size="small"
            @click="applyTerm(option)"
            >{{ option.label }}</el-button
          >
        </div>

        <div class="cash-calc">
          <span>已计息 {{ depositDays }} 天</span>
          <span>应计利息 {{ formatAmount(depositInterest) }}</span>
          <span>当前余额 {{ formatAmount(depositBalance) }}</span>
          <span>日利息 {{ formatAmount(depositDailyInterest) }}</span>
          <span v-if="depositMaturityInterest !== null">
            到期利息 {{ formatAmount(depositMaturityInterest) }}
          </span>
        </div>
      </template>

      <el-form-item label="备注">
        <el-input
          v-model="form.remark"
          maxlength="255"
          placeholder="可选，如：余额宝主账户 / 工资卡定存"
        />
      </el-form-item>
    </el-form>

    <p class="cash-tip">
      <template v-if="isMoneyFund">
        余额宝等货币基金没有净值波动，收益按万份收益结算。当前余额与累计收益请以支付宝为准，
        本金由「余额 − 累计收益」推导；昨日收益/七日年化留空时按行情自动预估。
      </template>
      <template v-else>
        存款按本金、年利率和已计息天数计算单利（365 天/年），未考虑提前支取、利率调整和利息税，
        实际收益以银行结算为准。
      </template>
    </p>
  </AppDialog>
</template>

<script setup lang="ts">
import type {
  MarketCashHoldingFormType,
  MarketCashInterestType,
  MarketCashItemType,
  MarketCashKindType,
} from '@/api/market/type';
import dayjs from 'dayjs';
import { ElMessage } from 'element-plus';
import { formatCny } from '../hooks/useMarketFundPortfolio';

type PropsType = {
  visible: boolean;
  item: MarketCashItemType | null;
};

type QuickTermType = {
  label: string;
  amount: number;
  unit: 'month' | 'year';
};

const props = defineProps<PropsType>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'save', form: MarketCashHoldingFormType): void;
}>();

const QUICK_TERMS: QuickTermType[] = [
  { label: '3个月', amount: 3, unit: 'month' },
  { label: '6个月', amount: 6, unit: 'month' },
  { label: '1年', amount: 1, unit: 'year' },
  { label: '3年', amount: 3, unit: 'year' },
  { label: '5年', amount: 5, unit: 'year' },
];

const form = reactive({
  id: undefined as string | undefined,
  kind: 'money_fund' as MarketCashKindType,
  name: '余额宝',
  fundCode: '000198',
  balance: undefined as number | undefined,
  totalPnl: 0 as number | undefined,
  principal: undefined as number | undefined,
  annualRate: undefined as number | undefined,
  yesterdayPnl: undefined as number | undefined,
  interestType: 'demand' as MarketCashInterestType,
  startDate: '',
  endDate: '',
  remark: '',
  sort: 0,
});

const isEdit = computed(() => Boolean(form.id));
const isMoneyFund = computed(() => form.kind === 'money_fund');
const dialogTitle = computed(() =>
  isEdit.value
    ? '编辑现金/存款'
    : isMoneyFund.value
      ? '添加余额宝'
      : '添加银行存款'
);

const moneyFundPrincipal = computed(
  () => (form.balance ?? 0) - (form.totalPnl ?? 0)
);

const moneyFundReturnRate = computed(() => {
  const principal = moneyFundPrincipal.value;
  return principal > 0 ? ((form.totalPnl ?? 0) / principal) * 100 : null;
});

const estimatedYesterdayPnl = computed(() => {
  if (form.yesterdayPnl !== undefined && form.yesterdayPnl !== null) {
    return form.yesterdayPnl;
  }
  const balance = form.balance ?? 0;
  if (props.item?.dailyIncome != null) {
    return (balance / 10000) * props.item.dailyIncome;
  }
  const rate = form.annualRate ?? props.item?.sevenDayRate ?? null;
  return rate === null ? null : (balance * rate) / 100 / 365;
});

const quoteHint = computed(() => {
  if (!props.item || props.item.kind !== 'money_fund') {
    return '保存后按最新万份收益自动预估昨日收益。';
  }
  const parts: string[] = [];
  if (props.item.dailyIncome !== null) {
    parts.push(`万份收益 ${props.item.dailyIncome.toFixed(4)}`);
  }
  if (props.item.sevenDayRate !== null) {
    parts.push(`七日年化 ${props.item.sevenDayRate.toFixed(2)}%`);
  }
  if (props.item.quoteDate) {
    parts.push(props.item.quoteDate);
  }
  return parts.length ? `当前行情：${parts.join(' · ')}` : '';
});

const daysBetween = (start: string, end: string) =>
  Math.max(
    0,
    dayjs(end).startOf('day').diff(dayjs(start).startOf('day'), 'day') + 1
  );

const depositDays = computed(() => {
  if (!form.startDate) return 0;
  const end =
    form.interestType === 'fixed' && form.endDate
      ? dayjs(form.endDate).isBefore(dayjs())
        ? form.endDate
        : dayjs().format('YYYY-MM-DD')
      : dayjs().format('YYYY-MM-DD');
  return daysBetween(form.startDate, end);
});

const depositPrincipal = computed(() => form.principal ?? 0);
const depositRate = computed(() => form.annualRate ?? 0);
const depositDailyInterest = computed(
  () => (depositPrincipal.value * depositRate.value) / 100 / 365
);
const depositInterest = computed(
  () => depositDailyInterest.value * depositDays.value
);
const depositBalance = computed(
  () => depositPrincipal.value + depositInterest.value
);
const depositMaturityInterest = computed(() => {
  if (form.interestType !== 'fixed' || !form.startDate || !form.endDate) {
    return null;
  }
  return (
    depositDailyInterest.value * daysBetween(form.startDate, form.endDate)
  );
});

const formatAmount = (value: number | null) =>
  value === null ? '--' : formatCny(value);

const formatPercent = (value: number | null) =>
  value === null ? '--' : `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;

const resetForm = () => {
  form.id = undefined;
  form.kind = 'money_fund';
  form.name = '余额宝';
  form.fundCode = '000198';
  form.balance = undefined;
  form.totalPnl = 0;
  form.principal = undefined;
  form.annualRate = undefined;
  form.yesterdayPnl = undefined;
  form.interestType = 'demand';
  form.startDate = '';
  form.endDate = '';
  form.remark = '';
  form.sort = 0;
};

const fillFromItem = (item: MarketCashItemType) => {
  form.id = item.id;
  form.kind = item.kind;
  form.name = item.name;
  form.fundCode = item.fundCode || '000198';
  form.balance = item.balance;
  form.totalPnl = item.totalPnl;
  form.principal = item.principal;
  form.annualRate = item.annualRateManual
    ? (item.annualRate ?? undefined)
    : undefined;
  form.yesterdayPnl = item.yesterdayPnlManual
    ? (item.yesterdayPnl ?? undefined)
    : undefined;
  form.interestType = item.interestType ?? 'demand';
  form.startDate = item.startDate;
  form.endDate = item.endDate;
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

watch(
  () => form.kind,
  (kind) => {
    if (isEdit.value) return;
    if (!form.name || form.name === '余额宝' || form.name === '银行存款') {
      form.name = kind === 'money_fund' ? '余额宝' : '银行存款';
    }
    if (kind === 'deposit' && !form.startDate) {
      form.startDate = dayjs().format('YYYY-MM-DD');
    }
  }
);

watch(
  () => form.interestType,
  (type) => {
    if (type === 'demand') {
      form.endDate = '';
    }
  }
);

const applyTerm = (option: QuickTermType) => {
  const start = form.startDate || dayjs().format('YYYY-MM-DD');
  form.startDate = start;
  form.endDate = dayjs(start).add(option.amount, option.unit).format('YYYY-MM-DD');
};

const handleConfirm = () => {
  const name = form.name.trim();

  if (isMoneyFund.value) {
    const fundCode = form.fundCode.trim();
    if (!/^\d{6}$/.test(fundCode)) {
      ElMessage.warning('货币基金代码应为 6 位数字');
      return;
    }
    if (form.balance === undefined || form.balance === null || form.balance < 0) {
      ElMessage.warning('请填写当前余额');
      return;
    }
    if (moneyFundPrincipal.value < 0) {
      ElMessage.warning('累计收益不能大于当前余额');
      return;
    }
    emit('save', {
      id: form.id,
      kind: 'money_fund',
      name: name || '余额宝',
      fundCode,
      balance: form.balance,
      totalPnl: form.totalPnl ?? 0,
      annualRate: form.annualRate,
      yesterdayPnl: form.yesterdayPnl,
      remark: form.remark.trim() || undefined,
      sort: form.sort,
    });
    return;
  }

  if (!form.principal || form.principal <= 0) {
    ElMessage.warning('请填写存款本金');
    return;
  }
  if (
    form.annualRate === undefined ||
    form.annualRate === null ||
    form.annualRate < 0
  ) {
    ElMessage.warning('请填写年利率');
    return;
  }
  if (!form.startDate) {
    ElMessage.warning('请选择起存日');
    return;
  }
  if (form.interestType === 'fixed') {
    if (!form.endDate) {
      ElMessage.warning('请选择到期日');
      return;
    }
    if (dayjs(form.endDate).isBefore(dayjs(form.startDate))) {
      ElMessage.warning('到期日不能早于起存日');
      return;
    }
  }

  emit('save', {
    id: form.id,
    kind: 'deposit',
    name: name || '银行存款',
    principal: form.principal,
    annualRate: form.annualRate,
    interestType: form.interestType,
    startDate: form.startDate,
    endDate: form.interestType === 'fixed' ? form.endDate : undefined,
    remark: form.remark.trim() || undefined,
    sort: form.sort,
  });
};
</script>

<style lang="scss" scoped>
.cash-calc {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 20px;
  margin: -4px 0 12px 108px;
  font-size: 12px;
  color: var(--sys-text-secondary-color);
}

.cash-quote-hint {
  margin: -6px 0 12px 108px;
  font-size: 12px;
  color: var(--sys-text-secondary-color);
}

.quick-term {
  display: flex;
  align-items: center;
  gap: 4px;
  margin: -4px 0 12px 108px;
}

.quick-term-label {
  margin-right: 4px;
  font-size: 12px;
  color: var(--sys-text-secondary-color);
}

.cash-tip {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--sys-text-secondary-color);
}
</style>
