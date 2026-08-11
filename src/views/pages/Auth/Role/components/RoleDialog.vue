<template>
  <AppDialog :visible="visible" width="450px" :title="optType === 'add' ? '创建角色' : '修改角色'" @close="closeHandler"
    @confirm="confirmHandler">
    <el-form ref="formRef" :model="form" :rules="formRules" label-width="110px" :style="{ width: '100%' }">
      <el-form-item prop="name" label="角色名">
        <el-input v-model="form.name" placeholder="请输入角色名" />
      </el-form-item>
      <el-form-item prop="code" label="角色码">
        <el-input v-model="form.code" placeholder="请输入角色码" />
      </el-form-item>
      <el-form-item prop="limit" label="角色数量限制">
        <el-input-number v-model="form.limit" :min="1" class="!w-full" />
      </el-form-item>
      <el-form-item prop="sort" label="角色排序">
        <el-input-number v-model="form.sort" :min="0" class="!w-full" />
      </el-form-item>
    </el-form>
  </AppDialog>
</template>
<script setup lang="ts">
import { addRoleApi, editRoleApi } from '@/api/authority/role';
import { ElMessage } from 'element-plus';
import { FormDialogPropsType, formRules, originalForm } from '../service.ts';
import { RoleItemType } from '@/api/authority/role/type.ts';

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

const confirmHandler = () => {
  formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      try {
        const { data, msg } =
          props.optType === 'add'
            ? await addRoleApi(form.value)
            : await editRoleApi({
              id: (props.row as RoleItemType).id,
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
    form.value = { ...props.row };
  }
});
</script>

<style scoped lang="scss"></style>
