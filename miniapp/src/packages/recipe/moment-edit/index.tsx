import { useEffect, useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Image, Input, Picker, Text, Textarea, View } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import dayjs from 'dayjs'
import { PageContainer } from '@/components/base/PageContainer'
import { ErrorState } from '@/components/base/ErrorState'
import { LoadingState } from '@/components/base/LoadingState'
import { useAppQuery as useQuery } from '@/hooks/useAppQuery'
import { usePageShowRefetch } from '@/hooks/usePageShowRefetch'
import { momentService } from '@/services/modules/moment'
import { recipeService } from '@/services/modules/recipe'
import type { MediaAssetDTO } from '@/services/types/media'
import {
  chooseMomentImageDrafts,
  getMomentUploadErrorMessage,
  uploadMomentImages,
  type LocalImageDraft
} from '@/utils/media-upload'
import { getSafeImageUrl, isUsableImageUrl } from '@/utils/media-url'
import { queryClient } from '@/utils/query-client'
import { redirectToRoute } from '@/utils/navigation'
import styles from './index.module.scss'

const RATING_OPTIONS = [1, 2, 3, 4, 5]
const EMPTY_VERSION_OPTIONS: NonNullable<Awaited<ReturnType<typeof recipeService.getRecipeVersions>>['items']> = []
const DEFAULT_MOMENT_IMAGE_URL =
  'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1200&q=80'

