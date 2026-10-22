import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { contextDin } from '@/scenariu/context';
import { FIRME_DEMO } from '@/motor/edrive/fixtures';
import { captura, cauta, ecran, scena, telefon } from './ajutor';

// Varianta 2 „Cifra vie” (tasks/T07 §5, T08 la e-DRIVE). Capturile: CAPTURI=1 CAPTURI_DIR=T07 npx playwright test e2e/v2.spec.ts

/** Sumele din motor au spațiu nedespărțit înainte de unitate. */
const nb = (t: string) => t.replace(/ (€|lei)$/, '\u00a0$1');

const EDRIVE = '/e-drive/v2';
const SME = '/sme-eco-tech/v2';

const card = (page: Page) => page.locator('[data-card]');
const cifra = (page: Page) => page.locator('[data-cifra]');
const rand = (page: Page) => page.locator('[data-rand-cifra]');
const soapta = (page: Page) => page.locator('[data-soapta]');
const rezumat = (page: Page) => page.locator('[data-rezumat] button');
const deCe = (page: Page) => page.locator('[data-de-ce]');
const continua = (page: Page) => scena(page).getByRole('button', { name: 'Continuă', exact: true });
const buton = (page: Page, nume: string) => scena(page).getByRole('button', { name: nume, exact: true });

/** Forma (tasks/T07 §5): fără derulare pe 390×844, fără derulare orizontală, fără etapele, ecoul și antrenorul v1. */
async function forma(page: Page, info: TestInfo) {
  await page.waitForTimeout(500);
  const [sh, ih, sw, iw] = await page.evaluate(() => [document.documentElement.scrollHeight, innerHeight, document.documentElement.scrollWidth, innerWidth]);
  expect(sw, 'fără derulare orizontală').toBeLessThanOrEqual(iw);
  if (info.project.name === 'telefon') {
    expect(sh, 'ecranul încape fără derulare').toBeLessThanOrEqual(ih + 4);
    for (const el of [card(page), scena(page).locator('[data-intrebare]')]) {
      const c = await el.boundingBox();
      expect(c!.y + c!.height).toBeLessThanOrEqual(ih);
    }
    if (await continua(page).count()) {
      const c = await continua(page).boundingBox();
      expect(c!.y + c!.height).toBeLessThanOrEqual(ih);
    }
  }
  for (const t of ['Firma', 'Mașinile', 'Prețul']) await expect(page.getByText(t, { exact: true })).toHaveCount(0);
  await expect(page.locator('[data-ecou], [data-antrenor], [data-progres]')).toHaveCount(0);
}

async function plus(page: Page, ori: number) {
  for (let i = 0; i < ori; i++) await buton(page, 'Mai multe').click();
}

