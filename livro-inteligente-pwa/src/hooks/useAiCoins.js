import { useEffect, useState } from 'react'
import { AI_COINS_CHANGED_EVENT, consumeCoinForBook, getCoinsForBook, initCoinsForBook } from '../services/db.js'

export function useAiCoins(bookId) {
  const [coins, setCoins] = useState(null)
  const [isLoading, setIsLoading] = useState(Boolean(bookId))

  useEffect(() => {
    if (!Number.isInteger(bookId) || bookId <= 0) {
      setCoins(null)
      setIsLoading(false)
      return
    }

    let isActive = true

    const loadCoins = async () => {
      setIsLoading(true)

      try {
        await initCoinsForBook(bookId)
        const nextCoins = await getCoinsForBook(bookId)

        if (isActive) {
          setCoins(nextCoins)
        }
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    loadCoins()

    const handleCoinsChanged = (event) => {
      if (event.detail?.bookId === bookId) {
        setCoins(event.detail.coins)
      }
    }

    window.addEventListener(AI_COINS_CHANGED_EVENT, handleCoinsChanged)

    return () => {
      isActive = false
      window.removeEventListener(AI_COINS_CHANGED_EVENT, handleCoinsChanged)
    }
  }, [bookId])

  const consumeCoin = async () => {
    if (!Number.isInteger(bookId) || bookId <= 0) {
      throw new Error('Livro invalido para consumir moedas de IA.')
    }

    const nextCoins = await consumeCoinForBook(bookId)
    setCoins(nextCoins)
    return nextCoins
  }

  return {
    coins,
    consumeCoin,
    isLoading,
  }
}