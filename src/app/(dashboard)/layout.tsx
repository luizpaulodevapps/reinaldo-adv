import { Suspense } from 'react'
import { DashboardClientLayout } from './dashboard-client-layout'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Suspense>
      <DashboardClientLayout>{children}</DashboardClientLayout>
    </Suspense>
  )
}
