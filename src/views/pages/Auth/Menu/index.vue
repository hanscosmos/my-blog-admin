<template>
  <div class="menu-manage wh-full">
    <AppSearchPanel :data-exist="filteredMenuTreeList.length > 0" :loading="loading">
      <template #header>
        <div class="flex items-center">
          <el-input v-model="menuKeyword" class="!w-280px mr-4" placeholder="请输入关键词搜索" clearable></el-input>
          <app-button v-perm="'authority:menu:add'" @click="addDrawerHandler()">
            <AppIcon name="add" class="mr-2"></AppIcon>
            新增菜单
          </app-button>
        </div>
      </template>
      <div class="p-4">
        <el-table :data="filteredMenuTreeList" style="width: 100%; margin-bottom: 20px" row-key="id" size="large" stripe
          border default-expand-all>
          <el-table-column prop="name" label="名称" align="center" />
          <el-table-column prop="route" label="路由名称" align="center" />
          <el-table-column prop="code" label="菜单码 / 权限码" align="center" />
          <el-table-column label="类型" align="center" width="100">
            <template #default="{ row }">
              {{ getMenuTypeLabel(row.type) }}
            </template>
          </el-table-column>
          <el-table-column label="侧边栏" align="center" width="90">
            <template #default="{ row }">
              <span v-if="isButtonNode(row)">—</span>
              <AppTag v-else size="small" :name="row.isNav ? '显示' : '隐藏'"
                :color="row.isNav ? '' : '#999'" />
            </template>
          </el-table-column>
          <el-table-column prop="sort" label="排序" align="center" />
          <el-table-column label="图标" align="center">
            <template #default="{ row }">
              <div v-if="row.icon" flex w-full class="justify-center">
                <img :src="row.icon" alt="" class="icon-item" />
              </div>
            </template>
          </el-table-column>
          <el-table-column label="操作" fixed="right" width="250" align="center">
            <template #default="{ row }">
              <div flex w-full class="justify-center">
                <el-button v-perm="'authority:menu:add'" link type="primary" :disabled="isButtonNode(row)"
                  :title="isButtonNode(row) ? '操作权限节点下不能再添加子节点' : ''" @click="addDrawerHandler(row)">
                  新增子菜单
                </el-button>
                <el-button v-perm="'authority:menu:update'" link type="primary" @click="editDrawerHandler(row)">
                  编辑
                </el-button>
                <el-button v-perm="'authority:menu:delete'" link type="danger" :disabled="hasChildren(row)"
                  :title="hasChildren(row) ? '该菜单存在子菜单，请先删除子菜单' : ''" @click="deleteMenuHandler(row)">
                  删除
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </AppSearchPanel>

    <MenuFormDrawer ref="drawerRef" :current-menu-item="drawerProps.currentMenuItem" :opt-type="drawerProps.optType"
      :father-menu-item="drawerProps.fatherMenuItem" @add-success="addSuccessHandler" @close="closeHandler">
    </MenuFormDrawer>
  </div>
</template>
<script lang="ts" setup>
import { MenuItemType } from '@/api/authority/menu/type';
import MenuFormDrawer from './components/MenuFormDrawer.vue';
import { deleteMenuApi, getAllMenuTreeApi } from '@/api/authority/menu';
import { DrawerPropsType, filterMenuTree, getMenuTypeLabel } from './service';
import { useMenu } from '@/hooks/useMenu';

const { getNavMenuTreeList } = useMenu();
const loading = ref(false);
const drawerRef = ref();
const drawerProps = reactive<DrawerPropsType>({
  fatherMenuItem: {
    name: '',
    id: null,
    type: '0',
    isNav: true,
  },
  currentMenuItem: null,
  optType: 'add',
});
const addDrawerHandler = (row?: MenuItemType) => {
  if (row) {
    drawerProps.fatherMenuItem.id = row.id;
    drawerProps.fatherMenuItem.name = row.name || '';
    drawerProps.fatherMenuItem.type = row.type || '0';
    drawerProps.fatherMenuItem.isNav = row.isNav;
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
  drawerProps.fatherMenuItem.isNav = true;
};

const menuTreeList = ref<MenuItemType[]>([]);
/** 关键词筛选（前端过滤，接口一次性返回全部菜单） */
const menuKeyword = ref('');
const filteredMenuTreeList = computed(() =>
  filterMenuTree(menuTreeList.value, menuKeyword.value)
);

const hasChildren = (row: MenuItemType) => !!row.children?.length;

/** 操作权限节点（type='3'）为叶子，不再允许添加子节点 */
const isButtonNode = (row: MenuItemType) => row.type === '3';

const deleteMenuHandler = (row: MenuItemType) => {
  if (hasChildren(row)) {
    ElMessage.warning('该菜单存在子菜单，请先删除子菜单');
    return;
  }
  confirmHandler(`您将删除菜单「${row.name}」`, async () => {
    try {
      const { data, msg } = await deleteMenuApi({ ids: [row.id] });
      if (data) {
        ElMessage.success(msg);
        await getMenuTreeListHandler();
        await getNavMenuTreeList();
      }
    } catch (error) {
      console.log(error);
    }
  });
};

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
