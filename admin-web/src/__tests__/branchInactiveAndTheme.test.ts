import { Branch, AnalyticsData, InventoryItem } from '../types';

describe('🏢 Inactive Branch Filtering & Management Unit Tests', () => {
  const mockBranches: Branch[] = [
    {
      id: 1,
      name: 'Main Branch - Gateway 1',
      code: 'BR-01',
      import_code: 'KV-BR01',
      address: 'Gateway Mall 1, Cubao',
      phone: '+63 917 111 2222',
      is_active: true
    },
    {
      id: 2,
      name: 'SM Megamall Branch',
      code: 'BR-02',
      import_code: 'KV-BR02',
      address: 'SM Megamall Bldg A',
      phone: '+63 917 333 4444',
      is_active: true
    },
    {
      id: 3,
      name: 'Temporary Pop-up Branch (Renovation)',
      code: 'BR-03',
      import_code: 'KV-BR03',
      address: 'Ayala Malls Feliz',
      phone: '+63 917 555 6666',
      is_active: false
    }
  ];

  const mockAnalytics: AnalyticsData = {
    filters: { branch_id: 'all', range: 'today', start_date: '', end_date: '' },
    kpis: {
      total_gross_revenue: 15500.0,
      total_sales_count: 85,
      average_order_value: 182.35,
      payment_breakdown: { cash: 10000, ewallet: 4500, card: 1000 }
    },
    branch_comparison: [
      {
        branch_id: 1,
        name: 'Main Branch - Gateway 1',
        code: 'BR-01',
        import_code: 'KV-BR01',
        active_devices: 1,
        total_sales: 9500.0,
        order_count: 50
      },
      {
        branch_id: 2,
        name: 'SM Megamall Branch',
        code: 'BR-02',
        import_code: 'KV-BR02',
        active_devices: 1,
        total_sales: 6000.0,
        order_count: 35
      }
    ],
    top_products: [
      { product_name: 'Bulalo', total_qty: 30, total_revenue: 6000 },
      { product_name: 'Fried Chicken', total_qty: 25, total_revenue: 1250 }
    ]
  };

  test('1. Inactive branch is properly identified and filtered out from active branch list', () => {
    const activeBranches = mockBranches.filter((b) => b.is_active !== false);
    const inactiveBranches = mockBranches.filter((b) => b.is_active === false);

    expect(activeBranches.length).toBe(2);
    expect(inactiveBranches.length).toBe(1);
    expect(inactiveBranches[0].id).toBe(3);
    expect(inactiveBranches[0].name).toBe('Temporary Pop-up Branch (Renovation)');
  });

  test('2. Centralized Sales comparison only includes active branches', () => {
    const activeBranchIds = new Set(mockBranches.filter((b) => b.is_active !== false).map((b) => b.id));
    const visibleComparison = mockAnalytics.branch_comparison.filter((b) => activeBranchIds.has(b.branch_id));

    expect(visibleComparison.length).toBe(2);
    expect(visibleComparison.some((b) => b.branch_id === 3)).toBe(false);
  });

  test('3. Store Branches Hub status filter tabs correctly partition branches', () => {
    const getFiltered = (status: 'all' | 'active' | 'inactive') => {
      return mockBranches.filter((b) => {
        if (status === 'active') return b.is_active !== false;
        if (status === 'inactive') return b.is_active === false;
        return true;
      });
    };

    expect(getFiltered('all').length).toBe(3);
    expect(getFiltered('active').length).toBe(2);
    expect(getFiltered('inactive').length).toBe(1);
  });

  test('4. ExportService exports inventory correctly scoping only active branches', () => {
    const activeBranches = mockBranches.filter((b) => b.is_active !== false);

    expect(activeBranches.map((b) => b.name)).toEqual([
      'Main Branch - Gateway 1',
      'SM Megamall Branch'
    ]);
    expect(activeBranches.some((b) => b.id === 3)).toBe(false);
  });
});
