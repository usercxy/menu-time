import { useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Image, Input, Text, View } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import dayjs from 'dayjs'
import { PageContainer } from '@/components/base/PageContainer'
import { EmptyState } from '@/components/base/EmptyState'
import { ErrorState } from '@/components/base/ErrorState'
import { LoadingState } from '@/components/base/LoadingState'
import { SvgIcon } from '@/components/base/SvgIcon'
import { svgIconColors } from '@/components/base/SvgIcon/iconColors'
import { useAppQuery as useQuery } from '@/hooks/useAppQuery'
import { usePageShowRefetch } from '@/hooks/usePageShowRefetch'
import { shoppingService } from '@/services/modules/shopping'
import type {
  ShoppingListDetailDTO,
  ShoppingListItemDTO,
  ShoppingListItemType,
  ShoppingListShareImageResultDTO
} from '@/services/types/shopping'
import { queryClient } from '@/utils/query-client'
import styles from './index.module.scss'

type ShoppingTab = 'ingredient' | 'seasoning'

type ItemMutationInput = {
  itemId: string
  payload: {
    isChecked?: boolean
    quantityNote?: string | null
  }
}

const TAB_OPTIONS: Array<{ key: ShoppingTab; label: string; itemType: ShoppingListItemType }> = [
  { key: 'ingredient', label: '原料', itemType: 'ingredient' },
  { key: 'seasoning', label: '调料', itemType: 'seasoning' }
]

function updateItemInDetail(
  detail: ShoppingListDetailDTO,
  itemId: string,
  patch: Partial<Pick<ShoppingListItemDTO, 'isChecked' | 'quantityNote'>>
): ShoppingListDetailDTO {
  const updateItems = (items: ShoppingListItemDTO[]) =>
    items.map((item) =>
      item.id === itemId
        ? {
            ...item,
            ...patch,
            updatedAt: new Date().toISOString()
          }
        : item
    )

  const nextDetail = {
    ...detail,
    ingredientItems: updateItems(detail.ingredientItems),
    seasoningItems: updateItems(detail.seasoningItems)
  }
  nextDetail.checkedItemCount = [...nextDetail.ingredientItems, ...nextDetail.seasoningItems].filter(
    (item) => item.isChecked
  ).length

  return nextDetail
}

function getItemSourceText(item: ShoppingListItemDTO) {
  const names = Array.from(new Set(item.sourceRecipeRefs.map((source) => source.recipeName))).slice(0, 3)
  if (!names.length) {
    return '来自本周菜单'
  }

  return `来自 ${names.join('、')}${item.sourceRecipeRefs.length > names.length ? ' 等' : ''}`
}

