<template>
  <el-drawer
    :model-value="visible"
    :size="500"
    :lock-scroll="false"
    :before-close="closeDrawer"
    title="发布文章设置"
  >
    <el-form
      label-width="100px"
      ref="formRef"
      :rules="articleFormRules"
      :model="articleForm"
    >
      <el-form-item prop="category" label="文章分类">
        <el-tree-select
          v-model="articleForm.category"
          :data="categoryList"
          node-key="id"
          :props="{ label: 'name' }"
          class="!w-full"
        />
      </el-form-item>
      <el-form-item prop="tags" label="文章标签">
        <el-select v-model="articleForm.tags" multiple :multiple-limit="4">
          <el-option
            v-for="item in tagList"
            :key="item.id"
            :value="item.id"
            :label="item.name"
          >
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item prop="column" label="文章专栏">
        <el-select v-model="articleForm.column as string">
          <el-option
            v-for="item in columnList"
            :key="item.id"
            :value="item.id"
            :label="item.name"
          >
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item prop="original" label="是否原创">
        <el-radio-group v-model="articleForm.properties">
          <el-radio
            v-for="item in propertiesList"
            :key="item.key"
            :value="item.key"
          >
            {{ item.value }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item prop="visible" label="文章可见性">
        <el-radio-group v-model="articleForm.visible">
          <el-radio
            v-for="item in visibleList"
            :key="item.key"
            :value="item.key"
          >
            {{ item.value }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item prop="cover" label="文章封面">
        <div class="w-full h-48">
          <MyImageAutoUpload
            type="article-cover"
            desc="上传文章封面"
            editable
            :default-url="articleForm.cover"
            @upload-success="uploadSuccessHandler"
          ></MyImageAutoUpload>
        </div>
      </el-form-item>
      <el-form-item prop="abstract" label="编辑摘要">
        <el-input
          v-model="articleForm.abstract"
          type="textarea"
          :rows="4"
          maxlength="100"
          show-word-limit
          resize="none"
        ></el-input>
      </el-form-item>
    </el-form>
    <div class="flex justify-end mt-4">
      <my-button type="plain" class="mr-4" @click="closeDrawer">取消</my-button>
      <my-button @click="publishArticleHandler" class="mr-4"
        >发布文章</my-button
      >
      <el-button
        v-if="!defaultData?.status || defaultData?.status !== statusList[1].key"
        type="primary"
        @click="saveDraftsHandler"
        >保存草稿</el-button
      >
    </div>
  </el-drawer>
</template>
<script setup lang="ts">
import { useDict } from '@/hooks/useDict';
import {
  useArticleCategory,
  useArticleColumn,
  useArticleTag,
} from '../../hooks/useArticle';
import { OriginArticleFormTpe } from '../../types';

const props = defineProps<{
  defaultData: OriginArticleFormTpe | null;
}>();
const emits = defineEmits(['sendData']);

const { dictDataList: statusList, getDictDataList: getStatusList } =
  useDict('ARTICLE_STATUS');
const { dictDataList: visibleList, getDictDataList: getArticleVisibleList } =
  useDict('ARTICLE_VISIBLE');
const { dictDataList: propertiesList, getDictDataList: getPropertiesList } =
  useDict('ARTICLE_PROPERTY');

const { categoryList, getCategoryTree } = useArticleCategory();
const { tagList, getTagList } = useArticleTag();
const { columnList, getColumnList } = useArticleColumn();

const visible = ref(false);
const openDrawer = () => {
  visible.value = true;
};

const closeDrawer = () => {
  visible.value = false;
};

const formRef = ref();

const originalForm: OriginArticleFormTpe = {
  category: null,
  column: null,
  cover: '',
  tags: [],
  abstract: '',
  visible: '',
  properties: '',
  status: '',
};

const articleForm = ref<OriginArticleFormTpe>({
  ...originalForm,
});

const articleFormRules = {
  category: [{ required: true, message: '文章分类不能为空', trigger: 'blur' }],
  tags: [{ required: true, message: '文章标签不能为空', trigger: 'blur' }],
  abstract: [{ required: true, message: '文章摘要不能为空', trigger: 'blur' }],
};

const uploadSuccessHandler = (url: string) => {
  articleForm.value.cover = url;
};

const initDrawer = async () => {
  await getStatusList();
  await getArticleVisibleList();
  await getPropertiesList();
  await getCategoryTree();
  await getTagList();
  await getColumnList();
  if (propertiesList.value.length > 0) {
    articleForm.value.properties = propertiesList.value[0].key;
  }
  if (visibleList.value.length > 0) {
    articleForm.value.visible = visibleList.value[0].key;
  }
  if (statusList.value.length > 0) {
    articleForm.value.status = statusList.value[0].key;
  }
  if (props.defaultData) {
    articleForm.value = { ...props.defaultData };
  }
};

const publishArticleHandler = async () => {
  const valid = await formRef.value.validate();
  if (valid) {
    closeDrawer();
    articleForm.value.status = statusList.value[1].key;
    emits('sendData');
  }
};

const saveDraftsHandler = async () => {
  closeDrawer();

  articleForm.value.status = statusList.value[0].key;
  emits('sendData');
};

const getArticleForm = async () => {
  if (articleForm.value.status === statusList.value[1].key) {
    const valid = await formRef.value.validate();
    if (!valid) return false;
  }
  return articleForm.value;
};

onMounted(() => {
  initDrawer();
});

defineExpose({
  openDrawer,
  getArticleForm,
});
</script>
<style lang="scss" scoped></style>
