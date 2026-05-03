import { chromium, type FullConfig } from '@playwright/test'
import fs from 'fs'

async function loginAndSave(baseURL: string, username: string, password: string, path: string) {
  const browser = await chromium.launch()
  const context = await browser.newContext({ ignoreHTTPSErrors: true })
  const page = await context.newPage()

  await page.goto(`${baseURL}/login`)
  await page.getByPlaceholder('Brukernavn').fill(username)
  await page.getByPlaceholder('Passord').fill(password)
  await page.getByRole('button', { name: 'Logg inn' }).click()
  await page.waitForURL(`${baseURL}/`)

  await context.storageState({ path })
  await browser.close()
}

export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0].use.baseURL!
  fs.mkdirSync('tests/.auth', { recursive: true })
  await loginAndSave(baseURL, 'testuser',  'Test1234!', 'tests/.auth/testuser.json')
  await loginAndSave(baseURL, 'testadmin', 'Test1234!', 'tests/.auth/testadmin.json')
}
