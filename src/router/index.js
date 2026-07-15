import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),

  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
    },
    {
      path: '/posts',
      name: 'post-list',
      component: () => import('@/views/PostListView.vue'),
    },
    {
      path: '/posts/new',
      name: 'post-create',
      component: () => import('@/views/PostCreateView.vue'),
    },
    {
      path: '/posts/:postId/edit',
      name: 'post-edit',
      component: () => import('@/views/PostEditView.vue'),
      props: true,
    },
    {
      path: '/posts/:postId',
      name: 'post-detail',
      component: () => import('@/views/PostDetailView.vue'),
      props: true,
    },
    {
      path: '/map',
      name: 'map',
      component: () => import('@/views/MapView.vue'),
      // meta: { fullWidth: true },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue'),
    },
  ],
})

export default router
