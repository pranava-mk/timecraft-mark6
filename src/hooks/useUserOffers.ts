
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

export const useUserOffers = (userId: string | null) => {
  return useQuery({
    queryKey: ['user-offers', userId],
    queryFn: async () => {
      if (!userId) return null

      const { data, error } = await supabase
        .from('offers')
        .select('*')
        .eq('profile_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      console.log('User offers in profile page:', data)
      return data
    },
    enabled: !!userId
  })
}
