import { TAROT_SPREADS, type TarotSpreadId } from './contracts'
export type MobileTarotDraw={cardId:string;reversed:boolean}
export type MobileTarotState={spread:TarotSpreadId;guide:boolean;totalSlots:number;deck:string[];slots:MobileTarotDraw[]}
function total(spread:TarotSpreadId,guide:boolean){const item=TAROT_SPREADS.find(s=>s.id===spread)!;return (spread==='free'?3:item.slots.length)+(guide?1:0)}
export function createMobileTarotState(deck:string[]):MobileTarotState{return{spread:'single',guide:false,totalSlots:1,deck:[...deck],slots:[]}}
export function selectMobileTarotSpread(state:MobileTarotState,spread:TarotSpreadId):MobileTarotState{return{...state,spread,totalSlots:total(spread,state.guide),slots:[]}}
export function toggleMobileTarotGuide(state:MobileTarotState,guide:boolean):MobileTarotState{return{...state,guide,totalSlots:total(state.spread,guide),slots:[]}}
export function drawMobileTarotCard(state:MobileTarotState,deckIndex:number,reversed:boolean):MobileTarotState{const cardId=state.deck[deckIndex];if(!cardId||state.slots.length>=state.totalSlots||state.slots.some(s=>s.cardId===cardId))return state;return{...state,slots:[...state.slots,{cardId,reversed}]}}
