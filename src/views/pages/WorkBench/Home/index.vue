<template>
  <div class="p-6 pr-0 wh-full flex flex-col overflow-auto">
    <el-row class="!w-full" :gutter="24">
      <el-col :span="24">
        <div class="wrapper-filter-item h-200px">
          <HomeOverview></HomeOverview>
        </div>
      </el-col>
      <!-- <el-col :span="9">
        <div class="h-240px flex">
          <div class="section-wrapper flex-1 w-0 mr-5">
            <StatCard :type="StatEnum.Article"></StatCard>
          </div>
          <div class="section-wrapper flex-1 w-0">
            <StatCard :type="StatEnum.User"></StatCard>
          </div>
        </div>
      </el-col> -->
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
import StatCard from './components/StatCard.vue';
import UserTaskScoreStat from './components/UserTaskScoreStat.vue';
import ArticlePublishStat from './components/ArticlePublishStat.vue';
import HotArticle from './components/HotArticle.vue';
import ActiveUser from './components/ActiveUser.vue';
import { StatEnum } from '@/types/sys/enum.ts';
</script>
<style lang="scss" scoped></style>
