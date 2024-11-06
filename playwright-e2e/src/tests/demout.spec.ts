// tests/demoaut.spec.ts
import { test, expect, Page } from '@playwright/test';

// Tipos
interface ReservaInfo {
  localRetirada: string;
  dataRetirada: string;
  horaRetirada: string;
  dataDevolucao: string;
  horaDevolucao: string;
}

// Helpers
async function preencherFormularioReserva(page: Page, info: ReservaInfo) {
  await page.fill('input[name="pickup-location"]', info.localRetirada);
  await page.fill('input[name="pickup-date"]', info.dataRetirada);
  await page.selectOption('select[name="pickup-time"]', info.horaRetirada);
  await page.fill('input[name="return-date"]', info.dataDevolucao);
  await page.selectOption('select[name="return-time"]', info.horaDevolucao);
}

async function extrairPreco(element: HTMLElement): Promise<number> {
  const texto = element.textContent || '0';
  return parseFloat(texto.replace('R$', '').replace(',', '.')) || 0;
}

test.describe('DemoAut - Aluguel de Carros', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/caf/');
    // Aguarda carregamento inicial da página
    await page.waitForLoadState('networkidle');
  });

  // Cenário 1: Pesquisa de carros disponíveis
  test('deve pesquisar carros disponíveis para aluguel', async ({ page }) => {
    await test.step('Preencher formulário de pesquisa', async () => {
      await page.fill('input[placeholder="Pesquisar"]', 'Alugar Carro Localiza');
      await page.click('button.search-button');
      
      // Aguarda resultados
      await page.waitForSelector('.search-results');
      
      // Verifica se há resultados
      const resultados = await page.locator('.search-result-item').count();
      expect(resultados).toBeGreaterThan(0);
    });
    
    await test.step('Verificar detalhes dos resultados', async () => {
      // Verifica se os resultados contêm informações relevantes
      const primeiroResultado = page.locator('.search-result-item').first();
      await expect(primeiroResultado).toContainText('Localiza');
      await expect(primeiroResultado).toContainText('Aluguel');
    });
  });

  // Cenário 2: Filtros de busca
  test('deve filtrar resultados de busca', async ({ page }) => {
    // Realizar busca inicial
    await page.fill('input[placeholder="Pesquisar"]', 'Alugar Carro');
    await page.click('button.search-button');
    
    // Aplicar filtros
    await page.click('text=Filtros');
    await page.click('text=Preço');
    await page.click('text=Menor Preço');
    
    // Verificar se os resultados foram ordenados
    const precos = await page.$$eval('.price-value', (elements: HTMLElement[]) => 
      elements.map(el => {
        const texto = el.textContent?.replace('R$', '').replace(',', '.') || '0';
        return parseFloat(texto) || 0;
      })
    );
    
    // Verificar se está em ordem crescente
    const precosOrdenados = [...precos].sort((a, b) => a - b);
    expect(precos).toEqual(precosOrdenados);
  });

  // Cenário 3: Detalhes do veículo
  test('deve exibir detalhes do veículo selecionado', async ({ page }) => {
    // Buscar e selecionar primeiro veículo
    await page.fill('input[placeholder="Pesquisar"]', 'Alugar Carro');
    await page.click('button.search-button');
    await page.click('.search-result-item >> nth=0');
    
    // Verificar informações do veículo
    await expect(page.locator('.vehicle-details')).toBeVisible();
    await expect(page.locator('.vehicle-specs')).toBeVisible();
    await expect(page.locator('.rental-price')).toBeVisible();
    await expect(page.locator('.availability')).toBeVisible();
  });

  // Cenário 4: Processo de reserva
  test('deve iniciar processo de reserva', async ({ page }) => {
    // Buscar e selecionar veículo
    await page.fill('input[placeholder="Pesquisar"]', 'Alugar Carro Localiza');
    await page.click('button.search-button');
    await page.click('.search-result-item >> nth=0');
    
    // Clicar em reservar
    await page.click('button:has-text("Reservar")');
    
    // Verificar se está na página de reserva
    await expect(page).toHaveURL(/reserva/);
    
    // Verificar elementos do formulário de reserva
    await expect(page.locator('form.reservation-form')).toBeVisible();
    await expect(page.locator('input[name="pickup-location"]')).toBeVisible();
    await expect(page.locator('input[name="pickup-date"]')).toBeVisible();
  });

  // Cenário 5: Validação de formulário
  test('deve validar campos obrigatórios no formulário de reserva', async ({ page }) => {
    // Navegar para página de reserva
    await page.fill('input[placeholder="Pesquisar"]', 'Alugar Carro Localiza');
    await page.click('button.search-button');
    await page.click('.search-result-item >> nth=0');
    await page.click('button:has-text("Reservar")');
    
    // Tentar enviar formulário vazio
    await page.click('button[type="submit"]');
    
    // Verificar mensagens de erro
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('text=Campo obrigatório')).toHaveCount(5);
    
    // Preencher um campo e verificar se a mensagem some
    await page.fill('input[name="pickup-location"]', 'São Paulo - Aeroporto');
    await expect(page.locator('text=Campo obrigatório')).toHaveCount(4);
  });
});