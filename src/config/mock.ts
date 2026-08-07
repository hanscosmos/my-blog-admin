export type MenuItem = {
  id: string;
  name: string;
  route: string;
  icon: string;
  color: string;
  code: string;
  type: string;
  sort: number;
  children?: MenuItem[];
};

export const menuList: MenuItem[] = [
  {
    id: 'auth',
    name: '权限管理',
    route: 'auth-manage',
    icon: 'key-two',
    color: '',
    code: '10000',
    type: 'fold',
    sort: 0,
    children: [
      {
        id: 'menu',
        name: '菜单管理',
        route: 'menu-manage',
        icon: 'application-menu',
        color: '',
        code: '10001',
        type: 'menu-item',
        sort: 1,
      },
      {
        id: 'interface',
        name: '接口管理',
        route: 'interface-manage',
        icon: 'api',
        color: '',
        code: '10002',
        type: 'menu-item',
        sort: 1,
      },
      {
        id: 'role',
        name: '角色管理',
        route: 'role-manage',
        icon: 'id-card-h',
        color: '',
        code: '10003',
        type: 'menu-item',
        sort: 2,
      },
    ],
  },
  {
    id: 'resource',
    name: '资源管理',
    route: 'resource-manage',
    icon: 'data-display',
    color: '',
    code: '10000',
    type: 'fold',
    sort: 0,
    children: [
      {
        id: 'icon',
        name: '图标管理',
        route: 'icon-manage',
        icon: 'folder-focus',
        color: '',
        code: '10001',
        type: 'menu-item',
        sort: 1,
      },
      {
        id: 'picture',
        name: '图片管理',
        route: 'image-manage',
        icon: 'picture',
        color: '',
        code: '10002',
        type: 'menu-item',
        sort: 1,
      },
    ],
  },
  {
    id: 'article',
    name: '文章管理',
    route: 'article-manage',
    icon: 'data-display',
    color: '',
    code: '10000',
    type: 'fold',
    sort: 0,
    children: [
      {
        id: 'release',
        name: '发表文章',
        route: 'release-article',
        icon: 'picture',
        color: '',
        code: '10002',
        type: 'menu-item',
        sort: 1,
      },
    ],
  },
  {
    id: 'user',
    name: '用户管理',
    route: 'user-manage',
    icon: 'user',
    color: '',
    code: '20000',
    type: 'menu-item',
    sort: 1,
  },
];
