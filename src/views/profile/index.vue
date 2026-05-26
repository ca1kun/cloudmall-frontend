<template>
    <div class="app-container page-shell">
        <el-card class="page-card" shadow="never">
            <template #header>
                <div class="page-header">
                    <div>
                        <h2 class="page-title">个人中心</h2>
                        <p class="page-subtitle">维护个人资料与密码，保持账号信息准确可用。</p>
                    </div>
                </div>
            </template>

            <el-row :gutter="20">
                <el-col :span="8" :xs="24">
                    <div class="user-info text-center profile-panel">
                        <el-avatar :size="100" :src="userInfo.avatar || defaultAvatar" />
                        <h3>{{ userInfo.username }}</h3>
                        <p>{{ roleLabel }}</p>
                        <div class="user-desc">
                            <p><el-icon><Iphone /></el-icon> {{ userInfo.phone || '暂未绑定手机' }}</p>
                            <p><el-icon><Clock /></el-icon> 注册时间: {{ userInfo.createTime }}</p>
                        </div>
                    </div>
                </el-col>

                <el-col :span="16" :xs="24">
                    <el-tabs v-model="activeTab">
                        <el-tab-pane label="基本资料" name="info">
                            <el-form ref="infoFormRef" :model="infoForm" :rules="infoRules" label-width="80px" class="profile-form">
                                <el-form-item label="用户头像">
                                    <upload-img v-model="infoForm.avatar" />
                                </el-form-item>

                                <el-form-item label="手机号码" prop="phone">
                                    <el-input v-model="infoForm.phone" maxlength="11" placeholder="请输入11位手机号" />
                                </el-form-item>

                                <el-form-item>
                                    <el-button type="primary" @click="handleUpdateInfo">保存配置</el-button>
                                </el-form-item>
                            </el-form>
                        </el-tab-pane>

                        <el-tab-pane label="修改密码" name="password">
                            <el-form ref="pwdFormRef" :model="pwdForm" :rules="pwdRules" label-width="80px" class="profile-form">
                                <el-form-item label="旧密码" prop="oldPassword">
                                    <el-input v-model="pwdForm.oldPassword" type="password" show-password />
                                </el-form-item>
                                <el-form-item label="新密码" prop="newPassword">
                                    <el-input v-model="pwdForm.newPassword" type="password" show-password />
                                </el-form-item>
                                <el-form-item label="确认密码" prop="confirmPassword">
                                    <el-input v-model="pwdForm.confirmPassword" type="password" show-password />
                                </el-form-item>
                                <el-form-item>
                                    <el-button type="primary" @click="handleUpdatePwd">保存密码</el-button>
                                </el-form-item>
                            </el-form>
                        </el-tab-pane>
                    </el-tabs>
                </el-col>
            </el-row>
        </el-card>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { getUserProfile, updateUserProfile, updateUserPwd } from '@/api/system/profile'
import UploadImg from '@/components/Uploading.vue'
import { ElMessage } from 'element-plus'
import { Clock, Iphone } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const activeTab = ref('info')
const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'

const userInfo = ref<any>({})

const roleLabel = computed(() => {
    switch (userInfo.value?.role) {
        case 'MERCHANT': return '商家'
        case 'CUSTOMER': return '顾客'
        default: return '用户'
    }
})

const infoForm = reactive({
    avatar: '',
    phone: ''
})

const pwdForm = reactive({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
})

const pwdFormRef = ref()
const infoFormRef = ref()

const infoRules = {
    phone: [
        { required: true, message: '手机号不能为空', trigger: 'blur' },
        { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的11位手机号码', trigger: 'blur' }
    ]
}

const validatePass2 = (rule: any, value: any, callback: any) => {
    if (value !== pwdForm.newPassword) {
        callback(new Error('两次输入密码不一致!'))
    } else {
        callback()
    }
}

const pwdRules = {
    oldPassword: [{ required: true, message: '请输入旧密码', trigger: 'blur' }],
    newPassword: [
        { required: true, message: '请输入新密码', trigger: 'blur' },
        { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
    ],
    confirmPassword: [
        { required: true, message: '请再次输入密码', trigger: 'blur' },
        { validator: validatePass2, trigger: 'blur' }
    ]
}

const initData = async () => {
    const response = await getUserProfile()
    if (response.code === 200) {
        const userObj = response.data
        userInfo.value = userObj
        infoForm.avatar = userObj.avatar
        infoForm.phone = userObj.phone
        userStore.avatar = userObj.avatar
    }
}

const handleUpdateInfo = async () => {
    if (!infoFormRef.value) return

    await infoFormRef.value.validate(async (valid: boolean) => {
        if (!valid) {
            ElMessage.warning('请检查输入格式是否正确')
            return false
        }

        try {
            const res = await updateUserProfile(infoForm)
            if (res.code === 200) {
                ElMessage.success('资料保存成功！')
                userInfo.value.avatar = infoForm.avatar
                userInfo.value.phone = infoForm.phone
                userStore.avatar = infoForm.avatar
                localStorage.setItem('avatar', infoForm.avatar)
            } else {
                ElMessage.error(res.message || '保存失败')
            }
        } catch (error) {
            console.error(error)
        }
    })
}

const handleUpdatePwd = async () => {
    if (!pwdFormRef.value) return

    await pwdFormRef.value.validate(async (valid: boolean) => {
        if (valid) {
            const res = await updateUserPwd(pwdForm)
            if (res.code === 200) {
                ElMessage.success('密码修改成功，请重新登录')
                userStore.logout()
            } else {
                ElMessage.error(res.message || '修改失败')
            }
        }
    })
}

onMounted(() => {
    initData()
})
</script>

<style scoped>
.text-center {
    text-align: center;
}

.user-info {
    padding: 24px 18px;
}

.profile-panel {
    border: 1px solid var(--app-border);
    border-radius: 18px;
    background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
    box-shadow: var(--app-shadow-sm);
}

.profile-panel h3 {
    margin: 14px 0 6px;
    color: var(--app-text);
    font-size: 22px;
    font-weight: 700;
}

.profile-panel p {
    color: var(--app-text-muted);
}

.user-desc {
    margin-top: 20px;
    text-align: left;
    color: var(--app-text-muted);
    font-size: 14px;
}

.user-desc p {
    margin-bottom: 10px;
}

.user-desc :deep(.el-icon) {
    margin-right: 6px;
    color: var(--app-primary);
}

.profile-form {
    margin-top: 20px;
}

.profile-form :deep(.el-form-item__label) {
    color: var(--app-text);
    font-weight: 500;
}

.profile-form :deep(.el-input__wrapper) {
    border-radius: 12px;
    box-shadow: 0 0 0 1px var(--app-border) inset;
}

.profile-form :deep(.el-input__wrapper.is-focus) {
    box-shadow: 0 0 0 1px var(--app-primary) inset;
}
</style>
