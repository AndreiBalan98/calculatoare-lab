import { expect, test } from '@playwright/test';
import { cauta, ecran, scena } from './ajutor';

// Înregistrarea parcursului principal e-DRIVE în varianta 2, pe telefon (doar cu CAPTURI=1).
test.use({ video: { mode: 'on', size: { width: 390, height: 844 } } });

test('video: e-DRIVE v2, parcursul principal pe telefon', async ({ page }) => {
  test.skip(process.env.CAPTURI !== '1', 'doar pentru capturi');
  const pauza = (ms = 1000) => page.waitForTimeout(ms);
  const continua = () => scena(page).getByRole('button', { name: 'Continuă', exact: true }).click();
  await page.goto('/e-drive/v2');
  await pauza();
  await page.getByLabel('CUI-ul firmei').pressSequentially('1', { delay: 120 });
  await pauza(400);
  await cauta(page, '1', '/e-drive/v2');
  await ecran(page, 'firma');
  await pauza(1400);
  await scena(page).getByRole('button', { name: 'Da', exact: true }).click();
  await ecran(page, 'nrMasini');
  await pauza(1400);
  await scena(page).getByRole('button', { name: 'Mai multe' }).click();
  await pauza(700);
  await continua();
  await ecran(page, 'tipMasini');
  await pauza();
  await scena(page).getByRole('radio', { name: 'Autoturisme' }).click();
  await pauza(1200);
  await continua();
  await ecran(page, 'vechi');
  await pauza();
  await scena(page).getByRole('button', { name: 'Da', exact: true }).click();
  await ecran(page, 'pret');
  await pauza();
  // trage glisorul: 30.000 → 40.000 → 25.000
  const pista = scena(page).locator('[data-glisor] .touch-pan-y');
  const c = (await pista.boundingBox())!;
  const x = (v: number) => c.x + ((v - 15000) / 65000) * c.width;
  await page.mouse.move(x(30000), c.y + c.height / 2);
  await page.mouse.down();
  for (const v of [32000, 35000, 38000, 40000, 37000, 33000, 29000, 26000, 25000]) {
    await page.mouse.move(x(v), c.y + c.height / 2, { steps: 6 });
    await pauza(120);
  }
  await page.mouse.up();
  await expect(scena(page).getByRole('slider')).toHaveAttribute('aria-valuetext', '25.000 €');
  await pauza(1200);
  await continua();
  await ecran(page, 'ue');
  await pauza();
  await scena(page).getByRole('button', { name: 'Da', exact: true }).click();
  await ecran(page, 'rezultat');
  await pauza(2500);
  await page.getByRole('button', { name: 'Schimbă: 2 mașini' }).click();
  await ecran(page, 'nrMasini');
  await pauza(900);
  await scena(page).getByRole('button', { name: 'Mai multe' }).click();
  await pauza(1200);
  await continua();
  await ecran(page, 'rezultat');
  await pauza(2000);
  await page.getByTestId('drum').scrollIntoViewIfNeeded();
  await pauza(2000);
  const video = page.video();
  await page.close();
  await video?.saveAs('docs/capturi/T07/edrive-v2-parcurs-telefon.webm');
});
