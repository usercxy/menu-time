import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Image, Input, Text, Textarea, View } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { EmptyState } from '@/components/base/EmptyState'
import { LoadingState } from '@/components/base/LoadingState'
import { PageContainer } from '@/components/base/PageContainer'
import { routes } from '@/constants/routes'
import { useAppQuery as useQuery } from '@/hooks/useAppQuery'
import { usePageShowRefetch } from '@/hooks/usePageShowRefetch'
import { queryClient } from '@/utils/query-client'
import { buildOptimisticRecipeDetail, buildOptimisticRecipeVersions } from '@/utils/recipe-cache'
import { recipeService } from '@/services/modules/recipe'
import { taxonomyService } from '@/services/modules/taxonomy'
import { redirectToRoute } from '@/utils/navigation'
import {
  chooseRecipeCoverDraft,
  getRecipeCoverUploadErrorMessage,
  uploadRecipeCover,
  type LocalImageDraft
} from '@/utils/media-upload'
import { validateCreateRecipeForm } from '@/utils/recipe-form'
import type { RecipeDetailDTO, UpdateRecipePayload } from '@/services/types/recipe'
import styles from './index.module.scss'

export default function RecipeEditPage() {
  const router = useRouter()
  const recipeId = router.params.id || ''
  const isEditMode = Boolean(recipeId)
  const hasHydratedForm = useRef(false)
  const [name, setName] = useState('')
  const [versionName, setVersionName] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newTagNamesInput, setNewTagNamesInput] = useState('')
  const [ingredients, setIngredients] = useState([''])
  const [steps, setSteps] = useState([''])
  const [tips, setTips] = useState('')
  const [coverDraft, setCoverDraft] = useState<LocalImageDraft | null>(null)
  const [isUploadingCover, setIsUploadingCover] = useState(false)
  const [coverError, setCoverError] = useState('')
  const [formError, setFormError] = useState('')

  const detailQuery = useQuery({
    queryKey: ['recipe-detail', recipeId],
    queryFn: () => recipeService.getRecipeDetail(recipeId),
    enabled: isEditMode
  })
  const categoriesQuery = useQuery({
    queryKey: ['taxonomy', 'categories'],
    queryFn: taxonomyService.getCategories
  })
  const tagsQuery = useQuery({
    queryKey: ['taxonomy', 'tags'],
    queryFn: taxonomyService.getTags
  })

  usePageShowRefetch([detailQuery, categoriesQuery, tagsQuery])

  const hydrateForm = (detail: RecipeDetailDTO) => {
    const currentVersion = detail.currentVersion
    setName(detail.name)
    setVersionName(currentVersion?.versionName || (currentVersion ? `V${currentVersion.versionNumber}` : ''))
    setSelectedCategoryId(currentVersion?.category?.id || null)
    setSelectedTagIds(currentVersion?.tags.map((tag) => tag.id) || [])
    setNewCategoryName('')
    setNewTagNamesInput('')
    setIngredients(currentVersion?.ingredients.length ? currentVersion.ingredients.map((item) => item.rawText) : [''])
    setSteps(currentVersion?.steps.length ? currentVersion.steps.map((item) => item.content) : [''])
    setTips(currentVersion?.tips || '')
    setCoverDraft(null)
    setCoverError('')
    setFormError('')
  }

  useEffect(() => {
    if (!isEditMode || !detailQuery.data || hasHydratedForm.current) {
      return
    }

    hasHydratedForm.current = true
    hydrateForm(detailQuery.data)
  }, [detailQuery.data, isEditMode])

  const selectedCategory = useMemo(
    () => categoriesQuery.data?.find((item) => item.id === selectedCategoryId) || null,
    [categoriesQuery.data, selectedCategoryId]
  )

  const createMutation = useMutation({
    mutationFn: recipeService.createRecipe
  })

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateRecipePayload) => recipeService.updateRecipe(recipeId, payload)
  })

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((current) =>
      current.includes(tagId) ? current.filter((item) => item !== tagId) : [...current, tagId]
    )
  }

  const updateListItem = (setter: Dispatch<SetStateAction<string[]>>, index: number, value: string) => {
    setter((current) => current.map((item, itemIndex) => (itemIndex === index ? value : item)))
  }

  const removeListItem = (setter: Dispatch<SetStateAction<string[]>>, index: number) => {
    setter((current) => current.filter((_, itemIndex) => itemIndex !== index))
  }

  const addListItem = (setter: Dispatch<SetStateAction<string[]>>) => {
    setter((current) => [...current, ''])
  }

  const chooseCover = async () => {
    try {
      const nextCoverDraft = await chooseRecipeCoverDraft()
      if (!nextCoverDraft) {
        return
      }

      setCoverDraft(nextCoverDraft)
      setCoverError('')
      setFormError('')
    } catch (error) {
      const rawMessage =
        error instanceof Error ? error.message : String((error as { errMsg?: string })?.errMsg || '')

      if (/cancel/i.test(rawMessage)) {
        return
      }

      const message = getRecipeCoverUploadErrorMessage(error)
      setCoverError(message)
      Taro.showToast({
        title: message,
        icon: 'none'
      })
    }
  }

  const clearPendingCover = () => {
    setCoverDraft(null)
    setCoverError('')
  }

  const previewCover = async (url: string) => {
    if (!url) {
      return
    }

    await Taro.previewImage({
      urls: [url],
      current: url
    })
  }

  const uploadPendingCover = async () => {
    if (!coverDraft) {
      return null
    }

    setIsUploadingCover(true)

    try {
      return await uploadRecipeCover(coverDraft)
    } finally {
      setIsUploadingCover(false)
    }
  }

  const resetForm = () => {
    if (isEditMode && detailQuery.data) {
      hydrateForm(detailQuery.data)
      return
    }

    setName('')
    setVersionName('')
    setSelectedCategoryId(null)
    setSelectedTagIds([])
    setNewCategoryName('')
    setNewTagNamesInput('')
    setIngredients([''])
    setSteps([''])
    setTips('')
    setCoverDraft(null)
    setCoverError('')
    setFormError('')
  }

  const handleSubmit = async () => {
    const parsed = validateCreateRecipeForm({
      name,
      versionName,
      selectedCategoryId,
      newCategoryName,
      selectedTagIds,
      newTagNamesInput,
      ingredients,
      steps,
      tips
    })

    if (!parsed.success) {
      setFormError(parsed.message || '请检查表单内容')
      return
    }

    setFormError('')
    setCoverError('')

    if (isEditMode) {
      let coverUploadFailed = false
      let updatePayload: UpdateRecipePayload = {
        name: parsed.data.name
      }

      if (coverDraft) {
        try {
          const uploadedCover = await uploadPendingCover()
          if (uploadedCover) {
            updatePayload = {
              ...updatePayload,
              coverImageId: uploadedCover.id,
              coverSource: 'custom'
            }
          }
        } catch (error) {
          coverUploadFailed = true
          setCoverError(getRecipeCoverUploadErrorMessage(error))
        }
      }

      try {
        const updatedDetail = await updateMutation.mutateAsync(updatePayload)
        queryClient.setQueryData(['recipe-detail', recipeId], updatedDetail)
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['recipe-detail', recipeId] }),
          queryClient.invalidateQueries({ queryKey: ['recipes'] })
        ])

        if (coverUploadFailed) {
          Taro.showToast({
            title: '基础信息已保存，封面待重试',
            icon: 'none'
          })
          return
        }

        setCoverDraft(null)
        Taro.showToast({
          title: '菜谱档案已更新',
          icon: 'success'
        })

        setTimeout(() => {
          void redirectToRoute(routes.recipeDetail, { id: recipeId })
        }, 220)
      } catch (error) {
        setFormError(error instanceof Error ? error.message : '更新失败，请稍后重试。')
      }
      return
    }

    let result: Awaited<ReturnType<typeof recipeService.createRecipe>>
    try {
      result = await createMutation.mutateAsync(parsed.data)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : '保存失败，请稍后重试。')
      return
    }

    let uploadedCoverAsset: Awaited<ReturnType<typeof uploadRecipeCover>> | null = null

    if (coverDraft) {
      try {
        uploadedCoverAsset = await uploadPendingCover()
        if (uploadedCoverAsset) {
          await recipeService.updateRecipe(result.recipeId, {
            coverImageId: uploadedCoverAsset.id,
            coverSource: 'custom'
          })
        }
      } catch (error) {
        const message = getRecipeCoverUploadErrorMessage(error)
        const optimisticDetail = buildOptimisticRecipeDetail(
          parsed.data,
          result,
          categoriesQuery.data || [],
          tagsQuery.data || []
        )

        queryClient.setQueryData(['recipe-detail', result.recipeId], optimisticDetail)
        queryClient.setQueryData(
          ['recipe-versions', result.recipeId],
          buildOptimisticRecipeVersions(parsed.data, result, categoriesQuery.data || [], tagsQuery.data || [])
        )

        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['recipes'] }),
          queryClient.invalidateQueries({ queryKey: ['meal-plan', 'current-week'] })
        ])

        setCoverError(message)
        Taro.showToast({
          title: '菜谱已创建，请补传封面',
          icon: 'none'
        })

        setTimeout(() => {
          void redirectToRoute(routes.recipeEdit, { id: result.recipeId })
        }, 220)
        return
      }
    }

    const optimisticDetail = buildOptimisticRecipeDetail(
      parsed.data,
      result,
      categoriesQuery.data || [],
      tagsQuery.data || []
    )

    if (uploadedCoverAsset) {
      optimisticDetail.coverImageUrl = uploadedCoverAsset.assetUrl
      optimisticDetail.coverSource = 'custom'
    }

    queryClient.setQueryData(['recipe-detail', result.recipeId], optimisticDetail)
    queryClient.setQueryData(
      ['recipe-versions', result.recipeId],
      buildOptimisticRecipeVersions(parsed.data, result, categoriesQuery.data || [], tagsQuery.data || [])
    )

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['recipes'] }),
      queryClient.invalidateQueries({ queryKey: ['meal-plan', 'current-week'] })
    ])

    setCoverDraft(null)
    Taro.showToast({
      title: '菜谱已入库',
      icon: 'success'
    })

    setTimeout(() => {
      void redirectToRoute(routes.recipeDetail, { id: result.recipeId })
    }, 220)
  }

  const submitPending = isUploadingCover || (isEditMode ? updateMutation.isPending : createMutation.isPending)

  if (isEditMode && detailQuery.isLoading) {
    return (
      <PageContainer title="编辑菜谱" subtitle="正在读取基础档案" showBack>
        <LoadingState title="菜谱档案加载中" description="先把这道菜的基础信息翻出来，马上就能开始修改。" />
      </PageContainer>
    )
  }

  if (isEditMode && !detailQuery.data && detailQuery.isError) {
    return (
      <PageContainer title="编辑菜谱" subtitle="没有找到这道菜" showBack>
        <EmptyState title="菜谱基础信息暂不可编辑" description="请从详情页重新进入，或稍后再试。" />
      </PageContainer>
    )
  }

  const detail = detailQuery.data
  const coverPreviewUrl = coverDraft?.filePath || detail?.coverImageUrl || ''
  const hasRemoteCover = Boolean(detail?.coverImageUrl)
  const coverStatusText = coverDraft
    ? `待上传 · ${coverDraft.width} x ${coverDraft.height}`
    : hasRemoteCover
      ? detail?.coverSource === 'custom'
        ? '当前使用自定义封面'
        : '当前封面由系统回填'
      : '还没有封面图'
  const coverDescription = coverDraft
    ? '保存时会按“申请授权 -> 直传存储 -> 登记资源 -> 绑定菜谱”完成联调。'
    : isEditMode
      ? '可从相册或相机选择一张图片，保存时会自动上传并绑定到当前菜谱。'
      : '创建成功后如果已选图片，会继续上传并补绑为这道菜的自定义封面。'

  return (
    <PageContainer
      title={isEditMode ? '编辑菜谱' : '新建菜谱'}
      subtitle={isEditMode ? '更新基础档案，不改历史版本' : '创建后会自动生成 V1'}
      showBack
    >
      <View className="page-stack">
        <View className={styles.introCard}>
          <Text className={styles.introTitle}>{isEditMode ? '先整理好这道菜的基础档案' : '先把这道菜记下来'}</Text>
          <Text className={styles.introDescription}>
            {isEditMode
              ? '编辑模式当前只更新菜名等基础信息；分类、标签和做法内容建议通过新建版本继续演进。'
              : '保存后会先创建菜谱，再按需补传封面，随后直接进入详情页继续整理版本和时光记录。'}
          </Text>
        </View>

        <View className={styles.sectionCard}>
          <View className={styles.sectionHeader}>
            <Text className="section-title">基础信息</Text>
            <Text className={styles.sectionHint}>
              {isEditMode ? '编辑模式先聚焦菜名与基础档案' : '名称必填，分类和标签可先留空'}
            </Text>
          </View>

          <View className={styles.fieldStack}>
            <View className={styles.fieldBlock}>
              <Text className={styles.fieldLabel}>封面图</Text>
              <View className={styles.coverCard}>
                {coverPreviewUrl ? (
                  <Image className={styles.coverPreview} mode="aspectFill" src={coverPreviewUrl} />
                ) : (
                  <View className={styles.coverPlaceholder}>
                    <Text className={styles.coverPlaceholderTitle}>给这道菜留一张封面</Text>
                    <Text className={styles.coverPlaceholderText}>JPG / PNG / WEBP，建议横图，保存时自动上传。</Text>
                  </View>
                )}

                <View className={styles.coverMeta}>
                  <Text className={styles.coverMetaTitle}>{coverStatusText}</Text>
                  <Text className={styles.coverMetaDescription}>{coverDescription}</Text>
                  <View className={styles.coverActionRow}>
                    <View className={styles.rowAction} onClick={() => void chooseCover()}>
                      <Text>{coverPreviewUrl ? '重新选择' : '选择图片'}</Text>
                    </View>
                    {coverPreviewUrl ? (
                      <View className={styles.rowAction} onClick={() => void previewCover(coverPreviewUrl)}>
                        <Text>预览</Text>
                      </View>
                    ) : null}
                    {coverDraft ? (
                      <View className={styles.rowAction} onClick={clearPendingCover}>
                        <Text>撤销选择</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </View>
              <Text className={styles.helpText}>封面会展示在菜谱详情、菜谱列表和首页卡片中。</Text>
              {coverError ? <Text className={styles.coverErrorText}>{coverError}</Text> : null}
            </View>

            <View className={styles.fieldBlock}>
              <View className={styles.labelRow}>
                <Text className={styles.fieldLabel}>菜谱名</Text>
                <Text className={styles.requiredBadge}>必填</Text>
              </View>
              <View className={styles.inputShell}>
                <Input
                  className={styles.textInput}
                  placeholder="例如：番茄炖牛腩"
                  placeholderClass={styles.inputPlaceholder}
                  value={name}
                  maxlength={24}
                  cursorSpacing={96}
                  onInput={(event) => setName(event.detail.value)}
                />
              </View>
              <Text className={styles.helpText}>必填，建议写清主食材或这道菜最有记忆点的做法。</Text>
            </View>

            {!isEditMode ? (
              <>
                <View className={styles.fieldBlock}>
                  <Text className={styles.fieldLabel}>分类</Text>
                  <View className={styles.chipList}>
                    {categoriesQuery.data?.map((category) => (
                      <View
                        className={`${styles.filterChip} ${selectedCategoryId === category.id ? styles.filterChipActive : ''}`}
                        key={category.id}
                        onClick={() =>
                          setSelectedCategoryId((current) =>
                            current === category.id ? null : category.id
                          )
                        }
                      >
                        <Text>{category.name}</Text>
                      </View>
                    ))}
                  </View>
                  <View className={styles.inputShell}>
                    <Input
                      className={styles.textInput}
                      placeholder="没有合适的分类？可临时输入新分类"
                      placeholderClass={styles.inputPlaceholder}
                      value={newCategoryName}
                      maxlength={12}
                      cursorSpacing={96}
                      onInput={(event) => setNewCategoryName(event.detail.value)}
                    />
                  </View>
                  {selectedCategory ? (
                    <Text className={styles.helpText}>当前已选分类：{selectedCategory.name}</Text>
                  ) : null}
                </View>

                <View className={styles.fieldBlock}>
                  <Text className={styles.fieldLabel}>标签</Text>
                  <View className={styles.chipList}>
                    {tagsQuery.data?.map((tag) => (
                      <View
                        className={`${styles.filterChip} ${selectedTagIds.includes(tag.id) ? styles.filterChipActive : ''}`}
                        key={tag.id}
                        onClick={() => toggleTag(tag.id)}
                      >
                        <Text>{tag.name}</Text>
                      </View>
                    ))}
                  </View>
                  <View className={styles.inputShell}>
                    <Input
                      className={styles.textInput}
                      placeholder="临时新标签，多个标签用逗号分隔"
                      placeholderClass={styles.inputPlaceholder}
                      value={newTagNamesInput}
                      cursorSpacing={96}
                      onInput={(event) => setNewTagNamesInput(event.detail.value)}
                    />
                  </View>
                  <Text className={styles.helpText}>已选 {selectedTagIds.length} 个标签</Text>
                </View>
              </>
            ) : detail ? (
              <View className={styles.previewCard}>
                <Text className={styles.fieldLabel}>当前版本快照</Text>
                <View className={styles.previewMetaGrid}>
                  <View className={styles.previewStat}>
                    <Text className={styles.previewStatValue}>{detail.versionCount}</Text>
                    <Text className={styles.previewStatLabel}>版本数</Text>
                  </View>
                  <View className={styles.previewStat}>
                    <Text className={styles.previewStatValue}>{detail.currentVersion?.ingredients.length || 0}</Text>
                    <Text className={styles.previewStatLabel}>主料行数</Text>
                  </View>
                  <View className={styles.previewStat}>
                    <Text className={styles.previewStatValue}>{detail.currentVersion?.steps.length || 0}</Text>
                    <Text className={styles.previewStatLabel}>步骤数</Text>
                  </View>
                </View>
                <View className={styles.chipList}>
                  {detail.currentVersion?.category ? (
                    <View className={styles.filterChip}>
                      <Text>{detail.currentVersion.category.name}</Text>
                    </View>
                  ) : null}
                  {(detail.currentVersion?.tags || []).map((tag) => (
                    <View className={styles.filterChip} key={tag.id}>
                      <Text>#{tag.name}</Text>
                    </View>
                  ))}
                </View>
                <Text className={styles.readOnlyNote}>
                  当前阶段的编辑页不改版本内容；如果要调整分类、标签、主料或步骤，请从详情页发起“写新版本”。
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {!isEditMode ? (
          <View className={styles.sectionCard}>
            <View className={styles.sectionHeader}>
              <Text className="section-title">当前版本内容</Text>
              <Text className={styles.sectionHint}>创建成功后自动生成 V1</Text>
            </View>

            <View className={styles.fieldStack}>
              <View className={styles.fieldBlock}>
                <Text className={styles.fieldLabel}>版本名</Text>
                <View className={styles.inputShell}>
                  <Input
                    className={styles.textInput}
                    placeholder="例如：家常版 / 少油版"
                    placeholderClass={styles.inputPlaceholder}
                    value={versionName}
                    maxlength={20}
                    cursorSpacing={96}
                    onInput={(event) => setVersionName(event.detail.value)}
                  />
                </View>
              </View>

              <View className={styles.fieldBlock}>
                <View className={styles.rowHeader}>
                  <Text className={styles.fieldLabel}>主料</Text>
                  <View className={styles.rowAction} onClick={() => addListItem(setIngredients)}>
                    <Text>新增一行</Text>
                  </View>
                </View>
                <View className={styles.repeaterStack}>
                  {ingredients.map((ingredient, index) => (
                    <View className={styles.repeaterCard} key={`ingredient-${index}`}>
                      <Text className={styles.repeaterIndex}>{index + 1}</Text>
                      <View className={`${styles.inputShell} ${styles.inlineInputShell}`}>
                        <Input
                          className={styles.inlineInput}
                          placeholder="例如：牛腩 500g"
                          placeholderClass={styles.inputPlaceholder}
                          value={ingredient}
                          cursorSpacing={96}
                          onInput={(event) => updateListItem(setIngredients, index, event.detail.value)}
                        />
                      </View>
                      <View className={styles.repeaterAction} onClick={() => removeListItem(setIngredients, index)}>
                        <Text>删除</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>

              <View className={styles.fieldBlock}>
                <View className={styles.rowHeader}>
                  <Text className={styles.fieldLabel}>步骤</Text>
                  <View className={styles.rowAction} onClick={() => addListItem(setSteps)}>
                    <Text>新增步骤</Text>
                  </View>
                </View>
                <View className={styles.repeaterStack}>
                  {steps.map((step, index) => (
                    <View className={styles.stepCard} key={`step-${index}`}>
                      <View className={styles.stepHeader}>
                        <Text className={styles.stepTitle}>步骤 {index + 1}</Text>
                        <View className={styles.repeaterAction} onClick={() => removeListItem(setSteps, index)}>
                          <Text>删除</Text>
                        </View>
                      </View>
                      <View className={`${styles.inputShell} ${styles.textareaShell}`}>
                        <Textarea
                          className={styles.textarea}
                          placeholder="例如：牛腩焯水后小火慢炖 40 分钟"
                          placeholderClass={styles.textareaPlaceholder}
                          value={step}
                          maxlength={200}
                          autoHeight
                          cursorSpacing={96}
                          onInput={(event) => updateListItem(setSteps, index, event.detail.value)}
                        />
                      </View>
                    </View>
                  ))}
                </View>
              </View>

              <View className={styles.fieldBlock}>
                <Text className={styles.fieldLabel}>小贴士</Text>
                <View className={`${styles.inputShell} ${styles.textareaShell}`}>
                  <Textarea
                    className={styles.textarea}
                    placeholder="记录火候、替换食材或失败经验，下次会更稳。"
                    placeholderClass={styles.textareaPlaceholder}
                    value={tips}
                    maxlength={240}
                    autoHeight
                    cursorSpacing={96}
                    onInput={(event) => setTips(event.detail.value)}
                  />
                </View>
              </View>
            </View>
          </View>
        ) : null}

        {formError ? <Text className={styles.errorText}>{formError}</Text> : null}

        <View className={styles.footerActions}>
          <View className="secondary-button" onClick={resetForm}>
            <Text>{isEditMode ? '恢复原值' : '清空重填'}</Text>
          </View>
          <View
            className={`primary-button ${styles.submitButton} ${submitPending ? styles.submitButtonDisabled : ''}`}
            onClick={() => {
              if (!submitPending) {
                void handleSubmit()
              }
            }}
          >
            <Text>
              {submitPending
                ? isUploadingCover
                  ? '上传封面中...'
                  : isEditMode
                    ? '更新中...'
                    : '保存中...'
                : isEditMode
                  ? '保存基础信息'
                  : '保存并查看详情'}
            </Text>
          </View>
        </View>
      </View>
    </PageContainer>
  )
}
