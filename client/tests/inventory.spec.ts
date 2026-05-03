import { test, expect } from './fixtures/auth'

test('cellar page loads seeded wine entries', async ({ authenticatedPage: page }) => {
  await page.goto('/')
  // Two seeded barcodes should appear
  await expect(page.getByText('7090016664323')).toBeVisible()
  await expect(page.getByText('7090016460692')).toBeVisible()
})

test('cellar filter shows only selected cellar entries', async ({ authenticatedPage: page }) => {
  await page.goto('/')

  // Open filter panel
  await page.getByRole('button', { name: 'Filter' }).click()

  // Select Testkjeller
  await page.getByRole('button', { name: 'Testkjeller', exact: true }).click()

  // Entries should still be visible (only cellar selected)
  await expect(page.getByText('7090016664323')).toBeVisible()
})

test('filters persist after page reload', async ({ authenticatedPage: page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Filter' }).click()
  await page.getByRole('button', { name: 'Testkjeller', exact: true }).click()

  await page.reload()

  // Filter button badge should show 1 active filter
  const filterBtn = page.getByRole('button', { name: 'Filter' })
  await expect(filterBtn.locator('.bg-wine.text-white')).toBeVisible()
})

test('clicking wine entry opens detail modal', async ({ authenticatedPage: page }) => {
  // Mock external wine API
  await page.route('**/api/wines/**', route =>
    route.fulfill({
      json: {
        barcode: '7090016664323',
        name: 'Testvinen',
        type: 'Rødvin',
        winery: null,
        region: null,
        country: null,
        body: null,
        acidity: null,
        alcoholContent: null,
        description: null,
        imageUrl: null,
        grapes: [],
        pairings: [],
        storagePotential: null,
      }
    })
  )

  await page.goto('/')
  await page.getByText('7090016664323').click()
  await expect(page.getByText('Testvinen')).toBeVisible()
})

test('adjust quantity in detail modal updates count', async ({ authenticatedPage: page }) => {
  await page.route('**/api/wines/**', route =>
    route.fulfill({
      json: {
        barcode: '7090016664323',
        name: 'Testvinen',
        type: 'Rødvin',
        winery: null, region: null, country: null, body: null,
        acidity: null, alcoholContent: null, description: null, imageUrl: null,
        grapes: [], pairings: [], storagePotential: null,
      }
    })
  )

  await page.goto('/')
  await page.getByText('7090016664323').click()
  await page.getByRole('button', { name: 'Rediger beholdning' }).click()

  const modal = page.getByRole('dialog')
  const before = await modal.locator('span.text-2xl').textContent()
  // Plus button is the last SVG button inside the modal (close X, minus, plus)
  await modal.locator('button').filter({ has: page.locator('svg') }).last().click()
  // Wait for the async API call to complete and update the displayed quantity
  await expect(modal.locator('span.text-2xl')).toHaveText(String(Number(before) + 1))
})
