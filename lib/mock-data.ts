// Mock Data for Admin Dashboard
import { Brand } from './hooks/useBrands';

export interface Customer {
  id: string
  name: string
  phone: string
  email: string
  location: string
  regDate: string
  totalOrders: number
  totalSpend: number
  status: "active" | "inactive"
}

export interface ImageAsset {
  url: string
  publicId: string
}

export interface Spec {
  key: string
  value: string
}

export interface Variant {
  id: string
  productId: string
  title: string
  slug: string
  sku: string
  price: number
  mrp: number
  discount?: number
  stocks: number
  attributes: Record<string, string>
  coverImage: ImageAsset
  imagesArray: ImageAsset[]
  isActive: boolean
  isDefault: boolean
}

export interface Product {
  id: string
  title: string
  desc: string
  specs: Spec[]
  brandId: string
  categoryId: string
  pickupWareHouseId: string
  coverImage: ImageAsset
  imagesArray: ImageAsset[]
  isActive: boolean
  returnPolicyType: 'Replace' | 'Return' | 'Both' | 'None'
  returnWindowDays: number
  defaultVariantId?: string
  displayPrice?: number // Derived from default variant for list view
}

export interface OrderItem {
  productId: string
  name: string
  image: string
  attributes: string
  quantity: number
  price: number
}

export interface Order {
  id: string
  customerName: string
  date: string
  items: OrderItem[]
  totalAmount: number
  paymentMethod: string
  status: "completed" | "pending" | "processing" | "in-transit" | "cancelled"
  deliveryDate?: string
}

export interface Transaction {
  id: string
  orderId: string
  customerName: string
  amount: number
  date: string
  status: "completed" | "pending" | "failed"
  paymentMethod: string
}

export interface Category {
  id: string
  name: string
  image: string
  parentId: string | null
  status: "active" | "inactive"
  productCount?: number
  children?: Category[]
}

export interface Coupon {
  id: string
  name: string
  code: string
  discountType: "percentage" | "fixed"
  discountValue: number
  minPurchase: number
  maxDiscount?: number
  startDate: string
  expiryDate: string
  status: "active" | "inactive" | "expired"
  usageCount: number
  usageLimit?: number
}

// KPI Data
export const dashboardKPI = {
  orders: { value: 1247, growth: 12.5 },
  customers: { value: 342, growth: 8.3 },
  pendingOrders: { value: 23, growth: -5.2 },
  newOrders: { value: 89, growth: 15.7 },
  processing: { value: 45, growth: 3.2 },
  inTransit: { value: 67, growth: 8.9 },
  cancelled: { value: 12, growth: -2.1 },
  totalCustomers: { value: 2458, growth: 6.2 },
  newCustomers: { value: 156, growth: 11.3 },
  visitors: { value: 8934, growth: 4.8 },
}

export const chartData = {
  weekly: [
    { day: "Mon", customers: 45, products: 120, revenue: 2400 },
    { day: "Tue", customers: 52, products: 145, revenue: 2900 },
    { day: "Wed", customers: 38, products: 98, revenue: 1960 },
    { day: "Thu", customers: 65, products: 178, revenue: 3560 },
    { day: "Fri", customers: 72, products: 201, revenue: 4020 },
    { day: "Sat", customers: 58, products: 156, revenue: 3120 },
    { day: "Sun", customers: 41, products: 112, revenue: 2240 },
  ],
  monthly: [
    { day: "Week 1", customers: 312, products: 892, revenue: 17840 },
    { day: "Week 2", customers: 345, products: 956, revenue: 19120 },
    { day: "Week 3", customers: 298, products: 834, revenue: 16680 },
    { day: "Week 4", customers: 378, products: 1023, revenue: 20460 },
  ],
}

export const categorySales = [
  { name: "Jewellery", sales: 45200, growth: 15.2 },
  { name: "Accessories", sales: 32800, growth: 8.7 },
  { name: "Home & Garden", sales: 28400, growth: 12.4 },
  { name: "Sports", sales: 19600, growth: -3.2 },
  { name: "Books", sales: 12400, growth: 5.8 },
]

