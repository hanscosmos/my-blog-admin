<template>
  <div class="wh-full">
    <div v-if="!isSuper" class="wh-full xy-center">
      <AppEmptyData desc="该功能仅超级管理员可用"></AppEmptyData>
    </div>
    <AppSearchPanel v-else :data-exist="!!dataList.length" :loading="loading">
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <el-input
              v-model="searchParams.name"
              placeholder="搜索歌曲名"
              class="!w-180px mr-3"
              clearable
              @change="filterDataListHandler"
            ></el-input>
            <el-select
              v-model="searchParams.language"
              placeholder="语种"
              class="!w-110px mr-3"
              clearable
              @change="filterDataListHandler"
            >
              <el-option
                v-for="item in languageOptions"
                :key="item.key"
                :label="item.value"
                :value="item.key"
              ></el-option>
            </el-select>
            <el-select
              v-model="searchParams.genre"
              placeholder="风格"
              class="!w-110px mr-3"
              clearable
              @change="filterDataListHandler"
            >
              <el-option
                v-for="item in genreOptions"
                :key="item.key"
                :label="item.value"
                :value="item.key"
              ></el-option>
            </el-select>
            <el-select
              v-model="searchParams.sortBy"
              class="!w-140px"
              @change="filterDataListHandler"
            >
              <el-option
                v-for="item in sortOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              ></el-option>
            </el-select>
          </div>
          <div class="flex items-center">
            <app-button class="mr-4" @click="openDialog('add')">
              <AppIcon name="add" class="mr-2"></AppIcon>
              <span>新建音乐</span>
            </app-button>
            <app-button
              v-if="searchParams.sortBy === 'manual'"
              type="plain"
              @click="sortDialogVisible = true"
            >
              <AppIcon name="sort" class="mr-2"></AppIcon>
              <span>调整顺序</span>
            </app-button>
          </div>
        </div>
      </template>
      <div class="p-4">
        <el-table :data="dataList" row-key="id" class="music-table">
          <el-table-column label="封面" width="76">
            <template #default="{ row }">
              <div class="table-cover">
                <img v-if="row.cover" :src="row.cover" alt="" />
                <AppIcon v-else name="music" :size="18"></AppIcon>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="歌曲名" min-width="180">
            <template #default="{ row }">
              <div class="flex items-center">
                <span class="truncate" :title="row.name">{{ row.name }}</span>
                <span v-if="currentSong?.id === row.id" class="playing-tag"
                  >播放中</span
                >
              </div>
            </template>
          </el-table-column>
          <el-table-column
            prop="singer"
            label="歌手"
            width="130"
            show-overflow-tooltip
          ></el-table-column>
          <el-table-column label="语种" width="90">
            <template #default="{ row }">
              {{ getDictLabelByKey(languageOptions, row.language) || '-' }}
            </template>
          </el-table-column>
          <el-table-column label="风格" width="90">
            <template #default="{ row }">
              {{ getDictLabelByKey(genreOptions, row.genre) || '-' }}
            </template>
          </el-table-column>
          <el-table-column label="时长" width="90">
            <template #default="{ row }">{{
              formatAudioTime(row.duration)
            }}</template>
          </el-table-column>
          <el-table-column
            prop="playCount"
            label="播放次数"
            width="100"
          ></el-table-column>
          <el-table-column label="累计时长" width="110">
            <template #default="{ row }">
              {{ formatAudioTime(row.listenSeconds) }}
            </template>
          </el-table-column>
          <el-table-column label="创建时间" width="150">
            <template #default="{ row }">
              {{ fmtTime(row.createTime, 'YYYY-MM-DD HH:mm') }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="220" fixed="right">
            <template #default="{ row }">
              <div class="flex items-center">
                <app-button type="text" class="mr-3" @click="playHandler(row)">
                  <AppIcon name="play" class="mr-1"></AppIcon>
                  <span>播放</span>
                </app-button>
                <app-button
                  v-if="!row.lyric || !row.cover"
                  type="text"
                  class="mr-3"
                  title="根据已上传的音频地址解析内嵌封面和歌词"
                  @click="extractHandler(row)"
                >
                  <span>{{
                    extractingId === row.id ? '解析中' : '解析'
                  }}</span>
                </app-button>
                <app-button
                  type="text"
                  class="mr-3"
                  @click="openDialog('edit', row)"
                >
                  <span>编辑</span>
                </app-button>
                <app-button
                  type="text"
                  class="delete-btn"
                  @click="deleteHandler(row)"
                >
                  <span>删除</span>
                </app-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <template #footer>
        <AppPagination
          :total="total"
          :page-number="pageConfig.pageNumber"
          :page-size="pageConfig.pageSize"
          @page-change="pageChangeHandler"
        ></AppPagination>
      </template>
    </AppSearchPanel>

    <div v-if="formDialogProps.visible">
      <MusicFormDialog
        :visible="formDialogProps.visible"
        :opt-type="formDialogProps.optType"
        :row="formDialogProps.row"
        @close="closeDialog"
        @change-success="changeSuccessHandler"
      >
      </MusicFormDialog>
    </div>
    <div v-if="sortDialogVisible">
      <MusicSortDialog
        :visible="sortDialogVisible"
        @close="sortDialogVisible = false"
        @change-success="sortSuccessHandler"
      ></MusicSortDialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { ElMessage } from 'element-plus';
import { useSearch } from '@/hooks/useSearch';
import { usePermissionStore } from '@/store/permission';
import { useMusicStore } from '@/store/music';
import {
  deleteMusicApi,
  extractMusicApi,
  getMusicListApi,
} from '@/api/resource/music';
import type { MusicItemType, MusicSearchType } from '@/api/resource/music/type';
import {
  MUSIC_GENRE_DICT_CODE,
  MUSIC_LANGUAGE_DICT_CODE,
} from '@/config/dict';
import { useDict } from '@/hooks/useDict';
import type { FormDialogProps } from '@/types/type';
import MusicFormDialog from './components/MusicFormDialog.vue';
import MusicSortDialog from './components/MusicSortDialog.vue';
import { originalForm, originalSearch, sortOptions } from './service';

const { isSuper } = storeToRefs(usePermissionStore());
const musicStore = useMusicStore();
const { currentSong } = storeToRefs(musicStore);
const { dictDataList: languageOptions, getDictDataList: getLanguageList } =
  useDict(MUSIC_LANGUAGE_DICT_CODE);
const { dictDataList: genreOptions, getDictDataList: getGenreList } =
  useDict(MUSIC_GENRE_DICT_CODE);

const {
  searchParams,
  dataList,
  loading,
  total,
  pageConfig,
  pageChangeHandler,
  filterDataListHandler,
  getDataListHandler,
  initDataListHandler,
} = useSearch<MusicSearchType, MusicItemType>(
  { ...originalSearch },
  getMusicListApi
);

const emptyRow: MusicItemType = {
  id: '',
  createTime: '',
  playCount: 0,
  listenSeconds: 0,
  sort: 0,
  ...originalForm,
};

const formDialogProps = reactive<FormDialogProps<MusicItemType>>({
  visible: false,
  optType: '',
  row: { ...emptyRow },
});

const sortDialogVisible = ref(false);
/** 正在解析内嵌信息的歌曲 id */
const extractingId = ref('');

const extractFieldLabels: Record<string, string> = {
  name: '歌名',
  singer: '歌手',
  lyric: '歌词',
  cover: '封面',
};

const openDialog = (optType: string, row?: MusicItemType) => {
  formDialogProps.optType = optType;
  formDialogProps.row = row ? { ...row } : { ...emptyRow };
  formDialogProps.visible = true;
};

const closeDialog = () => {
  formDialogProps.visible = false;
};

const changeSuccessHandler = async () => {
  await filterDataListHandler();
  await musicStore.loadPlaylist(true);
};

const sortSuccessHandler = async () => {
  sortDialogVisible.value = false;
  await getDataListHandler();
  await musicStore.loadPlaylist(true);
};

const playHandler = async (row: MusicItemType) => {
  await musicStore.playSong(row);
};

/** 根据已上传的音频地址解析内嵌信息（仅补充空字段） */
const extractHandler = async (row: MusicItemType) => {
  if (extractingId.value) return;
  extractingId.value = row.id;
  try {
    const { data, msg } = await extractMusicApi({ id: row.id });
    if (data?.updated?.length) {
      const names = data.updated
        .map((key) => extractFieldLabels[key])
        .join('、');
      ElMessage.success(`已补充${names}`);
      await getDataListHandler();
      await musicStore.loadPlaylist(true);
    } else if (data) {
      ElMessage.info(msg || '未发现可补充的内嵌信息');
    }
  } finally {
    extractingId.value = '';
  }
};

const deleteHandler = (row: MusicItemType) => {
  confirmHandler(`您将删除音乐「${row.name}」`, async () => {
    const { data, msg } = await deleteMusicApi({ ids: [row.id] });
    if (data) {
      ElMessage.success(msg);
      await getDataListHandler();
      await musicStore.loadPlaylist(true);
    }
  });
};

onBeforeMount(() => {
  if (isSuper.value) {
    initDataListHandler();
    getLanguageList();
    getGenreList();
  }
});
</script>

<style scoped lang="scss">
.music-table {
  width: 100%;
}

.table-cover {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  overflow: hidden;
  border-radius: 6px;
  color: var(--sys-text-secondary-color);
  background: var(--sys-bg-color);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.playing-tag {
  margin-left: 8px;
  padding: 1px 6px;
  flex-shrink: 0;
  font-size: 11px;
  /* 与当前文字色混合，浅色/深色模式下都保持可读 */
  color: color-mix(in srgb, var(--theme-color) 60%, var(--sys-text-color));
  border: 1px solid
    color-mix(in srgb, var(--theme-color) 70%, var(--sys-border-color));
  border-radius: 4px;
}

.delete-btn {
  color: #f56c6c;
}
</style>
