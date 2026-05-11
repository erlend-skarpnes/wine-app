import { test, expect } from './fixtures/auth'

async function generateShareLink(page: import('@playwright/test').Page) {
  await page.goto('/profile')
  const card = page.locator('[data-testid="home-row"]').filter({ has: page.getByText('Testhjemmet', { exact: true }) })
  await card.getByRole('button', { name: 'Administrer' }).click()
  const modal = page.getByRole('dialog').first()
  await modal.getByRole('button', { name: 'Generer delingslenke' }).click()
  const linkText = await modal.locator('code').textContent()
  return new URL(linkText!.trim()).pathname
}

test('valid share token shows home preview and join button', async ({ authenticatedPage: page, browser }) => {
  const shareUrl = await generateShareLink(page)

  // Open the share link in a second context as testadmin
  const context2 = await browser.newContext({ ignoreHTTPSErrors: true })
  const page2 = await context2.newPage()

  await page2.goto('/login')
  await page2.getByPlaceholder('Brukernavn').fill('testadmin')
  await page2.getByPlaceholder('Passord').fill('Test1234!')
  await page2.getByRole('button', { name: 'Logg inn' }).click()
  await page2.waitForURL('/')

  await page2.goto(shareUrl)
  await expect(page2.getByText('Testhjemmet')).toBeVisible()
  await expect(page2.getByRole('button', { name: 'Bli med' })).toBeVisible()

  await page2.getByRole('button', { name: 'Bli med' }).click()
  await page2.waitForURL('/')

  await page2.goto('/profile')
  await expect(page2.getByText('Testhjemmet')).toBeVisible()

  await context2.close()
})

test('already-member share token shows friendly error', async ({ authenticatedPage: page }) => {
  const shareUrl = await generateShareLink(page)

  await page.goto(shareUrl)
  await page.getByRole('button', { name: 'Bli med' }).click()
  await expect(page.getByText(/allerede|already|medlem/i)).toBeVisible()
})

test('invalid share token shows error', async ({ authenticatedPage: page }) => {
  await page.goto('/homes/join/invalid-token-that-does-not-exist')
  await expect(page.getByText(/ugyldig|fant ikke|invalid|ikke funnet/i)).toBeVisible()
})
