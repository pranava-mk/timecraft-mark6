
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

export const useTimeBalance = (userId: string | null) => {
  return useQuery({
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
    enabled: !!userId
  })
}
