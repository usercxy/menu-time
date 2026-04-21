import { PageContainer } from '@/components/base/PageContainer'
import { EmptyState } from '@/components/base/EmptyState'

export default function ShoppingListPage() {
  return (
    <PageContainer title="购物清单" subtitle="购物清单预留页" showBack>
      <EmptyState title="清单聚合逻辑稍后接入" description="阶段 0 先让购物清单页能从点菜台跳转并进入 planner 分包。" />
    </PageContainer>
  )
}
