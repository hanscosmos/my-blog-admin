import { parseBlob, selectCover, TimestampFormat } from 'music-metadata';
import type { ILyricsTag, IPicture } from 'music-metadata';
import { MAX_IMAGE_SIZE } from '@/config';

export type EmbeddedMusicInfoType = {
  /** 内嵌封面，无封面或过大时为 null */
  coverFile: File | null;
  /** 内嵌封面存在但超过大小限制 */
  coverTooLarge: boolean;
  name: string;
  singer: string;
  /** 内嵌歌词；带时间轴时已还原为 LRC 文本 */
  lyric: string;
};

const IMAGE_EXT_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/bmp': 'bmp',
};

const pictureToFile = (picture: IPicture): File => {
  const mime = picture.format?.toLowerCase().startsWith('image/')
    ? picture.format.toLowerCase()
    : 'image/jpeg';
  const extension = IMAGE_EXT_MAP[mime] || mime.split('/')[1] || 'jpg';
  const buffer = new ArrayBuffer(picture.data.byteLength);
  new Uint8Array(buffer).set(picture.data);
  return new File([buffer], `cover.${extension}`, { type: mime });
};

const formatLrcTime = (milliseconds: number) => {
  const total = Math.max(0, milliseconds);
  const minutes = Math.floor(total / 60000);
  const seconds = Math.floor((total % 60000) / 1000);
  const centiseconds = Math.floor((total % 1000) / 10);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `[${pad(minutes)}:${pad(seconds)}.${pad(centiseconds)}]`;
};

/** 优先还原带时间轴的歌词（LRC），否则按纯文本返回 */
const pickLyricText = (lyrics?: ILyricsTag[]) => {
  const tag = lyrics?.find((item) => item.text?.trim() || item.syncText?.length);
  if (!tag) return '';
  if (tag.syncText?.length) {
    const lines = tag.syncText.filter((line) => line.text.trim());
    if (tag.timeStampFormat === TimestampFormat.milliseconds) {
      return lines
        .map((line) => `${formatLrcTime(line.timestamp || 0)}${line.text.trim()}`)
        .join('\n');
    }
    return lines.map((line) => line.text.trim()).join('\n');
  }
  return tag.text?.trim() || '';
};

/**
 * 读取音频文件内嵌的封面、歌名、歌手与歌词。
 * 内嵌封面超过 MAX_IMAGE_SIZE 时只标记 coverTooLarge，不返回文件。
 */
export const extractEmbeddedMusicInfo = async (
  file: File
): Promise<EmbeddedMusicInfoType> => {
  const { common } = await parseBlob(file);
  const picture = selectCover(common.picture);
  let coverFile: File | null = null;
  let coverTooLarge = false;
  if (picture?.data?.length) {
    if (picture.data.length / 1024 / 1024 >= MAX_IMAGE_SIZE) {
      coverTooLarge = true;
    } else {
      coverFile = pictureToFile(picture);
    }
  }
  return {
    coverFile,
    coverTooLarge,
    name: (common.title || '').trim(),
    singer: (common.artist || '').trim(),
    lyric: pickLyricText(common.lyrics),
  };
};
