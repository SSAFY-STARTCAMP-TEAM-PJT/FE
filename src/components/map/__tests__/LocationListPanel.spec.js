import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import LocationListPanel from '@/components/map/LocationListPanel.vue'

describe('LocationListPanel', () => {
  it('keeps existing locations visible while showing the refresh status', () => {
    const wrapper = mount(LocationListPanel, {
      props: {
        locations: [
          {
            id: '1',
            name: '해운대',
            category: '관광지',
            address: '부산광역시 해운대구',
          },
        ],
        refreshing: true,
      },
    })

    expect(wrapper.text()).toContain('이 영역 업데이트 중')
    expect(wrapper.text()).toContain('해운대')
    expect(wrapper.find('.location-list-panel__list').exists()).toBe(true)
    expect(wrapper.find('.location-list-panel__state').exists()).toBe(false)
  })

  it('shows the centered loading state only for the initial load', () => {
    const wrapper = mount(LocationListPanel, {
      props: {
        locations: [],
        loading: true,
      },
    })

    expect(wrapper.text()).toContain('여행지를 불러오는 중입니다.')
    expect(wrapper.find('.location-list-panel__state').exists()).toBe(true)
  })
})
