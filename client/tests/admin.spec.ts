import { test, expect } from './fixtures/auth'

test('non-admin cannot access /admin', async ({ authenticatedPage: page }) => {
  await page.goto('/admin')
  await expect(page).not.toHaveURL('/admin')
})

test('admin can access /admin and sees user list', async ({ adminPage: page }) => {
  await page.goto('/admin')
  await expect(page).toHaveURL('/admin')
  await expect(page.getByText('testuser')).toBeVisible()
  await expect(page.getByText('testadmin')).toBeVisible()
})

test('admin can generate invite link', async ({ adminPage: page }) => {
  await page.goto('/admin')
  await page.getByRole('button', { name: 'Generer invitasjonslenke' }).click()
  await expect(page.getByText('/invite/')).toBeVisible()
})

test('admin can reset user password', async ({ adminPage: page }) => {
  await page.goto('/admin')
  await page.getByRole('button', { name: 'Tilbakestill passord' }).first().click()
  await page.getByPlaceholder('Nytt passord').fill('NewPass1234!')
  await page.getByRole('button', { name: 'Lagre' }).click()
  await expect(page.getByText('Passord oppdatert')).toBeVisible()
})
