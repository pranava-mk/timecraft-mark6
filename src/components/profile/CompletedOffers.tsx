
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import CompletedOffersLoading from "./CompletedOffersLoading"
import CompletedOffersList from "./CompletedOffersList"
import OfferEmptyState from "./OfferEmptyState"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface CompletedOffersProps {
  userId: string | null
  username?: string
  avatar?: string
}

interface CompletedOffer {
  id: string
  title: string
  description: string
  service_type: string
  time_credits: number
  hours: number
  created_at: string
  provider_username?: string
  transaction_id?: string
  claimed?: boolean
}

const CompletedOffers = ({ userId }: CompletedOffersProps) => {
  const [activeTab, setActiveTab] = useState<string>("for-you")
  
  // Fetch offers completed FOR the user (user made the request)
  const { data: completedForYou, isLoading: forYouLoading } = useQuery({
    queryKey: ['completed-offers', userId, 'for-you'],
    queryFn: async () => {
      if (!userId) return []
      
      // Get transactions where user requested the service
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          id,
          service,
          hours,
          created_at,
          provider_id,
          offer_id
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching completed offers for you:', error)
        throw error
      }

      // For each transaction, get the offer and provider details
      const offerDetails = await Promise.all(
        data.map(async (transaction) => {
          try {
            if (!transaction.offer_id) return null
            
            // Fetch offer details
            const { data: offerData, error: offerError } = await supabase
              .from('offers')
              .select('title, description, time_credits, service_type')
              .eq('id', transaction.offer_id)
              .maybeSingle()
              
            if (offerError) {
              console.error('Error fetching offer details:', offerError)
              return null
            }
            
            if (!offerData) return null
            
            // Fetch provider username
            const { data: providerData, error: providerError } = await supabase
              .from('profiles')
              .select('username')
              .eq('id', transaction.provider_id)
              .maybeSingle()
              
            if (providerError) {
              console.error('Error fetching provider username:', providerError)
              return null
            }
            
            return {
              id: transaction.id,
              title: offerData.title || 'Untitled',
              description: offerData.description || 'No description',
              service_type: offerData.service_type || transaction.service,
              time_credits: offerData.time_credits || 0,
              hours: transaction.hours,
              created_at: transaction.created_at,
              provider_username: providerData?.username || 'Unknown'
            }
          } catch (err) {
            console.error('Error processing transaction:', err)
            return null
          }
        })
      )

      // Filter out nulls and remove duplicates
      return offerDetails.filter(Boolean) as CompletedOffer[]
    },
    enabled: !!userId
  })
  
  // Fetch offers completed BY the user (user provided the service)
  const { data: completedByYou, isLoading: byYouLoading } = useQuery({
    queryKey: ['completed-offers', userId, 'by-you'],
    queryFn: async () => {
      if (!userId) return []
      
      // Get transactions where user provided the service
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          id,
          service,
          hours,
          created_at,
          user_id,
          offer_id,
          claimed
        `)
        .eq('provider_id', userId)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching completed offers by you:', error)
        throw error
      }

      // For each transaction, get the offer and requester details
      const offerDetails = await Promise.all(
        data.map(async (transaction) => {
          try {
            if (!transaction.offer_id) return null
            
            // Fetch offer details
            const { data: offerData, error: offerError } = await supabase
              .from('offers')
              .select('title, description, time_credits, service_type')
              .eq('id', transaction.offer_id)
              .maybeSingle()
              
            if (offerError) {
              console.error('Error fetching offer details:', offerError)
              return null
            }
            
            if (!offerData) return null
            
            // Fetch requester username
            const { data: requesterData, error: requesterError } = await supabase
              .from('profiles')
              .select('username')
              .eq('id', transaction.user_id)
              .maybeSingle()
              
            if (requesterError) {
              console.error('Error fetching requester username:', requesterError)
              return null
            }
            
            return {
              id: transaction.offer_id,
              title: offerData.title || 'Untitled',
              description: offerData.description || 'No description',
              service_type: offerData.service_type || transaction.service,
              time_credits: offerData.time_credits || 0,
              hours: transaction.hours,
              created_at: transaction.created_at,
              requester_username: requesterData?.username || 'Unknown',
              transaction_id: transaction.id,
              claimed: transaction.claimed
            }
          } catch (err) {
            console.error('Error processing transaction:', err)
            return null
          }
        })
      )

      // Filter out nulls
      return offerDetails.filter(Boolean) as CompletedOffer[]
    },
    enabled: !!userId
  })

  if (forYouLoading && byYouLoading) {
    return <CompletedOffersLoading />
  }

  const noCompletedOffers = (!completedForYou || completedForYou.length === 0) && 
                           (!completedByYou || completedByYou.length === 0)

  if (noCompletedOffers) {
    return <OfferEmptyState message="No completed services found" />
  }

  return (
    <div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="for-you">For You</TabsTrigger>
          <TabsTrigger value="by-you">By You</TabsTrigger>
        </TabsList>
        
        <TabsContent value="for-you">
          <CompletedOffersList 
            offers={completedForYou} 
            isForYou={true} 
            emptyMessage="No services completed for you" 
          />
        </TabsContent>
        
        <TabsContent value="by-you">
          <CompletedOffersList 
            offers={completedByYou} 
            isForYou={false} 
            emptyMessage="No services completed by you" 
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default CompletedOffers
