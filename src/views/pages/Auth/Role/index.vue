<template>
  <div class="role-manage wh-full">
    <MySearchPanel
      :data-exist="roleList.length > 0"
      :loading="loading"
      hide-bottom
    >
      <template #header>
        <div class="flex">
          <my-button @click="openDialog('add')">
            <my-icon name="add" class="mr-2"></my-icon> 创建角色</my-button
          >
        </div>
      </template>
      <div class="p-4">
        <el-table :data="roleList" size="large" stripe border>
          <el-table-column
            v-for="item in columnList"
            :key="item.prop"
            :prop="item.prop"
            :label="item.title"
            align="center"
          ></el-table-column>
          <el-table-column
            label="操作"
            fixed="right"
            width="200"
            align="center"
          >
            <template #default="{ row }">
              <div flex w-full class="justify-center">
                <el-button link type="primary" @click="openDialog('edit', row)">
                  修改
                </el-button>
                <el-button link type="danger" @click="deleteRoleHandler(row)">
                  删除
                </el-button>
                <el-button
                  link
                  type="info"
                  plain
                  @click="deleteRoleHandler(row)"
                >
                  权限分配
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </MySearchPanel>

    <div v-if="formDialogProps.visible">
      <RoleDialog
        :visible="formDialogProps.visible"
        :opt-type="formDialogProps.optType"
        :row="formDialogProps.row"
        @close="closeDialog"
        @change-success="getRoleList"
      ></RoleDialog>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { deleteRoleApi, getRoleListApi } from '@/api/authority/role';
import type { RoleItemType } from '@/api/authority/role/type.ts';
import { useDialog } from '@/hooks/useDialog';
import RoleDialog from '@/views/pages/Auth/Role/components/RoleDialog.vue';
import { columnList } from '@/views/pages/Auth/Role/service.ts';
import { ElMessage } from 'element-plus';

const roleList = ref<RoleItemType[]>([]);
const loading = ref(true);

const { formDialogProps, openDialog, closeDialog } = useDialog<RoleItemType>();
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
  confirmHandler('您将删除这个角色', async () => {
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
