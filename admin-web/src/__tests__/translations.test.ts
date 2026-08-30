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
});
