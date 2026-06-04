import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { listAddressApi } from '@/api/system/address'
import type { Address } from '@/types/types'

export const useAddressStore = defineStore(
  'address',
  () => {
    // 地址列表
    const addressList = ref<Address[]>([])
    // 当前选中的地址ID
    const selectedId = ref<number>(0)
    // 是否已加载
    const loaded = ref(false)

    // 默认地址
    const defaultAddress = computed(() => {
      return addressList.value.find((a) => a.isDefault === 1)
    })

    // 当前选中的地址
    const selectedAddress = computed(() => {
      if (selectedId.value === 0) return undefined
      return addressList.value.find((a) => a.id === selectedId.value)
    })

    // 获取地址列表（带缓存）
    const fetchAddressList = async (force = false) => {
      if (loaded.value && !force) return
      try {
        const res = await listAddressApi({ pageNum: 1, pageSize: 50 })
        if (res.code === 200) {
          const list = res.data?.records || res.data?.list || []
          addressList.value = list
          loaded.value = true

          // 如果没有选中地址，自动选中默认地址或第一个
          if (selectedId.value === 0 && list.length > 0) {
            const defaultAddr = list.find((a) => a.isDefault === 1)
            selectedId.value = defaultAddr?.id || list[0].id || 0
          }
        }
      } catch (error) {
        console.error('获取地址列表失败', error)
      }
    }

    // 选择地址
    const selectAddress = (id: number) => {
      selectedId.value = id
    }

    // 刷新地址列表
    const refresh = async () => {
      loaded.value = false
      await fetchAddressList(true)
    }

    // 重置状态
    const reset = () => {
      addressList.value = []
      selectedId.value = 0
      loaded.value = false
    }

    return {
      addressList,
      selectedId,
      loaded,
      defaultAddress,
      selectedAddress,
      fetchAddressList,
      selectAddress,
      refresh,
      reset,
    }
  },
  {
    persist: {
      pick: ['selectedId'],
    },
  },
)