/** Parcursul principal e-DRIVE până la rezultat (CUI 1, 2 autoturisme, 25.000 €, UE). */
async function principalEdrive(page: Page, info: TestInfo, capturi = false) {
  await page.goto(EDRIVE);
  await ecran(page, 'cui');
  await expect(page.getByRole('heading', { name: 'Hai să vedem cât poate primi firma ta.' })).toBeVisible();
  if (capturi) await captura(page, info, 'edrive-E1', { desktop: true });
  await cauta(page, '1', EDRIVE);
  await expect(page.getByRole('status')).toContainText('Caut firma la ANAF…');
  if (capturi) await captura(page, info, 'edrive-E1-cauta', { imediat: true });

  await ecran(page, 'firma');
  await expect(card(page)).toContainText('DEMO MICRO SRL');
  await expect(card(page)).toContainText('microîntreprindere · Botoșani');
  await forma(page, info);
  if (capturi) await captura(page, info, 'edrive-E2', { desktop: true });
  await buton(page, 'Da').click();

  await ecran(page, 'nrMasini');
  await expect(cifra(page)).toHaveAttribute('data-valoare', '80');
  await expect(cifra(page)).toHaveAttribute('aria-label', '80 din 100 de puncte');
  await expect(cifra(page).locator('[data-din]')).toHaveText('/100');
  await expect(deCe(page)).toHaveText('Pornești cu 80 de puncte, pentru că ești microîntreprindere.');
  await forma(page, info);
  if (capturi) await captura(page, info, 'edrive-E3');
  await plus(page, 1);
  await continua(page).click();

  await ecran(page, 'tipMasini');
  await forma(page, info);
  await scena(page).getByRole('radio', { name: 'Autoturisme' }).click();
  await expect(cifra(page)).toHaveAttribute('aria-label', 'Primești până la 60.000 €');
  if (capturi) await captura(page, info, 'edrive-E4');
  await continua(page).click();

  await ecran(page, 'vechi');
  await expect(cifra(page)).toHaveAttribute('aria-label', 'Primești până la 60.000 €');
  await expect(cifra(page).locator('[data-prefix]')).toHaveText('Primești până la');
  await expect(rand(page)).toHaveText('80/100 puncte');
  await expect(deCe(page)).toHaveCount(0);
  await forma(page, info);
  if (capturi) await captura(page, info, 'edrive-E5');
  await buton(page, 'Da').click();

  await ecran(page, 'pret');
  await forma(page, info);
  if (capturi) await captura(page, info, 'edrive-E6', { desktop: true });
  // cu tastatura: 30.000 → 25.000 (pas 500); cifra se schimbă înainte de „Continuă”
  await scena(page).getByRole('slider').focus();
  for (let i = 0; i < 10; i++) await page.keyboard.press('ArrowLeft');
  await expect(scena(page).getByRole('slider')).toHaveAttribute('aria-valuetext', nb('25.000 €'));
  await expect(cifra(page)).toHaveAttribute('data-valoare', '50000');
  await ecran(page, 'pret');
  await continua(page).click();

  await ecran(page, 'ue');
  await expect(buton(page, 'Da')).toContainText('Primești 20 de puncte în plus');
  await expect(soapta(page)).toHaveCount(0);
  await forma(page, info);
  if (capturi) await captura(page, info, 'edrive-E7');
  await buton(page, 'Da').click();

  await ecran(page, 'rezultat');
  await expect(cifra(page)).toHaveAttribute('aria-label', 'Primești 50.000 €');
  await expect(rand(page)).toHaveText(/^100\/100 puncte/);
}

test('pagina de start: comutatorul de variante (implicit 2, /?v=1)', async ({ page }, info) => {
  await page.goto('/');
  const variante = page.locator('[data-comutator-variante]');
  await expect(variante.getByRole('link', { name: 'Varianta 2' })).toHaveAttribute('aria-current', 'page');
  await expect(page.getByRole('link', { name: /e-DRIVE/ })).toHaveAttribute('href', '/e-drive/v2');
  await expect(page.getByRole('link', { name: /SME Eco-Tech/ })).toHaveAttribute('href', '/sme-eco-tech/v2');
  await captura(page, info, 'acasa');
  await variante.getByRole('link', { name: 'Varianta 1' }).click();
  await expect(page).toHaveURL(/\/\?v=1$/);
  await expect(page.getByRole('link', { name: /e-DRIVE/ })).toHaveAttribute('href', '/e-drive');
  await page.getByRole('link', { name: /e-DRIVE/ }).click();
  await expect(page).toHaveURL(/\/e-drive$/);
});

