import { describe, expect, it } from 'vitest'
import { fieldError } from './fieldError'

describe('fieldError', () => {
  it('reads a string or an object message', () => {
    expect(fieldError([])).toBeUndefined()
    expect(fieldError(['Required'])).toBe('Required')
    expect(fieldError([{ message: 'Too long' }])).toBe('Too long')
  })
})