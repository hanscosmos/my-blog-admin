<template>
  <div class="login-page xy-center h-full w-full">
    <div class="wrapper-item login-box rounded-xl flex">
      <div
        class="login-content flex-1"
        :style="{ background: `url(${loginBg}) 100% 100% no-repeat` }"
      >
        <div class="my-8 font-title text-2xl login-title">用户登录</div>
        <el-form
          ref="formRef"
          :model="loginForm"
          :rules="loginRules"
          layout="vertical"
          class="!w-2/3"
          @keyup.enter="loginHandler"
        >
          <el-form-item prop="username" class="!mb-6">
            <el-input
              v-model="loginForm.username"
              placeholder="请输入用户名..."
            />
          </el-form-item>
          <el-form-item field="password" class="!mb-6">
            <el-input
              v-model="loginForm.password"
              show-password
              placeholder="请输入密码..."
            />
          </el-form-item>
          <el-form-item field="code" class="!mb-6">
            <div class="flex w-full">
              <el-input
                v-model="loginForm.code"
                placeholder="请输入验证码..."
                class="flex-1"
              />
              <my-tag
                class="w-120px ml-4 xy-center font-beauty cursor-pointer"
                size="large"
                @click="getValidCode"
                >{{ currentCode }}
              </my-tag>
            </div>
          </el-form-item>
          <el-form-item>
            <my-button
              v-loading="loading"
              type="default"
              class="w-full"
              size="large"
              @click="loginHandler"
              >登&nbsp;录
            </my-button>
          </el-form-item>
        </el-form>
        <div class="flex items-center">
          游客账号
          <MyButton type="text">一键登录</MyButton>
        </div>
      </div>
      <div class="login-intro flex-1"></div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { MD5 } from 'crypto-js';
import { getValidCodeApi, loginApi } from '@/api';
import { useSystemStore } from '@/store/system';
import { useUserInfoStore } from '@/store/user';
import { nanoid } from 'nanoid';
import { storeToRefs } from 'pinia';
import { setCookie } from '@/utils/tool';
import { ElMessage } from 'element-plus';
import { useMenu } from '@/hooks/useMenu';

const router = useRouter();

const { theme } = storeToRefs(useSystemStore());
const { isLogin, userInfo, token, csrfToken } = storeToRefs(useUserInfoStore());
const { getNavMenuTreeList } = useMenu();

const loginBg = computed(() => {
  return getSvg('waves', theme.value + '.svg');
});

const loading = ref(false);
const currentKey = ref('');
const currentCode = ref('');

const initKey = () => {
  currentKey.value = nanoid();
};

const formRef = ref();
const loginForm = ref({
  username: '',
  password: '',
  code: '',
});

const loginRules = {
  username: [{ required: true, message: '用户名不得为空' }],
  password: [{ required: true, message: '密码不得为空' }],
  code: [{ required: true, message: '验证码不得为空' }],
};

const getValidCode = async () => {
  const { data } = await getValidCodeApi({
    key: currentKey.value,
  });
  currentCode.value = data;
};

const loginHandler = () => {
  formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      loading.value = true;
      const { username, password, code } = loginForm.value;
      const { code: isFailed, data } = await loginApi({
        username,
        password: MD5(password).toString(),
        key: currentKey.value,
        code,
      });
      if (isFailed === 0) {
        ElMessage.success('登录成功');
        isLogin.value = true;
        userInfo.value = { ...data.userInfo };
        csrfToken.value = data.csrfToken;
        setCookie('csrftoken', csrfToken.value);
        token.value = data.token;
        loading.value = false;
        await getNavMenuTreeList();
        router.push('/');
      } else {
        loading.value = false;
      }
    }
  });
};

onBeforeMount(() => {
  initKey();
  getValidCode();
});
</script>
<style lang="scss" scoped>
.login-box {
  width: 60vw;
  height: 60vh;
  background: var(--sys-box-bg-color);
  overflow: hidden;

  .login-title {
    letter-spacing: 6px;
  }

  .login-content {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    position: relative;
  }

  .login-intro {
    background-color: var(--theme-color);
  }
}
</style>
