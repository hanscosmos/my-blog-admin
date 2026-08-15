<template>
  <div class="release-article w-full h-full flex flex-col">
    <div class="wrapper-color flex items-center h-16 px-4 border-bottom">
      <input v-model="title" class="flex-1 w-0 text-2xl bg-transparent" placeholder="请输入文章标题..." border="none"
        outline="none" />
      <app-button @click="openDrawerHandler">
        <AppIcon name="add-four" class="mr-2"></AppIcon>发布
      </app-button>
    </div>
    <div class="edit-wrapper flex-1 h-0 relative">
      <app-md-editor ref="mdEditorRef" @save="releaseArticleHandler"
        @update:model-value="handleEditorChange"></app-md-editor>
      <VoiceInputBar @insert="handleVoiceInsert" />
    </div>
  </div>
  <ArticleFormDrawer ref="drawerRef" :default-data="originForm" @send-data="releaseArticleHandler" />
</template>
<script lang="ts" setup>
import { pinyin } from 'pinyin-pro';
import ArticleFormDrawer from '@/views/pages/Article/components/ArticleFormDrawer/index.vue';
import VoiceInputBar from '@/views/pages/Article/components/VoiceInputBar/index.vue';
import { ElMessage } from 'element-plus';
import {
  addArticleApi,
  editArticleApi,
  getArticleDetailApi,
} from '@/api/article';
import { useArticleEditorStore } from '@/ai/store/articleEditor';
import { OriginArticleFormTpe } from '../../types';

const route = useRoute();
const router = useRouter();

const mdEditorRef = ref();
const drawerRef = ref();
const title = ref('');

const originForm = ref<OriginArticleFormTpe | null>(null);

const articleEditorStore = useArticleEditorStore();

/** 同步标题与文章 id 到 AI 上下文 */
function syncMeta() {
  articleEditorStore.setContext({
    id: route.name === 'UpdateArticle' ? (route.query.id as string) : '',
    title: title.value,
  });
}

/** 编辑器内容变化时同步正文到 AI 上下文 */
function handleEditorChange(content: string) {
  articleEditorStore.setContext({ content });
}

watch(title, syncMeta);

const baseValidDate = () => {
  let flag = true;
  if (!title.value.trim()) {
    ElMessage.warning('请输入文章标题！');
    flag = false;
    return flag;
  }
  if (mdEditorRef.value.getText().trim().length < 10) {
    ElMessage.warning('文章内容至少10个字！');
    flag = false;
    return flag;
  }
  return flag;
};
const openDrawerHandler = () => {
  if (!baseValidDate()) {
    return;
  }
  drawerRef.value.openDrawer();
};

const releaseArticleHandler = async () => {
  if (!baseValidDate()) {
    return;
  }
  const originArticleForm = await drawerRef.value.getArticleForm();
  if (!originArticleForm) return;
  const reqParams = {
    pinyin: pinyin(title.value, {
      toneType: 'none',
      separator: '',
      nonZh: 'consecutive',
      v: true,
    }),
    title: title.value,
    content: mdEditorRef.value.getText(),
    ...originArticleForm,
  };
  if (route.name === 'UpdateArticle') {
    const res = await editArticleApi({
      ...reqParams,
      id: route.query.id as string,
    });
    res.data && ElMessage.success(res.msg);
  } else {
    const res = await addArticleApi(reqParams);
    res.data && ElMessage.success(res.msg);
    router.push({ name: 'UpdateArticle', query: { id: res.data } });
  }
};

const handleVoiceInsert = (text: string) => {
  mdEditorRef.value.insertAtCursor(text);
};

const initArticleDetailHandler = async () => {
  if (route.name === 'UpdateArticle') {
    const res = await getArticleDetailApi({ id: route.query.id as string });
    const { properties, category, visible, cover, abstract, status, column } =
      res.data.baseInfo;
    const tagList = res.data.tagList.map((item: any) => item.id);
    originForm.value = {
      category,
      cover,
      status,
      properties,
      tags: tagList,
      column,
      abstract,
      visible,
    };
    title.value = res.data.baseInfo.title;
    mdEditorRef.value.setText(res.data.detailInfo.content);
  }
};

onMounted(() => {
  syncMeta();
  initArticleDetailHandler();
});

onBeforeUnmount(() => {
  articleEditorStore.reset();
});
</script>
<style lang="scss" scoped></style>
