// Seeds demo users, wallets, and a starter menu so the app is testable end-to-end
// without manually creating accounts.
// Run with: npm run seed
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const MenuItem = require('../models/MenuItem');
const Inventory = require('../models/Inventory');

const demoUsers = [
  { name: 'College Admin', email: 'admin@campusbite.edu', passwordHash: 'Admin@123', role: 'admin' },
  { name: 'Canteen Manager', email: 'manager@campusbite.edu', passwordHash: 'Manager@123', role: 'manager' },
  { name: 'Counter Staff', email: 'staff@campusbite.edu', passwordHash: 'Staff@123', role: 'staff' },
  { name: 'Demo Student', email: 'student@campusbite.edu', passwordHash: 'Student@123', role: 'student', studentId: 'STU1001' },
  { name: 'Demo Lecturer', email: 'lecturer@campusbite.edu', passwordHash: 'Lecturer@123', role: 'lecturer' },
];

const demoMenu = [
  { name: 'Masala Dosa', category: 'Breakfast', price: 45, availableQuantity: 30, preparationTime: 12, description: 'Crispy rice crepe with spiced potato filling' },
  { name: 'Idli Sambar (2 pcs)', category: 'Breakfast', price: 35, availableQuantity: 40, preparationTime: 8, description: 'Steamed rice cakes with lentil sambar' },
  { name: 'Veg Thali', category: 'Lunch', price: 90, availableQuantity: 25, preparationTime: 15, description: 'Rice, dal, two curries, roti, salad' },
  { name: 'Chicken Biryani', category: 'Lunch', price: 130, availableQuantity: 20, preparationTime: 18, description: 'Hyderabadi-style dum biryani' },
  { name: 'Samosa (2 pcs)', category: 'Snacks', price: 20, availableQuantity: 60, preparationTime: 5, description: 'Crispy fried pastry with spiced potato' },
  { name: 'Veg Sandwich', category: 'Snacks', price: 40, availableQuantity: 35, preparationTime: 7, description: 'Grilled sandwich with veggies and chutney' },
  { name: 'Masala Chai', category: 'Beverages', price: 15, availableQuantity: 100, preparationTime: 4, description: 'Spiced Indian tea' },
  { name: 'Cold Coffee', category: 'Beverages', price: 40, availableQuantity: 50, preparationTime: 5, description: 'Iced coffee with milk' },
  { name: 'Gulab Jamun (2 pcs)', category: 'Desserts', price: 30, availableQuantity: 40, preparationTime: 3, description: 'Sweet milk-solid dumplings in syrup' },
];

const run = async () => {
  await connectDB();

  await User.deleteMany({ email: { $in: demoUsers.map((u) => u.email) } });
  await MenuItem.deleteMany({});
  await Inventory.deleteMany({});

  const createdUsers = [];
  for (const u of demoUsers) {
    const user = await User.create(u); // passwordHash gets hashed by the pre-save hook
    await Wallet.findOneAndUpdate(
      { userId: user._id },
      { userId: user._id, balance: user.role === 'student' || user.role === 'lecturer' ? 500 : 0 },
      { upsert: true }
    );
    createdUsers.push(user);
  }

  await MenuItem.insertMany(demoMenu);

  await Inventory.insertMany([
    { name: 'Rice (kg)', unit: 'kg', quantity: 50, lowStockThreshold: 10 },
    { name: 'Cooking Oil (L)', unit: 'l', quantity: 20, lowStockThreshold: 5 },
    { name: 'Milk (L)', unit: 'l', quantity: 15, lowStockThreshold: 5 },
  ]);

  console.log('Seed complete. Demo accounts (password shown in plaintext, seed-only):');
  demoUsers.forEach((u) => console.log(`  ${u.role.padEnd(10)} ${u.email}  /  ${u.passwordHash}`));

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
