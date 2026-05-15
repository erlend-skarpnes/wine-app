import { test, expect } from './fixtures/auth'

async function openHomeManageModal(page: import('@playwright/test').Page, homeName: string) {
  const card = page.locator('[data-testid="home-row"]').filter({ has: page.getByText(homeName, { exact: true }) })
  await card.getByRole('button', { name: /Administrer|Vis detaljer/ }).click()
  return page.getByRole('dialog').first()
}

test('create home appears in profile list', async ({ authenticatedPage: page }) => {
  await page.goto('/profile')
  const name = `Hjem ${Date.now()}`
  await page.getByPlaceholder('Opprett nytt hjem…').fill(name)
  await page.getByRole('button', { name: 'Opprett' }).click()
  await expect(page.locator('[data-testid="home-row"]').filter({ hasText: name })).toBeVisible()
})

test('rename home shows updated name', async ({ authenticatedPage: page }) => {
  await page.goto('/profile')
  const originalName = `ToRename ${Date.now()}`
  await page.getByPlaceholder('Opprett nytt hjem…').fill(originalName)
  await page.getByRole('button', { name: 'Opprett' }).click()
  await expect(page.locator('[data-testid="home-row"]').filter({ hasText: originalName })).toBeVisible()

  const newName = `Renamed ${Date.now()}`
  const modal = await openHomeManageModal(page, originalName)

  await modal.locator('input:not([placeholder])').fill(newName)
  await modal.getByRole('button', { name: 'Lagre' }).click()
  await modal.getByRole('button', { name: 'Lukk' }).click()

  await expect(page.locator('[data-testid="home-row"]').filter({ hasText: newName })).toBeVisible()
})

test('delete empty home removes it from list', async ({ authenticatedPage: page }) => {
  await page.goto('/profile')
  const name = `ToDelete ${Date.now()}`
  await page.getByPlaceholder('Opprett nytt hjem…').fill(name)
  await page.getByRole('button', { name: 'Opprett' }).click()
  await expect(page.locator('[data-testid="home-row"]').filter({ hasText: name })).toBeVisible()

  const modal = await openHomeManageModal(page, name)
  await modal.getByRole('button', { name: 'Slett hjem' }).click()

  // Modal closes on success; card should be gone
  await expect(page.locator('[data-testid="home-row"]').filter({ hasText: name })).not.toBeVisible()
})

test('delete non-empty home shows error', async ({ authenticatedPage: page }) => {
  await page.goto('/profile')
  const modal = await openHomeManageModal(page, 'Testhjemmet')
  await modal.getByRole('button', { name: 'Slett hjem' }).click()
  await expect(modal.getByText(/flasker|inneholder/i)).toBeVisible()
})

test('generate share link shows URL', async ({ authenticatedPage: page }) => {
  await page.goto('/profile')
  const modal = await openHomeManageModal(page, 'Testhjemmet')
  await modal.getByRole('button', { name: 'Generer delingslenke' }).click()
  await expect(modal.getByText(/homes\/join\//)).toBeVisible()
})
