import { test, expect } from './fixtures/auth'

const KEYBOARD_HEIGHT = 300
const VIEWPORT = { width: 390, height: 844 }

// Simulate the keyboard opening via whichever API main.tsx uses.
// Chrome 94+ PWAs use navigator.virtualKeyboard; others use visualViewport.
async function simulateKeyboard(page: import('@playwright/test').Page) {
  await page.evaluate((kbH) => {
    const vk = (navigator as any).virtualKeyboard
    if (vk) {
      // Mock boundingRect and fire geometrychange
      Object.defineProperty(vk, 'boundingRect', {
        get: () => ({ x: 0, y: window.innerHeight - kbH, width: window.innerWidth, height: kbH }),
        configurable: true,
      })
      vk.dispatchEvent(new Event('geometrychange'))
    } else {
      Object.defineProperty(window.visualViewport, 'height', {
        get: () => window.innerHeight - kbH,
        configurable: true,
      })
      window.visualViewport!.dispatchEvent(new Event('resize'))
    }
  }, KEYBOARD_HEIGHT)
}

// Returns true if the element's bottom edge is above the keyboard.
async function isAboveKeyboard(page: import('@playwright/test').Page, locator: import('@playwright/test').Locator) {
  const box = await locator.boundingBox()
  if (!box) return false
  const visibleHeight = VIEWPORT.height - KEYBOARD_HEIGHT
  return box.y + box.height <= visibleHeight
}

test('new section input scrolls above keyboard when focused', async ({ authenticatedPage: page }) => {
  await page.setViewportSize(VIEWPORT)
  await page.goto('/profile')

  // Open home → location manage modal for Kjøleskap (has existing sections so the input is further down)
  const homeCard = page.locator('[data-testid="home-row"]').filter({ has: page.getByText('Testhjemmet', { exact: true }) })
  await homeCard.getByRole('button', { name: 'Administrer' }).click()
  const homeModal = page.getByRole('dialog').first()
  await homeModal.locator('[data-testid="location-row"]').filter({ hasText: 'Kjøleskap' }).click()
  const locModal = page.getByRole('dialog').last()

  const input = locModal.getByPlaceholder('Ny seksjon…')
  await expect(input).toBeVisible()

  // Click the input (simulates user tapping it — keyboard would open here on a real device)
  await input.click()

  // Simulate keyboard opening
  await simulateKeyboard(page)

  // Give layout time to reflow and scroll to settle
  await page.waitForTimeout(300)

  expect(await isAboveKeyboard(page, input)).toBe(true)
})
