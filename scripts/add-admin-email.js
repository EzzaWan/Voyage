// Script to add an admin email to AdminSettings
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addAdminEmail(email) {
  try {
    // Get current settings
    let settings = await prisma.adminSettings.findUnique({
      where: { id: 'settings' },
    });

    if (!settings) {
      // Create default settings with the email
      settings = await prisma.adminSettings.create({
        data: {
          id: 'settings',
          mockMode: false,
          defaultMarkupPercent: 0,
          defaultCurrency: 'USD',
          adminEmails: [email.toLowerCase()],
          emailEnabled: true,
          updatedAt: new Date(),
        },
      });
      console.log(`✅ Created AdminSettings with email: ${email}`);
    } else {
      // Update existing settings
      const normalizedEmail = email.toLowerCase();
      const currentEmails = (settings.adminEmails || []).map((e) => e.toLowerCase());
      
      if (currentEmails.includes(normalizedEmail)) {
        console.log(`ℹ️  Email ${email} is already in admin list`);
        return;
      }

      const updatedEmails = [...currentEmails, normalizedEmail];
      
      settings = await prisma.adminSettings.update({
        where: { id: 'settings' },
        data: {
          adminEmails: updatedEmails,
          updatedAt: new Date(),
        },
      });
      
      console.log(`✅ Added ${email} to admin list`);
      console.log(`📋 Current admin emails: ${updatedEmails.join(', ')}`);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.error('❌ Please provide an email address');
  console.log('Usage: node scripts/add-admin-email.js <email>');
  process.exit(1);
}

addAdminEmail(email);



