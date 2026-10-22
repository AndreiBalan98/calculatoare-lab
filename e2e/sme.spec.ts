import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { alege, captura, cauta, ecran, forma, progres, randRezultat, scena } from './ajutor';

// SME Eco-Tech (tasks/T06 §6). Capturile: CAPTURI=1 CAPTURI_DIR=T06 npm run test:e2e -- e2e/sme.spec.ts

const SME = '/sme-eco-tech';
const comutator = (page: Page, nume: string) => scena(page).getByRole('button', { name: new RegExp(`^${nume}`) });
const continua = (page: Page) => scena(page).getByRole('button', { name: 'Continuă', exact: true });
const rezultat = (page: Page) => page.getByTestId('rezultat');

/** C1: bifează alegerile (ecranul nu pleacă singur), apoi „Continuă”. */
async function cumpara(page: Page, info: TestInfo, alegeri: string[]) {
  await ecran(page, 'cumperi');
  await forma(page, info);
  await expect(continua(page)).toBeDisabled();
  for (const a of alegeri) {
    await comutator(page, a).click();
    await expect(comutator(page, a)).toHaveAttribute('aria-pressed', 'true');
  }
  await ecran(page, 'cumperi'); // fără avans automat
  await expect(continua(page)).toBeEnabled();
  await continua(page).click();
  await expect(page.locator('[data-ecran="cumperi"]')).toHaveCount(0);
}

/** „Altă sumă” în loc, în același ecran. */
async function altaSuma(page: Page, info: TestInfo, cheie: string, suma: string, numeCaptura?: string) {
  await ecran(page, cheie);
  await forma(page, info);
  await scena(page).getByRole('button', { name: 'Altă sumă' }).click();
  const camp = scena(page).getByLabel('Altă sumă');
  await expect(camp).toBeFocused();
  await ecran(page, cheie);
  await camp.fill(suma);
  if (numeCaptura) await captura(page, info, numeCaptura);
  await scena(page).getByRole('button', { name: 'Gata' }).click();
  await expect(page.locator(`[data-ecran="${cheie}"]`)).toHaveCount(0);
}

test('pagina de start: al doilea card, SME Eco-Tech „Activ” → S0 cu banda programului', async ({ page }, info) => {
  await page.goto('/?v=1');
  const card = page.getByRole('link', { name: /SME Eco-Tech/ });
  await expect(card).toContainText('grant și credit pentru echipamente verzi');
  await expect(card.getByText('Activ', { exact: true })).toHaveCSS('background-color', 'rgb(30, 123, 79)');
  await expect(page.getByRole('link', { name: /e-DRIVE/ }).getByText('Anunțat', { exact: true })).toBeVisible();
  await captura(page, info, 'acasa');
  await card.click();
  await expect(page).toHaveURL(/\/sme-eco-tech$/);
  await ecran(page, 'cui');
  await expect(page.getByRole('heading', { name: 'Finanțare pentru IMM-uri: SME Eco-Tech, grant și credit' })).toBeVisible();
  await expect(page.locator('[data-banda-program]')).toContainText('Grant de 40% din investiție, până la 267.240 lei, plus un credit bancar pentru rest.');
  await expect(page.getByRole('heading', { name: 'Hai să vedem cât poate primi firma ta.' })).toBeVisible();
  await expect(progres(page)).toContainText('Ce cumperi');
  await expect(progres(page)).toContainText('Sumele');
  await forma(page, info);
  await captura(page, info, 'S0', { desktop: true });
});

