// Self-contained browser code shared by the two original runtimes and unit tests.
export const autosaveRuntime = String.raw`
function createSourceAutosave({read,write,accept,status,delay=900}){
  let saved, timer, pending, generation=0;
  const signature=value=>JSON.stringify(value);
  const dirty=()=>signature(read())!==saved;
  const flush=()=>{
    clearTimeout(timer);
    if(pending)return pending;
    const current=generation;
    pending=(async()=>{
      while(current===generation&&dirty()){
        const snapshot=read(), key=signature(snapshot);
        status('saving');
        try{
          const result=await write(snapshot);
          if(current!==generation)return;
          accept(result);saved=key;
        }catch(error){status('error',error);throw error}
      }
      if(current===generation)status('saved');
    })().finally(()=>{pending=null});
    return pending;
  };
  return {dirty,flush,
    reset(){clearTimeout(timer);generation++;saved=signature(read());status('saved')},
    change(){clearTimeout(timer);status('dirty');timer=setTimeout(()=>{flush().catch(()=>{})},delay)}
  };
}
`