export const customers: Customer[] = [
  {
    id: "CUST001",
    name: "Rahul Sharma",
    phone: "+91 98765 43210",
    email: "rahul.sharma@email.com",
    location: "Mumbai, Maharashtra",
    regDate: "2024-01-15",
    totalOrders: 12,
    totalSpend: 45680,
    status: "active",
  },
  {
    id: "CUST002",
    name: "Priya Patel",
    phone: "+91 87654 32109",
    email: "priya.p@email.com",
    location: "Delhi, NCR",
    regDate: "2024-02-20",
    totalOrders: 8,
    totalSpend: 32100,
    status: "active",
  },
  {
    id: "CUST003",
    name: "Amit Kumar",
    phone: "+91 76543 21098",
    email: "amit.k@email.com",
    location: "Bangalore, Karnataka",
    regDate: "2024-03-10",
    totalOrders: 15,
    totalSpend: 67890,
    status: "active",
  },
  {
    id: "CUST004",
    name: "Sneha Gupta",
    phone: "+91 65432 10987",
    email: "sneha.g@email.com",
    location: "Hyderabad, Telangana",
    regDate: "2024-04-05",
    totalOrders: 6,
    totalSpend: 19800,
    status: "inactive",
  },
  {
    id: "CUST005",
    name: "Vikram Singh",
    phone: "+91 54321 09876",
    email: "vikram.s@email.com",
    location: "Chennai, Tamil Nadu",
    regDate: "2024-05-12",
    totalOrders: 22,
    totalSpend: 89450,
    status: "active",
  },
]

export const orders: Order[] = [
  {
    id: "ORD001",
    customerName: "Rahul Sharma",
    date: "2026-05-01",
    items: [
      {
        productId: "PROD001",
        name: "Pahadi Guloband",
        image: "/placeholder.jpg",
        attributes: "Gold, 22KT",
        quantity: 1,
        price: 45999,
      },
    ],
    totalAmount: 45999,
    paymentMethod: "UPI",
    status: "completed",
    deliveryDate: "2026-05-03",
  },
  {
    id: "ORD002",
    customerName: "Priya Patel",
    date: "2026-05-01",
    items: [
      {
        productId: "PROD002",
        name: "Diamond Earring",
        image: "/placeholder.jpg",
        attributes: "White Gold, VVS",
        quantity: 1,
        price: 89999,
      },
      {
        productId: "PROD003",
        name: "Earring Back",
        image: "/placeholder.jpg",
        attributes: "Silicon",
        quantity: 2,
        price: 499,
      },
    ],
    totalAmount: 90997,
    paymentMethod: "Card",
    status: "processing",
  },
  {
    id: "ORD003",
    customerName: "Amit Kumar",
    date: "2026-04-30",
    items: [
      {
        productId: "PROD004",
        name: "Silver Anklet",
        image: "/placeholder.jpg",
        attributes: "925 Silver, Pair",
        quantity: 1,
        price: 1499,
      },
    ],
    totalAmount: 1499,
    paymentMethod: "Net Banking",
    status: "in-transit",
  },
  {
    id: "ORD004",
    customerName: "Sneha Gupta",
    date: "2026-04-29",
    items: [
      {
        productId: "PROD005",
        name: "Nose Pin",
        image: "/placeholder.jpg",
        attributes: "Gold, 18KT",
        quantity: 3,
        price: 2999,
      },
      {
        productId: "PROD006",
        name: "Cleaning Kit",
        image: "/placeholder.jpg",
        attributes: "Jewellery Care",
        quantity: 2,
        price: 199,
      },
      {
        productId: "PROD007",
        name: "Gift Box",
        image: "/placeholder.jpg",
        attributes: "Premium Velvet",
        quantity: 1,
        price: 599,
      },
    ],
    totalAmount: 9593,
    paymentMethod: "UPI",
    status: "pending",
  },
  {
    id: "ORD005",
    customerName: "Vikram Singh",
    date: "2026-04-28",
    items: [
      {
        productId: "PROD008",
        name: "Gold Bangle Set",
        image: "/placeholder.jpg",
        attributes: "22KT, Set of 4",
        quantity: 1,
        price: 145999,
      },
    ],
    totalAmount: 145999,
    paymentMethod: "Card",
    status: "cancelled",
  },
]

