import { describe, expect, it } from 'vitest'
import {
  assigneeLabel,
  bulkResultMessage,
  categoryLabel,
  filterAssets,
  formatPurchaseCost,
  historyDetail,
  historyTitle,
  summarizeAssets,
} from './structure'
import type { AssetHistoryEvent } from './types'
import type { Asset } from './types'

function asset(overrides: Partial<Asset>): Asset {
  return {
    id: 'a1',
    categoryId: 'laptops',
    assetTag: 'LT-1',
    name: 'ThinkPad',
    serialNumber: 'SN-9',
    status: 'AVAILABLE',
    purchaseDate: '2024-03-01',
    purchaseCost: 1200,
    notes: null,
    archivedAt: null,
    currentAssignment: null,
    ...overrides,
  }
}

function event(overrides: Partial<AssetHistoryEvent>): AssetHistoryEvent {
  return {
    type: 'UPDATED',
    occurredAt: '2024-05-01T10:00:00Z',
    actorUserId: null,
    actorName: 'Alex Admin',
    field: 'name',
    previousValue: 'Old',
    newValue: 'New',
    employeeId: null,
    employeeName: null,
    employeeNumber: null,
    assignedAt: null,
    returnedAt: null,
    notes: null,
    ...overrides,
  }
}

describe('asset inventory helpers', () => {
  const names = new Map([['laptops', 'Laptops']])

  it('resolves a category and leaves an unknown id visible', () => {
    expect(categoryLabel('laptops', names)).toBe('Laptops')
    expect(categoryLabel(null, names)).toBe('Uncategorized')
    expect(categoryLabel('missing', names)).toBe('Unknown category')
  })

  it('shows the current holder and a clear empty state', () => {
    expect(assigneeLabel(asset({}))).toBe('Not assigned')
    expect(
      assigneeLabel(
        asset({
          status: 'ASSIGNED',
          currentAssignment: {
            employeeId: 'e1',
            fullName: 'Jamie Employee',
            employeeNumber: 'EMP-0003',
            assignedAt: '2024-05-01T10:00:00Z',
          },
        }),
      ),
    ).toBe('Jamie Employee · EMP-0003')
    expect(assigneeLabel(asset({ status: 'ASSIGNED' }))).toBe('Assignment details unavailable')
  })

  it('filters the current page by name, tag, serial, category, and status', () => {
    const rows = [
      asset({ id: '1', name: 'ThinkPad', assetTag: 'LT-1', serialNumber: 'AAA' }),
      asset({ id: '2', name: 'Monitor', assetTag: 'MN-2', serialNumber: 'BBB', status: 'ASSIGNED', categoryId: 'screens' }),
    ]
    expect(filterAssets(rows, { search: 'aaa', categoryId: null, status: null }).map((row) => row.id)).toEqual(['1'])
    expect(filterAssets(rows, { search: 'mn-2', categoryId: null, status: null }).map((row) => row.id)).toEqual(['2'])
    expect(filterAssets(rows, { search: '', categoryId: 'screens', status: 'ASSIGNED' }).map((row) => row.id)).toEqual(['2'])
  })

  it('keeps available and assigned counts on the page when the inventory spans pages', () => {
    const summary = summarizeAssets(
      [asset({ status: 'AVAILABLE', purchaseCost: 10 }), asset({ id: '2', status: 'ASSIGNED', purchaseCost: null })],
      40,
      false,
    )
    expect(summary).toMatchObject({
      scope: 'page',
      total: 40,
      available: 1,
      assigned: 1,
      purchaseValue: 10,
      missingCost: 1,
    })
  })

  it('treats a single page as the organization inventory', () => {
    expect(summarizeAssets([asset({})], 1, true).scope).toBe('organization')
  })

  it('describes history changes and reports each bulk failure', () => {
    expect(historyTitle(event({}))).toBe('Name changed')
    expect(historyDetail(event({ previousValue: null, newValue: 'Dock' }))).toBe('Empty → Dock')
    expect(
      historyDetail(
        event({
          type: 'RETURNED',
          employeeName: 'Jamie Employee',
          employeeNumber: 'EMP-0003',
          assignedAt: '2024-05-01T10:00:00Z',
          returnedAt: '2024-05-01T12:00:00Z',
          notes: 'Left the desk',
          actorName: 'Alex Admin',
        }),
      ),
    ).toContain('Jamie Employee · EMP-0003')
    expect(
      bulkResultMessage(
        'Archived',
        {
          succeeded: 1,
          failed: 1,
          items: [
            { id: '1', success: true, message: 'Archived' },
            { id: '2', success: false, message: 'Return the asset before archiving it' },
          ],
        },
        new Map([['2', 'Phone']]),
      ),
    ).toEqual({
      color: 'yellow',
      message: 'Archived 1. Phone: Return the asset before archiving it',
    })
  })

  it('formats a purchase cost with two decimal places', () => {
    expect(formatPurchaseCost(1200)).toMatch(/1,200\.00|1200\.00/)
    expect(formatPurchaseCost(null)).toBe('—')
  })
})
