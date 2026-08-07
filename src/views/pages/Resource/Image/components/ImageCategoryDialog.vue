vue
<template>
  <MyDialog
    :visible="props.visible"
    :title="dialogTitle"
    width="400px"
    @close="closeHandler"
    @confirm="confirmHandler"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="categoryFormRules"
      label-width="70px"
      :style="{ width: '100%' }"
    >
      <el-form-item prop="name" label="名称">
        <el-input v-model="form.name" placeholder="请输入名称" />
      </el-form-item>
      <el-form-item prop="value" label="英文名">
        <el-input v-model="form.value" placeholder="请输入英文名" />
      </el-form-item>
      <el-form-item prop="sort" label="排序">
        <el-input-number v-model="form.sort" :min="0" class="!w-full" />
      </el-form-item>
    </el-form>
  </MyDialog>
</template>
<script setup lang="ts">
import {
  CategoryDialogPropsType,
  categoryFormRules,
  categoryOriginalForm,
} from '../service.ts';
import { ElMessage } from 'element-plus';
import {
  addImageCategoryApi,
  editImageCategoryApi,
} from '@/api/resource/image';

type EmitsType = {
  (e: 'close'): void;
  (e: 'changeSuccess'): void;
};

const props = defineProps<CategoryDialogPropsType>();
const emits = defineEmits<EmitsType>();

const dialogTitle = computed(() => {
  return props.optType === 'add' ? '创建图片类别' : '编辑图片类别';
});

const formRef = ref();
const form = ref({
  ...categoryOriginalForm,
});

const closeHandler = () => {
  form.value = { ...categoryOriginalForm };
  emits('close');
};

const confirmHandler = () => {
  formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      try {
        const { data, msg } =
          props.optType === 'add'
            ? await addImageCategoryApi(form.value)
            : await editImageCategoryApi({ id: props.row.id, ...form.value });
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
  if (props.optType === 'edit') {
    form.value = { ...props.row };
  }
});
</script>
<style scoped lang="scss"></style>
