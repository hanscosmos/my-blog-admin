<template>
  <div class="shortcut-icon flex items-center gap-4">
    <div class="flex items-center flex-col hover-text" @click="gotoReleaseArticle">
      <AppIcon name="pencil" :size="16"></AppIcon>
      <span class="text-xs mt-1">发表文章</span>
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
<style lang="scss" scoped></style>
