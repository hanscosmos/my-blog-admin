<template>
  <AppDialog :visible="props.visible" :title="dialogTitle" width="500px" @close="closeHandler"
    @confirm="confirmHandler">
    <el-form ref="formRef" :model="form" :rules="formRules" label-width="90px" :style="{ width: '100%' }">
      <el-form-item prop="name" label="图标名称">
        <el-input v-model="form.name" placeholder="请输入图标名称" />
      </el-form-item>
      <el-form-item prop="category" label="图标类型">
        <el-select v-model="form.category" placeholder="请选择图标类型">
          <el-option v-for="item in props.categoryList" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
      </el-form-item>
      <el-form-item prop="source" label="图标来源">
        <el-input v-model="form.source" placeholder="请输入图标来源" />
      </el-form-item>

      <el-form-item prop="sort" label="图标排序">
        <el-input-number v-model="form.sort" :min="0" class="!w-full" />
      </el-form-item>
      <el-form-item prop="desc" label="图标描述">
        <el-input v-model="form.desc" type="textarea" class="!w-full" />
      </el-form-item>
      <el-form-item prop="url" label="上传图标">
        <div class="w-100px h-100px">
          <AppImageAutoUpload type="icon" :editable="optType === 'add'" @upload-success="uploadSuccessHandler">
          </AppImageAutoUpload>
        </div>
      </el-form-item>
    </el-form>
  </AppDialog>
</template>
<script setup lang="ts">
import { FormDialogPropsType, formRules, originalForm } from '../service.ts';
import { ElMessage } from 'element-plus';
import { addIconApi, editIconApi } from '@/api/resource/icon';

type EmitsType = {
  (e: 'close'): void;
  (e: 'changeSuccess'): void;
};

const props = defineProps<FormDialogPropsType>();
const emits = defineEmits<EmitsType>();

const dialogTitle = computed(() => {
  return props.optType === 'add' ? '创建图标' : '编辑图标';
});

const formRef = ref();
const form = ref({
  ...originalForm,
});

const uploadSuccessHandler = (url: string) => {
  form.value.url = url;
};

const closeHandler = () => {
  form.value = { ...originalForm };
  emits('close');
};

const confirmHandler = () => {
  formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      try {
        const { data, msg } =
          props.optType === 'add'
            ? await addIconApi(form.value)
            : await editIconApi({ id: props.row.id, ...form.value });
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
