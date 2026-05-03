import { test, expect } from './fixtures/auth'

test('valid share token shows cellar preview and join button', async ({ authenticatedPage: page, browser }) => {
  // Generate a share link as testuser (owner of Testkjeller)
  await page.goto('/profile')
  const card = page.locator('[data-testid="cellar-row"]').filter({ has: page.getByText('Testkjeller', { exact: true }) })
  await card.getByRole('button', { name: 'Del kjeller' }).click()

  const linkText = await card.locator('code').textContent()
  const shareUrl = new URL(linkText!.trim()).pathname

  // Open the share link in a second context as testadmin
  const context2 = await browser.newContext({ ignoreHTTPSErrors: true })
  const page2 = await context2.newPage()

  // Log in as testadmin
  await page2.goto('/login')
  await page2.getByPlaceholder('Brukernavn').fill('testadmin')
  await page2.getByPlaceholder('Passord').fill('Test1234!')
  await page2.getByRole('button', { name: 'Logg inn' }).click()
  await page2.waitForURL('/')

  // Visit the share URL
  await page2.goto(shareUrl)
  await expect(page2.getByText('Testkjeller')).toBeVisible()
  await expect(page2.getByRole('button', { name: 'Bli med' })).toBeVisible()

  // Accept the invite
  await page2.getByRole('button', { name: 'Bli med' }).click()
  await page2.waitForURL('/')

  // Testkjeller should now appear in testadmin's profile
  await page2.goto('/profile')
  await expect(page2.getByText('Testkjeller')).toBeVisible()

  await context2.close()
})

test('already-member share token shows friendly error', async ({ authenticatedPage: page }) => {
  // testuser is already a member of Testkjeller — generate a link and try to join own cellar
  await page.goto('/profile')
  const card = page.locator('[data-testid="cellar-row"]').filter({ has: page.getByText('Testkjeller', { exact: true }) })
  await card.getByRole('button', { name: 'Del kjeller' }).click()

  const linkText = await card.locator('code').textContent()
  const shareUrl = new URL(linkText!.trim()).pathname

  await page.goto(shareUrl)
  // Click join — server returns 409 since testuser is already a member
  await page.getByRole('button', { name: 'Bli med' }).click()
  await expect(page.getByText(/allerede|already|medlem/i)).toBeVisible()
})

test('invalid share token shows error', async ({ authenticatedPage: page }) => {
  await page.goto('/cellars/join/invalid-token-that-does-not-exist')
  await expect(page.getByText(/ugyldig|fant ikke|invalid|ikke funnet/i)).toBeVisible()
})
