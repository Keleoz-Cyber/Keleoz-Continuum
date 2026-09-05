import type { Metadata } from 'next'
import { MobileTarotClient } from '@/modules/tarot/mobile-tarot-client'
import { serverEnv } from '@/shared/env'
import { getOriginalTarotFaces } from '@/modules/source-native/tarot-faces'
export const metadata:Metadata={title:'Tarot',description:'A browser-local Tarot table in Keleoz Continuum.'}
export default function TarotPage(){const assets=getOriginalTarotFaces();return <><style>{assets.css}</style><MobileTarotClient companionName={serverEnv.AI_COMPANION_NAME} faces={assets.faces}/></>}
