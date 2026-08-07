<template>
  <div class="assets-edit p-4">
    <el-table :data="items" border class="max-w-600px">
      <el-table-column label="标签" width="200">
        <template #default="{ row }">
          <el-input v-model="row.label" placeholder="请输入标签名" clearable />
        </template>
      </el-table-column>
      <el-table-column label="值" min-width="200">
        <template #default="{ row }">
          <el-input v-model="row.value" placeholder="请输入值" clearable />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="80" align="center">
        <template #default="{ $index }">
          <el-button type="danger" link @click="removeItem($index)">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="mt-4 flex gap-4">
      <el-button @click="addItem">
        <my-icon name="plus" size="14" class="mr-1" />
        新增资产项
      </el-button>
      <el-button type="primary" @click="saveHandler"> 保存 </el-button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { AssetItem } from '@/api/blogger/type';

const props = defineProps<{
  modelValue: { items: AssetItem[] };
}>();

const emit = defineEmits<{
  'update:modelValue': [value: { items: AssetItem[] }];
  save: [];
}>();

const items = ref<AssetItem[]>([]);

watch(
  () => props.modelValue?.items,
  (val) => {
    items.value = val ? JSON.parse(JSON.stringify(val)) : [];
  },
  { immediate: true, deep: true }
);

const addItem = () => {
  items.value.push({ label: '', value: '' });
};

const removeItem = (index: number) => {
  items.value.splice(index, 1);
};

const saveHandler = () => {
  emit('update:modelValue', { items: [...items.value] });
  emit('save');
};
</script>