export default function MomentEditPage() {
  const router = useRouter()
  const recipeId = router.params.recipeId || ''
  const versionId = router.params.versionId || ''
  const momentId = router.params.momentId || ''
  const isEditMode = Boolean(momentId)

  const [selectedVersionId, setSelectedVersionId] = useState(versionId)
  const [occurredOn, setOccurredOn] = useState(dayjs().format('YYYY-MM-DD'))
  const [content, setContent] = useState('')
  const [participantsText, setParticipantsText] = useState('')
  const [tasteRating, setTasteRating] = useState(5)
  const [difficultyRating, setDifficultyRating] = useState(3)
  const [isCoverCandidate, setIsCoverCandidate] = useState(true)
  const [uploadedImages, setUploadedImages] = useState<MediaAssetDTO[]>([])
  const [pendingImages, setPendingImages] = useState<LocalImageDraft[]>([])
  const [formError, setFormError] = useState('')

  const detailQuery = useQuery({
    queryKey: ['recipe-detail', recipeId],
    queryFn: () => recipeService.getRecipeDetail(recipeId),
    enabled: Boolean(recipeId)
  })
  const versionsQuery = useQuery({
    queryKey: ['recipe-versions', recipeId],
    queryFn: () => recipeService.getRecipeVersions(recipeId, { page: 1, pageSize: 20 }),
    enabled: Boolean(recipeId)
  })
  const editMomentQuery = useQuery({
    queryKey: ['recipe-moment-edit', recipeId, momentId],
    queryFn: async () => {
      const result = await momentService.getRecipeMoments(recipeId, { page: 1, pageSize: 100 })
      return result.items.find((item) => item.id === momentId) || null
    },
    enabled: Boolean(recipeId && momentId)
  })

  usePageShowRefetch([detailQuery, versionsQuery, isEditMode ? editMomentQuery : null])

  useEffect(() => {
    if (!detailQuery.data?.currentVersion || selectedVersionId) {
      return
    }

    setSelectedVersionId(versionId || detailQuery.data.currentVersion.id)
  }, [detailQuery.data, selectedVersionId, versionId])

  useEffect(() => {
    if (!isEditMode || !editMomentQuery.data) {
      return
    }

    setSelectedVersionId(editMomentQuery.data.recipeVersion?.id || versionId || detailQuery.data?.currentVersion?.id || '')
    setOccurredOn(editMomentQuery.data.occurredOn)
    setContent(editMomentQuery.data.content)
    setParticipantsText(editMomentQuery.data.participantsText || '')
    setTasteRating(editMomentQuery.data.tasteRating)
    setDifficultyRating(editMomentQuery.data.difficultyRating)
    setUploadedImages(editMomentQuery.data.images)
    setPendingImages([])
    setFormError('')
  }, [detailQuery.data?.currentVersion?.id, editMomentQuery.data, isEditMode, versionId])

  const saveMomentMutation = useMutation({
    mutationFn: async () => {
      if (!selectedVersionId) {
        throw new Error('请先选择记录对应的版本')
      }

      if (!content.trim()) {
        throw new Error('请写下这次做菜的感受')
      }

      const uploadedDraftImages = pendingImages.length ? await uploadMomentImages(pendingImages) : []
      const allImages = [...uploadedImages, ...uploadedDraftImages]
      const payload = {
        recipeVersionId: selectedVersionId,
        occurredOn,
        content: content.trim(),
        participantsText: participantsText.trim() || undefined,
        tasteRating,
        difficultyRating,
        isCoverCandidate,
        imageAssetIds: allImages.map((item) => item.id)
      }

      if (isEditMode) {
        return momentService.updateMoment(momentId, payload)
      }

      return momentService.createMoment(recipeId, payload)
    }
  })

  const versionOptions = versionsQuery.data?.items ?? EMPTY_VERSION_OPTIONS
  const activeMoment = editMomentQuery.data
  const pageTitle = isEditMode ? '编辑食光' : '记一笔'

  const selectedVersionLabel = useMemo(() => {
    const matched = versionOptions.find((item) => item.id === selectedVersionId)
    if (matched) {
      return `V${matched.versionNumber}${matched.versionName ? ` · ${matched.versionName}` : ''}`
    }

    if (detailQuery.data?.currentVersion) {
      return `V${detailQuery.data.currentVersion.versionNumber}${detailQuery.data.currentVersion.versionName ? ` · ${detailQuery.data.currentVersion.versionName}` : ''}`
    }

    return '请选择版本'
  }, [detailQuery.data?.currentVersion, selectedVersionId, versionOptions])

  const totalImageCount = uploadedImages.length + pendingImages.length

  const chooseImages = async () => {
    try {
      const drafts = await chooseMomentImageDrafts(totalImageCount)
      setPendingImages((current) => [...current, ...drafts])
      setFormError('')
    } catch (error) {
      const rawMessage =
        error instanceof Error ? error.message : String((error as { errMsg?: string })?.errMsg || '')

      if (/cancel/i.test(rawMessage)) {
        return
      }

      const message = getMomentUploadErrorMessage(error)
      setFormError(message)
      Taro.showToast({
        title: message,
        icon: 'none'
      })
    }
  }

  const previewImages = async (currentUrl: string) => {
    const urls = [
      ...uploadedImages.map((item) => item.assetUrl).filter(isUsableImageUrl),
      ...pendingImages.map((item) => item.filePath).filter(isUsableImageUrl)
    ]

    if (!urls.length) {
      return
    }

    await Taro.previewImage({
      current: isUsableImageUrl(currentUrl) ? currentUrl : urls[0],
      urls
    })
  }

  const handleSubmit = async () => {
    try {
      setFormError('')
      const savedMoment = await saveMomentMutation.mutateAsync()

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['recipe-detail', recipeId] }),
        queryClient.invalidateQueries({ queryKey: ['recipe-moments', recipeId] }),
        queryClient.invalidateQueries({ queryKey: ['recipe-moment-edit', recipeId, momentId] }),
        queryClient.invalidateQueries({ queryKey: ['moments', 'latest'] }),
        queryClient.invalidateQueries({ queryKey: ['recipes'] })
      ])

      Taro.showToast({
        title: isEditMode ? '时光记录已更新' : '时光记录已保存',
        icon: 'success'
      })

      setTimeout(() => {
        void redirectToRoute('/packages/recipe/detail/index', {
          id: recipeId,
          tab: 'moments',
          momentId: savedMoment.id
        })
      }, 240)
    } catch (error) {
      const message = getMomentUploadErrorMessage(error)
      setFormError(message)
      Taro.showToast({
        title: message,
        icon: 'none'
      })
    }
  }

  if (detailQuery.isLoading || versionsQuery.isLoading || (isEditMode && editMomentQuery.isLoading)) {
    return (
      <PageContainer title={pageTitle} subtitle="正在摆好这次下厨的细节" showBack>
        <LoadingState title="时光表单准备中" description="菜谱版本、日期和历史记录正在同步。" />
      </PageContainer>
    )
  }

  if (!detailQuery.data || detailQuery.isError || versionsQuery.isError || (isEditMode && !activeMoment && editMomentQuery.isError)) {
    return (
      <PageContainer title={pageTitle} subtitle="暂时无法进入编辑" showBack>
        <ErrorState
          title="时光记录页面没打开"
          description="这次没拿到需要的菜谱或记录信息，可以返回详情页后重试。"
          onAction={() => {
            void detailQuery.refetch()
            void versionsQuery.refetch()
            if (isEditMode) {
              void editMomentQuery.refetch()
            }
          }}
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer
      title={pageTitle}
      subtitle={isEditMode ? '把这次的味道、照片和当天的人一起补完整' : `为 ${detailQuery.data.name} 记下一次开火`}
      showBack
    >
      <View className="page-stack">
        <View className={styles.sectionCard}>
          <Text className="section-title">记录信息</Text>
          <View className={styles.fieldGrid}>
            <View className={styles.fieldCard}>
              <Text className={styles.fieldLabel}>对应版本</Text>
              <View className={styles.optionWrap}>
                {versionOptions.map((item) => (
                  <View
                    className={`${styles.optionChip} ${selectedVersionId === item.id ? styles.optionChipActive : ''}`}
                    key={item.id}
                    onClick={() => setSelectedVersionId(item.id)}
                  >
                    <Text>
                      V{item.versionNumber}
                      {item.versionName ? ` · ${item.versionName}` : ''}
                    </Text>
                  </View>
                ))}
              </View>
              <Text className={styles.fieldHint}>当前选择：{selectedVersionLabel}</Text>
            </View>

            <View className={styles.fieldRow}>
              <View className={styles.fieldCard}>
                <Text className={styles.fieldLabel}>做菜日期</Text>
                <Picker mode="date" value={occurredOn} onChange={(event) => setOccurredOn(event.detail.value)}>
                  <View className={styles.pickerField}>
                    <Text>{dayjs(occurredOn).format('YYYY 年 M 月 D 日')}</Text>
                  </View>
                </Picker>
              </View>

              <View className={styles.fieldCard}>
                <Text className={styles.fieldLabel}>一起吃饭的人</Text>
                <Input
                  className={styles.input}
                  maxlength={40}
                  placeholder="比如：全家、朋友聚餐"
                  value={participantsText}
                  onInput={(event) => setParticipantsText(event.detail.value)}
                />
              </View>
            </View>

            <View className={styles.fieldCard}>
              <Text className={styles.fieldLabel}>这次做得怎么样</Text>
              <Textarea
                className={styles.textarea}
                maxlength={500}
                placeholder="写下这次的口感、火候、翻车点或者谁夸了一句。"
                value={content}
                onInput={(event) => setContent(event.detail.value)}
              />
            </View>
          </View>
        </View>

        <View className={styles.sectionCard}>
          <Text className="section-title">评分与封面</Text>
          <View className={styles.fieldGrid}>
            <View className={styles.fieldCard}>
              <Text className={styles.fieldLabel}>风味评分</Text>
              <View className={styles.optionWrap}>
                {RATING_OPTIONS.map((item) => (
                  <View
                    className={`${styles.optionChip} ${tasteRating === item ? styles.optionChipActive : ''}`}
                    key={`taste-${item}`}
                    onClick={() => setTasteRating(item)}
                  >
                    <Text>{item} 分</Text>
                  </View>
                ))}
              </View>
            </View>

            <View className={styles.fieldCard}>
              <Text className={styles.fieldLabel}>难度评分</Text>
              <View className={styles.optionWrap}>
                {RATING_OPTIONS.map((item) => (
                  <View
                    className={`${styles.optionChip} ${difficultyRating === item ? styles.optionChipActive : ''}`}
                    key={`difficulty-${item}`}
                    onClick={() => setDifficultyRating(item)}
                  >
                    <Text>{item} 分</Text>
                  </View>
                ))}
              </View>
            </View>

            <View className={styles.fieldCard}>
              <Text className={styles.fieldLabel}>是否用这条记录做封面候选</Text>
              <View className={styles.optionWrap}>
                <View
                  className={`${styles.optionChip} ${isCoverCandidate ? styles.optionChipActive : ''}`}
                  onClick={() => setIsCoverCandidate(true)}
                >
                  <Text>是，优先拿这次照片</Text>
                </View>
                <View
                  className={`${styles.optionChip} ${!isCoverCandidate ? styles.optionChipActive : ''}`}
                  onClick={() => setIsCoverCandidate(false)}
                >
                  <Text>否，只记录不改封面</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View className={styles.sectionCard}>
          <View className={styles.sectionHeader}>
            <Text className="section-title">图片</Text>
            <Text className={styles.fieldHint}>最多 9 张，保存时会按接口链路依次上传并登记。</Text>
          </View>

          <View className={styles.imageGrid}>
            {uploadedImages.map((image) => (
              <View className={styles.imageCard} key={image.id}>
                <Image
                  className={styles.image}
                  mode="aspectFill"
                  src={getSafeImageUrl(image.assetUrl, DEFAULT_MOMENT_IMAGE_URL)}
                  onClick={() => void previewImages(image.assetUrl)}
                />
                <View
                  className={styles.removeBadge}
                  onClick={() => setUploadedImages((current) => current.filter((item) => item.id !== image.id))}
                >
                  <Text>删除</Text>
                </View>
              </View>
            ))}

            {pendingImages.map((image) => (
              <View className={styles.imageCard} key={image.filePath}>
                <Image className={styles.image} mode="aspectFill" src={image.filePath} onClick={() => void previewImages(image.filePath)} />
                <View className={styles.pendingBadge}>
                  <Text>待上传</Text>
                </View>
                <View
                  className={styles.removeBadge}
                  onClick={() => setPendingImages((current) => current.filter((item) => item.filePath !== image.filePath))}
                >
                  <Text>删除</Text>
                </View>
              </View>
            ))}

            {totalImageCount < 9 ? (
              <View className={styles.addImageCard} onClick={() => void chooseImages()}>
                <Text className={styles.addImageText}>+ 添加图片</Text>
              </View>
            ) : null}
          </View>
        </View>

        {formError ? (
          <View className={styles.errorBanner}>
            <Text>{formError}</Text>
          </View>
        ) : null}

        <View className={styles.actionRow}>
          <View className={`${styles.actionButton} secondary-button`} onClick={() => Taro.navigateBack()}>
            <Text>先不记了</Text>
          </View>
          <View className={`${styles.actionButton} primary-button`} onClick={() => void handleSubmit()}>
            <Text>{saveMomentMutation.isPending ? '正在保存...' : isEditMode ? '保存修改' : '保存记录'}</Text>
          </View>
        </View>
      </View>
    </PageContainer>
  )
}
