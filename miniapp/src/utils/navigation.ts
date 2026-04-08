import Taro from '@tarojs/taro'
import { routes, tabRoutes } from '@/constants/routes'

type RouteValue = (typeof routes)[keyof typeof routes]
type RouteParams = Record<string, string | number | undefined | null>

function buildSearch(params?: RouteParams) {
  if (!params) {
    return ''
  }

  const query = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&')

  return query ? `?${query}` : ''
}

export function buildRouteUrl(route: RouteValue, params?: RouteParams) {
  return `${route}${buildSearch(params)}`
}

export function navigateToRoute(route: RouteValue, params?: RouteParams) {
  const url = buildRouteUrl(route, params)
  if (tabRoutes.has(route)) {
    return Taro.switchTab({ url })
  }

  return Taro.navigateTo({ url })
}

export function redirectToRoute(route: RouteValue, params?: RouteParams) {
  const url = buildRouteUrl(route, params)
  if (tabRoutes.has(route)) {
    return Taro.switchTab({ url })
  }

  return Taro.redirectTo({ url })
}

export function navigateBackOrHome(delta = 1) {
  const pages = Taro.getCurrentPages()
  if (pages.length > delta) {
    return Taro.navigateBack({ delta })
  }

  return Taro.switchTab({ url: routes.home })
}
