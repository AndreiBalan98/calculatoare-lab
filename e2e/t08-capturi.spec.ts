import { expect, test } from '@playwright/test';
import { cauta, ecran, scena } from './ajutor';

// Capturile T08 (docs/capturi/T08/), pe telefon 390×844: E3, E4, E6, E7, rezultatul și trei cadre din
// zborul răspunsului spre rezumat. Doar cu CAPTURI=1: CAPTURI=1 npx playwright test e2e/t08-capturi.spec.ts
test.use({ video: process.env.CAPTURI === '1' ? { mode: 'on', size: { width: 390, height: 844 } } : 'off' });

test('capturi T08: e-DRIVE v2 pe telefon', async ({ page }, info) => {
  test.skip(process.env.CAPTURI !== '1' || info.project.name !== 'telefon', 'doar pentru capturi, pe telefon');
  const dir = 'docs/capturi/T08';
  const poza = async (nume: string, asteapta = 1300) => {
    await page.mouse.move(0, 0);
    if (asteapta) await page.waitForTimeout(asteapta);
    await page.screenshot({ path: `${dir}/${nume}.png` });
  };
  const continua = () => scena(page).getByRole('button', { name: 'Continuă', exact: true }).click();
  const buton = (nume: string) => scena(page).getByRole('button', { name: nume, exact: true });

  await cauta(page, '1', '/e-drive/v2');
  await ecran(page, 'firma');
  await page.waitForTimeout(800);
  await buton('Da').click();
  await ecran(page, 'nrMasini');
  await poza('1-E3-scorul-de-ce');
  await buton('Mai multe').click();
  await page.waitForTimeout(600);

  // zborul „2 mașini” spre rezumat: trei cadre
  await continua();
  await page.waitForTimeout(60);
  await poza('6-zbor-1', 0);
  await page.waitForTimeout(140);
  await poza('6-zbor-2', 0);
  await page.waitForTimeout(330);
  await poza('6-zbor-3', 0);

  await ecran(page, 'tipMasini');
  await scena(page).getByRole('radio', { name: 'Autoturisme' }).click();
  await poza('2-E4-primesti-pana-la');
  await continua();
  await ecran(page, 'vechi');
  await page.waitForTimeout(800);
  await buton('Da').click();
  await ecran(page, 'pret');
  await scena(page).getByRole('slider').focus();
  for (let i = 0; i < 10; i++) await page.keyboard.press('ArrowLeft');
  await poza('3-E6-glisor');
  await continua();
  await ecran(page, 'ue');
  await poza('4-E7-da-auriu');
  await buton('Da').click();
  await ecran(page, 'rezultat');
  await expect(page.locator('[data-rand-cifra]')).toContainText('100/100 puncte');
  await poza('5-rezultat', 1800);
});
