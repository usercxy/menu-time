export const svgIconColors = {
  primary: '#2c4c3b',
  primaryDeep: '#12221a',
  onPrimary: '#ffffff',
  secondary: '#6b705c',
  tertiary: '#a85507',
  onSecondaryContainer: '#585d4a',
  onTertiaryContainer: '#8a4606',
  onSurface: '#1a1c19',
  onSurfaceVariant: '#414941'
} as const

export type SvgIconColor = (typeof svgIconColors)[keyof typeof svgIconColors] | string
