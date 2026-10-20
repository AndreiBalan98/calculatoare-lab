import { expect, test } from '@playwright/test';
import { alege, cauta, ecran } from './ajutor';

// Înregistrarea parcursului CUI 1 pe telefon, ca să se vadă mișcarea (doar cu CAPTURI=1).
test.use({ video: { mode: 'on', size: { width: 390, height: 844 } } });

test('video: parcursul cu CUI 1 pe telefon', async ({ page }, info) => {
  test.skip(process.env.CAPTURI !== '1', 'doar pentru capturi');
  const pauza = () => page.waitForTimeout(1100);
  await page.goto('/e-drive');
  await pauza();
  await cauta(page, '1');
  await ecran(page, 'firma');
  await pauza();
  for (const [cheie, optiune] of [
    ['firma', 'Da, e firma mea'], ['nrMasini', '2'], ['tipMasini', 'Toate sunt autoturisme'], ['vechi', 'Da'],
    ['pret_0', '~25.000 €'], ['ue_0', 'Da'], ['pret_1', 'La fel ca mașina 1 · 25.000 €'], ['ue_1', 'Nu știu'],
  ]) {
    await ecran(page, cheie);
    await pauza();
    await alege(page, info, cheie, optiune);
  }
  await ecran(page, 'rezultat');
  await page.waitForTimeout(2500);
  await page.getByTestId('antrenor-rezultat').getByRole('button', { name: 'Aplică' }).click();
  await page.waitForTimeout(1500);
  await page.getByRole('button', { name: 'Trimite-ne analiza' }).click();
  const foaie = page.getByRole('dialog');
  await foaie.getByLabel('Numele').pressSequentially('Ion Popescu', { delay: 40 });
  await foaie.getByLabel('Telefonul').pressSequentially('0722123456', { delay: 40 });
  await foaie.getByRole('button', { name: 'Trimite', exact: true }).click();
  await expect(page.getByText('Am primit analiza ta. Te sunăm noi.')).toBeVisible();
  await page.getByTestId('drum').scrollIntoViewIfNeeded();
  await page.waitForTimeout(2500);
  const video = page.video();
  await page.close();
  await video?.saveAs('docs/capturi/T03/parcurs-cui-1-telefon.webm');
});
