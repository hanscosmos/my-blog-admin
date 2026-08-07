<template>
  <div>
    <MyDialog
      :visible="dialogVisible"
      :title="`权限分配-${currentRow.name}`"
      width="650px"
      @confirm="confirmHandle"
      @close="closeHandle"
    >
      <el-tabs v-model="activeTab">
        <el-tab-pane label="分配菜单权限" name="menu">
          <div class="h-64 overflow-auto">
            <el-tree
              ref="menuTreeRef"
              check-strictly
              node-key="id"
              :data="menuTreeList"
              :props="treeProps"
              show-checkbox
            />
          </div>
        </el-tab-pane>
        <el-tab-pane label="分配接口权限" name="api">
          <el-transfer
            v-model="selectedApiList"
            :props="transferProps"
            filterable
            :titles="['所有接口', '已选中接口']"
            filter-placeholder="输入关键词搜索"
            :left-default-checked="defaultSelectedApiList"
            :data="allApiList"
          />
        </el-tab-pane>
      </el-tabs>
    </MyDialog>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, watch, ref, Ref } from 'vue';
import { getAllMenuTreeApi } from '@/api/authority/menu';
import {
  setRoleMenuApi,
  getMenuListByRoleIdApi,
  setRoleInterfaceApi,
  getInterfaceListByRoleIdApi,
} from '@/api/authority/role';
import { ElMessage } from 'element-plus';
import { getInterfaceListApi } from '@/api/authority/interface';
import { MenuItemType } from '@/api/authority/menu/type';
import { RoleItemType } from '@/api/authority/role/type';
import { ApiItemType } from '@/api/authority/interface/type';

const treeProps = {
  label: 'name',
  children: 'children',
};

const transferProps = {
  key: 'id',
  label: 'name',
};

const props = defineProps<{
  currentRow: RoleItemType;
  dialogVisible: boolean;
}>();

const emits = defineEmits(['closeDialog', 'onSuccess']);

const activeTab = ref('menu');

const closeHandle = () => {
  emits('closeDialog');
};

const menuTreeRef = ref();
const menuIdsList = ref([]);
const menuTreeList: Ref<MenuItemType[]> = ref([]);
const getMenuTreeList = async () => {
  try {
    menuTreeList.value = (await getAllMenuTreeApi()).data;
  } catch {
    menuTreeList.value = [];
  }
};

const getMenuIdsList = async () => {
  try {
    menuIdsList.value = (
      (await getMenuListByRoleIdApi({ id: props.currentRow.id })) as any
    ).data.map((el: any) => el.menu);
    menuTreeRef.value.setCheckedKeys(menuIdsList.value);
  } catch {
    menuIdsList.value = [];
  }
};

const setRoleAuthHandle = () => {
  if (activeTab.value === 'menu') {
    const checkedMenus = menuTreeRef.value.getCheckedKeys();
    setRoleMenuApi({ roleId: props.currentRow.id, menuIds: checkedMenus }).then(
      (res: any) => {
        if (res.code === 0) {
          ElMessage.success(res.msg);

          emits('closeDialog');
        }
      }
    );
  } else {
    const checkedApis = selectedApiList.value;
    setRoleInterfaceApi({
      roleId: props.currentRow.id,
      apiIds: checkedApis,
    }).then((res: any) => {
      if (res.code === 0) {
        ElMessage.success(res.msg);
        selectedApiList.value = [];
        emits('closeDialog');
      }
    });
  }
};

const confirmHandle = () => {
  setRoleAuthHandle();
};

const [allApiList, defaultSelectedApiList, selectedApiList] = [
  ref<ApiItemType[]>([]),
  ref<any[]>([]),
  ref<any[]>([]),
];
const getAllInterfaceList = async (module: string) => {
  try {
    const {
      data: { result },
    } = await getInterfaceListApi({
      pageNumber: 1,
      pageSize: 999,
      param: { module },
    });
    allApiList.value = result;
  } catch {
    allApiList.value = [];
  }
};

const getHaveSelectedApiList = async () => {
  try {
    const { data } = (await getInterfaceListByRoleIdApi({
      id: props.currentRow.id,
    })) as any;
    defaultSelectedApiList.value = data.map((el: any) => el.id);
  } catch {
    defaultSelectedApiList.value = [];
  }
};

onMounted(() => {
  getMenuTreeList();
  getAllInterfaceList('');
});

watch(
  () => props.dialogVisible,
  (val: boolean) => {
    if (val) {
      getMenuIdsList();
      getHaveSelectedApiList();
    }
  },
  { deep: true, immediate: true }
);
</script>

<style lang="scss" scoped></style>
