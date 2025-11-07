import mongoose from 'mongoose';
import dotenv from 'dotenv';
import readline from 'readline';
import passwordService from '../services/passwordService.js';
import validator from '../utils/validators.js';
import Employee from '../models/Employee.js';

/**
 * Script to create employee accounts
 * Usage: node scripts/createEmployee.js
 */

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

const createEmployee = async () => {
  try {
    console.log('\n👔 Bank Employee Account Creation Tool');
    console.log('========================================\n');
    console.log('⚠️  This tool is for authorized bank administrators only.\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');

    // Collect employee information
    console.log('📋 Please enter the employee information:\n');

    const fullName = await question('Full Name: ');
    if (!validator.isValidFullName(fullName)) {
      console.error('❌ Invalid full name. Must be 2-100 characters, letters, spaces, hyphens, and apostrophes only.');
      process.exit(1);
    }

    const username = await question('Username (3-50 characters, alphanumeric + underscore): ');
    if (!validator.isValidUsername(username)) {
      console.error('❌ Invalid username. Must be 3-50 characters, letters, numbers, and underscores only.');
      process.exit(1);
    }

    const role = await question('Role (Employee/Manager/Admin) [default: Employee]: ') || 'Employee';
    const validRoles = ['Employee', 'Manager', 'Admin'];
    if (!validRoles.includes(role)) {
      console.error('❌ Invalid role. Must be Employee, Manager, or Admin.');
      process.exit(1);
    }

    // Check if employee already exists
    const existingEmployee = await Employee.findOne({
      username: username.toLowerCase()
    });

    if (existingEmployee) {
      console.error('❌ Error: Employee with this username already exists.');
      process.exit(1);
    }

    // Ask if they want to generate a password or enter one
    const passwordChoice = await question('\nGenerate temporary password? (y/n): ');
    let password;

    if (passwordChoice.toLowerCase() === 'y' || passwordChoice.toLowerCase() === 'yes') {
      password = generateTempPassword();
      console.log(`\n🔑 Generated temporary password: ${password}`);
      console.log('⚠️  Make sure to securely provide this to the employee!\n');
    } else {
      password = await question('Enter password (min 8 chars, with uppercase, lowercase, number, special char): ');
      if (!validator.isValidPassword(password)) {
        console.error('❌ Invalid password. Must be 8-100 characters with uppercase, lowercase, digit, and special character.');
        process.exit(1);
      }
    }

    // Confirm creation
    console.log('\n📋 Employee Information Summary:');
    console.log('================================');
    console.log(`Full Name: ${fullName}`);
    console.log(`Username: ${username.toLowerCase()}`);
    console.log(`Role: ${role}`);
    console.log('================================\n');

    const confirm = await question('Create this employee account? (y/n): ');

    if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
      console.log('❌ Employee creation cancelled.');
      process.exit(0);
    }

    // Hash password
    const { hash, salt } = await passwordService.hashPassword(password);

    // Create employee
    const employee = new Employee({
      fullName,
      username: username.toLowerCase(),
      passwordHash: hash,
      passwordSalt: salt,
      role,
      isActive: true
    });

    await employee.save();

    console.log('\n✅ Employee account created successfully!');
    console.log('\n👔 Employee Login Credentials:');
    console.log('==============================');
    console.log(`Full Name: ${fullName}`);
    console.log(`Username: ${username.toLowerCase()}`);
    console.log(`Password: ${password}`);
    console.log(`Role: ${role}`);
    console.log('==============================\n');
    console.log('⚠️  Please provide these credentials securely to the employee.');
    console.log('💡 Advise the employee to change their password after first login.\n');
    console.log('🔗 Employee Login URL: https://localhost:3000/employee/login\n');

  } catch (error) {
    console.error('\n❌ Error creating employee:', error.message);
    process.exit(1);
  } finally {
    rl.close();
    await mongoose.connection.close();
    process.exit(0);
  }
};

createEmployee();
