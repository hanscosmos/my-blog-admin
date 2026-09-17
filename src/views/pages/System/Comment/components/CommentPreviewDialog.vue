<template>
  <AppDialog :visible="visible" width="600px" title="评论详情" hide-footer @close="closeHandler">
    <div class="flex items-center gap-2 mb-4">
      <img v-if="row?.user?.avatar" :src="row.user.avatar" class="w-8 h-8 rounded-full" />
      <span class="font-medium">{{ row?.user?.nickName }}</span>
      <AppTag v-if="row?.user?.isForbidden" name="已禁用" color="red"></AppTag>
      <span class="text-xs text-gray-500">{{ row ? fmtTime(row.createTime) : '' }}</span>
    </div>
    <!-- 评论正文是 markdown 源码，与文章详情页共用 v-md-preview -->
    <div class="max-h-400px overflow-auto text-left">
      <v-md-preview :text="row?.content || ''"></v-md-preview>
    </div>
  </AppDialog>
</template>
<script lang="ts" setup>
import { CommentItemType } from '@/api/system/comment/type';
import { fmtTime } from '@/utils/tool';

defineProps<{
  visible: boolean;
  row: CommentItemType | null;
}>();

const emits = defineEmits(['close']);

const closeHandler = () => {
  emits('close');
};
</script>
<style scoped lang="scss"></style>
