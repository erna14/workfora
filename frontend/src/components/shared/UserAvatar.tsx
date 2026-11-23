import { Avatar } from '@mantine/core'
import { initials } from '../../utils/format'

interface UserAvatarProps {
  firstName?: string | null
  lastName?: string | null
  size?: number | string
}

export function UserAvatar({ firstName, lastName, size = 32 }: UserAvatarProps) {
  return (
    <Avatar radius="xl" size={size} color="brand" variant="light">
      {initials(firstName, lastName)}
    </Avatar>
  )
}
