
import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { supabase } from "@/integrations/supabase/client"
import ProfileHeader from "@/components/profile/ProfileHeader"
import ProfileInfo from "@/components/profile/ProfileInfo"
import UserOffers from "@/components/profile/UserOffers"
import { useProfileData } from "@/hooks/useProfileData"
import { useUserOffers } from "@/hooks/useUserOffers"
import { useTimeBalance } from "@/hooks/useTimeBalance"
import { useProfileSubscriptions } from "@/hooks/useProfileSubscriptions"

const Profile = () => {
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserId = async () => {
      const { data } = await supabase.auth.getUser()
      if (data?.user?.id) {
        setUserId(data.user.id)
      }
    }
    
    fetchUserId()
  }, [])

  // Set up subscriptions for real-time updates
  useProfileSubscriptions(userId)

  // Fetch profile data
  const { data: profile, isLoading: profileLoading } = useProfileData(userId)

  // Fetch user offers
  const { data: userOffers, isLoading: userOffersLoading } = useUserOffers(userId)

  // Fetch time balance
  const { data: timeBalance, isLoading: timeBalanceLoading } = useTimeBalance(userId)

  if (!userId) {
    return (
      <div className="container mx-auto p-4 space-y-6 max-w-2xl">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl md:text-4xl font-bold">Profile</h1>
        </div>
        <Card>
          <CardContent className="p-8">
            <div className="flex justify-center">
              <Skeleton className="h-32 w-32 rounded-full" />
            </div>
            <div className="space-y-2 mt-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-6 w-3/4" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 space-y-6 max-w-2xl">
      <ProfileHeader 
        timeBalance={timeBalance || 0} 
        isLoading={timeBalanceLoading} 
      />
      
      <ProfileInfo 
        profile={profile} 
        isLoading={profileLoading} 
      />

      <UserOffers 
        userId={userId}
        username={profile?.username}
        avatar={profile?.avatar_url}
        userOffers={userOffers}
        isLoading={userOffersLoading}
        timeBalance={timeBalance || 0}
        profile={profile}
      />
    </div>
  )
}

export default Profile
