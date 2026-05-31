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
                            <component :is="item.meta?.icon"></component>
                        </el-icon>{{ item.meta?.title }}
                    </template>
                    <el-menu-item-group v-for="val in item.children" :key="val.path">
                        <el-menu-item :index="val.path">
                            <el-icon>
                                <component :is="val.meta?.icon"></component>
                            </el-icon>
                            <span>{{ val.meta?.title }}</span></el-menu-item>
                    </el-menu-item-group>
                </el-sub-menu>
                <el-menu-item :index="item.path" v-else>
                    <el-icon>
                            <component :is="item.meta?.icon"></component>
                    </el-icon>
                    <span>{{ item.meta?.title }}</span>
                </el-menu-item>
            </div>
        </el-menu>
    </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { merchantRouters } from '@/router/merchantRouter'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { filterRoutesByRole } from '@/utils/role'

const route = useRoute()
const userStore = useUserStore()
const { role } = storeToRefs(userStore)
const routerList = computed(() => filterRoutesByRole(merchantRouters, role.value))
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
    border-bottom: 1px solid var(--app-border);
}

.brand-logo {
    width: 38px;
    height: 38px;
}

.brand-text {
    min-width: 0;
}

.brand-title {
    color: var(--app-text);
    font-size: 16px;
    line-height: 1.2;
    font-weight: 600;
    white-space: nowrap;
}

.brand-subtitle {
    margin-top: 3px;
    color: var(--app-text-muted);
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
    color: var(--app-text-muted);
}

:deep(.el-menu-item:hover),
:deep(.el-sub-menu__title:hover) {
    color: var(--app-primary);
    background: var(--app-surface-muted);
}

:deep(.el-menu-item.is-active) {
    color: var(--app-primary);
    background: var(--app-primary-soft);
    font-weight: 600;
}

:deep(.el-menu-item-group__title) {
    padding: 0;
}
</style>
