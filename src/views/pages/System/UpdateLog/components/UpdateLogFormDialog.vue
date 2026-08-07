<template>
  <MyDialog
    :visible="visible"
    width="1000px"
    :title="titleMap.get(optType) as string"
    :hide-footer="optType === 'view'"
    @close="closeHandler"
    @confirm="confirmHandler"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="formRules"
      label-width="120px"
      :style="{ width: '100%' }"
      :disabled="optType === 'view'"
      inline
    >
      <el-row :gutter="32">
        <el-col :span="12">
          <el-form-item prop="summary" label="日志概要" class="w-full">
            <el-input v-model="form.summary" placeholder="请输入日志概要" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item prop="version" label="更新版本" class="w-full">
            <el-input v-model="form.version" placeholder="请输入更新版本" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item prop="status" label="日志状态" class="w-full">
            <el-select v-model="form.status" clearable>
              <el-option
                v-for="item in statusList"
                :key="item.key"
                :value="item.key"
                :label="item.value"
              >
              </el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item prop="releasedType" label="日志类型" class="w-full">
            <el-select v-model="form.releasedType" clearable>
              <el-option
                v-for="item in releasedTypeList"
                :key="item.key"
                :value="item.key"
                :label="item.value"
              >
              </el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item
            prop="plannedReleaseDate"
            label="计划发布时间"
            class="w-full"
          >
            <el-date-picker
              v-model="form.plannedReleaseDate"
              type="date"
              placeholder="选择日期"
              value-format="YYYY-MM-DD HH:mm:ss"
              class="!w-full"
            ></el-date-picker>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item
            prop="actualReleaseDate"
            label="实际发布时间"
            class="w-full"
          >
            <el-date-picker
              v-model="form.actualReleaseDate"
              type="date"
              placeholder="选择日期"
              value-format="YYYY-MM-DD HH:mm:ss"
              class="!w-full"
            ></el-date-picker>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item prop="visible" label="是否当前版本">
            <el-radio-group v-model="form.isCurrentVersion" class="w-full">
              <el-radio :value="true"> 是 </el-radio>
              <el-radio :value="false"> 否 </el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item prop="details" label="更新详情" class="w-full">
            <v-md-preview
              v-if="optType === 'view'"
              :text="form.details"
              class="!h-300px"
            ></v-md-preview>
            <my-md-editor
              v-else
              toolbar="undo clear | h bold italic | ul ol table hr  | link image | emoji tip todo-list"
              ref="mdEditorRef"
              class="!h-300px"
            ></my-md-editor>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
  </MyDialog>
</template>
<script setup lang="ts">
import { addUpdateLogApi, editUpdateLogApi } from '@/api/system/updateLog';
import { ElMessage } from 'element-plus';
import { FormDialogPropsType, formRules, originalForm } from '../service';
import { UpdateLogItemType } from '@/api/system/updateLog/type.ts';

const props = defineProps<FormDialogPropsType>();
const emits = defineEmits(['close', 'changeSuccess']);

const titleMap = new Map([
  ['add', '创建日志'],
  ['edit', '修改日志'],
  ['view', '查看日志'],
]);

const mdEditorRef = ref();
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
        form.value.details = (mdEditorRef.value as any).getText();
        const { data, msg } =
          props.optType === 'add'
            ? await addUpdateLogApi(form.value)
            : await editUpdateLogApi({
                id: (props.row as UpdateLogItemType).id,
                ...form.value,
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
  if (props.optType !== 'add' && props.row) {
    const {
      summary,
      version,
      plannedReleaseDate,
      actualReleaseDate,
      details,
      releasedType,
      status,
      isCurrentVersion,
    } = props.row;
    form.value = {
      summary,
      version,
      plannedReleaseDate,
      actualReleaseDate,
      details,
      releasedType,
      status,
      isCurrentVersion,
    };
  }
});

watch(
  () => mdEditorRef.value,
  (val) => {
    if (val && props.optType === 'edit') {
      (mdEditorRef.value as any).setText(form.value.details);
    }
  }
);
</script>

<style scoped lang="scss">
:deep(.vuepress-markdown-body) {
  padding: 4px 8px !important;
}
</style>
