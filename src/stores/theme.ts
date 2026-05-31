import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

type ThemeMode = 'light' | 'dark'

const getPreferredTheme = (): ThemeMode => {
  if (typeof window === 'undefined') {
    return 'light'
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export const useThemeStore = defineStore(
  'theme',
  () => {
    const theme = ref<ThemeMode>(getPreferredTheme())

    const applyTheme = (value: ThemeMode) => {
      theme.value = value
    }

    const toggleTheme = () => {
      applyTheme(theme.value === 'dark' ? 'light' : 'dark')
    }

    watch(
      theme,
      (value) => {
        if (typeof document !== 'undefined') {
          document.documentElement.setAttribute('data-theme', value)
        }
      },
      { immediate: true }
    )

    return { theme, applyTheme, toggleTheme }
  },
  {
    persist: true
  }
)
