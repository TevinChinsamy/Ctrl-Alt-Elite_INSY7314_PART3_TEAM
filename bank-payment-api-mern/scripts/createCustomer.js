import dotenv from 'dotenv';
import readline from 'readline';
import mongoose from 'mongoose';
import Customer from '../models/Customer.js';
import passwordService from '../services/passwordService.js';
import validator from '../utils/validators.js';

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Promisify readline question
const question = (query) => new Promise((resolve) => rl.question(query, resolve));

// Generate a temporary password
function generateTempPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@$!%*?&#';
  const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lowercase = 'abcdefghjkmnpqrstuvwxyz';
  const numbers = '23456789';
  const special = '@$!%*?&#';

  let password = '';
  // Ensure at least one of each required character type
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Fill the rest randomly (total length 12)
  for (let i = 4; i < 12; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }

  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

async function createCustomer() {
  try {
    console.log('\n🏦 Bank Customer Account Creation Tool');
    console.log('========================================\n');
    console.log('⚠️  This tool is for authorized bank staff only.\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');

    // Collect customer information
    console.log('📋 Please enter the customer information:\n');

    const fullName = await question('Full Name: ');
    if (!validator.isValidFullName(fullName)) {
      console.error('❌ Invalid full name. Must be 2-100 characters, letters, spaces, hyphens, and apostrophes only.');
      process.exit(1);
    }

    const idNumber = await question('ID Number (13 digits): ');
    if (!validator.isValidIdNumber(idNumber)) {
      console.error('❌ Invalid ID number. Must be exactly 13 digits.');
      process.exit(1);
    }

    const accountNumber = await question('Account Number (10-16 digits): ');
    if (!validator.isValidAccountNumber(accountNumber)) {
      console.error('❌ Invalid account number. Must be 10-16 digits.');
      process.exit(1);
    }

    const username = await question('Username (3-50 characters, alphanumeric + underscore): ');
    if (!validator.isValidUsername(username)) {
      console.error('❌ Invalid username. Must be 3-50 characters, letters, numbers, and underscores only.');
      process.exit(1);
    }

    // Check if customer already exists
    const existingCustomer = await Customer.findOne({
      $or: [
        { idNumber },
        { accountNumber },
        { username: username.toLowerCase() }
      ]
    });

    if (existingCustomer) {
      if (existingCustomer.username === username.toLowerCase()) {
        console.error('❌ Error: Username already exists.');
        process.exit(1);
      }
      console.error('❌ Error: Customer with this ID number or account number already exists.');
      process.exit(1);
    }

    // Ask if they want to generate a password or enter one
    const passwordChoice = await question('\nGenerate temporary password? (y/n): ');
    let password;

    if (passwordChoice.toLowerCase() === 'y' || passwordChoice.toLowerCase() === 'yes') {
      password = generateTempPassword();
      console.log(`\n🔑 Generated temporary password: ${password}`);
      console.log('⚠️  Make sure to securely provide this to the customer!\n');
    } else {
      password = await question('Enter password (min 8 chars, with uppercase, lowercase, number, special char): ');
      if (!validator.isValidPassword(password)) {
        console.error('❌ Invalid password. Must be 8-100 characters with uppercase, lowercase, digit, and special character.');
        process.exit(1);
      }
    }

    // Confirm creation
    console.log('\n📋 Customer Information Summary:');
    console.log('================================');
    console.log(`Full Name: ${fullName}`);
    console.log(`ID Number: ${idNumber}`);
    console.log(`Account Number: ${accountNumber}`);
    console.log(`Username: ${username.toLowerCase()}`);
    console.log('================================\n');

    const confirm = await question('Create this customer account? (y/n): ');

    if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
      console.log('❌ Customer creation cancelled.');
      process.exit(0);
    }

    // Hash password
    const { hash, salt } = await passwordService.hashPassword(password);

    // Create customer
    const customer = new Customer({
      fullName,
      idNumber,
      accountNumber,
      username: username.toLowerCase(),
      passwordHash: hash,
      passwordSalt: salt,
      isActive: true
    });

    await customer.save();

    console.log('\n✅ Customer account created successfully!');
    console.log('\n📧 Customer Login Credentials:');
    console.log('==============================');
    console.log(`Username: ${username.toLowerCase()}`);
    console.log(`Account Number: ${accountNumber}`);
    console.log(`Temporary Password: ${password}`);
    console.log('==============================\n');
    console.log('⚠️  Please provide these credentials securely to the customer.');
    console.log('💡 Advise the customer to change their password after first login.\n');

  } catch (error) {
    console.error('\n❌ Error creating customer:', error.message);
    process.exit(1);
  } finally {
    rl.close();
    await mongoose.connection.close();
    process.exit(0);
  }
}

// Run the script
createCustomer();
