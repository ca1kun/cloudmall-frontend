<template>
    <div class="navbar">
        <!-- 左侧面包屑或标题 -->
            <div class="left-breadcrumb">
                <el-breadcrumb separator="/">
                    <el-breadcrumb-item :to="{ path: getRoleHomePath(userStore.role) }">首页</el-breadcrumb-item>
                    <el-breadcrumb-item>{{ layoutTitle }}</el-breadcrumb-item>
                </el-breadcrumb>
            </div>

        <!-- 右侧菜单 -->
        <div class="right-menu">
            <el-switch
                class="theme-switch"
                :model-value="themeStore.theme === 'dark'"
                inline-prompt
                :active-icon="Moon"
                :inactive-icon="Sunny"
                @change="(value: boolean) => themeStore.applyTheme(value ? 'dark' : 'light')"
            />
            <div class="user-block">

                <el-dropdown trigger="click" class="avatar-container">
                    <div class="avatar-wrapper">
                        <el-avatar :size="32" :src="userStore.avatar" :icon="UserFilled" class="user-avatar" />
                        <el-icon class="caret-icon">
                            <CaretBottom />
                        </el-icon>
                    </div>

                    <template #dropdown>
                        <el-dropdown-menu class="user-dropdown">
                            <el-dropdown-item icon="User" @click="toProfile">
                                个人中心
                            </el-dropdown-item>

                            <el-dropdown-item divided icon="SwitchButton" @click="handleLogout">
                                退出登录
                            </el-dropdown-item>
                        </el-dropdown-menu>
                    </template>
                </el-dropdown>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { UserFilled, CaretBottom, User, SwitchButton, Moon, Sunny } from '@element-plus/icons-vue'
import { getRoleHomePath, getRoleProfilePath } from '@/utils/role'
import { useThemeStore } from '@/stores/theme'

const userStore = useUserStore()
const router = useRouter()
const layoutTitle = computed(() => '商家工作台')
const themeStore = useThemeStore()

const toProfile = () => {
    router.push(getRoleProfilePath(userStore.role))
}

const handleLogout = () => {
    ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
    })
        .then(async () => {
            await userStore.logout()
            ElMessage.success('退出成功')
            router.replace('/login')
        })
        .catch(() => { })
}
</script>

<style scoped>
.navbar {
    height: 58px;
    position: relative;
    background: var(--app-surface);
    border: 1px solid var(--app-border);
    border-radius: 14px;
    box-shadow: var(--app-shadow-sm);
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 18px;
}

.left-breadcrumb {
    font-size: 14px;
}

.right-menu {
    display: flex;
    align-items: center;
    gap: 12px;
}

.user-block {
    display: flex;
    align-items: center;
}

.username {
    font-size: 14px;
    color: var(--app-text-muted);
    margin-right: 12px;
}

.avatar-container {
    cursor: pointer;
}

.avatar-wrapper {
    display: flex;
    align-items: center;
}

.user-avatar {
    cursor: pointer;
    border-radius: 10px;
}

.caret-icon {
    margin-left: 5px;
    font-size: 12px;
    color: var(--app-text-muted);
}

.avatar-wrapper {
    padding: 4px 8px;
    border-radius: 10px;
    transition: background-color 0.2s ease;
}

.avatar-wrapper:hover {
    background: var(--app-surface-muted);
}

.theme-switch {
    --el-switch-on-color: var(--app-primary);
    --el-switch-off-color: #cbd5f5;
}
</style>

<style>
.user-dropdown {
    min-width: 140px !important;
    text-align: center;
}

.user-dropdown .el-dropdown-menu__item {
    justify-content: flex-start;
    padding: 10px 20px;
}
</style>
