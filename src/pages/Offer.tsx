
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CreditCard } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useQuery } from "@tanstack/react-query"
import { OfferForm } from "@/components/offer/OfferForm"

const Offer = () => {
  const [userId, setUserId] = useState<string | null>(null)
  
  // Get user ID
  useEffect(() => {
    const fetchUserId = async () => {
      const { data } = await supabase.auth.getUser()
      if (data?.user?.id) {
        setUserId(data.user.id)
        
        // Check if user has a time balance, if not create one with 30 credits
        const { data: timeBalanceData, error } = await supabase
          .from('time_balances')
          .select('balance')
          .eq('user_id', data.user.id)
          .maybeSingle()
          
        if (error) {
          console.error('Error checking time balance:', error)
        } else if (!timeBalanceData) {
          // Create initial time balance with 30 credits
          const { error: insertError } = await supabase
            .from('time_balances')
            .insert([{
              user_id: data.user.id,
              balance: 30,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }])
            
          if (insertError) {
            console.error('Error creating initial time balance:', insertError)
          } else {
            console.log('Created initial time balance of 30 credits')
          }
        }
      }
    }
    
    fetchUserId()
  }, [])

  // Get time balance directly from the database - single source of truth
  const { data: timeBalance, isLoading: timeBalanceLoading } = useQuery({
    queryKey: ['time-balance'],
    queryFn: async () => {
      if (!userId) return null
      
      const { data, error } = await supabase
        .from('time_balances')
        .select('balance')
        .eq('user_id', userId)
        .single()

      if (error) {
        console.error('Error fetching time balance:', error)
        return 0
      }
      
      return data?.balance || 0
    },
    enabled: !!userId
  })

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-2xl md:text-4xl font-bold mb-6">Create New Request</h1>
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Request Details</CardTitle>
            <div className="flex items-center space-x-2">
              <CreditCard className="h-4 w-4 text-teal" />
              <span className="text-sm font-medium">
                {timeBalanceLoading ? "Loading..." : `Available: ${timeBalance} credits`}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <OfferForm 
            timeBalance={timeBalance}
            userId={userId}
          />
        </CardContent>
      </Card>
    </div>
  )
}

export default Offer
