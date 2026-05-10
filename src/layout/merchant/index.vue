<template>
    <el-container class="layout-shell">
        <el-aside width="220px" class="layout-aside">
            <el-scrollbar class="aside-scroll">
                <side-bar />
            </el-scrollbar>
        </el-aside>

        <el-container class="layout-main-shell">
            <el-header class="layout-header">
                <nav-bar />
            </el-header>

            <el-main class="layout-main">
                <el-scrollbar class="main-scroll">
                    <div class="main-content">
                        <router-view v-slot="{ Component }">
                            <keep-alive>
                                <component :is="Component" />
                            </keep-alive>
                        </router-view>
                    </div>
                </el-scrollbar>
            </el-main>
        </el-container>
    </el-container>
</template>

<script lang="ts" setup>
import NavBar from '@/layout/admin/navbar/index.vue'
import SideBar from '@/layout/admin/sidebar/index.vue'
</script>

<style scoped>
.layout-shell {
    height: 100vh;
    background: #f5f7fb;
}

.layout-aside {
    height: 100vh;
    border-right: 1px solid #e9edf4;
    background: linear-gradient(180deg, #ffffff 0%, #f7f9fc 100%);
}

.layout-main-shell {
    min-width: 0;
    background: #f5f7fb;
}

.layout-header {
    height: 72px;
    padding: 14px 18px 0;
    background: transparent;
}

.layout-main {
    padding: 14px 18px 18px;
    min-height: 0;
}

.main-scroll {
    height: 100%;
}

.main-content {
    min-height: calc(100vh - 104px);
    padding: 0;
}
</style>