export const transactions: Transaction[] = [
  {
    id: "TXN001",
    orderId: "ORD001",
    customerName: "Rahul Sharma",
    amount: 2999,
    date: "2026-05-01",
    status: "completed",
    paymentMethod: "UPI",
  },
  {
    id: "TXN002",
    orderId: "ORD002",
    customerName: "Priya Patel",
    amount: 9997,
    date: "2026-05-01",
    status: "completed",
    paymentMethod: "Card",
  },
  {
    id: "TXN003",
    orderId: "ORD003",
    customerName: "Amit Kumar",
    amount: 1499,
    date: "2026-04-30",
    status: "completed",
    paymentMethod: "Net Banking",
  },
  {
    id: "TXN004",
    orderId: "ORD004",
    customerName: "Sneha Gupta",
    amount: 1893,
    date: "2026-04-29",
    status: "pending",
    paymentMethod: "UPI",
  },
]

export const products: Product[] = [
  {
    id: "6638a1a2e1b2c3d4e5f6b1b1",
    title: "Wireless Headphones MX-500",
    desc: "Premium noise-cancelling headphones with 40-hour battery life and superior sound quality.",
    specs: [
      { key: "Battery", value: "40 Hours" },
      { key: "Bluetooth", value: "v5.2" },
      { key: "Driver Size", value: "40mm" }
    ],
    brandId: "BRD001",
    categoryId: "CAT003",
    pickupWareHouseId: "WH001",
    coverImage: { url: "/placeholder.jpg", publicId: "headphones_cover" },
    imagesArray: [],
    isActive: true,
    returnPolicyType: 'Replace',
    returnWindowDays: 7,
    displayPrice: 2999
  },
  {
    id: "6638a1a2e1b2c3d4e5f6b1b2",
    title: "Smart Watch Pro Gen 2",
    desc: "Advanced fitness tracker with heart rate monitoring, GPS, and water resistance.",
    specs: [
      { key: "Water Resistance", value: "5ATM" },
      { key: "Sensors", value: "Heart Rate, GPS, SpO2" }
    ],
    brandId: "BRD002",
    categoryId: "CAT005",
    pickupWareHouseId: "WH002",
    coverImage: { url: "/placeholder.jpg", publicId: "watch_cover" },
    imagesArray: [],
    isActive: true,
    returnPolicyType: 'Both',
    returnWindowDays: 10,
    displayPrice: 8999
  }
]

export const variants: Variant[] = [
  {
    id: "6638a1a2e1b2c3d4e5f6v1b1",
    productId: "6638a1a2e1b2c3d4e5f6b1b1",
    title: "Black Edition",
    slug: "wireless-headphones-mx-500-black",
    sku: "HEAD-MX500-BLK",
    price: 2999,
    mrp: 4999,
    discount: 40,
    stocks: 45,
    attributes: { "Color": "Black" },
    coverImage: { url: "/placeholder.jpg", publicId: "headphones_black" },
    imagesArray: [],
    isActive: true,
    isDefault: true
  },
  {
    id: "6638a1a2e1b2c3d4e5f6v1b2",
    productId: "6638a1a2e1b2c3d4e5f6b1b2",
    title: "Silver Pro",
    slug: "smart-watch-pro-gen-2-silver",
    sku: "WATCH-PRO2-SLV",
    price: 8999,
    mrp: 12999,
    discount: 30,
    stocks: 23,
    attributes: { "Color": "Silver", "Size": "44mm" },
    coverImage: { url: "/placeholder.jpg", publicId: "watch_silver" },
    imagesArray: [],
    isActive: true,
    isDefault: true
  }
]

