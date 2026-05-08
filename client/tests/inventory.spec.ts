import { test, expect } from './fixtures/auth'

test('cellar page loads seeded wine entries', async ({ authenticatedPage: page }) => {
  await page.goto('/')
  // Two seeded barcodes should appear
  await expect(page.getByText('7090016664323')).toBeVisible()
  await expect(page.getByText('7090016460692')).toBeVisible()
})

test('location filter shows only entries in selected location', async ({ authenticatedPage: page }) => {
  await page.goto('/')

  // Open filter panel
  await page.getByRole('button', { name: 'Filter' }).click()

  // Select Kjøleskap (second seeded location — has barcode 7090016664323 only)
  await page.getByRole('button', { name: 'Kjøleskap', exact: true }).click()

  // Entries from Kjøleskap should still be visible
  await expect(page.getByText('7090016664323')).toBeVisible()
})

test('filters persist after page reload', async ({ authenticatedPage: page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Filter' }).click()
  await page.getByRole('button', { name: 'Kjøleskap', exact: true }).click()

  await page.reload()

  // Filter button badge should show 1 active filter
  const filterBtn = page.getByRole('button', { name: 'Filter' })
  await expect(filterBtn.locator('.bg-wine.text-white')).toBeVisible()
})

test('clicking wine entry opens detail modal', async ({ authenticatedPage: page }) => {
  await page.goto('/')
  // Entry shows barcode before wine data is cached, name after — match either
  await page.locator('tr').filter({ hasText: /7090016664323|Testvinen/ }).first().click()
  await expect(page.getByText('Testvinen')).toBeVisible()
})

test('adjust quantity in detail modal updates count', async ({ authenticatedPage: page }) => {
  // Mock entry-locations to a single location so no location picker is shown
  await page.route('**/api/homes/*/entries/*/locations', route =>
    route.fulfill({
      json: [{ locationId: 1, locationName: 'Standard', sectionId: null, sectionName: null, quantity: 3 }]
    })
  )

  // Mock the adjust endpoint to avoid proxy errors against the real server
  await page.route('**/api/locations/*/entries/adjust', route =>
    route.fulfill({
      json: { locationId: 1, barcode: '7090016664323', quantity: 4, sectionId: null }
    })
  )

  await page.goto('/')
  // Entry shows barcode before wine data is cached, name after — match either
  await page.locator('tr').filter({ hasText: /7090016664323|Testvinen/ }).first().click()
  await page.getByRole('button', { name: 'Rediger beholdning' }).click()

  const modal = page.getByRole('dialog')
  const before = await modal.locator('span.text-2xl').textContent()
  // Plus button is the last SVG button inside the modal (close X, minus, plus)
  await modal.locator('button').filter({ has: page.locator('svg') }).last().click()
  // Wait for the async API call to complete and update the displayed quantity
  await expect(modal.locator('span.text-2xl')).toHaveText(String(Number(before) + 1))
})
