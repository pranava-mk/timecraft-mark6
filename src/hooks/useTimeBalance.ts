
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useEffect } from "react"

export const useTimeBalance = (userId: string | null) => {
  const queryResult = useQuery({
    queryKey: ['time-balance', userId],
    queryFn: async () => {
      if (!userId) return 0

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
    enabled: !!userId,
    // Add staleTime to prevent too frequent refetching
    staleTime: 10000, // 10 seconds
  })

  // Set up real-time subscription for time_balances
  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel('time-balance-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'time_balances',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log("Time balance updated:", payload)
          // When time balance changes, refetch the data
          queryResult.refetch()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, queryResult])

  return queryResult
}
