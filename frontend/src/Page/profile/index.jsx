import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import api from '../../configs/axios';
import { loginSuccess, updateProfile } from '../../redux/authSlice';

const Profile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const { user: reduxUser } = useSelector((state) => state.auth);

  // Profile data state
  const [user, setUser] = useState(reduxUser || null);
  const [balance, setBalance] = useState(0);
  
  // Loading & Messages
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  
  // Edit Profile Form State
  const [isEditing, setIsEditing] = useState(false);
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [street, setStreet] = useState('');
  const [ward, setWard] = useState('');
  const [district, setDistrict] = useState('');
  const [province, setProvince] = useState('');
  
  // Location API States
  const [provincesList, setProvincesList] = useState([]);
  const [districtsList, setDistrictsList] = useState([]);
  const [wardsList, setWardsList] = useState([]);
  const [selectedProvinceCode, setSelectedProvinceCode] = useState('');
  const [selectedDistrictCode, setSelectedDistrictCode] = useState('');

  const [profileBankName, setProfileBankName] = useState('');
  const [profileAccountNumber, setProfileAccountNumber] = useState('');
  const [profileAccountHolder, setProfileAccountHolder] = useState('');

  // Withdrawal Form State
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [useSavedBank, setUseSavedBank] = useState(true);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState('');
  const [withdrawError, setWithdrawError] = useState('');

  const [withdrawals, setWithdrawals] = useState([]);
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(false);
  const [receiptLightbox, setReceiptLightbox] = useState({ open: false, url: '' });

  // Transactions history state
  const [transactions, setTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  const fetchWithdrawals = async () => {
    if (!token) return;
    setLoadingWithdrawals(true);
    try {
      const response = await api.get('/auth/my-withdrawals');
      if (response.data && response.data.success) {
        setWithdrawals(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching withdrawals:', err);
    } finally {
      setLoadingWithdrawals(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
    fetchTransactions();
  }, [token]);

  const fetchTransactions = async () => {
    if (!token) return;
    setLoadingTransactions(true);
    try {
      const response = await api.get('/auth/my-transactions');
      if (response.data && response.data.success) {
        setTransactions(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoadingTransactions(false);
    }
  };

  // Fetch full fresh profile on load
  useEffect(() => {
    const fetchFreshProfile = async () => {
      if (!token) return;
      try {
        const response = await api.get('/auth/me');
        if (response.data && response.data.success) {
          const freshUser = response.data.data;
          setUser(freshUser);
          dispatch(updateProfile(freshUser));
          
          // Populate form fields
          setEmail(freshUser.email || '');
          setPhoneNumber(freshUser.phoneNumber || '');
          if (freshUser.address) {
            setStreet(freshUser.address.street || '');
            setWard(freshUser.address.ward || '');
            setDistrict(freshUser.address.district || '');
            setProvince(freshUser.address.province || '');
          }
          if (freshUser.bankAccount) {
            setProfileBankName(freshUser.bankAccount.bankName || '');
            setProfileAccountNumber(freshUser.bankAccount.accountNumber || '');
            setProfileAccountHolder(freshUser.bankAccount.accountHolder || '');
            
            // Populate withdrawal defaults
            setBankName(freshUser.bankAccount.bankName || '');
            setAccountNumber(freshUser.bankAccount.accountNumber || '');
            setAccountHolder(freshUser.bankAccount.accountHolder || '');
            setUseSavedBank(true);
          } else {
            setUseSavedBank(false);
          }
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
      }
    };

    fetchFreshProfile();
  }, [token, dispatch]);

  // Fetch Provinces on Edit
  useEffect(() => {
    if (isEditing && provincesList.length === 0) {
      axios.get('https://provinces.open-api.vn/api/p/')
        .then(res => setProvincesList(res.data))
        .catch(err => console.error(err));
    }
  }, [isEditing]);

  // Auto-select existing address when entering Edit Mode
  useEffect(() => {
    if (isEditing && provincesList.length > 0 && province && !selectedProvinceCode) {
      const prov = provincesList.find(p => p.name.includes(province) || province.includes(p.name));
      if (prov) {
        setSelectedProvinceCode(prov.code);
        setProvince(prov.name);
        axios.get(`https://provinces.open-api.vn/api/p/${prov.code}?depth=2`)
          .then(res => {
            setDistrictsList(res.data.districts);
            if (district) {
              const dist = res.data.districts.find(d => d.name.includes(district) || district.includes(d.name));
              if (dist) {
                setSelectedDistrictCode(dist.code);
                setDistrict(dist.name);
                axios.get(`https://provinces.open-api.vn/api/d/${dist.code}?depth=2`)
                  .then(res2 => {
                    setWardsList(res2.data.wards);
                    if (ward) {
                      const w = res2.data.wards.find(w => w.name.includes(ward) || ward.includes(w.name));
                      if (w) setWard(w.name);
                    }
                  })
                  .catch(err => console.error(err));
              }
            }
          })
          .catch(err => console.error(err));
      }
    }
  }, [isEditing, provincesList]);

  const handleProvinceChange = (e) => {
    const code = e.target.value;
    setSelectedProvinceCode(code);
    const selectedProv = provincesList.find(p => p.code == code);
    setProvince(selectedProv ? selectedProv.name : '');
    setDistrict('');
    setWard('');
    setSelectedDistrictCode('');
    setDistrictsList([]);
    setWardsList([]);
    
    if (code) {
      axios.get(`https://provinces.open-api.vn/api/p/${code}?depth=2`)
        .then(res => setDistrictsList(res.data.districts))
        .catch(err => console.error(err));
    }
  };

  const handleDistrictChange = (e) => {
    const code = e.target.value;
    setSelectedDistrictCode(code);
    const selectedDist = districtsList.find(d => d.code == code);
    setDistrict(selectedDist ? selectedDist.name : '');
    setWard('');
    setWardsList([]);

    if (code) {
      axios.get(`https://provinces.open-api.vn/api/d/${code}?depth=2`)
        .then(res => setWardsList(res.data.wards))
        .catch(err => console.error(err));
    }
  };

  const handleWardChange = (e) => {
    setWard(e.target.value);
  };


  // Fetch wallet balance
  useEffect(() => {
    const fetchBalance = async () => {
      if (!token) return;
      try {
        const response = await api.get('/auth/balance');
        if (response.data && response.data.success) {
          setBalance(response.data.data.balance || 0);
        }
      } catch (err) {
        console.error('Error fetching balance:', err);
      }
    };

    fetchBalance();
  }, [token]);

  // Switch role handler
  const handleSwitchRole = async () => {
    try {
      setLoadingProfile(true);
      setProfileError('');
      setProfileSuccess('');
      const response = await api.put('/auth/switch-role', { targetRole: user?.role === 'renter' ? 'lender' : 'renter' });
      if (response.data && response.data.success) {
        const { token: newToken, role: newRole, ...userData } = response.data.data;
        dispatch(loginSuccess({
          token: newToken,
          role: newRole,
          user: userData
        }));
        setUser(userData);
        setProfileSuccess(`Chuyển vai trò sang ${newRole === 'lender' ? 'Người cho thuê (Lender)' : 'Người đi thuê (Renter)'} thành công!`);
        
        // Redirect based on role
        if (newRole === 'lender') {
          navigate('/dashboard-lender');
        } else {
          navigate('/');
        }
      }
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.message) {
        setProfileError(err.response.data.message);
      } else {
        setProfileError('Không thể chuyển đổi vai trò. Vui lòng kiểm tra trạng thái eKYC.');
      }
    } finally {
      setLoadingProfile(false);
    }
  };

  // Handle avatar image change
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setProfileError('Kích thước ảnh đại diện không được vượt quá 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64String = reader.result;
      setLoadingProfile(true);
      setProfileError('');
      setProfileSuccess('');
      try {
        const response = await api.put('/auth/update-avatar', { avatar: base64String });
        if (response.data && response.data.success) {
          const updatedUser = response.data.data;
          dispatch(updateProfile({ avatar: updatedUser.avatar }));
          setUser(prev => ({ ...prev, avatar: updatedUser.avatar }));
          setProfileSuccess('Cập nhật ảnh đại diện thành công!');
        }
      } catch (err) {
        console.error(err);
        if (err.response && err.response.data && err.response.data.message) {
          setProfileError(err.response.data.message);
        } else {
          setProfileError('Đã xảy ra lỗi khi cập nhật ảnh đại diện.');
        }
      } finally {
        setLoadingProfile(false);
      }
    };
    reader.onerror = (error) => {
      console.error('Error reading file:', error);
      setProfileError('Không thể đọc file ảnh.');
    };
  };

  // Save profile changes
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoadingProfile(true);
    setProfileError('');
    setProfileSuccess('');

    if (!phoneNumber) {
      setProfileError('Vui lòng nhập số điện thoại.');
      setLoadingProfile(false);
      return;
    }

    if (!street || !ward || !district || !province) {
      setProfileError('Vui lòng điền đầy đủ các thông tin địa chỉ.');
      setLoadingProfile(false);
      return;
    }

    try {
      const response = await api.put('/auth/complete-profile', {
        email,
        phoneNumber,
        address: {
          province,
          district,
          ward,
          street,
          coordinates: { lat: 11.9404, lng: 108.4373 } // Default Da Lat GPS coords
        },
        bankAccount: {
          bankName: profileBankName,
          accountNumber: profileAccountNumber,
          accountHolder: profileAccountHolder
        }
      });

      if (response.data && response.data.success) {
        const updatedUser = response.data.data;
        dispatch(loginSuccess({
          token: updatedUser.token,
          role: updatedUser.role,
          user: {
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            phoneNumber: updatedUser.phoneNumber,
            address: updatedUser.address,
            bankAccount: updatedUser.bankAccount,
            isProfileCompleted: updatedUser.isProfileCompleted,
            lenderStatus: updatedUser.lenderStatus,
            lenderOnboarding: updatedUser.lenderOnboarding
          }
        }));
        setUser(updatedUser);
        setIsEditing(false);
        setProfileSuccess('Cập nhật thông tin cá nhân và tài khoản ngân hàng thành công!');
        
        if (updatedUser.bankAccount) {
          setProfileBankName(updatedUser.bankAccount.bankName || '');
          setProfileAccountNumber(updatedUser.bankAccount.accountNumber || '');
          setProfileAccountHolder(updatedUser.bankAccount.accountHolder || '');
          
          setBankName(updatedUser.bankAccount.bankName || '');
          setAccountNumber(updatedUser.bankAccount.accountNumber || '');
          setAccountHolder(updatedUser.bankAccount.accountHolder || '');
          setUseSavedBank(true);
        }
      }
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.message) {
        setProfileError(err.response.data.message);
      } else {
        setProfileError('Đã xảy ra lỗi khi lưu thông tin. Vui lòng thử lại.');
      }
    } finally {
      setLoadingProfile(false);
    }
  };

  // Request withdrawal
  const handleWithdrawRequest = async (e) => {
    e.preventDefault();
    setWithdrawError('');
    setWithdrawSuccess('');
    setWithdrawLoading(true);

    const amount = Number(withdrawAmount);
    if (!amount || amount <= 0) {
      setWithdrawError('Số tiền rút phải lớn hơn 0.');
      setWithdrawLoading(false);
      return;
    }

    if (amount > balance) {
      setWithdrawError('Số dư ví khả dụng không đủ.');
      setWithdrawLoading(false);
      return;
    }

    const activeBankName = useSavedBank ? profileBankName : bankName;
    const activeAccountNumber = useSavedBank ? profileAccountNumber : accountNumber;
    const activeAccountHolder = useSavedBank ? profileAccountHolder : accountHolder;

    if (!activeBankName || !activeAccountNumber || !activeAccountHolder) {
      setWithdrawError('Vui lòng cung cấp đầy đủ thông tin tài khoản ngân hàng nhận tiền.');
      setWithdrawLoading(false);
      return;
    }

    try {
      const payload = {
        amount,
        bankAccount: {
          accountNumber: activeAccountNumber,
          bankName: activeBankName,
          accountHolder: activeAccountHolder
        }
      };

      const response = await api.post('/auth/withdraw', payload);
      if (response.data && response.data.success) {
        setWithdrawSuccess('Tạo yêu cầu rút tiền thành công! Số tiền đã rút đã được tạm đóng băng chờ Admin duyệt.');
        setBalance(prev => prev - amount);
        setWithdrawAmount('');
        setShowWithdrawForm(false);
        fetchWithdrawals();
      }
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.message) {
        setWithdrawError(err.response.data.message);
      } else {
        setWithdrawError('Yêu cầu rút tiền thất bại. Vui lòng thử lại sau.');
      }
    } finally {
      setWithdrawLoading(false);
    }
  };

  // Pre-fill bank account with eKYC bank account details if available (for Lenders)
  const useEkycBankAccount = () => {
    if (user?.lenderOnboarding?.bankAccount) {
      const { bankName: bn, accountNumber: an, accountHolder: ah } = user.lenderOnboarding.bankAccount;
      setBankName(bn || '');
      setAccountNumber(an || '');
      setAccountHolder(ah || '');
    }
  };

  // Calculate profile progress
  const getProfileCompletionProgress = () => {
    let progress = 25; // registered basic account
    if (user?.phoneNumber) progress += 25;
    if (user?.address?.province && user?.address?.street) progress += 50;
    return progress;
  };

  const progressPercentage = getProfileCompletionProgress();

  if (!token) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white rounded-2xl shadow-md text-center">
        <span className="material-symbols-outlined text-5xl text-outline mb-4">lock</span>
        <h2 className="text-xl font-bold mb-2">Vui lòng đăng nhập</h2>
        <p className="text-on-surface-variant text-sm mb-6">Bạn cần đăng nhập để xem thông tin hồ sơ cá nhân của mình.</p>
        <Link to="/login" className="bg-primary text-white px-6 py-2.5 rounded-lg shadow-sm hover:opacity-95 font-semibold transition-all">Đăng nhập ngay</Link>
      </div>
    );
  }

  return (
    <div className="bg-surface text-on-surface min-h-screen selection:bg-primary-container selection:text-on-primary-container antialiased font-body-md py-6">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop space-y-6">
        
        {/* Banner Section */}
        <div className="relative bg-gradient-to-r from-primary via-primary-fixed-dim/60 to-secondary text-white rounded-3xl p-6 md:p-8 shadow-sm overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="absolute inset-0 bg-black/10 mix-blend-overlay"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
            {/* Avatar container */}
            <div className="relative w-24 h-24 rounded-full border-4 border-white bg-surface-container overflow-hidden shadow-inner flex-shrink-0 group cursor-pointer">
              <img 
                src={user?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"} 
                alt="Avatar" 
                className="w-full h-full object-cover"
              />
              <div 
                onClick={() => document.getElementById('avatar-upload-input').click()}
                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              >
                <span className="material-symbols-outlined text-white text-xl">photo_camera</span>
              </div>
              <input 
                type="file" 
                id="avatar-upload-input" 
                accept="image/*" 
                className="hidden" 
                onChange={handleAvatarChange} 
              />
            </div>
            <div>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 mb-1.5">
                <h1 className="text-2xl font-extrabold tracking-tight">{user?.name}</h1>
                <span className={`text-[10px] font-bold tracking-wider px-2.5 py-0.5 uppercase rounded-full border border-white/20 backdrop-blur-md ${
                  user?.role === 'lender' ? 'bg-secondary-container text-white' : 'bg-primary-container text-white'
                }`}>
                  {user?.role === 'lender' ? 'Lender' : user?.role === 'admin' ? 'Admin' : user?.role === 'inspector' ? 'Inspector' : 'Renter'}
                </span>
              </div>
              <p className="text-white/80 text-sm mb-2 font-medium">{user?.email}</p>
              <div className="flex items-center justify-center md:justify-start gap-2.5 text-xs text-white/90">
                <span className="flex items-center">
                  <span className="material-symbols-outlined text-sm text-yellow-300 mr-1" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  Uy tín: <strong className="ml-1">{user?.reputationScore?.toFixed(1) || '5.0'}★</strong>
                </span>
                <span className="w-1.5 h-1.5 bg-white/45 rounded-full"></span>
                <span>Thành viên Super Peer</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <Link to="/orders" className="bg-white text-on-surface hover:bg-surface-container-low font-semibold py-2.5 px-5 rounded-xl shadow transition-all flex items-center justify-center gap-1.5 text-sm">
              <span className="material-symbols-outlined text-base">receipt_long</span>
              Đơn thuê của tôi
            </Link>
            {user?.role === 'renter' && user?.lenderStatus !== 'approved' && (
              user?.lenderStatus === 'pending' ? (
                <div className="bg-amber-500 text-white font-semibold py-2.5 px-5 rounded-xl shadow flex items-center justify-center gap-1.5 text-sm">
                  <span className="material-symbols-outlined text-base">hourglass_empty</span>
                  Đang duyệt Lender
                </div>
              ) : user?.lenderStatus === 'rejected' ? (
                <Link to="/lender-onboarding" className="bg-red-650 text-white hover:bg-red-700 font-semibold py-2.5 px-5 rounded-xl shadow transition-all flex items-center justify-center gap-1.5 text-sm">
                  <span className="material-symbols-outlined text-base">handyman</span>
                  Lender bị từ chối (Gửi lại)
                </Link>
              ) : (
                <Link to="/lender-onboarding" className="bg-secondary text-white hover:opacity-95 font-semibold py-2.5 px-5 rounded-xl shadow transition-all flex items-center justify-center gap-1.5 text-sm">
                  <span className="material-symbols-outlined text-base">handyman</span>
                  Đăng ký làm Lender
                </Link>
              )
            )}
            
            {/* Switch Role Button */}
            {user?.role === 'lender' && (
              <button 
                onClick={handleSwitchRole}
                className="bg-white text-primary hover:bg-surface-container-low font-semibold py-2.5 px-5 rounded-xl shadow transition-all flex items-center justify-center gap-1.5 text-sm"
              >
                <span className="material-symbols-outlined text-base">swap_horiz</span>
                Chuyển sang Renter
              </button>
            )}
            {user?.role === 'renter' && user?.lenderStatus === 'approved' && (
              <button 
                onClick={handleSwitchRole}
                className="bg-white text-secondary hover:bg-surface-container-low font-semibold py-2.5 px-5 rounded-xl shadow transition-all flex items-center justify-center gap-1.5 text-sm"
              >
                <span className="material-symbols-outlined text-base">swap_horiz</span>
                Chuyển sang Lender
              </button>
            )}
          </div>
        </div>

        {/* Global Notifications */}
        {profileSuccess && (
          <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl border border-emerald-200 text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-600">check_circle</span>
            <span>{profileSuccess}</span>
          </div>
        )}
        {profileError && (
          <div className="bg-red-50 text-red-800 p-4 rounded-xl border border-red-200 text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-red-600 font-semibold">error</span>
            <span>{profileError}</span>
          </div>
        )}

        {/* Content Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Side: Profile Details Form (Span 8) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Wallet Section */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-primary-container/10 p-3 rounded-xl text-primary">
                    <span className="material-symbols-outlined text-3xl">account_balance_wallet</span>
                  </div>
                  <div>
                    <h3 className="text-xs text-on-surface-variant font-bold uppercase tracking-wider mb-0.5">Số dư ví khả dụng</h3>
                    <p className="text-2xl font-extrabold text-primary">{balance.toLocaleString('vi-VN')} đ</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowWithdrawForm(!showWithdrawForm)}
                  className="w-full sm:w-auto bg-primary-container text-on-primary-container hover:opacity-90 font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 text-sm"
                >
                  <span className="material-symbols-outlined text-base">local_atm</span>
                  {showWithdrawForm ? 'Đóng mục rút tiền' : 'Rút tiền mặt'}
                </button>
              </div>

              {/* Cash out section */}
              {showWithdrawForm && (
                <form onSubmit={handleWithdrawRequest} className="mt-6 pt-6 border-t border-outline-variant/50 space-y-4">
                  <h4 className="text-sm font-bold text-on-surface flex items-center">
                    <span className="material-symbols-outlined text-base mr-1.5 text-primary">payment</span>
                    Thông tin rút tiền về tài khoản ngân hàng
                  </h4>

                  {withdrawSuccess && (
                    <div className="bg-emerald-50 text-emerald-800 p-3 rounded-lg border border-emerald-100 text-xs">
                      {withdrawSuccess}
                    </div>
                  )}
                  {withdrawError && (
                    <div className="bg-red-50 text-red-800 p-3 rounded-lg border border-red-100 text-xs">
                      {withdrawError}
                    </div>
                  )}

                  {profileAccountNumber ? (
                    <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/30 flex items-center gap-3.5 mb-4 shadow-inner">
                      <input 
                        type="checkbox"
                        id="useSavedBankCheckbox"
                        checked={useSavedBank}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setUseSavedBank(checked);
                          if (checked) {
                            setBankName(profileBankName);
                            setAccountNumber(profileAccountNumber);
                            setAccountHolder(profileAccountHolder);
                          }
                        }}
                        className="rounded text-primary focus:ring-primary h-4 w-4"
                      />
                      <label htmlFor="useSavedBankCheckbox" className="text-xs font-bold text-on-surface cursor-pointer select-none flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm text-primary">account_balance</span>
                        Sử dụng tài khoản ngân hàng đã lưu: <span className="text-primary font-extrabold">{profileBankName} ({profileAccountNumber})</span>
                      </label>
                    </div>
                  ) : (
                    <div className="bg-amber-50 text-amber-800 p-3 rounded-lg border border-amber-200 text-xs italic flex items-center gap-1.5 mb-4">
                      <span className="material-symbols-outlined text-sm">info</span>
                      Chưa cấu hình tài khoản ngân hàng nhận tiền mặc định. Bạn có thể tự nhập dưới đây và lưu lại vào hồ sơ ở bên dưới để lần sau không cần nhập lại.
                    </div>
                  )}

                  {user?.lenderOnboarding?.bankAccount?.accountNumber && !useSavedBank && (
                    <div className="flex justify-end mb-2">
                      <button 
                        type="button"
                        onClick={useEkycBankAccount}
                        className="text-xs text-secondary hover:underline flex items-center gap-1 font-semibold"
                      >
                        <span className="material-symbols-outlined text-xs">input</span>
                        Sử dụng thông tin tài khoản ngân hàng liên kết eKYC
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant mb-1.5">Số tiền cần rút (VND)</label>
                      <input 
                        type="number"
                        placeholder="Ví dụ: 500000"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2.5 text-sm focus:border-secondary focus:ring-1 focus:ring-secondary focus:outline-none font-semibold"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant mb-1.5">Tên ngân hàng nhận</label>
                      <input 
                        type="text"
                        placeholder="Ví dụ: Techcombank"
                        value={useSavedBank ? profileBankName : bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        disabled={useSavedBank}
                        className={`w-full border border-outline-variant rounded-xl px-3 py-2.5 text-sm focus:border-secondary focus:ring-1 focus:ring-secondary focus:outline-none ${useSavedBank ? 'bg-surface-container-low text-on-surface-variant cursor-not-allowed font-semibold' : 'bg-surface'}`}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant mb-1.5">Số tài khoản</label>
                      <input 
                        type="text"
                        placeholder="Số tài khoản ngân hàng"
                        value={useSavedBank ? profileAccountNumber : accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        disabled={useSavedBank}
                        className={`w-full border border-outline-variant rounded-xl px-3 py-2.5 text-sm focus:border-secondary focus:ring-1 focus:ring-secondary focus:outline-none font-semibold ${useSavedBank ? 'bg-surface-container-low text-on-surface-variant cursor-not-allowed' : 'bg-surface'}`}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant mb-1.5">Tên chủ tài khoản (In hoa không dấu)</label>
                    <input 
                      type="text"
                      placeholder="Ví dụ: NGUYEN VAN A"
                      value={useSavedBank ? profileAccountHolder : accountHolder}
                      onChange={(e) => setAccountHolder(e.target.value.toUpperCase())}
                      disabled={useSavedBank}
                      className={`w-full border border-outline-variant rounded-xl px-3 py-2.5 text-sm focus:border-secondary focus:ring-1 focus:ring-secondary focus:outline-none font-semibold ${useSavedBank ? 'bg-surface-container-low text-on-surface-variant cursor-not-allowed font-semibold' : 'bg-surface'}`}
                      required
                    />
                  </div>

                  <div className="flex justify-end">
                    <button 
                      type="submit"
                      disabled={withdrawLoading}
                      className="bg-primary text-white font-bold py-2.5 px-6 rounded-xl hover:opacity-95 active:scale-95 transition-all text-sm flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-base">send</span>
                      {withdrawLoading ? 'Đang tạo yêu cầu...' : 'Gửi yêu cầu rút tiền'}
                    </button>
                  </div>
                </form>
              )}

              {/* Withdrawal History Section */}
              <div className="border-t border-outline-variant/50 my-6 pt-6">
                <h4 className="text-sm font-bold text-on-surface mb-4 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-base">history</span>
                  Lịch sử yêu cầu rút tiền
                </h4>

                {loadingWithdrawals ? (
                  <p className="text-xs text-on-surface-variant italic">Đang tải lịch sử rút tiền...</p>
                ) : withdrawals.length === 0 ? (
                  <p className="text-xs text-on-surface-variant italic">Bạn chưa thực hiện yêu cầu rút tiền nào.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-outline-variant/30 text-on-surface-variant font-bold">
                          <th className="pb-2">Ngày tạo</th>
                          <th className="pb-2">Số tiền</th>
                          <th className="pb-2">Ngân hàng nhận</th>
                          <th className="pb-2">Trạng thái</th>
                          <th className="pb-2">Chi tiết / Ghi chú</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/20">
                        {withdrawals.map((req) => (
                          <tr key={req._id} className="hover:bg-surface-container-low/30 transition-colors">
                            <td className="py-2.5 text-on-surface-variant font-medium">
                              {new Date(req.createdAt).toLocaleDateString('vi-VN', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                            <td className="py-2.5 font-bold text-on-surface">
                              {req.amount.toLocaleString('vi-VN')} đ
                            </td>
                            <td className="py-2.5 text-on-surface-variant">
                              {req.bankAccount.bankName} - {req.bankAccount.accountNumber}
                            </td>
                            <td className="py-2.5">
                              {req.status === 'pending' && (
                                <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-bold text-[10px]">
                                  Chờ duyệt
                                </span>
                              )}
                              {req.status === 'approved' && (
                                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold text-[10px]">
                                  Thành công
                                </span>
                              )}
                              {req.status === 'rejected' && (
                                <span className="bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-full font-bold text-[10px]">
                                  Từ chối
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 text-on-surface-variant max-w-[150px]">
                              {req.status === 'rejected' && req.rejectReason && (
                                <span className="italic text-red-500">{req.rejectReason}</span>
                              )}
                              {req.status === 'approved' && (
                                <span className="font-semibold text-emerald-600 text-xs">Đã thanh toán từ Vietcombank-CTY CO PHAN EQUIPPEER</span>
                              )}
                              {req.status === 'pending' && <span className="italic text-on-surface-variant/50">-</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Transactions History */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] mt-6">
              <h3 className="font-title-md text-base font-bold text-on-surface mb-4 flex items-center">
                <span className="material-symbols-outlined text-primary mr-1.5">receipt_long</span>
                Lịch sử giao dịch ví
              </h3>
              
              <div className="bg-surface-container-low rounded-xl border border-outline-variant overflow-hidden">
                {loadingTransactions ? (
                  <div className="p-8 text-center text-slate-400">
                    <span className="material-symbols-outlined animate-spin text-2xl mb-2 text-slate-300">autorenew</span>
                    <p className="text-xs font-medium">Đang tải lịch sử giao dịch...</p>
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    <span className="material-symbols-outlined text-4xl mb-2 text-slate-300">history</span>
                    <p className="text-xs font-medium">Chưa có giao dịch nào.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-slate-100/50 text-slate-600 text-[11px] uppercase font-bold tracking-wider border-b border-outline-variant">
                        <tr>
                          <th className="py-3 px-4">Thời gian</th>
                          <th className="py-3 px-4">Loại GD</th>
                          <th className="py-3 px-4 text-right">Số tiền</th>
                          <th className="py-3 px-4">Lý do</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant text-xs text-slate-700">
                        {transactions.map((txn) => (
                          <tr key={txn._id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-2.5 px-4 font-medium text-slate-500">
                              {new Date(txn.createdAt).toLocaleString('vi-VN', {
                                day: '2-digit', month: '2-digit', year: 'numeric',
                                hour: '2-digit', minute: '2-digit'
                              })}
                            </td>
                            <td className="py-2.5 px-4">
                              {txn.type === 'addition' ? (
                                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold text-[10px]">
                                  Cộng tiền
                                </span>
                              ) : (
                                <span className="bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-full font-bold text-[10px]">
                                  Trừ tiền
                                </span>
                              )}
                            </td>
                            <td className={`py-2.5 px-4 font-extrabold text-right ${txn.type === 'addition' ? 'text-emerald-600' : 'text-red-600'}`}>
                              {txn.type === 'addition' ? '+' : '-'}{txn.amount.toLocaleString('vi-VN')} đ
                            </td>
                            <td className="py-2.5 px-4 text-slate-600 truncate max-w-[200px]" title={txn.reason}>
                              {txn.reason}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Profile detail card */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-outline-variant/40">
                <h3 className="font-title-md text-base font-bold text-on-surface flex items-center">
                  <span className="material-symbols-outlined text-primary mr-1.5">person_outline</span>
                  Thông tin tài khoản chính thức
                </h3>
                {!isEditing && (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="border border-outline hover:bg-surface-container-low text-on-surface font-semibold text-xs py-1.5 px-3 rounded-lg transition-all flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">edit</span>
                    Chỉnh sửa
                  </button>
                )}
              </div>

              {!isEditing ? (
                // Read Only View
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 text-sm">
                  <div className="border-b border-outline-variant/20 pb-2">
                    <span className="block text-xs text-on-surface-variant font-semibold mb-0.5">Họ và tên</span>
                    <span className="font-semibold text-on-surface">{user?.name}</span>
                  </div>
                  <div className="border-b border-outline-variant/20 pb-2">
                    <span className="block text-xs text-on-surface-variant font-semibold mb-0.5">Địa chỉ Email</span>
                    <span className="font-semibold text-on-surface">{user?.email}</span>
                  </div>
                  <div className="border-b border-outline-variant/20 pb-2">
                    <span className="block text-xs text-on-surface-variant font-semibold mb-0.5">Số điện thoại liên lạc</span>
                    <span className={`font-semibold ${user?.phoneNumber ? 'text-on-surface' : 'text-outline italic'}`}>
                      {user?.phoneNumber || 'Chưa cung cấp'}
                    </span>
                  </div>
                  <div className="border-b border-outline-variant/20 pb-2">
                    <span className="block text-xs text-on-surface-variant font-semibold mb-0.5">Tỉnh / Thành phố</span>
                    <span className={`font-semibold ${user?.address?.province ? 'text-on-surface' : 'text-outline italic'}`}>
                      {user?.address?.province || 'Chưa cung cấp'}
                    </span>
                  </div>
                  <div className="border-b border-outline-variant/20 pb-2 md:col-span-2">
                    <span className="block text-xs text-on-surface-variant font-semibold mb-0.5">Địa chỉ giao nhận đồ (Số nhà, Tên đường, Phường, Quận)</span>
                    <span className={`font-semibold ${user?.address?.street ? 'text-on-surface' : 'text-outline italic'}`}>
                      {user?.address?.street 
                        ? `${user.address.street}, ${user.address.ward || ''}, ${user.address.district || ''}`
                        : 'Chưa cấu hình địa chỉ mặc định'}
                    </span>
                  </div>
                  {user?.bankAccount?.accountNumber ? (
                    <div className="border-t border-outline-variant/20 pt-4 md:col-span-2 mt-2">
                      <h4 className="text-xs font-bold text-primary mb-2 flex items-center">
                        <span className="material-symbols-outlined text-sm mr-1">account_balance</span>
                        Tài khoản ngân hàng đã lưu (Nhận tiền mặt)
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-y-2 gap-x-4 text-xs font-medium">
                        <div>
                          <span className="block text-on-surface-variant mb-0.5">Ngân hàng</span>
                          <span className="font-bold text-on-surface">{user.bankAccount.bankName}</span>
                        </div>
                        <div>
                          <span className="block text-on-surface-variant mb-0.5">Số tài khoản STK</span>
                          <span className="font-bold text-on-surface">{user.bankAccount.accountNumber}</span>
                        </div>
                        <div>
                          <span className="block text-on-surface-variant mb-0.5">Chủ tài khoản</span>
                          <span className="font-bold text-on-surface">{user.bankAccount.accountHolder}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="border-t border-outline-variant/20 pt-4 md:col-span-2 mt-2 text-outline text-xs italic flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">info</span>
                      Chưa cấu hình tài khoản ngân hàng nhận tiền mặc định. Bấm "Chỉnh sửa" để thêm.
                    </div>
                  )}
                </div>
              ) : (
                // Edit Profile Form View
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant mb-1.5">Họ và tên</label>
                      <input 
                        type="text" 
                        value={user?.name || ''} 
                        disabled 
                        className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2 text-sm text-on-surface-variant focus:outline-none cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant mb-1.5">Địa chỉ Email</label>
                      <input 
                        type="email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Nhập địa chỉ email"
                        className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2.5 text-sm focus:border-secondary focus:ring-1 focus:ring-secondary focus:outline-none font-semibold"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant mb-1.5">Số điện thoại liên lạc</label>
                      <input 
                        type="text" 
                        value={phoneNumber} 
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="Nhập số điện thoại di động"
                        className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2.5 text-sm focus:border-secondary focus:ring-1 focus:ring-secondary focus:outline-none font-semibold"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant mb-1.5">Tỉnh / Thành phố</label>
                      <select 
                        value={selectedProvinceCode || province} 
                        onChange={handleProvinceChange}
                        className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2.5 text-sm focus:border-secondary focus:ring-1 focus:ring-secondary focus:outline-none font-semibold"
                        required
                      >
                        <option value="">Chọn Tỉnh / Thành phố</option>
                        {provincesList.map(p => (
                          <option key={p.code} value={p.code}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant mb-1.5">Quận / Huyện</label>
                      <select 
                        value={selectedDistrictCode || district} 
                        onChange={handleDistrictChange}
                        disabled={!selectedProvinceCode && !district}
                        className={`w-full border border-outline-variant rounded-xl px-3 py-2.5 text-sm focus:border-secondary focus:ring-1 focus:ring-secondary focus:outline-none font-semibold ${(!selectedProvinceCode && !district) ? 'bg-surface-container-low text-on-surface-variant cursor-not-allowed' : 'bg-surface'}`}
                        required
                      >
                        <option value="">Chọn Quận / Huyện</option>
                        {districtsList.map(d => (
                          <option key={d.code} value={d.code}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant mb-1.5">Phường / Xã</label>
                      <select 
                        value={ward} 
                        onChange={handleWardChange}
                        disabled={!selectedDistrictCode && !ward}
                        className={`w-full border border-outline-variant rounded-xl px-3 py-2.5 text-sm focus:border-secondary focus:ring-1 focus:ring-secondary focus:outline-none font-semibold ${(!selectedDistrictCode && !ward) ? 'bg-surface-container-low text-on-surface-variant cursor-not-allowed' : 'bg-surface'}`}
                        required
                      >
                        <option value="">Chọn Phường / Xã</option>
                        {wardsList.map(w => (
                          <option key={w.code} value={w.name}>{w.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-on-surface-variant mb-1.5">Số nhà, Tên đường</label>
                      <input 
                        type="text" 
                        value={street} 
                        onChange={(e) => setStreet(e.target.value)}
                        placeholder="Ví dụ: 45 Phan Đình Phùng"
                        className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2.5 text-sm focus:border-secondary focus:ring-1 focus:ring-secondary focus:outline-none"
                        required
                      />
                    </div>
                    {/* Bank Account Config inside Profile Edit Form */}
                    <div className="md:col-span-2 border-t border-outline-variant/40 pt-4 mt-2">
                      <h4 className="text-xs font-bold text-primary mb-3 flex items-center">
                        <span className="material-symbols-outlined text-sm mr-1">account_balance</span>
                        Cấu hình tài khoản ngân hàng nhận tiền mặc định
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Tên ngân hàng</label>
                          <input 
                            type="text" 
                            value={profileBankName} 
                            onChange={(e) => setProfileBankName(e.target.value)}
                            placeholder="Ví dụ: Techcombank"
                            className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2 text-xs focus:border-secondary focus:ring-1 focus:ring-secondary focus:outline-none font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Số tài khoản STK</label>
                          <input 
                            type="text" 
                            value={profileAccountNumber} 
                            onChange={(e) => setProfileAccountNumber(e.target.value)}
                            placeholder="Nhập số tài khoản"
                            className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2 text-xs focus:border-secondary focus:ring-1 focus:ring-secondary focus:outline-none font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Tên chủ tài khoản</label>
                          <input 
                            type="text" 
                            value={profileAccountHolder} 
                            onChange={(e) => setProfileAccountHolder(e.target.value.toUpperCase())}
                            placeholder="NGUYEN VAN A"
                            className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2 text-xs focus:border-secondary focus:ring-1 focus:ring-secondary focus:outline-none font-semibold"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button 
                      type="button" 
                      onClick={() => setIsEditing(false)}
                      className="border border-outline hover:bg-surface-container-low text-on-surface font-semibold text-xs py-2.5 px-4 rounded-xl transition-all"
                    >
                      Hủy bỏ
                    </button>
                    <button 
                      type="submit"
                      disabled={loadingProfile}
                      className="bg-primary text-white font-bold text-xs py-2.5 px-5 rounded-xl hover:opacity-95 shadow-sm active:scale-95 transition-all flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">save</span>
                      {loadingProfile ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                  </div>
                </form>
              )}
            </div>

          </div>

          {/* Right Side: Profile Progress and Actions (Span 4) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Renter eKYC Verification Card */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
              <h3 className="font-title-md text-sm font-bold text-on-surface mb-3 flex items-center">
                <span className="material-symbols-outlined text-primary mr-1">badge</span>
                Xác thực CCCD (Renter eKYC)
              </h3>
              
              <div className="space-y-4">
                {user?.renterStatus === 'approved' ? (
                  <div className="bg-emerald-50 border border-emerald-250 text-emerald-800 p-4 rounded-xl flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-xl text-emerald-600" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                    <div>
                      <h4 className="font-bold text-xs">Đã xác thực thành công</h4>
                      <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                        Tài khoản của bạn đã được đối soát CCCD thành công. Bạn có thể tự do đặt thuê các thiết bị dã ngoại.
                      </p>
                    </div>
                  </div>
                ) : user?.renterStatus === 'pending' ? (
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-xl text-amber-600 animate-pulse">hourglass_top</span>
                    <div>
                      <h4 className="font-bold text-xs">Đang chờ Admin duyệt</h4>
                      <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                        Hồ sơ xác thực eKYC CCCD của bạn đã được gửi lên hệ thống và đang chờ kiểm duyệt.
                      </p>
                    </div>
                  </div>
                ) : user?.renterStatus === 'rejected' ? (
                  <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex flex-col gap-3">
                    <div className="flex items-start gap-2.5">
                      <span className="material-symbols-outlined text-xl text-red-650">gpp_bad</span>
                      <div>
                        <h4 className="font-bold text-xs">Xác thực bị từ chối</h4>
                        <p className="text-[10px] text-red-700 mt-1 leading-relaxed">
                          Lý do: "{user?.renterOnboarding?.rejectReason || 'Thông tin ảnh chụp không rõ ràng'}"
                        </p>
                      </div>
                    </div>
                    <Link to="/renter-ekyc" className="w-full text-center bg-primary text-white text-xs font-bold py-2 rounded-lg hover:opacity-90 shadow-sm transition-all">
                      Nộp lại hồ sơ eKYC
                    </Link>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200 text-slate-700 p-4 rounded-xl flex flex-col gap-3">
                    <div className="flex items-start gap-2.5">
                      <span className="material-symbols-outlined text-xl text-slate-400">lock</span>
                      <div>
                        <h4 className="font-bold text-xs">Chưa thực hiện eKYC</h4>
                        <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                          Bạn cần hoàn thành xác thực CCCD để có thể đặt thuê các sản phẩm trên nền tảng.
                        </p>
                      </div>
                    </div>
                    <Link to="/renter-ekyc" className="w-full text-center bg-primary text-white text-xs font-bold py-2 rounded-lg hover:opacity-90 shadow-sm transition-all">
                      Xác thực danh tính ngay
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Completion Progress Card */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
              <h3 className="font-title-md text-sm font-bold text-on-surface mb-3 flex items-center">
                <span className="material-symbols-outlined text-primary mr-1">insights</span>
                Độ hoàn thiện hồ sơ
              </h3>
              
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-xs font-bold inline-block py-1 px-2 uppercase rounded-full text-primary bg-primary-container/10">
                      Tiến độ
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-primary">
                      {progressPercentage}%
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-2.5 text-xs flex rounded-full bg-surface-container">
                  <div 
                    style={{ width: `${progressPercentage}%` }} 
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary transition-all duration-500"
                  ></div>
                </div>
              </div>

              {/* Checklist details */}
              <ul className="mt-6 space-y-3.5 text-xs text-on-surface-variant font-medium">
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-emerald-600 font-semibold">check_circle</span>
                  <span>Đăng ký tài khoản thành công (+25%)</span>
                </li>
                <li className="flex items-center gap-2">
                  {user?.phoneNumber ? (
                    <span className="material-symbols-outlined text-sm text-emerald-600 font-semibold">check_circle</span>
                  ) : (
                    <span className="material-symbols-outlined text-sm text-outline">radio_button_unchecked</span>
                  )}
                  <span className={user?.phoneNumber ? 'text-on-surface line-through decoration-outline-variant' : ''}>
                    Thêm số điện thoại liên lạc (+25%)
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  {user?.address?.province && user?.address?.street ? (
                    <span className="material-symbols-outlined text-sm text-emerald-600 font-semibold">check_circle</span>
                  ) : (
                    <span className="material-symbols-outlined text-sm text-outline">radio_button_unchecked</span>
                  )}
                  <span className={user?.address?.province && user?.address?.street ? 'text-on-surface line-through decoration-outline-variant' : ''}>
                    Cấu hình địa chỉ nhận hàng mặc định (+50%)
                  </span>
                </li>
              </ul>

              {progressPercentage === 100 && (
                <div className="mt-6 bg-primary-container/10 border border-primary/20 text-primary p-4 rounded-xl flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                  <div>
                    <h4 className="font-bold text-xs">Hồ sơ đã được xác thực!</h4>
                    <p className="text-[10px] text-on-surface-variant mt-1 leading-relaxed">Hồ sơ của bạn đã hoàn thiện 100%. Bạn có toàn quyền thực hiện các yêu cầu giao dịch thuê đồ trên hệ thống.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Quick trust signal badge */}
            <div className="bg-gradient-to-br from-inverse-on-surface to-surface-container rounded-2xl p-6 border border-outline-variant/60 flex items-start gap-4">
              <span className="material-symbols-outlined text-primary text-3xl">gavel</span>
              <div>
                <h4 className="font-bold text-sm text-on-surface mb-1">Cam kết và Quy chế</h4>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Mọi tài khoản và giao dịch trên EquipPeer được quản lý an toàn. Vui lòng cập nhật đầy đủ thông tin định danh để tránh bị hạn chế các tính năng thuê/cho thuê đồ.
                </p>
              </div>
            </div>

          </div>

        </div>

      </div>
      {/* Receipt Lightbox Modal */}
      {receiptLightbox.open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setReceiptLightbox({ open: false, url: '' })}>
          <div className="relative max-w-3xl w-full max-h-[90vh] flex flex-col items-center justify-center" onClick={e => e.stopPropagation()}>
            <button onClick={() => setReceiptLightbox({ open: false, url: '' })} className="absolute -top-10 right-0 md:-right-10 text-white hover:text-gray-300 bg-gray-800/50 rounded-full w-8 h-8 flex items-center justify-center transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>
            <img src={receiptLightbox.url} alt="Receipt" className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" />
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
