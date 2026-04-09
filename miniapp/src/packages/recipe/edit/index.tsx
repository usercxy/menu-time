import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Input, Text, Textarea, View } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { z } from 'zod'
import { EmptyState } from '@/components/base/EmptyState'
import { LoadingState } from '@/components/base/LoadingState'
import { PageContainer } from '@/components/base/PageContainer'
import { routes } from '@/constants/routes'
import { queryClient } from '@/utils/query-client'
import { recipeService } from '@/services/modules/recipe'
import { taxonomyService } from '@/services/modules/taxonomy'
import { redirectToRoute } from '@/utils/navigation'
import type { RecipeDetailDTO } from '@/services/types/recipe'
import styles from './index.module.scss'

const recipeFormSchema = z.object({
  name: z.string().trim().min(1, '请输入菜谱名称'),
  versionName: z.string().trim().max(20, '版本名最多 20 个字').optional(),
  newCategoryName: z.string().trim().optional(),
  newTagNamesInput: z.string().trim().optional(),
  tips: z.string().trim().optional()
})

function splitTagNames(value: string) {
  return value
    .split(/[，,]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

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
    mutationFn: recipeService.createRecipe,
    onSuccess: async (result) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['recipes'] }),
        queryClient.invalidateQueries({ queryKey: ['meal-plan', 'current-week'] })
      ])

      Taro.showToast({
        title: '菜谱已入库',
        icon: 'success'
      })

      setTimeout(() => {
        void redirectToRoute(routes.recipeDetail, { id: result.recipeId })
      }, 220)
    },
    onError: () => {
      setFormError('保存失败，请稍后重试。')
    }
  })

  const updateMutation = useMutation({
    mutationFn: (payload: { name: string }) => recipeService.updateRecipe(recipeId, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['recipe-detail', recipeId] }),
        queryClient.invalidateQueries({ queryKey: ['recipes'] })
      ])

      Taro.showToast({
        title: '菜谱档案已更新',
        icon: 'success'
      })

      setTimeout(() => {
        void redirectToRoute(routes.recipeDetail, { id: recipeId })
      }, 220)
    },
    onError: () => {
      setFormError('更新失败，请稍后重试。')
    }
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
    setFormError('')
  }

  const handleSubmit = async () => {
    const parsed = recipeFormSchema.safeParse({
      name,
      versionName,
      newCategoryName,
      newTagNamesInput,
      tips
    })

    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message || '请检查表单内容')
      return
    }

    setFormError('')

    if (isEditMode) {
      await updateMutation.mutateAsync({
        name: parsed.data.name.trim()
      })
      return
    }

    await createMutation.mutateAsync({
      name: parsed.data.name.trim(),
      categoryId: selectedCategoryId,
      newCategoryName: parsed.data.newCategoryName || null,
      tagIds: selectedTagIds,
      newTagNames: splitTagNames(parsed.data.newTagNamesInput || ''),
      versionName: parsed.data.versionName || '',
      ingredients: ingredients.map((rawText) => ({ rawText })),
      steps: steps.map((content, index) => ({
        sortOrder: index + 1,
        content
      })),
      tips: parsed.data.tips || ''
    })
  }

  const submitPending = isEditMode ? updateMutation.isPending : createMutation.isPending

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
              : '这一版先打通 mock 创建闭环：保存后会直接进入菜谱详情页，方便继续做版本和时光记录。'}
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
              <Text className={styles.fieldLabel}>菜谱名</Text>
              <Input
                className={styles.textInput}
                placeholder="例如：番茄炖牛腩"
                value={name}
                maxlength={24}
                onInput={(event) => setName(event.detail.value)}
              />
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
                  <Input
                    className={styles.textInput}
                    placeholder="没有合适的分类？可临时输入新分类"
                    value={newCategoryName}
                    maxlength={12}
                    onInput={(event) => setNewCategoryName(event.detail.value)}
                  />
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
                  <Input
                    className={styles.textInput}
                    placeholder="临时新标签，多个标签用逗号分隔"
                    value={newTagNamesInput}
                    onInput={(event) => setNewTagNamesInput(event.detail.value)}
                  />
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
                <Input
                  className={styles.textInput}
                  placeholder="例如：家常版 / 少油版"
                  value={versionName}
                  maxlength={20}
                  onInput={(event) => setVersionName(event.detail.value)}
                />
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
                      <Input
                        className={styles.inlineInput}
                        placeholder="例如：牛腩 500g"
                        value={ingredient}
                        onInput={(event) => updateListItem(setIngredients, index, event.detail.value)}
                      />
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
                      <Textarea
                        className={styles.textarea}
                        placeholder="例如：牛腩焯水后小火慢炖 40 分钟"
                        value={step}
                        maxlength={200}
                        autoHeight
                        onInput={(event) => updateListItem(setSteps, index, event.detail.value)}
                      />
                    </View>
                  ))}
                </View>
              </View>

              <View className={styles.fieldBlock}>
                <Text className={styles.fieldLabel}>小贴士</Text>
                <Textarea
                  className={styles.textarea}
                  placeholder="记录火候、替换食材或失败经验，下次会更稳。"
                  value={tips}
                  maxlength={240}
                  autoHeight
                  onInput={(event) => setTips(event.detail.value)}
                />
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
                ? isEditMode
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
