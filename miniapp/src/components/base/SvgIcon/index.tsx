import { useMemo } from 'react'
import { Image } from '@tarojs/components'
import type { CSSProperties } from 'react'
import { iconRegistry, type SvgIconName } from './iconRegistry'
import { svgIconColors, type SvgIconColor } from './iconColors'

interface SvgIconProps {
  name: SvgIconName
  size?: number | string
  width?: number | string
  height?: number | string
  color?: SvgIconColor
  className?: string
  style?: CSSProperties
}

const svgUriCache = new Map<string, string>()

function normalizeSize(value?: number | string) {
  if (typeof value === 'number') {
    return `${value}px`
  }

  return value
}

function createSvgDataUri(name: SvgIconName, color: string) {
  const cacheKey = `${name}:${color}`
  const cachedValue = svgUriCache.get(cacheKey)

  if (cachedValue) {
    return cachedValue
  }

  const svgSource = iconRegistry[name].replace(/currentColor/g, color)
  const encodedSource = encodeURIComponent(svgSource)
  const dataUri = `data:image/svg+xml;utf8,${encodedSource}`

  svgUriCache.set(cacheKey, dataUri)

  return dataUri
}

export function SvgIcon({
  name,
  size = 24,
  width,
  height,
  color = svgIconColors.onSurface,
  className,
  style
}: SvgIconProps) {
  const resolvedWidth = normalizeSize(width ?? size)
  const resolvedHeight = normalizeSize(height ?? size)
  const src = useMemo(() => createSvgDataUri(name, color), [color, name])

  return (
    <Image
      className={className}
      src={src}
      svg
      mode="aspectFit"
      style={{
        width: resolvedWidth,
        height: resolvedHeight,
        ...style
      }}
    />
  )
}
