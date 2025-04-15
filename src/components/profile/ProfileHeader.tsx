
import React from 'react'
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { useQueryClient } from "@tanstack/react-query"

interface ProfileHeaderProps {
  timeBalance: number
  isLoading: boolean
}

const ProfileHeader = ({ timeBalance, isLoading }: ProfileHeaderProps) => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      queryClient.clear()
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error logging out",
        description: error.message,
      })
    }
  }

  return (
    <div className="flex justify-between items-center">
      <h1 className="text-2xl md:text-4xl font-bold">Profile</h1>
      <div className="flex items-center gap-4">
        {isLoading ? (
          <Skeleton className="h-6 w-24" />
        ) : (
          <div className="text-sm font-medium">
            <span className="text-teal">{timeBalance}</span> credits available
          </div>
        )}
        <Button variant="outline" onClick={handleLogout}>
          Logout
        </Button>
      </div>
    </div>
  )
}

export default ProfileHeader
