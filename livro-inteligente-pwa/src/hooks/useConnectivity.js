import { useCallback, useEffect, useRef, useState } from 'react'
import { apiBaseUrl } from '../services/api.js'

const PROBE_TIMEOUT_MS = 5_000
const PROBE_INTERVAL_MS = 30_000

function getProbeUrl() {
  if (apiBaseUrl) {
    return `${apiBaseUrl}/`
  }

  if (typeof window !== 'undefined') {
    return new URL('/favicon.svg', window.location.origin).toString()
  }

  return null
}

function browserIsOnline() {
  return typeof navigator === 'undefined' ? true : navigator.onLine
}

async function probeConnectivity() {
  if (!browserIsOnline()) {
    return false
  }

  const probeUrl = getProbeUrl()

  if (!probeUrl) {
    return browserIsOnline()
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS)

  try {
    const response = await fetch(probeUrl, {
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
  const [connectivityState, setConnectivityState] = useState(() =>
    browserIsOnline() ? 'unknown' : 'offline',
  )
  const probeInFlightRef = useRef(false)

  const runProbe = useCallback(async () => {
    if (probeInFlightRef.current) {
      return
    }

    probeInFlightRef.current = true

    try {
      const result = await probeConnectivity()
      setConnectivityState(result ? 'online' : 'offline')
    } finally {
      probeInFlightRef.current = false
    }
  }, [])

  useEffect(() => {
    runProbe()

    const handleOnline = () => runProbe()
  const handleOffline = () => setConnectivityState('offline')

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

  return {
    isOnline: connectivityState === 'online',
    probeReady: connectivityState !== 'unknown',
  }
}