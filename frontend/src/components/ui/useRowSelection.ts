import { useCallback, useEffect, useState } from 'react'

export function useRowSelection<T extends { id: string }>(rows: readonly T[] | undefined) {
  const [selected, setSelected] = useState<Record<string, T>>({})

  useEffect(() => {
    if (!rows) return
    setSelected((current) => {
      const byId = new Map(rows.map((row) => [row.id, row]))
      let changed = false
      const next: Record<string, T> = {}
      for (const [id, row] of Object.entries(current)) {
        const fresh = byId.get(id)
        next[id] = fresh ?? row
        if (fresh && fresh !== row) changed = true
      }
      return changed ? next : current
    })
  }, [rows])

  const onSelectedIdsChange = useCallback(
    (ids: string[]) => {
      setSelected((current) => {
        const byId = new Map((rows ?? []).map((row) => [row.id, row]))
        const next: Record<string, T> = {}
        for (const id of ids) {
          const row = byId.get(id) ?? current[id]
          if (row) next[id] = row
        }
        return next
      })
    },
    [rows],
  )

  const remove = useCallback((ids: string[]) => {
    const drop = new Set(ids)
    setSelected((current) => {
      const next: Record<string, T> = {}
      for (const [id, row] of Object.entries(current)) {
        if (!drop.has(id)) next[id] = row
      }
      return next
    })
  }, [])

  const clear = useCallback(() => setSelected({}), [])

  return {
    selectedIds: Object.keys(selected),
    selectedRows: Object.values(selected),
    onSelectedIdsChange,
    remove,
    clear,
  }
}
