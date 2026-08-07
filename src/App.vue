<script setup lang="ts">
import { useSystemStore } from './store/system';

const { initModeAndTheme } = useSystemStore();

onMounted(() => {
  initModeAndTheme();
});
</script>

<template>
  <div class="app">
    <router-view v-slot="{ Component }">
      <transition>
        <component :is="Component" />
      </transition>
    </router-view>
    <SysSettings></SysSettings>
  </div>
</template>

<style lang="scss" scoped>
.app {
  color: var(--sys-text-color);
  width: 100vw;
  height: 100vh;
}

/* transition.css */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
