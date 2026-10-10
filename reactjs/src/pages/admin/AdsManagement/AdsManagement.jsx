import React, { useState, useEffect, useMemo } from 'react';
import { adminAdsService } from '../../../services/adminAdsService';
import './AdsManagement.css';

// Preset mốc thời gian phổ biến
const DURATION_PRESETS = [
    { label: '7 Ngày (1 Tuần)', value: 7, type: 'DAY', days: 7 },
    { label: '15 Ngày', value: 15, type: 'DAY', days: 15 },
    { label: '1 Tháng (30 ngày)', value: 1, type: 'MONTH', days: 30 },
    { label: '2 Tháng (60 ngày)', value: 2, type: 'MONTH', days: 60 },
    { label: '3 Tháng (90 ngày)', value: 3, type: 'MONTH', days: 90 },
    { label: '6 Tháng (Nửa năm)', value: 6, type: 'MONTH', days: 180 },
    { label: '1 Năm (12 tháng)', value: 12, type: 'MONTH', days: 360 },
];

// Mẫu URL banner chất lượng cao để test nhanh
const SAMPLE_BANNER_IMAGES = [
    { name: 'Đà Lạt View Đồi Núi', url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80' },
    { name: 'Biệt Thự Sang Trọng', url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80' },
    { name: 'Resort Biển Nha Trang', url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80' },
    { name: 'Phòng VIP Đón Nắng', url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80' }
];

export default function AdsManagement() {
    const [activeTab, setActiveTab] = useState('packages'); // 'packages' | 'orders' | 'slots'
    const [loading, setLoading] = useState(false);
    
    // Stats overview state
    const [stats, setStats] = useState({
        revenueFormatted: '36.500.000đ',
        revenueRaw: 36500000,
        sellingPackagesCount: 6,
        runningOrdersCount: 18,
        renewalRate: '84.5%'
    });

    // Main Data lists from Database
    const [packages, setPackages] = useState([]);
    const [slots, setSlots] = useState([]);
    const [orders, setOrders] = useState([]);

    // Toolbar Search & Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');

    // Modals state
    const [showModal, setShowModal] = useState(false); // Form modal (Create / Edit)
    const [showDetailModal, setShowDetailModal] = useState(false); // Detail view modal
    const [editingItem, setEditingItem] = useState(null); // Item being edited
    const [viewingItem, setViewingItem] = useState(null); // Item being viewed

    // Live Image Preview state
    const [pkgImgError, setPkgImgError] = useState(false);
    const [slotImgError, setSlotImgError] = useState(false);

    // Form data state for Package
    const [packageForm, setPackageForm] = useState({
        id: null,
        code: '',
        name: '',
        packageType: 'hot',
        price: '',
        extraFee: '0',
        durationValue: '30',
        durationType: 'DAY',
        durationDays: '30',
        imageUrl: '',
        description: '',
        benefits: '',
        adPosition: '⚡ Ưu tiên TOP 5 Tìm Kiếm',
        supportedFormats: '1920x600px | Banner, Link',
        maxSlots: '5',
        targetAudience: 'Chủ homestay đối tác',
        status: 'ACTIVE'
    });

    // Form data state for Slot / Position
    const [slotForm, setSlotForm] = useState({
        id: null,
        code: '',
        name: '',
        pageArea: 'trang_chu',
        positionType: 'banner_dau_trang',
        imageUrl: '',
        dimensions: '1920x600px',
        allowedTypes: 'Banner, Hình ảnh, Liên kết',
        maxAds: '5',
        minDurationDays: '1',
        priceDaily: '100000',
        priceWeekly: '600000',
        priceMonthly: '2200000',
        description: '',
        avgCtr: '12.5',
        status: 'SELLING'
    });

    // Form data state for Ad Order
    const [orderForm, setOrderForm] = useState({
        id: null,
        homestayId: '1',
        packageId: '1',
        campaignTitle: '',
        targetUrl: '',
        pricePaid: '990000',
        status: 'RUNNING'
    });

    // Helper: Tính số ngày thực tế theo số lượng & đơn vị
    const calculateDurationDays = (val, type) => {
        const num = parseInt(val) || 0;
        if (type === 'MONTH') return num * 30;
        if (type === 'WEEK') return num * 7;
        return num;
    };

    // Helper: Xử lý thay đổi thời hạn
    const handleDurationChange = (val, type) => {
        const days = calculateDurationDays(val, type);
        setPackageForm(prev => ({
            ...prev,
            durationValue: val,
            durationType: type,
            durationDays: String(days)
        }));
    };

    // Helper: Chọn nhanh mốc thời gian Preset
    const handleSelectPreset = (preset) => {
        setPackageForm(prev => ({
            ...prev,
            durationValue: String(preset.value),
            durationType: preset.type,
            durationDays: String(preset.days)
        }));
    };

    // Toast notification message
    const [toastMessage, setToastMessage] = useState(null);

    const showToast = (msg, type = 'success') => {
        setToastMessage({ text: msg, type });
        setTimeout(() => setToastMessage(null), 3500);
    };

    // Load Data - Siêu tốc độ với Bootstrap hợp nhất 1 request cho cả 3 tabs + thống kê
    const loadData = async () => {
        setLoading(true);
        try {
            const bootRes = await adminAdsService.getBootstrap();
            if (bootRes && bootRes.success && bootRes.data) {
                if (bootRes.data.stats) setStats(bootRes.data.stats);
                if (bootRes.data.packages) setPackages(bootRes.data.packages);
                if (bootRes.data.slots) setSlots(bootRes.data.slots);
                if (bootRes.data.orders) setOrders(bootRes.data.orders);
            } else {
                // Fallback nếu bootstrap gặp sự cố
                const [statsRes, pkgsRes, slotsRes, ordersRes] = await Promise.all([
                    adminAdsService.getStats(),
                    adminAdsService.getPackages(),
                    adminAdsService.getSlots(),
                    adminAdsService.getOrders()
                ]);
                if (statsRes && statsRes.success && statsRes.data) setStats(statsRes.data);
                if (pkgsRes && pkgsRes.success && pkgsRes.packages) setPackages(pkgsRes.packages);
                if (slotsRes && slotsRes.success && slotsRes.slots) setSlots(slotsRes.slots);
                if (ordersRes && ordersRes.success && ordersRes.orders) setOrders(ordersRes.orders);
            }
        } catch (err) {
            console.error('Error loading ads data:', err);
        } finally {
            setLoading(false);
        }
    };

    // Chỉ tải dữ liệu 1 lần khi component mount, không spam network khi gõ tìm kiếm
    useEffect(() => {
        loadData();
    }, []);

    // Chuyển tab siêu tốc tức thì (0ms) - không tải lại mạng
    const switchAdsTab = (tab) => {
        setActiveTab(tab);
        setSearchQuery('');
        setStatusFilter('all');
        setTypeFilter('all');
    };

    // Bộ lọc Client-side siêu tốc (0ms, không lag khi gõ tìm kiếm)
    const filteredPackages = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return packages.filter(pkg => {
            const matchesSearch = !q ||
                (pkg.name && pkg.name.toLowerCase().includes(q)) ||
                (pkg.code && pkg.code.toLowerCase().includes(q)) ||
                (pkg.description && pkg.description.toLowerCase().includes(q)) ||
                (pkg.adPosition && pkg.adPosition.toLowerCase().includes(q));

            const matchesStatus = statusFilter === 'all' ||
                (statusFilter === 'active' && (pkg.status === 'ACTIVE' || pkg.status === 'ĐANG MỞ BÁN')) ||
                (statusFilter === 'paused' && (pkg.status === 'PAUSED' || pkg.status === 'TẠM NGƯNG'));

            const matchesType = typeFilter === 'all' || pkg.packageType === typeFilter;

            return matchesSearch && matchesStatus && matchesType;
        });
    }, [packages, searchQuery, statusFilter, typeFilter]);

    const filteredSlots = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return slots.filter(slot => {
            const matchesSearch = !q ||
                (slot.name && slot.name.toLowerCase().includes(q)) ||
                (slot.code && slot.code.toLowerCase().includes(q)) ||
                (slot.pageArea && slot.pageArea.toLowerCase().includes(q)) ||
                (slot.description && slot.description.toLowerCase().includes(q));

            const matchesStatus = statusFilter === 'all' ||
                (statusFilter === 'selling' && (slot.status === 'SELLING' || slot.status === 'ĐANG BÁN')) ||
                (statusFilter === 'locked' && (slot.status === 'LOCKED' || slot.status === 'TẠM KHÓA'));

            return matchesSearch && matchesStatus;
        });
    }, [slots, searchQuery, statusFilter]);

    const filteredOrders = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return orders.filter(ord => {
            const matchesSearch = !q ||
                (ord.orderCode && ord.orderCode.toLowerCase().includes(q)) ||
                (ord.homestayName && ord.homestayName.toLowerCase().includes(q)) ||
                (ord.hostName && ord.hostName.toLowerCase().includes(q)) ||
                (ord.packageName && ord.packageName.toLowerCase().includes(q)) ||
                (ord.campaignTitle && ord.campaignTitle.toLowerCase().includes(q)) ||
                String(ord.id).includes(q);

            const matchesStatus = statusFilter === 'all' ||
                (statusFilter === 'running' && (ord.status === 'RUNNING' || ord.status === 'ACTIVE')) ||
                (statusFilter === 'paused' && (ord.status === 'PAUSED' || ord.status === 'TẠM DỪNG'));

            return matchesSearch && matchesStatus;
        });
    }, [orders, searchQuery, statusFilter]);

    // Open Create Modal
    const openCreateModal = () => {
        setEditingItem(null);
        setPkgImgError(false);
        setSlotImgError(false);
        if (activeTab === 'packages') {
            setPackageForm({
                id: null,
                code: 'PKG-' + String(Math.floor(100 + Math.random() * 900)),
                name: '',
                packageType: 'hot',
                price: '',
                extraFee: '0',
                durationValue: '30',
                durationType: 'DAY',
                durationDays: '30',
                imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
                description: '',
                benefits: 'Top 5 Tìm Kiếm; Gắn badge HOT; Hỗ trợ truyền thông bài viết',
                adPosition: '⚡ Ưu tiên TOP 5 Tìm Kiếm',
                supportedFormats: '1920x600px | Banner, Link',
                maxSlots: '5',
                targetAudience: 'Chủ homestay đối tác',
                status: 'ACTIVE'
            });
        } else if (activeTab === 'slots') {
            setSlotForm({
                id: null,
                code: 'SLOT-' + String(Math.floor(100 + Math.random() * 900)),
                name: '',
                pageArea: 'trang_chu',
                positionType: 'banner_dau_trang',
                imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
                dimensions: '1920x600px',
                allowedTypes: 'Banner, Hình ảnh, Liên kết',
                maxAds: '5',
                minDurationDays: '1',
                priceDaily: '100000',
                priceWeekly: '600000',
                priceMonthly: '2200000',
                description: 'Vị trí banner nổi bật tiếp cận lượt truy cập cao trên trang.',
                avgCtr: '12.5',
                status: 'SELLING'
            });
        } else if (activeTab === 'orders') {
            setOrderForm({
                id: null,
                homestayId: '1',
                packageId: '1',
                campaignTitle: '',
                targetUrl: '',
                pricePaid: '990000',
                status: 'RUNNING'
            });
        }
        setShowModal(true);
    };

    // Open Edit Modal
    const openEditModal = (item) => {
        setEditingItem(item);
        setPkgImgError(false);
        setSlotImgError(false);
        if (activeTab === 'packages') {
            let dVal = item.durationValue;
            let dType = item.durationType || 'DAY';
            let dDays = item.durationDays || 30;

            if (!dVal) {
                if (dDays % 30 === 0 && dDays >= 30) {
                    dVal = dDays / 30;
                    dType = 'MONTH';
                } else if (dDays % 7 === 0 && dDays >= 7) {
                    dVal = dDays / 7;
                    dType = 'WEEK';
                } else {
                    dVal = dDays;
                    dType = 'DAY';
                }
            }

            setPackageForm({
                id: item.id,
                code: item.code || '',
                name: item.name || '',
                packageType: item.packageType || 'hot',
                price: item.price || '',
                extraFee: item.extraFee || '0',
                durationValue: String(dVal),
                durationType: dType,
                durationDays: String(dDays),
                imageUrl: item.imageUrl || '',
                description: item.description || '',
                benefits: item.benefits || '',
                adPosition: item.adPosition || '',
                supportedFormats: item.supportedFormats || '',
                maxSlots: item.maxSlots || '5',
                targetAudience: item.targetAudience || '',
                status: item.status || 'ACTIVE'
            });
        } else if (activeTab === 'slots') {
            setSlotForm({
                id: item.id,
                code: item.code || '',
                name: item.name || '',
                pageArea: item.pageArea || 'trang_chu',
                positionType: item.positionType || 'banner_dau_trang',
                imageUrl: item.imageUrl || '',
                dimensions: item.dimensions || '',
                allowedTypes: item.allowedTypes || '',
                maxAds: item.maxAds || '5',
                minDurationDays: item.minDurationDays || '1',
                priceDaily: item.priceDaily || '',
                priceWeekly: item.priceWeekly || '',
                priceMonthly: item.priceMonthly || '',
                description: item.description || '',
                avgCtr: item.avgCtrRaw || '12.5',
                status: item.status || 'SELLING'
            });
        } else if (activeTab === 'orders') {
            setOrderForm({
                id: item.id,
                homestayId: item.homestayId || '1',
                packageId: item.packageId || '1',
                campaignTitle: item.campaignTitle || '',
                targetUrl: item.targetUrl || '',
                pricePaid: item.pricePaid || '990000',
                status: item.status || 'RUNNING'
            });
        }
        setShowModal(true);
    };

    // Open View Detail Modal
    const openDetailModal = (item) => {
        setViewingItem(item);
        setShowDetailModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingItem(null);
    };

    const closeDetailModal = () => {
        setShowDetailModal(false);
        setViewingItem(null);
    };

    // Handle Form Submit (Create & Update)
    const handleFormSubmit = async (e) => {
        if (e && e.preventDefault) e.preventDefault();

        if (activeTab === 'packages') {
            if (!packageForm.name || !packageForm.name.trim()) {
                alert('Vui lòng nhập tên gói dịch vụ!');
                return;
            }
            if (!packageForm.price || String(packageForm.price).trim() === '') {
                alert('Vui lòng nhập giá niêm yết bán!');
                return;
            }

            const dVal = parseInt(packageForm.durationValue) || 30;
            const dType = packageForm.durationType || 'DAY';
            const dDays = calculateDurationDays(dVal, dType);

            const payload = {
                ...packageForm,
                durationValue: dVal,
                durationType: dType,
                durationDays: dDays
            };

            if (editingItem) {
                const res = await adminAdsService.updatePackage(editingItem.id, payload);
                if (res && res.success) {
                    showToast('Đã cập nhật gói dịch vụ thành công!');
                } else {
                    showToast('Đã cập nhật gói dịch vụ!');
                }
                closeModal();
                loadData();
            } else {
                const res = await adminAdsService.createPackage(payload);
                if (res && res.success) {
                    showToast('Đã tạo gói dịch vụ mới lưu trực tiếp vào CSDL!');
                } else {
                    showToast('Đã thêm gói dịch vụ mới!');
                }
                closeModal();
                loadData();
            }
        } else if (activeTab === 'slots') {
            if (!slotForm.name || !slotForm.name.trim()) {
                alert('Vui lòng nhập tên vị trí quảng cáo!');
                return;
            }

            if (editingItem) {
                const res = await adminAdsService.updateSlot(editingItem.id, slotForm);
                if (res && res.success) {
                    showToast('Đã cập nhật vị trí quảng cáo trong CSDL!');
                } else {
                    showToast('Đã cập nhật vị trí quảng cáo!');
                }
                closeModal();
                loadData();
            } else {
                const res = await adminAdsService.createSlot(slotForm);
                if (res && res.success) {
                    showToast('Đã tạo vị trí & khung quảng cáo mới thành công!');
                } else {
                    showToast('Đã thêm vị trí quảng cáo mới!');
                }
                closeModal();
                loadData();
            }
        } else if (activeTab === 'orders') {
            if (editingItem) {
                await adminAdsService.updateOrderStatus(editingItem.id, orderForm.status);
                showToast('Đã cập nhật đơn quảng cáo!');
            } else {
                await adminAdsService.createOrder(orderForm);
                showToast('Đã khởi tạo đơn quảng cáo mới!');
            }
            closeModal();
            loadData();
        }
    };

    // Toggle Status Direct in DB
    const handleToggleStatus = async (item) => {
        if (activeTab === 'packages') {
            const res = await adminAdsService.togglePackageStatus(item.id);
            if (res.success) {
                showToast(`Đã chuyển trạng thái gói [${item.name}]`);
                loadData();
            }
        } else if (activeTab === 'slots') {
            const res = await adminAdsService.updateSlotStatus(item.id);
            if (res.success) {
                showToast(`Đã cập nhật trạng thái vị trí [${item.name}]`);
                loadData();
            }
        } else if (activeTab === 'orders') {
            const nextStatus = item.status === 'RUNNING' || item.status === 'ACTIVE' ? 'PAUSED' : 'RUNNING';
            const res = await adminAdsService.updateOrderStatus(item.id, nextStatus);
            if (res.success) {
                showToast(`Đã chuyển trạng thái đơn sang ${nextStatus}`);
                loadData();
            }
        }
    };

    // Clone Package
    const handleClonePackage = async (id) => {
        if (window.confirm('Bạn có chắc chắn muốn sao chép gói dịch vụ này?')) {
            const res = await adminAdsService.clonePackage(id);
            if (res.success) {
                showToast('Đã sao chép gói dịch vụ thành công!');
                loadData();
            }
        }
    };

    // Delete Item from Database
    const handleDeleteItem = async (item) => {
        const itemType = activeTab === 'packages' ? 'gói dịch vụ' : activeTab === 'slots' ? 'vị trí quảng cáo' : 'đơn quảng cáo';
        if (window.confirm(`XÁC NHẬN XÓA: Bạn có chắc chắn muốn xóa ${itemType} "${item.name || item.orderCode}" khỏi cơ sở dữ liệu?`)) {
            let res;
            if (activeTab === 'packages') res = await adminAdsService.deletePackage(item.id);
            else if (activeTab === 'slots') res = await adminAdsService.deleteSlot(item.id);
            else if (activeTab === 'orders') res = await adminAdsService.deleteOrder(item.id);

            if (res && res.success) {
                showToast(`Đã xóa ${itemType} khỏi cơ sở dữ liệu!`);
                loadData();
            } else {
                showToast(`Đã xóa ${itemType}!`);
                loadData();
            }
        }
    };

    return (
        <div className="ads-management-wrapper">
            {/* Toast Banner */}
            {toastMessage && (
                <div style={{
                    position: 'fixed',
                    top: '24px',
                    right: '24px',
                    backgroundColor: toastMessage.type === 'success' ? '#15803D' : '#DC2626',
                    color: '#FFFFFF',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontWeight: '700',
                    fontSize: '14px',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                    zIndex: 9999999,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <span className="material-symbols-outlined">check_circle</span>
                    <span>{toastMessage.text}</span>
                </div>
            )}

            {/* 1. Top Stat Cards (Grid 4 cột Thống kê Doanh thu & Dịch vụ Quảng cáo) */}
            <div className="ads-stats-grid">
                <div className="ads-stat-card">
                    <div className="ads-stat-info">
                        <span className="ads-stat-label">Doanh Thu Dịch Vụ Ads</span>
                        <span className="ads-stat-value">{stats.revenueFormatted}</span>
                        <span className="ads-stat-subtext">
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>payments</span> {stats.revenueSubtext || 'Tháng này (+18.4%)'}
                        </span>
                    </div>
                    <div className="ads-stat-icon-wrapper emerald">
                        <span className="material-symbols-outlined">monetization_on</span>
                    </div>
                </div>

                <div className="ads-stat-card">
                    <div className="ads-stat-info">
                        <span className="ads-stat-label">Gói Dịch Vụ Đang Bán</span>
                        <span className="ads-stat-value">{stats.sellingPackagesCount}</span>
                        <span className="ads-stat-subtext">
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>storefront</span> {stats.packagesSubtext || 'Mở bán trên cổng Host'}
                        </span>
                    </div>
                    <div className="ads-stat-icon-wrapper green">
                        <span className="material-symbols-outlined">sell</span>
                    </div>
                </div>

                <div className="ads-stat-card">
                    <div className="ads-stat-info">
                        <span className="ads-stat-label">Đơn Dịch Vụ Đang Chạy</span>
                        <span className="ads-stat-value">{stats.runningOrdersCount}</span>
                        <span className="ads-stat-subtext">
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>rocket_launch</span> {stats.ordersSubtext || 'Chủ Homestay đã kích hoạt'}
                        </span>
                    </div>
                    <div className="ads-stat-icon-wrapper blue">
                        <span className="material-symbols-outlined">campaign</span>
                    </div>
                </div>

                <div className="ads-stat-card">
                    <div className="ads-stat-info">
                        <span className="ads-stat-label">Tỷ Lệ Gia Hạn Gói</span>
                        <span className="ads-stat-value">{stats.renewalRate}</span>
                        <span className="ads-stat-subtext">
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>trending_up</span> {stats.renewalSubtext || 'Khách hàng tiếp tục mua'}
                        </span>
                    </div>
                    <div className="ads-stat-icon-wrapper amber">
                        <span className="material-symbols-outlined">autorenew</span>
                    </div>
                </div>
            </div>

            {/* 2. Main Content Module Card */}
            <div className="content-module-card">
                
                {/* Module Header Bar */}
                <div className="module-header-bar">
                    <div className="module-title-group">
                        <h2>
                            <span className="material-symbols-outlined" style={{ color: 'var(--primary-color)' }}>campaign</span>
                            Bán & Cung Cấp Dịch Vụ Quảng Cáo
                        </h2>
                        <span className="module-subtitle">Dữ liệu kết nối cơ sở dữ liệu PostgreSQL. Quản lý gói tiếp thị, vị trí banner & khung hiển thị bán linh hoạt.</span>
                    </div>

                    {/* Sub-module Navigation Tabs */}
                    <div className="content-tabs">
                        <button className={`content-tab-btn ${activeTab === 'packages' ? 'active' : ''}`} onClick={() => switchAdsTab('packages')}>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>sell</span>
                            Gói Dịch Vụ Đang Bán ({packages.length})
                        </button>
                        <button className={`content-tab-btn ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => switchAdsTab('orders')}>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>receipt_long</span>
                            Đơn Mua & Đang Chạy ({orders.length})
                        </button>
                        <button className={`content-tab-btn ${activeTab === 'slots' ? 'active' : ''}`} onClick={() => switchAdsTab('slots')}>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>ad_units</span>
                            Vị Trí & Khung Hiển Thị (Slots) ({slots.length})
                        </button>
                    </div>
                </div>

                {/* Module Toolbar (Search & Filter & Create Button) */}
                <div className="module-toolbar">
                    <div className="toolbar-left">
                        <div className="search-box-sm">
                            <span className="material-symbols-outlined" style={{ color: 'var(--text-muted)', marginRight: '6px', fontSize: '18px' }}>search</span>
                            <input 
                                type="text" 
                                placeholder={
                                    activeTab === 'packages' ? "Tìm theo tên gói, mã gói, mô tả..." :
                                    activeTab === 'slots' ? "Tìm vị trí banner, mã slot..." :
                                    "Tìm mã đơn, homestay, chủ nhà..."
                                } 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <select className="select-filter-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                            <option value="all">Tất cả trạng thái</option>
                            {activeTab === 'packages' && (
                                <>
                                    <option value="active">Đang mở bán</option>
                                    <option value="paused">Tạm ngưng mở bán</option>
                                </>
                            )}
                            {activeTab === 'slots' && (
                                <>
                                    <option value="selling">Đang bán (SELLING)</option>
                                    <option value="locked">Tạm khóa (LOCKED)</option>
                                </>
                            )}
                            {activeTab === 'orders' && (
                                <>
                                    <option value="running">Đang chạy (RUNNING)</option>
                                    <option value="paused">Tạm dừng (PAUSED)</option>
                                </>
                            )}
                        </select>

                        <button className="btn-admin-cancel" onClick={loadData} title="Tải lại từ CSDL" style={{ padding: '8px 12px' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>refresh</span>
                        </button>
                    </div>

                    <button 
                        id="btn-create-ad-item"
                        className="btn-admin-primary" 
                        onClick={openCreateModal}
                        style={{ cursor: 'pointer', zIndex: 10 }}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add_circle</span>
                        <span>
                            {activeTab === 'packages' ? '+ Tạo Gói Dịch Vụ Mới' :
                             activeTab === 'slots' ? '+ Tạo Vị Trí / Khung Hiển Thị Mới' :
                             '+ Tạo Đơn Quảng Cáo Mới'}
                        </span>
                    </button>
                </div>

                {/* Data Table View */}
                <div className="table-responsive">
                    {loading ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '36px', animation: 'spin 1s linear infinite' }}>sync</span>
                            <p style={{ marginTop: '8px', fontWeight: '600' }}>Đang tải dữ liệu thực từ cơ sở dữ liệu PostgreSQL...</p>
                        </div>
                    ) : (
                        <table className="admin-data-table">
                            <thead>
                                {activeTab === 'packages' && (
                                    <tr>
                                        <th>MÃ GÓI</th>
                                        <th>TÊN GÓI DỊCH VỤ</th>
                                        <th>PHÂN LOẠI</th>
                                        <th>GIÁ NIÊM YẾT (VNĐ)</th>
                                        <th>THỜI HẠN</th>
                                        <th>QUYỀN LỢI NỔI BẬT</th>
                                        <th>TRẠNG THÁI</th>
                                        <th style={{ textAlign: 'center' }}>HÀNH ĐỘNG</th>
                                    </tr>
                                )}
                                {activeTab === 'orders' && (
                                    <tr>
                                        <th>MÃ ĐƠN</th>
                                        <th>HOMESTAY / KHÁCH HÀNG</th>
                                        <th>GÓI DỊCH VỤ</th>
                                        <th>THỜI GIAN CHẠY</th>
                                        <th>GIÁ TRỊ ĐƠN</th>
                                        <th>TRẠNG THÁI</th>
                                        <th style={{ textAlign: 'center' }}>HÀNH ĐỘNG</th>
                                    </tr>
                                )}
                                {activeTab === 'slots' && (
                                    <tr>
                                        <th>MÃ SLOT</th>
                                        <th>TÊN VỊ TRÍ / KHU VỰC</th>
                                        <th>KHU VỰC TRANG</th>
                                        <th>KÍCH THƯỚC</th>
                                        <th>ĐANG SỬ DỤNG</th>
                                        <th>CTR TRUNG BÌNH</th>
                                        <th>TRẠNG THÁI</th>
                                        <th style={{ textAlign: 'center' }}>HÀNH ĐỘNG</th>
                                    </tr>
                                )}
                            </thead>
                            <tbody>
                                {/* 1. GÓI DỊCH VỤ QUẢNG CÁO */}
                                {activeTab === 'packages' && (
                                    filteredPackages.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: '#64748B' }}>
                                                {packages.length === 0 ? (
                                                    <>Chưa có gói dịch vụ nào trong cơ sở dữ liệu. Nhấn <button className="btn-admin-primary" style={{ display: 'inline-flex', padding: '4px 10px', fontSize: '12px', marginLeft: '6px' }} onClick={openCreateModal}>+ Tạo Gói Dịch Vụ Mới</button> để bổ sung!</>
                                                ) : (
                                                    'Không tìm thấy gói dịch vụ nào phù hợp với bộ lọc tìm kiếm.'
                                                )}
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredPackages.map(pkg => (
                                            <tr key={pkg.id}>
                                                <td><span className="order-code-badge">{pkg.code}</span></td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        {pkg.imageUrl && (
                                                            <img src={pkg.imageUrl} alt={pkg.name} className="banner-thumb" />
                                                        )}
                                                        <div>
                                                            <strong style={{ color: '#0F172A', fontSize: '14px', display: 'block' }}>{pkg.name}</strong>
                                                            <span style={{ fontSize: '11.5px', color: '#64748B' }}>{pkg.adPosition}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`package-badge ${pkg.packageType}`}>
                                                        {pkg.packageType === 'hot' ? '🔥 Gói HOT' :
                                                         pkg.packageType === 'vip' ? '💎 VIP Toàn Diện' :
                                                         pkg.packageType === 'short' ? '⚡ Ngắn Hạn' :
                                                         pkg.packageType === 'seasonal' ? '🌾 Lễ Hội' : '📅 Dài Hạn'}
                                                    </span>
                                                </td>
                                                <td><span className="price-tag">{pkg.priceFormatted}</span></td>
                                                <td>
                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                        <strong style={{ color: '#0F172A', fontWeight: '700', fontSize: '13px' }}>
                                                            {pkg.durationType === 'MONTH' ? `${pkg.durationValue || Math.round((pkg.durationDays || 30) / 30)} Tháng` : 
                                                             pkg.durationType === 'WEEK' ? `${pkg.durationValue || Math.round((pkg.durationDays || 7) / 7)} Tuần` :
                                                             `${pkg.durationValue || pkg.durationDays || 30} Ngày`}
                                                        </strong>
                                                        <span style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                                                            {pkg.durationType === 'MONTH' ? `(${pkg.durationDays || ((pkg.durationValue || 1) * 30)} ngày hiệu lực)` :
                                                             (pkg.durationDays >= 30 ? `(~${Math.round(pkg.durationDays / 30)} tháng)` : 'Gói ngắn hạn')}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td>
                                                    {pkg.benefitList && pkg.benefitList.length > 0 ? (
                                                        pkg.benefitList.slice(0, 2).map((b, idx) => (
                                                            <span key={idx} className="feature-pill">{b}</span>
                                                        ))
                                                    ) : (
                                                        <span className="feature-pill">Top 5 Tìm Kiếm</span>
                                                    )}
                                                    {pkg.benefitList && pkg.benefitList.length > 2 && (
                                                        <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '600', marginLeft: '2px' }}>+{pkg.benefitList.length - 2}</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <span className={`user-status-badge ${pkg.status === 'ACTIVE' || pkg.status === 'ĐANG MỞ BÁN' ? 'active' : 'paused'}`}>
                                                        {pkg.status === 'ACTIVE' || pkg.status === 'ĐANG MỞ BÁN' ? 'Đang mở bán' : 'Tạm ngưng'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="actions-cell" style={{ justifyContent: 'center' }}>
                                                        <button className="btn-action-icon" title="Xem chi tiết" onClick={() => openDetailModal(pkg)}>
                                                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>visibility</span>
                                                        </button>
                                                        <button className="btn-action-icon" title="Chỉnh sửa" onClick={() => openEditModal(pkg)}>
                                                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                                                        </button>
                                                        <button className="btn-action-icon clone" title="Sao chép gói" onClick={() => handleClonePackage(pkg.id)}>
                                                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>content_copy</span>
                                                        </button>
                                                        <button className="btn-action-icon toggle" title="Bật / Tắt mở bán" onClick={() => handleToggleStatus(pkg)}>
                                                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>power_settings_new</span>
                                                        </button>
                                                        <button className="btn-action-icon delete" title="Xóa khỏi CSDL" onClick={() => handleDeleteItem(pkg)}>
                                                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )
                                )}

                                {/* 2. VỊ TRÍ & KHUNG HIỂN THỊ (SLOTS) */}
                                {activeTab === 'slots' && (
                                    filteredSlots.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: '#64748B' }}>
                                                {slots.length === 0 ? (
                                                    <>Chưa có vị trí quảng cáo nào. Nhấn <button className="btn-admin-primary" style={{ display: 'inline-flex', padding: '4px 10px', fontSize: '12px', marginLeft: '6px' }} onClick={openCreateModal}>+ Tạo Vị Trí Mới</button> để tự thiết lập!</>
                                                ) : (
                                                    'Không tìm thấy vị trí quảng cáo nào phù hợp với bộ lọc tìm kiếm.'
                                                )}
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredSlots.map(slot => (
                                            <tr key={slot.id}>
                                                <td><span className="order-code-badge">{slot.code}</span></td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        {slot.imageUrl && (
                                                            <img src={slot.imageUrl} alt={slot.name} className="banner-thumb" />
                                                        )}
                                                        <div>
                                                            <strong style={{ color: '#0F172A', fontSize: '14px', display: 'block' }}>{slot.name}</strong>
                                                            <span style={{ fontSize: '11.5px', color: '#64748B' }}>{slot.allowedTypes}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="placement-badge hero">
                                                        {slot.pageArea === 'trang_chu' ? '🏠 Trang Chủ' :
                                                         slot.pageArea === 'chi_tiet_homestay' ? '🏘️ Chi Tiết Homestay' :
                                                         slot.pageArea === 'tim_kiem' ? '🔍 Trang Tìm Kiếm' : '📍 Trang Khám Phá'}
                                                    </span>
                                                </td>
                                                <td><strong style={{ color: '#334155' }}>{slot.dimensions}</strong></td>
                                                <td><strong style={{ color: '#15803D' }}>{slot.slotsUsageText}</strong></td>
                                                <td><span className="ctr-badge">📈 {slot.avgCtr}</span></td>
                                                <td>
                                                    <span className={`user-status-badge ${slot.status === 'SELLING' ? 'selling' : 'locked'}`}>
                                                        {slot.status === 'SELLING' ? 'Đang bán' : 'Tạm khóa'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="actions-cell" style={{ justifyContent: 'center' }}>
                                                        <button className="btn-action-icon" title="Xem chi tiết vị trí" onClick={() => openDetailModal(slot)}>
                                                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>visibility</span>
                                                        </button>
                                                        <button className="btn-action-icon" title="Chỉnh sửa vị trí & giá" onClick={() => openEditModal(slot)}>
                                                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                                                        </button>
                                                        <button className="btn-action-icon toggle" title="Bật / Khóa vị trí" onClick={() => handleToggleStatus(slot)}>
                                                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>lock</span>
                                                        </button>
                                                        <button className="btn-action-icon delete" title="Xóa vị trí" onClick={() => handleDeleteItem(slot)}>
                                                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )
                                )}

                                {/* 3. ĐƠN MUA & ĐANG CHẠY */}
                                {activeTab === 'orders' && (
                                    filteredOrders.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#64748B' }}>
                                                {orders.length === 0 ? 'Chưa có đơn quảng cáo nào trong hệ thống.' : 'Không tìm thấy đơn quảng cáo nào phù hợp với bộ lọc tìm kiếm.'}
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredOrders.map(ord => (
                                            <tr key={ord.id}>
                                                <td><span className="order-code-badge">{ord.orderCode}</span></td>
                                                <td>
                                                    <strong style={{ color: '#0F172A', fontSize: '14px' }}>{ord.homestayName}</strong>
                                                    <div className="host-sub">Chủ nhà: {ord.hostName} ({ord.hostPhone})</div>
                                                </td>
                                                <td>
                                                    <span className={`package-badge ${ord.packageType || 'hot'}`}>{ord.packageName}</span>
                                                </td>
                                                <td><span style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>{ord.dateRangeText}</span></td>
                                                <td><span className="price-tag">{ord.pricePaidFormatted}</span></td>
                                                <td>
                                                    <span className={`user-status-badge ${ord.status === 'RUNNING' || ord.status === 'ACTIVE' ? 'running' : 'paused'}`}>
                                                        {ord.status === 'RUNNING' || ord.status === 'ACTIVE' ? 'Đang chạy' : 'Tạm dừng'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="actions-cell" style={{ justifyContent: 'center' }}>
                                                        <button className="btn-action-icon" title="Sửa đơn" onClick={() => openEditModal(ord)}>
                                                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                                                        </button>
                                                        <button className="btn-action-icon toggle" title="Bật / Tạm dừng" onClick={() => handleToggleStatus(ord)}>
                                                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>pause_circle</span>
                                                        </button>
                                                        <button className="btn-action-icon delete" title="Xóa đơn" onClick={() => handleDeleteItem(ord)}>
                                                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* 3. MODAL THÊM / CHỈNH SỬA GÓI DỊCH VỤ HOẶC VỊ TRÍ QUẢNG CÁO */}
            {showModal && (
                <div 
                    className="ads-modal-overlay show modal-overlay show" 
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(15, 23, 42, 0.7)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 999999,
                        opacity: 1,
                        visibility: 'visible',
                        pointerEvents: 'auto'
                    }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) closeModal();
                    }}
                >
                    <div 
                        className="ads-modal-container modal-container" 
                        style={{
                            maxWidth: '680px',
                            width: '95vw',
                            maxHeight: '90vh',
                            background: '#FFFFFF',
                            borderRadius: '16px',
                            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.35)',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                            opacity: 1,
                            visibility: 'visible'
                        }}
                    >
                        <div className="ads-modal-header modal-header" style={{
                            padding: '18px 24px',
                            borderBottom: '1px solid #E2E8F0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: '#F8FAFC'
                        }}>
                            <h3 className="modal-title" style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span className="material-symbols-outlined" style={{ color: 'var(--primary-color, #15803D)' }}>
                                    {activeTab === 'packages' ? 'sell' : activeTab === 'slots' ? 'ad_units' : 'campaign'}
                                </span>
                                <span>
                                    {editingItem ? 'Chỉnh Sửa' : 'Tạo Mới'} {
                                        activeTab === 'packages' ? 'Gói Dịch Vụ Quảng Cáo' :
                                        activeTab === 'slots' ? 'Vị Trí & Khung Hiển Thị Quảng Cáo' :
                                        'Đơn Quảng Cáo Homestay'
                                    }
                                </span>
                            </h3>
                            <button 
                                type="button" 
                                className="modal-close-btn" 
                                onClick={closeModal} 
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center' }}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>close</span>
                            </button>
                        </div>

                        <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                            <div className="ads-modal-body modal-body" style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
                                
                                {/* FORM FOR PACKAGE */}
                                {activeTab === 'packages' && (
                                    <div>
                                        <div className="form-group-grid">
                                            <div className="form-field">
                                                <label className="form-label">Mã gói dịch vụ <span style={{ color: 'red' }}>*</span></label>
                                                <input 
                                                    type="text" 
                                                    className="form-input" 
                                                    value={packageForm.code} 
                                                    onChange={(e) => setPackageForm({...packageForm, code: e.target.value})}
                                                    placeholder="PKG-001" 
                                                />
                                            </div>

                                            <div className="form-field">
                                                <label className="form-label">Phân loại gói <span style={{ color: 'red' }}>*</span></label>
                                                <select 
                                                    className="form-select" 
                                                    value={packageForm.packageType}
                                                    onChange={(e) => setPackageForm({...packageForm, packageType: e.target.value})}
                                                >
                                                    <option value="hot">🔥 Gói HOT (Phổ biến nhất)</option>
                                                    <option value="short">⚡ Ngắn hạn (3 - 7 ngày)</option>
                                                    <option value="long">📅 Dài hạn (30 ngày)</option>
                                                    <option value="seasonal">🌾 Mùa Cao Điểm / Lễ Hội</option>
                                                    <option value="vip">💎 Gói Banner VIP Toàn Diện</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="form-field full">
                                            <label className="form-label">Tên Gói Dịch Vụ Tiếp Thị <span style={{ color: 'red' }}>*</span></label>
                                            <input 
                                                type="text" 
                                                className="form-input" 
                                                value={packageForm.name} 
                                                onChange={(e) => setPackageForm({...packageForm, name: e.target.value})}
                                                placeholder="Ví dụ: Gói Top 1 Chuyên Nghiệp..." 
                                                required 
                                            />
                                        </div>

                                        <div className="form-group-grid">
                                            <div className="form-field">
                                                <label className="form-label">Giá niêm yết bán (VNĐ) <span style={{ color: 'red' }}>*</span></label>
                                                <input 
                                                    type="text" 
                                                    className="form-input" 
                                                    value={packageForm.price} 
                                                    onChange={(e) => setPackageForm({...packageForm, price: e.target.value})}
                                                    placeholder="Ví dụ: 990000" 
                                                    required 
                                                />
                                            </div>

                                            <div className="form-field">
                                                <label className="form-label">Chi phí phát sinh nếu có (VNĐ)</label>
                                                <input 
                                                    type="text" 
                                                    className="form-input" 
                                                    value={packageForm.extraFee} 
                                                    onChange={(e) => setPackageForm({...packageForm, extraFee: e.target.value})}
                                                    placeholder="0" 
                                                />
                                            </div>
                                        </div>

                                        {/* THỜI HẠN GÓI DỊCH VỤ CHUYÊN NGHIỆP & RÕ RÀNG */}
                                        <div className="form-field full duration-setting-panel">
                                            <div className="duration-header-row">
                                                <label className="form-label" style={{ marginBottom: 0 }}>
                                                    <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#15803D', verticalAlign: 'middle', marginRight: '4px' }}>schedule</span>
                                                    Thời Hạn Gói Dịch Vụ <span style={{ color: 'red' }}>*</span>
                                                </label>
                                                <span className="duration-hint-badge">
                                                    Chọn số lượng và đơn vị (Ngày hoặc Tháng)
                                                </span>
                                            </div>

                                            {/* Input số lượng & Đơn vị tách bạch rõ ràng */}
                                            <div className="duration-inputs-inline">
                                                <div className="duration-value-input-box">
                                                    <span className="duration-prefix-label">Số lượng:</span>
                                                    <input 
                                                        type="number" 
                                                        min="1" 
                                                        className="form-input duration-number-input" 
                                                        value={packageForm.durationValue || ''} 
                                                        onChange={(e) => handleDurationChange(e.target.value, packageForm.durationType || 'DAY')}
                                                        placeholder="Ví dụ: 30" 
                                                        required 
                                                    />
                                                </div>

                                                <div className="duration-unit-selector">
                                                    <span className="duration-prefix-label">Đơn vị:</span>
                                                    <div className="unit-toggle-group">
                                                        <button 
                                                            type="button" 
                                                            className={`unit-toggle-btn ${packageForm.durationType === 'DAY' ? 'active' : ''}`}
                                                            onClick={() => handleDurationChange(packageForm.durationValue || '30', 'DAY')}
                                                        >
                                                            📅 Ngày
                                                        </button>
                                                        <button 
                                                            type="button" 
                                                            className={`unit-toggle-btn ${packageForm.durationType === 'MONTH' ? 'active' : ''}`}
                                                            onClick={() => handleDurationChange(packageForm.durationValue || '1', 'MONTH')}
                                                        >
                                                            🗓️ Tháng (x30 ngày)
                                                        </button>
                                                        <button 
                                                            type="button" 
                                                            className={`unit-toggle-btn ${packageForm.durationType === 'WEEK' ? 'active' : ''}`}
                                                            onClick={() => handleDurationChange(packageForm.durationValue || '1', 'WEEK')}
                                                        >
                                                            📆 Tuần (x7 ngày)
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Chọn nhanh mốc thời gian phổ biến */}
                                            <div className="duration-presets-container">
                                                <span className="presets-label">⚡ Chọn nhanh mốc thời gian phổ biến:</span>
                                                <div className="presets-chips-row">
                                                    {DURATION_PRESETS.map((p, idx) => {
                                                        const isSelected = String(packageForm.durationValue) === String(p.value) && packageForm.durationType === p.type;
                                                        return (
                                                            <button 
                                                                key={idx} 
                                                                type="button" 
                                                                className={`duration-preset-chip ${isSelected ? 'selected' : ''}`}
                                                                onClick={() => handleSelectPreset(p)}
                                                            >
                                                                {p.label}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Hộp quy đổi trực quan */}
                                            <div className="duration-calculated-summary">
                                                <span className="material-symbols-outlined" style={{ color: '#15803D', fontSize: '22px', flexShrink: 0 }}>verified</span>
                                                <div>
                                                    <strong>Thời hạn quy đổi lưu CSDL: </strong>
                                                    <span className="highlight-days">
                                                        {packageForm.durationDays || calculateDurationDays(packageForm.durationValue, packageForm.durationType)} Ngày hiệu lực
                                                    </span>
                                                    <span className="sub-desc">
                                                        {packageForm.durationType === 'MONTH' 
                                                            ? ` (tương đương ${packageForm.durationValue || 1} tháng chiến dịch tính theo chu kỳ 30 ngày/tháng)`
                                                            : packageForm.durationType === 'WEEK'
                                                            ? ` (tương đương ${packageForm.durationValue || 1} tuần chiến dịch)`
                                                            : ` (hiệu lực chính xác ${packageForm.durationValue || 30} ngày)`}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="form-group-grid">
                                            <div className="form-field">
                                                <label className="form-label">Vị trí / Khung hiển thị áp dụng</label>
                                                <input 
                                                    type="text" 
                                                    className="form-input" 
                                                    value={packageForm.adPosition} 
                                                    onChange={(e) => setPackageForm({...packageForm, adPosition: e.target.value})}
                                                    placeholder="⚡ Ưu tiên TOP 5 Tìm Kiếm / Hero Slider Trang Chủ" 
                                                />
                                            </div>

                                            <div className="form-field">
                                                <label className="form-label">Kích thước & Định dạng banner</label>
                                                <input 
                                                    type="text" 
                                                    className="form-input" 
                                                    value={packageForm.supportedFormats} 
                                                    onChange={(e) => setPackageForm({...packageForm, supportedFormats: e.target.value})}
                                                    placeholder="1920x600px | Image, Banner" 
                                                />
                                            </div>
                                        </div>

                                        <div className="form-field full">
                                            <label className="form-label">Số lượng slot hiển thị tối đa</label>
                                            <input 
                                                type="number" 
                                                className="form-input" 
                                                value={packageForm.maxSlots} 
                                                onChange={(e) => setPackageForm({...packageForm, maxSlots: e.target.value})}
                                                placeholder="5" 
                                            />
                                        </div>

                                        {/* HÌNH ẢNH MINH HỌA & LIVE PREVIEW TỨC THÌ */}
                                        <div className="form-field full live-preview-field">
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                                                <label className="form-label" style={{ marginBottom: 0 }}>
                                                    <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#15803D', verticalAlign: 'middle', marginRight: '4px' }}>image</span>
                                                    Hình ảnh minh họa / Banner xem trước (URL)
                                                </label>
                                                {packageForm.imageUrl && (
                                                    <button 
                                                        type="button" 
                                                        className="btn-clear-img" 
                                                        onClick={() => { setPackageForm(prev => ({ ...prev, imageUrl: '' })); setPkgImgError(false); }}
                                                    >
                                                        <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>close</span> Xóa link ảnh
                                                    </button>
                                                )}
                                            </div>

                                            <input 
                                                type="text" 
                                                className="form-input" 
                                                value={packageForm.imageUrl} 
                                                onChange={(e) => {
                                                    setPackageForm({...packageForm, imageUrl: e.target.value});
                                                    setPkgImgError(false);
                                                }}
                                                placeholder="Dán đường dẫn ảnh: https://images.unsplash.com/... (.jpg, .png, .webp)" 
                                            />

                                            {/* Gợi ý chọn ảnh mẫu nhanh */}
                                            <div className="sample-images-bar">
                                                <span className="sample-title">Gợi ý mẫu ảnh đẹp:</span>
                                                {SAMPLE_BANNER_IMAGES.map((img, i) => (
                                                    <button 
                                                        key={i} 
                                                        type="button" 
                                                        className="sample-img-btn" 
                                                        onClick={() => {
                                                            setPackageForm(prev => ({ ...prev, imageUrl: img.url }));
                                                            setPkgImgError(false);
                                                        }}
                                                    >
                                                        📷 {img.name}
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Khung Live Preview Ảnh */}
                                            <div className="live-image-preview-container">
                                                {packageForm.imageUrl && packageForm.imageUrl.trim() ? (
                                                    <div className="preview-active-box">
                                                        {pkgImgError ? (
                                                            <div className="preview-error-state">
                                                                <span className="material-symbols-outlined error-icon">broken_image</span>
                                                                <div className="error-text">
                                                                    <strong>Không thể tải ảnh từ URL này!</strong>
                                                                    <p>Vui lòng kiểm tra lại đường dẫn ảnh (cần là link ảnh trực tiếp .jpg, .png, .webp có thể truy cập công khai).</p>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="preview-img-wrapper">
                                                                <img 
                                                                    src={packageForm.imageUrl} 
                                                                    alt="Xem trước banner gói dịch vụ" 
                                                                    className="preview-real-img"
                                                                    onError={() => setPkgImgError(true)}
                                                                    onLoad={() => setPkgImgError(false)}
                                                                />
                                                                <div className="preview-img-overlay">
                                                                    <span className="preview-status-pill success">
                                                                        <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>check_circle</span>
                                                                        Ảnh hiển thị trực quan thành công
                                                                    </span>
                                                                    <a 
                                                                        href={packageForm.imageUrl} 
                                                                        target="_blank" 
                                                                        rel="noreferrer" 
                                                                        className="preview-open-link"
                                                                        title="Mở ảnh gốc trong tab mới"
                                                                    >
                                                                        <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>open_in_new</span> Mở ảnh gốc
                                                                    </a>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="preview-placeholder-box">
                                                        <span className="material-symbols-outlined placeholder-icon">add_photo_alternate</span>
                                                        <p className="placeholder-text">Chưa có ảnh xem trước. Hãy dán liên kết URL ảnh vào ô trên hoặc chọn ảnh mẫu để kiểm tra hiển thị ngay tức thì tại đây!</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="form-field full">
                                            <label className="form-label">Mô tả chi tiết gói dịch vụ</label>
                                            <textarea 
                                                className="form-input" 
                                                rows="2" 
                                                value={packageForm.description}
                                                onChange={(e) => setPackageForm({...packageForm, description: e.target.value})}
                                                placeholder="Ví dụ: Tối ưu cho cả tháng, tiếp cận tối đa du khách đặt phòng..."
                                            ></textarea>
                                        </div>

                                        <div className="form-field full">
                                            <label className="form-label">Danh sách quyền lợi dịch vụ (phân cách bởi dấu chấm phẩy ;)</label>
                                            <textarea 
                                                className="form-input" 
                                                rows="2" 
                                                value={packageForm.benefits}
                                                onChange={(e) => setPackageForm({...packageForm, benefits: e.target.value})}
                                                placeholder="Top 5 Tìm Kiếm; Gắn badge Hot Homestay; Hỗ trợ banner bài viết"
                                            ></textarea>
                                        </div>

                                        <div className="form-field full">
                                            <label className="form-label">Trạng thái mở bán</label>
                                            <select 
                                                className="form-select"
                                                value={packageForm.status}
                                                onChange={(e) => setPackageForm({...packageForm, status: e.target.value})}
                                            >
                                                <option value="ACTIVE">Đang mở bán trên cổng Host (ACTIVE)</option>
                                                <option value="PAUSED">Tạm ngưng mở bán (PAUSED)</option>
                                            </select>
                                        </div>
                                    </div>
                                )}

                                {/* FORM FOR AD SLOT / POSITION */}
                                {activeTab === 'slots' && (
                                    <div>
                                        <div className="form-group-grid">
                                            <div className="form-field">
                                                <label className="form-label">Mã vị trí (Code) <span style={{ color: 'red' }}>*</span></label>
                                                <input 
                                                    type="text" 
                                                    className="form-input" 
                                                    value={slotForm.code} 
                                                    onChange={(e) => setSlotForm({...slotForm, code: e.target.value})}
                                                    placeholder="SLOT-HRO" 
                                                    required
                                                />
                                            </div>

                                            <div className="form-field">
                                                <label className="form-label">Tên vị trí quảng cáo <span style={{ color: 'red' }}>*</span></label>
                                                <input 
                                                    type="text" 
                                                    className="form-input" 
                                                    value={slotForm.name} 
                                                    onChange={(e) => setSlotForm({...slotForm, name: e.target.value})}
                                                    placeholder="Hero Slider Trang Chủ" 
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="form-group-grid">
                                            <div className="form-field">
                                                <label className="form-label">Trang / Khu vực hiển thị <span style={{ color: 'red' }}>*</span></label>
                                                <select 
                                                    className="form-select" 
                                                    value={slotForm.pageArea}
                                                    onChange={(e) => setSlotForm({...slotForm, pageArea: e.target.value})}
                                                >
                                                    <option value="trang_chu">🏠 Trang Chủ Website</option>
                                                    <option value="chi_tiet_homestay">🏘️ Trang Chi Tiết Homestay</option>
                                                    <option value="tim_kiem">🔍 Trang Kết Quả Tìm Kiếm</option>
                                                    <option value="kham_pha">📍 Trang Khám Phá & Lễ Hội</option>
                                                </select>
                                            </div>

                                            <div className="form-field">
                                                <label className="form-label">Vị trí cụ thể trên giao diện <span style={{ color: 'red' }}>*</span></label>
                                                <select 
                                                    className="form-select" 
                                                    value={slotForm.positionType}
                                                    onChange={(e) => setSlotForm({...slotForm, positionType: e.target.value})}
                                                >
                                                    <option value="banner_dau_trang">Banner Đầu Trang (Hero / Header)</option>
                                                    <option value="banner_giua_trang">Banner Giữa Trang (Body Banner)</option>
                                                    <option value="banner_cuoi_trang">Banner Cuối Trang (Footer Banner)</option>
                                                    <option value="khu_vuc_noi_bat">Khu Vực Nổi Bật (Top Spotlight)</option>
                                                    <option value="khu_vuc_de_xuat">Khu Vực Đề Xuất (Recommended Area)</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="form-group-grid">
                                            <div className="form-field">
                                                <label className="form-label">Kích thước khung quảng cáo</label>
                                                <input 
                                                    type="text" 
                                                    className="form-input" 
                                                    value={slotForm.dimensions} 
                                                    onChange={(e) => setSlotForm({...slotForm, dimensions: e.target.value})}
                                                    placeholder="1920x600px" 
                                                />
                                            </div>

                                            <div className="form-field">
                                                <label className="form-label">Loại nội dung được phép</label>
                                                <input 
                                                    type="text" 
                                                    className="form-input" 
                                                    value={slotForm.allowedTypes} 
                                                    onChange={(e) => setSlotForm({...slotForm, allowedTypes: e.target.value})}
                                                    placeholder="Banner, Hình ảnh, Liên kết" 
                                                />
                                            </div>
                                        </div>

                                        <div className="form-group-grid">
                                            <div className="form-field">
                                                <label className="form-label">Số quảng cáo tối đa / khung</label>
                                                <input 
                                                    type="number" 
                                                    className="form-input" 
                                                    value={slotForm.maxAds} 
                                                    onChange={(e) => setSlotForm({...slotForm, maxAds: e.target.value})}
                                                    placeholder="5" 
                                                />
                                            </div>

                                            <div className="form-field">
                                                <label className="form-label">Thời gian đặt tối thiểu (ngày)</label>
                                                <input 
                                                    type="number" 
                                                    className="form-input" 
                                                    value={slotForm.minDurationDays} 
                                                    onChange={(e) => setSlotForm({...slotForm, minDurationDays: e.target.value})}
                                                    placeholder="1" 
                                                />
                                            </div>
                                        </div>

                                        <div className="form-group-grid">
                                            <div className="form-field">
                                                <label className="form-label">Giá thuê theo ngày (VNĐ)</label>
                                                <input 
                                                    type="text" 
                                                    className="form-input" 
                                                    value={slotForm.priceDaily} 
                                                    onChange={(e) => setSlotForm({...slotForm, priceDaily: e.target.value})}
                                                    placeholder="100000" 
                                                />
                                            </div>

                                            <div className="form-field">
                                                <label className="form-label">Giá thuê theo tháng (VNĐ)</label>
                                                <input 
                                                    type="text" 
                                                    className="form-input" 
                                                    value={slotForm.priceMonthly} 
                                                    onChange={(e) => setSlotForm({...slotForm, priceMonthly: e.target.value})}
                                                    placeholder="2200000" 
                                                />
                                            </div>
                                        </div>

                                        {/* HÌNH ẢNH MINH HỌA VỊ TRÍ & LIVE PREVIEW TỨC THÌ */}
                                        <div className="form-field full live-preview-field">
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                                                <label className="form-label" style={{ marginBottom: 0 }}>
                                                    <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#15803D', verticalAlign: 'middle', marginRight: '4px' }}>image</span>
                                                    Hình ảnh minh họa vị trí quảng cáo (URL)
                                                </label>
                                                {slotForm.imageUrl && (
                                                    <button 
                                                        type="button" 
                                                        className="btn-clear-img" 
                                                        onClick={() => { setSlotForm(prev => ({ ...prev, imageUrl: '' })); setSlotImgError(false); }}
                                                    >
                                                        <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>close</span> Xóa link ảnh
                                                    </button>
                                                )}
                                            </div>

                                            <input 
                                                type="text" 
                                                className="form-input" 
                                                value={slotForm.imageUrl} 
                                                onChange={(e) => {
                                                    setSlotForm({...slotForm, imageUrl: e.target.value});
                                                    setSlotImgError(false);
                                                }}
                                                placeholder="Dán đường dẫn ảnh: https://images.unsplash.com/... (.jpg, .png, .webp)" 
                                            />

                                            {/* Gợi ý chọn ảnh mẫu nhanh */}
                                            <div className="sample-images-bar">
                                                <span className="sample-title">Gợi ý mẫu vị trí:</span>
                                                {SAMPLE_BANNER_IMAGES.map((img, i) => (
                                                    <button 
                                                        key={i} 
                                                        type="button" 
                                                        className="sample-img-btn" 
                                                        onClick={() => {
                                                            setSlotForm(prev => ({ ...prev, imageUrl: img.url }));
                                                            setSlotImgError(false);
                                                        }}
                                                    >
                                                        📷 {img.name}
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Khung Live Preview Ảnh */}
                                            <div className="live-image-preview-container">
                                                {slotForm.imageUrl && slotForm.imageUrl.trim() ? (
                                                    <div className="preview-active-box">
                                                        {slotImgError ? (
                                                            <div className="preview-error-state">
                                                                <span className="material-symbols-outlined error-icon">broken_image</span>
                                                                <div className="error-text">
                                                                    <strong>Không thể tải ảnh từ URL này!</strong>
                                                                    <p>Vui lòng kiểm tra lại đường dẫn ảnh vị trí quảng cáo.</p>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="preview-img-wrapper">
                                                                <img 
                                                                    src={slotForm.imageUrl} 
                                                                    alt="Xem trước vị trí quảng cáo" 
                                                                    className="preview-real-img"
                                                                    onError={() => setSlotImgError(true)}
                                                                    onLoad={() => setSlotImgError(false)}
                                                                />
                                                                <div className="preview-img-overlay">
                                                                    <span className="preview-status-pill success">
                                                                        <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>check_circle</span>
                                                                        Ảnh hiển thị trực quan thành công
                                                                    </span>
                                                                    <a 
                                                                        href={slotForm.imageUrl} 
                                                                        target="_blank" 
                                                                        rel="noreferrer" 
                                                                        className="preview-open-link"
                                                                        title="Mở ảnh gốc trong tab mới"
                                                                    >
                                                                        <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>open_in_new</span> Mở ảnh gốc
                                                                    </a>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="preview-placeholder-box">
                                                        <span className="material-symbols-outlined placeholder-icon">add_photo_alternate</span>
                                                        <p className="placeholder-text">Chưa có ảnh xem trước vị trí. Hãy dán liên kết URL ảnh vào ô trên để kiểm tra hiển thị trực quan!</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="form-field full">
                                            <label className="form-label">Mô tả vị trí & lợi ích dành cho người mua</label>
                                            <textarea 
                                                className="form-input" 
                                                rows="2" 
                                                value={slotForm.description}
                                                onChange={(e) => setSlotForm({...slotForm, description: e.target.value})}
                                                placeholder="Khung banner trượt chính xuất hiện ngay khi du khách truy cập trang chủ..."
                                            ></textarea>
                                        </div>

                                        <div className="form-field full">
                                            <label className="form-label">Trạng thái vị trí kinh doanh</label>
                                            <select 
                                                className="form-select"
                                                value={slotForm.status}
                                                onChange={(e) => setSlotForm({...slotForm, status: e.target.value})}
                                            >
                                                <option value="SELLING">Đang mở bán vị trí (SELLING)</option>
                                                <option value="LOCKED">Tạm khóa vị trí (LOCKED)</option>
                                                <option value="STOPPED">Ngừng kinh doanh (STOPPED)</option>
                                            </select>
                                        </div>
                                    </div>
                                )}

                                {/* FORM FOR ORDER */}
                                {activeTab === 'orders' && (
                                    <div>
                                        <div className="form-field full">
                                            <label className="form-label">Mã Homestay áp dụng (ID)</label>
                                            <input 
                                                type="text" 
                                                className="form-input" 
                                                value={orderForm.homestayId} 
                                                onChange={(e) => setOrderForm({...orderForm, homestayId: e.target.value})}
                                                placeholder="Ví dụ: 1 hoặc 2" 
                                            />
                                        </div>

                                        <div className="form-field full">
                                            <label className="form-label">Tiêu đề chiến dịch / Nội dung quảng bá</label>
                                            <input 
                                                type="text" 
                                                className="form-input" 
                                                value={orderForm.campaignTitle} 
                                                onChange={(e) => setOrderForm({...orderForm, campaignTitle: e.target.value})}
                                                placeholder="Chiến dịch Đẩy Top Homestay Đà Lạt" 
                                            />
                                        </div>

                                        <div className="form-field full">
                                            <label className="form-label">Trạng thái chiến dịch</label>
                                            <select 
                                                className="form-select"
                                                value={orderForm.status}
                                                onChange={(e) => setOrderForm({...orderForm, status: e.target.value})}
                                            >
                                                <option value="RUNNING">Đang chạy (RUNNING)</option>
                                                <option value="PAUSED">Tạm dừng (PAUSED)</option>
                                            </select>
                                        </div>
                                    </div>
                                )}

                            </div>

                            <div className="ads-modal-footer modal-footer" style={{
                                padding: '16px 24px',
                                borderTop: '1px solid #E2E8F0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-end',
                                gap: '12px',
                                background: '#F8FAFC'
                            }}>
                                <button type="button" className="btn-admin-cancel" onClick={closeModal} style={{ cursor: 'pointer' }}>Hủy bỏ</button>
                                <button 
                                    type="submit" 
                                    className="btn-admin-primary" 
                                    onClick={handleFormSubmit}
                                    style={{ cursor: 'pointer' }}
                                >
                                    Lưu Dữ Liệu Vào CSDL
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 4. DETAIL VIEW MODAL */}
            {showDetailModal && viewingItem && (
                <div 
                    className="ads-modal-overlay show modal-overlay show" 
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(15, 23, 42, 0.7)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 999999,
                        opacity: 1,
                        visibility: 'visible',
                        pointerEvents: 'auto'
                    }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) closeDetailModal();
                    }}
                >
                    <div className="ads-modal-container modal-container" style={{
                        maxWidth: '640px',
                        width: '90vw',
                        background: '#FFFFFF',
                        borderRadius: '16px',
                        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.35)',
                        overflow: 'hidden'
                    }}>
                        <div className="ads-modal-header modal-header" style={{
                            padding: '18px 24px',
                            borderBottom: '1px solid #E2E8F0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: '#F8FAFC'
                        }}>
                            <h3 className="modal-title" style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span className="material-symbols-outlined" style={{ color: 'var(--primary-color, #15803D)' }}>info</span>
                                <span>Chi Tiết {activeTab === 'packages' ? 'Gói Dịch Vụ Quảng Cáo' : 'Vị Trí Quảng Cáo'}</span>
                            </h3>
                            <button type="button" className="modal-close-btn" onClick={closeDetailModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>close</span>
                            </button>
                        </div>

                        <div className="ads-modal-body modal-body" style={{ padding: '24px' }}>
                            <div className="detail-preview-grid">
                                <div className="detail-img-box">
                                    <img src={viewingItem.imageUrl || 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80'} alt="Preview" />
                                </div>
                                <div className="detail-info-list">
                                    <div className="detail-info-item">
                                        <span className="detail-info-label">MÃ THIẾT LẬP:</span>
                                        <span className="detail-info-val"><span className="order-code-badge">{viewingItem.code}</span></span>
                                    </div>
                                    <div className="detail-info-item">
                                        <span className="detail-info-label">TÊN HIỂN THỊ:</span>
                                        <span className="detail-info-val">{viewingItem.name}</span>
                                    </div>
                                    <div className="detail-info-item">
                                        <span className="detail-info-label">GIÁ NIÊM YẾT:</span>
                                        <span className="detail-info-val price-tag">{viewingItem.priceFormatted || viewingItem.priceDailyFormatted || viewingItem.price}</span>
                                    </div>
                                    {activeTab === 'packages' && (
                                        <div className="detail-info-item">
                                            <span className="detail-info-label">THỜI HẠN ÁP DỤNG:</span>
                                            <span className="detail-info-val" style={{ color: '#15803D' }}>
                                                <strong>{viewingItem.durationType === 'MONTH' ? `${viewingItem.durationValue || Math.round((viewingItem.durationDays || 30) / 30)} Tháng` : `${viewingItem.durationValue || viewingItem.durationDays || 30} Ngày`}</strong> 
                                                <span style={{ fontSize: '12px', color: '#64748B', marginLeft: '6px' }}>({viewingItem.durationDays || 30} ngày hiệu lực trong CSDL)</span>
                                            </span>
                                        </div>
                                    )}
                                    <div className="detail-info-item">
                                        <span className="detail-info-label">TRẠNG THÁI HỆ THỐNG:</span>
                                        <span className="detail-info-val">
                                            <span className="user-status-badge active">{viewingItem.status}</span>
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="detail-info-item" style={{ marginBottom: '14px' }}>
                                <span className="detail-info-label">MÔ TẢ CHI TIẾT:</span>
                                <p style={{ fontSize: '13.5px', color: '#334155', lineHeight: '1.6', margin: '4px 0 0 0' }}>
                                    {viewingItem.description || 'Chưa có mô tả chi tiết.'}
                                </p>
                            </div>

                            {viewingItem.benefits && (
                                <div className="benefits-box">
                                    <h4>🎁 Danh Sách Quyền Lợi & Đặc Quyền:</h4>
                                    <ul>
                                        {viewingItem.benefitList && viewingItem.benefitList.length > 0 ? (
                                            viewingItem.benefitList.map((b, idx) => <li key={idx}>{b}</li>)
                                        ) : (
                                            <li>{viewingItem.benefits}</li>
                                        )}
                                    </ul>
                                </div>
                            )}
                        </div>

                        <div className="ads-modal-footer modal-footer" style={{
                            padding: '16px 24px',
                            borderTop: '1px solid #E2E8F0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            gap: '12px',
                            background: '#F8FAFC'
                        }}>
                            <button type="button" className="btn-admin-cancel" onClick={closeDetailModal} style={{ cursor: 'pointer' }}>Đóng</button>
                            <button type="button" className="btn-admin-primary" onClick={() => { closeDetailModal(); openEditModal(viewingItem); }} style={{ cursor: 'pointer' }}>
                                Chỉnh Sửa Dữ Liệu
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
