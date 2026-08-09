<template>
  <div class="my-md-editor w-full h-full">
    <v-md-editor
      ref="editorRef"
      v-model="text"
      height="100%"
      placeholder="请输入内容……"
      :disabled-menus="[]"
      :left-toolbar="toolbar || defaultToolBar"
      @save="saveHandler"
      @upload-image="uploadImageHandler"
    ></v-md-editor>
  </div>
</template>
<script lang="ts" setup>
defineProps<{
  toolbar?: string;
}>();
const emit = defineEmits(['save']);
const text = ref('');
const defaultToolBar =
  'undo redo clear | h bold italic strikethrough quote | ul ol table hr  | link image code | emoji tip todo-list  | save ';

const saveHandler = () => {
  emit('save');
};

const getText = () => {
  return text.value;
};

const editorRef = ref();

const setText = (content: string) => {
  text.value = content;
};

const insertAtCursor = (insertText: string) => {
  const textarea = editorRef.value?.$el?.querySelector('textarea') as HTMLTextAreaElement | null;
  if (textarea) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = text.value.substring(0, start);
    const after = text.value.substring(end);
    text.value = before + insertText + after;
    nextTick(() => {
      textarea.focus();
      const newCursorPos = start + insertText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    });
  } else {
    // fallback: 追加到末尾
    text.value += insertText;
  }
};

const uploadImageHandler = (
  _event: Event,
  insertImage: Function,
  files: File[]
) => {
  files.forEach(async (file) => {
    try {
      const url = await uploadFile(file, file.name, 'article');
      insertImage({
        url,
        desc: file.name,
      });
    } catch {
      ElMessage.error('上传文件失败');
    }
  });
};

defineExpose({ getText, setText, insertAtCursor });
</script>
<style lang="scss" scoped>
:deep(.v-md-textarea-editor textarea) {
  background-color: var(--sys-deep-wrapper-bg-color);
}
</style>