export const categories: Category[] = [
  {
    id: "CAT001",
    name: "Electronics",
    image: "/categories/electronics.jpg",
    parentId: null,
    status: "active",
    children: [
      {
        id: "CAT002",
        name: "Audio",
        image: "/categories/audio.jpg",
        parentId: "CAT001",
        status: "active",
        children: [
          { 
            id: "CAT003", 
            name: "Headphones", 
            image: "/categories/headphones.jpg",
            parentId: "CAT002", 
            status: "active" 
          },
          { 
            id: "CAT004", 
            name: "Speakers", 
            image: "/categories/speakers.jpg",
            parentId: "CAT002", 
            status: "active" 
          },
        ],
      },
      { 
        id: "CAT005", 
        name: "Wearables", 
        image: "/categories/wearables.jpg",
        parentId: "CAT001", 
        status: "active" 
      },
    ],
  },
  {
    id: "CAT006",
    name: "Clothing",
    image: "/categories/clothing.jpg",
    parentId: null,
    status: "active",
    children: [
      { 
        id: "CAT007", 
        name: "Men", 
        image: "/categories/men-clothing.jpg",
        parentId: "CAT006", 
        status: "active",
        children: [
          {
            id: "CAT010",
            name: "T-Shirts",
            image: "/categories/tshirts.jpg",
            parentId: "CAT007",
            status: "active"
          },
          {
            id: "CAT011",
            name: "Jeans",
            image: "/categories/jeans.jpg",
            parentId: "CAT007",
            status: "active"
          }
        ]
      },
      { 
        id: "CAT008", 
        name: "Women", 
        image: "/categories/women-clothing.jpg",
        parentId: "CAT006", 
        status: "active" 
      },
    ],
  },
  {
    id: "CAT009",
    name: "Sports",
    image: "/categories/sports.jpg",
    parentId: null,
    status: "active",
  },
]

export const coupons: Coupon[] = [
  {
    id: "CPN001",
    name: "New User Discount",
    code: "WELCOME10",
    discountType: "percentage",
    discountValue: 10,
    minPurchase: 500,
    maxDiscount: 200,
    startDate: "2026-01-01",
    expiryDate: "2026-12-31",
    status: "active",
    usageCount: 145,
    usageLimit: 500,
  },
  {
    id: "CPN002",
    name: "Summer Sale",
    code: "SUMMER500",
    discountType: "fixed",
    discountValue: 500,
    minPurchase: 2000,
    startDate: "2026-05-01",
    expiryDate: "2026-06-30",
    status: "active",
    usageCount: 89,
    usageLimit: 200,
  },
  {
    id: "CPN003",
    name: "Festival Offer",
    code: "FESTIVE20",
    discountType: "percentage",
    discountValue: 20,
    minPurchase: 1000,
    maxDiscount: 500,
    startDate: "2026-09-01",
    expiryDate: "2026-10-15",
    status: "inactive",
    usageCount: 0,
    usageLimit: 1000,
  },
  {
    id: "CPN004",
    name: "Flash Sale",
    code: "FLASH30",
    discountType: "percentage",
    discountValue: 30,
    minPurchase: 1500,
    maxDiscount: 450,
    startDate: "2026-04-15",
    expiryDate: "2026-04-30",
    status: "expired",
    usageCount: 350,
    usageLimit: 350,
  },
  {
    id: "CPN005",
    name: "Daily Savings",
    code: "SAVE100",
    discountType: "fixed",
    discountValue: 100,
    minPurchase: 500,
    startDate: "2026-01-01",
    expiryDate: "2026-12-31",
    status: "active",
    usageCount: 12,
    usageLimit: undefined,
  },
]

export const brands: Brand[] = [
  { id: "BRD001", name: "Apple", logo: "/brands/apple.png", productCount: 45, status: "active", createdAt: new Date().toISOString() },
  { id: "BRD002", name: "Samsung", logo: "/brands/samsung.png", productCount: 128, status: "active", createdAt: new Date().toISOString() },
  { id: "BRD003", name: "Nike", productCount: 256, status: "active", createdAt: new Date().toISOString() },
  { id: "BRD004", name: "Adidas", logo: "/brands/adidas.png", productCount: 210, status: "active", createdAt: new Date().toISOString() },
  { id: "BRD005", name: "Sony", logo: "/brands/sony.png", productCount: 89, status: "active", createdAt: new Date().toISOString() },
  { id: "BRD006", name: "Dell", productCount: 64, status: "active", createdAt: new Date().toISOString() },
  { id: "BRD007", name: "HP", logo: "/brands/hp.png", productCount: 72, status: "inactive", createdAt: new Date().toISOString() },
  { id: "BRD008", name: "Logitech", logo: "/brands/logitech.png", productCount: 112, status: "active", createdAt: new Date().toISOString() },
  { id: "BRD009", name: "Bose", productCount: 34, status: "active", createdAt: new Date().toISOString() },
  { id: "BRD010", name: "Canon", logo: "/brands/canon.png", productCount: 56, status: "active", createdAt: new Date().toISOString() },
]

export interface Warehouse {
  id: string
  name: string
  location: string
  contactPerson: string
  phone: string
  email: string
  status: "active" | "inactive"
}