test('e-DRIVE · parcursul principal (CUI 1) → 50.000 € · rezumatul → 3 mașini → microbuz', async ({ page }, info) => {
  await principalEdrive(page, info, true);
  await expect(rezumat(page)).toHaveText(['2 autoturisme', 'ale firmei de 1 an', '~25.000 €', 'UE']);
  await expect(page.getByRole('button', { name: 'Trimite-ne analiza' })).toBeVisible();
  await expect(page.getByTestId('rezultat')).toContainText('Primești până la 50.000 €.');
  await captura(page, info, 'edrive-R', { desktop: true });
  await captura(page, info, 'edrive-R-intreg', { intreaga: true });

  // Rezumatul: „2 autoturisme” (comasată) → E3: 3 → E4 (felul, preselectat) → direct la rezultat, cu 75.000 €
  await page.getByRole('button', { name: 'Schimbă: 2 autoturisme' }).click();
  await ecran(page, 'nrMasini');
  await expect(scena(page).locator('output')).toHaveAttribute('data-valoare', '2');
  await plus(page, 1);
  await expect(cifra(page)).toHaveAttribute('data-valoare', '75000'); // la fiecare apăsare
  await continua(page).click();
  await ecran(page, 'tipMasini');
  await expect(scena(page).getByRole('radio', { name: 'Autoturisme' })).toHaveAttribute('aria-checked', 'true');
  await continua(page).click();
  await ecran(page, 'rezultat');
  await expect(cifra(page)).toHaveAttribute('aria-label', 'Primești 75.000 €');

  // „3 autoturisme” → E3 → E4: Amândouă, 1 microbuz → glisorul microbuzului → rezultat
  await page.getByRole('button', { name: 'Schimbă: 3 autoturisme' }).click();
  await ecran(page, 'nrMasini');
  await continua(page).click();
  await ecran(page, 'tipMasini');
  await expect(scena(page).getByRole('radio', { name: 'Autoturisme' })).toHaveAttribute('aria-checked', 'true');
  await scena(page).getByRole('radio', { name: 'Amândouă' }).click();
  await expect(scena(page).getByText('Câte sunt microbuze?')).toBeVisible();
  await captura(page, info, 'edrive-E4-amandoua');
  await continua(page).click();
  await ecran(page, 'pret');
  await expect(scena(page).getByRole('slider', { name: 'Autoturism' })).toHaveAttribute('aria-valuetext', nb('25.000 €'));
  await expect(scena(page).getByRole('slider', { name: 'Microbuz' })).toHaveAttribute('aria-valuetext', nb('45.000 €'));
  await forma(page, info);
  await captura(page, info, 'edrive-E6-doua', { desktop: true });
  await continua(page).click();
  await ecran(page, 'rezultat');
  await expect(cifra(page)).toHaveAttribute('aria-label', 'Primești 95.000 €');
  await expect(rezumat(page)).toContainText(['3 mașini', '2 autoturisme și 1 microbuz']);

  // Trimite-ne analiza (foaia din v1)
  await page.getByRole('button', { name: 'Trimite-ne analiza' }).click();
  const foaie = page.getByRole('dialog', { name: 'Trimite-ne analiza' });
  await foaie.getByLabel('Numele').fill('Ion Popescu');
  await foaie.getByLabel('Telefonul').fill('0722 123 456');
  await foaie.getByRole('button', { name: 'Trimite', exact: true }).click();
  await expect(page.getByTestId('rezultat')).toContainText('Am primit analiza ta. Te sunăm noi.');
  await expect(page.getByTestId('drum').locator('li').nth(1)).toHaveAttribute('data-stare', 'facut');
});

test('e-DRIVE · mixt (CUI 2): finanțarea din motor; „Aplică” UE → +20 de puncte', async ({ page }, info) => {
  await cauta(page, '2', EDRIVE);
  await ecran(page, 'firma');
  await buton(page, 'Da').click();
  await ecran(page, 'nrMasini');
  await plus(page, 2);
  await continua(page).click();
  await ecran(page, 'tipMasini');
  await scena(page).getByRole('radio', { name: 'Amândouă' }).click();
  await continua(page).click();
  await ecran(page, 'vechi');
  await expect(cifra(page)).toHaveAttribute('data-cifra', 'puncte'); // cu microbuze, cifra rămâne punctele
  await buton(page, 'Da').click();
  await ecran(page, 'pret');
  await expect(scena(page).getByRole('slider', { name: 'Autoturism' })).toHaveAttribute('aria-valuetext', nb('30.000 €'));
  await expect(scena(page).getByRole('slider', { name: 'Microbuz' })).toHaveAttribute('aria-valuetext', nb('45.000 €'));
  await continua(page).click();
  await ecran(page, 'ue');
  await buton(page, 'Nu').click();
  await ecran(page, 'rezultat');

  // aceleași răspunsuri, direct prin motor
  const c = contextDin({
    cui: '2', firma: 'da', nrMasini: '3', tipMasini: 'mixt', nrMicrobuze: '1', vechi: 'da',
    pret_0: '30000', pret_1: 'aceeasi', pret_2: '45000', ue_0: 'nu', ue_1: 'nu', ue_2: 'nu',
  }, { '2': FIRME_DEMO['2'].raspuns });
  await expect(cifra(page)).toHaveAttribute('data-valoare', String(c.rezultat.ajutor));
  await expect(rand(page)).toHaveText(`${c.rezultat.total}/100 puncte`);
  await expect(soapta(page)).toContainText('Cu modele asamblate în UE');
  await captura(page, info, 'edrive-R-soapta');
  await soapta(page).getByRole('button', { name: 'Aplică' }).click();
  await expect(rand(page)).toContainText(`${c.rezultat.total + 20}/100 puncte`);
  await expect(soapta(page)).toHaveCount(0);
});

