import type { RouteRecordRaw } from 'vue-router';

export const ArticleRouteList: RouteRecordRaw[] = [
  {
    path: '/article-list',
    name: 'ArticleList',
    component: () =>
      import('@/views/pages/Article/pages/ArticleList/index.vue'),
    meta: {
      name: '文章列表',
      icon: 'view-list',
    },
  },
  {
    path: '/article-detail',
    name: 'ArticleDetail',
    component: () =>
      import('@/views/pages/Article/pages/ArticleDetail/index.vue'),
    meta: {
      name: '文章详情',
      icon: 'doc-detail',
    },
  },
  {
    path: '/release-article',
    name: 'ReleaseArticle',
    component: () =>
      import('@/views/pages/Article/pages/ReleaseArticle/index.vue'),
    meta: {
      name: '发表文章',
      icon: 'pencil',
    },
  },
  {
    path: '/update-article',
    name: 'UpdateArticle',
    component: () =>
      import('@/views/pages/Article/pages/ReleaseArticle/index.vue'),
    meta: {
      name: '编辑文章',
      icon: 'notebook',
    },
  },
  {
    path: '/article-category',
    name: 'ArticleCategoryManage',
    component: () =>
      import('@/views/pages/Article/pages/ArticleCategory/index.vue'),
    meta: {
      name: '文章类别',
      icon: 'category-management',
    },
  },
  {
    path: '/article-tag',
    name: 'ArticleTagManage',
    component: () => import('@/views/pages/Article/pages/ArticleTag/index.vue'),
    meta: {
      name: '文章标签',
      icon: 'tag-one',
    },
  },
  {
    path: '/article-column',
    name: 'ArticleColumnManage',
    component: () =>
      import('@/views/pages/Article/pages/ArticleColumn/index.vue'),
    meta: {
      name: '文章专栏',
      icon: 'label',
    },
  },
];
