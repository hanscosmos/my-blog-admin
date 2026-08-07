<template>
  <MyDialog
    :visible="props.visible"
    :title="dialogTitle"
    width="500px"
    @close="closeHandler"
    @confirm="confirmHandler"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="formRules"
      label-width="90px"
      :style="{ width: '100%' }"
    >
      <el-form-item prop="name" label="图片名称">
        <el-input v-model="form.name" placeholder="请输入图片名称" />
      </el-form-item>
      <el-form-item prop="category" label="图片类型">
        <el-select v-model="form.category" placeholder="请选择图片类型">
          <el-option
            v-for="item in props.categoryList"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item prop="sort" label="图片排序">
        <el-input-number v-model="form.sort" :min="0" class="!w-full" />
      </el-form-item>
      <el-form-item prop="desc" label="图片描述">
        <el-input v-model="form.desc" type="textarea" class="!w-full" />
      </el-form-item>
      <el-form-item label="上传方式">
        <el-radio-group v-model="uploadType">
          <el-radio label="upload">上传图片</el-radio>
          <el-radio label="link">链接上传</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item v-if="uploadType === 'upload'" prop="url" label="上传图片">
        <div class="w-full h-180px">
          <MyImageAutoUpload
            type="image"
            :default-url="form.url"
            :editable="optType === 'add'"
            @upload-success="uploadSuccessHandler"
          ></MyImageAutoUpload>
        </div>
      </el-form-item>
      <el-form-item v-else prop="url" label="图片链接">
        <el-input v-model="form.url" placeholder="请输入图片链接" />
      </el-form-item>
    </el-form>
  </MyDialog>
</template>
<script setup lang="ts">
import { FormDialogPropsType, formRules, originalForm } from '../service.ts';
import { ElMessage } from 'element-plus';
import { addImageApi, editImageApi } from '@/api/resource/image';

type EmitsType = {
  (e: 'close'): void;
  (e: 'changeSuccess'): void;
};

const props = defineProps<FormDialogPropsType>();
const emits = defineEmits<EmitsType>();

const uploadType = ref('upload');
const dialogTitle = computed(() => {
  return props.optType === 'add' ? '创建图片' : '编辑图片';
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
            ? await addImageApi(form.value)
            : await editImageApi({ id: props.row.id, ...form.value });
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
