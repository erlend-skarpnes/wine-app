import { test as base, type Page, type BrowserContext } from '@playwright/test'

async function newAuthContext(
  { browser }: { browser: import('@playwright/test').Browser },
  storageState: string
): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext({ storageState, ignoreHTTPSErrors: true })
  const page = await context.newPage()
  return { context, page }
}

export const test = base.extend<{ authenticatedPage: Page; adminPage: Page }>({
  authenticatedPage: async ({ browser }, use) => {
    const { context, page } = await newAuthContext({ browser }, 'tests/.auth/testuser.json')
    await use(page)
    await context.close()
  },
  adminPage: async ({ browser }, use) => {
    const { context, page } = await newAuthContext({ browser }, 'tests/.auth/testadmin.json')
    await use(page)
    await context.close()
  },
})

export { expect } from '@playwright/test'
