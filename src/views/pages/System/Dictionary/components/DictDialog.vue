<template>
  <MyDialog
    :visible="visible"
    width="450px"
    :title="optType === 'add' ? '创建字典' : '修改字典'"
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
      <el-form-item prop="key" label="字典键">
        <el-input v-model="form.key" placeholder="请输入字典键" />
      </el-form-item>
      <el-form-item prop="value" label="字典值">
        <el-input v-model="form.value" placeholder="请输入字典值" />
      </el-form-item>
      <el-form-item prop="code" label="字典码">
        <el-tree-select
          v-model="form.code"
          :data="categoryList"
          node-key="code"
          class="w-full"
          disabled
        ></el-tree-select>
      </el-form-item>
      <el-form-item prop="sort" label="字典排序">
        <el-input-number
          v-model="form.sort"
          :min="0"
          class="!w-full"
          placeholder="请输入字典排序"
        />
      </el-form-item>

      <el-form-item prop="desc" label="字典描述">
        <el-input v-model="form.desc" type="textarea" :rows="3" />
      </el-form-item>
    </el-form>
  </MyDialog>
</template>
<script setup lang="ts">
import { addDictApi, editDictApi } from '@/api/system/dict';
import { ElMessage } from 'element-plus';
import { FormDialogPropsType, formRules, originalForm } from '../service';
import { DictItemType } from '@/api/system/dict/type.ts';
import { DictCategoryItemType, dictCategoryList } from '@/config/dict';

const props = defineProps<FormDialogPropsType>();
const emits = defineEmits(['close', 'changeSuccess']);

const categoryList = computed(() => {
  return dictCategoryList.filter(
    (item: DictCategoryItemType) => item.children && item.children?.length > 0
  );
});

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
            ? await addDictApi(form.value)
            : await editDictApi({
                id: (props.row as DictItemType).id,
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

onMounted(() => {
  if (props.optType === 'edit' && props.row) {
    const { key, value, desc, code, sort } = props.row;
    form.value = { key, value, desc, code, sort };
  } else {
    form.value.code = props.currentCode;
  }
});
</script>

<style scoped lang="scss"></style>
