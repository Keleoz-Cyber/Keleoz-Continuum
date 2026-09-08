import type { Metadata } from 'next'
import { HistoryClient } from '@/modules/history/history-client'
export const metadata:Metadata={title:'本机存档',robots:{index:false,follow:false}}
export default function HistoryPage(){return <HistoryClient/>}
