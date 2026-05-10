import { useSyncExternalStore } from 'react'

function subscribe(callback) {
  window.addEventListener('online', callback)
  window.addEventListener('offline', callback)

  return () => {
    window.removeEventListener('online', callback)
    window.removeEventListener('offline', callback)
  }
}

function getSnapshot() {
  return typeof navigator === 'undefined' ? true : navigator.onLine
}

export function useConnectivity() {
  const isOnline = useSyncExternalStore(subscribe, getSnapshot, () => true)
  return { isOnline }
}