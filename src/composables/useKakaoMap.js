import { ref } from 'vue'

export function useKakaoMap() {
  const isLoaded = ref(false)

  function loadMap(container, options = {}) {
    if (!window.kakao?.maps) {
      console.warn('Kakao Maps SDK is not loaded yet.')
      return null
    }

    const map = new window.kakao.maps.Map(container, {
      center: new window.kakao.maps.LatLng(37.5665, 126.978),
      level: 3,
      ...options,
    })

    isLoaded.value = true
    return map
  }

  return {
    isLoaded,
    loadMap,
  }
}
