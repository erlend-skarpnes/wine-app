export const queryKeys = {
  homes: () => ['homes'] as const,
  homeMembers: (homeId: number) => ['home-members', homeId] as const,
  locations: (homeId: number) => ['locations', homeId] as const,
  homeEntries: (homeId: number) => ['home-entries', homeId] as const,
  entryLocations: (homeId: number, barcode: string) => ['entry-locations', homeId, barcode] as const,
  wine: (barcode: string) => ['wine', barcode] as const,
  drinkHistory: () => ['drink-history'] as const,
}
