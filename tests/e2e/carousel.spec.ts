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

  const slideCount = await region.getByRole('article').count()
  expect(slideCount).toBe(1010)
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
  const slideCount = await region.getByRole('article').count()
  expect(slideCount).toBe(1010)
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
  const slideCount = await region.getByRole('article').count()
  expect(slideCount).toBe(1010)
})
