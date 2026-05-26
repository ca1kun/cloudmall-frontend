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
            <div class="user-block">
                <span class="username">你好，{{ userStore.username }}</span>

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
import { UserFilled, CaretBottom, User, SwitchButton } from '@element-plus/icons-vue'
import { getRoleHomePath, getRoleProfilePath } from '@/utils/role'

const userStore = useUserStore()
const router = useRouter()
const layoutTitle = computed(() => '商家工作台')

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
    background: #fff;
    border: 1px solid #e9edf4;
    border-radius: 14px;
    box-shadow: 0 6px 16px rgba(20, 40, 80, 0.06);
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
}

.user-block {
    display: flex;
    align-items: center;
}

.username {
    font-size: 14px;
    color: #4a5568;
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
    color: #94a3b8;
}

.avatar-wrapper {
    padding: 4px 8px;
    border-radius: 10px;
    transition: background-color 0.2s ease;
}

.avatar-wrapper:hover {
    background: #f3f6fb;
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
