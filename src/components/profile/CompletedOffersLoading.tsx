
import React from 'react'
import { Skeleton } from "@/components/ui/skeleton"

const CompletedOffersLoading = () => {
  return (
    <div className="space-y-4">
      <Skeleton className="h-36 w-full" />
      <Skeleton className="h-36 w-full" />
    </div>
  )
}

export default CompletedOffersLoading
