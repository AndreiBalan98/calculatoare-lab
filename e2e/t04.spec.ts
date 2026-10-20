import { expect, test, type Page } from '@playwright/test';
import { alege, captura, cauta, ecran, progres, scena, telefon } from './ajutor';

const cutie = async (page: Page, selector: string) => {
  const c = await page.locator(selector).first().boundingBox();
  expect(c, selector).not.toBeNull();
  return c!;
};

test('S0: progresul stă sub banda programului și deasupra câmpului CUI; pe S2, imediat sub antet', async ({ page }, info) => {
  await page.goto('/e-drive');
  await ecran(page, 'cui');
  const antet = await cutie(page, 'header');
  const banda = await cutie(page, '[data-banda-program]');
  const pr = await cutie(page, '[data-progres]');
  const camp = await cutie(page, '#cui');
  expect(banda.y).toBeGreaterThanOrEqual(antet.y + antet.height - 1);
  expect(pr.y).toBeGreaterThanOrEqual(banda.y + banda.height - 1);
  expect(camp.y).toBeGreaterThan(pr.y + pr.height);
  await captura(page, info, 'S0', { desktop: true });

  await page.getByLabel('CUI-ul firmei').fill('1');
  await page.getByRole('button', { name: 'Caută firma' }).click();
  await ecran(page, 'firma');
  await expect(page.locator('[data-banda-program]')).toHaveCount(0);
  const antet2 = await cutie(page, 'header');
  await expect(async () => {
    const pr2 = await cutie(page, '[data-progres]');
    expect(Math.abs(pr2.y - (antet2.y + antet2.height))).toBeLessThanOrEqual(1);
  }).toPass();
  await captura(page, info, 'S2', { desktop: true });
});

test('desktop: progresul are lățimea scenei, pe fundalul paginii, cu linie doar când e lipit sus', async ({ page }, info) => {
  test.skip(telefon(info), 'doar pe desktop');
  await cauta(page, '1');
  await alege(page, info, 'firma', 'Da, e firma mea');
  await ecran(page, 'nrMasini');
  const interior = progres(page).locator(':scope > div').first();
  const lat = (await interior.boundingBox())!.width;
  expect(lat).toBeLessThanOrEqual(640);
  const fond = await progres(page).evaluate((e) => getComputedStyle(e).backgroundColor);
  expect(fond).toBe('rgb(246, 247, 249)');
  const linie = await interior.evaluate((e) => getComputedStyle(e).borderBottomColor);
  expect(linie).toBe('rgba(0, 0, 0, 0)');

  // pe R pagina se derulează: progresul rămâne lipit sus, cu linia fină
  await alege(page, info, 'nrMasini', '1');
  await alege(page, info, 'tipMasini', 'Autoturism până la 8 locuri plus șoferul');
  await alege(page, info, 'vechi', 'Da');
  await alege(page, info, 'pret_0', '~25.000 €');
  await alege(page, info, 'ue_0', 'Da');
  await ecran(page, 'rezultat');
  await page.waitForTimeout(2000); // să se termine intrarea rezultatului
  await page.mouse.wheel(0, 600);
  await expect(progres(page)).toHaveAttribute('data-lipit', 'true');
  await expect(progres(page)).toBeInViewport();
  await expect.poll(() => interior.evaluate((e) => getComputedStyle(e).borderBottomColor)).toBe('rgb(221, 226, 234)');
  await captura(page, info, 'R-lipit', { desktop: true });
});

test('desktop: explicația la hover (nu la click), dispare când pleacă mouse-ul', async ({ page }, info) => {
  test.skip(telefon(info), 'doar pe desktop');
  await cauta(page, '1');
  await alege(page, info, 'firma', 'Da, e firma mea');
  await ecran(page, 'nrMasini');
  const termen = scena(page).locator('[data-termen="microintreprindere"]');
  const balon = page.getByRole('tooltip');

  await termen.hover();
  await expect(balon).toBeVisible();
  await expect(balon).toContainText('Firmă cu sub 10 angajați');
  await expect(termen).toHaveAttribute('aria-describedby', (await balon.getAttribute('id'))!);
  // balonul nu iese din ecran
  const b = (await balon.boundingBox())!;
  const lat = await page.evaluate(() => innerWidth);
  expect(b.x).toBeGreaterThanOrEqual(0);
  expect(b.x + b.width).toBeLessThanOrEqual(lat);
  expect(b.y).toBeGreaterThanOrEqual(0);
  // rămâne cât mouse-ul e pe balon
  await balon.hover();
  await page.waitForTimeout(300);
  await expect(balon).toBeVisible();
  await captura(page, info, 'glosar-hover', { desktop: true });

  await page.mouse.move(5, 700);
  await expect(balon).toBeHidden();

  // click: nu deschide nicio foaie sau dialog
  await termen.click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.mouse.move(5, 700);
  await expect(balon).toBeHidden();
  await ecran(page, 'nrMasini');
});

test('tastatura: balonul la focus, închis cu Esc', async ({ page }, info) => {
  test.skip(telefon(info), 'doar pe desktop');
  await cauta(page, '1');
  await alege(page, info, 'firma', 'Da, e firma mea');
  await alege(page, info, 'nrMasini', '1');
  await alege(page, info, 'tipMasini', 'Autoturism până la 8 locuri plus șoferul');
  await alege(page, info, 'vechi', 'Da');
  await ecran(page, 'pret_0');
  const termen = scena(page).locator('[data-termen="tva"]');
  await termen.focus();
  // focus de la tastatură: Shift+Tab, Tab ca să fie :focus-visible
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  const balon = page.getByRole('tooltip');
  await expect(balon).toContainText('21%');
  await page.keyboard.press('Escape');
  await expect(balon).toBeHidden();
});

test('telefon: tap → balonul apare; tap în altă parte → dispare', async ({ page }, info) => {
  test.skip(!telefon(info), 'doar pe telefon');
  await cauta(page, '1');
  await alege(page, info, 'firma', 'Da, e firma mea');
  await alege(page, info, 'nrMasini', '1');
  await alege(page, info, 'tipMasini', 'Autoturism până la 8 locuri plus șoferul');
  await alege(page, info, 'vechi', 'Da');
  await ecran(page, 'pret_0');
  const termen = scena(page).locator('[data-termen="tva"]');
  const balon = page.getByRole('tooltip');
  await termen.tap();
  await expect(balon).toBeVisible();
  await expect(balon).toContainText('21%');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const b = (await balon.boundingBox())!;
  const lat = await page.evaluate(() => innerWidth);
  expect(b.x).toBeGreaterThanOrEqual(0);
  expect(b.x + b.width).toBeLessThanOrEqual(lat);
  await captura(page, info, 'glosar-tap');
  // tap într-un loc gol (sub răspunsuri)
  const h = await page.evaluate(() => innerHeight);
  await page.touchscreen.tap(20, h - 20);
  await expect(balon).toBeHidden();
  await ecran(page, 'pret_0');
});
