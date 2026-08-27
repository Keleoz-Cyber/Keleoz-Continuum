import type { Metadata } from 'next'

import { RoomClient } from '@/modules/room/room-client'

export const metadata: Metadata = {
  title: 'Room',
  description: 'An interactive pixel sanctuary in Keleoz Continuum.',
}

export default function RoomPage() {
  return <RoomClient />
}
