import { test as base, type Page } from '@playwright/test'

async function loginAs(page: Page, username: string, password: string) {
  await page.goto('/login')
  await page.getByPlaceholder('Brukernavn').fill(username)
  await page.getByPlaceholder('Passord').fill(password)
  await page.getByRole('button', { name: 'Logg inn' }).click()
  await page.waitForURL('/')
}

export const test = base.extend<{ authenticatedPage: Page; adminPage: Page }>({
  authenticatedPage: async ({ page }, use) => {
    await loginAs(page, 'testuser', 'Test1234!')
    await use(page)
  },
  adminPage: async ({ page }, use) => {
    await loginAs(page, 'testadmin', 'Test1234!')
    await use(page)
  },
})

export { expect } from '@playwright/test'
