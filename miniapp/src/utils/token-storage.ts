import Taro from '@tarojs/taro'
import { storageKeys } from '@/constants/storage'
import type { TokenBundleDTO } from '@/services/types/auth'

export function getTokenBundle() {
  return Taro.getStorageSync<TokenBundleDTO | undefined>(storageKeys.tokenBundle)
}

export function setTokenBundle(tokenBundle: TokenBundleDTO) {
  Taro.setStorageSync(storageKeys.tokenBundle, tokenBundle)
}

export function clearTokenBundle() {
  Taro.removeStorageSync(storageKeys.tokenBundle)
}
