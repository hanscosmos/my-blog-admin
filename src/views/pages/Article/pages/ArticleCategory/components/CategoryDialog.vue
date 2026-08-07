<template>
  <MyDialog
    :visible="visible"
    width="500px"
    :title="optType === 'add' ? '创建文章分类' : '修改文章分类'"
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
      <el-form-item prop="name" label="文章分类名">
        <el-input v-model="form.name" placeholder="请输入文章分类名" />
      </el-form-item>
      <el-form-item prop="alias" label="文章分类别名">
        <el-input v-model="form.alias" placeholder="请输入文章分类别名" />
      </el-form-item>
      <el-form-item prop="father" label="父菜单">
        <el-input v-model="fatherName" disabled></el-input>
      </el-form-item>
      <el-form-item prop="sort" label="文章分类排序">
        <el-input-number v-model="form.sort" :min="0" class="!w-full" />
      </el-form-item>
      <el-form-item prop="description" label="描述">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="3"
          placeholder="请输入文章分类描述"
        />
      </el-form-item>
    </el-form>
  </MyDialog>
</template>
<script setup lang="ts">
import {
  addArticleCategoryApi,
  editArticleCategoryApi,
} from '@/api/article/category';
import { ElMessage } from 'element-plus';
import { FormDialogPropsType, formRules, originalForm } from '../service';
import { ArticleCategoryItemType } from '@/api/article/category/type';

const props = defineProps<FormDialogPropsType>();
const emits = defineEmits(['close', 'changeSuccess']);

const formRef = ref();
const form = ref({
  ...originalForm,
});

const fatherName = ref<string | null>(null);

const closeHandler = () => {
  form.value = { ...originalForm };
  fatherName.value = '';
  emits('close');
};

const confirmHandler = () => {
  formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      try {
        const { fatherName, ...rest } = {
          ...(props.row as ArticleCategoryItemType),
          ...form.value,
        };
        const { data, msg } =
          props.optType === 'add'
            ? await addArticleCategoryApi(form.value)
            : await editArticleCategoryApi({
                ...rest,
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

onMounted(() => {
  if (props.optType === 'edit' && props.row) {
    form.value = { ...props.row };
    fatherName.value = props.row.fatherName || '';
  } else {
    if (props.row) {
      fatherName.value = props.row.name;
      form.value.father = props.row.id;
    }
  }
});
</script>

<style scoped lang="scss"></style>
