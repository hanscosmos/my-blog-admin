<template>
  <div class="">
    <el-drawer
      :model-value="visible"
      title="菜单管理"
      :size="490"
      :lock-scroll="false"
      :before-close="closeDrawerHandler"
    >
      <el-form
        label-width="100px"
        ref="formRef"
        :rules="menuFormRules"
        :model="menuForm"
      >
        <el-form-item prop="name" :label="isButton ? '权限名称' : '菜单名称'">
          <el-input v-model="menuForm.name"></el-input>
        </el-form-item>
        <el-form-item prop="code" :label="isButton ? '权限码' : '菜单码'">
          <el-input v-model="menuForm.code" :placeholder="isButton ? '如 article:delete' : ''"></el-input>
        </el-form-item>
        <el-form-item v-if="!isButton" prop="isNav" label="侧边栏">
          <el-switch v-model="menuForm.isNav" inline-prompt active-text="显示" inactive-text="隐藏" />
          <span class="ml-3 text-xs" style="color: var(--sys-text-secondary-color)">
            关闭后不下发到左侧导航，用于顶部导航栏入口、系统设置、个人中心这类全局页面
          </span>
        </el-form-item>
        <el-form-item v-if="!isButton" prop="route" label="菜单路由">
          <el-input v-model="menuForm.route" :placeholder="routePlaceholder"></el-input>
        </el-form-item>
        <el-form-item prop="father" label="父菜单">
          <el-input v-model="fatherName" disabled></el-input>
        </el-form-item>
        <el-form-item prop="type" label="菜单类型">
          <el-radio-group v-model="menuForm.type" disabled>
            <el-radio
              v-for="item in MENU_TYPE_OPTIONS"
              :key="item.key"
              :value="item.key"
            >
              {{ item.value }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="!isButton" prop="color" label="菜单颜色">
          <el-select v-model="menuForm.color" clearable>
            <el-option
              v-for="item in menuColorList"
              :key="item.key"
              :label="item.value"
              :value="item.key"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item prop="sort" label="菜单排序">
          <el-input-number
            v-model="menuForm.sort"
            class="!w-full"
            :min="0"
          ></el-input-number>
        </el-form-item>
        <el-form-item v-if="!isButton" prop="color" label="菜单图标">
          <SelectIcon @confirm="selectIconHandler"></SelectIcon>
        </el-form-item>
      </el-form>
      <div class="flex justify-end mt-4">
        <el-button @click="closeDrawerHandler">取消</el-button>
        <el-button type="primary" @click="submitFormHandler">确定</el-button>
      </div>
    </el-drawer>
  </div>
</template>
<script lang="ts" setup>
import { addMenuApi, editMenuApi } from '@/api/authority/menu';
import { MenuFormType } from '@/api/authority/menu/type';
import { ElMessage } from 'element-plus';
import { DrawerPropsType, MENU_TYPE_OPTIONS } from '../service';
import { IconItemType } from '@/api/resource/icon/type';
import { useDict } from '@/hooks/useDict';

const props = defineProps<DrawerPropsType>();
const emits = defineEmits(['addSuccess', 'close']);

const { dictDataList: menuColorList, getDictDataList: getMenuColorList } =
  useDict('MENU_COLOR');

const formRef = ref();
const visible = ref(false);
const originalForm: MenuFormType = {
  name: '',
  route: '',
  icon: '',
  color: '',
  code: '',
  type: '1',
  sort: 0,
  father: null,
  isNav: true,
};

const menuForm = ref<MenuFormType>({
  ...originalForm,
});
const fatherName = ref('');

/** 操作权限节点不需要前端路由 */
const isButton = computed(() => menuForm.value.type === '3');

/**
 * 不上侧边栏的页面节点（顶部导航栏入口、系统设置、个人中心等）没有独立路由，
 * 它们的可见性靠 code 表达，因此路由留空是合法的。
 */
const isGlobalPage = computed(
  () => menuForm.value.type === '2' && !menuForm.value.isNav
);

const routePlaceholder = computed(() =>
  isGlobalPage.value
    ? '可留空：非路由页面用 code 做权限判断'
    : '前端路由的 name，如 ArticleList'
);

const menuFormRules = computed(() => ({
  name: [{ required: true, message: '菜单名称不能为空', trigger: 'blur' }],
  code: [{ required: true, message: '菜单码不能为空', trigger: 'blur' }],
  route:
    isButton.value || isGlobalPage.value
      ? []
      : [{ required: true, message: '菜单路由不能为空', trigger: 'blur' }],
  type: [{ required: true, message: '菜单类型不能为空', trigger: 'change' }],
}));
const openDrawerHandler = () => {
  visible.value = true;
};
const closeDrawerHandler = () => {
  menuForm.value = { ...originalForm };
  fatherName.value = '';
  visible.value = false;
  emits('close');
};

const selectIconHandler = (item: IconItemType | null) => {
  item && (menuForm.value.icon = item.url);
};

const submitFormHandler = async () => {
  formRef.value.validate(async (valid: boolean) => {
    if (!valid) return;
    const formData: MenuFormType = {
      ...menuForm.value,
      // 操作权限节点不参与侧边栏渲染与路由跳转
      route: isButton.value ? '' : menuForm.value.route,
    };
    let res: ResType<any> | null;
    if (props.optType === 'add') {
      res = await addMenuApi(formData);
    } else {
      res = await editMenuApi({
        id: props.currentMenuItem?.id as string,
        ...formData,
      });
    }

    if (res.code === 0) {
      closeDrawerHandler();
      ElMessage.success(res.msg);
      emits('addSuccess');
    }
  });
};

watch([() => props.optType, () => visible.value], () => {
  if (props.optType === 'add' && visible.value) {
    menuForm.value.father = props.fatherMenuItem.id;
    fatherName.value = props.fatherMenuItem.name;
    menuForm.value.type = (
      parseFloat(props.fatherMenuItem.type) + 1
    ).toString();
    // 子节点默认跟随父节点的侧边栏可见性，避免在「全局」下新建页面时误挂到侧边栏
    menuForm.value.isNav = props.fatherMenuItem.isNav;
  }
  if (props.optType === 'edit' && props.currentMenuItem && visible.value) {
    fatherName.value = props.fatherMenuItem.name;
    const { name, route, color, code, sort, type, father, icon, isNav } =
      props.currentMenuItem;
    menuForm.value = { name, route, color, code, sort, type, father, icon, isNav };
  }
});

onMounted(async () => {
  await getMenuColorList();
});

defineExpose({
  openDrawerHandler,
});
</script>
<style lang="scss" scoped></style>
