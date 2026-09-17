<template>
  <div class="wh-full">
    <AppSearchPanel :data-exist="dataList.length > 0" :loading="loading">
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <app-tag size="large" class="mr-4">评论内容</app-tag>
            <el-input v-model="searchParams.keyword" class="!w-280px mr-4" placeholder="请输入关键词搜索" clearable
              @change="filterDataListHandler"></el-input>
            <app-tag size="large" class="mr-4">评论对象</app-tag>
            <el-select v-model="searchParams.targetType" class="!w-140px mr-4" @change="filterDataListHandler">
              <el-option v-for="item in targetTypeOptions" :key="item.value" :label="item.label"
                :value="item.value"></el-option>
            </el-select>
            <app-tag size="large" class="mr-4">评论时间</app-tag>
            <el-date-picker v-model="commentDateRange" type="daterange" class="!w-300px"
              value-format="YYYY-MM-DD HH:mm:ss" range-separator="至" clearable
              @change="changeCommentDate"></el-date-picker>
          </div>
        </div>
      </template>
      <div class="p-4">
        <!-- 只渲染顶层评论，其下回复由 CommentThread 嵌在内容格里展示 -->
        <el-table :data="dataList" style="width: 100%" size="large" border stripe>
          <el-table-column label="评论内容" align="left" header-align="center" min-width="520">
            <template #default="{ row }">
              <CommentThread :comment="row" :focus-id="focusCommentId" @view="openPreviewDialog"
                @delete="deleteCommentHandler" @forbid="forbidUserHandler"></CommentThread>
            </template>
          </el-table-column>
          <el-table-column label="评论人" align="center" width="200">
            <template #default="{ row }">
              <div class="xy-center gap-2">
                <img v-if="row.user.avatar" :src="row.user.avatar" class="w-8 h-8 rounded-full" />
                <span>{{ row.user.nickName }}</span>
                <AppTag v-if="row.user.isForbidden" name="已禁用" color="red"></AppTag>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="评论对象" align="center" width="200">
            <template #default="{ row }">
              <div class="xy-center gap-2">
                <AppTag :name="row.targetType === 'article' ? '文章' : '留言板'"
                  :color="row.targetType === 'article' ? '' : 'gray'"></AppTag>
                <span class="comment-target">{{ row.targetName }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="ip" label="IP" align="center" width="140"></el-table-column>
          <el-table-column label="评论时间" align="center" width="180">
            <template #default="{ row }">
              <div>{{ fmtTime(row.createTime) }}</div>
            </template>
          </el-table-column>
          <el-table-column label="操作" fixed="right" width="200" align="center">
            <template #default="{ row }">
              <div flex w-full class="justify-center">
                <el-button link type="primary" @click="openPreviewDialog(row)">查看</el-button>
                <el-button v-perm="'system:comment:forbid-user'" link
                  :type="row.user.isForbidden ? 'success' : 'warning'" @click="forbidUserHandler(row)">
                  {{ row.user.isForbidden ? '解除禁用' : '禁用用户' }}
                </el-button>
                <el-button v-perm="'system:comment:delete'" link type="danger" @click="deleteCommentHandler(row)">
                  删除
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <template #footer>
        <AppPagination :total="total" :page-number="pageConfig.pageNumber" :page-size="pageConfig.pageSize"
          @page-change="pageChangeHandler"></AppPagination>
      </template>
    </AppSearchPanel>
    <!-- 必须 v-if：AppDialog 根元素是 w-full h-full，常驻会再撑出一个满屏高的块，把固定底部的分页挤出视口 -->
    <div v-if="previewDialogProps.visible">
      <CommentPreviewDialog :visible="previewDialogProps.visible" :row="previewDialogProps.row"
        @close="closePreviewDialog">
      </CommentPreviewDialog>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { getCommentListApi, deleteCommentApi, forbidCommentUserApi } from '@/api/system/comment';
import { CommentItemType, CommentQueryType, CommentUserType } from '@/api/system/comment/type';
import { useSearch } from '@/hooks/useSearch';
import { useDialog } from '@/hooks/useDialog';
import { confirmHandler, fmtTime } from '@/utils/tool';
import CommentPreviewDialog from './components/CommentPreviewDialog.vue';
import CommentThread from './components/CommentThread.vue';

const route = useRoute();

const targetTypeOptions = [
  { label: '全部', value: '' },
  { label: '文章', value: 'article' },
  { label: '留言板', value: 'message' },
];

const originalParams: CommentQueryType = {
  keyword: '',
  targetType: '',
  startTime: '',
  endTime: '',
};

const commentDateRange = ref<string | string[]>('');

const {
  searchParams,
  dataList,
  loading,
  total,
  pageConfig,
  pageChangeHandler,
  filterDataListHandler,
  initDataListHandler,
  getDataListHandler,
} = useSearch<CommentQueryType, CommentItemType>(
  originalParams,
  getCommentListApi
);

const { formDialogProps: previewDialogProps, openDialog, closeDialog } =
  useDialog<CommentItemType>();

const openPreviewDialog = (row: CommentItemType) => {
  openDialog('view', row);
};

const closePreviewDialog = () => {
  closeDialog();
};

const changeCommentDate = async () => {
  if (commentDateRange.value instanceof Array) {
    searchParams.value.startTime = commentDateRange.value[0];
    searchParams.value.endTime = commentDateRange.value[1];
  } else {
    searchParams.value.startTime = '';
    searchParams.value.endTime = '';
  }
  await filterDataListHandler();
};

const deleteCommentHandler = (row: CommentItemType) => {
  const replyCount = row.replies?.length || 0;
  const content = replyCount
    ? `您将删除这条评论及其下 ${replyCount} 条回复`
    : '您将删除这条评论';
  confirmHandler(content, async () => {
    const { code, msg } = await deleteCommentApi({ ids: [row.id] });
    if (code === 0) {
      ElMessage.success(msg);
      await initDataListHandler();
    }
  });
};

const forbidUserHandler = (row: CommentItemType) => {
  const user: CommentUserType = row.user;
  const isForbidden = !user.isForbidden;
  const content = isForbidden
    ? `您将禁用用户「${user.nickName}」，禁用后该用户将无法登录`
    : `您将解除对用户「${user.nickName}」的禁用`;
  confirmHandler(content, async () => {
    const { code, msg } = await forbidCommentUserApi({
      userId: user.id,
      isForbidden,
    });
    if (code === 0) {
      ElMessage.success(msg);
      // 该用户其余评论的禁用状态也会变，刷新当前页即可
      await getDataListHandler();
    }
  });
};

// 从消息提醒跳转定位的那条评论 id，命中后高亮
const focusCommentId = ref('');

/**
 * 定位评论：?focus=<评论 id> 由顶部消息下拉 / 个人中心消息列表带过来。
 *
 * 查询时把 focusId 交给后端精确命中（回复会返回到它所属的顶层评论），
 * 查完立即清掉，避免后续翻页、筛选被它锁死在这一条上。
 */
const initFocusComment = async () => {
  const focusId = route.query.focus as string;
  if (!focusId) {
    initDataListHandler();
    return;
  }
  // 定位是精确查询，清掉其它筛选，避免界面残留条件与结果对不上
  commentDateRange.value = '';
  searchParams.value = { ...originalParams, focusId };
  await getDataListHandler();
  searchParams.value.focusId = undefined;

  focusCommentId.value = dataList.value.some(
    (row) => row.id === focusId || row.replies?.some((reply) => reply.id === focusId)
  )
    ? focusId
    : '';
  if (!focusCommentId.value) return;
  nextTick(() => {
    document.querySelector('.focus-comment')?.scrollIntoView({ block: 'center' });
  });
};

// 用 watch 而非 onMounted：已在评论管理页时再点一条消息，组件复用不会重新挂载
watch(() => route.query.focus, initFocusComment, { immediate: true });
</script>
<style lang="scss" scoped>
.comment-target {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style>
