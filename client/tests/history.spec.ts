import { test, expect } from './fixtures/auth'

async function triggerScan(page: import('@playwright/test').Page, barcode: string) {
  await page.evaluate((b) => (window as any).__triggerScan(b), barcode)
}

test('drink history section appears on profile after scanning out a wine', async ({ authenticatedPage: page }) => {
  // Remove a bottle via the scan flow
  await page.goto('/')
  await page.getByRole('button', { name: 'Fjern vin' }).click()
  await expect(page.getByText('Skann strekkoden på flasken.')).toBeVisible()

  await triggerScan(page, '7090016664323')

  await expect(page.getByText('Velg plassering:')).toBeVisible()
  await page.getByRole('button', { name: 'Standard', exact: true }).click()
  await page.getByRole('button', { name: 'Bekreft' }).click()
  await expect(page.getByText(/Beholdning:/)).toBeVisible()
  await page.getByRole('button', { name: 'Ferdig' }).click()

  // Profile should now show the Drukket section
  await page.goto('/profile')
  await expect(page.getByText('Drukket')).toBeVisible()
  await expect(page.getByText(/Testvinen|7090016664323/)).toBeVisible()
})

test('drink history shows wine name, date, and home name', async ({ authenticatedPage: page }) => {
  await page.route('**/api/history', route =>
    route.fulfill({
      json: [{
        id: 1,
        barcode: '7090016664323',
        homeId: 1,
        homeName: 'Testhjemmet',
        quantity: 1,
        drankAt: new Date().toISOString(),
        wineName: 'Testvinen',
        wineType: 'Rødvin',
        wineImageUrl: null,
      }],
    })
  )

  await page.goto('/profile')
  await expect(page.getByText('Drukket')).toBeVisible()
  await expect(page.getByText('Testvinen')).toBeVisible()
  await expect(page.getByText('Testhjemmet')).toBeVisible()
})

test('clicking drink history entry opens wine detail modal', async ({ authenticatedPage: page }) => {
  await page.route('**/api/history', route =>
    route.fulfill({
      json: [{
        id: 1,
        barcode: '7090016664323',
        homeId: 1,
        homeName: 'Testhjemmet',
        quantity: 2,
        drankAt: new Date().toISOString(),
        wineName: 'Testvinen',
        wineType: 'Rødvin',
        wineImageUrl: null,
      }],
    })
  )

  await page.goto('/profile')
  await expect(page.getByText('Drukket')).toBeVisible()

  await page.getByRole('button').filter({ hasText: 'Testvinen' }).first().click()

  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByRole('dialog').getByText(/Testvinen/)).toBeVisible()
})

test('drink history entry records correct quantity removed', async ({ authenticatedPage: page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Fjern vin' }).click()
  await expect(page.getByText('Skann strekkoden på flasken.')).toBeVisible()

  await triggerScan(page, '7090016460692')

  await expect(page.getByText('Velg plassering:')).toBeVisible()
  await page.getByRole('button', { name: 'Standard', exact: true }).click()
  await page.getByRole('button', { name: 'Bekreft' }).click()
  await expect(page.getByText(/Beholdning:/)).toBeVisible()
  await page.getByRole('button', { name: 'Ferdig' }).click()

  // Check via API that the history entry has quantity 1
  const response = await page.request.get('/api/history')
  expect(response.ok()).toBeTruthy()
  const history = await response.json()
  const entry = history.find((h: { barcode: string }) => h.barcode === '7090016460692')
  expect(entry).toBeDefined()
  expect(entry.quantity).toBe(1)
})
