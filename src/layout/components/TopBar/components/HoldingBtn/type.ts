/** 持仓趋势的作用域：总资产 / 资产类别 / 单支基金或单笔现金 */
export type HoldingTrendScopeType =
  | { type: 'total' }
  | { type: 'group'; group: string; name: string }
  | { type: 'item'; key: string; name: string };

/** 持仓分析抽屉的页签：资产配置 / 趋势分析 */
export type HoldingAnalysisTabType = 'allocation' | 'trend';
