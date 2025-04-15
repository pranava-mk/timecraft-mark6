
import React from 'react'

interface OfferEmptyStateProps {
  message: string
}

const OfferEmptyState = ({ message }: OfferEmptyStateProps) => {
  return (
    <p className="text-center text-muted-foreground py-8">
      {message}
    </p>
  )
}

export default OfferEmptyState
