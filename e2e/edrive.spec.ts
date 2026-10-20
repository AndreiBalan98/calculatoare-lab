import { expect, test } from '@playwright/test';
import { alege, banda, captura, cauta, pas } from './ajutor';

test('pagina de start: rama site-ului și cardul e-DRIVE', async ({ page }, info) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Laboratorul de calculatoare' })).toBeVisible();
  await captura(page, info, '00-start');
  await page.getByRole('link', { name: /e-DRIVE/ }).click();
  await expect(page).toHaveURL(/\/e-drive$/);
  await expect(page.getByRole('heading', { name: /Finanțare pentru mașini electrice/ })).toBeVisible();
});

test('CUI 1 · micro, 2 autoturisme (UE + „Nu știu”) → 80, „Aplică” → 100, trimite analiza', async ({ page }, info) => {
  await page.goto('/e-drive');
  await expect(page.getByText('Salut! Hai să vedem')).toBeVisible();
  await captura(page, info, '01-salut');

  await cauta(page, 'RO 1');
  await expect(page.getByText('Caut firma la ANAF…')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'DEMO MICRO SRL' })).toBeVisible();
  await expect(page.getByText('Am găsit-o:')).toBeVisible();
  await expect(pas(page, 'firma').getByRole('button', { name: 'Da', exact: true })).toBeVisible();
  await captura(page, info, '02-firma');

  await alege(page, 'firma', 'Da');
  await expect(page.getByText(/Pornești cu 80 de puncte/)).toBeVisible();
  await expect(banda(page)).toContainText('Microîntreprindere · 80 de puncte');
  await expect(pas(page, 'nrM1').getByRole('button', { name: '2', exact: true })).toBeVisible();
  await captura(page, info, '03-banda-scor');

  await alege(page, 'nrM1', '2');
  await alege(page, 'nrM2', '0');
  await alege(page, 'vechi', 'Da');
  await expect(pas(page, 'pret_0').getByRole('button', { name: '~25.000 €' })).toBeVisible();
  await captura(page, info, '04-pret');

  await alege(page, 'pret_0', '~25.000 €');
  await expect(page.getByText(/Dacă alegi un model/)).toBeVisible();
  await expect(pas(page, 'ue_0').getByRole('button', { name: 'Nu știu' })).toBeVisible();
  await captura(page, info, '05-antrenor-ue');

  await alege(page, 'ue_0', 'Da');
  await expect(banda(page)).toContainText('100');
  await expect(pas(page, 'pret_1').getByRole('button', { name: 'La fel ca prima' })).toBeVisible();
  await alege(page, 'pret_1', 'La fel ca prima');
  await alege(page, 'ue_1', 'Nu știu');
  await expect(page.getByText('Nicio grijă, verificăm împreună modelul.', { exact: false })).toBeVisible();

  const rezultat = page.getByTestId('rezultat');
  await expect(rezultat).toBeVisible();
  await expect(rezultat).toContainText('Poți aplica.');
  await expect(rezultat).toContainText('Primești până la 50.000 €.');
  await expect(rezultat).toContainText('Tu plătești TVA-ul, cam 10.500 €.');
  await expect(page.getByTestId('antrenor-rezultat')).toContainText('Cu modele asamblate în UE ai avea 100.');
  await expect(banda(page)).toContainText('80');
  await captura(page, info, '06-rezultat');
  await captura(page, info, '06-rezultat-intreg', true);

  await page.getByTestId('antrenor-rezultat').getByRole('button', { name: 'Aplică' }).click();
  await expect(page.getByTestId('antrenor-rezultat')).toHaveCount(0);
  await expect(rezultat.getByText('100', { exact: true }).first()).toBeVisible();
  await expect(banda(page)).toContainText('+20 pentru mașini asamblate în UE');
  await expect(pas(page, 'ue_1')).toContainText('Da');

  // Drumul până la bani: pasul 1 făcut, pasul 2 următorul
  const drum = page.getByTestId('drum');
  await drum.scrollIntoViewIfNeeded();
  await expect(drum.locator('li').nth(0)).toHaveAttribute('data-stare', 'facut');
  await expect(drum.locator('li').nth(1)).toHaveAttribute('data-stare', 'urmator');
  await captura(page, info, '07-drum');

  await page.getByRole('button', { name: 'Trimite-ne analiza' }).click();
  const foaie = page.getByRole('dialog', { name: 'Trimite-ne analiza' });
  await expect(foaie).toBeVisible();
  await foaie.getByRole('button', { name: 'Trimite analiza' }).click();
  await expect(foaie.getByText('Scrie-ți numele')).toBeVisible();
  await foaie.getByLabel('Numele tău').fill('Ion Popescu');
  await foaie.getByLabel('Telefonul').fill('0722 123 456');
  await expect(foaie).toContainText('DEMO MICRO SRL');
  await captura(page, info, '08-trimite');
  await foaie.getByRole('button', { name: 'Trimite analiza' }).click();
  await expect(foaie.getByRole('button', { name: 'Se trimite…' })).toBeVisible();
  await expect(foaie).toBeHidden();
  await expect(page.getByText('Am primit analiza ta. Te sunăm noi.')).toBeVisible();
  await expect(drum.locator('li').nth(1)).toHaveAttribute('data-stare', 'facut');
  await expect(drum.locator('li').nth(2)).toHaveAttribute('data-stare', 'urmator');
  await drum.scrollIntoViewIfNeeded();
  await captura(page, info, '09-trimisa');
});

