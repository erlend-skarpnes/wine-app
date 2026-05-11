import { test, expect } from './fixtures/auth'

async function openHomeManageModal(page: import('@playwright/test').Page, homeName: string) {
  await page.goto('/profile')
  const homeCard = page.locator('[data-testid="home-row"]').filter({ has: page.getByText(homeName, { exact: true }) })
  await homeCard.getByRole('button', { name: 'Administrer' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  return page.getByRole('dialog').first()
}

function getLocationItem(modal: import('@playwright/test').Locator, name: string) {
  return modal.locator('[data-testid="location-row"]').filter({ hasText: name })
}

// --- Locations ---

test('create location appears in home manage modal', async ({ authenticatedPage: page }) => {
  const homeModal = await openHomeManageModal(page, 'Testhjemmet')
  const name = `Stue ${Date.now()}`

  await homeModal.getByPlaceholder('Ny plassering…').fill(name)
  await homeModal.getByRole('button', { name: 'Legg til' }).click()

  await expect(getLocationItem(homeModal, name)).toBeVisible()
})

test('rename location shows updated name', async ({ authenticatedPage: page }) => {
  const homeModal = await openHomeManageModal(page, 'Testhjemmet')
  const original = `ToRenameL ${Date.now()}`
  const renamed = `RenamedL ${Date.now()}`

  // Create a location to rename
  await homeModal.getByPlaceholder('Ny plassering…').fill(original)
  await homeModal.getByRole('button', { name: 'Legg til' }).click()
  await expect(getLocationItem(homeModal, original)).toBeVisible()

  // Open LocationManageModal for this location
  await getLocationItem(homeModal, original).click()
  const locModal = page.getByRole('dialog').last()

  // Rename via the Navn input (first input in the modal, no placeholder)
  await locModal.locator('input:not([placeholder])').fill(renamed)
  await locModal.locator('input:not([placeholder])').press('Tab')
  await locModal.getByRole('button', { name: 'Lagre' }).first().click()

  // Go back to home modal and verify new name
  await locModal.getByTitle('Tilbake').click()

  await expect(getLocationItem(homeModal, renamed)).toBeVisible()
  await expect(homeModal.getByText(original, { exact: true })).not.toBeVisible()
})

test('delete empty location removes it', async ({ authenticatedPage: page }) => {
  const homeModal = await openHomeManageModal(page, 'Testhjemmet')
  const name = `ToDeleteL ${Date.now()}`

  await homeModal.getByPlaceholder('Ny plassering…').fill(name)
  await homeModal.getByRole('button', { name: 'Legg til' }).click()
  await expect(getLocationItem(homeModal, name)).toBeVisible()

  // Open and delete via LocationManageModal
  await getLocationItem(homeModal, name).click()
  const locModal = page.getByRole('dialog').last()
  await locModal.getByRole('button', { name: 'Slett plassering' }).click()

  // Modal closes automatically on success; location should be gone
  await expect(homeModal.getByText(name, { exact: true })).not.toBeVisible()
})

test('delete non-empty location shows error', async ({ authenticatedPage: page }) => {
  const homeModal = await openHomeManageModal(page, 'Testhjemmet')

  // Kjøleskap has seeded entries — deleting should fail
  await getLocationItem(homeModal, 'Kjøleskap').click()
  const locModal = page.getByRole('dialog').last()
  await locModal.getByRole('button', { name: 'Slett plassering' }).click()

  await expect(locModal.getByText(/flasker/i)).toBeVisible()
})

test('default location has no rename or delete buttons', async ({ authenticatedPage: page }) => {
  const homeModal = await openHomeManageModal(page, 'Testhjemmet')

  await getLocationItem(homeModal, 'Standard').first().click()
  const locModal = page.getByRole('dialog').last()

  // Standard is isDefault — no rename input and no delete button
  await expect(locModal.locator('input:not([placeholder])')).not.toBeVisible()
  await expect(locModal.getByRole('button', { name: 'Slett plassering' })).not.toBeVisible()
})

// --- Sections ---

test('create section appears in location', async ({ authenticatedPage: page }) => {
  const homeModal = await openHomeManageModal(page, 'Testhjemmet')
  const locName = `SectionHome ${Date.now()}`
  const secName = `Hylle A ${Date.now()}`

  // Create a fresh location
  await homeModal.getByPlaceholder('Ny plassering…').fill(locName)
  await homeModal.getByRole('button', { name: 'Legg til' }).click()
  await expect(getLocationItem(homeModal, locName)).toBeVisible()

  // Open LocationManageModal and add a section
  await getLocationItem(homeModal, locName).click()
  const locModal = page.getByRole('dialog').last()
  await locModal.getByPlaceholder('Ny seksjon…').fill(secName)
  await locModal.getByRole('button', { name: 'Legg til' }).click()

  await expect(locModal.locator('[data-testid="location-row"]').filter({ hasText: secName })).toBeVisible()
})

test('rename section shows updated name', async ({ authenticatedPage: page }) => {
  const homeModal = await openHomeManageModal(page, 'Testhjemmet')
  const locName = `SecRenameHome ${Date.now()}`
  const original = `HylleOrig ${Date.now()}`
  const renamed = `HylleRenamed ${Date.now()}`

  await homeModal.getByPlaceholder('Ny plassering…').fill(locName)
  await homeModal.getByRole('button', { name: 'Legg til' }).click()
  await getLocationItem(homeModal, locName).click()
  const locModal = page.getByRole('dialog').last()

  // Create a section
  await locModal.getByPlaceholder('Ny seksjon…').fill(original)
  await locModal.getByRole('button', { name: 'Legg til' }).click()
  await expect(locModal.locator('[data-testid="location-row"]').filter({ hasText: original })).toBeVisible()

  // Click pencil on the section row
  await locModal.locator('[data-testid="location-row"]').filter({ hasText: original }).getByTitle('Endre navn').click()

  // Fill rename input inside the section rows area and save
  await locModal.locator('[data-testid="location-row"] input').fill(renamed)
  await locModal.locator('[data-testid="location-row"]').getByRole('button', { name: 'Lagre' }).click()

  await expect(locModal.locator('[data-testid="location-row"]').filter({ hasText: renamed })).toBeVisible()
  await expect(locModal.getByText(original, { exact: true })).not.toBeVisible()
})

test('delete section removes it from location', async ({ authenticatedPage: page }) => {
  const homeModal = await openHomeManageModal(page, 'Testhjemmet')
  const locName = `SecDeleteHome ${Date.now()}`
  const secName = `HylleDelete ${Date.now()}`

  await homeModal.getByPlaceholder('Ny plassering…').fill(locName)
  await homeModal.getByRole('button', { name: 'Legg til' }).click()
  await getLocationItem(homeModal, locName).click()
  const locModal = page.getByRole('dialog').last()

  await locModal.getByPlaceholder('Ny seksjon…').fill(secName)
  await locModal.getByRole('button', { name: 'Legg til' }).click()
  await expect(locModal.locator('[data-testid="location-row"]').filter({ hasText: secName })).toBeVisible()

  await locModal.locator('[data-testid="location-row"]').filter({ hasText: secName }).getByTitle('Slett').click()

  await expect(locModal.getByText(secName, { exact: true })).not.toBeVisible()
})

test('section count badge updates after adding section', async ({ authenticatedPage: page }) => {
  const homeModal = await openHomeManageModal(page, 'Testhjemmet')
  const locName = `BadgeHome ${Date.now()}`

  await homeModal.getByPlaceholder('Ny plassering…').fill(locName)
  await homeModal.getByRole('button', { name: 'Legg til' }).click()
  await getLocationItem(homeModal, locName).click()
  const locModal = page.getByRole('dialog').last()

  await locModal.getByPlaceholder('Ny seksjon…').fill('Hylle 1')
  await locModal.getByRole('button', { name: 'Legg til' }).click()

  // Go back and check the count badge in the home modal
  await locModal.getByTitle('Tilbake').click()
  await expect(getLocationItem(homeModal, locName).getByText('1 seksjon')).toBeVisible()
})
