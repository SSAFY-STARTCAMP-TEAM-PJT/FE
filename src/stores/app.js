import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  const appTitle = ref('StartCamp Map App')

  function setAppTitle(title) {
    appTitle.value = title
  }

  return {
    appTitle,
    setAppTitle,
  }
})
