<template>
  <span v-if="name">
    <component
      v-if="!color"
      :is="'icon-' + name"
      :theme="theme"
      :size="size"
      class="flex items-center"
    />
    <component
      v-else
      :is="'icon-' + name"
      :theme="theme"
      :size="size"
      :fill="color"
      class="flex items-center"
    />
  </span>
  <span v-else></span>
</template>
<script lang="ts" setup>
type PropsType = {
  name: string;
  theme?: string;
  size?: number | string;
  color?: string;
};

withDefaults(defineProps<PropsType>(), {
  theme: 'outline',
  size: 14,
  color: '',
});
</script>
<style lang="scss" scoped></style>
