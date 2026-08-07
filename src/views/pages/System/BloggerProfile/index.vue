<template>
  <div class="blogger-profile h-full flex flex-col">
    <el-tabs v-model="activeTab" class="flex-1">
      <el-tab-pane label="基本介绍" name="introduction">
        <IntroductionEdit
          ref="introductionRef"
          v-model="form.introduction"
          @save="saveIntroduction"
        />
      </el-tab-pane>

      <el-tab-pane label="联系方式" name="contact">
        <ContactEdit
          ref="contactRef"
          :phone="form.phone"
          :wechat="form.wechat"
          :qq="form.qq"
          :github="form.github"
          :weibo="form.weibo"
          :site="form.site"
          @save="saveContact"
        />
      </el-tab-pane>

      <el-tab-pane label="资产信息" name="assets">
        <AssetsEdit v-model="form.assets" @save="saveAssets" />
      </el-tab-pane>

      <el-tab-pane label="简历" name="resume">
        <ResumeEdit
          v-model:resume-file-url="form.resumeFileUrl"
          v-model:resume-file-name="form.resumeFileName"
          @save="saveResume"
        />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script lang="ts" setup>
import { getBloggerProfileApi, updateBloggerProfileApi } from '@/api/blogger';
import type { BloggerProfileFormType } from '@/api/blogger/type';
import IntroductionEdit from './IntroductionEdit.vue';
import ContactEdit from './ContactEdit.vue';
import AssetsEdit from './AssetsEdit.vue';
import ResumeEdit from './ResumeEdit.vue';

const activeTab = ref('introduction');
const contactRef = ref();

const form = ref<BloggerProfileFormType>({
  introduction: '',
  phone: '',
  wechat: '',
  qq: '',
  github: '',
  weibo: '',
  site: '',
  resumeFileUrl: '',
  resumeFileName: '',
  assets: { items: [] },
});

const getProfileHandler = async () => {
  try {
    const { data } = await getBloggerProfileApi();
    if (data) {
      form.value = {
        introduction: data.introduction || '',
        phone: data.phone || '',
        wechat: data.wechat || '',
        qq: data.qq || '',
        github: data.github || '',
        weibo: data.weibo || '',
        site: data.site || '',
        resumeFileUrl: data.resumeFileUrl || '',
        resumeFileName: data.resumeFileName || '',
        assets: data.assets || { items: [] },
      };
    }
  } catch {
    ElMessage.error('加载失败');
  }
};

const saveProfile = async () => {
  try {
    const res = await updateBloggerProfileApi(form.value);
    if (res.code === 0) {
      ElMessage.success('保存成功');
    }
  } catch {
    ElMessage.error('保存失败');
  }
};

const saveIntroduction = async () => {
  await saveProfile();
};

const saveContact = async () => {
  const contactForm = contactRef.value?.getForm();
  if (contactForm) {
    form.value.phone = contactForm.phone;
    form.value.wechat = contactForm.wechat;
    form.value.qq = contactForm.qq;
    form.value.github = contactForm.github;
    form.value.weibo = contactForm.weibo;
    form.value.site = contactForm.site;
  }
  await saveProfile();
};

const saveAssets = async () => {
  await saveProfile();
};

const saveResume = async () => {
  await saveProfile();
};

onMounted(() => {
  getProfileHandler();
});
</script>
