<template>
  <div class="wh-full">
    <MySearchPanel :data-exist="dataList.length > 0" :loading="loading">
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <my-tag size="large" class="mr-4">用户昵称</my-tag>
            <el-input
              v-model="searchParams.keyword"
              class="!w-280px mr-4"
              placeholder="请输入关键词搜索"
              clearable
              @change="filterDataListHandler"
            ></el-input>
            <my-tag size="large" class="mr-4">用户角色</my-tag>
            <el-select
              v-model="searchParams.roleId"
              clearable
              filterable
              class="!w-280px"
              @change="filterDataListHandler"
            >
              <el-option
                v-for="item in roleList"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              ></el-option>
            </el-select>
            <my-button class="ml-4" @click="openDialog('add')">
              <my-icon name="add" class="mr-2"></my-icon>
              新增用户
            </my-button>
          </div>
        </div>
      </template>
      <div class="p-4">
        <el-table
          :data="dataList"
          style="width: 100%"
          row-key="id"
          size="large"
          border
          stripe
          default-expand-all
        >
          <el-table-column label="基本信息" align="center">
            <template #default="{ row }">
              <div class="xy-center">
                <img
                  v-if="row.avatar"
                  :src="row.avatar"
                  class="w-8 h-8 mr-4 rounded-full"
                />
                <span>{{ row.nickName }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="邮箱" align="center">
            <template #default="{ row }">
              <div>{{ row.profile.email }}</div>
            </template>
          </el-table-column>
          <el-table-column label="角色" align="center">
            <template #default="{ row }">
              <div class="xy-center gap-2">
                <MyTag
                  color="#999"
                  v-for="item in row.roles"
                  :key="item.id"
                  :name="item.name"
                ></MyTag>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="创建时间" align="center">
            <template #default="{ row }">
              <div>{{ fmtTime(row.createTime) }}</div>
            </template>
          </el-table-column>

          <el-table-column
            label="操作"
            fixed="right"
            width="250"
            align="center"
          >
            <template #default="{ row }">
              <div flex w-full class="justify-center">
                <el-button link type="primary" @click="openDialog('edit', row)"
                  >分配角色
                </el-button>
                <el-button link type="primary"> 重置密码 </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <template #footer>
        <MyPagination
          :total="total"
          :page-number="pageConfig.pageNumber"
          :page-size="pageConfig.pageSize"
          @page-change="pageChangeHandler"
        ></MyPagination>
      </template>
    </MySearchPanel>
    <div v-if="formDialogProps.visible">
      <AddUserDialog
        :opt-type="formDialogProps.optType"
        :visible="formDialogProps.visible"
        :row="formDialogProps.row"
        :role-list="roleList"
        @close="closeDialog"
        @change-success="filterDataListHandler"
      ></AddUserDialog>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { getUserListApi } from '@/api/system/user';
import { UserItemType, UserListQueryType } from '@/api/system/user/type';
import { useSearch } from '@/hooks/useSearch';
import { fmtTime } from '@/utils/tool';
import { RoleItemType } from '@/api/authority/role/type';
import { getRoleListApi } from '@/api/authority/role';
import AddUserDialog from './components/AddUserDialog.vue';
import { useDialog } from '@/hooks/useDialog';

const roleList = ref<RoleItemType[]>([]);
const { formDialogProps, openDialog, closeDialog } = useDialog<UserItemType>();

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

const originalParams: UserListQueryType = { keyword: '', roleId: '' };

const {
  searchParams,
  dataList,
  loading,
  total,
  pageConfig,
  pageChangeHandler,
  filterDataListHandler,
  initDataListHandler,
} = useSearch<UserListQueryType, UserItemType>(originalParams, getUserListApi);

onMounted(() => {
  getRoleList();
  initDataListHandler();
});
</script>
<style lang="scss" scoped></style>
