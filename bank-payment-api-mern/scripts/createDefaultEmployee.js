import mongoose from 'mongoose';
import dotenv from 'dotenv';
import passwordService from '../services/passwordService.js';
import Employee from '../models/Employee.js';

/**
 * Quick script to create a default employee for testing
 * Usage: node scripts/createDefaultEmployee.js
 */

dotenv.config();

const createDefaultEmployee = async () => {
  try {
    console.log('\n👔 Creating Default Employee Account...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');

    // Default employee details
    const employeeData = {
      fullName: 'Sarah Johnson',
      username: 'sarah_johnson',
      password: 'Employee@123',
      role: 'Employee'
    };

    // Check if employee already exists
    const existingEmployee = await Employee.findOne({
      username: employeeData.username
    });

    if (existingEmployee) {
      console.log('\n✅ Default employee already exists!');
      console.log('\n👔 Employee Login Credentials:');
      console.log('==============================');
      console.log(`Full Name: ${existingEmployee.fullName}`);
      console.log(`Username: ${existingEmployee.username}`);
      console.log(`Password: ${employeeData.password}`);
      console.log(`Role: ${existingEmployee.role}`);
      console.log('==============================\n');
      console.log('🔗 Employee Login URL: https://localhost:3000/employee/login\n');
      process.exit(0);
    }

    // Hash password
    const { hash, salt } = await passwordService.hashPassword(employeeData.password);

    // Create employee
    const employee = new Employee({
      fullName: employeeData.fullName,
      username: employeeData.username,
      passwordHash: hash,
      passwordSalt: salt,
      role: employeeData.role,
      isActive: true
    });

    await employee.save();

    console.log('\n✅ Employee account created successfully!');
    console.log('\n👔 Employee Login Credentials:');
    console.log('==============================');
    console.log(`Full Name: ${employeeData.fullName}`);
    console.log(`Username: ${employeeData.username}`);
    console.log(`Password: ${employeeData.password}`);
    console.log(`Role: ${employeeData.role}`);
    console.log('==============================\n');
    console.log('⚠️  Please save these credentials!');
    console.log('🔗 Employee Login URL: https://localhost:3000/employee/login\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error creating employee:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
};

createDefaultEmployee();
