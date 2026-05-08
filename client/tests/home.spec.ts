import { test, expect } from './fixtures/auth'

test('create home appears in profile list', async ({ authenticatedPage: page }) => {
  await page.goto('/profile')
  const name = `Hjem ${Date.now()}`
  await page.getByPlaceholder('Navn på nytt hjem').fill(name)
  await page.getByRole('button', { name: 'Opprett' }).click()
  await expect(page.locator('[data-testid="home-row"]').filter({ hasText: name })).toBeVisible()
})

test('rename home shows updated name', async ({ authenticatedPage: page }) => {
  await page.goto('/profile')

  // Create a dedicated home to rename (don't touch seeded Testhjemmet)
  const originalName = `ToRename ${Date.now()}`
  await page.getByPlaceholder('Navn på nytt hjem').fill(originalName)
  await page.getByRole('button', { name: 'Opprett' }).click()
  await expect(page.locator('[data-testid="home-row"]').filter({ hasText: originalName })).toBeVisible()

  const newName = `Renamed ${Date.now()}`
  const card = page.locator('[data-testid="home-row"]').filter({ hasText: originalName })
  await card.getByRole('button', { name: 'Endre navn' }).click()
  // After clicking, the card's hasText filter no longer matches (input value ≠ text content),
  // so locate the rename input by its value attribute instead
  await page.locator(`input[value="${originalName}"]`).fill(newName)
  await page.getByRole('button', { name: 'Lagre' }).click()
  await expect(page.locator('[data-testid="home-row"]').filter({ hasText: newName })).toBeVisible()
})

test('delete empty home removes it from list', async ({ authenticatedPage: page }) => {
  await page.goto('/profile')

  // Create a home to delete
  const name = `ToDelete ${Date.now()}`
  await page.getByPlaceholder('Navn på nytt hjem').fill(name)
  await page.getByRole('button', { name: 'Opprett' }).click()
  await expect(page.locator('[data-testid="home-row"]').filter({ hasText: name })).toBeVisible()

  // Find and delete it
  const card = page.locator('[data-testid="home-row"]').filter({ hasText: name })
  await card.getByRole('button', { name: 'Slett' }).click()
  await expect(page.locator('[data-testid="home-row"]').filter({ hasText: name })).not.toBeVisible()
})

test('delete non-empty home shows error', async ({ authenticatedPage: page }) => {
  await page.goto('/profile')
  // Testhjemmet has seeded entries — try to delete it
  const card = page.locator('[data-testid="home-row"]').filter({ has: page.getByText('Testhjemmet', { exact: true }) })
  await card.getByRole('button', { name: 'Slett' }).click()
  await expect(card.getByText(/flasker|inneholder/i)).toBeVisible()
})

test('generate share link shows URL', async ({ authenticatedPage: page }) => {
  await page.goto('/profile')
  const card = page.locator('[data-testid="home-row"]').filter({ has: page.getByText('Testhjemmet', { exact: true }) })
  await card.getByRole('button', { name: 'Del hjem' }).click()
  await expect(card.getByText(/homes\/join\//)).toBeVisible()
})
