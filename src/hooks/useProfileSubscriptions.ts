
import { useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useQueryClient } from '@tanstack/react-query'

export const useProfileSubscriptions = (userId: string | null) => {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`
        },
        () => {
          console.log('Profile update received')
          queryClient.invalidateQueries({ queryKey: ['profile', userId] })
        }
      )
      .subscribe()

    const timeBalanceChannel = supabase
      .channel('profile-time-balance-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'time_balances',
          filter: `user_id=eq.${userId}`
        },
        () => {
          console.log('Time balance update received on profile page')
          queryClient.invalidateQueries({ queryKey: ['time-balance', userId] })
        }
      )
      .subscribe()

    const offersChannel = supabase
      .channel('profile-offers-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'offers',
          filter: `profile_id=eq.${userId}`
        },
        () => {
          console.log('Offers update received on profile page')
          queryClient.invalidateQueries({ queryKey: ['user-offers', userId] })
          queryClient.invalidateQueries({ queryKey: ['time-balance', userId] })
          queryClient.invalidateQueries({ queryKey: ['completed-offers', userId] })
        }
      )
      .subscribe()
      
    const transactionsChannel = supabase
      .channel('profile-transactions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions'
        },
        () => {
          console.log('Transactions update received on profile page')
          queryClient.invalidateQueries({ queryKey: ['completed-offers', userId] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      supabase.removeChannel(timeBalanceChannel)
      supabase.removeChannel(offersChannel)
      supabase.removeChannel(transactionsChannel)
    }
  }, [queryClient, userId])
}
