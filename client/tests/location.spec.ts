import { test, expect } from './fixtures/auth'

// Helper: get the home card and expand its detail view
async function openHomeDetails(page: import('@playwright/test').Page, homeName: string) {
  await page.goto('/profile')
  const homeCard = page.locator('[data-testid="home-row"]').filter({ has: page.getByText(homeName, { exact: true }) })
  await homeCard.getByRole('button', { name: 'Vis detaljer' }).click()
  return homeCard
}

// Helper: get a specific location row by name within a home card
function getLocationRow(homeCard: import('@playwright/test').Locator, name: string) {
  return homeCard.locator('[data-testid="location-row"]').filter({ hasText: name })
}

// --- Locations ---

test('create location appears in home details', async ({ authenticatedPage: page }) => {
  const homeCard = await openHomeDetails(page, 'Testhjemmet')
  const name = `Stue ${Date.now()}`

  await homeCard.getByPlaceholder('Ny plassering…').fill(name)
  await homeCard.getByRole('button', { name: 'Legg til' }).click()

  await expect(getLocationRow(homeCard, name)).toBeVisible()
})

test('rename location shows updated name', async ({ authenticatedPage: page }) => {
  const homeCard = await openHomeDetails(page, 'Testhjemmet')
  const original = `ToRenameL ${Date.now()}`
  const renamed = `RenamedL ${Date.now()}`

  // Create a location to rename
  await homeCard.getByPlaceholder('Ny plassering…').fill(original)
  await homeCard.getByRole('button', { name: 'Legg til' }).click()
  await expect(getLocationRow(homeCard, original)).toBeVisible()

  // Click pencil — span is replaced by a rename input, so hasText filter breaks
  await getLocationRow(homeCard, original).getByTitle('Endre navn').click()
  // Find the rename input by absence of placeholder (distinguishes it from "Ny plassering…")
  await homeCard.locator('[data-testid="location-row"] input:not([placeholder])').fill(renamed)
  await homeCard.locator('[data-testid="location-row"]').getByRole('button', { name: 'Lagre' }).click()

  await expect(getLocationRow(homeCard, renamed)).toBeVisible()
  await expect(homeCard.getByText(original, { exact: true })).not.toBeVisible()
})

test('delete empty location removes it', async ({ authenticatedPage: page }) => {
  const homeCard = await openHomeDetails(page, 'Testhjemmet')
  const name = `ToDeleteL ${Date.now()}`

  await homeCard.getByPlaceholder('Ny plassering…').fill(name)
  await homeCard.getByRole('button', { name: 'Legg til' }).click()
  await expect(getLocationRow(homeCard, name)).toBeVisible()

  await getLocationRow(homeCard, name).getByTitle('Slett').click()

  await expect(homeCard.getByText(name, { exact: true })).not.toBeVisible()
})

test('delete non-empty location shows error', async ({ authenticatedPage: page }) => {
  const homeCard = await openHomeDetails(page, 'Testhjemmet')

  // Kjøleskap has seeded entries — try to delete it
  const row = getLocationRow(homeCard, 'Kjøleskap')
  await row.getByTitle('Slett').click()

  await expect(row.getByText(/flasker/i)).toBeVisible()
})

test('default location has no rename or delete buttons', async ({ authenticatedPage: page }) => {
  const homeCard = await openHomeDetails(page, 'Testhjemmet')

  const standardRow = getLocationRow(homeCard, 'Standard').first()
  await expect(standardRow.getByTitle('Endre navn')).not.toBeVisible()
  await expect(standardRow.getByTitle('Slett')).not.toBeVisible()
})

// --- Sections ---

test('create section appears in location', async ({ authenticatedPage: page }) => {
  const homeCard = await openHomeDetails(page, 'Testhjemmet')
  const locName = `SectionHome ${Date.now()}`
  const secName = `Hylle A ${Date.now()}`

  // Create a fresh location to add sections to
  await homeCard.getByPlaceholder('Ny plassering…').fill(locName)
  await homeCard.getByRole('button', { name: 'Legg til' }).click()
  await expect(getLocationRow(homeCard, locName)).toBeVisible()

  // Expand sections panel
  const row = getLocationRow(homeCard, locName)
  await row.getByRole('button', { name: 'Seksjoner' }).click()

  // Add a section
  await row.getByPlaceholder('Ny seksjon…').fill(secName)
  await row.getByRole('button', { name: 'Legg til' }).click()

  await expect(row.getByText(secName)).toBeVisible()
})

test('rename section shows updated name', async ({ authenticatedPage: page }) => {
  const homeCard = await openHomeDetails(page, 'Testhjemmet')
  const locName = `SecRenameHome ${Date.now()}`
  const original = `HylleOrig ${Date.now()}`
  const renamed = `HylleRenamed ${Date.now()}`

  await homeCard.getByPlaceholder('Ny plassering…').fill(locName)
  await homeCard.getByRole('button', { name: 'Legg til' }).click()

  const row = getLocationRow(homeCard, locName)
  await row.getByRole('button', { name: 'Seksjoner' }).click()
  await row.getByPlaceholder('Ny seksjon…').fill(original)
  await row.getByRole('button', { name: 'Legg til' }).click()
  await expect(row.getByText(original)).toBeVisible()

  // Click pencil next to the section name
  await row.getByText(original).locator('..').getByTitle('Endre navn').click()
  // Two textboxes now exist in the row: rename input (no placeholder) and "Ny seksjon…" input
  await row.locator('input:not([placeholder])').fill(renamed)
  await row.getByRole('button', { name: 'Lagre' }).click()

  await expect(row.getByText(renamed)).toBeVisible()
  await expect(row.getByText(original, { exact: true })).not.toBeVisible()
})

test('delete section removes it from location', async ({ authenticatedPage: page }) => {
  const homeCard = await openHomeDetails(page, 'Testhjemmet')
  const locName = `SecDeleteHome ${Date.now()}`
  const secName = `HylleDelete ${Date.now()}`

  await homeCard.getByPlaceholder('Ny plassering…').fill(locName)
  await homeCard.getByRole('button', { name: 'Legg til' }).click()

  const row = getLocationRow(homeCard, locName)
  await row.getByRole('button', { name: 'Seksjoner' }).click()
  await row.getByPlaceholder('Ny seksjon…').fill(secName)
  await row.getByRole('button', { name: 'Legg til' }).click()
  await expect(row.getByText(secName)).toBeVisible()

  await row.getByText(secName).locator('..').getByTitle('Slett').click()

  await expect(row.getByText(secName, { exact: true })).not.toBeVisible()
})

test('section count badge updates after adding section', async ({ authenticatedPage: page }) => {
  const homeCard = await openHomeDetails(page, 'Testhjemmet')
  const locName = `BadgeHome ${Date.now()}`

  await homeCard.getByPlaceholder('Ny plassering…').fill(locName)
  await homeCard.getByRole('button', { name: 'Legg til' }).click()

  const row = getLocationRow(homeCard, locName)
  await row.getByRole('button', { name: 'Seksjoner' }).click()
  await row.getByPlaceholder('Ny seksjon…').fill('Hylle 1')
  await row.getByRole('button', { name: 'Legg til' }).click()

  // After adding 1 section the badge "1 seksjon" should appear
  await expect(row.getByText('1 seksjon')).toBeVisible()
})
