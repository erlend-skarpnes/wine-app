import { test, expect } from '@playwright/test'

test('valid login redirects to cellar page', async ({ page }) => {
  await page.goto('/login')
  await page.getByPlaceholder('Brukernavn').fill('testuser')
  await page.getByPlaceholder('Passord').fill('Test1234!')
  await page.getByRole('button', { name: 'Logg inn' }).click()
  await page.waitForURL('/')
  await expect(page).toHaveURL('/')
})

test('wrong password shows error message', async ({ page }) => {
  await page.goto('/login')
  await page.getByPlaceholder('Brukernavn').fill('testuser')
  await page.getByPlaceholder('Passord').fill('wrongpassword')
  await page.getByRole('button', { name: 'Logg inn' }).click()
  await expect(page.getByText(/feil/i)).toBeVisible()
})

test('5 wrong attempts triggers lockout message', async ({ page }) => {
  // Use testlockout so this doesn't lock out testadmin (used by admin tests)
  await page.goto('/login')
  for (let i = 0; i < 5; i++) {
    await page.getByPlaceholder('Brukernavn').fill('testlockout')
    await page.getByPlaceholder('Passord').fill('wrongpassword')
    await page.getByRole('button', { name: 'Logg inn' }).click()
    await page.waitForResponse(r => r.url().includes('/auth/login'))
  }
  // 6th attempt: account is now locked, should show lockout message
  await page.getByRole('button', { name: 'Logg inn' }).click()
  await expect(page.getByText(/sperret|låst|locked/i)).toBeVisible()
})

test('logout redirects to login and protects routes', async ({ page }) => {
  // Log in first
  await page.goto('/login')
  await page.getByPlaceholder('Brukernavn').fill('testuser')
  await page.getByPlaceholder('Passord').fill('Test1234!')
  await page.getByRole('button', { name: 'Logg inn' }).click()
  await page.waitForURL('/')

  // Go to profile and log out
  await page.goto('/profile')
  await page.getByRole('button', { name: 'Logg ut' }).click()
  await page.waitForURL('/login')

  // Protected route redirects back to login
  await page.goto('/')
  await expect(page).toHaveURL('/login')
})
