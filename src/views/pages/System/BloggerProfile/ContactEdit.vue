<template>
  <div class="contact-edit p-4">
    <el-form
      :model="form"
      label-width="80px"
      label-position="left"
      class="max-w-500px"
    >
      <el-form-item label="联系电话">
        <el-input v-model="form.phone" placeholder="请输入联系电话" clearable>
          <template #prefix>
            <my-icon name="phone-telephone" size="16" />
          </template>
        </el-input>
      </el-form-item>

      <el-form-item label="微信号">
        <el-input v-model="form.wechat" placeholder="请输入微信号" clearable>
          <template #prefix>
            <my-icon name="chat" size="16" />
          </template>
        </el-input>
      </el-form-item>

      <el-form-item label="QQ号">
        <el-input v-model="form.qq" placeholder="请输入QQ号" clearable>
          <template #prefix>
            <my-icon name="qq" size="16" />
          </template>
        </el-input>
      </el-form-item>

      <el-form-item label="GitHub">
        <el-input
          v-model="form.github"
          placeholder="请输入GitHub主页URL"
          clearable
        >
          <template #prefix>
            <my-icon name="github-one" size="16" />
          </template>
        </el-input>
      </el-form-item>

      <el-form-item label="微博">
        <el-input
          v-model="form.weibo"
          placeholder="请输入微博主页URL"
          clearable
        >
          <template #prefix>
            <my-icon name="weibo" size="16" />
          </template>
        </el-input>
      </el-form-item>

      <el-form-item label="个人网站">
        <el-input v-model="form.site" placeholder="请输入个人网站URL" clearable>
          <template #prefix>
            <my-icon name="homepage" size="16" />
          </template>
        </el-input>
      </el-form-item>
    </el-form>

    <div class="mt-4">
      <el-button type="primary" @click="saveHandler"> 保存 </el-button>
    </div>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
  phone: string;
  wechat: string;
  qq: string;
  github: string;
  weibo: string;
  site: string;
}>();

const emit = defineEmits<{
  save: [];
}>();

const form = reactive({
  phone: '',
  wechat: '',
  qq: '',
  github: '',
  weibo: '',
  site: '',
});

watch(
  () => [
    props.phone,
    props.wechat,
    props.qq,
    props.github,
    props.weibo,
    props.site,
  ],
  ([phone, wechat, qq, github, weibo, site]) => {
    form.phone = phone || '';
    form.wechat = wechat || '';
    form.qq = qq || '';
    form.github = github || '';
    form.weibo = weibo || '';
    form.site = site || '';
  },
  { immediate: true }
);

const saveHandler = () => {
  emit('save');
};

defineExpose({
  getForm: () => ({ ...form }),
});
</script>
