import type { Metadata } from 'next'
import { MobileTarotClient } from '@/modules/tarot/mobile-tarot-client'
import { serverEnv } from '@/shared/env'
export const metadata:Metadata={title:'Tarot',description:'A browser-local Tarot table in Keleoz Continuum.'}
export default function TarotPage(){return <MobileTarotClient companionName={serverEnv.AI_COMPANION_NAME}/>} 
