<template>
  <div class="shortcut-icon flex items-center gap-4">
    <div title="发表文章" class="flex items-center wrapper-solid-item trigger-btn p-2 rounded-lg cursor-pointer"
      @click="gotoReleaseArticle">
      <AppIcon name="pencil" color="#fff" :size="14"></AppIcon>
    </div>
  </div>
</template>
<script lang="ts" setup>
const router = useRouter();
const gotoReleaseArticle = () => {
  router.push({
    name: 'ReleaseArticle',
  });
};
</script>
<style lang="scss" scoped>
.trigger-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  position: relative;

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
  }

  &:active {
    transform: scale(0.95);
  }

  &.is-open {
    background: var(--sys-text-secondary-color);
    transform: rotate(90deg);
  }
}
</style>
