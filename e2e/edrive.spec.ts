import { expect, test } from '@playwright/test';
import { alege, captura, cauta, ecran, forma, progres, randRezultat, scena } from './ajutor';

test('pagina de start → e-DRIVE (S0, cu banda programului)', async ({ page }, info) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Laboratorul de calculatoare' })).toBeVisible();
  await page.getByRole('link', { name: /e-DRIVE/ }).click();
  await expect(page).toHaveURL(/\/e-drive$/);
  await ecran(page, 'cui');
  await expect(page.getByRole('heading', { name: /Finanțare pentru mașini electrice/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Hai să vedem cât poate primi firma ta.' })).toBeVisible();
  await forma(page, info);
  await captura(page, info, 'S0', { desktop: true });
});

test('CUI 1 · 2 autoturisme (UE + „Nu știu”) → R 80 → „Aplică” → 100 → trimite analiza', async ({ page }, info) => {
  await cauta(page, 'RO 1');
  await ecran(page, 'cui:cautare');
  await expect(scena(page)).toContainText('Caut firma la ANAF…');
  await captura(page, info, 'S1', { imediat: true });

  await ecran(page, 'firma');
  await expect(scena(page)).toContainText('Am găsit-o.');
  await expect(scena(page).getByRole('heading', { name: 'DEMO MICRO SRL' })).toBeVisible();
  await expect(randRezultat(page)).toHaveCount(0);
  await forma(page, info);
  // banda programului doar pe S0
  await expect(page.getByRole('heading', { name: /Finanțare pentru mașini electrice/ })).toHaveCount(0);
  await captura(page, info, 'S2', { desktop: true });
  await alege(page, info, 'firma', 'Da, e firma mea');

  await ecran(page, 'nrMasini');
  await expect(scena(page)).toContainText('Pornești cu 80 de puncte, pentru că ești microîntreprindere.');
  await expect(randRezultat(page)).toContainText('80 de puncte');
  await captura(page, info, 'M1');
  await alege(page, info, 'nrMasini', '2');

  await ecran(page, 'tipMasini');
  await expect(scena(page)).toContainText('Bun, două mașini.');
  await captura(page, info, 'M2');
  await alege(page, info, 'tipMasini', 'Toate sunt autoturisme');

  await ecran(page, 'vechi');
  await captura(page, info, 'M4');
  await alege(page, info, 'vechi', 'Da');

  await ecran(page, 'pret_0');
  await expect(scena(page)).toContainText('Acum, mașinile electrice noi.');
  await expect(scena(page)).toContainText('Mașina electrică 1 din 2 · autoturism');
  await captura(page, info, 'P1', { desktop: true });
  await alege(page, info, 'pret_0', '~25.000 €');
  await expect(randRezultat(page)).toContainText('până la 25.000 €');

  await ecran(page, 'ue_0');
  await expect(scena(page).locator('[data-antrenor]')).toContainText('Dacă alegi un model asamblat în UE, primești 20 de puncte în plus. Contează să fie toate asamblate în UE.');
  await captura(page, info, 'P2');
  await alege(page, info, 'ue_0', 'Da');
  await expect(randRezultat(page)).toContainText('100 de puncte');

  await ecran(page, 'pret_1');
  await expect(scena(page)).toContainText('Bun! Asta înseamnă 20 de puncte în plus.');
  await alege(page, info, 'pret_1', 'La fel ca mașina 1 · 25.000 €');
  await alege(page, info, 'ue_1', 'Nu știu');

  await ecran(page, 'rezultat');
  await forma(page, info, { intrebare: false });
  const r = page.getByTestId('rezultat');
  await expect(r).toContainText('Poți aplica.');
  await expect(r).toContainText('Primești până la 50.000 €.');
  await expect(r).toContainText('Tu plătești TVA-ul, cam 10.500 €.');
  await expect(page.getByTestId('antrenor-rezultat')).toContainText('Cu modele asamblate în UE ai avea 100.');
  await expect(randRezultat(page)).toContainText('80 de puncte');
  await captura(page, info, 'R', { desktop: true });
  await captura(page, info, 'R-intreg', { intreaga: true });

  await page.getByTestId('antrenor-rezultat').getByRole('button', { name: 'Aplică' }).click();
  await expect(page.getByTestId('antrenor-rezultat')).toHaveCount(0);
  await expect(randRezultat(page)).toContainText('100 de puncte');
  await expect(r.getByText('100', { exact: true }).first()).toBeVisible();

  const drum = page.getByTestId('drum');
  await expect(drum.locator('li').nth(0)).toHaveAttribute('data-stare', 'facut');
  await expect(drum.locator('li').nth(1)).toHaveAttribute('data-stare', 'urmator');

  await page.getByRole('button', { name: 'Trimite-ne analiza' }).click();
  const foaie = page.getByRole('dialog', { name: 'Trimite-ne analiza' });
  await expect(foaie).toContainText('Ce primim: firma, răspunsurile tale și rezultatul.');
  await foaie.getByRole('button', { name: 'Trimite', exact: true }).click();
  await expect(foaie.getByText('Scrie-ți numele')).toBeVisible();
  await foaie.getByLabel('Numele').fill('Ion Popescu');
  await foaie.getByLabel('Telefonul').fill('0722 123 456');
  await captura(page, info, 'T');
  await foaie.getByRole('button', { name: 'Trimite', exact: true }).click();
  await expect(foaie).toBeHidden();
  await expect(r).toContainText('Am primit analiza ta. Te sunăm noi.');
  await expect(drum.locator('li').nth(1)).toHaveAttribute('data-stare', 'facut');
  await expect(drum.locator('li').nth(2)).toHaveAttribute('data-stare', 'urmator');
  await expect(page.getByRole('button', { name: 'Analiza a fost trimisă ✓' })).toBeDisabled();
});

test('CUI 3 · 3 mașini „și, și” → 1 microbuz → „Altă sumă” 52.000 → R', async ({ page }, info) => {
  await cauta(page, '3');
  await alege(page, info, 'firma', 'Da, e firma mea');
  await expect(randRezultat(page)).toContainText('65 de puncte');
  await alege(page, info, 'nrMasini', '3');
  await alege(page, info, 'tipMasini', 'Și autoturisme, și microbuze');
  await ecran(page, 'nrMicrobuze');
  await expect(scena(page)).toContainText('Câte dintre cele 3 sunt microbuze?');
  await captura(page, info, 'M3');
  await alege(page, info, 'nrMicrobuze', '1');
  await ecran(page, 'vechi');
  await expect(scena(page)).toContainText('Deci două autoturisme și un microbuz.');
  await alege(page, info, 'vechi', 'Da');
  await alege(page, info, 'pret_0', '~20.000 €');
  await alege(page, info, 'ue_0', 'Nu');
  await ecran(page, 'pret_1');
  await expect(scena(page)).toContainText('Am notat.');
  await alege(page, info, 'pret_1', 'La fel ca mașina 1 · 20.000 €');
  await alege(page, info, 'ue_1', 'Nu');

  await ecran(page, 'pret_2');
  await expect(scena(page)).toContainText('Mașina electrică 3 din 3 · microbuz');
  await expect(scena(page)).toContainText('La microbuz nu există plafon pe vehicul.');
  await scena(page).getByRole('button', { name: 'Altă sumă' }).click();
  const suma = scena(page).getByLabel('Altă sumă');
  await expect(suma).toBeFocused();
  await ecran(page, 'pret_2'); // același ecran
  await suma.fill('52.000');
  await forma(page, info);
  await captura(page, info, 'P1-alta-suma');
  await scena(page).getByRole('button', { name: 'Gata' }).click();
  await alege(page, info, 'ue_2', 'Nu');

  await ecran(page, 'rezultat');
  await expect(page.getByTestId('rezultat')).toContainText('Primești până la 92.000 €.');
  await expect(randRezultat(page)).toContainText('65 de puncte');
  await expect(page.getByTestId('antrenor-rezultat')).toContainText('Cu modele asamblate în UE ai avea 85.');
});

test('„Mai multe” se transformă în loc: 5–10 în același ecran', async ({ page }, info) => {
  await cauta(page, '1');
  await alege(page, info, 'firma', 'Da, e firma mea');
  await ecran(page, 'nrMasini');
  await scena(page).getByRole('button', { name: 'Mai multe', exact: true }).click();
  await ecran(page, 'nrMasini');
  await expect(scena(page).getByRole('button', { name: '10', exact: true })).toBeVisible();
  await expect(scena(page).getByRole('button', { name: '1', exact: true })).toHaveCount(0);
  await captura(page, info, 'M1-mai-multe');
  await alege(page, info, 'nrMasini', '6');
  await ecran(page, 'tipMasini');
  await expect(scena(page)).toContainText('Bun, șase mașini.');
});

test('CUI 5 · PFA → S2 → Da → X1 → „Încearcă alt CUI” → S0 gol', async ({ page }, info) => {
  await cauta(page, '5');
  await alege(page, info, 'firma', 'Da, e firma mea');
  await ecran(page, 'oprireFirma');
  await forma(page, info, { intrebare: false });
  await expect(scena(page)).toContainText('Din păcate, firma nu poate aplica la e-DRIVE.');
  await expect(scena(page)).toContainText('PFA-urile și întreprinderile individuale sau familiale nu pot aplica');
  await expect(scena(page).getByRole('link', { name: /Sună-ne/ })).toHaveAttribute('href', 'tel:+40749589848');
  await expect(randRezultat(page)).toHaveCount(0);
  await captura(page, info, 'X1');
  await scena(page).getByRole('button', { name: 'Încearcă alt CUI' }).click();
  await ecran(page, 'cui');
  await expect(page.getByLabel('CUI-ul firmei')).toHaveValue('');
});

test('CUI 9 · fără bilanț → F2, F3 → M1… → R „estimat”', async ({ page }, info) => {
  await cauta(page, '9');
  await alege(page, info, 'firma', 'Da, e firma mea');
  await ecran(page, 'angajati');
  await expect(scena(page)).toContainText('Nu găsesc bilanțul firmei la ANAF. Îmi spui tu câteva lucruri.');
  await captura(page, info, 'F2');
  await alege(page, info, 'angajati', '0–9');
  await ecran(page, 'cifra');
  await captura(page, info, 'F3');
  await alege(page, info, 'cifra', 'sub 10 mil. lei');
  await ecran(page, 'nrMasini');
  await expect(scena(page)).toContainText('Pornești cu 80 de puncte');
  await alege(page, info, 'nrMasini', '1');
  await ecran(page, 'tipMasini');
  await expect(scena(page)).toContainText('Ce fel de mașină e?');
  await alege(page, info, 'tipMasini', 'Autoturism până la 8 locuri plus șoferul');
  await alege(page, info, 'vechi', 'Da');
  await ecran(page, 'pret_0');
  await expect(scena(page)).toContainText('Mașina electrică · autoturism');
  await alege(page, info, 'pret_0', '~20.000 €');
  await alege(page, info, 'ue_0', 'Da');
  await ecran(page, 'rezultat');
  await expect(page.getByTestId('rezultat')).toContainText('estimat din ce ne-ai spus');
  await expect(page.getByTestId('rezultat')).toContainText('Primești până la 20.000 €.');
  await expect(randRezultat(page)).toContainText('100 de puncte');
});

test('CUI negăsit → F1 cu ecoul; S3 → „Am greșit CUI-ul” → S0 gol', async ({ page }, info) => {
  await cauta(page, '12345678');
  await ecran(page, 'forma');
  await expect(scena(page)).toContainText('Nu găsesc datele firmei acum. Îmi spui tu câteva lucruri.');
  await captura(page, info, 'F1');
  await alege(page, info, 'forma', 'SRL sau SA');
  await ecran(page, 'angajati');

  await cauta(page, '4');
  await alege(page, info, 'firma', 'Nu');
  await ecran(page, 'corectez');
  await captura(page, info, 'S3');
  await alege(page, info, 'corectez', 'Cifrele nu mai sunt la zi');
  await ecran(page, 'angajati');
  await expect(scena(page)).toContainText('La ANAF, în bilanțul pe 2025: 300 angajați.');
  await page.getByRole('button', { name: '← Înapoi' }).click();
  await ecran(page, 'corectez');
  await alege(page, info, 'corectez', 'Am greșit CUI-ul');
  await ecran(page, 'cui');
  await expect(page.getByLabel('CUI-ul firmei')).toHaveValue('');
});

test('M4 = Nu → M5 = Nu → X2 → „Schimbă răspunsul” → M4', async ({ page }, info) => {
  await cauta(page, '1');
  await alege(page, info, 'firma', 'Da, e firma mea');
  await alege(page, info, 'nrMasini', '1');
  await alege(page, info, 'tipMasini', 'Microbuz peste 8 locuri plus șoferul');
  await ecran(page, 'vechi');
  await expect(scena(page)).toContainText('Mașina e a firmei de cel puțin un an?');
  await alege(page, info, 'vechi', 'Nu');
  await ecran(page, 'promisiune');
  await captura(page, info, 'M5');
  await alege(page, info, 'promisiune', 'Nu');
  await ecran(page, 'oprireVechi');
  await expect(scena(page)).toContainText('Fără o mașină de înlocuit nu se poate aplica.');
  await captura(page, info, 'X2');
  await scena(page).getByRole('button', { name: 'Schimbă răspunsul' }).click();
  await ecran(page, 'vechi');
  await expect(scena(page).getByRole('button', { name: 'Nu', exact: true })).toHaveAttribute('aria-pressed', 'true');
});

test('Înapoi de 3 ori din P2 (mașina 2), schimbi, mergi înainte cu răspunsurile preselectate; Back-ul browserului la fel', async ({ page }, info) => {
  await cauta(page, '1');
  await alege(page, info, 'firma', 'Da, e firma mea');
  await alege(page, info, 'nrMasini', '2');
  await alege(page, info, 'tipMasini', 'Toate sunt autoturisme');
  await alege(page, info, 'vechi', 'Da');
  await alege(page, info, 'pret_0', '~25.000 €');
  await alege(page, info, 'ue_0', 'Da');
  await alege(page, info, 'pret_1', '~45.000 €');
  await ecran(page, 'ue_1');
  await expect(scena(page)).toContainText('Peste plafon, diferența de 15.000 € o plătește firma.');

  const inapoi = () => page.getByRole('button', { name: '← Înapoi' }).click();
  await inapoi();
  await ecran(page, 'pret_1');
  await inapoi();
  await ecran(page, 'ue_0');
  await inapoi();
  await ecran(page, 'pret_0');
  await expect(scena(page).getByRole('button', { name: '~25.000 €' })).toHaveAttribute('aria-pressed', 'true');
  await captura(page, info, 'P1-preselectat');

  await alege(page, info, 'pret_0', '~30.000 €');
  await ecran(page, 'ue_0');
  await expect(scena(page).getByRole('button', { name: 'Da', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await alege(page, info, 'ue_0', 'Da');
  await ecran(page, 'pret_1');
  await expect(scena(page).getByRole('button', { name: '~45.000 €' })).toHaveAttribute('aria-pressed', 'true');
  await expect(scena(page).getByRole('button', { name: 'La fel ca mașina 1 · 30.000 €' })).toBeVisible();
  await alege(page, info, 'pret_1', '~45.000 €');
  await ecran(page, 'ue_1');

  // Back-ul browserului face același lucru ca „← Înapoi”
  await page.goBack();
  await ecran(page, 'pret_1');
  await page.goBack();
  await ecran(page, 'ue_0');
  await expect(progres(page)).toBeInViewport();
});

test('progresul: atingi o etapă trecută → prima ei întrebare, răspunsurile rămân', async ({ page }, info) => {
  await cauta(page, '1');
  await alege(page, info, 'firma', 'Da, e firma mea');
  await alege(page, info, 'nrMasini', '2');
  await ecran(page, 'tipMasini');
  await page.getByRole('button', { name: 'Înapoi la etapa Firma' }).click();
  await ecran(page, 'cui');
  await expect(page.getByLabel('CUI-ul firmei')).toHaveValue('1');
  await page.getByRole('button', { name: 'Caută firma' }).click();
  await ecran(page, 'firma');
  await expect(scena(page).getByRole('button', { name: 'Da, e firma mea' })).toHaveAttribute('aria-pressed', 'true');
});

test('glosarul: „TVA” subliniat se explică la atingere', async ({ page }, info) => {
  await cauta(page, '1');
  await alege(page, info, 'firma', 'Da, e firma mea');
  await alege(page, info, 'nrMasini', '1');
  await alege(page, info, 'tipMasini', 'Autoturism până la 8 locuri plus șoferul');
  await alege(page, info, 'vechi', 'Da');
  await ecran(page, 'pret_0');
  await scena(page).getByRole('button', { name: 'TVA', exact: true }).click();
  const foaie = page.getByRole('dialog', { name: 'TVA' });
  await expect(foaie).toContainText('21%');
  await foaie.getByRole('button', { name: 'Am înțeles' }).click();
  await expect(foaie).toBeHidden();
  await ecran(page, 'pret_0');
});

test('cu prefers-reduced-motion parcursul merge la fel', async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await cauta(page, '1');
  await alege(page, info, 'firma', 'Da, e firma mea');
  await alege(page, info, 'nrMasini', '1');
  await alege(page, info, 'tipMasini', 'Autoturism până la 8 locuri plus șoferul');
  await alege(page, info, 'vechi', 'Da');
  await alege(page, info, 'pret_0', '~30.000 €');
  await alege(page, info, 'ue_0', 'Da');
  await ecran(page, 'rezultat');
  await expect(page.getByTestId('rezultat')).toContainText('Primești până la 30.000 €.');
  await expect(randRezultat(page)).toContainText('100 de puncte');
});
