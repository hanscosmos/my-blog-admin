<template>
  <div class="my-empty-data wh-full xy-center">
    <el-empty :description="desc" :size="size"></el-empty>
  </div>
</template>
<script lang="ts" setup>
type PropsType = {
  desc?: string;
  size?: number;
};
withDefaults(defineProps<PropsType>(), {
  desc: '暂无数据',
  size: 150,
});
</script>
<style lang="scss" scoped></style>