test('e-DRIVE · plafonul: autoturismul la 40.000 € → 30.000 € finanțare și șoapta', async ({ page }, info) => {
  await cauta(page, '1', EDRIVE);
  await ecran(page, 'firma');
  await buton(page, 'Da').click();
  await ecran(page, 'nrMasini');
  await continua(page).click();
  await ecran(page, 'tipMasini');
  await expect(scena(page).getByRole('heading', { name: 'Ce fel de mașină e?' })).toBeVisible();
  await scena(page).getByRole('radio', { name: 'Autoturism' }).click();
  await continua(page).click();
  await buton(page, 'Da').click();
  await ecran(page, 'pret');
  await scena(page).getByRole('slider').focus();
  await page.keyboard.press('PageUp');
  await page.keyboard.press('PageUp');
  await expect(scena(page).getByRole('slider')).toHaveAttribute('aria-valuetext', nb('40.000 €'));
  await expect(soapta(page)).toContainText('Peste 30.000 € pe autoturism, diferența o plătește firma.');
  await expect(cifra(page)).toHaveAttribute('data-valoare', '30000');
  await captura(page, info, 'edrive-E6-plafon');
  await continua(page).click();
  await buton(page, 'Nu știu').click();
  await ecran(page, 'rezultat');
  await expect(cifra(page)).toHaveAttribute('aria-label', 'Primești 30.000 €');
});

test('e-DRIVE · tap pe valoarea glisorului → câmp numeric', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'o dată e destul');
  await cauta(page, '1', EDRIVE);
  await buton(page, 'Da').click();
  await ecran(page, 'nrMasini');
  await continua(page).click();
  await scena(page).getByRole('radio', { name: 'Autoturism' }).click();
  await continua(page).click();
  await buton(page, 'Da').click();
  await ecran(page, 'pret');
  await scena(page).getByRole('button', { name: /Scrie suma exactă/ }).click();
  const camp = scena(page).locator('input');
  await expect(camp).toBeFocused();
  await camp.fill('28.750');
  await camp.press('Enter');
  await expect(scena(page).getByRole('slider')).toHaveAttribute('aria-valuetext', nb('28.750 €'));
  await expect(cifra(page)).toHaveAttribute('data-valoare', '28750');
});

test('e-DRIVE · opririle în card: PFA (CUI 5); fără mașină de înlocuit (X2)', async ({ page }, info) => {
  await cauta(page, '5', EDRIVE);
  await ecran(page, 'firma');
  await buton(page, 'Da').click();
  await ecran(page, 'oprireFirma');
  await expect(card(page).locator('[data-oprire]')).toHaveText('Din păcate, firma nu poate aplica la e-DRIVE.');
  await expect(card(page)).toContainText('PFA-urile și întreprinderile individuale sau familiale nu pot aplica');
  await expect(cifra(page)).toHaveCount(0);
  await expect(scena(page).getByRole('link', { name: /Sună-ne/ })).toHaveAttribute('href', 'tel:+40749589848');
  await captura(page, info, 'edrive-X1');
  await buton(page, 'Încearcă alt CUI').click();
  await ecran(page, 'cui');
  await expect(page.getByLabel('CUI-ul firmei')).toHaveValue('');

  await cauta(page, '1', EDRIVE);
  await buton(page, 'Da').click();
  await ecran(page, 'nrMasini');
  await continua(page).click();
  await scena(page).getByRole('radio', { name: 'Autoturism' }).click();
  await continua(page).click();
  await ecran(page, 'vechi');
  await buton(page, 'Nu').click();
  await ecran(page, 'promisiune');
  await expect(scena(page)).toContainText('promisiune notarială');
  await captura(page, info, 'edrive-E5-promisiune');
  await buton(page, 'Nu').click();
  await ecran(page, 'oprireVechi');
  await expect(card(page).locator('[data-oprire]')).toHaveText('Fără o mașină de înlocuit nu se poate aplica.');
  await captura(page, info, 'edrive-X2');
  await buton(page, 'Schimbă răspunsul').click();
  await ecran(page, 'vechi');
});

