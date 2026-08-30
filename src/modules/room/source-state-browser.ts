import {
  ROOM_SOURCE_STATE_KEY,
  ROOM_SOURCE_STATE_RECORD_ID,
  clearRoomSourceStateInstall,
  createRoomSourceStateChannel,
  createRoomSourceStateFailover,
  createRoomSourceStateLeases,
  decodeRoomSourceStateRecord,
  encodeRoomSourceStateRecord,
  normalizeRoomSourceState,
} from './source-state'

const databaseName = 'keleoz-continuum-guest'
const databaseVersion = 1
const storeName = 'experience-state'

interface InstalledBridge {
  close: () => void
}

let installedBridge: InstalledBridge | null = null
let installPromise: Promise<InstalledBridge> | null = null

function requestResult<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.addEventListener('success', () => resolve(request.result), { once: true })
    request.addEventListener('error', () => reject(request.error ?? new Error('IndexedDB request failed')), { once: true })
  })
}

function transactionComplete(transaction: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    transaction.addEventListener('complete', () => resolve(), { once: true })
    transaction.addEventListener('abort', () => reject(transaction.error ?? new Error('IndexedDB transaction aborted')), { once: true })
    transaction.addEventListener('error', () => reject(transaction.error ?? new Error('IndexedDB transaction failed')), { once: true })
  })
}

async function openRoomStateDatabase() {
  const request = indexedDB.open(databaseName, databaseVersion)
  request.addEventListener('upgradeneeded', () => {
    if (!request.result.objectStoreNames.contains(storeName)) {
      request.result.createObjectStore(storeName, { keyPath: 'id' })
    }
  })
  return requestResult(request)
}

async function readRoomState(database: IDBDatabase) {
  const transaction = database.transaction(storeName, 'readonly')
  const complete = transactionComplete(transaction)
  const request = requestResult(transaction.objectStore(storeName).get(ROOM_SOURCE_STATE_RECORD_ID))
  const [value] = await Promise.all([request, complete])
  return {
    corrupt: value !== undefined && decodeRoomSourceStateRecord(value) === null,
    sourceState: decodeRoomSourceStateRecord(value),
  }
}

async function writeRoomState(database: IDBDatabase, sourceState: string | null) {
  const transaction = database.transaction(storeName, 'readwrite')
  const complete = transactionComplete(transaction)
  const store = transaction.objectStore(storeName)
  if (sourceState) store.put(encodeRoomSourceStateRecord(sourceState))
  else store.delete(ROOM_SOURCE_STATE_RECORD_ID)
  await complete
}

export async function loadRoomSourceStateFromBrowser() {
  let database: IDBDatabase | null = null
  try {
    database = await openRoomStateDatabase()
    const stored = await readRoomState(database)
    if (stored.corrupt) await writeRoomState(database, null)
    return stored.sourceState
  } catch (error) {
    console.warn('Character IndexedDB state could not be read; using the source localStorage fallback.', error)
    try {
      return normalizeRoomSourceState(window.localStorage.getItem(ROOM_SOURCE_STATE_KEY))
    } catch {
      return null
    }
  } finally {
    database?.close()
  }
}

export async function saveRoomSourceStateFromBrowser(sourceState: string) {
  const normalized = normalizeRoomSourceState(sourceState)
  if (!normalized) throw new Error('Invalid Room source state')

  let database: IDBDatabase | null = null
  try {
    database = await openRoomStateDatabase()
    await writeRoomState(database, normalized)
    try {
      window.localStorage.removeItem(ROOM_SOURCE_STATE_KEY)
    } catch {}
  } catch (error) {
    console.warn('Character IndexedDB state could not be saved; using the source localStorage fallback.', error)
    window.localStorage.setItem(ROOM_SOURCE_STATE_KEY, normalized)
  } finally {
    database?.close()
  }
}

