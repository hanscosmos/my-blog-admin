export type LyricLineType = {
  /** 起始时间（秒）；无时间轴的纯文本歌词为 -1 */
  time: number;
  text: string;
};

export type ParsedLyricType = {
  /** 是否带时间轴 */
  synced: boolean;
  lines: LyricLineType[];
};

/** [mm:ss]、[mm:ss.xx]、[mm:ss.xxx] */
const TIME_TAG_REG = /\[(\d{1,3}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g;
/** [offset:+500] 单位为毫秒 */
const OFFSET_TAG_REG = /\[offset:\s*([+-]?\d+)\s*\]/i;
/** LRC 元信息标签，如 [ti:]、[ar:]、[al:]、[by:] */
const META_TAG_REG = /^\[[a-z]+:.*\]$/i;

const parseTimeTag = (match: RegExpExecArray) => {
  const minute = Number(match[1]);
  const second = Number(match[2]);
  const fraction = match[3]
    ? Number(match[3].padEnd(3, '0').slice(0, 3)) / 1000
    : 0;
  return minute * 60 + second + fraction;
};

/**
 * 解析歌词文本：
 * - 含时间戳 → 按 LRC 解析，支持一行多时间戳与 offset；
 * - 无时间戳 → 按纯文本歌词返回（synced 为 false）。
 */
export const parseLyric = (raw?: string | null): ParsedLyricType => {
  const text = (raw || '').replace(/\r\n?/g, '\n').trim();
  if (!text) return { synced: false, lines: [] };

  const offsetMatch = OFFSET_TAG_REG.exec(text);
  const offset = offsetMatch ? Number(offsetMatch[1]) / 1000 : 0;

  const timedLines: LyricLineType[] = [];
  text.split('\n').forEach((line) => {
    TIME_TAG_REG.lastIndex = 0;
    const times: number[] = [];
    let match: RegExpExecArray | null;
    while ((match = TIME_TAG_REG.exec(line))) {
      times.push(parseTimeTag(match));
    }
    if (!times.length) return;
    const content = line.replace(TIME_TAG_REG, '').trim();
    if (!content) return;
    times.forEach((time) => {
      timedLines.push({ time: Math.max(0, time + offset), text: content });
    });
  });

  if (timedLines.length) {
    timedLines.sort((a, b) => a.time - b.time);
    return { synced: true, lines: timedLines };
  }

  const plainLines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !META_TAG_REG.test(line))
    .map((line) => ({ time: -1, text: line }));
  return { synced: false, lines: plainLines };
};

/** 二分查找当前时间对应的歌词行下标，未命中返回 -1 */
export const findLyricIndex = (
  lines: LyricLineType[],
  currentTime: number
) => {
  let low = 0;
  let high = lines.length - 1;
  let index = -1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    if (lines[mid].time <= currentTime) {
      index = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  return index;
};
