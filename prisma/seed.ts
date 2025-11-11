import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing default templates (if re-seeding)
  console.log('Clearing existing default templates...');
  await prisma.reportTemplate.deleteMany({
    where: { isDefault: true },
  });

  // Default Templates
  const defaultTemplates = [
    {
      id: 'template-investor-update',
      workspaceId: 'default',
      name: 'Investor Update',
      description: 'Growth-focused quarterly report for investors and shareholders',
      type: 'investor-update',
      isDefault: true,
      filters: {
        dateRange: {
          type: 'quarterly',
        },
        entities: [],
        currency: 'USD',
      },
      sections: {
        kpis: true,
        revenueChart: true,
        expensesChart: false,
        profitMarginChart: true,
        expensesTable: true,
        balanceTable: false,
        aiSummary: true,
      },
      branding: {
        logoUrl: '/logo.svg',
        primaryColor: '#FFC700',
        footerText: 'Confidential – For Investors Only',
      },
    },
    {
      id: 'template-internal-summary',
      workspaceId: 'default',
      name: 'Internal Performance Summary',
      description: 'Detailed monthly report for internal finance team',
      type: 'internal-summary',
      isDefault: true,
      filters: {
        dateRange: {
          type: 'monthly',
        },
        entities: [],
        currency: 'USD',
      },
      sections: {
        kpis: true,
        revenueChart: true,
        expensesChart: true,
        profitMarginChart: true,
        expensesTable: true,
        balanceTable: true,
        aiSummary: true,
      },
      branding: {
        logoUrl: '/logo.svg',
        primaryColor: '#FFC700',
        footerText: 'Internal Use Only – Do Not Distribute',
      },
    },
    {
      id: 'template-bank-compliance',
      workspaceId: 'default',
      name: 'Bank & Compliance Report',
      description: 'Conservative quarterly report for banks and compliance officers',
      type: 'bank-compliance',
      isDefault: true,
      filters: {
        dateRange: {
          type: 'quarterly',
        },
        entities: [],
        currency: 'USD',
      },
      sections: {
        kpis: true,
        revenueChart: false,
        expensesChart: false,
        profitMarginChart: false,
        expensesTable: true,
        balanceTable: true,
        aiSummary: false,
      },
      branding: {
        logoUrl: '/logo.svg',
        primaryColor: '#FFC700',
        footerText: 'Prepared for Compliance Review',
      },
    },
  ];

  console.log('Creating default templates...');
  for (const template of defaultTemplates) {
    const created = await prisma.reportTemplate.create({
      data: template,
    });
    console.log(`✅ Created: ${created.name}`);
  }

  console.log('\n📊 Seed Summary:');
  const templateCount = await prisma.reportTemplate.count();
  console.log(`Total templates: ${templateCount}`);

  console.log('\n✅ Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
