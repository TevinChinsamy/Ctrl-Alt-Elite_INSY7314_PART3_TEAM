import mongoose from 'mongoose';
import dotenv from 'dotenv';
import passwordService from '../services/passwordService.js';
import Customer from '../models/Customer.js';

dotenv.config();

const createTestCustomer = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear brute force records
    try {
      await mongoose.connection.db.collection('bruteforces').deleteMany({});
      console.log('✅ Cleared brute force records');
    } catch (err) {
      console.log('⚠️  No brute force records to clear');
    }

    const testCustomer = {
      fullName: 'John Test',
      idNumber: '9001015009087',
      accountNumber: '1234567890123',
      password: 'TestPass123!',
      username: 'john_test'
    };

    // Check if customer already exists
    const existing = await Customer.findOne({
      $or: [
        { username: testCustomer.username },
        { idNumber: testCustomer.idNumber },
        { accountNumber: testCustomer.accountNumber }
      ]
    });

    if (existing) {
      console.log('\n✅ Test customer already exists!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Username:', testCustomer.username);
      console.log('Account Number:', testCustomer.accountNumber);
      console.log('Password:', testCustomer.password);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      process.exit(0);
    }

    // Hash password
    const { hash, salt } = await passwordService.hashPassword(testCustomer.password);

    // Create customer
    const customer = new Customer({
      fullName: testCustomer.fullName,
      idNumber: testCustomer.idNumber,
      accountNumber: testCustomer.accountNumber,
      username: testCustomer.username,
      passwordHash: hash,
      passwordSalt: salt,
      isActive: true
    });

    await customer.save();

    console.log('\n✅ Test customer created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Full Name:', testCustomer.fullName);
    console.log('Username:', testCustomer.username);
    console.log('Account Number:', testCustomer.accountNumber);
    console.log('Password:', testCustomer.password);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🚀 You can now login at http://localhost:3000/customer/login\n');

    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

createTestCustomer();
