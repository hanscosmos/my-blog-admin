<template>
  <aside ref="tocRef" v-if="items.length" class="app-article-toc hidden xl:block">
    <div class="toc-title">目录</div>
    <ul class="toc-list">
      <li
        v-for="(item, index) in items"
        :key="index"
        class="toc-item"
        :class="{ 'is-active': index === activeIndex }"
        :style="{ paddingLeft: `${(item.level - minLevel) * 12 + 12}px` }"
        @click="scrollTo(index)"
      >
        {{ item.title }}
      </li>
    </ul>
  </aside>
</template>

<script lang="ts" setup>
interface TocItem {
  level: number;
  title: string;
  el: HTMLElement;
}

const props = defineProps<{
  /** 正文滚动容器（overflow-auto 的元素） */
  container?: HTMLElement | null;
  /** Markdown 原文，作为「正文已渲染」的触发信号 */
  content?: string;
}>();

const items = ref<TocItem[]>([]);
const activeIndex = ref(-1);
const scrollEl = computed(() => props.container ?? null);
const tocRef = ref<HTMLElement>();

const minLevel = computed(() =>
  items.value.length ? Math.min(...items.value.map((i) => i.level)) : 1
);

const getHeadings = (): TocItem[] => {
  const container = scrollEl.value;
  if (!container) return [];
  return Array.from(
    container.querySelectorAll<HTMLElement>('h1,h2,h3,h4,h5,h6')
  )
    .filter((el) => el.textContent?.trim())
    .map((el) => ({
      level: Number(el.tagName.slice(1)),
      title: el.textContent!.trim(),
      el,
    }));
};

// v-md-preview 的 HTML 是响应式 set 后渲染，多等一个 tick 确保 DOM 已更新
const refresh = async () => {
  await nextTick();
  await nextTick();
  items.value = getHeadings();
  activeIndex.value = -1;
};

const onScroll = () => {
  const container = scrollEl.value;
  if (!container || !items.value.length) return;
  const threshold = container.getBoundingClientRect().top + 24;
  let current = -1;
  for (let i = 0; i < items.value.length; i++) {
    if (items.value[i].el.getBoundingClientRect().top <= threshold) {
      current = i;
    } else {
      break;
    }
  }
  activeIndex.value = current;
};

const scrollTo = (index: number) => {
  const container = scrollEl.value;
  const el = items.value[index]?.el;
  if (!container || !el) return;
  const top =
    el.getBoundingClientRect().top -
    container.getBoundingClientRect().top +
    container.scrollTop -
    16;
  container.scrollTo({ top, behavior: 'smooth' });
  activeIndex.value = index;
};

// 滚动容器就绪时绑定滚动监听并提取标题；内容变化时重新提取
// 高亮项变化时，若超出目录可视区域，自动滚动目录让它可见（仅超出时滚动，避免频繁跳动）
watch(activeIndex, (index) => {
  const toc = tocRef.value;
  if (!toc || index < 0) return;
  const el = toc.querySelector<HTMLElement>('.toc-list')?.children[index] as
    | HTMLElement
    | undefined;
  if (!el) return;
  const tocRect = toc.getBoundingClientRect();
  const elRect = el.getBoundingClientRect();
  const margin = 8;
  if (elRect.top - margin < tocRect.top) {
    toc.scrollTop -= tocRect.top - (elRect.top - margin);
  } else if (elRect.bottom + margin > tocRect.bottom) {
    toc.scrollTop += elRect.bottom + margin - tocRect.bottom;
  }
});

watch(scrollEl, (el, prev) => {
  prev?.removeEventListener('scroll', onScroll);
  el?.addEventListener('scroll', onScroll);
  if (el) refresh();
});

watch(
  () => props.content,
  () => refresh()
);

onBeforeUnmount(() => {
  scrollEl.value?.removeEventListener('scroll', onScroll);
});
</script>

<style lang="scss" scoped>
.app-article-toc {
  width: 220px;
  flex-shrink: 0;
  height: 100%;
  overflow-y: auto;
  padding: 8px 0 12px 16px;
  border-left: 1px solid var(--sys-border-color);

  .toc-title {
    margin-bottom: 8px;
    font-size: 14px;
    font-weight: 600;
    color: var(--sys-text-color);
  }

  .toc-list {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .toc-item {
    font-size: 13px;
    line-height: 2;
    color: var(--sys-text-secondary-color);
    cursor: pointer;
    transition: color 0.2s;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    &:hover {
      color: var(--sys-text-color);
    }

    &.is-active {
      color: var(--el-color-primary);
      font-weight: 500;
    }
  }
}
</style>
