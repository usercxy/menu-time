import { EmptyState } from '@/components/base/EmptyState'
import { PageContainer } from '@/components/base/PageContainer'

export default function MomentEditPage() {
  return (
    <PageContainer title="记一笔" subtitle="时光记录表单预留页" showBack>
      <EmptyState
        title="时光记录还没开始落表单"
        description="图片选择、评分、日期和参与人输入会在后续阶段补上。"
      />
    </PageContainer>
  )
}
