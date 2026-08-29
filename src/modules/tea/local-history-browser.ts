import { normalizeTeaSourcePost } from './local-history'

const guestDatabaseName = 'keleoz-continuum-guest'
const guestDatabaseVersion = 1
const guestStoreName = 'experience-state'

function openGuestDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(guestDatabaseName, guestDatabaseVersion)
    request.addEventListener('upgradeneeded', () => {
      if (!request.result.objectStoreNames.contains(guestStoreName)) {
        request.result.createObjectStore(guestStoreName, { keyPath: 'id' })
      }
    })
    request.addEventListener('success', () => resolve(request.result), { once: true })
    request.addEventListener('error', () => reject(request.error), { once: true })
  })
}

export async function saveTeaHistoryRecord(value: unknown) {
  const record = normalizeTeaSourcePost(value)
  if (!record) throw new Error('Invalid Tea history record')
  const database = await openGuestDatabase()
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(guestStoreName, 'readwrite')
      transaction.objectStore(guestStoreName).put(record)
      transaction.addEventListener('complete', () => resolve(), { once: true })
      transaction.addEventListener('abort', () => reject(transaction.error), { once: true })
      transaction.addEventListener('error', () => reject(transaction.error), { once: true })
    })
  } finally {
    database.close()
  }
}
