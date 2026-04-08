export const routes = {
  home: '/pages/home/index',
  recipeLibrary: '/pages/recipe-library/index',
  mealPlanner: '/pages/meal-planner/index',
  my: '/pages/my/index',
  recipeDetail: '/packages/recipe/detail/index',
  recipeEdit: '/packages/recipe/edit/index',
  versionCreate: '/packages/recipe/version-create/index',
  versionCompare: '/packages/recipe/version-compare/index',
  momentEdit: '/packages/recipe/moment-edit/index',
  randomPick: '/packages/planner/random-pick/index',
  shoppingList: '/packages/planner/shopping-list/index',
  categoryManage: '/packages/profile/category-manage/index',
  tagManage: '/packages/profile/tag-manage/index',
  settings: '/packages/profile/settings/index'
} as const

export const tabRoutes = new Set<string>([
  routes.home,
  routes.recipeLibrary,
  routes.mealPlanner,
  routes.my
])
