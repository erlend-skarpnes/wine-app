import { test, expect } from './fixtures/auth'

test('create cellar appears in profile list', async ({ authenticatedPage: page }) => {
  await page.goto('/profile')
  const name = `Kjeller ${Date.now()}`
  await page.getByPlaceholder('Navn på ny kjeller').fill(name)
  await page.getByRole('button', { name: 'Opprett' }).click()
  await expect(page.getByText(name)).toBeVisible()
})

test('rename cellar shows updated name', async ({ authenticatedPage: page }) => {
  await page.goto('/profile')

  // Create a dedicated cellar to rename (don't touch seeded Testkjeller)
  const originalName = `ToRename ${Date.now()}`
  await page.getByPlaceholder('Navn på ny kjeller').fill(originalName)
  await page.getByRole('button', { name: 'Opprett' }).click()
  await expect(page.getByText(originalName)).toBeVisible()

  const newName = `Renamed ${Date.now()}`
  const card = page.locator('[data-testid="cellar-row"]').filter({ hasText: originalName })
  await card.getByRole('button', { name: 'Endre navn' }).click()
  // After clicking, the card's hasText filter no longer matches (input value ≠ text content),
  // so locate the rename input by its value attribute instead
  await page.locator(`input[value="${originalName}"]`).fill(newName)
  await page.getByRole('button', { name: 'Lagre' }).click()
  await expect(page.getByText(newName)).toBeVisible()
})

test('delete empty cellar removes it from list', async ({ authenticatedPage: page }) => {
  await page.goto('/profile')

  // Create a cellar to delete
  const name = `ToDelete ${Date.now()}`
  await page.getByPlaceholder('Navn på ny kjeller').fill(name)
  await page.getByRole('button', { name: 'Opprett' }).click()
  await expect(page.getByText(name)).toBeVisible()

  // Find and delete it
  const card = page.locator('[data-testid="cellar-row"]').filter({ hasText: name })
  await card.getByRole('button', { name: 'Slett' }).click()
  await expect(page.getByText(name)).not.toBeVisible()
})

test('delete non-empty cellar shows error', async ({ authenticatedPage: page }) => {
  await page.goto('/profile')
  // Testkjeller has seeded entries — try to delete it
  const card = page.locator('[data-testid="cellar-row"]').filter({ has: page.getByText('Testkjeller', { exact: true }) })
  await card.getByRole('button', { name: 'Slett' }).click()
  await expect(card.getByText(/flasker|inneholder/i)).toBeVisible()
})

test('generate share link shows URL', async ({ authenticatedPage: page }) => {
  await page.goto('/profile')
  const card = page.locator('[data-testid="cellar-row"]').filter({ has: page.getByText('Testkjeller', { exact: true }) })
  await card.getByRole('button', { name: 'Del kjeller' }).click()
  await expect(card.getByText(/cellars\/join\//)).toBeVisible()
})
