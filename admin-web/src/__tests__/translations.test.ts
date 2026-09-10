import { translations } from '../i18n/translations';

describe('Bilingual i18n Translation Dictionary', () => {
  test('English and Tagalog have 100% key parity', () => {
    const enKeys = Object.keys(translations.en).sort();
    const tlKeys = Object.keys(translations.tl).sort();

    expect(enKeys).toEqual(tlKeys);
  });

  test('Critical cash balancing terms are properly translated', () => {
    expect(translations.en.cashBalancingTitle).toBe('End-of-Day Cash Balancing');
    expect(translations.tl.cashBalancingTitle).toBe('Pagsusuri ng Pera sa Cash Drawer');

    expect(translations.en.startingFloat).toContain('Starting Change');
    expect(translations.tl.startingFloat).toContain('Panimulang Panukli');

    expect(translations.en.todayCashSales).toContain('Today\'s Cash Sales');
    expect(translations.tl.todayCashSales).toContain('Benta sa Araw na \'To');

    expect(translations.en.statusBalanced).toContain('Balanced');
    expect(translations.tl.statusBalanced).toContain('Sakto');
  });

  test('Updated feature naming conventions and descriptions translate properly', () => {
    // English naming conventions
    expect(translations.en.branchesHub).toBe('Store Branches Hub');
    expect(translations.en.productCatalog).toBe('Master Product');
    expect(translations.en.centralizedSales).toBe('Centralized Sales');
    expect(translations.en.staffPayroll).toBe('Staff & Payroll');
    expect(translations.en.exportsReports).toBe('Exports & Reports');
    expect(translations.en.profileSettings).toBe('Profile & Settings');

    // Filipino / Tagalog naming conventions
    expect(translations.tl.branchesHub).toBe('Sentro ng mga Sangay');
    expect(translations.tl.productCatalog).toBe('Pangunahing Produkto');
    expect(translations.tl.centralizedSales).toBe('Sentralisadong Benta');
    expect(translations.tl.staffPayroll).toBe('Kawani at Pasahod');
    expect(translations.tl.exportsReports).toBe('Mga Ulat at Pag-export');
    expect(translations.tl.profileSettings).toBe('Profile at Mga Setting');

    // Feature descriptions exist and are populated
    expect(translations.en.branchesHubDesc.length).toBeGreaterThan(10);
    expect(translations.tl.branchesHubDesc.length).toBeGreaterThan(10);
    expect(translations.en.productCatalogDesc.length).toBeGreaterThan(10);
    expect(translations.tl.productCatalogDesc.length).toBeGreaterThan(10);
  });
});
