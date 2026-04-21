import { useMemo, useState, type ReactNode } from 'react'
import { Input, Text, View } from '@tarojs/components'
import { PageContainer } from '@/components/base/PageContainer'
import { EmptyState } from '@/components/base/EmptyState'
import styles from './index.module.scss'

export interface TaxonomyManagerItem {
  id: string
  name: string
  sortOrder: number
  color?: string
}

interface TaxonomyManagerProps<TItem extends TaxonomyManagerItem> {
  pageTitle: string
  pageSubtitle: string
  heroEyebrow: string
  heroTitle: string
  heroDescription: string
  addButtonText: string
  emptyTitle: string
  emptyDescription: string
  loadingText: string
  errorTitle: string
  errorDescription: string
  sheetCreateTitle: string
  sheetEditTitle: string
  sheetDescription: string
  fieldLabel: string
  namePlaceholder: string
  nameMaxLength: number
  saveText: string
  pendingText: string
  countCaption: string
  items?: TItem[]
  loading?: boolean
  hasError?: boolean
  onRetry?: () => void
  onSave: (payload: { id?: string; name: string; color?: string }) => Promise<void>
  enableColor?: boolean
  colorOptions?: string[]
  renderItemMeta: (item: TItem) => ReactNode
  theme?: 'warm' | 'leaf'
}

const DEFAULT_COLOR_OPTIONS = ['#a84533', '#b45a45', '#596859', '#6e6353', '#c46c3f', '#708c69']

