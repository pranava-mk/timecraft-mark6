
import React from 'react'
import { CompletedOfferCard } from './CompletedOfferCard'
import OfferEmptyState from './OfferEmptyState'

interface CompletedOffer {
  id: string
  title: string
  description: string
  service_type: string
  time_credits: number
  hours: number
  created_at: string
  provider_username?: string
  requester_username?: string
  transaction_id?: string
  claimed?: boolean
}

interface CompletedOffersListProps {
  offers: CompletedOffer[] | null | undefined
  isForYou: boolean
  emptyMessage: string
}

const CompletedOffersList = ({ offers, isForYou, emptyMessage }: CompletedOffersListProps) => {
  if (!offers || offers.length === 0) {
    return <OfferEmptyState message={emptyMessage} />
  }

  return (
    <div className="space-y-4">
      {offers.map((offer) => (
        <CompletedOfferCard
          key={offer.id}
          offer={offer}
          isForYou={isForYou}
          transactionId={offer.transaction_id}
          claimed={offer.claimed}
        />
      ))}
    </div>
  )
}

export default CompletedOffersList
