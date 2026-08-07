import dayjs from 'dayjs';
import { ElMessage, ElMessageBox } from 'element-plus';
import chroma from 'chroma-js';
import { nanoid } from 'nanoid';

import { uploadFileApi } from '@/api';
import type { DictSimpleItemType } from '@/api/system/dict/type';
import { storeToRefs } from 'pinia';
import { useSystemStore } from '@/store/system';

export const getImg = (baseUrl: string, detailUrl: string) => {
  return new URL(`../../assets/image/${baseUrl}/${detailUrl}`, import.meta.url)
    .href;
};

export const getSvg = (baseUrl: string, detailUrl: string) => {
  return new URL(`../../assets/svg/${baseUrl}/${detailUrl}`, import.meta.url)
    .href;
};

export const fmtTime = (
  time?: Date | number | string,
  fmtStr = 'YYYY-MM-DD HH:mm:ss'
) => {
  return dayjs(time).format(fmtStr);
};

export const dateDiff = (
  hisTime: Date | string | number,
  nowTime = new Date().getTime()
) => {
  const diffValue = nowTime - new Date(hisTime).getTime();
  let result;
  const minute = 1000 * 60;
  const hour = minute * 60;
  const day = hour * 24;
  const month = day * 30;
  const year = month * 12;

  const _year = diffValue / year;
  const _month = diffValue / month;
  const _week = diffValue / (7 * day);
  const _day = diffValue / day;
  const _hour = diffValue / hour;
  const _min = diffValue / minute;
  if (_year >= 1)
    result = Math.floor(_year) + '年' + Math.floor(_month % 12) + '个月';
  else if (_month >= 1) result = Math.floor(_month) + '个月';
  else if (_week >= 1) result = Math.floor(_week) + '周';
  else if (_day >= 1) result = Math.floor(_day) + '天';
  else if (_hour >= 1) result = Math.floor(_hour) + '个小时';
  else if (_min >= 1) result = Math.floor(_min) + '分钟';
  else result = '刚刚';
  return result;
};

export function randomColor() {
  // hue 色相 0-360 随机，保证多彩
  const h = Math.floor(Math.random() * 360);
  // saturation 饱和度 70-100%，保证鲜艳
  const s = Math.floor(Math.random() * 31) + 70;
  // lightness 30-70%，避免太黑或太白
  const l = Math.floor(Math.random() * 41) + 30;

  // 主颜色
  const color = `hsl(${h}, ${s}%, ${l}%)`;
  // 边框颜色，加透明度（比如 0.6）
  const borderColor = `hsla(${h}, ${s}%, ${l}%, 0.3)`;

  return { color, borderColor };
}

export const copyClick = (content: string) => {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(content);
    ElMessage.success('复制成功');
  } else {
    const textArea = document.createElement('textarea');
    textArea.value = content;
    // 使text area不在viewport，同时设置不可见
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    ElMessage.success('复制成功');
    return new Promise((res: any, rej: any) => {
      // 执行复制命令并移除文本框
      document.execCommand('copy') ? res() : rej();
      textArea.remove();
    });
  }
};

export const confirmHandler = (content: string, cb: () => void) => {
  ElMessageBox.confirm(`${content}，是否继续?`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      cb();
    })
    .catch(() => {
      ElMessage.info('已取消');
    });
};

export const getCookie = (name: string) => {
  let matches = document.cookie.match(
    new RegExp(
      '(?:^|; )' + name.replace(/([.$?*|{}()\[\]\\/+^])/g, '\\$&') + '=([^;]*)'
    )
  );
  return matches ? decodeURIComponent(matches[1]) : undefined;
};

export const setCookie = (key: string, value: string, days = 7) => {
  // 构造过期时间
  let expires = '';
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = '; expires=' + date.toUTCString();
  }

  // 设置Cookie
  document.cookie = key + '=' + (value || '') + expires + '; path=/';
};

export const generateColor = (colorStr: string) => {
  const color = chroma(colorStr);
  return color;
};

export const uploadFile = async (
  file: File,
  filename: string,
  type: string
) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('name', nanoid() + filename);
  formData.append('type', type);
  let imgUrl = '';
  try {
    const { data } = await uploadFileApi(formData);
    imgUrl = data;
  } catch {
    ElMessage.error('上传文件失败');
  } finally {
    return imgUrl;
  }
};

export const getDictLabelByKey = (arr: DictSimpleItemType[], key: string) => {
  return arr.find((item) => item.key === key)?.value;
};

export /**
 * 将颜色转换为 rgba 字符串
 * @param color - 支持 '#RRGGBB' 或 '#RGB' 或 'rgb(r,g,b)' 格式
 * @param alpha - 透明度 0~1
 * @returns rgba 字符串
 */
function toRgba(color: string, alpha: number = 1): string {
  let r: number, g: number, b: number;

  if (color.startsWith('#')) {
    const hex = color.slice(1);
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 6) {
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
    } else {
      throw new Error('Invalid hex color');
    }
  } else if (color.startsWith('rgb')) {
    const match = color.match(/(\d+),\s*(\d+),\s*(\d+)/);
    if (!match) throw new Error('Invalid rgb color');
    r = parseInt(match[1]);
    g = parseInt(match[2]);
    b = parseInt(match[3]);
  } else {
    throw new Error('Unsupported color format');
  }

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function getColorPair(value: number): {
  color: string;
  borderColor: string;
} {
  const v = Math.max(-5, Math.min(5, value));
  const { isDark } = storeToRefs(useSystemStore());
  if (v === 0) {
    const bg = isDark.value ? 'hsl(0, 0%, 80%)' : 'hsl(0, 0%, 30%)';
    const border = isDark.value ? 'hsl(0, 0%, 65%)' : 'hsl(0, 0%, 50%)';
    return { color: bg, borderColor: border };
  }
  const hue = v > 0 ? 0 : 120;
  const intensity = Math.abs(v) / 5;
  const lightnessBase = isDark.value ? 60 : 50;
  const saturation = 40 + intensity * 50;
  const lightness = lightnessBase - intensity * 20;
  const bg = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  const borderSaturation = saturation * 0.6;
  const borderLightness = lightness + (isDark.value ? 10 : 15);
  const border = `hsl(${hue}, ${borderSaturation}%, ${borderLightness}%)`;

  return { color: bg, borderColor: border };
}

export default {
  getImg,
  dateDiff,
  copyClick,
  getCookie,
  setCookie,
  getColorPair,
};
