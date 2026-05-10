import { useCallback, useEffect, useRef, useState } from 'react'
import { apiBaseUrl } from '../services/api.js'

const PROBE_TIMEOUT_MS = 5_000
const PROBE_INTERVAL_MS = 30_000

function browserIsOnline() {
  return typeof navigator === 'undefined' ? true : navigator.onLine
}

async function probeConnectivity() {
  if (!browserIsOnline()) {
    return false
  }

  if (!apiBaseUrl) {
    return true
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS)

  try {
    const response = await fetch(`${apiBaseUrl}/`, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
    })
    return response.ok
  } catch {
    return false
  } finally {
    clearTimeout(timeoutId)
  }
}

export function useConnectivity() {
  const [isOnline, setIsOnline] = useState(browserIsOnline)
  const probeInFlightRef = useRef(false)

  const runProbe = useCallback(async () => {
    if (probeInFlightRef.current) {
      return
    }

    probeInFlightRef.current = true

    try {
      const result = await probeConnectivity()
      setIsOnline(result)
    } finally {
      probeInFlightRef.current = false
    }
  }, [])

  useEffect(() => {
    runProbe()

    const handleOnline = () => runProbe()
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    const intervalId = setInterval(() => {
      if (browserIsOnline()) {
        runProbe()
      }
    }, PROBE_INTERVAL_MS)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(intervalId)
    }
  }, [runProbe])

  return { isOnline }
}