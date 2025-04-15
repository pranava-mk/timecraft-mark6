
import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { formatDistanceToNow } from "date-fns"
import { Button } from "@/components/ui/button"
import { Gift } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { useQueryClient } from "@tanstack/react-query"

interface CompletedOfferCardProps {
  offer: {
    id: string
    title: string
    description: string
    service_type: string
    time_credits: number
    hours: number
    created_at: string
    provider_username?: string
    requester_username?: string
  }
  isForYou: boolean
  transactionId?: string
  claimed?: boolean
}

export const CompletedOfferCard = ({ 
  offer, 
  isForYou, 
  transactionId, 
  claimed = false 
}: CompletedOfferCardProps) => {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isClaiming, setIsClaiming] = useState(false)
  const [isClaimed, setIsClaimed] = useState(claimed)
  
  const formattedDate = offer.created_at
    ? formatDistanceToNow(new Date(offer.created_at), { addSuffix: true })
    : 'Unknown date'
  
  const handleClaim = async () => {
    if (!transactionId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Transaction ID is missing. Cannot claim credits.",
      })
      return
    }
    
    try {
      setIsClaiming(true)
      
      console.log("Claiming credits for transaction ID:", transactionId)
      
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")
      
      // First, check if this transaction exists
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .maybeSingle()
        
      if (transactionError) {
        console.error('Error checking transaction:', transactionError)
        throw new Error("Error checking transaction: " + transactionError.message)
      }
      
      if (!transaction) {
        console.error('Transaction not found:', transactionId)
        
        // If we have offer ID, try to create a transaction
        if (offer.id) {
          // Get offer details first
          const { data: offerData, error: offerError } = await supabase
            .from('offers')
            .select('profile_id')
            .eq('id', offer.id)
            .single()
            
          if (offerError) {
            console.error('Error fetching offer details:', offerError)
            throw new Error("Couldn't find the offer details")
          }
          
          // Create a new transaction
          const { data: newTransaction, error: insertError } = await supabase
            .from('transactions')
            .insert({
              id: transactionId, // Use the provided transaction ID
              user_id: offerData.profile_id,
              provider_id: user.id,
              offer_id: offer.id,
              service: offer.service_type || 'Time Exchange',
              hours: offer.hours || offer.time_credits || 1,
              claimed: false
            })
            .select()
            .single()
            
          if (insertError) {
            console.error('Error creating transaction:', insertError)
            throw new Error("Couldn't create a transaction record")
          }
          
          console.log('Created new transaction:', newTransaction)
          var transaction = newTransaction
        } else {
          throw new Error("Transaction not found and cannot create a new one without offer details")
        }
      }
      
      // Check if this transaction belongs to the current user
      if (transaction.provider_id !== user.id) {
        console.error('Transaction does not belong to current user')
        throw new Error("This transaction does not belong to you")
      }
      
      // Check if already claimed
      if (transaction.claimed) {
        toast({
          title: "Already Claimed",
          description: "You have already claimed credits for this offer",
        })
        setIsClaimed(true)
        setIsClaiming(false)
        return
      }
      
      // Update transaction as claimed
      const { error: updateError } = await supabase
        .from('transactions')
        .update({ claimed: true })
        .eq('id', transaction.id)

      if (updateError) {
        console.error('Error updating transaction:', updateError)
        throw updateError
      }
      
      // Get the user's current time balance
      const { data: timeBalance, error: balanceError } = await supabase
        .from('time_balances')
        .select('balance')
        .eq('user_id', user.id)
        .single()
        
      if (balanceError) {
        console.error('Error fetching time balance:', balanceError)
        throw balanceError
      }
      
      // Update user's time balance
      const newBalance = timeBalance.balance + transaction.hours
      
      const { error: updateBalanceError } = await supabase
        .from('time_balances')
        .update({ 
          balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        
      if (updateBalanceError) {
        console.error('Error updating time balance:', updateBalanceError)
        throw updateBalanceError
      }

      // Show success message
      toast({
        title: "Success",
        description: `${transaction.hours} credits have been added to your balance!`,
      })

      // Set local state to show claimed status
      setIsClaimed(true)
      
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['completed-offers'] })
      queryClient.invalidateQueries({ queryKey: ['time-balance'] })
      queryClient.invalidateQueries({ queryKey: ['user-stats'] })
      
    } catch (error: any) {
      console.error('Error in handleClaim:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to claim credits: " + error.message,
      })
    } finally {
      setIsClaiming(false)
    }
  }
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row justify-between">
          <div className="space-y-2 mb-4 md:mb-0">
            <h3 className="font-semibold">{offer.title}</h3>
            <p className="text-sm text-muted-foreground">{offer.description}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                {offer.service_type}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                {offer.time_credits} {offer.time_credits === 1 ? 'credit' : 'credits'}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Completed {formattedDate}
              </span>
            </div>
            {isForYou && offer.provider_username && (
              <p className="text-sm">Completed by: {offer.provider_username}</p>
            )}
            {!isForYou && offer.requester_username && (
              <p className="text-sm">Requested by: {offer.requester_username}</p>
            )}
          </div>
          
          {/* Only show claim button for BY YOU tab */}
          {!isForYou && transactionId && (
            <div className="self-end">
              <Button
                onClick={handleClaim}
                disabled={isClaiming || isClaimed}
                className={isClaimed ? "bg-gray-400" : "bg-green-500 hover:bg-green-600"}
              >
                <Gift className="h-4 w-4 mr-2" />
                {isClaimed ? "Claimed" : "Claim Credits"}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
