<template>
  <div class="system-settings">
    <div
      class="trigger-btn wrapper-solid-item xy-center rounded-full w-12 h-12"
      @click="openDrawer"
    >
      <MyIcon name="setting-one" color="#fff" :size="20"></MyIcon>
    </div>
    <el-drawer v-model="visible" :size="400" title="系统设置">
      <div>
        <div class="settings-store setting-item mb-4">
          <div class="settings-title mb-4 font-title">系统缓存</div>
          <div class="setting-content font-beauty">
            <el-switch
              v-model="isOpenStore"
              inline-prompt
              size="large"
              active-text="开启"
              inactive-text="关闭"
            />
          </div>
        </div>
        <div class="settings-mode setting-item mb-4">
          <div class="settings-title mb-4 font-title">系统模式</div>
          <div class="setting-content font-beauty">
            <ul class="settings-mode-list flex gap-4">
              <li
                v-for="item in modeList"
                class="wrapper-item hover-wrapper text-sm xy-center flex-1 p-4"
                :class="{ 'active-item': mode === item.value }"
                :key="item.value"
                @click="changeMode(item.value as SysModeType)"
              >
                <div class="settings-item-text">{{ item.label }}</div>
              </li>
            </ul>
          </div>
        </div>

        <div class="settings-theme">
          <div class="settings-title font-title text-xl mb-4">系统主题</div>
          <div class="setting-content font-beauty">
            <ul class="settings-theme-list flex gap-4">
              <li
                v-for="item in themeList"
                class="wrapper-item hover-wrapper xy-center p-4 text-sm"
                :class="{ 'active-item': theme === item.value }"
                :key="item.value"
                @click="changeTheme(item.value as SysThemeType)"
              >
                <div class="settings-item-text">{{ item.label }}</div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>
<script lang="ts" setup>
import { useSystemStore } from '@/store/system';
import { storeToRefs } from 'pinia';
import type { SysModeType, SysThemeType } from '@/store/system/type';

const visible = ref(false);
const { mode, theme, isOpenStore } = storeToRefs(useSystemStore());
const { initModeAndTheme, changeMode, changeTheme } = useSystemStore();
const modeList: DictType[] = [
  { label: '浅色', value: 'light' },
  { label: '深色', value: 'dark' },
];

const themeList: DictType[] = [
  { label: '蓝色', value: 'blue' },
  { label: '绿色', value: 'green' },
  { label: '红色', value: 'red' },
  { label: '粉色', value: 'pink' },
  { label: '紫色', value: 'purple' },
];
const openDrawer = () => {
  visible.value = true;
};

onMounted(() => {
  initModeAndTheme();
});
</script>
<style lang="scss" scoped>
.system-settings {
  position: absolute;
  bottom: 1rem;
  left: 1rem;
  .trigger-btn {
    cursor: pointer;
    transition: all 0.3s ease-in-out;
    &:hover {
      opacity: 0.7;
    }
  }
}
.settings-title {
  font-size: 16px;
}
.settings-theme-list {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(3, 1fr);
}
</style>
