<template>
  <div class="p-6 pr-0 wh-full flex flex-col overflow-auto">
    <el-row class="!w-full" :gutter="24">
      <el-col :span="16">
        <div class="section-wrapper h-200px">
          <HomeOverview></HomeOverview>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="section-wrapper h-200px flex flex-col !p-0 overflow-hidden">
          <div class="h-88px flex-shrink-0">
            <WeatherPanel></WeatherPanel>
          </div>
          <div
            class="h-px flex-shrink-0"
            style="background-color: var(--sys-border-color)"
          ></div>
          <div class="flex-1 min-h-0">
            <HardwarePanel></HardwarePanel>
          </div>
        </div>
      </el-col>
    </el-row>
    <el-row :gutter="24" class="!w-full mt-6">
      <el-col :span="24">
        <StatKPIBar></StatKPIBar>
      </el-col>
    </el-row>
    <el-row :gutter="24" class="!w-full mt-6">
      <el-col :span="24">
        <div class="h-424px section-wrapper">
          <ArticlePublishStat></ArticlePublishStat>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="24" class="!w-full mt-6">
      <el-col :span="12">
        <div class="h-600px section-wrapper">
          <RecentUserTask></RecentUserTask>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="h-600px section-wrapper">
          <HotArticle></HotArticle>
        </div>
      </el-col>
      <!-- <el-col :span="8">
        <div class="h-600px section-wrapper">
          <ActiveUser></ActiveUser>
        </div>
      </el-col> -->
    </el-row>
    <el-row :gutter="24" class="!w-full mt-6">
      <el-col :span="24">
        <div class="h-400px section-wrapper">
          <UserTaskScoreStat></UserTaskScoreStat>
        </div>
      </el-col>
    </el-row>
  </div>
</template>
<script setup lang="ts">
import RecentUserTask from './components/RecentUserTask.vue';
import HomeOverview from './components/HomeOverview.vue';
import StatKPIBar from './components/StatKPIBar.vue';
import UserTaskScoreStat from './components/UserTaskScoreStat.vue';
import ArticlePublishStat from './components/ArticlePublishStat.vue';
import HotArticle from './components/HotArticle.vue';
import WeatherPanel from './components/WeatherPanel.vue';
import HardwarePanel from './components/HardwarePanel.vue';
</script>
<style lang="scss" scoped></style>
