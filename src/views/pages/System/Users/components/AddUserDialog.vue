<template>
  <MyDialog
    :visible="visible"
    width="450px"
    :title="optType === 'add' ? '创建用户' : '分配角色'"
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
      <el-form-item prop="username" label="用户名">
        <el-input
          v-model="form.username"
          :disabled="optType === 'edit'"
          placeholder="请输入用户名"
        />
      </el-form-item>
      <el-form-item prop="nickName" label="用户昵称">
        <el-input
          v-model="form.nickName"
          :disabled="optType === 'edit'"
          placeholder="请输入用户昵称"
        />
      </el-form-item>
      <el-form-item prop="email" label="用户邮箱">
        <el-input
          v-model="form.email"
          :disabled="optType === 'edit'"
          :min="1"
          class="!w-full"
        />
      </el-form-item>
      <el-form-item prop="roleIds" label="用户角色">
        <el-select
          v-model="form.roleIds"
          multiple
          clearable
          filterable
          class="!w-280px"
        >
          <el-option
            v-for="item in roleList"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          ></el-option>
        </el-select>
      </el-form-item>
    </el-form>
  </MyDialog>
</template>
<script setup lang="ts">
import { ElMessage } from 'element-plus';
import { formRules, originalForm, FormDialogPropsType } from '../service';
import { RoleItemType } from '@/api/authority/role/type.ts';
import { addUserApi, setUserRoleApi } from '@/api/system/user';
import { UserItemType } from '@/api/system/user/type';

const props = defineProps<FormDialogPropsType & { roleList: RoleItemType[] }>();
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
            ? await addUserApi(form.value)
            : await setUserRoleApi({
                userId: (props.row as UserItemType).id,
                roleIds: form.value.roleIds,
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
    form.value = {
      username: props.row.username,
      nickName: props.row.nickName,
      email: props.row.profile.email,
      roleIds: props.row.roles.map((el) => el.id),
    };
  }
});
</script>

<style scoped lang="scss"></style>
