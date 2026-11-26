import { describe, expect, it } from 'vitest'
import { routeErrorCopy } from './routeError'

describe('routeErrorCopy', () => {
  it('uses a not-found message for 404', () => {
    expect(routeErrorCopy(404)).toEqual({
      notFound: true,
      title: 'Page not found',
      description: 'That address is not part of Workfora.',
    })
  })

  it('uses a request message for other HTTP failures', () => {
    expect(routeErrorCopy(500).notFound).toBe(false)
    expect(routeErrorCopy(500).title).toBe('Something went wrong')
    expect(routeErrorCopy(403).description).toContain('request')
  })

  it('uses a page message when the failure has no status', () => {
    expect(routeErrorCopy(null).description).toContain('could not be loaded')
  })
})
