import { describe, expect, it } from 'vitest'
import { toggleColumnSort } from './sort'

describe('toggleColumnSort', () => {
  it('sorts a new column ascending', () => {
    expect(toggleColumnSort('name,asc', 'code')).toBe('code,asc')
  })

  it('flips the active column between ascending and descending', () => {
    expect(toggleColumnSort('name,asc', 'name')).toBe('name,desc')
    expect(toggleColumnSort('name,desc', 'name')).toBe('name,asc')
  })
})
