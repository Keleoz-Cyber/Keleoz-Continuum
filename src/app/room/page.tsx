import type { Metadata } from 'next'

import { RoomClient } from '@/modules/room/room-client'
import { SourcePublicNav } from '@/modules/home/source-public-nav'

export const metadata: Metadata = {
  title: 'Room',
  description: 'An interactive pixel sanctuary in Keleoz Continuum.',
}

export default function RoomPage() {
  return <><SourcePublicNav current="room" reloadDocument /><RoomClient /></>
}
