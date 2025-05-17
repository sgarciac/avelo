export interface CurrentAvailableSnapshot {
  kind: string
  label: string
  timestamp: string
  data: CurrentAvailableEntry[]
}

export type StationStatus = 'PLANNED' | 'IN_SERVICE' | 'MAINTENANCE'
export interface CurrentAvailableEntry {
  name: string
  id: number
  status: StationStatus
  bikes: number | null
  free_docks: number | null
  lat: number
  long: number
}

export interface Past24HoursSnapshot {
  kind: string
  label: string
  timestamp: string
  data: AvailabilityEntryPoint[]
  station_id: number
  station_name: string
}

export interface AvailabilityEntryPoint {
  bikes: number | null
  free_docks: number | null
  timestamp: string
}