test('pastila: te întorci la o întrebare, iar răspunsurile de după rămân', async ({ page }, info) => {
  await cauta(page, '1');
  await alege(page, 'firma', 'Da');
  await alege(page, 'nrM1', '2');
  await alege(page, 'nrM2', '0');
  await alege(page, 'vechi', 'Da');
  await alege(page, 'pret_0', '~25.000 €');
  await alege(page, 'ue_0', 'Da');
  await alege(page, 'pret_1', '~45.000 €');
  await alege(page, 'ue_1', 'Nu');
  await expect(page.getByTestId('rezultat')).toContainText('Primești până la 55.000 €.');

  await pas(page, 'nrM1').getByRole('button', { name: 'Schimbă răspunsul: 2' }).click();
  await expect(page.getByTestId('rezultat')).toHaveCount(0);
  await expect(pas(page, 'nrM1').getByRole('button', { name: '1', exact: true })).toBeVisible();
  await captura(page, info, '10-pastila');
  await alege(page, 'nrM1', '1');
  // autoturismul 1 își păstrează prețul și răspunsul UE → direct la rezultat, 100
  await expect(page.getByTestId('rezultat')).toContainText('Primești până la 25.000 €.');
  await expect(banda(page)).toContainText('100');
  await expect(pas(page, 'pret_1')).toHaveCount(0);
});

test('CUI 3 · mijlocie, un microbuz cu „Altă sumă” → 65 de puncte', async ({ page }, info) => {
  await cauta(page, '3');
  await alege(page, 'firma', 'Da');
  await expect(banda(page)).toContainText('Întreprindere mijlocie · 65 de puncte');
  await alege(page, 'nrM1', '0');
  await alege(page, 'nrM2', '1');
  await alege(page, 'vechi', 'Da');
  await expect(page.getByText('La microbuz nu există plafon pe vehicul.')).toBeVisible();
  await pas(page, 'pret_0').getByRole('button', { name: 'Altă sumă' }).click();
  const suma = pas(page, 'pret_0').getByLabel('Altă sumă');
  await expect(suma).toBeFocused();
  await suma.fill('52.000');
  await captura(page, info, '11-alta-suma');
  await pas(page, 'pret_0').getByRole('button', { name: 'Gata' }).click();
  await expect(pas(page, 'pret_0').getByRole('button', { name: 'Schimbă răspunsul: 52.000 €' })).toBeVisible();
  await alege(page, 'ue_0', 'Nu');
  const rezultat = page.getByTestId('rezultat');
  await expect(rezultat).toContainText('Primești până la 52.000 €.');
  await expect(banda(page)).toContainText('65');
  await expect(page.getByTestId('antrenor-rezultat')).toContainText('Cu un model asamblat în UE ai avea 85.');
});