async function installBridge(): Promise<InstalledBridge> {
  let browserStorage: Storage
  let storagePrototype: Storage
  let originalGetItem: Storage['getItem']
  let originalSetItem: Storage['setItem']
  let originalRemoveItem: Storage['removeItem']

  try {
    browserStorage = window.localStorage
    storagePrototype = Object.getPrototypeOf(browserStorage) as Storage
    originalGetItem = storagePrototype.getItem
    originalSetItem = storagePrototype.setItem
    originalRemoveItem = storagePrototype.removeItem
  } catch (error) {
    console.warn('Room browser storage is unavailable; loading the source runtime without persistence.', error)
    return { close() {} }
  }

  let database: IDBDatabase

  try {
    database = await openRoomStateDatabase()
  } catch (error) {
    console.warn('Room IndexedDB unavailable; using the source browser state fallback.', error)
    return { close() {} }
  }

  const legacyState = normalizeRoomSourceState(originalGetItem.call(browserStorage, ROOM_SOURCE_STATE_KEY))
  let initialState: string | null = null
  try {
    const stored = await readRoomState(database)
    initialState = legacyState ?? stored.sourceState
    if (legacyState) await writeRoomState(database, legacyState)
    else if (stored.corrupt) await writeRoomState(database, null)
    originalRemoveItem.call(browserStorage, ROOM_SOURCE_STATE_KEY)
  } catch (error) {
    database.close()
    console.warn('Room IndexedDB state could not be prepared; using the source browser state fallback.', error)
    return { close() {} }
  }

  let closed = false
  let restoreNativeMethods = () => {}
  const closeDatabase = () => {
    if (closed) return
    closed = true
    database.close()
  }
  const persist = createRoomSourceStateFailover(
    (sourceState) => writeRoomState(database, sourceState),
    (sourceState, error) => {
      restoreNativeMethods()
      try {
        if (sourceState) originalSetItem.call(browserStorage, ROOM_SOURCE_STATE_KEY, sourceState)
        else originalRemoveItem.call(browserStorage, ROOM_SOURCE_STATE_KEY)
      } catch (storageError) {
        console.warn('Room fallback state could not be persisted.', storageError)
      }
      closeDatabase()
      if (error) console.warn('Room IndexedDB persistence failed; restored the source localStorage fallback.', error)
    },
  )
  const channel = createRoomSourceStateChannel(initialState, persist)

  const bridgedGetItem = function (this: Storage, key: string) {
    return this === browserStorage
      ? channel.getItem(key, () => originalGetItem.call(this, key))
      : originalGetItem.call(this, key)
  }
  const bridgedSetItem = function (this: Storage, key: string, value: string) {
    if (this === browserStorage) {
      channel.setItem(key, value, (delegateKey, delegateValue) => originalSetItem.call(this, delegateKey, delegateValue))
      return
    }
    originalSetItem.call(this, key, value)
  }
  const bridgedRemoveItem = function (this: Storage, key: string) {
    if (this === browserStorage) {
      channel.removeItem(key, (delegateKey) => originalRemoveItem.call(this, delegateKey))
      return
    }
    originalRemoveItem.call(this, key)
  }
  restoreNativeMethods = () => {
    if (storagePrototype.getItem === bridgedGetItem) storagePrototype.getItem = originalGetItem
    if (storagePrototype.setItem === bridgedSetItem) storagePrototype.setItem = originalSetItem
    if (storagePrototype.removeItem === bridgedRemoveItem) storagePrototype.removeItem = originalRemoveItem
  }

  try {
    storagePrototype.getItem = bridgedGetItem
    storagePrototype.setItem = bridgedSetItem
    storagePrototype.removeItem = bridgedRemoveItem
  } catch (error) {
    try {
      if (initialState) originalSetItem.call(browserStorage, ROOM_SOURCE_STATE_KEY, initialState)
    } catch (storageError) {
      console.warn('Room fallback state could not be restored after bridge installation failed.', storageError)
    }
    restoreNativeMethods()
    closeDatabase()
    console.warn('Room state bridge could not be installed; using the source browser state fallback.', error)
    return { close() {} }
  }

  return {
    close() {
      restoreNativeMethods()
      void channel.flush().finally(closeDatabase)
    },
  }
}

const leases = createRoomSourceStateLeases(() => {
  installedBridge?.close()
  installedBridge = null
  installPromise = null
})

export async function acquireRoomSourceStateBridge() {
  const release = leases.acquire()
  const pendingInstall = installPromise ?? installBridge()
  installPromise = pendingInstall
  try {
    const bridge = await pendingInstall
    installedBridge = bridge
    return release
  } catch (error) {
    release()
    installPromise = clearRoomSourceStateInstall(installPromise, pendingInstall)
    throw error
  }
}
