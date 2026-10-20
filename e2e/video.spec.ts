import { expect, test } from '@playwright/test';
import { alege, cauta, pas } from './ajutor';

// Înregistrarea parcursului CUI 1 pe telefon, ca să se vadă mișcarea (doar cu CAPTURI=1).
test.use({ video: { mode: 'on', size: { width: 390, height: 844 } } });

test('video: parcursul cu CUI 1 pe telefon', async ({ page }) => {
  test.skip(process.env.CAPTURI !== '1', 'doar pentru capturi');
  const pauza = () => page.waitForTimeout(900);
  await page.goto('/e-drive');
  await pauza();
  await cauta(page, '1');
  await expect(page.getByRole('heading', { name: 'DEMO MICRO SRL' })).toBeVisible();
  await pauza();
  await alege(page, 'firma', 'Da');
  for (const [cheie, optiune] of [
    ['nrM1', '2'], ['nrM2', '0'], ['vechi', 'Da'], ['pret_0', '~25.000 €'], ['ue_0', 'Da'],
    ['pret_1', 'La fel ca prima'], ['ue_1', 'Nu știu'],
  ]) {
    await pauza();
    await alege(page, cheie, optiune);
  }
  await expect(page.getByTestId('rezultat')).toBeVisible();
  await page.waitForTimeout(2000);
  await page.getByTestId('antrenor-rezultat').getByRole('button', { name: 'Aplică' }).click();
  await page.waitForTimeout(1500);
  await pas(page, 'nrM1').getByRole('button', { name: 'Schimbă răspunsul: 2' }).click();
  await pauza();
  await alege(page, 'nrM1', '2');
  await page.waitForTimeout(1500);
  await page.getByRole('button', { name: 'Trimite-ne analiza' }).click();
  const foaie = page.getByRole('dialog');
  await foaie.getByLabel('Numele tău').pressSequentially('Ion Popescu', { delay: 40 });
  await foaie.getByLabel('Telefonul').pressSequentially('0722123456', { delay: 40 });
  await foaie.getByRole('button', { name: 'Trimite analiza' }).click();
  await expect(page.getByText('Am primit analiza ta. Te sunăm noi.')).toBeVisible();
  await page.getByTestId('drum').scrollIntoViewIfNeeded();
  await page.waitForTimeout(2500);
  const video = page.video();
  await page.close();
  await video?.saveAs('docs/capturi/T02/parcurs-cui-1-telefon.webm');
});
