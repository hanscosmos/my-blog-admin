<template>
  <MyDialog
    :visible="visible"
    width="800px"
    :title="optType === 'add' ? '创建个人事项' : '修改个人事项'"
    @close="closeHandler"
    @confirm="confirmHandler"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="formRules"
      label-width="96px"
      :style="{ width: '100%' }"
    >
      <div class="font-title text-xl pl-2 mb-4">基础信息</div>
      <el-form-item prop="title" label="事项标题">
        <el-input v-model="form.title" placeholder="请输入事项标题" />
      </el-form-item>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item prop="priority" label="事项优先级">
            <el-select v-model="form.priority" placeholder="请选择事项优先级">
              <el-option
                v-for="item in priorityList"
                :key="item.key"
                :label="item.value"
                :value="item.key"
              ></el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item prop="status" label="事项状态">
            <el-select v-model="form.status" placeholder="请选择事项状态">
              <el-option
                v-for="item in statusList"
                :key="item.key"
                :label="item.value"
                :value="item.key"
              ></el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item prop="tags" label="事项标签">
            <el-select
              v-model="form.tags"
              multiple
              filterable
              allow-create
              default-first-option
              :reserve-keyword="false"
              placeholder="请输入事项标签"
            >
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item prop="deadline" label="截至时间">
            <el-date-picker
              v-model="form.deadline"
              format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DD HH:mm:ss"
              type="datetime"
              class="!w-full"
              @change="deadlineCHangeHandler"
            ></el-date-picker>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item prop="startTime" label="开始时间">
            <el-date-picker
              v-model="form.startTime"
              format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DD HH:mm:ss"
              type="datetime"
              class="!w-full"
            ></el-date-picker>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item prop="endTime" label="结束时间">
            <el-date-picker
              v-model="form.endTime"
              format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DD HH:mm:ss"
              type="datetime"
              class="!w-full"
            ></el-date-picker>
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item prop="description" label="描述">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="3"
          placeholder="请输入个人事项描述"
        />
      </el-form-item>
      <div class="font-title text-xl pl-2 mb-4">任务评分</div>
      <el-form-item prop="importance" label="重要性">
        <el-rate
          v-model="form.importance"
          :max="5"
          :colors="['#99A9BF', '#F7BA2A', '#FF9900']"
          clearable
        ></el-rate>
        <span class="ml-4">权重：30%</span>
      </el-form-item>
      <el-form-item prop="urgency" label="紧急程度">
        <el-rate
          v-model="form.urgency"
          :max="5"
          :colors="['#99A9BF', '#F7BA2A', '#FF9900']"
          clearable
        ></el-rate>
        <span class="ml-4">权重：10%</span>
      </el-form-item>
      <el-form-item prop="growth" label="个人成长">
        <el-rate
          v-model="form.growth"
          :max="5"
          :colors="['#99A9BF', '#F7BA2A', '#FF9900']"
          clearable
        ></el-rate>
        <span class="ml-4">权重：40%</span>
      </el-form-item>
      <el-form-item prop="happiness" label="快乐指数">
        <el-rate
          v-model="form.happiness"
          :max="5"
          :colors="['#99A9BF', '#F7BA2A', '#FF9900']"
          clearable
        ></el-rate>
        <span class="ml-4">权重：20%</span>
      </el-form-item>
      <el-form-item prop="negative" label="负面指数">
        <el-rate
          v-model="form.negative"
          :max="5"
          :colors="['#99A9BF', '#F7BA2A', '#FF9900']"
          clearable
        ></el-rate>
        <span class="ml-4">权重：100%（记负分）</span>
      </el-form-item>
    </el-form>
  </MyDialog>
</template>
<script setup lang="ts">
import { ElMessage } from 'element-plus';
import { FormDialogPropsType, formRules, originalForm } from '../service';
import { addUserTaskApi, editUserTaskApi } from '@/api/user/task';
import { UserTaskItemType } from '@/api/user/task/type';
import { DictSimpleItemType } from '@/api/system/dict/type';

const props = defineProps<
  FormDialogPropsType & {
    statusList: DictSimpleItemType[];
    priorityList: DictSimpleItemType[];
  }
>();
const emits = defineEmits(['close', 'changeSuccess']);

const formRef = ref();
const form = ref({
  ...originalForm,
});

const closeHandler = () => {
  form.value = { ...originalForm };
  emits('close');
};

const deadlineCHangeHandler = () => {
  if (form.value.deadline && form.value.status === 'done') {
    form.value.endTime = form.value.deadline;
  }
};

const confirmHandler = () => {
  formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      if (form.value.status === 'done') {
        if (!form.value.startTime || !form.value.endTime) {
          return ElMessage.warning(
            '事项已完成必须选择事项开始时间和结束时间！'
          );
        }
      }
      try {
        const { data, msg } =
          props.optType === 'add'
            ? await addUserTaskApi({
                ...form.value,
                startTime: form.value.startTime || null,
                endTime: form.value.endTime || null,
              })
            : await editUserTaskApi({
                id: (props.row as UserTaskItemType).id,
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
  if (props.optType === 'edit' && props.row) {
    const { score, createTime, updateTime, ...rest } = props.row;
    form.value = { ...rest };
  }
});
</script>

<style scoped lang="scss"></style>
