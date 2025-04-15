
import { Button } from "@/components/ui/button"
import { Check, Gift, Hourglass } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { useState } from "react"

interface OfferApplyButtonProps {
  offerId: string
  status: string
  isApplied?: boolean
  applicationStatus?: string
  userApplication?: any
  onApply: (offerId: string) => void
  isApplying: boolean
}

const OfferApplyButton = ({ 
  offerId, 
  status, 
  isApplied, 
  applicationStatus, 
  userApplication, 
  onApply, 
  isApplying 
}: OfferApplyButtonProps) => {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isClaiming, setIsClaiming] = useState(false)
  const [isClaimed, setIsClaimed] = useState(false)

  const handleClaim = async () => {
    try {
      setIsClaiming(true)
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")
      
      console.log("Claiming credits for offer:", offerId, "by user:", user.id)
      
      // IMPORTANT FIX: Use a simpler query looking directly for transactions from this offer
      // that belong to the current user as the provider
      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('offer_id', offerId)
        .eq('provider_id', user.id)
      
      if (transactionsError) {
        console.error('Error fetching transactions:', transactionsError)
        throw new Error("Error fetching transactions: " + transactionsError.message)
      }
      
      // Check if we found any matching transactions
      if (!transactions || transactions.length === 0) {
        console.error('No transactions found for offer_id:', offerId, 'and provider_id:', user.id)
        
        // Let's create a transaction if it doesn't exist
        // This handles the case where the transaction might not have been created properly
        const { data: offerData, error: offerError } = await supabase
          .from('offers')
          .select('time_credits, service_type, profile_id')
          .eq('id', offerId)
          .single()
          
        if (offerError) {
          console.error('Error fetching offer details:', offerError)
          throw new Error("Couldn't find the offer details")
        }
        
        // Create a new transaction
        const { data: newTransaction, error: insertError } = await supabase
          .from('transactions')
          .insert({
            user_id: offerData.profile_id,
            provider_id: user.id,
            offer_id: offerId,
            service: offerData.service_type || 'Time Exchange',
            hours: offerData.time_credits || 1,
            claimed: false
          })
          .select()
          .single()
          
        if (insertError) {
          console.error('Error creating transaction:', insertError)
          throw new Error("Couldn't create a transaction record")
        }
        
        console.log('Created new transaction:', newTransaction)
        
        // Use the newly created transaction
        var transaction = newTransaction
      } else {
        // Use the first found transaction
        var transaction = transactions[0]
        console.log('Found existing transaction:', transaction)
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

      toast({
        title: "Success",
        description: `${transaction.hours} credits have been added to your balance!`,
      })

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
  
  if (isApplied && status === 'completed' && (applicationStatus === 'accepted' || userApplication?.status === 'accepted')) {
    return (
      <Button 
        onClick={handleClaim}
        disabled={isClaiming || isClaimed}
        className={`w-full md:w-auto mt-4 md:mt-0 ${
          isClaimed 
            ? 'bg-gray-400 hover:bg-gray-400' 
            : 'bg-green-500 hover:bg-green-600'
        } text-white`}
      >
        <Gift className="h-4 w-4 mr-1" />
        {isClaimed ? 'Credits Claimed' : 'Claim Credits'}
      </Button>
    )
  }
  
  if (isApplied) {
    const appStatus = applicationStatus || 'pending'
    
    const statusColorClass = appStatus === 'pending' 
      ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
      : appStatus === 'accepted'
        ? 'bg-green-100 text-green-800 border-green-300'
        : 'bg-red-100 text-red-800 border-red-300'
      
    return (
      <Button 
        disabled 
        variant="secondary"
        className={`w-full md:w-auto mt-4 md:mt-0 ${statusColorClass}`}
      >
        <Hourglass className="h-4 w-4 mr-1" />
        {appStatus === 'pending' ? 'Application Pending' : 
         appStatus === 'accepted' ? 'Application Accepted' : 
         'Application Rejected'}
      </Button>
    )
  }

  if (userApplication) {
    const statusColorClass = userApplication.status === 'pending' 
      ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
      : userApplication.status === 'accepted'
        ? 'bg-green-100 text-green-800 border-green-300'
        : 'bg-red-100 text-red-800 border-red-300';

    return (
      <Button 
        disabled 
        variant="secondary"
        className={`w-full md:w-auto mt-4 md:mt-0 ${statusColorClass}`}
      >
        <Hourglass className="h-4 w-4 mr-1" />
        {userApplication.status === 'pending' ? 'Application Pending' : 
          userApplication.status === 'accepted' ? 'Application Accepted' : 
          'Application Rejected'}
      </Button>
    )
  }

  return (
    <Button 
      onClick={() => onApply(offerId)}
      disabled={status !== 'available' || isApplying}
      className="w-full md:w-auto mt-4 md:mt-0 bg-teal hover:bg-teal/90 text-cream"
    >
      <Check className="h-4 w-4 mr-1" />
      {status === 'available' ? 'Apply' : 'Not Available'}
    </Button>
  )
}

export default OfferApplyButton
