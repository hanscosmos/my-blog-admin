<template>
  <div class="introduction-edit p-4 h-full">
    <div class="editor-wrapper h-[75vh] border border-gray-200 rounded">
      <AppMdEditor ref="mdEditorRef" @save="saveHandler" />
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
