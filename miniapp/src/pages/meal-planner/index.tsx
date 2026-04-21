import { useAppQuery as useQuery } from '@/hooks/useAppQuery'
import { Image, Text, View, ScrollView } from '@tarojs/components'
import { SvgIcon } from '@/components/base/SvgIcon'
import { svgIconColors } from '@/components/base/SvgIcon/iconColors'
import { routes } from '@/constants/routes'
import { PageContainer } from '@/components/base/PageContainer'
import { mealPlanService } from '@/services/modules/meal-plan'
import { navigateToRoute } from '@/utils/navigation'
import styles from './index.module.scss'

const DEFAULT_MEAL_COVER_URL =
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=400'

export default function MealPlannerPage() {
  const planQuery = useQuery({
    queryKey: ['meal-plan', 'current-week'],
    queryFn: mealPlanService.getCurrentWeekPlan
  })

  const weekDays = [
    { name: 'MON', date: 20, active: true },
    { name: 'TUE', date: 21 },
    { name: 'WED', date: 22 },
    { name: 'THU', date: 23 },
    { name: 'FRI', date: 24 },
    { name: 'SAT', date: 25 },
    { name: 'SUN', date: 26 },
  ]

  return (
    <PageContainer title="点菜台" subtitle={planQuery.data?.summary.weekLabel || '本周'}>
      <View className="page-stack">
        {/* Calendar Section */}
        <View className={styles.calendarSection}>
          <View className={styles.calendarTitle}>
            <Text className="section-title">本周计划</Text>
            <View className={styles.weekLabel}>
              <Text>十一月 第四周</Text>
            </View>
          </View>
          <ScrollView scrollX className={styles.dateList} showScrollbar={false}>
            {weekDays.map((day) => (
              <View 
                key={day.date} 
                className={`${styles.dateItem} ${day.active ? styles['dateItem--active'] : ''}`}
              >
                <Text className={styles.dayName}>{day.name}</Text>
                <Text className={styles.dayDate}>{day.date}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Random Pick Feature */}
        <View className={styles.randomSection}>
          <View className={styles.randomButton} onClick={() => navigateToRoute(routes.randomPick)}>
            <View className={styles.randomInfo}>
              <View className={styles.randomIcon}>
                <SvgIcon
                  className={styles.randomIconImage}
                  name="shuaxin"
                  size={44}
                  color={svgIconColors.onTertiaryContainer}
                />
              </View>
              <View className={styles.randomText}>
                <Text className={styles.randomTitle}>纠结时刻？</Text>
                <Text className={styles.randomSubtitle}>让“食光”为你随机挑选一道美味</Text>
              </View>
            </View>
            <View className={styles.arrowButton}>
              <SvgIcon className={styles.arrowIcon} name="youjiantou" size={28} color={svgIconColors.onPrimary} />
            </View>
          </View>
        </View>

        {/* Meal Slots */}
        <View className={styles.mealsSection}>
          <View className={styles.mealHeader}>
            <Text className="section-title">今日餐单</Text>
            <Text className={styles.mealCount}>
              {planQuery.data?.todayMeals.length || 0} 道菜品
            </Text>
          </View>
          
          <View className={styles.mealGrid}>
            {planQuery.data?.todayMeals.map((meal) => (
              <View className={styles.mealCard} key={meal.id}>
                <View className={styles.mealCoverWrap}>
                  <Image 
                    className="recipe-cover" 
                    mode="aspectFill" 
                    src={DEFAULT_MEAL_COVER_URL}
                    style={{ height: '100%' }}
                  />
                  <View className={styles.mealTypeBadge}>
                    <Text>{meal.mealType}</Text>
                  </View>
                </View>
                
                <View className={styles.mealInfo}>
                  <View>
                    <Text className={styles.mealTitle}>{meal.recipeName}</Text>
                    <Text className={styles.mealNote}>{meal.note || '点击编辑口味偏好...'}</Text>
                  </View>
                  <View className={styles.mealEdit}>
                    <SvgIcon className={styles.mealEditIcon} name="bianji" size={20} color={svgIconColors.primary} />
                    <Text>编辑</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Shopping List Access */}
        <View className="surface-card" onClick={() => navigateToRoute(routes.shoppingList, { weekStartDate: '2026-03-23' })}>
          <View className="profile-link__meta">
            <View className={styles.linkTitleRow}>
              <SvgIcon className={styles.linkTitleIcon} name="wenjian" size={26} color={svgIconColors.primary} />
              <Text className="profile-link__title">购物清单</Text>
            </View>
            <Text className="profile-link__subtitle">查看本周所需原料，一键生成清单</Text>
          </View>
          <SvgIcon
            className={styles.linkArrowIcon}
            name="youjiantou"
            size={28}
            color={svgIconColors.onSurfaceVariant}
          />
        </View>
      </View>
    </PageContainer>
  )
}
