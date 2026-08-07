<template>
  <div class="p-5 pr-0 wh-full flex flex-col overflow-auto">
    <el-row class="!w-full" :gutter="20">
      <el-col :span="16">
        <div class="wrapper-filter-item h-200px mb-5">
          <HomeOverview></HomeOverview>
        </div>
        <el-card class="h-420px">
          <ArticlePublishStat></ArticlePublishStat>
        </el-card>
      </el-col>
      <el-col :span="8">
        <div class="h-200px flex mb-5">
          <div class="wrapper-solid-item flex-1 w-0 mr-5">
            <StatCard :type="StatEnum.Article"></StatCard>
          </div>
          <div class="wrapper-solid-item flex-1 w-0">
            <StatCard :type="StatEnum.User"></StatCard>
          </div>
        </div>
        <div class="h-200px flex mb-5">
          <div class="wrapper-solid-item flex-1 w-0 mr-5">
            <StatCard :type="StatEnum.ArticleDraft"></StatCard>
          </div>
          <div class="wrapper-solid-item flex-1 w-0">
            <StatCard :type="StatEnum.UserTask"></StatCard>
          </div>
        </div>
        <el-card class="h-200px"></el-card>
      </el-col>
    </el-row>
    <el-row :gutter="20" class="!w-full mt-5">
      <el-col :span="8">
        <el-card class="h-600px">
          <RecentUserTask></RecentUserTask>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="h-600px">
          <HotArticle></HotArticle>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="h-600px">
          <ActiveUser></ActiveUser>
        </el-card>
      </el-col>
    </el-row>
    <el-row :gutter="20" class="!w-full mt-5">
      <el-col :span="12">
        <el-card class="h-400px">
          <UserTaskScoreStat></UserTaskScoreStat>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="h-400px"> </el-card>
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
