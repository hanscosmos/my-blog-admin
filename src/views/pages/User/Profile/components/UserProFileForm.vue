<template>
  <div class="">
    <el-drawer
      :model-value="visible"
      :size="500"
      :lock-scroll="false"
      :before-close="closeDrawer"
      title="个人信息设置"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="80px"
      >
        <el-form-item label="头像">
          <div class="w-24 h-24 rounded-full">
            <MyImageAutoUpload
              type="avatar"
              desc="上传头像"
              editable
              :default-url="formData.avatar"
              @upload-success="uploadAvatarHandler"
            ></MyImageAutoUpload>
          </div>
        </el-form-item>
        <el-form-item label="昵称" prop="nickName">
          <el-input v-model="formData.nickName"></el-input>
        </el-form-item>
        <el-form-item label="性别" prop="sex">
          <el-select v-model="formData.sex" placeholder="请选择性别">
            <el-option label="男" value="1"></el-option>
            <el-option label="女" value="0"></el-option>
            <el-option label="保密" value="2"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="formData.email" clearable></el-input>
        </el-form-item>
        <el-form-item label="个性签名" prop="talks">
          <el-input
            v-model="formData.talks"
            type="textarea"
            :rows="4"
            clearable
          ></el-input>
        </el-form-item>
        <el-form-item label="背景封面">
          <div class="w-full h-48">
            <MyImageAutoUpload
              type="avatar"
              desc="上传背景封面"
              editable
              :default-url="formData.bgCover"
              @upload-success="uploadCoverHandler"
            ></MyImageAutoUpload>
          </div>
        </el-form-item>
      </el-form>
      <div class="flex justify-end mt-4">
        <my-button type="plain" @click="closeDrawer" class="mr-4"
          >取消</my-button
        >
        <my-button type="default" @click="editUserInfoHandler">保存</my-button>
      </div>
    </el-drawer>
  </div>
</template>
<script lang="ts" setup>
import { UserFormType, UserInfoType } from '@/api/user/type';

const props = defineProps<{
  defaultData: UserInfoType | null;
}>();
const emits = defineEmits<{
  (e: 'sendData', userInfo: UserFormType): void;
}>();

const formRef = ref();
const formData = ref<UserFormType>({
  nickName: '',
  avatar: '',
  email: '',
  talks: '',
  bgCover: '',
  sex: 0,
});

const visible = ref(false);
const openDrawer = () => {
  initDrawer();
  visible.value = true;
};

const closeDrawer = () => {
  visible.value = false;
};

const formRules = {
  nickName: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { min: 2, max: 10, message: '长度在 2 到 10 个字符', trigger: 'blur' },
  ],
};

const initDrawer = async () => {
  if (props.defaultData) {
    formData.value = { ...props.defaultData };
  }
};

const uploadAvatarHandler = (url: string) => {
  formData.value.avatar = url;
};

const uploadCoverHandler = (url: string) => {
  formData.value.bgCover = url;
};

const editUserInfoHandler = async () => {
  const valid = await formRef.value.validate();
  if (valid) {
    closeDrawer();
    emits('sendData', formData.value);
  }
};

defineExpose({
  openDrawer,
});
</script>
<style lang="scss" scoped></style>
