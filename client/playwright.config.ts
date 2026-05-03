import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  webServer: [
    {
      command: 'dotnet run --project ../server --environment Testing --urls http://localhost:5001',
      url: 'http://localhost:5001/health',
      reuseExistingServer: false,
      timeout: 120_000, // Testcontainers needs time on first run (image pull)
      stdout: 'pipe',
      stderr: 'pipe',
    },
    {
      command: 'API_PORT=5001 yarn dev --port 4173',
      url: 'https://localhost:4173',
      reuseExistingServer: false,
      timeout: 30_000,
      ignoreHTTPSErrors: true,
    },
  ],
  use: {
    baseURL: 'https://localhost:4173',
    ignoreHTTPSErrors: true,
  },
})
