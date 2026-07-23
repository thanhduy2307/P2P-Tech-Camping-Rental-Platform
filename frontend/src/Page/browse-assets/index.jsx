import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../../configs/axios';

const BrowseAssets = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get('category') || '';
  const searchParam = searchParams.get('search') || '';
  const startDateParam = searchParams.get('startDate') || '';
  const endDateParam = searchParams.get('endDate') || '';

  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [coords, setCoords] = useState(null);
  const [locationLabel, setLocationLabel] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [maxRadius, setMaxRadius] = useState(''); // km, '' = no limit

  // Filter states
  const [selectedSubCategories, setSelectedSubCategories] = useState([]);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [sortBy, setSortBy] = useState('suggested');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  const [searchTerm, setSearchTerm] = useState(searchParam);
  const [startDate, setStartDate] = useState(startDateParam);
  const [endDate, setEndDate] = useState(endDateParam);

  useEffect(() => {
    setSearchTerm(searchParams.get('search') || '');
    setStartDate(searchParams.get('startDate') || '');
    setEndDate(searchParams.get('endDate') || '');
    setCurrentPage(1); // Reset page on query change
  }, [searchParams]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedSubCategories, minPrice, maxPrice, selectedBrand, onlyAvailable, sortBy, maxRadius]);


  const handleBrowseSearch = (e) => {
    if (e) e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (searchTerm.trim()) {
      newParams.set('search', searchTerm.trim());
    } else {
      newParams.delete('search');
    }
    if (startDate) {
      newParams.set('startDate', startDate);
    } else {
      newParams.delete('startDate');
    }
    if (endDate) {
      newParams.set('endDate', endDate);
    } else {
      newParams.delete('endDate');
    }
    setSearchParams(newParams);
  };

  // Geolocation helper
  const handleGetLocation = async () => {
    if (!navigator.geolocation) {
      setGpsError('Trình duyệt không hỗ trợ Geolocation.');
      return;
    }
    setGpsLoading(true);
    setGpsError('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });
        setGpsError(''); // clear any previous error on success
        // Reverse geocode
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=vi`
          );
          const data = await res.json();
          const addr = data.address || {};
          const short = [addr.quarter || addr.suburb, addr.city || addr.town || addr.county, addr.state]
            .filter(Boolean).join(', ');
          const label = short || data.display_name || `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`;
          setLocationLabel(label);
          window.dispatchEvent(new CustomEvent('location-updated', { detail: { lat: latitude, lng: longitude, addressLabel: label } }));
        } catch {
          setLocationLabel(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        }
        setGpsLoading(false);
      },
      (err) => {
        setGpsError('Không thể lấy vị trí. Vui lòng cấp quyền truy cập vị trí cho trình duyệt.');
        setGpsLoading(false);
      },
      { timeout: 10000 }
    );
  };

  const clearLocation = () => {
    setCoords(null);
    setLocationLabel('');
    setGpsError('');
    setMaxRadius('');
    if (sortBy === 'distance') setSortBy('suggested');
    window.dispatchEvent(new CustomEvent('location-updated', { detail: null }));
  };

  // Fetch assets from API
  useEffect(() => {
    const fetchAssets = async () => {
      setLoading(true);
      try {
        let url = '/assets';
        const params = {};
        if (coords) {
          params.lat = coords.lat;
          params.lng = coords.lng;
        }
        const response = await api.get(url, { params });
        if (response.data && response.data.success) {
          const mappedAssets = response.data.data.map(item => {
            const nameLower = (item.name || '').toLowerCase();
            const catLower = (item.category || '').toLowerCase();
            
            let category = 'Tech';
            if (catLower === 'camping' || ['lều', 'tent', 'bếp', 'dã ngoại', 'cắm trại', 'balo', 'túi ngủ', 'bàn', 'ghế'].some(kw => nameLower.includes(kw))) {
              category = 'Camping';
            }

            // Determine subcategory
            let subCategory = 'Khác';
            if (category === 'Camping') {
              if (['lều', 'tent', 'tăng', 'bạt', 'thảm', 'footprint', 'túi ngủ', 'đệm'].some(kw => nameLower.includes(kw))) {
                subCategory = 'Lều & Thảm dã ngoại';
              } else if (['bếp', 'nồi', 'chảo', 'stove', 'cook', 'gas', 'ấm', 'ly', 'chén', 'đĩa', 'vỉ nướng'].some(kw => nameLower.includes(kw))) {
                subCategory = 'Bếp & Dụng cụ nấu ăn';
              } else if (['bàn', 'ghế', 'table', 'chair', 'giường xếp'].some(kw => nameLower.includes(kw))) {
                subCategory = 'Bàn ghế dã ngoại';
              } else if (['đèn', 'pin', 'light', 'flashlight', 'đuốc'].some(kw => nameLower.includes(kw))) {
                subCategory = 'Đèn & Thiết bị chiếu sáng';
              } else if (['balo', 'backpack', 'túi', 'bag', 'rìu', 'dao', 'sinh tồn', 'hộp y tế'].some(kw => nameLower.includes(kw))) {
                subCategory = 'Balo & Đồ sinh tồn';
              } else {
                subCategory = 'Lều & Thảm dã ngoại';
              }
            } else {
              if (['máy ảnh', 'camera', 'lens', 'ống kính', 'gimbal', 'tripod', 'sony', 'canon', 'fuji', 'nikon'].some(kw => nameLower.includes(kw))) {
                subCategory = 'Máy ảnh & Ống kính';
              } else if (['flycam', 'drone', 'mavic', 'phantom', 'dji'].some(kw => nameLower.includes(kw))) {
                subCategory = 'Flycam & Drone';
              } else if (['loa', 'sound', 'speaker', 'tai nghe', 'headphone', 'micro', 'amp'].some(kw => nameLower.includes(kw))) {
                subCategory = 'Loa & Thiết bị âm thanh';
              } else if (['laptop', 'macbook', 'máy tính', 'pc', 'ram', 'ổ cứng', 'ssd'].some(kw => nameLower.includes(kw))) {
                subCategory = 'Laptop & Phụ kiện';
              } else if (['đèn', 'light', 'aputure', 'studio', 'softbox'].some(kw => nameLower.includes(kw))) {
                subCategory = 'Đèn Studio & Ánh sáng';
              } else {
                subCategory = 'Máy ảnh & Ống kính';
              }
            }

            return {
              ...item,
              category,
              subCategory
            };
          });
          setAssets(mappedAssets);
        }
      } catch (err) {
        console.error("Failed to fetch assets, using fallback mock data:", err);
        // Fallback mock data combining Tech & Camping premium gear from both templates
        setAssets([
          // --- TECH GEAR ---
          {
            _id: 'mock-1',
            name: 'Canon EOS R5 Body Camera w/ 24-70mm Lens',
            pricePerDay: 1200000,
            depositAmount: 15000000,
            category: 'Tech',
            subCategory: 'Máy ảnh & Ống kính',
            condition: 'New',
            status: 'verified',
            images: ['https://lh3.googleusercontent.com/aida/AP1WRLuITSCUq6N1VKUQNFKt0Lombzat2g9IMSWyJWaETVvgCJOGz981iyDFvon8eYhfjCRKX7-Biwv-9MB726Gj2di4ZZbl7NCyXPZc7Z5cquYXfgQ_72C8lPkxawPn_sAi2nW5zbaKLUkbVm6vKXYZuTk62fdlxH4RRL97Ass0aoHovzEmbX3p2spfJKqN3-RC9cnDUX0ycco1Mk7PuORIrSLKbuzX5h7PoSw_zlVF3RByNSfXYe9oG8Rhw5Y'],
            rating: 4.9,
            reviewsCount: 128,
            brand: 'Canon',
            description: 'Professional high-end mirrorless camera body w/ RF 24-70mm f/2.8L IS USM lens.'
          },
          {
            _id: 'mock-2',
            name: 'DJI Mavic 3 Cine Premium Combo',
            pricePerDay: 1500000,
            depositAmount: 20000000,
            category: 'Tech',
            subCategory: 'Flycam & Drone',
            condition: 'Excellent',
            status: 'verified',
            images: ['https://lh3.googleusercontent.com/aida-public/AB6AXuAuiA9qit7Eifbk2zYgqKFwGPG5rQpXmtPxKbVoOX4Hl2u4W6f0zYmBjnpXbodsagdIlGinEWcgopK8iAnbCkGcpf5iOBJyWDTN315NwpiFIe_6vhub9n3eXlHWfVBiwwK0Ze1AxTaLPxmKdZ305bYsl7n6uKInJ_bTLrtQ-MpZCk7Odcgq0vfCGzCYXISWTfpTZ-5yLmzFrDwVTA-EUR_RQfeNEw6hz6fx9Aybq6lQVdmad2bSK2SUIYa1Nw8ckb8MexoSiaWSyyic'],
            rating: 5.0,
            reviewsCount: 45,
            brand: 'DJI',
            description: 'Professional aerial cine drone with Hasselblad camera, support Apple ProRes.'
          },
          {
            _id: 'mock-3',
            name: 'Aputure LS 600d Pro Light Storm',
            pricePerDay: 800000,
            depositAmount: 8000000,
            category: 'Tech',
            subCategory: 'Đèn Studio & Ánh sáng',
            condition: 'Excellent',
            status: 'rented',
            images: ['https://lh3.googleusercontent.com/aida-public/AB6AXuBIQtDDhGw3gwTz--81gIAsBcRE6oW3J-gMClroqe74424KLoRgKpNhSpSzpB6FvQFCix4m6E2pLEhGiBtnY1JNk9DnwTrEE34ZCO0g9Ggnsa9wrtq_hcD69IUmTYcGq3fWsXdI9B1In8S5Hj7FseFMqb3vCU0NFtKm0JihLQFkkilqVL4K7kQR9u_5jgX6igjhaLDuh7jxEhHNRjCQwC4Voux2Ono-cOPb3AKUBhf4FKXauTV_Kiorlc_4s6vNEfd9zk3NgUWetWS3'],
            rating: 4.8,
            reviewsCount: 89,
            brand: 'Aputure',
            description: 'Powerful point-source LED light fixture for cinema studios.'
          },
          {
            _id: 'mock-4',
            name: 'MacBook Pro 16" M2 Max 64GB RAM',
            pricePerDay: 1800000,
            depositAmount: 30000000,
            category: 'Tech',
            subCategory: 'Laptop & Phụ kiện',
            condition: 'New',
            status: 'verified',
            images: ['https://lh3.googleusercontent.com/aida-public/AB6AXuCLKS2m-1T0yT7_jYQQ5Cn7Dz-ELxO28WKy4iEy9olekyTiRnwbQ8Qwli6xk8AwfeN6E-JhsrsmfSFlACywZeA8iXuterSvdRxRlMGFgEYI8WhvUWjMhXJZbVRuHjSZohcG3efzgDtMcwj8lJgF2qncMx8Kv6c8uNhGxJTbXRTyr6BztloO60wy-BDykrl1Ek07rS86ZfjN6vY-6nB9ZaPoKWr_vtRLXStE_pJgM1fGwRSN5X32tQzjAAeXfyNEyG9DxdbuppA18l1O'],
            rating: 5.0,
            reviewsCount: 21,
            brand: 'Apple',
            description: 'Ultimate rendering power notebook for on-site video editing.'
          },
          {
            _id: 'mock-5',
            name: 'Sony FE 70-200mm f/2.8 GM OSS II',
            pricePerDay: 900000,
            depositAmount: 10000000,
            category: 'Tech',
            subCategory: 'Máy ảnh & Ống kính',
            condition: 'Excellent',
            status: 'verified',
            images: ['https://lh3.googleusercontent.com/aida-public/AB6AXuCIxc7P42P3MDVYhkcjce6KgGa3rAJc1iFhTumiuIfbhAE6ONs8S0YFY95-JHzenxjzVJFszWSgm2UIN3_F7NQACRTTjS7N2T2taxf1iTq54CBPjs-t7iUk7SYStPtnXN581cJfHpkQTynEqZiTsYqoD32V9RgI0vy3pzxMH68EH48i5w8D2xjCF5F7qCmfxjzaF3uv0Xd31WVFy66iLxaW_QO_ap1PzbBchn8V7_-IzCYyotXPgOzK1MCXWWJaBMXaXb3KOTpWBdrE'],
            rating: 4.9,
            reviewsCount: 64,
            brand: 'Sony',
            description: 'High-performance telephoto zoom G Master lens.'
          },
          // --- CAMPING GEAR ---
          {
            _id: 'mock-6',
            name: 'Naturehike 4-Person Tent P-Series',
            pricePerDay: 120000,
            depositAmount: 1500000,
            category: 'Camping',
            subCategory: 'Lều & Thảm dã ngoại',
            condition: 'Excellent',
            status: 'verified',
            images: ['https://lh3.googleusercontent.com/aida/AP1WRLttSf7-B5XqE0wfVz566F_Ay0bXnEKE1Aryb6uRJkEQShT7TjBPz666fOu6YkYGdUk_ytO3G59UsDG9x91d2fwDWO-Da4-moisiS3EACYWM-T8KoYW3NW0bDE4GGc7y_wtba3bw5X5rIQB0MdmmGyYla3rpAKFnHhVWWYw4ShwxTQ5r31v-TVlXbhzekYNKyCpPync04zengdXXbK7dndZcwi6_IJiuz2Tv2v-emb-dkASCBCOIZbSZDH0W'],
            rating: 4.8,
            reviewsCount: 42,
            brand: 'Naturehike',
            description: 'Lightweight, waterproof, and spacious dome tent. Includes footprint.'
          },
          {
            _id: 'mock-7',
            name: 'Fire-Maple FMS-116T Titanium Stove',
            pricePerDay: 50000,
            depositAmount: 500000,
            category: 'Camping',
            subCategory: 'Bếp & Dụng cụ nấu ăn',
            condition: 'Excellent',
            status: 'verified',
            images: ['https://lh3.googleusercontent.com/aida-public/AB6AXuAYINd15UjJX5_5NclHoJV1hUeJ667GY9xcBXVUB8HkO6c_IKjmmgM_-6S4Yi0M2BCA66STqM-OaQ60EuiMsPAR99MIdPVS-iWKjpviKrn8XWBwdWYQqZ4qpOQCCkcntA15c1PKDGvxDcUtXuVB58RabppLLSCjGbxVhJqeiikrH5Gqxlkof5SVrFoxqgNmAv-GZ1K_fKmgC1Rg4RUcYsb1f42jIOlIhBeFAxb0xRujb21NZsB97WlRcT2oJwQ4ZOiOBdnXqg5aVH-k'],
            rating: 4.9,
            reviewsCount: 18,
            brand: 'Fire-Maple',
            description: 'Ultra-lightweight titanium mini gas stove. High heat output.'
          },
          {
            _id: 'mock-8',
            name: 'Osprey Atmos AG 65L Backpack',
            pricePerDay: 150000,
            depositAmount: 2500000,
            category: 'Camping',
            subCategory: 'Balo & Đồ sinh tồn',
            condition: 'Excellent',
            status: 'verified',
            images: ['https://lh3.googleusercontent.com/aida-public/AB6AXuDShvx4SWJ0EEuMstUV-jtCmqTpl9hiRel0vH0lJCrRKH89OpusNsdodb5nnmVwYesh1IZxSh5EADrk7FSEwgG7EER6AVFFpEniQ9QhbJemNDcT39BK91uHatIQVpPw2VWY4llppHJ24Q5gx13Kd11wyBNq9VbiquJkoA6FpenIjPe-jeETqTDkFi35E6gc9zVLXITtfhIunVmyD2q69P9iacqYgIdMsa6Hr4-LR-dnQeRnpGYVYKbN6lPMu12oGtcGK6wP6suIPDmb'],
            rating: 5.0,
            reviewsCount: 30,
            brand: 'Osprey',
            description: 'Features Anti-Gravity suspension system for incredible trail comfort. Includes rain cover.'
          },
          {
            _id: 'mock-9',
            name: 'Coleman 50-Quart Xtreme Cooler',
            pricePerDay: 80000,
            depositAmount: 1200000,
            category: 'Camping',
            subCategory: 'Bếp & Dụng cụ nấu ăn',
            condition: 'Excellent',
            status: 'verified',
            images: ['https://lh3.googleusercontent.com/aida-public/AB6AXuBdmOZM5CA2HeDNKRLrBtlukeC2ZPeQaD9IwjZYDu31OXkU9a_2Q0hr461avgm5IPHfLxw3R5sZwqcOCImouQ-aokVfJHglkwMgvq4S1z8kLjWLiHG9rUjFtN9reBpQNEFUTMzbdw8b2Pkrt8QfSaVrEpmRXHbKi_B2UrLewqynsf3W-9mtF_o6aQygD1W-oOc4oCrm6OqL3PCn79TtBJO3d2ys-ot-D53MotqMqV92nXh4kC4yY1YDuJbQlA605J6frPb9Y52E3SBq'],
            rating: 4.6,
            reviewsCount: 15,
            brand: 'Coleman',
            description: 'Keeps ice frozen up to 5 days. Heavy-duty construction.'
          }
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchAssets();
  }, [coords]);

  // Handle sidebar categories based on URL parameter
  const isCamping = categoryParam.toLowerCase() === 'camping';
  const isTech = categoryParam.toLowerCase() === 'tech';

  const filterSubcategories = isCamping
    ? ['Lều & Thảm dã ngoại', 'Bếp & Dụng cụ nấu ăn', 'Bàn ghế dã ngoại', 'Đèn & Thiết bị chiếu sáng', 'Balo & Đồ sinh tồn']
    : isTech
    ? ['Máy ảnh & Ống kính', 'Flycam & Drone', 'Loa & Thiết bị âm thanh', 'Laptop & Phụ kiện', 'Đèn Studio & Ánh sáng']
    : [
        'Lều & Thảm dã ngoại', 'Bếp & Dụng cụ nấu ăn', 'Bàn ghế dã ngoại', 'Đèn & Thiết bị chiếu sáng', 'Balo & Đồ sinh tồn',
        'Máy ảnh & Ống kính', 'Flycam & Drone', 'Loa & Thiết bị âm thanh', 'Laptop & Phụ kiện', 'Đèn Studio & Ánh sáng'
      ];

  const filterBrands = isCamping
    ? ['Naturehike', 'Fire-Maple', 'Coleman', 'Decathlon', 'Osprey']
    : isTech
    ? ['Sony', 'Canon', 'DJI', 'Aputure', 'Apple']
    : ['Sony', 'Canon', 'DJI', 'Aputure', 'Apple', 'Naturehike', 'Fire-Maple', 'Coleman', 'Decathlon', 'Osprey'];

  // Reset selected subcategories on main category parameter change
  useEffect(() => {
    setSelectedSubCategories([]);
    setSelectedBrand('');
  }, [categoryParam]);

  const handleSubCategoryChange = (subCat) => {
    const normalized = subCat.toLowerCase();
    if (selectedSubCategories.includes(normalized)) {
      setSelectedSubCategories(selectedSubCategories.filter(s => s !== normalized));
    } else {
      setSelectedSubCategories([...selectedSubCategories, normalized]);
    }
  };

  const selectBrandFilter = (brandName) => {
    if (selectedBrand.toLowerCase() === brandName.toLowerCase()) {
      setSelectedBrand('');
    } else {
      setSelectedBrand(brandName);
    }
  };

  // Filters calculation
  const filteredAssets = assets
    .filter(item => {
      // Main Category parameter filter
      if (categoryParam) {
        return item.category.toLowerCase() === categoryParam.toLowerCase();
      }
      return true;
    })
    .filter(item => {
      // Search keyword filter
      if (searchParam) {
        const term = searchParam.toLowerCase();
        return (
          item.name.toLowerCase().includes(term) ||
          (item.description && item.description.toLowerCase().includes(term)) ||
          item.category.toLowerCase().includes(term) ||
          (item.subCategory && item.subCategory.toLowerCase().includes(term))
        );
      }
      return true;
    })
    .filter(item => {
      // Subcategories filters
      if (selectedSubCategories.length > 0) {
        const itemSubCat = (item.subCategory || '').toLowerCase();
        // Check exact match or keyword match
        const hasMatch = selectedSubCategories.some(sub => {
          if (itemSubCat === sub) return true;
          // Fallbacks for descriptions/names
          if (sub === 'lều & thảm dã ngoại' && (item.name.toLowerCase().includes('tent') || item.name.toLowerCase().includes('lều'))) return true;
          if (sub === 'bếp & dụng cụ nấu ăn' && (item.name.toLowerCase().includes('stove') || item.name.toLowerCase().includes('bếp') || item.name.toLowerCase().includes('nồi') || item.name.toLowerCase().includes('cook') || item.name.toLowerCase().includes('cooking') || item.name.toLowerCase().includes('cookware') || item.name.toLowerCase().includes('bát') || item.name.toLowerCase().includes('đĩa'))) return true;
          if (sub === 'bàn ghế dã ngoại' && (item.name.toLowerCase().includes('bàn') || item.name.toLowerCase().includes('ghế') || item.name.toLowerCase().includes('table') || item.name.toLowerCase().includes('chair') || item.name.toLowerCase().includes('furniture'))) return true;
          if (sub === 'đèn & thiết bị chiếu sáng' && (item.name.toLowerCase().includes('đèn') || item.name.toLowerCase().includes('light') || item.name.toLowerCase().includes('flashlight') || item.name.toLowerCase().includes('lighting'))) return true;
          if (sub === 'balo & đồ sinh tồn' && (item.name.toLowerCase().includes('backpack') || item.name.toLowerCase().includes('balo') || item.name.toLowerCase().includes('túi') || item.name.toLowerCase().includes('bag') || item.name.toLowerCase().includes('survival'))) return true;
          if (sub === 'máy ảnh & ống kính' && (item.name.toLowerCase().includes('camera') || item.name.toLowerCase().includes('máy ảnh') || item.name.toLowerCase().includes('lens') || item.name.toLowerCase().includes('cameras'))) return true;
          if (sub === 'flycam & drone' && (item.name.toLowerCase().includes('drone') || item.name.toLowerCase().includes('flycam') || item.name.toLowerCase().includes('mavic'))) return true;
          if (sub === 'loa & thiết bị âm thanh' && (item.name.toLowerCase().includes('loa') || item.name.toLowerCase().includes('speaker') || item.name.toLowerCase().includes('sound') || item.name.toLowerCase().includes('audio') || item.name.toLowerCase().includes('mic'))) return true;
          if (sub === 'laptop & phụ kiện' && (item.name.toLowerCase().includes('laptop') || item.name.toLowerCase().includes('macbook') || item.name.toLowerCase().includes('máy tính') || item.name.toLowerCase().includes('pc'))) return true;
          if (sub === 'đèn studio & ánh sáng' && (item.name.toLowerCase().includes('aputure') || item.name.toLowerCase().includes('softbox') || item.name.toLowerCase().includes('light') || item.name.toLowerCase().includes('đèn') || item.name.toLowerCase().includes('studio') || item.name.toLowerCase().includes('lights'))) return true;
          return false;
        });
        return hasMatch;
      }
      return true;
    })
    .filter(item => {
      // Min price
      if (minPrice !== '' && !isNaN(minPrice)) {
        if (item.pricePerDay < parseInt(minPrice)) return false;
      }
      // Max price
      if (maxPrice !== '' && !isNaN(maxPrice)) {
        if (item.pricePerDay > parseInt(maxPrice)) return false;
      }
      return true;
    })
    .filter(item => {
      // Brand
      if (selectedBrand) {
        return item.brand && item.brand.toLowerCase() === selectedBrand.toLowerCase();
      }
      return true;
    })
    .filter(item => {
      // Availability
      if (onlyAvailable) {
        return item.status === 'verified';
      }
      return true;
    })
    .filter(item => {
      // Radius filter
      if (maxRadius && coords && item.distance != null) {
        return item.distance <= parseFloat(maxRadius);
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'distance') {
        // Nearest first; no-distance items go to end
        if (a.distance == null && b.distance == null) return 0;
        if (a.distance == null) return 1;
        if (b.distance == null) return -1;
        return a.distance - b.distance;
      }
      if (sortBy === 'price_asc') return a.pricePerDay - b.pricePerDay;
      if (sortBy === 'price_desc') return b.pricePerDay - a.pricePerDay;
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      return 0;
    });

  const totalPages = Math.ceil(filteredAssets.length / itemsPerPage);
  const paginatedAssets = filteredAssets.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Sidebar Filters */}
      <aside className="w-full lg:w-64 shrink-0 space-y-6">
        {/* Mobile Filter Toggle (Visually hidden on desktop) */}
        <button className="lg:hidden w-full flex justify-between items-center bg-white border border-outline-variant p-4 rounded-lg font-title-md text-title-md shadow-sm">
          Filters
          <span className="material-symbols-outlined">tune</span>
        </button>

        <div className="hidden lg:block space-y-8 bg-white p-6 rounded-xl border border-outline-variant shadow-sm">
          {/* Breadcrumbs inside sidebar */}
          <nav aria-label="Breadcrumb" className="flex text-sm text-on-surface-variant mb-6 font-body-md border-b border-outline-variant/30 pb-4">
            <ol className="inline-flex items-center space-x-1">
              <li className="inline-flex items-center">
                <Link to="/" className="inline-flex items-center hover:text-primary transition-colors text-xs font-semibold">
                  <span className="material-symbols-outlined text-[16px] mr-1">home</span>
                  Home
                </Link>
              </li>
              <li>
                <div className="flex items-center">
                  <span className="material-symbols-outlined text-[14px] mx-0.5">chevron_right</span>
                  <span className="text-on-surface font-bold text-xs">
                    {isCamping ? 'Camping Gear' : isTech ? 'Tech Gear' : 'All Gear'}
                  </span>
                </div>
              </li>
            </ol>
          </nav>

          {/* ── Location Filter ── */}
          <div className="space-y-3">
            <h3 className="font-title-md text-title-md text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-primary">location_on</span>
              Tìm gần tôi
            </h3>

            {!coords ? (
              <button
                id="btn-get-location"
                type="button"
                onClick={handleGetLocation}
                disabled={gpsLoading}
                className="w-full flex items-center justify-center gap-2 bg-primary text-white text-xs font-bold py-2.5 px-3 rounded-lg hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-60"
              >
                {gpsLoading ? (
                  <><span className="material-symbols-outlined text-sm animate-spin">autorenew</span>Đang xác định...</>
                ) : (
                  <><span className="material-symbols-outlined text-sm">my_location</span>Lấy vị trí của tôi</>
                )}
              </button>
            ) : (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 space-y-2">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-primary text-sm mt-0.5">place</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-primary uppercase tracking-wide">Vị trí hiện tại</p>
                    <p className="text-xs text-slate-700 leading-tight mt-0.5 line-clamp-2">{locationLabel || 'Đã xác định'}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={clearLocation}
                  className="text-[10px] text-red-500 hover:text-red-600 font-semibold flex items-center gap-0.5"
                >
                  <span className="material-symbols-outlined text-xs">close</span>
                  Xóa vị trí
                </button>
              </div>
            )}

            {gpsError && !coords && (
              <p className="text-[10px] text-red-500 font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">warning</span>
                {gpsError}
              </p>
            )}

            {/* Radius filter */}
            {coords && (
              <div className="space-y-1">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Bán kính tìm kiếm</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {['', '5', '10', '20', '50'].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => { setMaxRadius(r); if (r) setSortBy('distance'); }}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-colors ${
                        maxRadius === r
                          ? 'bg-primary text-white border-primary'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-primary hover:text-primary'
                      }`}
                    >
                      {r ? `≤ ${r} km` : 'Tất cả'}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <hr className="border-outline-variant" />
          <div>
            <h3 className="font-title-md text-title-md text-on-surface mb-4">Danh mục</h3>
            <div className="space-y-3">
              {filterSubcategories.map(subCat => {
                const normalized = subCat.toLowerCase();
                const isChecked = selectedSubCategories.includes(normalized);

                return (
                  <label key={subCat} className="flex items-center cursor-pointer group">
                    <input 
                      checked={isChecked}
                      onChange={() => handleSubCategoryChange(subCat)}
                      className="peer sr-only" 
                      type="checkbox"
                    />
                    <div className={`w-5 h-5 border-2 border-outline-variant rounded flex items-center justify-center mr-3 transition-colors peer-focus:ring-2 peer-focus:ring-primary/50 ${isChecked ? 'bg-primary border-primary' : ''}`}>
                      <svg className={`w-3 h-3 text-white pointer-events-none ${isChecked ? 'block' : 'hidden'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3"></path>
                      </svg>
                    </div>
                    <span className="font-body-md text-on-surface group-hover:text-primary transition-colors">{subCat}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <hr className="border-outline-variant" />

          {/* Price Range Filter */}
          <div>
            <h3 className="font-title-md text-title-md text-on-surface mb-4">Giá thuê / ngày (VNĐ)</h3>
            <div className="flex gap-2 mb-3">
              <input 
                className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary text-sm" 
                placeholder="Từ" 
                type="text"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
              <span className="text-on-surface-variant flex items-center">-</span>
              <input 
                className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary text-sm" 
                placeholder="Đến" 
                type="text"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>
          </div>

          <hr className="border-outline-variant" />

          {/* Brand Filter */}
          <div>
            <h3 className="font-title-md text-title-md text-on-surface mb-4">Thương hiệu</h3>
            <div className="space-y-3">
              {filterBrands.map(brand => {
                const isSelected = selectedBrand.toLowerCase() === brand.toLowerCase();

                return (
                  <label key={brand} className="flex items-center cursor-pointer group">
                    <input 
                      checked={isSelected}
                      onChange={() => selectBrandFilter(brand)}
                      className="peer sr-only" 
                      type="checkbox"
                    />
                    <div className={`w-5 h-5 border-2 border-outline-variant rounded flex items-center justify-center mr-3 transition-colors peer-focus:ring-2 peer-focus:ring-primary/50 ${isSelected ? 'bg-primary border-primary' : ''}`}>
                      <svg className={`w-3 h-3 text-white pointer-events-none ${isSelected ? 'block' : 'hidden'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3"></path>
                      </svg>
                    </div>
                    <span className="font-body-md text-on-surface group-hover:text-primary transition-colors">{brand}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <hr className="border-outline-variant" />

          {/* Availability Toggle */}
          <div className="pt-2">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-body-md font-body-md text-on-surface-variant">Sẵn sàng ngay</span>
              <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                <input 
                  checked={onlyAvailable}
                  onChange={() => setOnlyAvailable(!onlyAvailable)}
                  className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 border-surface-variant appearance-none cursor-pointer transition-transform duration-200 ease-in-out" 
                  id="toggle-availability-camping" 
                  type="checkbox"
                />
                <label 
                  className={`toggle-label block overflow-hidden h-5 rounded-full cursor-pointer ${onlyAvailable ? 'bg-primary-container' : 'bg-outline-variant'}`}
                  htmlFor="toggle-availability-camping"
                ></label>
              </div>
            </label>
          </div>
        </div>
      </aside>

      {/* Product Grid Area */}
      <div className="flex-1">
        {/* Search & Date widget at the top of browse page */}
        <form onSubmit={handleBrowseSearch} className="bg-white border border-outline-variant/60 rounded-xl p-4 mb-6 shadow-sm flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 w-full flex items-center bg-surface rounded-lg px-3 py-2 border border-outline-variant/50 focus-within:border-primary">
            <span className="material-symbols-outlined text-outline mr-2 text-sm">search</span>
            <input 
              className="w-full bg-transparent border-none focus:outline-none text-sm text-on-surface placeholder-outline" 
              placeholder="Bạn muốn thuê gì?" 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex-[1.2] w-full flex gap-2">
            <div className="flex-1 flex items-center bg-surface rounded-lg px-2 py-1.5 border border-outline-variant/50 focus-within:border-primary relative">
              <span className="material-symbols-outlined text-outline mr-1.5 text-xs">calendar_today</span>
              <div className="flex flex-col flex-1 min-w-0 text-left">
                <span className="text-[8px] text-outline font-semibold uppercase leading-none">Ngày thuê</span>
                <input 
                  className="w-full bg-transparent border-none focus:outline-none text-[11px] text-on-surface cursor-pointer mt-0.5" 
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
            </div>
            <div className="flex-1 flex items-center bg-surface rounded-lg px-2 py-1.5 border border-outline-variant/50 focus-within:border-primary relative">
              <span className="material-symbols-outlined text-outline mr-1.5 text-xs">event_upcoming</span>
              <div className="flex flex-col flex-1 min-w-0 text-left">
                <span className="text-[8px] text-outline font-semibold uppercase leading-none">Ngày trả</span>
                <input 
                  className="w-full bg-transparent border-none focus:outline-none text-[11px] text-on-surface cursor-pointer mt-0.5" 
                  type="date"
                  min={startDate || new Date().toISOString().split('T')[0]}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>
          <button type="submit" className="w-full md:w-auto bg-primary text-white hover:bg-primary/95 transition-all font-title-md font-semibold px-6 py-2 rounded-lg shadow-sm whitespace-nowrap flex items-center justify-center gap-1.5 text-sm">
            <span>Tìm kiếm</span>
            <span className="material-symbols-outlined text-sm">search</span>
          </button>
        </form>

        {/* Header content */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">
              {isCamping ? 'Thiết Bị Cắm Trại & Dã Ngoại' : isTech ? 'Thiết Bị Công Nghệ Chuyên Nghiệp' : 'Tất Cả Thiết Bị Cho Thuê'}
            </h1>
            <p className="text-on-surface-variant mt-2 max-w-2xl font-body-md">
              {isCamping 
                ? 'Khám phá lều chất lượng cao, dụng cụ nấu ăn dã ngoại và đồ dùng sinh tồn sẵn sàng cho thuê.'
                : 'Khám phá máy ảnh chuyên nghiệp, flycam quay phim và laptop cấu hình khủng phục vụ sáng tạo.'}
            </p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
            <label className="text-sm font-medium text-on-surface-variant whitespace-nowrap" htmlFor="sort-select">Sort by:</label>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white border border-outline-variant text-on-surface text-sm rounded-lg focus:ring-[#3B82F6] focus:border-[#3B82F6] block w-full p-2.5 shadow-sm cursor-pointer"
            >
              <option value="suggested">Recommended</option>
              {coords && <option value="distance">Gần nhất</option>}
              <option value="price_asc">Price Low to High</option>
              <option value="price_desc">Price High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-lg text-on-surface-variant">Đang tải thiết bị cắm trại...</p>
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-outline-variant/40 shadow-sm">
            <span className="material-symbols-outlined text-outline text-5xl mb-4">info</span>
            <p className="text-lg text-on-surface-variant">Không tìm thấy thiết bị nào khớp với bộ lọc.</p>
          </div>
        ) : (
          /* Products Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {paginatedAssets.map(item => {
              const priceVND = (item.pricePerDay >= 1000000) 
                ? `${(item.pricePerDay / 1000000).toFixed(1)}tr` 
                : `${(item.pricePerDay / 1000).toFixed(0)}k`;
                
              const isAvailable = item.status === 'verified';
              const categoryIcon = item.category.toLowerCase() === 'camping' ? 'camping' : 'photo_camera';

              return (
                <div 
                  key={item._id} 
                  className="product-card rounded-xl overflow-hidden flex flex-col h-full group"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-surface-container-low">
                    <img
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      src={item.images && item.images.length > 0 ? item.images[0] : 'https://placehold.co/400x300?text=No+Image'}
                    />

                    <div className="absolute top-3 right-3 bg-surface/90 backdrop-blur-sm text-on-surface px-2 py-1 rounded font-label-sm text-label-sm border border-outline-variant shadow-sm flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">{categoryIcon}</span> {item.category}
                    </div>

                    {isAvailable && (
                      <div className="absolute top-3 left-3 bg-primary-container/90 text-on-primary-container px-2 py-1 rounded-full font-label-sm text-[10px] uppercase font-bold tracking-wider shadow-sm backdrop-blur-sm">
                        Available Now
                      </div>
                    )}

                    {/* Distance badge */}
                    {item.distance != null && (
                      <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-sm text-white px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 shadow">
                        <span className="material-symbols-outlined text-[11px] text-teal-400">near_me</span>
                        {item.distance < 1 ? `${Math.round(item.distance * 1000)} m` : `${item.distance.toFixed(1)} km`}
                      </div>
                    )}
                  </div>

                  <div className="p-4 flex flex-col flex-grow">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-title-md text-[18px] text-on-surface leading-tight font-semibold line-clamp-2 pr-2">
                        <Link to={`/assets/${item._id}?startDate=${startDate}&endDate=${endDate}`} className="hover:text-primary transition-colors">
                          {item.name}
                        </Link>
                      </h3>
                      <div className="flex items-center text-primary-container shrink-0">
                        <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        <span className="font-label-sm text-on-surface ml-1">{item.rating || '5.0'}</span>
                      </div>
                    </div>
                    
                    <p className="text-on-surface-variant font-body-md text-sm mb-4 line-clamp-2">
                      {item.description || 'Thiết bị cao cấp được kiểm duyệt chất lượng kỹ càng, đảm bảo an tâm khi sử dụng.'}
                    </p>

                    <div className="mt-auto flex items-end justify-between pt-4 border-t border-outline-variant/50">
                      <div>
                        <span className="text-xs text-on-surface-variant block mb-0.5 font-label-sm uppercase tracking-wider">Giá thuê</span>
                        <span className="font-title-md text-xl text-on-surface font-bold">
                          {priceVND}<span className="text-sm font-normal text-on-surface-variant"> / ngày</span>
                        </span>
                      </div>
                      
                      {isAvailable ? (
                        <Link 
                          to={`/assets/${item._id}?startDate=${startDate}&endDate=${endDate}`} 
                          className="bg-primary-container text-on-primary px-4 py-2 rounded-lg font-title-md text-sm hover:bg-primary-container/90 active:scale-95 transition-all shadow-sm flex items-center gap-1"
                        >
                          Thuê Ngay
                        </Link>
                      ) : (
                        <button className="bg-surface-container-high text-on-surface-variant px-4 py-2 rounded-lg font-title-md text-sm cursor-not-allowed">
                          Hết Hàng
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-12 mb-8">
            <nav aria-label="Pagination" className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              
              {[...Array(totalPages)].map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentPage(idx + 1)}
                  className={`w-10 h-10 flex items-center justify-center rounded-lg font-title-md text-sm transition-colors ${
                    currentPage === idx + 1
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'text-on-surface hover:bg-surface-container'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrowseAssets;
