import { test, expect } from './fixtures/auth'

const WINE_MOCK = {
  barcode: '7090016664323',
  name: 'Testvinen',
  type: 'Rødvin',
  winery: null, region: null, country: null, body: null,
  acidity: null, alcoholContent: null, description: null, imageUrl: null,
  grapes: [], pairings: [], storagePotential: null,
}

async function mockWine(page: import('@playwright/test').Page, status = 200) {
  await page.route('**/api/wines/**', route =>
    status === 200
      ? route.fulfill({ json: WINE_MOCK })
      : route.fulfill({ status, body: 'Not Found' })
  )
}

async function triggerScan(page: import('@playwright/test').Page, barcode: string) {
  await page.evaluate((b) => (window as any).__triggerScan(b), barcode)
}

// Testhjemmet has 2 locations (Standard + Kjøleskap), so the location picker always appears.
async function pickLocation(page: import('@playwright/test').Page, locationName: string) {
  await expect(page.getByText('Velg plassering:')).toBeVisible()
  await page.getByRole('button', { name: locationName, exact: true }).click()
  await page.getByRole('button', { name: 'Bekreft' }).click()
}

test('scan adds wine and shows success state with quantity', async ({ authenticatedPage: page }) => {
  await mockWine(page)
  await page.goto('/')
  await page.getByRole('button', { name: 'Legg til vin' }).click()

  // Wait until locations have loaded (text changes from "Laster plasseringer…")
  await expect(page.getByText('Skann strekkoden på flasken.')).toBeVisible()

  await triggerScan(page, '7090016664323')
  await pickLocation(page, 'Standard')

  await expect(page.getByText(/Beholdning:/)).toBeVisible()
  await page.getByRole('button', { name: 'Ferdig' }).click()
})

test('scan adds unknown barcode and shows label capture screen', async ({ authenticatedPage: page }) => {
  await mockWine(page, 404)
  await page.goto('/')
  await page.getByRole('button', { name: 'Legg til vin' }).click()
  await expect(page.getByText('Skann strekkoden på flasken.')).toBeVisible()

  await triggerScan(page, '1234567890128')
  await pickLocation(page, 'Standard')

  await expect(page.getByText('Pek kameraet mot etiketten og ta et bilde.')).toBeVisible()
})

test('scan removes wine and shows decremented quantity', async ({ authenticatedPage: page }) => {
  await mockWine(page)
  await page.goto('/')
  await page.getByRole('button', { name: 'Fjern vin' }).click()
  await expect(page.getByText('Skann strekkoden på flasken.')).toBeVisible()

  await triggerScan(page, '7090016664323')
  await pickLocation(page, 'Standard')

  await expect(page.getByText(/Beholdning:/)).toBeVisible()
  await page.getByRole('button', { name: 'Ferdig' }).click()
})

test('removing barcode not in location shows error', async ({ authenticatedPage: page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Fjern vin' }).click()
  await expect(page.getByText('Skann strekkoden på flasken.')).toBeVisible()

  await triggerScan(page, '0000000000000')
  await pickLocation(page, 'Standard')

  await expect(page.getByText('Ingenting å fjerne.')).toBeVisible()
})

test('scan with section pick uses seeded Kjøleskap › Hylle A', async ({ authenticatedPage: page }) => {
  // Kjøleskap is seeded with section "Hylle A" — tests the section-pick branch without UI setup
  await mockWine(page)
  await page.goto('/')
  await page.getByRole('button', { name: 'Legg til vin' }).click()
  await expect(page.getByText('Skann strekkoden på flasken.')).toBeVisible()

  await triggerScan(page, '7090016664323')

  // Location picker: pick Kjøleskap (has sections)
  await expect(page.getByText('Velg plassering:')).toBeVisible()
  await page.getByRole('button', { name: 'Kjøleskap', exact: true }).click()
  await page.getByRole('button', { name: 'Bekreft' }).click()

  // Section picker appears
  await expect(page.getByText('Velg seksjon (valgfritt):')).toBeVisible()
  await page.getByRole('button', { name: 'Hylle A', exact: true }).click()
  await page.getByRole('button', { name: 'Bekreft' }).click()

  await expect(page.getByText(/Beholdning:/)).toBeVisible()
})

test('scan again button returns to scanning state', async ({ authenticatedPage: page }) => {
  await mockWine(page)
  await page.goto('/')
  await page.getByRole('button', { name: 'Legg til vin' }).click()
  await expect(page.getByText('Skann strekkoden på flasken.')).toBeVisible()

  await triggerScan(page, '7090016664323')
  await pickLocation(page, 'Standard')
  await expect(page.getByText(/Beholdning:/)).toBeVisible()

  await page.getByRole('button', { name: 'Skann en til' }).click()
  await expect(page.getByText('Skann strekkoden på flasken.')).toBeVisible()
})
