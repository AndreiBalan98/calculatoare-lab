import { expect, test, type Page } from '@playwright/test';

// Cu CAPTURI=1, salvează capturile pentru raport în docs/capturi/T01/.
const captura = async (page: Page, nume: string, proiect: string) => {
  if (process.env.CAPTURI === '1') {
    await page.screenshot({ path: `docs/capturi/T01/${nume}-${proiect}.png`, fullPage: true });
  }
};

async function cauta(page: Page, cui: string) {
  await page.goto('/e-drive');
  await page.getByLabel('CUI-ul firmei').fill(cui);
  await page.getByRole('button', { name: 'Caută' }).click();
}

test('pagina de start duce la e-DRIVE', async ({ page }, info) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Laboratorul de calculatoare' })).toBeVisible();
  await captura(page, 'start', info.project.name);
  await page.getByRole('link', { name: /e-DRIVE/ }).click();
  await expect(page).toHaveURL(/\/e-drive$/);
});

test('CUI demo micro → 80 de puncte', async ({ page }, info) => {
  await cauta(page, 'RO 1');
  await expect(page.getByText('Caut firma la ANAF…')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'DEMO MICRO SRL' })).toBeVisible();
  await expect(page.getByTestId('puncte')).toHaveText('80');
  await expect(page.getByText('Microîntreprindere')).toBeVisible();
  await captura(page, 'edrive-micro', info.project.name);
});

test('CUI demo PFA → oprire', async ({ page }, info) => {
  await cauta(page, '5');
  await expect(page.getByTestId('oprire')).toContainText('PFA-urile și întreprinderile individuale sau familiale nu pot aplica');
  await expect(page.getByTestId('puncte')).toHaveCount(0);
  await captura(page, 'edrive-pfa', info.project.name);
});

test('CUI demo cu datorii mari → avertisment, dar tot 80 de puncte', async ({ page }, info) => {
  await cauta(page, '12');
  await expect(page.getByTestId('puncte')).toHaveText('80');
  await expect(page.getByText(/scrisoare de bonitate/)).toBeVisible();
  await captura(page, 'edrive-avertisment', info.project.name);
});

test('CUI necunoscut în modul simulat → negăsit', async ({ page }) => {
  await cauta(page, '12345678');
  await expect(page.getByText('Nu am găsit nicio firmă cu acest CUI.')).toBeVisible();
});
