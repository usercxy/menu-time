import { useMutation, useQuery } from '@tanstack/react-query'
import Taro from '@tarojs/taro'
import { TaxonomyManager } from '@/packages/profile/components/TaxonomyManager'
import { taxonomyService } from '@/services/modules/taxonomy'
import { queryClient } from '@/utils/query-client'

export default function TagManagePage() {
  const tagsQuery = useQuery({
    queryKey: ['taxonomy', 'tags'],
    queryFn: taxonomyService.getTags
  })

  const saveTagMutation = useMutation({
    mutationFn: ({ id, name }: { id?: string; name: string }) =>
      id ? taxonomyService.updateTag(id, { name }) : taxonomyService.createTag({ name })
  })

  const handleSave = async (payload: { id?: string; name: string }) => {
    const isEdit = Boolean(payload.id)

    await saveTagMutation.mutateAsync(payload)
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['taxonomy'] }),
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
    ])

    Taro.showToast({
      title: isEdit ? '标签已更新' : '标签已创建',
      icon: 'success'
    })
  }

  return (
    <TaxonomyManager
      pageTitle="标签管理"
      pageSubtitle="整理每道菜背后的情绪与场景"
      heroEyebrow="Flavor Notes"
      heroTitle="把家常味道贴上场景标签，检索时就能更快找到那一口熟悉感。"
      heroDescription="标签会用于菜谱创建、版本编辑和后续推荐能力，这一版先提供基础列表和新建/编辑弹层。"
      addButtonText="新建标签"
      emptyTitle="还没有可选标签"
      emptyDescription="先建几个常用标签，比如快手菜、家宴、孩子爱吃。"
      loadingText="标签列表加载中"
      errorTitle="标签列表暂时没取到"
      errorDescription="可以重新拉取一次，确认 mock 数据或接口状态是否正常。"
      sheetCreateTitle="新建标签"
      sheetEditTitle="编辑标签"
      sheetDescription="标签适合描述场景、口味或情绪，名字尽量短一些，后续多选时更清爽。"
      fieldLabel="标签名称"
      namePlaceholder="例如：下饭 / 节庆菜单 / 深夜安慰"
      nameMaxLength={14}
      saveText="保存标签"
      pendingText="保存中..."
      countCaption="个可选标签"
      items={tagsQuery.data}
      loading={tagsQuery.isLoading}
      hasError={tagsQuery.isError}
      onRetry={() => void tagsQuery.refetch()}
      onSave={handleSave}
      renderItemMeta={(item) => `排序位 ${item.sortOrder + 1} · 会在菜谱表单里用于多选筛选`}
      theme="leaf"
    />
  )
}
