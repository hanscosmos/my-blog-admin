type TokenType = 'number' | 'operator' | 'lparen' | 'rparen';

type Token = {
  type: TokenType;
  value: string;
};

/** 计算器里允许输入的符号统一成标准运算符 */
const SYMBOL_MAP: Record<string, string> = {
  '×': '*',
  x: '*',
  X: '*',
  '÷': '/',
  '（': '(',
  '）': ')',
  '−': '-',
  '–': '-',
  '—': '-',
};

const normalizeExpression = (input: string) =>
  Array.from(input.replace(/\s+/g, '').replace(/,/g, ''))
    .map((char) => SYMBOL_MAP[char] ?? char)
    .join('');

const tokenize = (input: string): Token[] => {
  const tokens: Token[] = [];
  let index = 0;

  while (index < input.length) {
    const char = input[index];
    if ('+-*/'.includes(char)) {
      tokens.push({ type: 'operator', value: char });
      index += 1;
      continue;
    }
    if (char === '(') {
      tokens.push({ type: 'lparen', value: char });
      index += 1;
      continue;
    }
    if (char === ')') {
      tokens.push({ type: 'rparen', value: char });
      index += 1;
      continue;
    }
    if (/[\d.]/.test(char)) {
      let raw = '';
      while (index < input.length && /[\d.]/.test(input[index])) {
        raw += input[index];
        index += 1;
      }
      if (!/^(\d+(\.\d*)?|\.\d+)$/.test(raw)) {
        throw new Error('数字格式有误');
      }
      tokens.push({ type: 'number', value: raw });
      continue;
    }
    throw new Error(`不支持的字符：${char}`);
  }

  return tokens;
};

/**
 * 计算四则运算表达式，支持 + - * /、括号和正负号。
 * 使用递归下降解析，不使用 eval，避免执行任意代码。
 */
export const evaluateExpression = (expression: string): number => {
  const tokens = tokenize(normalizeExpression(expression));
  if (!tokens.length) {
    throw new Error('请输入表达式');
  }

  let pos = 0;

  const parseExpression = (): number => {
    let value = parseTerm();
    while (tokens[pos]?.type === 'operator' && '+-'.includes(tokens[pos].value)) {
      const operator = tokens[pos].value;
      pos += 1;
      const right = parseTerm();
      value = operator === '+' ? value + right : value - right;
    }
    return value;
  };

  const parseTerm = (): number => {
    let value = parseFactor();
    while (tokens[pos]?.type === 'operator' && '*/'.includes(tokens[pos].value)) {
      const operator = tokens[pos].value;
      pos += 1;
      const right = parseFactor();
      if (operator === '/' && right === 0) {
        throw new Error('不能除以 0');
      }
      value = operator === '*' ? value * right : value / right;
    }
    return value;
  };

  function parseFactor(): number {
    const token = tokens[pos];
    if (!token) {
      throw new Error('表达式格式有误');
    }
    if (token.type === 'operator' && '+-'.includes(token.value)) {
      pos += 1;
      const value = parseFactor();
      return token.value === '-' ? -value : value;
    }
    if (token.type === 'number') {
      pos += 1;
      return Number(token.value);
    }
    if (token.type === 'lparen') {
      pos += 1;
      const value = parseExpression();
      if (tokens[pos]?.type !== 'rparen') {
        throw new Error('括号不匹配');
      }
      pos += 1;
      return value;
    }
    throw new Error('表达式格式有误');
  }

  const value = parseExpression();
  if (pos !== tokens.length) {
    throw new Error('表达式格式有误');
  }
  if (!Number.isFinite(value)) {
    throw new Error('计算结果无效');
  }
  return value;
};

/** 消除浮点误差（如 0.1 + 0.2），并保留千分位 */
export const formatCalcResult = (value: number) => {
  const rounded = Number(value.toPrecision(12));
  return rounded.toLocaleString('zh-CN', { maximumFractionDigits: 10 });
};
