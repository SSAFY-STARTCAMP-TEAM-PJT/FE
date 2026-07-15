import { describe, it, expect } from 'vitest'

import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

import App from '../App.vue'
import router from '../router'

describe('App', () => {
  it('mounts renders properly', () => {
    setActivePinia(createPinia())

    const wrapper = mount(App, {
      global: {
        plugins: [router],
      },
    })

    expect(wrapper.text()).toContain('StartCamp Map App')
  })
})
