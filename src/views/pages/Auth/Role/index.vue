<template>
  <div class="role-manage wh-full">
    <AppSearchPanel :data-exist="roleList.length > 0" :loading="loading" hide-bottom>
      <template #header>
        <div class="flex">
          <app-button v-perm="'authority:role:add'" @click="openDialog('add')">
            <AppIcon name="add" class="mr-2"></AppIcon> 创建角色
          </app-button>
        </div>
      </template>
      <div class="p-4">
        <el-table :data="roleList" size="large" stripe border>
          <el-table-column v-for="item in columnList" :key="item.prop" :prop="item.prop" :label="item.title"
            align="center"></el-table-column>
          <el-table-column label="类型" align="center" width="140">
            <template #default="{ row }">
              <AppTag v-if="row.isSuper" name="超级管理员" />
              <span v-else>自定义角色</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" fixed="right" width="220" align="center">
            <template #default="{ row }">
              <div flex w-full class="justify-center">
                <el-button v-perm="'authority:role:update'" link type="primary" :disabled="row.isSuper"
                  :title="row.isSuper ? '超级管理员角色不可修改' : ''" @click="openDialog('edit', row)">
                  修改
                </el-button>
                <el-button v-perm="'authority:role:delete'" link type="danger" :disabled="row.isSuper"
                  :title="row.isSuper ? '超级管理员角色不可删除' : ''" @click="deleteRoleHandler(row)">
                  删除
                </el-button>
                <el-button v-perm="'authority:role:assign'" link type="info" :disabled="row.isSuper"
                  :title="row.isSuper ? '超级管理员默认拥有全部权限，无需分配' : ''" @click="assignAuthHandler(row)">
                  权限分配
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </AppSearchPanel>

    <div v-if="formDialogProps.visible">
      <RoleDialog :visible="formDialogProps.visible" :opt-type="formDialogProps.optType" :row="formDialogProps.row"
        @close="closeDialog" @change-success="getRoleList"></RoleDialog>
    </div>

    <DistributeAuthorityDialog v-if="authDialogProps.visible" :current-row="authDialogProps.row!"
      :dialog-visible="authDialogProps.visible" @close-dialog="closeAuthDialog"></DistributeAuthorityDialog>
  </div>
</template>
<script lang="ts" setup>
import { deleteRoleApi, getRoleListApi } from '@/api/authority/role';
import type { RoleItemType } from '@/api/authority/role/type.ts';
import { useDialog } from '@/hooks/useDialog';
import RoleDialog from '@/views/pages/Auth/Role/components/RoleDialog.vue';
import DistributeAuthorityDialog from '@/views/pages/Auth/Role/components/DistributeAuthorityDialog.vue';
import { columnList } from '@/views/pages/Auth/Role/service.ts';
import { ElMessage } from 'element-plus';

const roleList = ref<RoleItemType[]>([]);
const loading = ref(true);

const { formDialogProps, openDialog, closeDialog } = useDialog<RoleItemType>();

const authDialogProps = reactive<{
  visible: boolean;
  row: RoleItemType | null;
}>({
  visible: false,
  row: null,
});

const assignAuthHandler = (row: RoleItemType) => {
  authDialogProps.row = row;
  authDialogProps.visible = true;
};

const closeAuthDialog = () => {
  authDialogProps.visible = false;
  authDialogProps.row = null;
};

const getRoleList = async () => {
  try {
    loading.value = true;
    const { data } = await getRoleListApi();
    roleList.value = data;
  } catch (error) {
    console.log(error);
  } finally {
    loading.value = false;
  }
};

const deleteRoleHandler = (row: RoleItemType) => {
  confirmHandler(`您将删除角色「${row.name}」`, async () => {
    const { data, msg } = await deleteRoleApi({ ids: [row.id] });
    if (data) {
      ElMessage.success(msg);
      await getRoleList();
    }
  });
};

onBeforeMount(() => {
  getRoleList();
});
</script>
<style lang="scss" scoped></style>
