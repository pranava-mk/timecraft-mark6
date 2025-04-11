
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/components/ui/use-toast'

export const useCompleteOffer = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const completeOffer = useMutation({
    mutationFn: async (offerId: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // First get the offer to verify ownership and get details
      const { data: offer, error: offerError } = await supabase
        .from('offers')
        .select('profile_id, time_credits, service_type')
        .eq('id', offerId)
        .single()
      
      if (offerError) throw offerError
      
      // Verify the current user is the offer owner
      if (offer.profile_id !== user.id) {
        throw new Error('Only the offer owner can mark it as completed')
      }
      
      // Get the accepted applicant - using maybeSingle() to handle cases when there's no accepted application
      const { data: acceptedApplication, error: applicationError } = await supabase
        .from('offer_applications')
        .select('applicant_id')
        .eq('offer_id', offerId)
        .eq('status', 'accepted')
        .maybeSingle()
      
      if (applicationError) throw applicationError
      if (!acceptedApplication) throw new Error('No accepted application found for this offer')
      
      // Update the offer status to completed
      const { error: updateError } = await supabase
        .from('offers')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', offerId)
      
      if (updateError) throw updateError
      
      // Check if provider already has a time balance
      const { data: currentBalance, error: balanceReadError } = await supabase
        .from('time_balances')
        .select('balance')
        .eq('user_id', acceptedApplication.applicant_id)
        .maybeSingle()
      
      if (balanceReadError) throw balanceReadError
      
      // If no balance entry exists yet, create one with the earned credits
      if (!currentBalance) {
        const { error: createBalanceError } = await supabase
          .from('time_balances')
          .insert({ 
            user_id: acceptedApplication.applicant_id,
            balance: offer.time_credits || 1
          })
        
        if (createBalanceError) throw createBalanceError
      } else {
        // Otherwise update the existing balance
        const newBalance = currentBalance.balance + (offer.time_credits || 1)
        
        const { error: balanceError } = await supabase
          .from('time_balances')
          .update({ 
            balance: newBalance,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', acceptedApplication.applicant_id)
        
        if (balanceError) throw balanceError
      }
      
      // Create a transaction record
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          service: offer.service_type || 'Time Exchange',
          hours: offer.time_credits || 1,
          user_id: user.id,  // Requester
          provider_id: acceptedApplication.applicant_id,  // Service provider
          offer_id: offerId
        })
      
      if (transactionError) throw transactionError

      return {
        success: true,
        providerId: acceptedApplication.applicant_id,
        credits: offer.time_credits || 1
      }
    },
    onSuccess: (result) => {
      toast({
        title: "Success",
        description: `Offer marked as completed and ${result.credits} credits transferred`,
      })
      
      // Invalidate all relevant queries to update the UI
      queryClient.invalidateQueries({ queryKey: ['user-offers'] })
      queryClient.invalidateQueries({ queryKey: ['offers'] })
      queryClient.invalidateQueries({ queryKey: ['time-balance'] })
      queryClient.invalidateQueries({ queryKey: ['user-stats'] })
      queryClient.invalidateQueries({ queryKey: ['completed-offers'] })
      queryClient.invalidateQueries({ queryKey: ['pending-offers-and-applications'] })
    },
    onError: (error) => {
      console.error("Error completing offer:", error)
      toast({
        title: "Error",
        description: `Failed to complete offer: ${error.message}`,
        variant: "destructive",
      })
    }
  })

  return {
    completeOffer: completeOffer.mutate,
    isCompleting: completeOffer.isPending
  }
}
