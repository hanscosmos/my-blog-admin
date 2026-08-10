<template>
  <MyIcon
    :name="iconName"
    :size="20"
    class="hover-text"
    @click="toggleFoldHandler"
  ></MyIcon>
</template>
<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { useSystemStore } from '@/store/system';

const { isSideExpand } = storeToRefs(useSystemStore());
const iconName = computed(() => {
  return isSideExpand.value ? 'menu-fold' : 'menu-unfold';
});

const toggleFoldHandler = () => {
  isSideExpand.value = !isSideExpand.value;
};
</script>
<style lang="scss" scoped></style>
