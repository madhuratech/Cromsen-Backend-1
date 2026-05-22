const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');
const Category = require('./models/Category');

dotenv.config();

const categories = [
  { name: 'Balcony Series', image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=2070&auto=format&fit=crop' },
  { name: 'Cabinet Hinges Series', image: 'https://images.unsplash.com/photo-1600585152220-90363fe7e115?q=80&w=2070&auto=format&fit=crop' },
  { name: 'Fencing Series', image: 'https://images.unsplash.com/photo-1616489953149-8ba5dc422934?q=80&w=2070&auto=format&fit=crop' },
  { name: 'Honeycomb Series', image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=2070&auto=format&fit=crop' },
  { name: 'Mosquito Net', image: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?q=80&w=2066&auto=format&fit=crop' },
  { name: 'Other Machineries', image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=2070&auto=format&fit=crop' },
  { name: 'Curtains', image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=2070&auto=format&fit=crop' },
  { name: 'Blinds', image: 'https://images.unsplash.com/photo-1600585152220-90363fe7e115?q=80&w=2070&auto=format&fit=crop' }
];

const products = [
  {
    name: 'SS304G Mosquito Net',
    price: 45.00,
    category: 'Mosquito Net',
    description: 'High quality stainless steel 304 grade mosquito net for windows.',
    images: ['https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?q=80&w=2066&auto=format&fit=crop'],
    variants: [{ name: 'Size', options: ['Standard', 'Custom'] }],
    featured: true
  },
  {
    name: 'SS316G Mosquito Net',
    price: 55.00,
    category: 'Mosquito Net',
    description: 'Premium stainless steel 316 grade mosquito net for coastal areas.',
    images: ['https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?q=80&w=2066&auto=format&fit=crop'],
    variants: [{ name: 'Size', options: ['Standard', 'Custom'] }],
    featured: true
  },
  {
    name: 'Luxury Zebra Blinds - Balcony Series',
    price: 125.00,
    category: 'Balcony Series',
    description: 'Elegant zebra blinds specifically designed for large balcony windows.',
    images: ['https://images.unsplash.com/photo-1600585152220-90363fe7e115?q=80&w=2070&auto=format&fit=crop'],
    featured: true
  },
  {
    name: 'Honeycomb Insulation Blinds',
    price: 89.00,
    category: 'Honeycomb Series',
    description: 'Cellular blinds that provide excellent thermal insulation.',
    images: ['https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=2070&auto=format&fit=crop'],
    featured: true
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/cromsen');

    await Category.deleteMany({});
    await Product.deleteMany({});

    const createdCategories = await Category.insertMany(categories);

    const productsWithCategoryIds = products.map(p => {
      const cat = createdCategories.find(c => c.name === p.category);
      return {
        ...p,
        category: cat ? cat._id : null,
        retailPrice: p.price,
        wholesalePrice: p.price * 0.7 // Default wholesale as 70% of retail
      };
    });

    await Product.insertMany(productsWithCategoryIds);

    console.log('Database seeded successfully');
    process.exit();
  } catch (err) {
    console.error('Error seeding database:', err);
    process.exit(1);
  }
};

seedDB();