export function TaxonomyManager<TItem extends TaxonomyManagerItem>({
  pageTitle,
  pageSubtitle,
  heroEyebrow,
  heroTitle,
  heroDescription,
  addButtonText,
  emptyTitle,
  emptyDescription,
  loadingText,
  errorTitle,
  errorDescription,
  sheetCreateTitle,
  sheetEditTitle,
  sheetDescription,
  fieldLabel,
  namePlaceholder,
  nameMaxLength,
  saveText,
  pendingText,
  countCaption,
  items = [],
  loading,
  hasError,
  onRetry,
  onSave,
  enableColor = false,
  colorOptions = DEFAULT_COLOR_OPTIONS,
  renderItemMeta,
  theme = 'warm'
}: TaxonomyManagerProps<TItem>) {
  const [open, setOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<TItem | null>(null)
  const [draftName, setDraftName] = useState('')
  const [draftColor, setDraftColor] = useState(colorOptions[0] || DEFAULT_COLOR_OPTIONS[0])
  const [formError, setFormError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const orderedItems = useMemo(
    () => [...items].sort((left, right) => left.sortOrder - right.sortOrder),
    [items]
  )

  const toneClassName = theme === 'leaf' ? styles.themeLeaf : styles.themeWarm

  const closeSheet = () => {
    if (isSaving) {
      return
    }

    setOpen(false)
    setEditingItem(null)
    setDraftName('')
    setDraftColor(colorOptions[0] || DEFAULT_COLOR_OPTIONS[0])
    setFormError('')
  }

  const openCreate = () => {
    setEditingItem(null)
    setDraftName('')
    setDraftColor(colorOptions[0] || DEFAULT_COLOR_OPTIONS[0])
    setFormError('')
    setOpen(true)
  }

  const openEdit = (item: TItem) => {
    setEditingItem(item)
    setDraftName(item.name)
    setDraftColor(item.color || colorOptions[0] || DEFAULT_COLOR_OPTIONS[0])
    setFormError('')
    setOpen(true)
  }

  const handleSubmit = async () => {
    const trimmedName = draftName.trim()

    if (!trimmedName) {
      setFormError(`请输入${fieldLabel}`)
      return
    }

    if (trimmedName.length > nameMaxLength) {
      setFormError(`${fieldLabel}最多 ${nameMaxLength} 个字`)
      return
    }

    setFormError('')
    setIsSaving(true)

    try {
      await onSave({
        id: editingItem?.id,
        name: trimmedName,
        color: enableColor ? draftColor : undefined
      })
      closeSheet()
    } catch (error) {
      setFormError(error instanceof Error ? error.message : '保存失败，请稍后重试。')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <PageContainer
      title={pageTitle}
      subtitle={pageSubtitle}
      showBack
      rightAction={
        <View className={styles.headerAction} onClick={openCreate}>
          <Text>{addButtonText}</Text>
        </View>
      }
    >
      <View className="page-stack">
        <View className={`${styles.heroCard} ${toneClassName}`}>
          <Text className="eyebrow">{heroEyebrow}</Text>
          <Text className={styles.heroTitle}>{heroTitle}</Text>
          <Text className={styles.heroDescription}>{heroDescription}</Text>
          <View className={styles.heroFooter}>
            <View className={styles.metricPill}>
              <Text>{orderedItems.length}</Text>
              <Text>{countCaption}</Text>
            </View>
            <View className={styles.inlineAction} onClick={openCreate}>
              <Text>{addButtonText}</Text>
            </View>
          </View>
        </View>

        <View className={styles.sectionCard}>
          <View className={styles.sectionHeader}>
            <Text className="section-title">列表清单</Text>
            <Text className={styles.sectionHint}>支持新建与编辑，顺序会按当前列表自动续排。</Text>
          </View>

          {loading ? (
            <View className={styles.stateCard}>
              <Text className={styles.stateTitle}>{loadingText}</Text>
              <Text className={styles.stateDescription}>正在同步最新字典，请稍候一下。</Text>
            </View>
          ) : null}

          {!loading && hasError ? (
            <View className={styles.stateCard}>
              <Text className={styles.stateTitle}>{errorTitle}</Text>
              <Text className={styles.stateDescription}>{errorDescription}</Text>
              {onRetry ? (
                <View className={styles.retryAction} onClick={onRetry}>
                  <Text>重新加载</Text>
                </View>
              ) : null}
            </View>
          ) : null}

          {!loading && !hasError && orderedItems.length === 0 ? (
            <EmptyState title={emptyTitle} description={emptyDescription} />
          ) : null}

          {!loading && !hasError && orderedItems.length > 0 ? (
            <View className={styles.listStack}>
              {orderedItems.map((item) => (
                <View className={styles.entryCard} key={item.id}>
                  <View className={styles.entryMain}>
                    <View className={styles.orderBadge}>
                      <Text>{String(item.sortOrder + 1).padStart(2, '0')}</Text>
                    </View>
                    <View className={styles.entryMeta}>
                      <View className={styles.entryTitleRow}>
                        {enableColor ? (
                          <View
                            className={styles.colorDot}
                            style={{ backgroundColor: item.color || draftColor }}
                          />
                        ) : (
                          <View className={`${styles.dotMarker} ${toneClassName}`} />
                        )}
                        <Text className={styles.entryTitle}>{item.name}</Text>
                      </View>
                      <View className={styles.entryDescription}>{renderItemMeta(item)}</View>
                    </View>
                  </View>
                  <View className={styles.entryAction} onClick={() => openEdit(item)}>
                    <Text>编辑</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </View>

      {open ? (
        <View className={styles.overlay} onClick={closeSheet}>
          <View className={styles.sheet} onClick={(event) => event.stopPropagation()}>
            <View className={styles.sheetHeader}>
              <Text className={styles.sheetTitle}>
                {editingItem ? sheetEditTitle : sheetCreateTitle}
              </Text>
              <Text className={styles.sheetDescription}>{sheetDescription}</Text>
            </View>

            <View className={styles.fieldBlock}>
              <View className={styles.labelRow}>
                <Text className={styles.fieldLabel}>{fieldLabel}</Text>
                <Text className={styles.requiredBadge}>必填</Text>
              </View>
              <View className={styles.inputShell}>
                <Input
                  className={styles.textInput}
                  placeholder={namePlaceholder}
                  placeholderClass={styles.inputPlaceholder}
                  value={draftName}
                  maxlength={nameMaxLength}
                  cursorSpacing={96}
                  onInput={(event) => setDraftName(event.detail.value)}
                />
              </View>
            </View>

            {enableColor ? (
              <View className={styles.fieldBlock}>
                <Text className={styles.fieldLabel}>识别颜色</Text>
                <View className={styles.colorList}>
                  {colorOptions.map((color) => (
                    <View
                      className={`${styles.colorOption} ${draftColor === color ? styles.colorOptionActive : ''}`}
                      key={color}
                      style={{ backgroundColor: color }}
                      onClick={() => setDraftColor(color)}
                    />
                  ))}
                </View>
                <Text className={styles.colorHint}>当前色值：{draftColor}</Text>
              </View>
            ) : null}

            {formError ? <Text className={styles.errorText}>{formError}</Text> : null}

            <View className={styles.sheetActions}>
              <View className="secondary-button" onClick={closeSheet}>
                <Text>取消</Text>
              </View>
              <View className="primary-button" onClick={handleSubmit}>
                <Text>{isSaving ? pendingText : saveText}</Text>
              </View>
            </View>
          </View>
        </View>
      ) : null}
    </PageContainer>
  )
}
