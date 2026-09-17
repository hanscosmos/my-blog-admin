<template>
  <div class="comment-thread">
    <!-- 正文是 markdown 源码，列表里截断展示，点击看完整渲染 -->
    <div class="comment-content" :class="{ 'focus-comment': focusId === comment.id }" title="点击查看完整评论"
      @click="emits('view', comment)">
      {{ comment.content }}
    </div>
    <div v-if="comment.replies?.length" class="reply-list">
      <div v-for="reply in comment.replies" :key="reply.id" class="reply-item"
        :class="{ 'focus-comment': focusId === reply.id }">
        <div class="reply-head">
          <img v-if="reply.user.avatar" :src="reply.user.avatar" class="w-5 h-5 rounded-full" />
          <span class="reply-name">{{ reply.user.nickName }}</span>
          <span v-if="reply.replyUser">回复 {{ reply.replyUser.nickName }}</span>
          <AppTag v-if="reply.user.isForbidden" name="已禁用" color="red" size="small"></AppTag>
          <span>{{ fmtTime(reply.createTime) }}</span>
          <div class="reply-actions ml-auto flex items-center">
            <el-button link type="primary" @click="emits('view', reply)">查看</el-button>
            <el-button v-perm="'system:comment:forbid-user'" link
              :type="reply.user.isForbidden ? 'success' : 'warning'" @click="emits('forbid', reply)">
              {{ reply.user.isForbidden ? '解除禁用' : '禁用用户' }}
            </el-button>
            <el-button v-perm="'system:comment:delete'" link type="danger" @click="emits('delete', reply)">
              删除
            </el-button>
          </div>
        </div>
        <div class="reply-content" title="点击查看完整评论" @click="emits('view', reply)">
          {{ reply.content }}
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { CommentItemType } from '@/api/system/comment/type';
import { fmtTime } from '@/utils/tool';

defineProps<{
  comment: CommentItemType;
  /** 从消息提醒跳转定位的评论 id，命中时高亮（顶层评论或其下某条回复） */
  focusId?: string;
}>();

const emits = defineEmits<{
  (e: 'view', comment: CommentItemType): void;
  (e: 'delete', comment: CommentItemType): void;
  (e: 'forbid', comment: CommentItemType): void;
}>();
</script>
<style scoped lang="scss">
.comment-thread {
  text-align: left;
}

// 从消息提醒跳转定位到的那条评论
.focus-comment {
  padding: 2px 6px;
  border-radius: 4px;
  background-color: rgba(64, 158, 255, 0.15);
  box-shadow: 0 0 0 1px rgba(64, 158, 255, 0.55);
}

.comment-content {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
  word-break: break-all;
  cursor: pointer;
}

.reply-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 8px;
  padding-left: 12px;
  border-left: 2px solid var(--sys-border-color);
}

.reply-head {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #999;
}

.reply-name {
  color: #666;
}

.reply-content {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  margin-top: 4px;
  overflow: hidden;
  word-break: break-all;
  cursor: pointer;
}
</style>
