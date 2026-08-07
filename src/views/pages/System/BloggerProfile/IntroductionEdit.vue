<template>
  <div class="introduction-edit p-4">
    <div class="editor-wrapper h-400px border border-gray-200 rounded">
      <MyMdEditor ref="mdEditorRef" @save="saveHandler" />
    </div>
    <div class="mt-4">
      <el-button @click="saveHandler"> 保存 </el-button>
    </div>
  </div>
</template>

<script lang="ts" setup>
const mdEditorRef = ref();

const props = defineProps<{
  modelValue: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
  save: [];
}>();

watch(
  () => props.modelValue,
  (val) => {
    if (mdEditorRef.value) {
      mdEditorRef.value.setText(val || '');
    }
  },
  { immediate: true }
);

const saveHandler = async () => {
  const content = mdEditorRef.value?.getText() || '';
  emit('update:modelValue', content);
  emit('save');
};
</script>