export const warehouses: Warehouse[] = [
  {
    id: "WH001",
    name: "Main Central Warehouse",
    location: "Bhiwandi, Maharashtra",
    contactPerson: "Rajesh Kumar",
    phone: "+91 99887 76655",
    email: "central@mscliq.com",
    status: "active",
  },
  {
    id: "WH002",
    name: "North Regional Hub",
    location: "Gurugram, Haryana",
    contactPerson: "Suresh Mehra",
    phone: "+91 88776 65544",
    email: "north@mscliq.com",
    status: "active",
  },
  {
    id: "WH003",
    name: "South Distribution Center",
    location: "Bengaluru, Karnataka",
    contactPerson: "Karthik R.",
    phone: "+91 77665 54433",
    email: "south@mscliq.com",
    status: "inactive",
  },
]

export interface Review {
  id: string
  productId: string
  productName: string
  productImage: string
  customerName: string
  customerAvatar?: string
  rating: number
  comment: string
  date: string
  status: "active" | "inactive"
}

export const reviews: Review[] = [
  {
    id: "REV001",
    productId: "PROD001",
    productName: "Wireless Headphones",
    productImage: "/placeholder.jpg",
    customerName: "Ananya Iyer",
    rating: 5,
    comment: "Excellent sound quality and very comfortable for long hours. Highly recommended for music lovers!",
    date: "2026-05-01",
    status: "active",
  },
  {
    id: "REV002",
    productId: "PROD002",
    productName: "Smart Watch Pro",
    productImage: "/placeholder.jpg",
    customerName: "Rahul Varma",
    rating: 4,
    comment: "Great features, battery life is decent. The heart rate monitor is quite accurate.",
    date: "2026-04-28",
    status: "active",
  },
  {
    id: "REV003",
    productId: "PROD004",
    productName: "Cotton T-Shirt",
    productImage: "/placeholder.jpg",
    customerName: "Priya Sharma",
    rating: 3,
    comment: "Color faded slightly after the first wash, but the fabric is very soft and breathable.",
    date: "2026-04-25",
    status: "inactive",
  },
  {
    id: "REV004",
    productId: "PROD001",
    productName: "Wireless Headphones",
    productImage: "/placeholder.jpg",
    customerName: "Vikram Malhotra",
    rating: 5,
    comment: "I have been using these for a week now and I am thoroughly impressed. The noise cancellation is top-notch, blocking out even the loudest street sounds. The bass is punchy without being overwhelming, and the highs are crystal clear. Battery life easily lasts through my long commutes and work day. Build quality feels premium and sturdy. Definitely worth every penny!",
    date: "2026-04-20",
    status: "active",
  },
  {
    id: "REV005",
    productId: "PROD003",
    productName: "Running Shoes",
    productImage: "/placeholder.jpg",
    customerName: "Amit Patel",
    rating: 2,
    comment: "The size was smaller than expected. I had to return them and the process took quite long.",
    date: "2026-04-15",
    status: "active",
  }
]

export interface AdminUser {
  id: string
  name?: string
  email?: string
  phone: string
  role: "admin" | "staff" | "customer"
  isActive: boolean
  createdAt: string
}

export const adminUsers: AdminUser[] = [
  {
    id: "6638a1a2e1b2c3d4e5f6a1b2",
    name: "Admin User",
    email: "admin@mscliq.com",
    phone: "9876543210",
    role: "admin",
    isActive: true,
    createdAt: "2024-01-01T10:00:00Z",
  },
  {
    id: "6638a1a2e1b2c3d4e5f6a1b3",
    name: "Staff Member",
    email: "staff@mscliq.com",
    phone: "9876543211",
    role: "staff",
    isActive: true,
    createdAt: "2024-01-10T12:30:00Z",
  },
  {
    id: "6638a1a2e1b2c3d4e5f6a1b4",
    name: "John Doe",
    email: "john@example.com",
    phone: "9876543212",
    role: "customer",
    isActive: true,
    createdAt: "2024-02-15T09:15:00Z",
  },
  {
    id: "6638a1a2e1b2c3d4e5f6a1b5",
    name: "Jane Smith",
    email: "jane@example.com",
    phone: "9876543213",
    role: "customer",
    isActive: false,
    createdAt: "2024-03-20T14:45:00Z",
  },
]
