import type { Metadata } from 'next'

import { RoomClient } from '@/modules/room/room-client'
import { SourcePublicNav } from '@/modules/home/source-public-nav'
import { serverEnv } from '@/shared/env'
import { getPublicSiteConfig } from '@/modules/site-config/runtime'

export const metadata: Metadata = {
  title: 'Room',
  description: 'An interactive pixel sanctuary in Keleoz Continuum.',
}

export default async function RoomPage() {
  const config=await getPublicSiteConfig()
  return <><SourcePublicNav current="room" reloadDocument /><RoomClient companionName={serverEnv.AI_COMPANION_NAME} defaultOutfit={config.roomOutfit}/></>
}
