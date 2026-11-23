import { useQuery } from '@tanstack/react-query'
import { fetchDepartments, fetchLocations, fetchPositions, fetchTeams } from './api'

export function useDepartmentsQuery() {
  return useQuery({
    queryKey: ['departments'],
    queryFn: () => fetchDepartments({ page: 0, size: 100 }),
  })
}

export function usePositionsQuery() {
  return useQuery({
    queryKey: ['positions'],
    queryFn: () => fetchPositions({ page: 0, size: 100 }),
  })
}

export function useTeamsQuery() {
  return useQuery({
    queryKey: ['teams'],
    queryFn: () => fetchTeams({ page: 0, size: 100 }),
  })
}

export function useLocationsQuery() {
  return useQuery({
    queryKey: ['locations'],
    queryFn: () => fetchLocations({ page: 0, size: 100 }),
  })
}
