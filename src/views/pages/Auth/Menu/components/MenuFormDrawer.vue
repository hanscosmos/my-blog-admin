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
        <el-form-item prop="name" label="菜单名称">
          <el-input v-model="menuForm.name"></el-input>
        </el-form-item>
        <el-form-item prop="code" label="菜单码">
          <el-input v-model="menuForm.code"></el-input>
        </el-form-item>
        <el-form-item prop="route" label="菜单路由">
          <el-input v-model="menuForm.route"></el-input>
        </el-form-item>
        <el-form-item prop="father" label="父菜单">
          <el-input v-model="fatherName" disabled></el-input>
        </el-form-item>
        <el-form-item prop="type" label="菜单类型">
          <el-radio-group v-model="menuForm.type" disabled>
            <el-radio
              v-for="item in menuTypeList"
              :key="item.key"
              :value="item.key"
            >
              {{ item.value }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item prop="color" label="菜单颜色">
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
        <el-form-item prop="color" label="菜单图标">
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
import { DrawerPropsType } from '../service';
import { IconItemType } from '@/api/resource/icon/type';
import { useDict } from '@/hooks/useDict';

const props = defineProps<DrawerPropsType>();
const emits = defineEmits(['addSuccess', 'close']);

const { dictDataList: menuTypeList, getDictDataList: getMenuTypeList } =
  useDict('MENU_TYPE');
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
};

const menuForm = ref<MenuFormType>({
  ...originalForm,
});
const fatherName = ref('');

const menuFormRules = {
  name: [{ required: true, message: '菜单名称不能为空', trigger: 'blur' }],
  code: [{ required: true, message: '菜单码不能为空', trigger: 'blur' }],
  route: [{ required: true, message: '菜单路由不能为空', trigger: 'blur' }],
  type: [{ required: true, message: '菜单类型不能为空', trigger: 'change' }],
};
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
    let res: ResType<any> | null;
    if (props.optType === 'add') {
      res = await addMenuApi(menuForm.value);
    } else {
      res = await editMenuApi({
        id: props.currentMenuItem?.id as string,
        ...menuForm.value,
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
  }
  if (props.optType === 'edit' && props.currentMenuItem && visible.value) {
    fatherName.value = props.fatherMenuItem.name;
    const { name, route, color, code, sort, type, father, icon } =
      props.currentMenuItem;
    menuForm.value = { name, route, color, code, sort, type, father, icon };
  }
});

onMounted(async () => {
  await getMenuTypeList();
  await getMenuColorList();
});

defineExpose({
  openDrawerHandler,
});
</script>
<style lang="scss" scoped></style>
