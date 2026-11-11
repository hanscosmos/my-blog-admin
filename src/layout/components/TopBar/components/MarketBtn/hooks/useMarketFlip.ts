import type { MaybeRefOrGetter } from 'vue';

type UseMarketFlipOptionsType = {
  /** 列表容器元素 */
  container: MaybeRefOrGetter<HTMLElement | null | undefined>;
  /** 参与位移动画的列表项选择器（相对 container，建议使用 :scope > ...） */
  selector: string;
  /** 列表顺序标识，按键顺序变化时触发动画 */
  keys: MaybeRefOrGetter<string[]>;
  /** 列表项稳定 key 所在的属性名 */
  keyAttribute?: string;
  /** 动画时长（毫秒） */
  duration?: number;
  /** 动画缓动曲线 */
  easing?: string;
};

const shouldReduceMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * 列表重排的 FLIP 过渡：组件更新前记录旧位置，DOM 更新后补位播放位移动画。
 * 用于拖拽排序时让板块、条目平滑滑动到新位置，而不是瞬间跳变。
 */
export function useMarketFlip(options: UseMarketFlipOptionsType) {
  const {
    container,
    selector,
    keys,
    keyAttribute = 'data-flip-key',
    duration = 200,
    easing = 'cubic-bezier(0.2, 0, 0, 1)',
  } = options;

  const runningAnimations = new WeakMap<HTMLElement, Animation>();
  let keySignature = toValue(keys).join('|');
  let previousPositions: Map<string, DOMRect> | null = null;

  const capturePositions = () => {
    const el = toValue(container);
    if (!el) return null;
    const positions = new Map<string, DOMRect>();
    el.querySelectorAll<HTMLElement>(selector).forEach((item) => {
      const key = item.getAttribute(keyAttribute);
      if (key) positions.set(key, item.getBoundingClientRect());
    });
    return positions.size ? positions : null;
  };

  const play = (positions: Map<string, DOMRect>) => {
    if (shouldReduceMotion()) return;
    const el = toValue(container);
    if (!el) return;

    el.querySelectorAll<HTMLElement>(selector).forEach((item) => {
      const key = item.getAttribute(keyAttribute);
      const previous = key ? positions.get(key) : undefined;
      if (!previous) return;

      const current = item.getBoundingClientRect();
      const deltaX = previous.left - current.left;
      const deltaY = previous.top - current.top;
      if (!deltaX && !deltaY) return;

      runningAnimations.get(item)?.cancel();
      const animation = item.animate(
        [
          { transform: `translate(${deltaX}px, ${deltaY}px)` },
          { transform: 'translate(0, 0)' },
        ],
        { duration, easing }
      );
      runningAnimations.set(item, animation);
      animation.onfinish = () => {
        if (runningAnimations.get(item) === animation) {
          runningAnimations.delete(item);
        }
      };
    });
  };

  onBeforeUpdate(() => {
    const nextSignature = toValue(keys).join('|');
    if (nextSignature === keySignature) return;
    keySignature = nextSignature;
    // 此时 DOM 仍是重排前状态，先记录旧位置
    previousPositions = capturePositions();
  });

  onUpdated(() => {
    const positions = previousPositions;
    if (!positions) return;
    previousPositions = null;
    play(positions);
  });
}
