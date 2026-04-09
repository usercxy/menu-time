import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Input, Text, Textarea, View } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { PageContainer } from '@/components/base/PageContainer'
import { EmptyState } from '@/components/base/EmptyState'
import { useAppQuery as useQuery } from '@/hooks/useAppQuery'
import { queryClient } from '@/utils/query-client'
import { recipeService } from '@/services/modules/recipe'
import { taxonomyService } from '@/services/modules/taxonomy'
import { redirectToRoute } from '@/utils/navigation'
import { routes } from '@/constants/routes'
import { validateCreateVersionForm } from '@/utils/recipe-form'
import styles from './index.module.scss'

export default function VersionCreatePage() {
  const router = useRouter()
  const recipeId = router.params.recipeId || ''
  const sourceVersionId = router.params.sourceVersionId || ''
  const hasHydratedForm = useRef(false)
  const [versionName, setVersionName] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newTagNamesInput, setNewTagNamesInput] = useState('')
  const [ingredients, setIngredients] = useState([''])
  const [steps, setSteps] = useState([''])
  const [tips, setTips] = useState('')
  const [formError, setFormError] = useState('')

  const detailQuery = useQuery({
    queryKey: ['recipe-detail', recipeId],
    queryFn: () => recipeService.getRecipeDetail(recipeId),
    enabled: Boolean(recipeId)
  })
  const sourceVersionQuery = useQuery({
    queryKey: ['recipe-version-detail', recipeId, sourceVersionId],
    queryFn: () => recipeService.getRecipeVersionDetail(recipeId, sourceVersionId),
    enabled: Boolean(recipeId && sourceVersionId)
  })
  const categoriesQuery = useQuery({
    queryKey: ['taxonomy', 'categories'],
    queryFn: taxonomyService.getCategories
  })
  const tagsQuery = useQuery({
    queryKey: ['taxonomy', 'tags'],
    queryFn: taxonomyService.getTags
  })

  const sourceVersion = sourceVersionQuery.data || detailQuery.data?.currentVersion
  const recipeName = detailQuery.data?.name || '这道菜'
  const sourceLabel = sourceVersion
    ? `V${sourceVersion.versionNumber}${sourceVersion.versionName ? ` · ${sourceVersion.versionName}` : ''}`
    : ''

  useEffect(() => {
    if (!sourceVersion || hasHydratedForm.current) {
      return
    }

    hasHydratedForm.current = true
    setVersionName(`${sourceVersion.versionName || `V${sourceVersion.versionNumber}`} 调整版`)
    setSelectedCategoryId(sourceVersion.category?.id || null)
    setSelectedTagIds(sourceVersion.tags.map((tag) => tag.id))
    setIngredients(
      sourceVersion.ingredients.length
        ? sourceVersion.ingredients.map((item) => item.rawText)
        : ['']
    )
    setSteps(
      sourceVersion.steps.length ? sourceVersion.steps.map((item) => item.content) : ['']
    )
    setTips(sourceVersion.tips || '')
  }, [sourceVersion])

  const selectedCategory = useMemo(
    () => categoriesQuery.data?.find((item) => item.id === selectedCategoryId) || null,
    [categoriesQuery.data, selectedCategoryId]
  )

  const createVersionMutation = useMutation({
    mutationFn: (payload: Parameters<typeof recipeService.createRecipeVersion>[1]) =>
      recipeService.createRecipeVersion(recipeId, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['recipe-detail', recipeId] }),
        queryClient.invalidateQueries({ queryKey: ['recipe-versions', recipeId] }),
        queryClient.invalidateQueries({ queryKey: ['recipes'] })
      ])

      Taro.showToast({
        title: '新版本已发布',
        icon: 'success'
      })

      setTimeout(() => {
        void redirectToRoute(routes.recipeDetail, { id: recipeId, tab: 'versions' })
      }, 220)
    },
    onError: () => {
      setFormError('发布失败，请稍后再试。')
    }
  })

  const updateListItem = (setter: Dispatch<SetStateAction<string[]>>, index: number, value: string) => {
    setter((current) => current.map((item, itemIndex) => (itemIndex === index ? value : item)))
  }

  const removeListItem = (setter: Dispatch<SetStateAction<string[]>>, index: number) => {
    setter((current) => current.filter((_, itemIndex) => itemIndex !== index))
  }

  const addListItem = (setter: Dispatch<SetStateAction<string[]>>) => {
    setter((current) => [...current, ''])
  }

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((current) =>
      current.includes(tagId) ? current.filter((item) => item !== tagId) : [...current, tagId]
    )
  }

  const handleSubmit = async () => {
    if (!recipeId || !sourceVersion) {
      setFormError('缺少来源版本信息，暂时无法发布。')
      return
    }

    const parsed = validateCreateVersionForm({
      sourceVersionId: sourceVersion.id,
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
    await createVersionMutation.mutateAsync(parsed.data)
  }

  if (!recipeId) {
    return (
      <PageContainer title="新建版本" subtitle="缺少必要参数" showBack>
        <EmptyState title="没有找到菜谱" description="请先从菜谱详情页进入，再基于某个版本继续调整。" />
      </PageContainer>
    )
  }

  return (
    <PageContainer title="新建版本" subtitle="基于已有版本继续打磨味道" showBack>
      <View className="page-stack">
        <View className={styles.heroCard}>
          <Text className={styles.heroEyebrow}>版本草稿</Text>
          <Text className={styles.heroTitle}>{recipeName}</Text>
          <Text className={styles.heroDescription}>
            {sourceLabel ? `当前基于 ${sourceLabel} 继续调整。` : '正在读取来源版本内容。'}
          </Text>
        </View>

        {sourceVersion ? (
          <>
            <View className={styles.sectionCard}>
              <View className={styles.sectionHeader}>
                <Text className="section-title">来源版本</Text>
                <Text className={styles.sectionHint}>
                  默认复制主料、步骤和小贴士，你可以在这一版继续修改。
                </Text>
              </View>
              <View className={styles.sourceMeta}>
                <View className={styles.sourceBadge}>
                  <Text>{sourceLabel}</Text>
                </View>
                {sourceVersion.diffSummaryText ? (
                  <Text className={styles.helpText}>{sourceVersion.diffSummaryText}</Text>
                ) : (
                  <Text className={styles.helpText}>这是当前默认来源版本。</Text>
                )}
              </View>
            </View>

            <View className={styles.sectionCard}>
              <View className={styles.sectionHeader}>
                <Text className="section-title">版本信息</Text>
                <Text className={styles.sectionHint}>版本号会由后端或 mock 层自动递增</Text>
              </View>

              <View className={styles.fieldStack}>
                <View className={styles.fieldBlock}>
                  <View className={styles.labelRow}>
                    <Text className={styles.fieldLabel}>版本名称</Text>
                  </View>
                  <View className={styles.inputShell}>
                    <Input
                      className={styles.textInput}
                      placeholder="例如：更松软版 / 微辣版"
                      placeholderClass={styles.inputPlaceholder}
                      value={versionName}
                      maxlength={24}
                      cursorSpacing={96}
                      onInput={(event) => setVersionName(event.detail.value)}
                    />
                  </View>
                  <Text className={styles.helpText}>可选；留空时由后端自动生成默认版本名称。</Text>
                </View>

                <View className={styles.fieldBlock}>
                  <Text className={styles.fieldLabel}>分类</Text>
                  <View className={styles.chipList}>
                    {categoriesQuery.data?.map((category) => (
                      <View
                        className={`${styles.filterChip} ${
                          selectedCategoryId === category.id ? styles.filterChipActive : ''
                        }`}
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
                      placeholder="也可以临时改一个新分类"
                      placeholderClass={styles.inputPlaceholder}
                      value={newCategoryName}
                      maxlength={12}
                      cursorSpacing={96}
                      onInput={(event) => setNewCategoryName(event.detail.value)}
                    />
                  </View>
                  {selectedCategory ? (
                    <Text className={styles.helpText}>当前分类：{selectedCategory.name}</Text>
                  ) : null}
                </View>

                <View className={styles.fieldBlock}>
                  <Text className={styles.fieldLabel}>标签</Text>
                  <View className={styles.chipList}>
                    {tagsQuery.data?.map((tag) => (
                      <View
                        className={`${styles.filterChip} ${
                          selectedTagIds.includes(tag.id) ? styles.filterChipActive : ''
                        }`}
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
                      placeholder="新标签可用逗号分隔"
                      placeholderClass={styles.inputPlaceholder}
                      value={newTagNamesInput}
                      cursorSpacing={96}
                      onInput={(event) => setNewTagNamesInput(event.detail.value)}
                    />
                  </View>
                </View>
              </View>
            </View>

            <View className={styles.sectionCard}>
              <View className={styles.sectionHeader}>
                <Text className="section-title">版本内容</Text>
                <Text className={styles.sectionHint}>按当前来源版本默认回填</Text>
              </View>

              <View className={styles.fieldStack}>
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
                            onInput={(event) =>
                              updateListItem(setIngredients, index, event.detail.value)
                            }
                          />
                        </View>
                        <View
                          className={styles.repeaterAction}
                          onClick={() => removeListItem(setIngredients, index)}
                        >
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
                          <View
                            className={styles.repeaterAction}
                            onClick={() => removeListItem(setSteps, index)}
                          >
                            <Text>删除</Text>
                          </View>
                        </View>
                        <View className={`${styles.inputShell} ${styles.textareaShell}`}>
                          <Textarea
                            className={styles.textarea}
                            placeholder="例如：延长炖煮时间 10 分钟，让口感更软糯"
                            placeholderClass={styles.textareaPlaceholder}
                            value={step}
                            maxlength={220}
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
                      placeholder="写下这一版和上一版的关键差异。"
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

            {formError ? <Text className={styles.errorText}>{formError}</Text> : null}

            <View className={styles.footerActions}>
              <View className="secondary-button" onClick={() => Taro.navigateBack()}>
                <Text>先不发布</Text>
              </View>
              <View
                className={`primary-button ${styles.submitButton} ${
                  createVersionMutation.isPending ? styles.submitButtonDisabled : ''
                }`}
                onClick={() => {
                  if (!createVersionMutation.isPending) {
                    void handleSubmit()
                  }
                }}
              >
                <Text>{createVersionMutation.isPending ? '发布中...' : '发布为新版本'}</Text>
              </View>
            </View>
          </>
        ) : detailQuery.isLoading || sourceVersionQuery.isLoading ? (
          <View className={styles.sectionCard}>
            <Text className={styles.helpText}>正在读取来源版本内容...</Text>
          </View>
        ) : (
          <EmptyState title="来源版本未找到" description="请从菜谱详情页重新进入，或稍后再试。" />
        )}
      </View>
    </PageContainer>
  )
}
