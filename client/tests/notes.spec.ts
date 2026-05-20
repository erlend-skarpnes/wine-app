import { test, expect } from './fixtures/auth'

const BARCODE = '7090016664323'

async function openNotaterTab(page: import('@playwright/test').Page) {
  await page.goto('/')
  await page.getByRole('listitem').filter({ hasText: new RegExp(`${BARCODE}|Testvinen`) }).first().click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByRole('button', { name: 'Notater' }).click()
}

async function clearNote(page: import('@playwright/test').Page) {
  await openNotaterTab(page)
  const showOwnBtn = page.getByRole('button', { name: 'Legg til din egen' })
  if (await showOwnBtn.isVisible()) await showOwnBtn.click()
  await page.getByPlaceholder('f.eks. 2025').fill('')
  await page.getByPlaceholder('f.eks. 2035').fill('')
  await page.getByPlaceholder(/Egne tanker/).fill('')
  await page.getByRole('button', { name: 'Lagre' }).click()
  await page.getByLabel('Lukk').click()
}

test('Notater tab shows empty form when no note exists', async ({ authenticatedPage: page }) => {
  await clearNote(page)
  await openNotaterTab(page)
  await expect(page.getByPlaceholder('f.eks. 2025')).toBeVisible()
  await expect(page.getByPlaceholder('f.eks. 2035')).toBeVisible()
  await expect(page.getByPlaceholder(/Egne tanker/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Lagre' })).toBeVisible()
})

test('saving a note persists and pre-fills on re-open', async ({ authenticatedPage: page }) => {
  await clearNote(page)
  await openNotaterTab(page)

  await page.getByPlaceholder('f.eks. 2025').fill('2025')
  await page.getByPlaceholder('f.eks. 2035').fill('2032')
  await page.getByPlaceholder(/Egne tanker/).fill('Veldig god vin')
  await page.getByRole('button', { name: 'Lagre' }).click()
  await expect(page.getByText('Lagret')).toBeVisible()
  await page.getByLabel('Lukk').click()

  // Re-open and verify pre-filled
  await openNotaterTab(page)
  await expect(page.getByPlaceholder('f.eks. 2025')).toHaveValue('2025')
  await expect(page.getByPlaceholder('f.eks. 2035')).toHaveValue('2032')
  await expect(page.getByPlaceholder(/Egne tanker/)).toHaveValue('Veldig god vin')

  await page.getByLabel('Lukk').click()
  await clearNote(page)
})

test("another user sees first user's drinking window read-only", async ({ authenticatedPage: page, browser }) => {
  // testuser saves a note
  await clearNote(page)
  await openNotaterTab(page)
  await page.getByPlaceholder('f.eks. 2025').fill('2026')
  await page.getByPlaceholder('f.eks. 2035').fill('2031')
  await page.getByRole('button', { name: 'Lagre' }).click()
  await expect(page.getByText('Lagret')).toBeVisible()
  await page.getByLabel('Lukk').click()

  // testadmin opens the same wine
  const ctx2 = await browser.newContext({ storageState: 'tests/.auth/testadmin.json', ignoreHTTPSErrors: true })
  const page2 = await ctx2.newPage()
  await page2.goto('/')
  await page2.getByRole('listitem').filter({ hasText: new RegExp(`${BARCODE}|Testvinen`) }).first().click()
  await expect(page2.getByRole('dialog')).toBeVisible()
  await page2.getByRole('button', { name: 'Notater' }).click()

  // Should see read-only drinking window with testuser's attribution
  await expect(page2.getByText('2026 – 2031')).toBeVisible()
  await expect(page2.getByText(/testuser/)).toBeVisible()
  await expect(page2.getByRole('button', { name: 'Legg til din egen' })).toBeVisible()

  // Personal note form should NOT be visible
  await expect(page2.getByPlaceholder(/Egne tanker/)).not.toBeVisible()

  await ctx2.close()
  await clearNote(page)
})

test("own note takes precedence over another user's note", async ({ authenticatedPage: page, browser }) => {
  // testuser saves a note
  await clearNote(page)
  await openNotaterTab(page)
  await page.getByPlaceholder('f.eks. 2025').fill('2024')
  await page.getByPlaceholder('f.eks. 2035').fill('2029')
  await page.getByRole('button', { name: 'Lagre' }).click()
  await expect(page.getByText('Lagret')).toBeVisible()
  await page.getByLabel('Lukk').click()

  // testadmin saves their own note
  const ctx2 = await browser.newContext({ storageState: 'tests/.auth/testadmin.json', ignoreHTTPSErrors: true })
  const page2 = await ctx2.newPage()
  await page2.goto('/')
  await page2.getByRole('listitem').filter({ hasText: new RegExp(`${BARCODE}|Testvinen`) }).first().click()
  await expect(page2.getByRole('dialog')).toBeVisible()
  await page2.getByRole('button', { name: 'Notater' }).click()
  await page2.getByRole('button', { name: 'Legg til din egen' }).click()
  await page2.getByPlaceholder('f.eks. 2025').fill('2027')
  await page2.getByPlaceholder('f.eks. 2035').fill('2033')
  await page2.getByRole('button', { name: 'Lagre' }).click()
  await expect(page2.getByText('Lagret')).toBeVisible()
  await page2.getByLabel('Lukk').click()

  // Re-open — testadmin should see their own note, not testuser's
  await page2.getByRole('listitem').filter({ hasText: new RegExp(`${BARCODE}|Testvinen`) }).first().click()
  await expect(page2.getByRole('dialog')).toBeVisible()
  await page2.getByRole('button', { name: 'Notater' }).click()
  await expect(page2.getByPlaceholder('f.eks. 2025')).toHaveValue('2027')
  await expect(page2.getByPlaceholder('f.eks. 2035')).toHaveValue('2033')
  await expect(page2.getByText('2024 – 2029')).not.toBeVisible()

  // Clean up testadmin's note
  await page2.getByPlaceholder('f.eks. 2025').fill('')
  await page2.getByPlaceholder('f.eks. 2035').fill('')
  await page2.getByRole('button', { name: 'Lagre' }).click()
  await ctx2.close()

  await clearNote(page)
})
