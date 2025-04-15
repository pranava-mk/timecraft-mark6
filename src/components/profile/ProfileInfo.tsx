
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"

interface ProfileInfoProps {
  profile: {
    username?: string
    avatar_url?: string
    services?: string[]
  } | null
  isLoading: boolean
}

const ProfileInfo = ({ profile, isLoading }: ProfileInfoProps) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-4">
          {isLoading ? (
            <Skeleton className="h-16 w-16 md:h-20 md:w-20 rounded-full" />
          ) : (
            <Avatar className="h-16 w-16 md:h-20 md:w-20">
              <AvatarImage src={profile?.avatar_url || "/placeholder.svg"} />
              <AvatarFallback>
                {profile?.username?.substring(0, 2).toUpperCase() || 'UN'}
              </AvatarFallback>
            </Avatar>
          )}
          <div>
            {isLoading ? (
              <Skeleton className="h-8 w-40" />
            ) : (
              <CardTitle className="text-xl md:text-2xl">
                {profile?.username || 'Username not set'}
              </CardTitle>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Interests</h3>
            {isLoading ? (
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-32" />
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {profile?.services?.map((service: string) => (
                  <span
                    key={service}
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-secondary text-secondary-foreground"
                  >
                    {service}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default ProfileInfo
