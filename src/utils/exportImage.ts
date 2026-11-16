import dayjs from 'dayjs';
import { domToPng } from 'modern-screenshot';

type ExportImageOptionsType = {
  /** 图片顶部标题 */
  title: string;
  /** 标题右侧的辅助信息，如数据更新时间 */
  subtitle?: string;
  /** 导出文件名前缀，最终会追加时间戳 */
  filename: string;
};

/** 浏览器 canvas 可绘制的最大面积，超出后自动降低清晰度 */
const MAX_CANVAS_AREA = 16_000_000;
const DEFAULT_SCALE = 2;
/** 导出图片四周留白 */
const EXPORT_PADDING = 24;

/** 把区域内可滚动元素的限制解除，让完整内容参与截图 */
const expandScrollArea = (root: HTMLElement) => {
  root.style.height = 'auto';
  root.style.maxHeight = 'none';
  root.style.minHeight = '0';
  root.style.overflow = 'visible';
  root.style.flex = 'none';

  root.querySelectorAll<HTMLElement>('*').forEach((node) => {
    const style = window.getComputedStyle(node);
    const scrollable =
      ['auto', 'scroll'].includes(style.overflowY) ||
      ['auto', 'scroll'].includes(style.overflowX);
    if (!scrollable) return;

    node.style.overflow = 'visible';
    node.style.height = 'auto';
    node.style.maxHeight = 'none';
    node.style.minHeight = '0';
    node.style.flex = 'none';
  });
};

const createHeader = (title: string, subtitle?: string) => {
  const header = document.createElement('div');
  header.style.cssText = [
    'display:flex',
    'align-items:flex-end',
    'justify-content:space-between',
    'flex-wrap:wrap',
    'gap:6px 16px',
    'padding:0 0 14px',
    'margin-bottom:16px',
    'border-bottom:1px solid var(--sys-border-color)',
  ].join(';');

  const titleNode = document.createElement('span');
  titleNode.textContent = title;
  titleNode.style.cssText = [
    'font-size:20px',
    'font-weight:600',
    'letter-spacing:0.5px',
    'line-height:1.2',
    'font-family:YouSheBiaoTiHei, serif',
    'color:var(--sys-text-color)',
  ].join(';');
  header.appendChild(titleNode);

  if (subtitle) {
    const subtitleNode = document.createElement('span');
    subtitleNode.textContent = subtitle;
    subtitleNode.style.cssText = [
      'font-size:12px',
      'line-height:1.4',
      'color:var(--sys-text-secondary-color)',
    ].join(';');
    header.appendChild(subtitleNode);
  }

  return header;
};

const resolveBackgroundColor = (element: HTMLElement) => {
  const dialog = element.closest<HTMLElement>('.el-dialog');
  const candidates = [
    dialog ? window.getComputedStyle(dialog).backgroundColor : '',
    window.getComputedStyle(document.body).backgroundColor,
  ];
  return (
    candidates.find((color) => color && color !== 'rgba(0, 0, 0, 0)') ||
    '#ffffff'
  );
};

const downloadImage = (dataUrl: string, filename: string) => {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
};

/**
 * 将指定元素（包含其滚动区域内的完整内容）导出为 PNG 图片。
 *
 * 实现方式：克隆一份内容到屏幕外的容器中，解除滚动高度限制，
 * 再交给 modern-screenshot 渲染，因此不受当前可视区域限制。
 */
export const exportElementAsImage = async (
  element: HTMLElement | null | undefined,
  options: ExportImageOptionsType
) => {
  if (!element) {
    throw new Error('未找到需要导出的内容');
  }

  const sourceRect = element.getBoundingClientRect();
  if (!sourceRect.width) {
    throw new Error('导出内容尚未渲染');
  }

  const sourceWidth = Math.ceil(sourceRect.width);
  const sourceStyle = window.getComputedStyle(element);
  // modern-screenshot 会把根节点的 box-sizing 强制为 border-box，
  // 因此留白放在内层容器上，避免根节点尺寸被 padding 挤压导致内容被裁切
  const wrapper = document.createElement('div');
  wrapper.style.cssText = [
    'position:fixed',
    'top:0',
    'left:-99999px',
    'z-index:-1',
    `width:${sourceWidth + EXPORT_PADDING * 2}px`,
    `background:${resolveBackgroundColor(element)}`,
    `color:${sourceStyle.color}`,
    `font-family:${sourceStyle.fontFamily}`,
    `font-size:${sourceStyle.fontSize}`,
    `line-height:${sourceStyle.lineHeight}`,
    'pointer-events:none',
  ].join(';');

  const content = document.createElement('div');
  content.style.cssText = [
    'box-sizing:border-box',
    'width:100%',
    `padding:${EXPORT_PADDING}px`,
  ].join(';');

  const clone = element.cloneNode(true) as HTMLElement;
  // 编辑、删除、拖拽等交互控件不参与导出；隐藏而不是移除，避免打乱原有布局
  clone
    .querySelectorAll<HTMLElement>('[data-export-ignore]')
    .forEach((node) => {
      node.style.visibility = 'hidden';
    });

  content.appendChild(createHeader(options.title, options.subtitle));
  content.appendChild(clone);
  wrapper.appendChild(content);
  document.body.appendChild(wrapper);

  try {
    // 等字体加载完再测量尺寸，避免字体替换后内容高度变化导致底部被裁切
    await document.fonts.ready;
    expandScrollArea(clone);

    const width = wrapper.offsetWidth;
    const height = wrapper.offsetHeight;
    const scale = Math.min(
      DEFAULT_SCALE,
      Math.max(1, Math.sqrt(MAX_CANVAS_AREA / (width * height)))
    );
    const dataUrl = await domToPng(wrapper, {
      width,
      height,
      scale: Number(scale.toFixed(2)),
      backgroundColor: window.getComputedStyle(wrapper).backgroundColor,
    });

    downloadImage(
      dataUrl,
      `${options.filename}-${dayjs().format('YYYYMMDD-HHmmss')}.png`
    );
  } finally {
    wrapper.remove();
  }
};
