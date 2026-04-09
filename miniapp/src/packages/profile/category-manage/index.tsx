import { useMutation } from '@tanstack/react-query'
import Taro from '@tarojs/taro'
import { useAppQuery as useQuery } from '@/hooks/useAppQuery'
import { TaxonomyManager } from '@/packages/profile/components/TaxonomyManager'
import { taxonomyService } from '@/services/modules/taxonomy'
import { queryClient } from '@/utils/query-client'

const CATEGORY_COLOR_OPTIONS = ['#a84533', '#b45a45', '#596859', '#6e6353', '#c46c3f', '#7a8f62']

export default function CategoryManagePage() {
  const categoriesQuery = useQuery({
    queryKey: ['taxonomy', 'categories'],
    queryFn: taxonomyService.getCategories
  })

  const saveCategoryMutation = useMutation({
    mutationFn: ({ id, name, color }: { id?: string; name: string; color?: string }) =>
      id
        ? taxonomyService.updateCategory(id, { name, color: color || null })
        : taxonomyService.createCategory({ name, color: color || null })
  })

  const handleSave = async (payload: { id?: string; name: string; color?: string }) => {
    const isEdit = Boolean(payload.id)

    await saveCategoryMutation.mutateAsync(payload)
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['taxonomy'] }),
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
    ])

    Taro.showToast({
      title: isEdit ? '分类已更新' : '分类已创建',
      icon: 'success'
    })
  }

  return (
    <TaxonomyManager
      pageTitle="分类管理"
      pageSubtitle="给家里的招牌味道分门别类"
      heroEyebrow="Kitchen Atlas"
      heroTitle="先把常做的味道归档好，后面筛选和点菜都会更顺手。"
      heroDescription="分类会直接出现在菜谱库筛选和新建菜谱表单里，这一版先把基础的列表与编辑弹层跑通。"
      addButtonText="新建分类"
      emptyTitle="还没有建立分类"
      emptyDescription="先建一个分类吧，比如肉菜、汤羹、家宴冷盘。"
      loadingText="分类列表加载中"
      errorTitle="分类列表暂时没取到"
      errorDescription="可以稍后重试，或先返回“我的”页继续浏览其他模块。"
      sheetCreateTitle="新建分类"
      sheetEditTitle="编辑分类"
      sheetDescription="给这组味道一个简洁好记的名字，再挑一个便于识别的颜色。"
      fieldLabel="分类名称"
      namePlaceholder="例如：宴客菜 / 早餐 / 小炒"
      nameMaxLength={12}
      saveText="保存分类"
      pendingText="保存中..."
      countCaption="个常用分类"
      items={categoriesQuery.data}
      loading={categoriesQuery.isLoading}
      hasError={categoriesQuery.isError}
      onRetry={() => void categoriesQuery.refetch()}
      onSave={handleSave}
      enableColor
      colorOptions={CATEGORY_COLOR_OPTIONS}
      renderItemMeta={(item) => `排序位 ${item.sortOrder + 1} · 色卡 ${item.color || CATEGORY_COLOR_OPTIONS[0]}`}
      theme="warm"
    />
  )
}
