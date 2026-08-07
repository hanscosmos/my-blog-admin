<template>
  <MyDialog
    :visible="visible"
    width="500px"
    :title="optType === 'add' ? '创建文章专栏' : '修改文章专栏'"
    @close="closeHandler"
    @confirm="confirmHandler"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="formRules"
      label-width="110px"
      :style="{ width: '100%' }"
    >
      <el-form-item prop="name" label="文章专栏名">
        <el-input v-model="form.name" placeholder="请输入文章专栏名" />
      </el-form-item>
      <el-form-item prop="sort" label="文章专栏排序">
        <el-input-number v-model="form.sort" :min="0" class="!w-full" />
      </el-form-item>
      <el-form-item prop="description" label="描述">
        <el-input
          v-model="form.description"
          type="textarea"
          rows="3"
          placeholder="请输入文章专栏描述"
        />
      </el-form-item>
      <el-form-item prop="cover" label="文章专栏封面">
        <div class="w-full h-48">
          <MyImageAutoUpload
            type="article-column-cover"
            desc="上传文章专栏封面"
            editable
            :default-url="form.cover"
            @upload-success="uploadSuccessHandler"
          ></MyImageAutoUpload>
        </div>
      </el-form-item>
    </el-form>
  </MyDialog>
</template>
<script setup lang="ts">
import {
  addArticleColumnApi,
  editArticleColumnApi,
} from '@/api/article/column';
import { ElMessage } from 'element-plus';
import { FormDialogPropsType, formRules, originalForm } from '../service';
import { ArticleColumnItemType } from '@/api/article/column/type';

const props = defineProps<FormDialogPropsType>();
const emits = defineEmits(['close', 'changeSuccess']);

const formRef = ref();
const form = ref({
  ...originalForm,
});

const closeHandler = () => {
  form.value = { ...originalForm };
  emits('close');
};

const uploadSuccessHandler = (url: string) => {
  form.value.cover = url;
};

const confirmHandler = () => {
  formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      try {
        const { data, msg } =
          props.optType === 'add'
            ? await addArticleColumnApi(form.value)
            : await editArticleColumnApi({
                ...(props.row as ArticleColumnItemType),
                ...form.value,
              });
        if (data) {
          ElMessage.success(msg);
          emits('changeSuccess');
          closeHandler();
        }
      } catch (err) {
        console.log(err);
      }
    }
  });
};

onMounted(async () => {
  if (props.optType === 'edit' && props.row) {
    form.value = { ...props.row };
  }
});
</script>

<style scoped lang="scss"></style>
