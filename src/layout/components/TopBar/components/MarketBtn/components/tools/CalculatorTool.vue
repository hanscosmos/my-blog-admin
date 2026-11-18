<template>
  <div class="calculator-tool">
    <el-input v-model="expression" placeholder="支持 + - × ÷ 和括号，回车计算"
      @input="handleInput" @keyup.enter="calculate" />

    <div class="calc-result">
      <span class="calc-result-label">结果</span>
      <span v-if="errorMsg" class="calc-error">{{ errorMsg }}</span>
      <div v-else class="flex items-center gap-2">
        <span class="calc-result-value font-beauty">{{ result || '0' }}</span>
        <el-button v-if="result" link type="primary" size="small" @click="copyResult">
          复制
        </el-button>
      </div>
    </div>

    <div class="calc-keys">
      <button v-for="key in CALC_KEYS" :key="key.label" type="button" class="calc-key"
        :class="{
          'is-operator': key.variant === 'operator',
          'is-function': key.variant === 'function',
          'is-equal': key.variant === 'equal',
        }" @click="handleKey(key)">
        {{ key.label }}
      </button>
    </div>

    <div v-if="history.length" class="calc-history">
      <div class="calc-history-header">
        <span class="calc-history-title">最近计算</span>
        <button type="button" class="tool-link" @click="history = []">清空历史</button>
      </div>
      <button v-for="item in history" :key="item.id" type="button" class="calc-history-item"
        @click="applyHistory(item)">
        <span class="calc-history-expression">{{ item.expression }}</span>
        <span class="calc-history-result">= {{ item.result }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { copyClick } from '@/utils/tool';
import { evaluateExpression, formatCalcResult } from './expression';

type CalcKeyType = {
  label: string;
  action?: 'calculate' | 'clear' | 'backspace';
  variant?: 'operator' | 'function' | 'equal';
};

type HistoryItemType = {
  id: number;
  expression: string;
  result: string;
};

const MAX_HISTORY = 8;

const CALC_KEYS: CalcKeyType[] = [
  { label: '(', variant: 'function' },
  { label: ')', variant: 'function' },
  { label: '⌫', action: 'backspace', variant: 'function' },
  { label: 'C', action: 'clear', variant: 'function' },
  { label: '7' },
  { label: '8' },
  { label: '9' },
  { label: '÷', variant: 'operator' },
  { label: '4' },
  { label: '5' },
  { label: '6' },
  { label: '×', variant: 'operator' },
  { label: '1' },
  { label: '2' },
  { label: '3' },
  { label: '−', variant: 'operator' },
  { label: '0' },
  { label: '.' },
  { label: '=', action: 'calculate', variant: 'equal' },
  { label: '+', variant: 'operator' },
];

const expression = ref('');
const result = ref('');
const errorMsg = ref('');
const history = ref<HistoryItemType[]>([]);
/** 刚按过等号：下一次按运算符时从结果继续，按数字则开始新表达式 */
const justCalculated = ref(false);
let historySeq = 0;

const handleInput = () => {
  justCalculated.value = false;
  errorMsg.value = '';
};

const calculate = () => {
  const raw = expression.value.trim();
  if (!raw) {
    errorMsg.value = '请输入表达式';
    result.value = '';
    justCalculated.value = false;
    return;
  }
  try {
    const value = evaluateExpression(raw);
    const text = formatCalcResult(value);
    result.value = text;
    errorMsg.value = '';
    justCalculated.value = true;
    addHistory(raw, text);
  } catch (err) {
    errorMsg.value = err instanceof Error ? err.message : '表达式有误';
    result.value = '';
    justCalculated.value = false;
  }
};

const addHistory = (raw: string, text: string) => {
  historySeq += 1;
  const rest = history.value.filter((item) => item.expression !== raw);
  history.value = [
    { id: historySeq, expression: raw, result: text },
    ...rest,
  ].slice(0, MAX_HISTORY);
};

const handleKey = (key: CalcKeyType) => {
  if (key.action === 'clear') {
    expression.value = '';
    result.value = '';
    errorMsg.value = '';
    justCalculated.value = false;
    return;
  }
  if (key.action === 'backspace') {
    expression.value = expression.value.slice(0, -1);
    justCalculated.value = false;
    errorMsg.value = '';
    return;
  }
  if (key.action === 'calculate') {
    calculate();
    return;
  }
  errorMsg.value = '';
  if (justCalculated.value) {
    const isOperator = ['+', '−', '×', '÷'].includes(key.label);
    expression.value = isOperator
      ? `${result.value.replace(/,/g, '')}${key.label}`
      : key.label;
    justCalculated.value = false;
    return;
  }
  expression.value += key.label;
};

const applyHistory = (item: HistoryItemType) => {
  expression.value = item.expression;
  result.value = item.result;
  errorMsg.value = '';
  justCalculated.value = false;
};

const copyResult = () => {
  if (!result.value) return;
  copyClick(result.value);
};
</script>

<style lang="scss" scoped>
.calc-result {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 12px;
  margin: 12px 0;
  border-radius: 6px;
  background-color: var(--theme-hover);
}

.calc-result-label {
  font-size: 12px;
  color: var(--sys-text-secondary-color);
}

.calc-result-value {
  font-size: 24px;
  line-height: 1.2;
  word-break: break-all;
}

.calc-error {
  font-size: 13px;
  color: var(--el-color-danger);
}

.calc-keys {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 6px;
}

.calc-key {
  height: 34px;
  border: 1px solid var(--sys-border-color);
  border-radius: 6px;
  background-color: transparent;
  color: var(--sys-text-color);
  font-size: 14px;
  cursor: pointer;
  transition: color 0.2s ease-in-out, border-color 0.2s ease-in-out,
    background-color 0.2s ease-in-out;

  &:hover {
    border-color: var(--el-color-primary);
    background-color: var(--theme-hover);
    color: var(--el-color-primary);
  }

  &.is-operator {
    color: var(--el-color-primary);
  }

  &.is-function {
    color: var(--sys-text-secondary-color);
  }

  &.is-equal {
    border-color: var(--el-color-primary);
    background-color: var(--el-color-primary);
    color: #fff;

    &:hover {
      color: #fff;
      opacity: 0.9;
    }
  }
}

.calc-history {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 12px;
}

.calc-history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2px;
}

.calc-history-title {
  font-size: 12px;
  color: var(--sys-text-secondary-color);
}

.tool-link {
  padding: 0;
  border: none;
  background: transparent;
  color: var(--el-color-primary);
  font-size: 12px;
  cursor: pointer;
}

.calc-history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  background-color: transparent;
  color: var(--sys-text-color);
  font-size: 12px;
  text-align: left;
  cursor: pointer;

  &:hover {
    background-color: var(--theme-hover);
  }
}

.calc-history-expression {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.calc-history-result {
  flex-shrink: 0;
  color: var(--sys-text-secondary-color);
}
</style>
