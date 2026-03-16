const fs = require('fs');
const path = require('path');

const PRODUCTS_FILE = path.join(__dirname, 'data/products.json');
const CATEGORIES_FILE = path.join(__dirname, 'data/categories.json');
const SUBCATEGORIES_FILE = path.join(__dirname, 'data/subCategories.json');
const ORDERS_FILE = path.join(__dirname, 'data/orders.json');
const USERS_FILE = path.join(__dirname, 'data/users.json');
const ADMINS_FILE = path.join(__dirname, 'data/admins.json');

// Ensure data folder exists
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'));
}

class MockDB {
  constructor() {
    this.categories = this.load(CATEGORIES_FILE, []);
    this.subCategories = this.load(SUBCATEGORIES_FILE, []);
    this.products = this.load(PRODUCTS_FILE, []);
    this.orders = this.load(ORDERS_FILE, []);
    this.users = this.load(USERS_FILE, []);
    this.admins = this.load(ADMINS_FILE, []);
    
    // Seed Categories if empty
    if (this.categories.length === 0) {
      this.categories = [
        { _id: 'cat1', name: 'Curtains', image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=2069&auto=format&fit=crop' },
        { _id: 'cat2', name: 'Blinds', image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=2070&auto=format&fit=crop' },
        { _id: 'cat3', name: 'Accessories', image: 'https://images.unsplash.com/photo-1501183007986-d0d080b147f9?q=80&w=2070&auto=format&fit=crop' }
      ];
      this.save(CATEGORIES_FILE, this.categories);
    }

    // Seed SubCategories if empty
    if (this.subCategories.length === 0) {
      this.subCategories = [
        { _id: 'sub1', name: 'Eyelet Curtains', category: 'cat1' },
        { _id: 'sub2', name: 'Roller Blinds', category: 'cat2' }
      ];
      this.save(SUBCATEGORIES_FILE, this.subCategories);
    }

    // Seed Products if empty
    if (this.products.length === 0) {
      this.products = [
        {
          _id: '1',
          name: 'Classic Linen Curtains',
          description: 'Timeless linen curtains with a beautiful drape.',
          retailPrice: 120.00,
          wholesalePrice: 85.00,
          category: 'cat1',
          subCategory: 'sub1',
          images: ['https://images.unsplash.com/photo-1544457070-4cd773b4d71e?q=80&w=2000&auto=format&fit=crop'],
          stock: 50,
          featured: true
        },
        {
          _id: '2',
          name: 'Blackout Velvet Drapes',
          description: 'Luxurious heavy velvet curtains.',
          retailPrice: 210.00,
          wholesalePrice: 155.00,
          category: 'cat1',
          images: ['https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=2069&auto=format&fit=crop'],
          stock: 30,
          featured: true
        }
      ];
      this.save(PRODUCTS_FILE, this.products);
    }

    // Seed Users if empty
    if (this.users.length === 0) {
      this.users = [
        { _id: 'u1', name: 'Admin User', email: 'admin@cromsen.com', role: 'admin' },
        { _id: 'u2', name: 'John Doe', email: 'john@example.com', role: 'customer' },
        { _id: 'u3', name: 'Dealer One', email: 'dealer@example.com', role: 'dealer' }
      ];
      this.save(USERS_FILE, this.users);
    }

    // Seed Admins if empty
    if (this.admins.length === 0) {
      this.admins = [
        { _id: 'adm1', username: 'Cromsen', password: 'password', role: 'main' },
        { _id: 'adm2', username: 'staff', password: 'password', role: 'sub' }
      ];
      this.save(ADMINS_FILE, this.admins);
    }

    // Seed Orders if empty
    if (this.orders.length === 0) {
      this.orders = [
        {
          _id: 'ord1',
          user: 'u2',
          items: [{ product: '1', name: 'Classic Linen Curtains', quantity: 2, price: 120.00 }],
          totalAmount: 240.00,
          status: 'Delivered',
          createdAt: new Date().toISOString()
        },
        {
          _id: 'ord2',
          user: 'u3',
          items: [{ product: '2', name: 'Blackout Velvet Drapes', quantity: 1, price: 155.00 }],
          totalAmount: 155.00,
          status: 'Pending',
          createdAt: new Date().toISOString()
        }
      ];
      this.save(ORDERS_FILE, this.orders);
    }
  }

  load(file, def) {
    try {
      if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (e) { console.error(e); }
    return def;
  }

  save(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
  }
}

module.exports = new MockDB();