export default function ShoppingListPage() {
  const router = useRouter()
  const initialListId = router.params.id || router.params.shoppingListId || ''
  const weekStartDate = router.params.weekStartDate || dayjs().startOf('week').add(1, 'day').format('YYYY-MM-DD')
  const [shoppingListId, setShoppingListId] = useState(initialListId)
  const [activeTab, setActiveTab] = useState<ShoppingTab>('ingredient')
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({})
  const [shareResult, setShareResult] = useState<ShoppingListShareImageResultDTO | null>(null)
  const [shareStatusText, setShareStatusText] = useState('')

  const detailQuery = useQuery({
    queryKey: ['shopping-list', shoppingListId],
    queryFn: () => shoppingService.getShoppingListDetail(shoppingListId),
    enabled: Boolean(shoppingListId)
  })

  usePageShowRefetch([shoppingListId ? detailQuery : null])

  const generateMutation = useMutation({
    mutationFn: () => shoppingService.generateShoppingList({ weekStartDate, generatedFrom: 'manual' })
  })

  const itemMutation = useMutation({
    mutationFn: ({ itemId, payload }: ItemMutationInput) => shoppingService.updateShoppingListItem(itemId, payload),
    onMutate: async ({ itemId, payload }) => {
      if (!shoppingListId) {
        return { previousDetail: undefined }
      }

      const queryKey = ['shopping-list', shoppingListId] as const
      await queryClient.cancelQueries({ queryKey })
      const previousDetail = queryClient.getQueryData<ShoppingListDetailDTO>(queryKey)

      if (previousDetail) {
        queryClient.setQueryData<ShoppingListDetailDTO>(queryKey, updateItemInDetail(previousDetail, itemId, payload))
      }

      return { previousDetail }
    },
    onError: (error, _variables, context) => {
      if (shoppingListId && context?.previousDetail) {
        queryClient.setQueryData(['shopping-list', shoppingListId], context.previousDetail)
      }

      Taro.showToast({
        title: error instanceof Error ? error.message : '清单项更新失败',
        icon: 'none'
      })
    },
    onSettled: () => {
      if (shoppingListId) {
        void queryClient.invalidateQueries({ queryKey: ['shopping-list', shoppingListId] })
      }
    }
  })

  const copyMutation = useMutation({
    mutationFn: () => shoppingService.createShoppingListCopyText(shoppingListId)
  })
  const shareMutation = useMutation({
    mutationFn: () => shoppingService.createShoppingListShareImage(shoppingListId)
  })

  const detail = detailQuery.data
  const visibleItems = activeTab === 'ingredient' ? detail?.ingredientItems || [] : detail?.seasoningItems || []
  const allItems = useMemo(
    () => (detail ? [...detail.ingredientItems, ...detail.seasoningItems] : []),
    [detail]
  )
  const progressPercent = detail?.totalItemCount
    ? Math.round((detail.checkedItemCount / detail.totalItemCount) * 100)
    : 0

  const handleGenerate = async () => {
    try {
      const result = await generateMutation.mutateAsync()
      setShoppingListId(result.shoppingListId)
      setShareResult(null)
      setShareStatusText('')
      Taro.showToast({
        title: result.archivedListIds.length ? `已生成 V${result.versionNo}` : '清单已生成',
        icon: 'success'
      })
    } catch (error) {
      Taro.showModal({
        title: '暂时无法生成清单',
        content: error instanceof Error ? error.message : '请确认本周菜单已有菜谱后再生成购物清单。',
        showCancel: false
      })
    }
  }

  const handleRegenerate = async () => {
    const result = await Taro.showModal({
      title: '重新生成清单？',
      content: '后端会基于当前周菜单生成新版本；旧清单会归档，可匹配的勾选和备注会自动继承。',
      confirmText: '生成新版'
    })

    if (result.confirm) {
      await handleGenerate()
    }
  }

  const handleToggleItem = (item: ShoppingListItemDTO) => {
    void itemMutation.mutateAsync({
      itemId: item.id,
      payload: {
        isChecked: !item.isChecked
      }
    })
  }

  const handleSaveNote = (item: ShoppingListItemDTO) => {
    const draft = noteDrafts[item.id]
    const nextNote = draft === undefined ? item.quantityNote || '' : draft

    void itemMutation.mutateAsync({
      itemId: item.id,
      payload: {
        quantityNote: nextNote.trim() || null
      }
    })
  }

  const handleBulkUpdate = async (mode: 'all' | 'invert' | 'clear') => {
    if (!allItems.length) {
      return
    }

    if (mode === 'clear') {
      const result = await Taro.showModal({
        title: '清空已购状态？',
        content: '所有已勾选的清单项都会恢复为未购买状态，备注会保留。',
        confirmText: '清空',
        confirmColor: '#ba1a1a'
      })

      if (!result.confirm) {
        return
      }
    }

    const targets =
      mode === 'clear'
        ? allItems.filter((item) => item.isChecked).map((item) => ({ item, checked: false }))
        : allItems.map((item) => ({ item, checked: mode === 'all' ? true : !item.isChecked }))

    if (!targets.length) {
      Taro.showToast({ title: '没有需要更新的项', icon: 'none' })
      return
    }

    Taro.showLoading({ title: '正在更新' })
    try {
      await Promise.all(
        targets.map(({ item, checked }) => shoppingService.updateShoppingListItem(item.id, { isChecked: checked }))
      )
      await queryClient.invalidateQueries({ queryKey: ['shopping-list', shoppingListId] })
      Taro.showToast({ title: '已更新清单', icon: 'success' })
    } catch (error) {
      Taro.showToast({
        title: error instanceof Error ? error.message : '批量更新失败',
        icon: 'none'
      })
    } finally {
      Taro.hideLoading()
    }
  }

  const handleCopyText = async () => {
    try {
      const result = await copyMutation.mutateAsync()
      await Taro.setClipboardData({ data: result.text })
      Taro.showToast({ title: '已复制清单', icon: 'success' })
    } catch (error) {
      Taro.showToast({
        title: error instanceof Error ? error.message : '复制失败',
        icon: 'none'
      })
    }
  }

  const handleShareImage = async () => {
    setShareStatusText('分享图生成中...')
    setShareResult(null)

    try {
      const result = await shareMutation.mutateAsync()
      setShareResult(result)
      setShareStatusText(result.taskAccepted ? '分享图任务已提交，稍后回来查看。' : '分享图已生成，可在下方预览。')
    } catch (error) {
      setShareStatusText('')
      Taro.showToast({
        title: error instanceof Error ? error.message : '分享图生成失败',
        icon: 'none'
      })
    }
  }

  if (!shoppingListId) {
    return (
      <PageContainer title="购物清单" subtitle="先按本周菜单生成一版清单" showBack>
        <View className="page-stack">
          <View className={styles.generateHero}>
            <Text className="eyebrow">Shopping Snapshot</Text>
            <Text className={styles.heroTitle}>把 {weekStartDate} 这一周的菜单，整理成可勾选的备菜清单。</Text>
            <Text className={styles.heroDescription}>生成逻辑由后端完成：自动聚合原料与调料、保留版本快照，并在重复生成时归档旧清单。</Text>
            <View className={`${styles.primaryAction} ${generateMutation.isPending ? styles.actionDisabled : ''}`} onClick={() => !generateMutation.isPending && void handleGenerate()}>
              <Text>{generateMutation.isPending ? '生成中...' : '生成购物清单'}</Text>
            </View>
          </View>
        </View>
      </PageContainer>
    )
  }

  if (detailQuery.isLoading) {
    return (
      <PageContainer title="购物清单" subtitle="正在整理本周备菜" showBack>
        <LoadingState title="清单加载中" description="后端快照正在端上来，马上就能开始勾选。" />
      </PageContainer>
    )
  }

  if (!detail || detailQuery.isError) {
    return (
      <PageContainer title="购物清单" subtitle="暂时无法读取清单" showBack>
        <ErrorState
          title="购物清单没取到"
          description="可以重试一次，或返回点菜台重新生成本周清单。"
          onAction={() => void detailQuery.refetch()}
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer title="购物清单" subtitle={`本周备菜快照 V${detail.versionNo}`} showBack>
      <View className="page-stack">
        <View className={styles.summaryCard}>
          <View className={styles.summaryHeader}>
            <View>
              <Text className="eyebrow">Week of {detail.weekStartDate}</Text>
              <Text className={styles.summaryTitle}>已购 {detail.checkedItemCount} / {detail.totalItemCount} 项</Text>
            </View>
            <View className={detail.status === 'active' ? styles.statusPill : styles.statusPillMuted}>
              <Text>{detail.status === 'active' ? '当前清单' : '已归档'}</Text>
            </View>
          </View>
          <View className={styles.progressTrack}>
            <View className={styles.progressFill} style={{ width: `${progressPercent}%` }} />
          </View>
          <Text className={styles.summaryMeta}>
            生成于 {dayjs(detail.generatedAt).format('M月D日 HH:mm')} · 原料 {detail.ingredientItems.length} 项 · 调料 {detail.seasoningItems.length} 项
          </Text>
          {detail.menuChangedAfterGenerated ? (
            <Text className={styles.warningText}>本周菜单在清单生成后有变更，建议重新生成新版清单。</Text>
          ) : null}
        </View>

        <View className={styles.tabBar}>
          {TAB_OPTIONS.map((tab) => (
            <View
              className={`${styles.tabItem} ${activeTab === tab.key ? styles.tabItemActive : ''}`}
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
            >
              <Text>{tab.label}</Text>
            </View>
          ))}
        </View>

        {!visibleItems.length ? (
          <EmptyState title="这一栏还没有清单项" description="后端生成的快照里暂时没有对应分组，可以重新生成或返回点菜台补充菜单。" />
        ) : (
          <View className={styles.itemList}>
            {visibleItems.map((item) => {
              const noteValue = noteDrafts[item.id] ?? item.quantityNote ?? ''
              const noteChanged = noteValue !== (item.quantityNote ?? '')

              return (
                <View className={styles.itemCard} key={item.id}>
                  <View className={styles.itemMain}>
                    <View
                      className={`${styles.checkBox} ${item.isChecked ? styles.checkBoxChecked : ''}`}
                      onClick={() => handleToggleItem(item)}
                    >
                      <Text>{item.isChecked ? '✓' : ''}</Text>
                    </View>
                    <View className={styles.itemContent}>
                      <Text className={`${styles.itemName} ${item.isChecked ? styles.itemNameChecked : ''}`}>{item.displayName}</Text>
                      <Text className={styles.itemMeta}>{getItemSourceText(item)} · 共 {item.sourceCount} 道菜用到</Text>
                    </View>
                  </View>
                  <View className={styles.noteRow}>
                    <Input
                      className={styles.noteInput}
                      placeholder="数量备注，例如 500g / 一把"
                      value={noteValue}
                      onInput={(event) => {
                        setNoteDrafts((current) => ({
                          ...current,
                          [item.id]: event.detail.value
                        }))
                      }}
                    />
                    <View
                      className={`${styles.noteSave} ${noteChanged ? styles.noteSaveActive : ''}`}
                      onClick={() => handleSaveNote(item)}
                    >
                      <Text>{itemMutation.isPending && noteChanged ? '保存中' : '保存'}</Text>
                    </View>
                  </View>
                </View>
              )
            })}
          </View>
        )}

        <View className={styles.actionPanel}>
          <View className={styles.actionGrid}>
            <View className={styles.secondaryAction} onClick={() => void handleBulkUpdate('all')}>
              <Text>全选</Text>
            </View>
            <View className={styles.secondaryAction} onClick={() => void handleBulkUpdate('invert')}>
              <Text>反选</Text>
            </View>
            <View className={styles.dangerAction} onClick={() => void handleBulkUpdate('clear')}>
              <Text>清空已购</Text>
            </View>
          </View>
          <View className={styles.actionGrid}>
            <View className={styles.secondaryAction} onClick={() => void handleRegenerate()}>
              <Text>{generateMutation.isPending ? '生成中...' : '生成新版'}</Text>
            </View>
            <View className={styles.primaryAction} onClick={() => void handleCopyText()}>
              <Text>{copyMutation.isPending ? '复制中...' : '复制文本'}</Text>
            </View>
            <View className={styles.primaryAction} onClick={() => void handleShareImage()}>
              <Text>{shareMutation.isPending ? '生成中...' : '生成分享图'}</Text>
            </View>
          </View>
        </View>

        {shareStatusText ? (
          <View className={styles.shareCard}>
            <View className={styles.shareHeader}>
              <SvgIcon className={styles.shareIcon} name="wenjian" size={24} color={svgIconColors.primary} />
              <Text className={styles.shareTitle}>{shareStatusText}</Text>
            </View>
            {shareResult?.imageDataUrl ? (
              <Image className={styles.sharePreview} mode="aspectFit" src={shareResult.imageDataUrl} />
            ) : null}
          </View>
        ) : null}
      </View>
    </PageContainer>
  )
}
