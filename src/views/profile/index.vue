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

            <el-row :gutter="20" class="profile-layout">
                <el-col :span="8" :xs="24">
                    <div class="user-info text-center profile-panel">
                        <div class="avatar-ring">
                            <el-avatar :size="104" :src="userInfo.avatar || defaultAvatar" />
                        </div>
                        <h3>{{ userInfo.username || userStore.username || '未命名用户' }}</h3>
                        <el-tag class="role-badge" type="primary" effect="light">{{ roleLabel }}</el-tag>
                        <div class="user-desc">
                            <div class="info-row">
                                <span class="info-icon"><el-icon><Iphone /></el-icon></span>
                                <div>
                                    <span class="info-label">手机号码</span>
                                    <strong>{{ userInfo.phone || '暂未绑定手机' }}</strong>
                                </div>
                            </div>
                            <div class="info-row">
                                <span class="info-icon"><el-icon><Clock /></el-icon></span>
                                <div>
                                    <span class="info-label">注册时间</span>
                                    <strong>{{ userInfo.createTime || '-' }}</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                </el-col>

                <el-col :span="16" :xs="24">
                    <div class="profile-content">
                        <el-tabs v-model="activeTab" class="profile-tabs">
                        <el-tab-pane name="info">
                            <template #label>
                                <span class="tab-label">
                                    <el-icon><User /></el-icon>
                                    基本资料
                                </span>
                            </template>
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

                        <el-tab-pane name="password">
                            <template #label>
                                <span class="tab-label">
                                    <el-icon><Lock /></el-icon>
                                    修改密码
                                </span>
                            </template>
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

                        <el-tab-pane v-if="showAddressTab" name="address">
                            <template #label>
                                <span class="tab-label">
                                    <el-icon><Location /></el-icon>
                                    收货地址
                                </span>
                            </template>
                            <AddressManager ref="addressManagerRef" />
                        </el-tab-pane>
                        </el-tabs>
                    </div>
                </el-col>
            </el-row>
        </el-card>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { getUserProfile, updateUserProfile, updateUserPwd } from '@/api/system/profile'
import UploadImg from '@/components/Uploading.vue'
import AddressManager from '@/components/AddressManager.vue'
import { ElMessage } from 'element-plus'
import { Clock, Iphone, Location, Lock, User } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { normalizeRole } from '@/utils/role'

const userStore = useUserStore()
const activeTab = ref('info')
const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'

const userInfo = ref<any>({})

const currentRole = computed(() => normalizeRole(userInfo.value?.role || userStore.role))

const roleLabel = computed(() => {
    switch (currentRole.value) {
        case 'MERCHANT': return '商家'
        case 'CUSTOMER': return '顾客'
        case 'ADMIN': return '管理员'
        default: return '用户'
    }
})

const showAddressTab = computed(() => currentRole.value !== 'ADMIN')

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
const addressManagerRef = ref<InstanceType<typeof AddressManager> | null>(null)

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

watch(showAddressTab, (visible) => {
    if (!visible && activeTab.value === 'address') {
        activeTab.value = 'info'
    }
}, { immediate: true })
</script>

<style scoped>
.text-center {
    text-align: center;
}

.profile-layout {
    align-items: stretch;
}

.profile-layout :deep(.el-col) {
    margin-bottom: 0;
}

.user-info {
    padding: 30px 22px;
}

.profile-panel {
    position: relative;
    overflow: hidden;
    min-height: 100%;
    border: 1px solid var(--app-border);
    border-radius: 16px;
    background:
        radial-gradient(circle at 20% 0%, rgba(64, 158, 255, 0.16), transparent 34%),
        linear-gradient(180deg, var(--app-surface) 0%, var(--app-surface-soft) 100%);
    box-shadow: var(--app-shadow-sm);
}

.profile-panel::before {
    content: '';
    position: absolute;
    inset: 0 0 auto;
    height: 92px;
    background: linear-gradient(90deg, rgba(64, 158, 255, 0.18), rgba(103, 194, 58, 0.12));
    pointer-events: none;
}

.avatar-ring {
    position: relative;
    z-index: 1;
    display: inline-flex;
    padding: 5px;
    border-radius: 50%;
    background: var(--app-surface);
    box-shadow: 0 10px 28px rgba(15, 23, 42, 0.12);
}

.avatar-ring :deep(.el-avatar) {
    border: 3px solid var(--app-surface);
}

.profile-panel h3 {
    position: relative;
    margin: 16px 0 10px;
    color: var(--app-text);
    font-size: 22px;
    font-weight: 700;
}

.role-badge {
    border-radius: 999px;
    padding: 0 14px;
}

.user-desc {
    display: grid;
    gap: 12px;
    margin-top: 24px;
    text-align: left;
    font-size: 14px;
}

.info-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 13px 14px;
    border: 1px solid var(--app-border);
    border-radius: 12px;
    background: color-mix(in srgb, var(--app-surface) 84%, transparent);
}

.info-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    flex: 0 0 34px;
    border-radius: 10px;
    background: rgba(64, 158, 255, 0.12);
    color: var(--app-primary);
}

.info-label {
    display: block;
    margin-bottom: 4px;
    color: var(--app-text-muted);
    font-size: 12px;
}

.info-row strong {
    color: var(--app-text);
    font-size: 14px;
    font-weight: 600;
    word-break: break-all;
}

.profile-content {
    min-height: 100%;
    padding: 20px 22px 24px;
    border: 1px solid var(--app-border);
    border-radius: 16px;
    background: var(--app-surface);
    box-shadow: var(--app-shadow-sm);
}

.profile-tabs :deep(.el-tabs__header) {
    margin-bottom: 18px;
}

.profile-tabs :deep(.el-tabs__nav-wrap::after) {
    height: 1px;
    background-color: var(--app-border);
}

.tab-label {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-weight: 600;
}

.profile-form {
    max-width: 560px;
    margin-top: 6px;
    padding-top: 8px;
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

.profile-form :deep(.el-button) {
    border-radius: 10px;
}

@media (max-width: 768px) {
    .profile-panel {
        min-height: auto;
        margin-bottom: 16px;
    }

    .profile-content {
        padding: 16px;
    }
}
</style>
