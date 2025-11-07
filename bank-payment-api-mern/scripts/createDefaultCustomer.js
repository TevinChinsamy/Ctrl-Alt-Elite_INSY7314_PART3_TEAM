import mongoose from 'mongoose';
import dotenv from 'dotenv';
import passwordService from '../services/passwordService.js';
import Customer from '../models/Customer.js';

/**
 * Quick script to create a default customer for testing
 * Usage: node scripts/createDefaultCustomer.js
 */

dotenv.config();

const createDefaultCustomer = async () => {
  try {
    console.log('\n🏦 Creating Default Customer Account...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');

    // Default customer details
    const customerData = {
      fullName: 'John Smith',
      idNumber: '9001015009087',
      accountNumber: '1234567890123',
      username: 'john_smith',
      password: 'Customer@123',
    };

    // Check if customer already exists
    const existingCustomer = await Customer.findOne({
      $or: [
        { idNumber: customerData.idNumber },
        { accountNumber: customerData.accountNumber },
        { username: customerData.username }
      ]
    });

    if (existingCustomer) {
      console.log('\n✅ Default customer already exists!');
      console.log('\n🏦 Customer Login Credentials:');
      console.log('==============================');
      console.log(`Full Name: ${existingCustomer.fullName}`);
      console.log(`Username: ${existingCustomer.username}`);
      console.log(`Account Number: ${existingCustomer.accountNumber}`);
      console.log(`Password: ${customerData.password}`);
      console.log('==============================\n');
      console.log('🔗 Customer Login URL: https://localhost:3000/customer/login\n');
      process.exit(0);
    }

    // Hash password
    const { hash, salt } = await passwordService.hashPassword(customerData.password);

    // Create customer
    const customer = new Customer({
      fullName: customerData.fullName,
      idNumber: customerData.idNumber,
      accountNumber: customerData.accountNumber,
      username: customerData.username,
      passwordHash: hash,
      passwordSalt: salt,
      isActive: true
    });

    await customer.save();

    console.log('\n✅ Customer account created successfully!');
    console.log('\n🏦 Customer Login Credentials:');
    console.log('==============================');
    console.log(`Full Name: ${customerData.fullName}`);
    console.log(`Username: ${customerData.username}`);
    console.log(`Account Number: ${customerData.accountNumber}`);
    console.log(`Password: ${customerData.password}`);
    console.log('==============================\n');
    console.log('⚠️  Please save these credentials!');
    console.log('🔗 Customer Login URL: https://localhost:3000/customer/login\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error creating customer:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
};

createDefaultCustomer();
