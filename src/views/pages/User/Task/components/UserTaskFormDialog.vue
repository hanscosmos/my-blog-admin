<template>
  <AppDialog :visible="visible" width="800px" :title="optType === 'add' ? '创建个人事项' : '修改个人事项'" @close="closeHandler"
    @confirm="confirmHandler">
    <el-form ref="formRef" :model="form" :rules="formRules" label-width="96px" :style="{ width: '100%' }">
      <div class="font-title text-base pl-2 mb-4">基础信息</div>
      <el-form-item prop="title" label="事项标题">
        <el-input v-model="form.title" placeholder="请输入事项标题" />
      </el-form-item>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item prop="priority" label="事项优先级">
            <el-select v-model="form.priority" placeholder="请选择事项优先级">
              <el-option v-for="item in priorityList" :key="item.key" :label="item.value" :value="item.key"></el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item prop="status" label="事项状态">
            <el-select v-model="form.status" placeholder="请选择事项状态">
              <el-option v-for="item in statusList" :key="item.key" :label="item.value" :value="item.key"></el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item prop="tags" label="事项标签">
            <el-select v-model="form.tags" multiple filterable allow-create default-first-option
              :reserve-keyword="false" placeholder="请输入事项标签">
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item prop="deadline" label="截至时间">
            <div class="w-full flex items-center gap-2">
              <el-date-picker v-model="form.deadline" format="YYYY-MM-DD HH:mm:ss" value-format="YYYY-MM-DD HH:mm:ss"
                type="datetime" class="flex-1 min-w-0" @change="deadlineCHangeHandler"></el-date-picker>
              <el-button size="small" link type="primary" @click="setDeadlineQuick(0)">今天</el-button>
              <el-button size="small" link type="primary" @click="setDeadlineQuick(1)">明天</el-button>
            </div>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item prop="remindBeforeMinutes" label="事项提醒">
            <el-select v-model="form.remindBeforeMinutes" placeholder="请选择提醒方式" class="!w-full">
              <el-option v-for="item in remindOptions" :key="item.key" :label="item.value"
                :value="item.key"></el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item prop="startTime" label="开始时间">
            <el-date-picker v-model="form.startTime" format="YYYY-MM-DD HH:mm:ss" value-format="YYYY-MM-DD HH:mm:ss"
              type="datetime" class="!w-full"></el-date-picker>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item prop="endTime" label="结束时间">
            <el-date-picker v-model="form.endTime" format="YYYY-MM-DD HH:mm:ss" value-format="YYYY-MM-DD HH:mm:ss"
              type="datetime" class="!w-full"></el-date-picker>
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item prop="description" label="描述">
        <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入个人事项描述" />
      </el-form-item>
      <div class="font-title text-base">重要程度评分（可选，默认均分）</div>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item prop="importance" label="重要性">
            <el-rate v-model="form.importance" :max="5" :colors="['#99A9BF', '#F7BA2A', '#FF9900']" clearable></el-rate>
            <span class="ml-4">权重：70%</span>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item prop="urgency" label="紧急性">
            <el-rate v-model="form.urgency" :max="5" :colors="['#99A9BF', '#F7BA2A', '#FF9900']" clearable></el-rate>
            <span class="ml-4">权重：30%</span>
          </el-form-item>
        </el-col>
      </el-row>
      <div class="font-title text-base pl-2 mb-4">影响程度评分（可选，默认均分）</div>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item prop="growth" label="个人成长">
            <el-rate v-model="form.growth" :max="5" :colors="['#99A9BF', '#F7BA2A', '#FF9900']" clearable></el-rate>
            <span class="ml-4">权重：70%(正面)</span>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item prop="happiness" label="快乐指数">
            <el-rate v-model="form.happiness" :max="5" :colors="['#99A9BF', '#F7BA2A', '#FF9900']" clearable></el-rate>
            <span class="ml-4">权重：30%(正面)</span>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item prop="negative" label="负面指数">
            <el-rate v-model="form.negative" :max="5" :colors="['#99A9BF', '#F7BA2A', '#FF9900']" clearable></el-rate>
            <span class="ml-4">权重：100%（负面）</span>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
  </AppDialog>
</template>
<script setup lang="ts">
import { ElMessage } from 'element-plus';
import dayjs from 'dayjs';
import { FormDialogPropsType, formRules, originalForm, remindOptions } from '../service';
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

const setDeadlineQuick = (offsetDays: number) => {
  form.value.deadline = dayjs()
    .add(offsetDays, 'day')
    .endOf('day')
    .format('YYYY-MM-DD HH:mm:ss');
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

<style scoped lang="scss">
.score-collapse {
  border: none;

  :deep(.el-collapse-item__header) {
    border-bottom: none;
    background: transparent;
  }

  :deep(.el-collapse-item__wrap) {
    border-bottom: none;
  }
}
</style>
