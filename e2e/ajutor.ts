import { expect, type Page, type TestInfo } from '@playwright/test';

/** Cu CAPTURI=1, salvează capturile pentru raport în docs/capturi/T02/. */
export async function captura(page: Page, info: TestInfo, nume: string, intreaga = false) {
  if (process.env.CAPTURI !== '1') return;
  await page.waitForTimeout(700); // să se termine mișcarea
  await page.screenshot({ path: `docs/capturi/T02/${nume}-${info.project.name}.png`, fullPage: intreaga });
}

/** Elementul conversației pentru un pas (ex. „nrM1”, „ue_0”). */
export const pas = (page: Page, cheie: string) => page.locator(`[data-cheie="${cheie}"]`);

/** Răspunde la o întrebare cu o opțiune (așteaptă să apară). */
export async function alege(page: Page, cheie: string, optiune: string) {
  const buton = pas(page, cheie).getByRole('button', { name: optiune, exact: true });
  await expect(buton).toBeVisible();
  await buton.click();
  // întrebarea devine răspuns (pastilă)
  await expect(pas(page, cheie).getByRole('button', { name: new RegExp(`^Schimbă răspunsul`) })).toBeVisible();
}

export async function cauta(page: Page, cui: string) {
  await page.goto('/e-drive');
  const camp = page.getByLabel('CUI-ul firmei');
  await expect(camp).toBeVisible();
  await camp.fill(cui);
  await page.getByRole('button', { name: 'Caută' }).click();
}

export const banda = (page: Page) => page.getByTestId('banda-scor');
