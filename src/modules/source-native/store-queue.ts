export function createSourceStoreQueue() {
  const tails = new Map<string, Promise<unknown>>()
  return { run: <T>(store: string, operation: () => Promise<T>): Promise<T> => {
    const task = (tails.get(store) || Promise.resolve()).catch(() => {}).then(operation)
    tails.set(store, task)
    const settled = () => { if (tails.get(store) === task) tails.delete(store) }
    task.then(settled, settled)
    return task
  } }
}