test('CUI 21 · verzi ~450.000 + alte ~250.000 → R-ok 267.240 → trimite analiza', async ({ page }, info) => {
  await cauta(page, '21', SME);
  await ecran(page, 'cui:cautare');
  await expect(scena(page)).toContainText('Caut firma și bilanțurile la ANAF…');
  await captura(page, info, 'S1', { imediat: true });

  await ecran(page, 'firma');
  const card = scena(page).locator('[data-card-firma]');
  await expect(card).toContainText('DEMO VERDE MICRO SRL');
  await expect(card).toContainText('Microîntreprindere');
  await expect(card).toContainText('în 2015');
  await expect(card).toContainText('Cifra de afaceri 2024');
  await expect(card).toContainText('1.200.000 lei');
  await expect(randRezultat(page)).toHaveCount(0);
  await expect(page.locator('[data-banda-program]')).toHaveCount(0);
  await captura(page, info, 'S2', { desktop: true });
  await alege(page, info, 'firma', 'Da, e firma mea');

  await ecran(page, 'cumperi');
  await expect(scena(page)).toContainText('Firma ta se încadrează: e microîntreprindere, înființată în 2015.');
  await expect(randRezultat(page)).toContainText('Grant de 40%, până la 267.240 lei');
  await expect(scena(page).locator('[data-antrenor]')).toContainText('Cel puțin 40% din bani trebuie să meargă pe echipamente verzi.');
  await comutator(page, 'Echipamente verzi').click();
  await comutator(page, 'Alte echipamente').click();
  await captura(page, info, 'C1', { desktop: true });
  await comutator(page, 'Echipamente verzi').click();
  await comutator(page, 'Alte echipamente').click();
  await cumpara(page, info, ['Echipamente verzi', 'Alte echipamente']);

  await ecran(page, 'verde');
  await expect(scena(page)).toContainText('Echipamente verzi');
  await expect(scena(page)).toContainText('Prețurile din ofertele furnizorilor.');
  await captura(page, info, 'P1');
  await alege(page, info, 'verde', '~450.000 lei');
  await expect(randRezultat(page)).toContainText('Grant: 180.000 lei');

  await ecran(page, 'alte');
  await expect(scena(page)).toContainText('Grantul ajunge deja la 180.000 lei.');
  await expect(scena(page).locator('[data-antrenor]')).toContainText('Ca partea verde să rămână de cel puțin 40%, aici poți pune până la 675.000 lei.');
  await captura(page, info, 'P2');
  await alege(page, info, 'alte', '~250.000 lei');

  await ecran(page, 'rezultat');
  await forma(page, info, { intrebare: false });
  const r = rezultat(page);
  await expect(r).toHaveAttribute('data-varianta', 'ok');
  await expect(r).toContainText('267.240');
  await expect(r).toContainText('lei grant');
  await expect(r).toContainText('Poți aplica.');
  await expect(r).toContainText('Primești un grant de 267.240 lei.');
  await expect(r).toContainText('Restul, 432.760 lei, e un credit bancar.');
  await expect(r).toContainText('Tu plătești TVA-ul, cam 147.000 lei.');
  await expect(r).toContainText('Partea verde: 64,2% din investiție (minimum 40%).');
  await expect(r).toContainText('primul venit, primul servit');
  await expect(r).toContainText('Mai verifică: firma nu are datorii la buget');
  await expect(randRezultat(page)).toContainText('Grant: 267.240 lei');
  await expect(randRezultat(page)).not.toContainText('puncte');
  await captura(page, info, 'R-ok', { desktop: true });
  await captura(page, info, 'R-ok-intreg', { intreaga: true });

  const drum = page.getByTestId('drum');
  await expect(drum).toContainText('Te înscriem online');
  await expect(drum.locator('li').nth(0)).toHaveAttribute('data-stare', 'facut');
  await expect(drum.locator('li').nth(1)).toHaveAttribute('data-stare', 'urmator');
  await page.getByRole('button', { name: 'Trimite-ne analiza' }).click();
  const foaie = page.getByRole('dialog', { name: 'Trimite-ne analiza' });
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

test('CUI 21 · proiectul mic → R-proiect (sfatul: verzi 303.100 lei) → „Aplică” → R-ok, fără ecran nou', async ({ page }, info) => {
  await cauta(page, '21', SME);
  await alege(page, info, 'firma', 'Da, e firma mea');
  await cumpara(page, info, ['Echipamente verzi', 'Alte echipamente', 'Software']);
  await alege(page, info, 'verde', '~300.000 lei');
  await altaSuma(page, info, 'alte', '350.000', 'P2-alta-suma');

  await ecran(page, 'soft');
  await expect(scena(page)).toContainText('Partea verde e 46,1%. E în regulă.');
  await expect(scena(page)).toContainText('Se decontează cel mult 15.000 lei.');
  await captura(page, info, 'P3');
  await altaSuma(page, info, 'soft', '20.000');

  await ecran(page, 'rezultat');
  const r = rezultat(page);
  await expect(r).toHaveAttribute('data-varianta', 'proiect');
  await expect(r).toContainText('Firma se încadrează. Proiectul, încă nu.');
  await expect(r.locator('[data-probleme]')).toContainText('Investiția eligibilă e de 665.000 lei. Minimul programului e 668.100 lei.');
  const antrenor = page.getByTestId('antrenor-rezultat');
  await expect(antrenor).toContainText('Cu echipamente verzi de 303.100 lei (cu 3.100 lei mai mult), proiectul se încadrează.');
  await expect(page.getByRole('button', { name: 'Trimite-ne analiza' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: /Sună-ne/ })).toBeVisible();
  await expect(page.getByTestId('drum')).toHaveCount(0);
  await expect(r).toContainText('← Schimbă sumele');
  await captura(page, info, 'R-proiect');

  // un singur ecran de la început până la sfârșit: urmărim dacă scena se schimbă
  await page.evaluate(() => {
    const w = window as unknown as { scenaVeche: Element | null };
    w.scenaVeche = document.querySelector('[data-ecran]');
  });
  await antrenor.getByRole('button', { name: 'Aplică' }).click();
  await expect(r).toHaveAttribute('data-varianta', 'ok');
  await expect(r).toContainText('Primești un grant de 267.240 lei.');
  await expect(r).toContainText('și software-ul peste 15.000 lei, 5.000 lei');
  await expect(page.getByTestId('antrenor-rezultat')).toHaveCount(0);
  await expect(randRezultat(page)).toContainText('Grant: 267.240 lei');
  await expect(page.getByRole('button', { name: 'Trimite-ne analiza' })).toBeVisible();
  await ecran(page, 'rezultat');
  expect(await page.evaluate(() => (window as unknown as { scenaVeche: Element | null }).scenaVeche === document.querySelector('[data-ecran]'))).toBe(true);
  await captura(page, info, 'R-dupa-aplica');
});

test('C1 doar „Alte echipamente” → P2 → R-proiect cu sfatul → „Aplică” → R-ok', async ({ page }, info) => {
  await cauta(page, '21', SME);
  await alege(page, info, 'firma', 'Da, e firma mea');
  await cumpara(page, info, ['Alte echipamente']);
  await ecran(page, 'alte');
  await expect(scena(page).locator('[data-antrenor]')).toHaveCount(0);
  await alege(page, info, 'alte', '~400.000 lei');
  await ecran(page, 'rezultat');
  await expect(rezultat(page)).toHaveAttribute('data-varianta', 'proiect');
  await expect(rezultat(page)).toContainText('Echipamentele verzi sunt 0% din investiție. Minimul e 40%.');
  await page.getByTestId('antrenor-rezultat').getByRole('button', { name: 'Aplică' }).click();
  await expect(rezultat(page)).toHaveAttribute('data-varianta', 'ok');
  await expect(rezultat(page)).toContainText('Primești un grant de 267.240 lei.');
  await ecran(page, 'rezultat');
});

test('CUI 23 → X1 cu motivul motorului → „Încearcă alt CUI” → S0 gol; CUI 28 → X1', async ({ page }, info) => {
  await cauta(page, '23', SME);
  await alege(page, info, 'firma', 'Da, e firma mea');
  await ecran(page, 'oprireFirma');
  await forma(page, info, { intrebare: false });
  await expect(scena(page)).toContainText('Din păcate, firma nu poate aplica la SME Eco-Tech.');
  await expect(scena(page)).toContainText('Firma trebuie să fie înființată cel târziu pe 31 decembrie 2021.');
  await expect(scena(page).getByRole('link', { name: /Sună-ne/ })).toHaveAttribute('href', 'tel:+40749589848');
  await expect(randRezultat(page)).toHaveCount(0);
  await captura(page, info, 'X1');
  await scena(page).getByRole('button', { name: 'Încearcă alt CUI' }).click();
  await ecran(page, 'cui');
  await expect(page.getByLabel('CUI-ul firmei')).toHaveValue('');

  await cauta(page, '28', SME);
  await ecran(page, 'firma');
  await expect(scena(page)).toContainText('DEMO COOPERATIVA MEȘTEȘUGARILOR');
  await alege(page, info, 'firma', 'Da, e firma mea');
  await ecran(page, 'oprireFirma');
  await expect(scena(page)).toContainText('Pot aplica doar societățile (SRL, SA etc.), cu capital integral privat.');
});

test('CUI 26 (bilanțul 2024 lipsă) → F5 → Da → C1; CUI 27 → avertismentul în card', async ({ page }, info) => {
  await cauta(page, '26', SME);
  await alege(page, info, 'firma', 'Da, e firma mea');
  await ecran(page, 'ca24');
  await expect(scena(page)).toContainText('Nu găsesc bilanțul pe 2024 la ANAF. Îmi spui tu?');
  await expect(scena(page)).toContainText('Programul cere o cifră de afaceri mai mare decât zero în 2024.');
  await captura(page, info, 'F5');
  await alege(page, info, 'ca24', 'Da');
  await ecran(page, 'cumperi');
  await expect(scena(page)).toContainText('Firma ta se încadrează: e microîntreprindere, înființată în 2014.');

  await cauta(page, '27', SME);
  await ecran(page, 'firma');
  await expect(scena(page).locator('[data-card-firma]')).toContainText('ANAF declară firma inactivă fiscal.');
  await captura(page, info, 'S2-inactiva');
});

test('CUI negăsit → F1–F5 (doar ce lipsește) → C1; S3 → „Cifrele nu mai sunt la zi” → F2', async ({ page }, info) => {
  await cauta(page, '12345678', SME);
  await ecran(page, 'forma');
  await expect(scena(page)).toContainText('Nu găsesc datele firmei acum. Îmi spui tu câteva lucruri.');
  await expect(scena(page)).toContainText('asociație, cooperativă etc.');
  await captura(page, info, 'F1');
  await alege(page, info, 'forma', 'SRL sau SA');
  await captura(page, info, 'F2');
  await alege(page, info, 'angajati', '0–9');
  await captura(page, info, 'F3');
  await alege(page, info, 'cifra', 'sub 10 mil. lei');
  await ecran(page, 'infiintata');
  await expect(scena(page)).toContainText('Când a fost înființată firma?');
  await captura(page, info, 'F4');
  await alege(page, info, 'infiintata', 'Până în 2021 inclusiv');
  await alege(page, info, 'ca24', 'Da');
  await ecran(page, 'cumperi');
  await expect(scena(page)).toContainText('Firma ta se încadrează: e microîntreprindere.');

  await cauta(page, '21', SME);
  await alege(page, info, 'firma', 'Nu');
  await ecran(page, 'corectez');
  await captura(page, info, 'S3');
  await alege(page, info, 'corectez', 'Cifrele nu mai sunt la zi');
  await ecran(page, 'angajati');
  await expect(scena(page)).toContainText('La ANAF, în bilanțul pe 2025: 6 angajați.');
});

test('Înapoi și Back-ul browserului de pe P2 până la C1: alegerile și sumele preselectate', async ({ page }, info) => {
  await cauta(page, '21', SME);
  await alege(page, info, 'firma', 'Da, e firma mea');
  await cumpara(page, info, ['Echipamente verzi', 'Alte echipamente']);
  await alege(page, info, 'verde', '~450.000 lei');
  await ecran(page, 'alte');

  const inapoi = () => page.getByRole('button', { name: '← Înapoi' }).click();
  await inapoi();
  await ecran(page, 'verde');
  await expect(scena(page).getByRole('button', { name: '~450.000 lei' })).toHaveAttribute('aria-pressed', 'true');
  await inapoi();
  await ecran(page, 'cumperi');
  await expect(comutator(page, 'Echipamente verzi')).toHaveAttribute('aria-pressed', 'true');
  await expect(comutator(page, 'Alte echipamente')).toHaveAttribute('aria-pressed', 'true');
  await expect(comutator(page, 'Software')).toHaveAttribute('aria-pressed', 'false');
  await captura(page, info, 'C1-preselectat');

  // mergi înainte cu aceleași alegeri: suma rămâne
  await continua(page).click();
  await ecran(page, 'verde');
  await expect(scena(page).getByRole('button', { name: '~450.000 lei' })).toHaveAttribute('aria-pressed', 'true');
  await alege(page, info, 'verde', '~450.000 lei');
  await ecran(page, 'alte');

  // Back-ul browserului face același lucru ca „← Înapoi”
  await page.goBack();
  await ecran(page, 'verde');
  await expect(scena(page).getByRole('button', { name: '~450.000 lei' })).toHaveAttribute('aria-pressed', 'true');
  await page.goBack();
  await ecran(page, 'cumperi');
  await expect(comutator(page, 'Echipamente verzi')).toHaveAttribute('aria-pressed', 'true');
  await expect(comutator(page, 'Alte echipamente')).toHaveAttribute('aria-pressed', 'true');
  await expect(progres(page)).toBeInViewport();
});

test('e-DRIVE: rămâne pe /e-drive, cu banda „Anunțat” și punctele', async ({ page }, info) => {
  await cauta(page, '1');
  await alege(page, info, 'firma', 'Da, e firma mea');
  await expect(randRezultat(page)).toContainText('80 de puncte');
  await page.goto('/e-drive');
  await expect(page.locator('[data-banda-program]').getByText('Anunțat', { exact: true })).toHaveCSS('background-color', 'rgb(224, 168, 74)');
});
