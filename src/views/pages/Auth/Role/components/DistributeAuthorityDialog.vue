<template>
  <div>
    <AppDialog :visible="dialogVisible" :title="`权限分配-${currentRow.name}`" width="650px" @confirm="confirmHandle"
      @close="closeHandle">
      <div class="mb-2 text-sm leading-6" style="color: var(--sys-text-secondary-color)">
        「查看」= 该角色能在侧边栏看到并进入此页面；其下的「操作」= 页面内可执行的具体动作。
        两者互不影响：只给查看权限时，只勾「查看」即可，无需再处理它下面的操作。
        未勾选「查看」的页面不会出现在侧边栏；勾选「操作」会自动补上它所属的查看与目录。
        <br />
        「全局」= 不上侧边栏的入口（顶部导航栏、系统设置、个人中心），勾上该角色才看得见这些入口。
      </div>
      <div class="flex justify-end gap-4 mb-1">
        <el-button link type="primary" @click="checkAllHandler">全选</el-button>
        <el-button link type="danger" @click="clearAllHandler">清空</el-button>
      </div>
      <div v-loading="treeLoading" class="h-96 overflow-auto">
        <el-tree ref="menuTreeRef" node-key="id" :check-strictly="true" :data="menuTreeList" :props="treeProps"
          show-checkbox default-expand-all @check="onCheck">
          <template #default="{ data }">
            <span class="flex items-center">
              <span>{{ data.name }}</span>
              <AppTag class="ml-2" size="small" v-bind="getNodeTag(data)" />
            </span>
          </template>
        </el-tree>
      </div>
    </AppDialog>
  </div>
</template>

<script lang="ts" setup>
import { getAllMenuTreeApi } from '@/api/authority/menu';
import { getMenuListByRoleIdApi, setRoleMenuApi } from '@/api/authority/role';
import { ElMessage } from 'element-plus';
import type { MenuItemType } from '@/api/authority/menu/type';
import type { RoleItemType } from '@/api/authority/role/type';

const treeProps = {
  label: 'name',
  children: 'children',
};

/**
 * 节点类型 → 权限语义标签
 * 目录只是容器；页面节点按是否上侧边栏分「查看」与「全局」；
 * 按钮是页面内的具体操作。
 */
const getNodeTag = (data: MenuItemType) => {
  if (data.type === '1') return { name: '目录', color: '#999' };
  if (data.type === '3') return { name: '操作', color: '#e6a23c' };
  return data.isNav
    ? { name: '查看', color: '' }
    : { name: '全局', color: '#409eff' };
};

const props = defineProps<{
  currentRow: RoleItemType;
  dialogVisible: boolean;
}>();

const emits = defineEmits(['closeDialog']);

const menuTreeRef = ref();
const menuTreeList = ref<MenuItemType[]>([]);
const treeLoading = ref(false);
const submitting = ref(false);

const closeHandle = () => {
  emits('closeDialog');
};

/** id → 节点，用于勾选时补祖先、取消时清子孙 */
const nodeMap = new Map<string, MenuItemType>();

const buildNodeMap = (list: MenuItemType[]) => {
  list.forEach((item) => {
    nodeMap.set(item.id, item);
    if (item.children?.length) buildNodeMap(item.children);
  });
};

const getMenuTreeList = async () => {
  try {
    treeLoading.value = true;
    nodeMap.clear();
    menuTreeList.value = (await getAllMenuTreeApi()).data;
    buildNodeMap(menuTreeList.value);
  } catch {
    menuTreeList.value = [];
  } finally {
    treeLoading.value = false;
  }
};

/** 取节点的祖先 id 链 */
const getAncestorIds = (id: string) => {
  const result: string[] = [];
  let father = nodeMap.get(id)?.father;
  while (father) {
    result.push(father);
    father = nodeMap.get(father)?.father;
  }
  return result;
};

/** 勾选节点时把祖先一并勾上，否则侧边栏树会因为父级缺失而挂不上 */
const checkAncestors = (id: string) => {
  getAncestorIds(id).forEach((ancestorId) => {
    menuTreeRef.value?.setChecked(ancestorId, true, false);
  });
};

/** 取消勾选节点时把子孙一并取消：看不见的页面，其操作权限没有意义 */
const clearDescendants = (node: MenuItemType) => {
  (node.children || []).forEach((child) => {
    menuTreeRef.value?.setChecked(child.id, false, false);
    clearDescendants(child);
  });
};

/**
 * 树关闭了父子联动（check-strictly），勾选状态即最终授权状态，节点之间不会互相推导。
 *
 * 这一点是必须的：开启联动时 el-tree 会用子节点的状态反推父节点
 * （node.mjs 的 reInitChecked：子节点全部未勾选会把父节点置为未勾选），
 * 于是「取消最后一个操作」必然连带取消「查看」，导致「仅查看」的权限配不出来。
 * 关掉联动后，「查看」只由页面/目录节点自身的勾选决定。
 *
 * 联动没了就得自己补两条规则，否则会出现语义自相矛盾的状态。
 */
const onCheck = (data: MenuItemType, info: { checkedKeys: (string | number)[] }) => {
  if (info.checkedKeys.includes(data.id)) {
    checkAncestors(data.id);
  } else {
    clearDescendants(data);
  }
};

const collectAllIds = (list: MenuItemType[], result: string[] = []) => {
  list.forEach((item) => {
    result.push(item.id);
    if (item.children?.length) collectAllIds(item.children, result);
  });
  return result;
};

const checkAllHandler = () => {
  menuTreeRef.value?.setCheckedKeys(collectAllIds(menuTreeList.value));
};

const clearAllHandler = () => {
  menuTreeRef.value?.setCheckedKeys([]);
};

/** 回显时补齐祖先：历史数据可能存在「只授权了按钮、没授权其页面」的记录 */
const withAncestors = (ids: string[]) => {
  const result = new Set(ids);
  ids.forEach((id) => {
    getAncestorIds(id).forEach((ancestorId) => result.add(ancestorId));
  });
  return [...result];
};

const getMenuIdsList = async () => {
  // 菜单树数据变更后要等 el-tree 渲染完，否则勾选状态会设在旧的节点实例上
  await nextTick();
  try {
    const { data } = await getMenuListByRoleIdApi({ id: props.currentRow.id });
    menuTreeRef.value?.setCheckedKeys(withAncestors(data.menuIds || []));
  } catch {
    menuTreeRef.value?.setCheckedKeys([]);
  }
};

const setRoleAuthHandle = async () => {
  if (submitting.value) return;
  submitting.value = true;
  try {
    // check-strictly 下不存在半选状态，勾选集合就是该角色的完整授权集合
    const { data, msg } = await setRoleMenuApi({
      roleId: props.currentRow.id,
      menuIds: menuTreeRef.value.getCheckedKeys(),
    });
    if (data) {
      ElMessage.success(msg);
      emits('closeDialog');
    }
  } finally {
    submitting.value = false;
  }
};

const confirmHandle = () => {
  setRoleAuthHandle();
};

const initDialog = async () => {
  await getMenuTreeList();
  await getMenuIdsList();
};

watch(
  () => props.dialogVisible,
  (val: boolean) => {
    if (val) initDialog();
  },
  { immediate: true }
);
</script>

<style lang="scss" scoped></style>