test('e-DRIVE · navigarea: Înapoi și Back-ul browserului, cu răspunsul preselectat', async ({ page }) => {
  await cauta(page, '1', EDRIVE);
  await buton(page, 'Da').click();
  await ecran(page, 'nrMasini');
  await plus(page, 1);
  await continua(page).click();
  await scena(page).getByRole('radio', { name: 'Autoturisme' }).click();
  await continua(page).click();
  await buton(page, 'Da').click();
  await ecran(page, 'pret');
  await scena(page).getByRole('button', { name: '← Înapoi' }).click();
  await ecran(page, 'vechi');
  await expect(buton(page, 'Da')).toHaveAttribute('aria-pressed', 'true');
  await page.goBack();
  await ecran(page, 'tipMasini');
  await expect(scena(page).getByRole('radio', { name: 'Autoturisme' })).toHaveAttribute('aria-checked', 'true');
  await page.goBack();
  await ecran(page, 'nrMasini');
  await expect(scena(page).locator('output')).toHaveAttribute('data-valoare', '2');
});

test('e-DRIVE · prefers-reduced-motion: parcursul complet', async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await principalEdrive(page, info);
  // cifrele apar direct
  await expect(cifra(page).locator('p').last()).toHaveText(/50\.000/);
});

/** SME: scrie o sumă exactă în glisor (tap pe valoare → câmp). */
async function suma(page: Page, nume: string, valoare: string) {
  await scena(page).getByRole('button', { name: new RegExp(`^${nume}:`) }).click();
  const camp = scena(page).locator('input');
  await camp.fill(valoare);
  await camp.press('Enter');
}

async function pornesteSme(page: Page, info: TestInfo, cui: string, capturi = false) {
  await cauta(page, cui, SME);
  await expect(page.getByRole('status')).toContainText('Caut firma și bilanțurile la ANAF…');
  await ecran(page, 'firma');
  await forma(page, info);
  if (capturi) await captura(page, info, 'sme-E2', { desktop: true });
  await buton(page, 'Da').click();
}

test('SME · parcursul principal (CUI 21): glisoarele la pornire → R-ok 267.240 lei, verde 64%', async ({ page }, info) => {
  await page.goto(SME);
  await captura(page, info, 'sme-E1');
  await pornesteSme(page, info, '21', true);
  await ecran(page, 'cumperi');
  await expect(card(page)).toContainText('Înființată în 2015 · CA 2024: 1.200.000 lei');
  await expect(cifra(page)).toHaveAttribute('aria-label', '267.240 lei');
  await expect(rand(page)).toHaveText('grant de până la · 40% din proiect');
  await expect(soapta(page)).toContainText('Cel puțin 40% din proiect trebuie să fie echipamente verzi.');
  await forma(page, info);
  await expect(continua(page)).toBeDisabled();
  await captura(page, info, 'sme-E3');
  await scena(page).getByRole('button', { name: /^Echipamente verzi/ }).click();
  await expect(soapta(page)).toHaveCount(0);
  await scena(page).getByRole('button', { name: /^Alte echipamente/ }).click();
  await continua(page).click();

  await ecran(page, 'sume');
  await expect(page.locator('[data-verde]')).toHaveText('Verde: 64%');
  await expect(rand(page)).toHaveText('grant · proiect de 700.000 lei');
  await forma(page, info);
  await captura(page, info, 'sme-E4', { desktop: true });
  await continua(page).click();

  await ecran(page, 'rezultat');
  await expect(cifra(page)).toHaveAttribute('aria-label', '267.240 lei');
  await expect(page.locator('[data-verde]')).toHaveText('Verde: 64%');
  const r = page.getByTestId('rezultat');
  await expect(r).toHaveAttribute('data-varianta', 'ok');
  await expect(r).toContainText('Primești un grant de 267.240 lei.');
  await expect(r).toContainText('Restul, 432.760 lei, e un credit bancar.');
  await expect(r).toContainText('Tu plătești TVA-ul, cam 147.000 lei.');
  await expect(rezumat(page)).toHaveText(['verzi, alte echipamente', 'verzi 450.000', 'alte 250.000 lei']);
  await captura(page, info, 'sme-R', { desktop: true });
  await captura(page, info, 'sme-R-intreg', { intreaga: true });
});

