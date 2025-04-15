
import React from 'react'
import { Card, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useNavigate } from "react-router-dom"
import OfferCard from "@/components/explore/OfferCard"
import CompletedOffers from './CompletedOffers'
import OfferEmptyState from './OfferEmptyState'

interface UserOffersProps {
  userId: string | null
  username?: string
  avatar?: string
  userOffers: any[] | null
  isLoading: boolean
  timeBalance: number
  profile: any | null
}

const UserOffers = ({ 
  userId, 
  username, 
  avatar, 
  userOffers, 
  isLoading, 
  timeBalance,
  profile
}: UserOffersProps) => {
  const navigate = useNavigate()
  
  // Filter out completed offers for the My Requests tab
  const activeUserOffers = userOffers?.filter(offer => offer.status !== 'completed') || []

  return (
    <Card>
      <CardHeader>
        <Tabs defaultValue="requests">
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="requests">My Requests</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
            
            <Button 
              size="sm" 
              onClick={() => navigate('/offer')}
              disabled={isLoading || timeBalance <= 0}
            >
              <Plus className="h-4 w-4 mr-1" />
              New Request
            </Button>
          </div>
          
          <TabsContent value="requests">
            <div className="space-y-4">
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-36 w-full" />
                  <Skeleton className="h-36 w-full" />
                </div>
              ) : activeUserOffers.length === 0 ? (
                <OfferEmptyState message="You haven't created any active requests yet" />
              ) : (
                activeUserOffers.map((offer) => (
                  <OfferCard 
                    key={offer.id} 
                    offer={{
                      ...offer,
                      timeCredits: offer.time_credits,
                      user: {
                        id: offer.profile_id,
                        name: profile?.username || 'Unknown',
                        avatar: profile?.avatar_url || '/placeholder.svg'
                      }
                    }}
                    showApplications={true}
                  />
                ))
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="completed">
            <CompletedOffers userId={userId} username={username} avatar={avatar} />
          </TabsContent>
        </Tabs>
      </CardHeader>
    </Card>
  )
}

export default UserOffers
