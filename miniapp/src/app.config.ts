export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/recipe-library/index',
    'pages/meal-planner/index',
    'pages/my/index'
  ],
  subpackages: [
    {
      root: 'packages/recipe',
      pages: ['detail/index', 'edit/index', 'version-create/index', 'version-compare/index', 'moment-edit/index']
    },
    {
      root: 'packages/planner',
      pages: ['random-pick/index', 'shopping-list/index']
    },
    {
      root: 'packages/profile',
      pages: ['category-manage/index', 'tag-manage/index', 'settings/index']
    }
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationStyle: 'custom',
    backgroundColor: '#fffcf7',
    backgroundColorTop: '#fffcf7',
    backgroundColorBottom: '#f1e7d7'
  },
  tabBar: {
    color: '#6e6353',
    selectedColor: '#a84533',
    backgroundColor: '#fffcf7',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '首页',
        iconPath: 'assets/tab/home.png',
        selectedIconPath: 'assets/tab/home-active.png'
      },
      {
        pagePath: 'pages/recipe-library/index',
        text: '菜谱库',
        iconPath: 'assets/tab/recipe.png',
        selectedIconPath: 'assets/tab/recipe-active.png'
      },
      {
        pagePath: 'pages/meal-planner/index',
        text: '点菜台',
        iconPath: 'assets/tab/planner.png',
        selectedIconPath: 'assets/tab/planner-active.png'
      },
      {
        pagePath: 'pages/my/index',
        text: '我的',
        iconPath: 'assets/tab/profile.png',
        selectedIconPath: 'assets/tab/profile-active.png'
      }
    ]
  }
})
