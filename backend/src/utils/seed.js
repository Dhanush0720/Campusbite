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
  {
    name: 'Masala Dosa',
    category: 'Breakfast',
    price: 45,
    isVeg: true,
    availableQuantity: 30,
    preparationTime: 12,
    preparationType: 'MADE_TO_ORDER',
    description: 'Crispy fermented rice crepe stuffed with fragrant spiced potato masala, served with coconut chutney & piping hot sambar.',
    image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=600&q=80'
  },
  {
    name: 'Idli Sambar (2 pcs)',
    category: 'Breakfast',
    price: 35,
    isVeg: true,
    availableQuantity: 40,
    preparationTime: 8,
    preparationType: 'MADE_TO_ORDER',
    description: 'Steamed fluffy rice & lentil cakes served with freshly grated coconut chutney and aromatic lentil vegetable sambar.',
    image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80'
  },
  {
    name: 'North Indian Veg Thali',
    category: 'Lunch',
    price: 90,
    isVeg: true,
    availableQuantity: 25,
    preparationTime: 15,
    preparationType: 'MADE_TO_ORDER',
    description: 'Wholesome campus meal with paneer sabzi, dal tadka, seasonal vegetable curry, 2 butter rotis, fragrant basmati rice & salad.',
    image: 'https://images.unsplash.com/photo-1613292443284-8d10ef9383fe?auto=format&fit=crop&w=600&q=80'
  },
  {
    name: 'Hyderabadi Chicken Biryani',
    category: 'Lunch',
    price: 130,
    isVeg: false,
    availableQuantity: 20,
    preparationTime: 18,
    preparationType: 'MADE_TO_ORDER',
    description: 'Traditional dum cooked fragrant basmati rice infused with tender chicken pieces, saffron, and aromatic spices. Served with raita & mirchi ka salan.',
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80'
  },
  {
    name: 'Crispy Samosa (2 pcs)',
    category: 'Snacks',
    price: 20,
    isVeg: true,
    availableQuantity: 60,
    preparationTime: 2,
    preparationType: 'READY_FOOD',
    description: 'Golden flaky fried pastries packed with spiced green peas and potato mash. Served with tangy tamarind & mint chutney. (Ready at counter!)',
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80'
  },
  {
    name: 'Paneer Grilled Sandwich',
    category: 'Snacks',
    price: 45,
    isVeg: true,
    availableQuantity: 35,
    preparationTime: 3,
    preparationType: 'READY_FOOD',
    description: 'Fresh cottage cheese, sliced bell peppers, melted cheese and house green chutney toasted to perfection. (Ready at counter!)',
    image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80'
  },
  {
    name: 'Masala Cutting Chai',
    category: 'Beverages',
    price: 15,
    isVeg: true,
    availableQuantity: 100,
    preparationTime: 1,
    preparationType: 'READY_FOOD',
    description: 'Brewed with Assam tea leaves, crushed ginger, cardamom, and fresh milk. Perfect fuel for lectures! (Ready at counter!)',
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80'
  },
  {
    name: 'Thick Cold Coffee',
    category: 'Beverages',
    price: 40,
    isVeg: true,
    availableQuantity: 50,
    preparationTime: 1,
    preparationType: 'READY_FOOD',
    description: 'Creamy iced coffee topped with rich chocolate drizzle. Chilled and served instantly at the counter.',
    image: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=600&q=80'
  },
  {
    name: 'Hot Gulab Jamun (2 pcs)',
    category: 'Desserts',
    price: 30,
    isVeg: true,
    availableQuantity: 40,
    preparationTime: 1,
    preparationType: 'READY_FOOD',
    description: 'Soft melt-in-mouth milk dumplings soaked in warm rose and cardamom flavored sugar syrup.',
    image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=600&q=80'
  },
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