test('SME · proiect sub minim: cifra gri, Continuă nu avansează, „Aplică” → 303.100 → R-ok', async ({ page }, info) => {
  await pornesteSme(page, info, '21');
  await ecran(page, 'cumperi');
  for (const a of ['Echipamente verzi', 'Alte echipamente', 'Software']) await scena(page).getByRole('button', { name: new RegExp(`^${a}`) }).click();
  await continua(page).click();
  await ecran(page, 'sume');
  await suma(page, 'Echipamente verzi', '300.000');
  await suma(page, 'Alte echipamente', '350.000');
  await suma(page, 'Software', '20.000');
  await expect(cifra(page)).toHaveAttribute('data-gri', 'true');
  await expect(page.locator('[data-indicator-sub]')).toHaveText('Proiect: 665.000 lei · minim 668.100 lei');
  await expect(soapta(page)).toContainText('Cu echipamente verzi de 303.100 lei, proiectul se încadrează.');
  await continua(page).click();
  await page.waitForTimeout(600);
  await ecran(page, 'sume'); // nu avansează
  await expect(soapta(page).locator('[data-evidentiat]')).toHaveCount(1);
  await forma(page, info);
  await captura(page, info, 'sme-E4-proiect', { desktop: true });
  await soapta(page).getByRole('button', { name: 'Aplică' }).click();
  await expect(scena(page).getByRole('slider', { name: 'Echipamente verzi' })).toHaveAttribute('aria-valuetext', nb('303.100 lei'));
  await expect(cifra(page)).not.toHaveAttribute('data-gri', 'true');
  await expect(cifra(page)).toHaveAttribute('aria-label', '267.240 lei');
  await expect(soapta(page)).toContainText('Software-ul se decontează până la 15.000 lei.');
  await captura(page, info, 'sme-E4-aplicat');
  await continua(page).click();
  await ecran(page, 'rezultat');
  await expect(page.getByTestId('rezultat')).toHaveAttribute('data-varianta', 'ok');
});

test('SME · opririle: CUI 23 în card; CUI 26 → întrebarea F5', async ({ page }, info) => {
  await pornesteSme(page, info, '23');
  await expect(card(page).locator('[data-oprire]')).toHaveText('Din păcate, firma nu poate aplica la SME Eco-Tech.');
  await expect(card(page)).toContainText('înființată cel târziu pe 31 decembrie 2021');
  await captura(page, info, 'sme-X1');

  await page.goto(SME);
  await pornesteSme(page, info, '26');
  await ecran(page, 'ca24');
  await expect(scena(page).getByRole('heading', { name: 'A avut firma vânzări în 2024?' })).toBeVisible();
  await expect(soapta(page)).toContainText('Nu găsesc bilanțul pe 2024 la ANAF.');
  await forma(page, info);
  await captura(page, info, 'sme-F5');
  await buton(page, 'Da').click();
  await ecran(page, 'cumperi');
  await expect(card(page)).toContainText('estimat din ce ne-ai spus');
});

test('e-DRIVE · desktop și telefoanele: fără derulare orizontală pe rezultat', async ({ page }, info) => {
  test.skip(telefon(info) && info.project.name === 'telefon', 'acoperit de parcursul principal');
  await principalEdrive(page, info);
  const [sw, iw] = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
  expect(sw).toBeLessThanOrEqual(iw);
});

// ——— T08: scorul /100, „de ce”, „Primești până la”, UE sub „Da”, rezumatul ca pastile ———

/** Până la E3, după firmă (CUI 1). */
async function laMasini(page: Page) {
  await cauta(page, '1', EDRIVE);
  await ecran(page, 'firma');
  await buton(page, 'Da').click();
  await ecran(page, 'nrMasini');
}

test('e-DRIVE · T08: cu microbuze, cifra rămâne scorul (cu „de ce”) până la preț', async ({ page }) => {
  await laMasini(page);
  await plus(page, 1);
  await continua(page).click();
  await ecran(page, 'tipMasini');
  await scena(page).getByRole('radio', { name: 'Amândouă' }).click();
  await expect(cifra(page)).toHaveAttribute('data-cifra', 'puncte');
  await continua(page).click();
  await ecran(page, 'vechi');
  await expect(cifra(page)).toHaveAttribute('aria-label', '80 din 100 de puncte');
  await expect(deCe(page)).toHaveText('Pornești cu 80 de puncte, pentru că ești microîntreprindere.');
  await expect(rezumat(page)).toHaveText(['2 mașini', '1 autoturism și 1 microbuz']);
  await buton(page, 'Da').click();
  await ecran(page, 'pret');
  await expect(cifra(page)).toHaveAttribute('data-cifra', 'puncte');
  // prima atingere a glisorului: banii trec în față, scorul în rând, „de ce”-ul pleacă
  await scena(page).getByRole('slider', { name: 'Autoturism' }).focus();
  await page.keyboard.press('ArrowLeft');
  await expect(cifra(page)).toHaveAttribute('data-cifra', 'euro');
  await expect(cifra(page).locator('[data-prefix]')).toHaveText('Primești');
  await expect(rand(page)).toHaveText('80/100 puncte');
  await expect(deCe(page)).toHaveCount(0);
});

