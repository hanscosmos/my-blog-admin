<template>
  <div class="side-bar w-full h-full flex flex-col">
    <div
      class="flex-1 h-0 overflow-auto pb-16"
      :class="{ 'is-collapse': !isSideExpand }"
    >
      <el-menu :collapse="!isSideExpand">
        <div v-for="item in menuTreeList" :key="item.id">
          <template v-if="item.type === '1'">
            <el-sub-menu :index="item.route" :key="item.id">
              <template #title>
                <img v-if="item.icon" :src="item.icon" class="ml-1 icon-item" />
                <span ml="5">{{ item.name }}</span>
              </template>

              <el-menu-item
                v-for="subItem in item.children"
                :key="subItem.id"
                :class="{ 'weak-active-item': subItem.route === route.name }"
                @click="gotoRelatedPage(subItem)"
              >
                <template #title>
                  <img
                    v-if="subItem.icon"
                    :src="subItem.icon"
                    class="ml-1 icon-item"
                  />
                  <span ml="4">{{ subItem.name }}</span>
                </template>
              </el-menu-item>
            </el-sub-menu>
          </template>
          <template v-else>
            <el-menu-item @click="gotoRelatedPage(item)">
              <img v-if="item.icon" :src="item.icon" class="ml-1 icon-item" />
              <template #title>
                <span ml="4">{{ item.name }}</span>
              </template>
            </el-menu-item>
          </template>
        </div>
      </el-menu>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useSystemStore } from '@/store/system';
import { storeToRefs } from 'pinia';
import { ElMessage } from 'element-plus';
import { useMenuStore } from '@/store/menu';
import { MenuItemType } from '@/api/authority/menu/type';

const { isSideExpand } = storeToRefs(useSystemStore());
const { menuTreeList } = storeToRefs(useMenuStore());

const router = useRouter();
const route = useRoute();
const gotoRelatedPage = (item: MenuItemType) => {
  try {
    if (item.route) {
      router.push({ name: item.route });
    }
  } catch (err) {
    return ElMessage.warning('该路由尚未添加');
  }
};
</script>
<style lang="scss" scoped>
.side-bar {
  border-right: solid 1px var(--sys-border-color);
  overflow: hidden;
  background-color: var(--sys-box-bg-color);
}
:deep(.el-menu) {
  border-right: none !important;
}
.is-collapse {
  :deep(.el-sub-menu__icon-arrow) {
    display: none;
  }
}
.icon-item {
  width: 20px;
  height: 20px;
}
</style>
