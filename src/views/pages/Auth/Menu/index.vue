<template>
  <div class="menu-manage wh-full">
    <MySearchPanel :data-exist="menuTreeList.length > 0" :loading="loading">
      <template #header>
        <div class="flex">
          <my-button @click="addDrawerHandler()">
            <my-icon name="add" class="mr-2"></my-icon>
            新增菜单
          </my-button>
        </div>
      </template>
      <div class="p-4">
        <el-table
          :data="menuTreeList"
          style="width: 100%; margin-bottom: 20px"
          row-key="id"
          size="large"
          stripe
          border
          default-expand-all
        >
          <el-table-column prop="name" label="名称" align="center" />
          <el-table-column prop="route" label="路由名称" align="center" />
          <el-table-column prop="code" label="菜单码" align="center" />
          <el-table-column prop="sort" label="排序" align="center" />
          <el-table-column label="图标" align="center">
            <template #default="{ row }">
              <div v-if="row.icon" flex w-full class="justify-center">
                <img :src="row.icon" alt="" class="icon-item" />
              </div>
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
                <el-button link type="primary" @click="addDrawerHandler(row)">
                  新增子菜单
                </el-button>
                <el-button link type="primary" @click="editDrawerHandler(row)">
                  编辑
                </el-button>
                <el-button link type="danger" plain> 删除 </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </MySearchPanel>

    <MenuFormDrawer
      ref="drawerRef"
      :current-menu-item="drawerProps.currentMenuItem"
      :opt-type="drawerProps.optType"
      :father-menu-item="drawerProps.fatherMenuItem"
      @add-success="addSuccessHandler"
      @close="closeHandler"
    ></MenuFormDrawer>
  </div>
</template>
<script lang="ts" setup>
import { MenuItemType } from '@/api/authority/menu/type';
import MenuFormDrawer from './components/MenuFormDrawer.vue';
import { getAllMenuTreeApi } from '@/api/authority/menu';
import { DrawerPropsType } from './service';
import { useMenu } from '@/hooks/useMenu';

const { getNavMenuTreeList } = useMenu();
const loading = ref(false);
const drawerRef = ref();
const drawerProps = reactive<DrawerPropsType>({
  fatherMenuItem: {
    name: '',
    id: null,
    type: '0',
  },
  currentMenuItem: null,
  optType: 'add',
});
const addDrawerHandler = (row?: MenuItemType) => {
  if (row) {
    drawerProps.fatherMenuItem.id = row.id;
    drawerProps.fatherMenuItem.name = row.name || '';
    drawerProps.fatherMenuItem.type = row.type || '0';
  }
  drawerProps.optType = 'add';
  drawerRef.value.openDrawerHandler();
};

const editDrawerHandler = (row: MenuItemType) => {
  drawerProps.currentMenuItem = { ...row };
  drawerProps.fatherMenuItem.id = row.id;
  drawerProps.fatherMenuItem.name = row.fatherName || '';
  drawerProps.optType = 'edit';

  drawerRef.value.openDrawerHandler();
};

const closeHandler = () => {
  drawerProps.currentMenuItem = null;
  drawerProps.fatherMenuItem.name = '';
  drawerProps.fatherMenuItem.id = null;
  drawerProps.fatherMenuItem.type = '0';
};

const menuTreeList = ref<MenuItemType[]>([]);

const getMenuTreeListHandler = async () => {
  try {
    loading.value = true;
    const res = await getAllMenuTreeApi();
    menuTreeList.value = res.data;
  } catch {
    menuTreeList.value = [];
  } finally {
    loading.value = false;
  }
};

const addSuccessHandler = async () => {
  await getMenuTreeListHandler();
  await getNavMenuTreeList();
};

onMounted(() => {
  getMenuTreeListHandler();
});
</script>
<style lang="scss" scoped>
.icon-item {
  width: 20px;
  height: 20px;
}
</style>
