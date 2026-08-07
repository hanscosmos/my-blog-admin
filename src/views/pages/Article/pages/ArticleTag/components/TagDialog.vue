<template>
  <MyDialog
    :visible="visible"
    width="500px"
    :title="optType === 'add' ? '创建文章标签' : '修改文章标签'"
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
      <el-form-item prop="name" label="文章标签名">
        <el-input v-model="form.name" placeholder="请输入文章标签名" />
      </el-form-item>
      <el-form-item prop="alias" label="文章标签别名">
        <el-input v-model="form.alias" placeholder="请输入文章标签别名" />
      </el-form-item>
      <el-form-item prop="color" label="文章标签颜色">
        <el-select v-model="form.color" placeholder="请选择文章标签颜色">
          <el-option
            v-for="item in colorList"
            :key="item.key"
            :value="item.key"
            :label="item.value"
          ></el-option>
        </el-select>
      </el-form-item>
      <el-form-item prop="sort" label="文章标签排序">
        <el-input-number v-model="form.sort" :min="0" class="!w-full" />
      </el-form-item>
      <el-form-item prop="description" label="描述">
        <el-input
          v-model="form.description"
          type="textarea"
          rows="3"
          placeholder="请输入文章标签描述"
        />
      </el-form-item>
    </el-form>
  </MyDialog>
</template>
<script setup lang="ts">
import { addArticleTagApi, editArticleTagApi } from '@/api/article/tag';
import { ElMessage } from 'element-plus';
import { FormDialogPropsType, formRules, originalForm } from '../service';
import { ArticleTagItemType } from '@/api/article/tag/type';
import { DictSimpleItemType } from '@/api/system/dict/type';

const props = defineProps<
  FormDialogPropsType & { colorList: DictSimpleItemType[] }
>();
const emits = defineEmits(['close', 'changeSuccess']);

const formRef = ref();
const form = ref({
  ...originalForm,
});

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
            ? await addArticleTagApi(form.value)
            : await editArticleTagApi({
                ...(props.row as ArticleTagItemType),
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
