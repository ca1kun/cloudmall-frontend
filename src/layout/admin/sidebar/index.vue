<template>
    <div class="sidebar-shell">
        <div class="brand">
            <img src="@/assets/logo.svg" class="brand-logo" alt="logo" />
            <div class="brand-text">
                <p class="brand-title">商城管理系统</p>
                <p class="brand-subtitle">CloudMall Console</p>
            </div>
        </div>

        <el-menu :default-active="activeMenu" router class="sidebar-menu">
            <div v-for="(item, index) in routerList" :key="index">
                <el-sub-menu :index="item.path" v-if="item.children">
                    <template #title>
                        <el-icon>
                            <component :is="item.meta.icon"></component>
                        </el-icon>{{ item.meta.title }}
                    </template>
                    <el-menu-item-group v-for="val in item.children" :key="val.path">
                        <el-menu-item :index="val.path">
                            <el-icon>
                                <component :is="val.meta.icon"></component>
                            </el-icon>
                            <span>{{ val.meta.title }}</span></el-menu-item>
                    </el-menu-item-group>
                </el-sub-menu>
                <el-menu-item :index="item.path" v-else>
                    <el-icon>
                        <component :is="item.meta.icon"></component>
                    </el-icon>
                    <span>{{ item.meta.title }}</span>
                </el-menu-item>
            </div>
        </el-menu>
    </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { adminRouters } from '@/router/adminRouter'
import { useRoute } from 'vue-router'

const route = useRoute()
const routerList = [...adminRouters]
const activeMenu = computed(() => route.path)
</script>

<style scoped>
.sidebar-shell {
    height: 100%;
    padding: 14px 10px;
}

.brand {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 10px 14px;
    margin: 0 4px 12px;
    border-bottom: 1px solid #edf1f7;
}

.brand-logo {
    width: 38px;
    height: 38px;
}

.brand-text {
    min-width: 0;
}

.brand-title {
    color: #1f2d3d;
    font-size: 16px;
    line-height: 1.2;
    font-weight: 600;
    white-space: nowrap;
}

.brand-subtitle {
    margin-top: 3px;
    color: #8a97a8;
    font-size: 12px;
    letter-spacing: 0.4px;
}

.sidebar-menu {
    background: transparent;
    border-right: none;
}

:deep(.el-menu-item),
:deep(.el-sub-menu__title) {
    height: 42px;
    line-height: 42px;
    margin: 6px 6px;
    border-radius: 10px;
    color: #44576d;
}

:deep(.el-menu-item:hover),
:deep(.el-sub-menu__title:hover) {
    color: #1d4ed8;
    background: #eef4ff;
}

:deep(.el-menu-item.is-active) {
    color: #1d4ed8;
    background: linear-gradient(90deg, #eaf2ff 0%, #f5f9ff 100%);
    font-weight: 600;
}

:deep(.el-menu-item-group__title) {
    padding: 0;
}
</style>
