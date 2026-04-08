import { EmptyState } from '@/components/base/EmptyState'
import { PageContainer } from '@/components/base/PageContainer'

export default function RandomPickPage() {
  return (
    <PageContainer title="随机点菜" subtitle="planner 分包入口" showBack>
      <EmptyState title="随机挑菜工作流待接入" description="阶段 0 先把入口页、分包和跳转链路搭起来。" />
    </PageContainer>
  )
}
