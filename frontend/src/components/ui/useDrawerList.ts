import { useCallback, useRef, useState } from 'react'

/**
 * Records shown in a confirmation drawer.
 * They stay until the close animation ends, unless the drawer opens again first.
 */
export function useDrawerList<T>() {
  const [opened, setOpened] = useState(false)
  const openedRef = useRef(false)
  const [items, setItems] = useState<T[]>([])
  const [errors, setErrors] = useState<string[]>([])

  const setVisible = useCallback((open: boolean) => {
    openedRef.current = open
    setOpened(open)
  }, [])

  const ask = useCallback((next: T[]) => {
    setErrors([])
    setItems(next)
    openedRef.current = true
    setOpened(true)
  }, [])

  const onExitTransitionEnd = useCallback(() => {
    if (!openedRef.current) {
      setItems([])
      setErrors([])
    }
  }, [])

  return { opened, items, errors, setErrors, setItems, setVisible, ask, onExitTransitionEnd }
}
