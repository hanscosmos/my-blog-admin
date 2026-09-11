import type { App, Directive } from 'vue';
import { usePermissionStore } from '@/store/permission';

/**
 * 操作权限指令：无权限时隐藏元素
 *
 * 用法：
 *   v-perm="'article:delete'"
 *   v-perm="['article:add', 'article:update']"  // 满足其中之一即可
 *
 * 采用 display 控制而非移除节点：表格等场景会频繁重渲染，
 * 移除真实节点会让 Vue 的虚拟 DOM 与真实 DOM 失配。
 * 真正的拦截由后端接口权限校验兜底。
 */
const applyPermission = (el: HTMLElement, value: string | string[]) => {
  if (!value || (Array.isArray(value) && !value.length)) return;
  el.style.display = usePermissionStore().hasPerm(value) ? '' : 'none';
};

const permission: Directive<HTMLElement, string | string[]> = {
  mounted(el, binding) {
    applyPermission(el, binding.value);
  },
  updated(el, binding) {
    applyPermission(el, binding.value);
  },
};

export const setupPermissionDirective = (app: App) => {
  app.directive('perm', permission);
};
