/* biome-ignore-all lint/performance/useTopLevelRegex: test-level regex literals are acceptable and keep selectors readable */

import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'

function makePicsumMock(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    id: `${index + 1}`,
    author: `Author ${index + 1}`,
    width: 800,
    height: 600,
    url: '',
    download_url: '',
  }))
}

function expectedSlideCount(
  viewportWidth: number | undefined,
  renderedItemTotal: number,
) {
  if ((viewportWidth ?? 0) >= 1024) {
    return renderedItemTotal + 10
  }
  if ((viewportWidth ?? 0) >= 640) {
    return renderedItemTotal + 6
  }
  return renderedItemTotal + 4
}

async function extractRenderedItemTotal(page: Page) {
  const label = await page
    .getByRole('region', { name: /image carousel/i })
    .getByRole('article')
    .first()
    .getAttribute('aria-label')

  const match = label?.match(/of (\d+)/)
  if (!match) {
    throw new Error('Could not parse carousel total from aria-label')
  }

  return Number(match[1])
}

test.beforeEach(async ({ page }) => {
  await page.route('https://picsum.photos/v2/list**', async (route) => {
    const url = new URL(route.request().url())
    const limit = Number(url.searchParams.get('limit') ?? 100)
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(makePicsumMock(limit)),
    })
  })
})

test('carousel renders with real items plus loop clones', async ({ page }) => {
  await page.goto('/')

  const region = page.getByRole('region', { name: /image carousel/i })
  await expect(region).toBeVisible()

  const track = region.getByTestId('carousel-track')
  await expect(track).toBeVisible()

  const renderedItemTotal = await extractRenderedItemTotal(page)
  const expectedCount = expectedSlideCount(
    page.viewportSize()?.width,
    renderedItemTotal,
  )
  await expect
    .poll(() => region.locator('[data-carousel-slide]').count())
    .toBe(expectedCount)
})

test('carousel remains scroll-navigable scrolling right', async ({ page }) => {
  await page.goto('/')

  const region = page.getByRole('region', { name: /image carousel/i })
  await expect(region).toBeVisible()

  const track = region.getByTestId('carousel-track')

  for (let i = 0; i < 20; i += 1) {
    await track.evaluate((element) => {
      element.scrollBy({ left: 600, behavior: 'auto' })
      element.dispatchEvent(new Event('scroll'))
    })
  }

  await expect(track).toBeVisible()
  const renderedItemTotal = await extractRenderedItemTotal(page)
  const expectedCount = expectedSlideCount(
    page.viewportSize()?.width,
    renderedItemTotal,
  )
  await expect
    .poll(() => region.locator('[data-carousel-slide]').count())
    .toBe(expectedCount)
})

test('carousel remains scroll-navigable scrolling left', async ({ page }) => {
  await page.goto('/')

  const region = page.getByRole('region', { name: /image carousel/i })
  await expect(region).toBeVisible()

  const track = region.getByTestId('carousel-track')

  for (let i = 0; i < 20; i += 1) {
    await track.evaluate((element) => {
      element.scrollBy({ left: -600, behavior: 'auto' })
      element.dispatchEvent(new Event('scroll'))
    })
  }

  await expect(track).toBeVisible()
  const renderedItemTotal = await extractRenderedItemTotal(page)
  const expectedCount = expectedSlideCount(
    page.viewportSize()?.width,
    renderedItemTotal,
  )
  await expect
    .poll(() => region.locator('[data-carousel-slide]').count())
    .toBe(expectedCount)
})
