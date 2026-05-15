import { test, expect } from './fixtures/auth'

async function openWineDetailFromCellar(page: import('@playwright/test').Page) {
  await page.goto('/')
  await page.getByRole('listitem').filter({ hasText: /7090016664323|Testvinen/ }).first().click()
  await expect(page.getByRole('dialog')).toBeVisible()
}

test('wine detail modal shows star button', async ({ authenticatedPage: page }) => {
  await openWineDetailFromCellar(page)
  await expect(page.getByRole('button', { name: /Legg til i favoritter|Fjern fra favoritter/ })).toBeVisible()
})

test('star button adds and removes favorite', async ({ authenticatedPage: page }) => {
  await openWineDetailFromCellar(page)

  // Ensure unfavorited to start — remove if already set from a previous run
  const removeBtn = page.getByRole('button', { name: 'Fjern fra favoritter' })
  if (await removeBtn.isVisible()) await removeBtn.click()

  // Add favorite
  await page.getByRole('button', { name: 'Legg til i favoritter' }).click()
  await expect(page.getByRole('button', { name: 'Fjern fra favoritter' })).toBeVisible()

  // Remove favorite
  await page.getByRole('button', { name: 'Fjern fra favoritter' }).click()
  await expect(page.getByRole('button', { name: 'Legg til i favoritter' })).toBeVisible()
})

test('favorited wine appears in profile Favoritter section', async ({ authenticatedPage: page }) => {
  // Add favorite from cellar
  await openWineDetailFromCellar(page)
  const removeBtn = page.getByRole('button', { name: 'Fjern fra favoritter' })
  if (await removeBtn.isVisible()) await removeBtn.click()
  await page.getByRole('button', { name: 'Legg til i favoritter' }).click()
  await expect(page.getByRole('button', { name: 'Fjern fra favoritter' })).toBeVisible()
  await page.getByLabel('Lukk').click()

  // Profile page should show Favoritter section with the wine
  await page.goto('/profile')
  await expect(page.getByText('Favoritter')).toBeVisible()
  await expect(page.getByText(/Testvinen|7090016664323/)).toBeVisible()

  // Clean up — open the favorite, remove it
  await page.getByRole('button').filter({ hasText: /Testvinen|7090016664323/ }).first().click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByRole('button', { name: 'Fjern fra favoritter' }).click()
})

test('clicking favorite on profile page opens wine detail modal', async ({ authenticatedPage: page }) => {
  // Add favorite
  await openWineDetailFromCellar(page)
  const removeBtn = page.getByRole('button', { name: 'Fjern fra favoritter' })
  if (await removeBtn.isVisible()) await removeBtn.click()
  await page.getByRole('button', { name: 'Legg til i favoritter' }).click()
  await page.getByLabel('Lukk').click()

  await page.goto('/profile')
  await expect(page.getByText('Favoritter')).toBeVisible()

  // Click the favorite row
  await page.getByRole('button').filter({ hasText: /Testvinen|7090016664323/ }).first().click()

  // Detail modal should open
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByRole('dialog').getByText(/Testvinen|7090016664323/)).toBeVisible()

  // Clean up
  await page.getByRole('button', { name: 'Fjern fra favoritter' }).click()
})

test('unfavoriting from profile removes it from Favoritter section', async ({ authenticatedPage: page }) => {
  // Add favorite
  await openWineDetailFromCellar(page)
  const removeBtn = page.getByRole('button', { name: 'Fjern fra favoritter' })
  if (await removeBtn.isVisible()) await removeBtn.click()
  await page.getByRole('button', { name: 'Legg til i favoritter' }).click()
  await page.getByLabel('Lukk').click()

  await page.goto('/profile')
  await expect(page.getByText(/Testvinen|7090016664323/)).toBeVisible()

  // Open modal and unfavorite
  await page.getByRole('button').filter({ hasText: /Testvinen|7090016664323/ }).first().click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByRole('button', { name: 'Fjern fra favoritter' }).click()
  await page.getByLabel('Lukk').click()

  // Section should disappear (no more favorites)
  await expect(page.getByRole('button').filter({ hasText: /Testvinen|7090016664323/ })).not.toBeVisible()
})
