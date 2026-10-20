import { expect, type Page, type TestInfo } from '@playwright/test';

export const telefon = (info: TestInfo) => info.project.name.startsWith('telefon');

/**
 * Cu CAPTURI=1, salvează captura ecranului în docs/capturi/T03/: pe telefon (390×844) mereu,
 * pe desktop doar pentru ecranele cerute (`desktop: true`).
 */
export async function captura(page: Page, info: TestInfo, nume: string, o: { desktop?: boolean; intreaga?: boolean; imediat?: boolean } = {}) {
  if (process.env.CAPTURI !== '1') return;
  if (info.project.name !== 'telefon' && !(o.desktop && info.project.name === 'desktop')) return;
  if (!o.imediat) await page.waitForTimeout(800); // să se termine mișcarea
  await page.screenshot({ path: `docs/capturi/T03/${nume}-${info.project.name}.png`, fullPage: !!o.intreaga });
}

export const scena = (page: Page) => page.locator('[data-ecran]');
export const progres = (page: Page) => page.locator('[data-progres]');

/** Așteaptă ecranul cu această cheie (exact unul în scenă). */
export async function ecran(page: Page, cheie: string) {
  await expect(scena(page)).toHaveCount(1);
  await expect(scena(page)).toHaveAttribute('data-ecran', cheie);
}

/**
 * Aserțiunile de formă (tasks/T03 §4): un singur ecran, o singură întrebare, progresul în
 * viewport, fără derulare pe telefon la ecranele de întrebare, fără elemente de chat.
 */
export async function forma(page: Page, info: TestInfo, o: { intrebare?: boolean } = { intrebare: true }) {
  await expect(scena(page)).toHaveCount(1);
  if (o.intrebare !== false) await expect(scena(page).locator('[data-intrebare]')).toHaveCount(1);
  await page.waitForTimeout(450); // intrările se termină, apoi măsurăm
  const cutie = await progres(page).boundingBox();
  const inaltime = await page.evaluate(() => innerHeight);
  expect(cutie, 'progresul există').not.toBeNull();
  expect(cutie!.y).toBeGreaterThanOrEqual(0);
  expect(cutie!.y + cutie!.height).toBeLessThanOrEqual(inaltime);
  if (telefon(info)) {
    expect(cutie!.height, 'progresul ≤ 64px pe telefon').toBeLessThanOrEqual(64);
    if (o.intrebare !== false) {
      const [sh, ih] = await page.evaluate(() => [document.documentElement.scrollHeight, innerHeight]);
      expect(sh, 'ecranul încape fără derulare').toBeLessThanOrEqual(ih + 4);
    }
  }
  // fără fir de chat: avatar, „scrie…”, pastile de răspuns
  await expect(page.getByText('DD', { exact: true })).toHaveCount(0);
  await expect(page.locator('[aria-label^="Schimbă răspunsul"]')).toHaveCount(0);
  await expect(page.getByText(/scrie…/)).toHaveCount(0);
}

/** Răspunde pe ecranul `cheie` cu butonul `optiune` și verifică că ecranul a plecat. */
export async function alege(page: Page, info: TestInfo, cheie: string, optiune: string) {
  await ecran(page, cheie);
  await forma(page, info);
  const intrebare = (await scena(page).locator('[data-intrebare]').innerText()).trim();
  await scena(page).getByRole('button', { name: optiune, exact: true }).click();
  await expect(page.locator(`[data-ecran="${cheie}"]`)).toHaveCount(0);
  // întrebarea anterioară nu mai e în pagină (dacă următoarea nu are același text)
  const acum = scena(page).locator('[data-intrebare]');
  if ((await acum.count()) && (await acum.innerText()).trim() !== intrebare) {
    await expect(page.getByText(intrebare, { exact: true })).toHaveCount(0);
  }
}

export async function cauta(page: Page, cui: string) {
  await page.goto('/e-drive');
  const camp = page.getByLabel('CUI-ul firmei');
  await expect(camp).toBeVisible();
  await camp.fill(cui);
  await page.getByRole('button', { name: 'Caută firma' }).click();
}

export const randRezultat = (page: Page) => page.locator('[data-rand-rezultat]');