test('CUI 5 · PFA → oprire blândă → „Încearcă alt CUI”', async ({ page }, info) => {
  await cauta(page, '5');
  await alege(page, 'firma', 'Da');
  const oprire = page.getByTestId('oprire');
  await expect(oprire).toContainText('Din păcate, firma nu poate aplica la e-DRIVE.');
  await expect(oprire).toContainText('PFA-urile și întreprinderile individuale sau familiale nu pot aplica');
  await expect(oprire.getByRole('link', { name: /Sună-ne/ })).toHaveAttribute('href', 'tel:+40749589848');
  await expect(banda(page)).toHaveCount(0);
  await captura(page, info, '12-oprire-pfa');
  await oprire.getByRole('button', { name: 'Încearcă alt CUI' }).click();
  await expect(oprire).toHaveCount(0);
  await expect(page.getByLabel('CUI-ul firmei')).toBeVisible();
  await expect(page.getByLabel('CUI-ul firmei')).toHaveValue('');
});

test('CUI 9 · fără bilanț → întrebările minime → rezultat estimat', async ({ page }, info) => {
  await cauta(page, '9');
  await alege(page, 'firma', 'Da');
  await expect(page.getByText(/Nu găsesc bilanțul firmei la ANAF/)).toBeVisible();
  await expect(pas(page, 'angajati').getByRole('button', { name: '0–9' })).toBeVisible();
  await captura(page, info, '13-fara-bilant');
  await alege(page, 'angajati', '0–9');
  await alege(page, 'cifra', 'sub 10 mil. lei');
  await expect(page.getByText(/Pornești cu 80 de puncte/)).toBeVisible();
  await expect(banda(page)).toContainText('estimat');
  await alege(page, 'nrM1', '1');
  await alege(page, 'nrM2', '0');
  await alege(page, 'vechi', 'Da');
  await alege(page, 'pret_0', '~20.000 €');
  await alege(page, 'ue_0', 'Da');
  const rezultat = page.getByTestId('rezultat');
  await expect(rezultat).toContainText('estimat din ce ne-ai spus');
  await expect(rezultat).toContainText('Primești până la 20.000 €.');
  await expect(banda(page)).toContainText('100');
  await captura(page, info, '14-rezultat-estimat');
});

test('glosarul: cuvântul subliniat se explică la atingere', async ({ page }, info) => {
  await cauta(page, '1');
  await alege(page, 'firma', 'Da');
  await page.getByRole('button', { name: 'microîntreprindere' }).click();
  const foaie = page.getByRole('dialog', { name: 'Microîntreprindere' });
  await expect(foaie).toContainText('Firmă cu sub 10 angajați');
  await captura(page, info, '15-glosar');
  await foaie.getByRole('button', { name: 'Am înțeles' }).click();
  await expect(foaie).toBeHidden();
});

test('„Reia de la început” golește conversația', async ({ page }) => {
  await cauta(page, '1');
  await alege(page, 'firma', 'Da');
  await page.getByRole('button', { name: 'Reia de la început' }).click();
  await expect(page.getByLabel('CUI-ul firmei')).toBeVisible();
  await expect(pas(page, 'firma')).toHaveCount(0);
  await expect(banda(page)).toHaveCount(0);
});

test.describe('cu prefers-reduced-motion', () => {
  test('parcursul merge la fel, fără deplasări', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await cauta(page, '1');
    await alege(page, 'firma', 'Da');
    await alege(page, 'nrM1', '1');
    await alege(page, 'nrM2', '0');
    await alege(page, 'vechi', 'Da');
    await alege(page, 'pret_0', '~30.000 €');
    await alege(page, 'ue_0', 'Da');
    await expect(page.getByTestId('rezultat')).toContainText('Primești până la 30.000 €.');
    await expect(banda(page)).toContainText('100');
  });
});
