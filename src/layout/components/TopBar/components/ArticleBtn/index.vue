<template>
  <div class="shortcut-icon flex items-center gap-4">
    <div
      title="发表文章"
      class="flex items-center wrapper-solid-item trigger-btn p-2 rounded-lg cursor-pointer"
      @click="gotoReleaseArticle"
    >
      <MyIcon name="pencil" color="#fff" :size="14"></MyIcon>
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
  transition: all 0.3s ease-in-out;

  &:hover {
    opacity: 0.7;
  }
}
</style>