test('e-DRIVE · T08: rezumatul „Răspunsurile tale”: pastila nouă se aprinde, apoi se stinge; comasarea', async ({ page }) => {
  await laMasini(page);
  await expect(page.locator('[data-pastile]')).toHaveCount(0);
  await plus(page, 1);
  await continua(page).click();
  await ecran(page, 'tipMasini');
  const pastile = page.locator('[data-pastile]');
  await expect(pastile).toContainText('Răspunsurile tale');
  const prima = rezumat(page).first();
  await expect(prima).toHaveAccessibleName('Schimbă: 2 mașini');
  await expect(prima).toHaveAttribute('data-nou', 'true');
  await expect(prima).not.toHaveAttribute('data-nou', 'true', { timeout: 2500 });
  // ținta de atingere ≥ 36px
  expect((await prima.boundingBox())!.height).toBeGreaterThanOrEqual(36);

  // E4 → „2 autoturisme”: aceeași pastilă, textul se schimbă (fără una nouă)
  await scena(page).getByRole('radio', { name: 'Autoturisme' }).click();
  await continua(page).click();
  await ecran(page, 'vechi');
  await expect(rezumat(page)).toHaveText(['2 autoturisme']);
  await expect(rezumat(page).first()).toHaveAttribute('data-nou', 'true');
  await expect(page.locator('[data-fantoma]')).toHaveCount(0);
  await expect(rezumat(page).first()).not.toHaveAttribute('data-nou', 'true', { timeout: 2500 });

  // o pastilă nouă: răspunsul zboară (fantoma), apoi pastila se aprinde
  await buton(page, 'Da').click();
  await ecran(page, 'pret');
  await expect(rezumat(page)).toHaveText(['2 autoturisme', 'ale firmei de 1 an']);
  await expect(rezumat(page).last()).toHaveAttribute('data-nou', 'true');
  await expect(page.locator('[data-fantoma]')).toHaveCount(0);
  await expect(rezumat(page).last()).not.toHaveAttribute('data-nou', 'true', { timeout: 2500 });
});

test('e-DRIVE · T08: E7 · „Da” are rândul auriu și e citit ca „Da”', async ({ page }) => {
  await laMasini(page);
  await continua(page).click();
  await scena(page).getByRole('radio', { name: 'Autoturism' }).click();
  await continua(page).click();
  await buton(page, 'Da').click();
  await ecran(page, 'pret');
  await continua(page).click();
  await ecran(page, 'ue');
  const da = buton(page, 'Da');
  await expect(da.locator('[data-castig]')).toHaveText('✦ Primești 20 de puncte în plus');
  await expect(da.locator('[data-castig] strong')).toHaveText('20 de puncte');
  await expect(buton(page, 'Nu').locator('[data-castig]')).toHaveCount(0);
  await expect(page.locator('[data-soapta]')).toHaveCount(0);
  await da.click();
  await ecran(page, 'rezultat');
  await expect(rand(page)).toContainText('100/100 puncte');
});

test('e-DRIVE · T08: 10 autoturisme → „Primești până la 300.000 €”, nimic nu iese din card', async ({ page }) => {
  await laMasini(page);
  await plus(page, 9);
  await continua(page).click();
  await ecran(page, 'tipMasini');
  await scena(page).getByRole('radio', { name: 'Autoturisme' }).click();
  await expect(cifra(page)).toHaveAttribute('aria-label', 'Primești până la 300.000 €');
  await page.waitForTimeout(800);
  const c = (await card(page).boundingBox())!;
  for (const el of [cifra(page).locator('p').last(), cifra(page).locator('[data-prefix]'), rand(page)]) {
    const b = (await el.boundingBox())!;
    expect(b.x).toBeGreaterThanOrEqual(c.x);
    expect(b.x + b.width, 'în card').toBeLessThanOrEqual(c.x + c.width);
  }
  const p = (await cifra(page).locator('p').last().boundingBox())!;
  expect(p.height, 'cifra pe un singur rând').toBeLessThan(90);
  const [sw, iw] = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
  expect(sw).toBeLessThanOrEqual(iw);
});
