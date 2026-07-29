const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

const User = require('../src/models/User');
const Asset = require('../src/models/Asset');

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/equippeer';
    console.log('Connecting to MongoDB at:', mongoUri);
    await mongoose.connect(mongoUri);

    const salt = await bcrypt.genSalt(10);
    const commonPassword = await bcrypt.hash('123456', salt);
    const adminPassword = await bcrypt.hash('admin123', salt);

    console.log('Creating users...');

    const usersData = [
      {
        name: 'System Administrator',
        email: 'admin@equippeer.vn',
        password: adminPassword,
        role: 'admin',
        isProfileCompleted: true,
        isPhoneVerified: true,
        phoneNumber: '0901111111'
      },
      {
        name: 'Lê Văn Inspector',
        email: 'inspector1@equippeer.vn',
        password: commonPassword,
        role: 'inspector',
        isProfileCompleted: true,
        isPhoneVerified: true,
        phoneNumber: '0902222222',
        address: {
          province: 'Thành phố Hồ Chí Minh',
          district: 'Quận 1',
          ward: 'Phường Bến Nghé',
          street: '123 Lê Duẩn',
          coordinates: { lat: 10.7801, lng: 106.6994 }
        }
      },
      {
        name: 'Nguyễn Văn Lender',
        email: 'lender1@equippeer.vn',
        password: commonPassword,
        role: 'lender',
        isProfileCompleted: true,
        isPhoneVerified: true,
        phoneNumber: '0903333333',
        lenderStatus: 'approved',
        lenderOnboarding: {
          cccdFront: 'https://images.unsplash.com/photo-1557804506-669a67965ba0',
          cccdBack: 'https://images.unsplash.com/photo-1557804506-669a67965ba0',
          cccdSelfie: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
          bankAccount: {
            accountNumber: '190345678901',
            bankName: 'Techcombank',
            accountHolder: 'NGUYEN VAN LENDER'
          }
        },
        address: {
          province: 'Thành phố Hồ Chí Minh',
          district: 'Quận 1',
          ward: 'Phường Phạm Ngũ Lão',
          street: '45 Bùi Viện',
          coordinates: { lat: 10.7674, lng: 106.6939 }
        }
      },
      {
        name: 'Trần Thị Camping',
        email: 'lender2@equippeer.vn',
        password: commonPassword,
        role: 'lender',
        isProfileCompleted: true,
        isPhoneVerified: true,
        phoneNumber: '0904444444',
        lenderStatus: 'approved',
        lenderOnboarding: {
          cccdFront: 'https://images.unsplash.com/photo-1557804506-669a67965ba0',
          cccdBack: 'https://images.unsplash.com/photo-1557804506-669a67965ba0',
          cccdSelfie: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2',
          bankAccount: {
            accountNumber: '0071001234567',
            bankName: 'Vietcombank',
            accountHolder: 'TRAN THI CAMPING'
          }
        },
        address: {
          province: 'Thành phố Hồ Chí Minh',
          district: 'Quận Bình Thạnh',
          ward: 'Phường 25',
          street: '280 Điện Biên Phủ',
          coordinates: { lat: 10.8012, lng: 106.7112 }
        }
      },
      {
        name: 'Phạm Văn Renter',
        email: 'renter1@equippeer.vn',
        password: commonPassword,
        role: 'renter',
        isProfileCompleted: true,
        isPhoneVerified: true,
        phoneNumber: '0905555555',
        renterStatus: 'approved',
        address: {
          province: 'Thành phố Hồ Chí Minh',
          district: 'Quận 3',
          ward: 'Phường 6',
          street: '150 Võ Văn Tần',
          coordinates: { lat: 10.7825, lng: 106.6852 }
        }
      }
    ];

    const usersMap = {};
    for (const u of usersData) {
      const userDoc = await User.findOneAndUpdate(
        { email: u.email },
        u,
        { upsert: true, new: true }
      );
      usersMap[u.email] = userDoc._id;
      console.log(`- Created/Updated user: ${userDoc.name} (${userDoc.email}) - Role: ${userDoc.role}`);
    }

    console.log('\nCreating rental assets...');

    const assetsData = [
      {
        lender: usersMap['lender1@equippeer.vn'],
        name: 'Lều cắm trại 4 người Naturehike P-Series chống nước',
        description: 'Lều 2 lớp chính hãng Naturehike chống mưa bão 3000mm. Kèm cọc gia cố và dây chằng chống gió. Rất thích hợp cho nhóm 3-4 người đi cắm trại dã ngoại cuối tuần.',
        category: 'Camping',
        condition: 'Mới 95%',
        originalPrice: 2200000,
        purchaseYear: 2024,
        itemConditionRate: 95,
        depositCalculationMode: 'fixed',
        pricePerDay: 150000,
        depositAmount: 1200000,
        status: 'verified',
        images: [
          'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4',
          'https://images.unsplash.com/photo-1478827536114-da961b7f86d2',
          'https://images.unsplash.com/photo-1510312305653-8ed496efae75',
          'https://images.unsplash.com/photo-1526772662000-3f88f10405ff',
          'https://images.unsplash.com/photo-1517824806704-9040b037703b'
        ],
        badges: ['Đã kiểm định tận nơi', 'Chính chủ 100%'],
        location: {
          lat: 10.7674,
          lng: 106.6939,
          addressString: '45 Bùi Viện, Phường Phạm Ngũ Lão, Quận 1, TP.HCM'
        }
      },
      {
        lender: usersMap['lender1@equippeer.vn'],
        name: 'Bếp dã ngoại gấp gọn Namilux + Bộ nồi inox dã ngoại 4 món',
        description: 'Bộ bếp ga mini dã ngoại chắn gió kèm bộ nồi chảo nhôm anodizing siêu nhẹ, chống dính cho nhóm 2-4 người nấu ăn ngoài trời.',
        category: 'Camping',
        condition: 'Mới 90%',
        originalPrice: 950000,
        purchaseYear: 2024,
        itemConditionRate: 90,
        depositCalculationMode: 'fixed',
        pricePerDay: 80000,
        depositAmount: 500000,
        status: 'verified',
        images: [
          'https://images.unsplash.com/photo-1534447677768-be436bb09401',
          'https://images.unsplash.com/photo-1508873696983-2df515122519',
          'https://images.unsplash.com/photo-1470246973918-29a93221c455',
          'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7',
          'https://images.unsplash.com/photo-1510312305653-8ed496efae75'
        ],
        badges: ['Chính chủ 100%'],
        location: {
          lat: 10.7674,
          lng: 106.6939,
          addressString: '45 Bùi Viện, Phường Phạm Ngũ Lão, Quận 1, TP.HCM'
        }
      },
      {
        lender: usersMap['lender2@equippeer.vn'],
        name: 'Balo dã ngoại trợ lực Osprey Atmos AG 65L (Size M/L)',
        description: 'Balo leo núi chuyên dụng đỉnh cao của Osprey với hệ thống lưng lưới AntiGravity cực thoáng khí. Dung tích 65L chứa đồ thoải mái cho chuyến leo núi 3-5 ngày.',
        category: 'Camping',
        condition: 'Mới 98%',
        originalPrice: 6500000,
        purchaseYear: 2025,
        itemConditionRate: 98,
        depositCalculationMode: 'fixed',
        pricePerDay: 180000,
        depositAmount: 3500000,
        status: 'verified',
        images: [
          'https://images.unsplash.com/photo-1553062407-98eeb64c6a62',
          'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3',
          'https://images.unsplash.com/photo-1508873696983-2df515122519',
          'https://images.unsplash.com/photo-1510312305653-8ed496efae75',
          'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4'
        ],
        badges: ['Đã kiểm định tận nơi', 'Chính chủ 100%'],
        location: {
          lat: 10.8012,
          lng: 106.7112,
          addressString: '280 Điện Biên Phủ, Phường 25, Quận Bình Thạnh, TP.HCM'
        }
      },
      {
        lender: usersMap['lender2@equippeer.vn'],
        name: 'Máy ảnh Mirrorless Sony A7 Mark III + Lens Sony FE 24-70mm F4',
        description: 'Máy ảnh Full-frame chụp ảnh & quay video 4K sắc nét. Kèm 2 pin zin, sạc đôi, thẻ nhớ SanDisk Extreme Pro 128GB tốc độ cao và túi đựng máy ảnh.',
        category: 'Tech',
        condition: 'Mới 95%',
        originalPrice: 38000000,
        purchaseYear: 2024,
        itemConditionRate: 95,
        depositCalculationMode: 'fixed',
        pricePerDay: 450000,
        depositAmount: 18000000,
        status: 'verified',
        images: [
          'https://images.unsplash.com/photo-1516035069371-29a1b244cc32',
          'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f',
          'https://images.unsplash.com/photo-1502920917128-1aa500764cbd',
          'https://images.unsplash.com/photo-1512790182412-b19e6d61b39a',
          'https://images.unsplash.com/photo-1495707902641-75cac588d2e9'
        ],
        badges: ['Đã kiểm định tận nơi', 'Chính chủ 100%'],
        location: {
          lat: 10.8012,
          lng: 106.7112,
          addressString: '280 Điện Biên Phủ, Phường 25, Quận Bình Thạnh, TP.HCM'
        }
      },
      {
        lender: usersMap['lender1@equippeer.vn'],
        name: 'Flycam DJI Mini 3 Pro (Combo Fly More + Tay cầm RC màn hình)',
        description: 'Flycam nhỏ gọn dưới 249g quay video 4K/60fps theo chiều dọc ấn tượng. Cảm biến tránh vật thể 3 hướng. Bộ combo gồm 3 pin (thời gian bay 34p/pin) + Hub sạc + Túi đựng.',
        category: 'Tech',
        condition: 'Mới 99%',
        originalPrice: 21500000,
        purchaseYear: 2025,
        itemConditionRate: 99,
        depositCalculationMode: 'fixed',
        pricePerDay: 350000,
        depositAmount: 10000000,
        status: 'verified',
        images: [
          'https://images.unsplash.com/photo-1508614589041-895b88991e3e',
          'https://images.unsplash.com/photo-1527977966376-1c8408f9f108',
          'https://images.unsplash.com/photo-1507582020474-9a35b7d455d9',
          'https://images.unsplash.com/photo-1473968512647-3e447244af8f',
          'https://images.unsplash.com/photo-1516035069371-29a1b244cc32'
        ],
        badges: ['Chính chủ 100%'],
        location: {
          lat: 10.7674,
          lng: 106.6939,
          addressString: '45 Bùi Viện, Phường Phạm Ngũ Lão, Quận 1, TP.HCM'
        }
      },
      {
        lender: usersMap['lender2@equippeer.vn'],
        name: 'Đèn lều cắm trại tích điện Goal Zero Lighthouse Micro Flash',
        description: 'Đèn cắm trại siêu nhỏ gọn chống nước IPX6. Tích hợp sạc cổng USB, chiếu sáng liên tục đến 170 giờ ở chế độ tiết kiệm.',
        category: 'Camping',
        condition: 'Mới 100%',
        originalPrice: 850000,
        purchaseYear: 2025,
        itemConditionRate: 100,
        depositCalculationMode: 'fixed',
        pricePerDay: 40000,
        depositAmount: 400000,
        status: 'verified',
        images: [
          'https://images.unsplash.com/photo-1510312305653-8ed496efae75',
          'https://images.unsplash.com/photo-1478827536114-da961b7f86d2',
          'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4',
          'https://images.unsplash.com/photo-1526772662000-3f88f10405ff',
          'https://images.unsplash.com/photo-1517824806704-9040b037703b'
        ],
        badges: ['Chính chủ 100%'],
        location: {
          lat: 10.8012,
          lng: 106.7112,
          addressString: '280 Điện Biên Phủ, Phường 25, Quận Bình Thạnh, TP.HCM'
        }
      }
    ];

    for (const a of assetsData) {
      const assetDoc = await Asset.findOneAndUpdate(
        { name: a.name },
        a,
        { upsert: true, new: true }
      );
      console.log(`- Created/Updated asset: ${assetDoc.name} (${assetDoc.category}) - ${assetDoc.pricePerDay.toLocaleString()}đ/ngày`);
    }

    console.log('\n✅ SEED DATA COMPLETED SUCCESSFULLY!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
