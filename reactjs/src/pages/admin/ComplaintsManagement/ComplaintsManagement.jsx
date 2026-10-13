import React, { useState, useEffect, useCallback } from 'react';
import './ComplaintsManagement.css';
import { adminComplaintService } from '../../../services/adminComplaintService';

export default function ComplaintsManagement() {
    // ── 1. STATE MANAGEMENT ──
    const [complaints, setComplaints] = useState([]);
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        touristToHs: 0,
        hsToTourist: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filters & Search
    const [activeTab, setActiveTab] = useState('all'); // 'all', 'tourist_to_homestay', 'homestay_to_tourist'
    const [statusFilter, setStatusFilter] = useState('all');
    const [severityFilter, setSeverityFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Modals
    const [showDisputeModal, setShowDisputeModal] = useState(false);
    const [selectedDispute, setSelectedDispute] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);

    // Resolution Form
    // Available Bookings from DB for Quick Linking
    const [availableBookings, setAvailableBookings] = useState([]);
    const [selectedBookingCode, setSelectedBookingCode] = useState('');
    const [selectedBookingInfo, setSelectedBookingInfo] = useState(null);
    const [newReporterPhone, setNewReporterPhone] = useState('');
    const [newReportedPhone, setNewReportedPhone] = useState('');
    const [newReportType, setNewReportType] = useState('Tiện nghi & Dịch vụ phòng');
    const [newRequestedAmount, setNewRequestedAmount] = useState('');
    const [highlightedComplaintId, setHighlightedComplaintId] = useState(null);

    // Resolution Form
    const [resolutionAction, setResolutionAction] = useState('refund_guest');
    const [resolutionAmount, setResolutionAmount] = useState(0);
    const [adminNote, setAdminNote] = useState('');
    const [submittingResolution, setSubmittingResolution] = useState(false);

    // Create New Dispute Form
    const [newDirection, setNewDirection] = useState('tourist_to_homestay');
    const [newBookingCode, setNewBookingCode] = useState('');
    const [newReporterName, setNewReporterName] = useState('');
    const [newReportedName, setNewReportedName] = useState('');
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');
    const [newDemands, setNewDemands] = useState('');
    const [newSeverity, setNewSeverity] = useState('medium');
    const [submittingCreate, setSubmittingCreate] = useState(false);

    // Toast Notification
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => {
            setToast({ show: false, message: '', type: 'success' });
        }, 3500);
    };

    // ── 2. FETCH DATA FROM BACKEND / NEON DATABASE ──
    const loadDataWithFilters = useCallback(async (filters) => {
        setLoading(true);
        setError(null);
        try {
            const [complaintsData, statsData] = await Promise.all([
                adminComplaintService.getComplaints(filters),
                adminComplaintService.getComplaintStats()
            ]);

            setComplaints(complaintsData || []);
            if (statsData) {
                setStats({
                    total: statsData.total || 0,
                    pending: statsData.pending || 0,
                    touristToHs: statsData.touristToHs || 0,
                    hsToTourist: statsData.hsToTourist || 0
                });
            }
        } catch (err) {
            console.error('[ComplaintsManagement] Lỗi khi tải dữ liệu từ CSDL:', err);
            setError(err.message || 'Không thể tải danh sách khiếu nại từ hệ thống.');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchData = useCallback(async () => {
        await loadDataWithFilters({
            direction: activeTab,
            status: statusFilter,
            severity: severityFilter,
            search: searchTerm
        });
    }, [activeTab, statusFilter, severityFilter, searchTerm, loadDataWithFilters]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // ── 3. ACTIONS & MODAL HANDLERS ──
    const handleOpenDisputeModal = (item) => {
        setSelectedDispute(item);
        setResolutionAction(item.resolutionAction || 'refund_guest');
        setResolutionAmount(item.requestedAmount || item.resolutionAmount || 0);
        setAdminNote(item.adminSolution || '');
        setShowDisputeModal(true);
    };

    const handleCloseDisputeModal = () => {
        setShowDisputeModal(false);
        setSelectedDispute(null);
    };

    const handleApplyResolution = async () => {
        if (!selectedDispute) return;

        setSubmittingResolution(true);
        try {
            await adminComplaintService.resolveComplaint(selectedDispute.id, {
                action: resolutionAction,
                amount: resolutionAmount,
                adminNote: adminNote.trim()
            });

            showToast(`Đã ban hành phán quyết cho hồ sơ ${selectedDispute.code} thành công!`, 'success');
            handleCloseDisputeModal();
            fetchData();
        } catch (err) {
            console.error('[ComplaintsManagement] Lỗi khi ban hành phán quyết:', err);
            showToast(err.message || 'Xử lý khiếu nại thất bại, vui lòng thử lại.', 'error');
        } finally {
            setSubmittingResolution(false);
        }
    };

    const handleOpenCreateModal = async () => {
        setNewDirection('tourist_to_homestay');
        setSelectedBookingCode('');
        setSelectedBookingInfo(null);
        setNewBookingCode('');
        setNewReporterName('');
        setNewReporterPhone('');
        setNewReportedName('');
        setNewReportedPhone('');
        setNewReportType('Tiện nghi & Dịch vụ phòng');
        setNewTitle('');
        setNewContent('');
        setNewDemands('');
        setNewRequestedAmount('');
        setNewSeverity('medium');
        setShowCreateModal(true);

        try {
            const bookings = await adminComplaintService.getAvailableBookings();
            setAvailableBookings(bookings || []);
        } catch (err) {
            console.warn('[ComplaintsManagement] Không thể tải danh sách booking gợi ý:', err);
        }
    };

    const handleBookingSelect = (code) => {
        setSelectedBookingCode(code);
        if (!code || code === 'manual') {
            setSelectedBookingInfo(null);
            if (code === 'manual') setNewBookingCode('#BK-');
            return;
        }

        const b = availableBookings.find(item => item.bookingCode === code);
        if (b) {
            setSelectedBookingInfo(b);
            setNewBookingCode(b.bookingCode);
            if (newDirection === 'tourist_to_homestay') {
                setNewReporterName(b.touristName);
                setNewReporterPhone(b.touristPhone);
                setNewReportedName(`${b.homestayName} (${b.hostName})`);
                setNewReportedPhone(b.hostPhone);
            } else {
                setNewReporterName(`${b.hostName} - ${b.homestayName}`);
                setNewReporterPhone(b.hostPhone);
                setNewReportedName(b.touristName);
                setNewReportedPhone(b.touristPhone);
            }
        }
    };

    const handleDirectionChange = (dir) => {
        setNewDirection(dir);
        if (selectedBookingInfo) {
            if (dir === 'tourist_to_homestay') {
                setNewReporterName(selectedBookingInfo.touristName);
                setNewReporterPhone(selectedBookingInfo.touristPhone);
                setNewReportedName(`${selectedBookingInfo.homestayName} (${selectedBookingInfo.hostName})`);
                setNewReportedPhone(selectedBookingInfo.hostPhone);
            } else {
                setNewReporterName(`${selectedBookingInfo.hostName} - ${selectedBookingInfo.homestayName}`);
                setNewReporterPhone(selectedBookingInfo.hostPhone);
                setNewReportedName(selectedBookingInfo.touristName);
                setNewReportedPhone(selectedBookingInfo.touristPhone);
            }
        }
    };

    const handleSaveNewDispute = async (e) => {
        if (e && e.preventDefault) e.preventDefault();

        if (!newReporterName.trim()) {
            showToast('Vui lòng điền tên bên gửi khiếu nại (Nguyên đơn)', 'error');
            return;
        }
        if (!newReportedName.trim()) {
            showToast('Vui lòng điền tên bên bị khiếu nại (Bị đơn)', 'error');
            return;
        }
        if (!newTitle.trim()) {
            showToast('Vui lòng điền tiêu đề khiếu nại', 'error');
            return;
        }
        if (!newContent.trim()) {
            showToast('Vui lòng điền nội dung chi tiết sự việc', 'error');
            return;
        }

        setSubmittingCreate(true);
        try {
            const created = await adminComplaintService.createComplaint({
                direction: newDirection,
                bookingCode: newBookingCode.trim() || undefined,
                bookingId: selectedBookingInfo?.bookingId || undefined,
                reporterName: newReporterName.trim(),
                reporterPhone: newReporterPhone.trim() || undefined,
                reportedName: newReportedName.trim(),
                reportedPhone: newReportedPhone.trim() || undefined,
                reportedHomestayName: selectedBookingInfo?.homestayName || undefined,
                reportType: newReportType,
                title: newTitle.trim(),
                content: newContent.trim(),
                demands: newDemands.trim() || undefined,
                requestedAmount: newRequestedAmount ? Number(newRequestedAmount) : undefined,
                bookingTotal: selectedBookingInfo?.totalPrice || undefined,
                stayDates: selectedBookingInfo?.stayDates || undefined,
                severity: newSeverity
            });

            // Reset filters so the new dispute is immediately visible
            setActiveTab('all');
            setStatusFilter('all');
            setSeverityFilter('all');
            setSearchTerm('');
            setShowCreateModal(false);
            setHighlightedComplaintId(created.id);

            showToast(`Đã tiếp nhận và tạo hồ sơ khiếu nại ${created.code} thành công!`, 'success');

            // Reload table
            await loadDataWithFilters({ direction: 'all', status: 'all', severity: 'all', search: '' });
        } catch (err) {
            console.error('[ComplaintsManagement] Lỗi khi tạo khiếu nại mới:', err);
            showToast(err.message || 'Không thể tạo hồ sơ khiếu nại mới.', 'error');
        } finally {
            setSubmittingCreate(false);
        }
    };


    return (
        <div className="complaints-management-wrapper">

            {/* ── TOP STAT CARDS (4 CỘT THỐNG KÊ KHIẾU NẠI TRỰC TIẾP CSDL) ── */}
            <div className="local-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '28px' }}>
                
                {/* 1. Tổng khiếu nại tiếp nhận */}
                <div className="dispute-stat-card">
                    <div className="dispute-stat-info">
                        <span className="dispute-stat-label">Tổng Khiếu Nại Tiếp Nhận</span>
                        <span className="dispute-stat-value">{stats.total}</span>
                        <span className="dispute-stat-subtext" style={{ color: '#DC2626' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>report_problem</span>
                            <span>Hồ sơ ghi nhận</span>
                        </span>
                    </div>
                    <div className="dispute-stat-icon-wrapper red">
                        <span className="material-symbols-outlined">warning</span>
                    </div>
                </div>

                {/* 2. Đang xử lý & Xác minh */}
                <div className="dispute-stat-card">
                    <div className="dispute-stat-info">
                        <span className="dispute-stat-label">Đang Xử Lý & Xác Minh</span>
                        <span className="dispute-stat-value" style={{ color: '#D97706' }}>{stats.pending}</span>
                        <span className="dispute-stat-subtext" style={{ color: '#D97706' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>hourglass_top</span>
                            <span>Cần giải quyết</span>
                        </span>
                    </div>
                    <div className="dispute-stat-icon-wrapper amber">
                        <span className="material-symbols-outlined">pending_actions</span>
                    </div>
                </div>

                {/* 3. Khách khiếu nại Homestay */}
                <div className="dispute-stat-card">
                    <div className="dispute-stat-info">
                        <span className="dispute-stat-label">Khách Khiếu Nại Homestay</span>
                        <span className="dispute-stat-value" style={{ color: '#2563EB' }}>{stats.touristToHs}</span>
                        <span className="dispute-stat-subtext" style={{ color: '#2563EB' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>person</span>
                            <span>Du khách phản ánh</span>
                        </span>
                    </div>
                    <div className="dispute-stat-icon-wrapper blue">
                        <span className="material-symbols-outlined">person_alert</span>
                    </div>
                </div>

                {/* 4. Homestay khiếu nại Khách */}
                <div className="dispute-stat-card">
                    <div className="dispute-stat-info">
                        <span className="dispute-stat-label">Homestay Khiếu Nại Khách</span>
                        <span className="dispute-stat-value" style={{ color: '#7C3AED' }}>{stats.hsToTourist}</span>
                        <span className="dispute-stat-subtext" style={{ color: '#7C3AED' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>cottage</span>
                            <span>Chủ nhà báo cáo</span>
                        </span>
                    </div>
                    <div className="dispute-stat-icon-wrapper purple">
                        <span className="material-symbols-outlined">home_repair_service</span>
                    </div>
                </div>

            </div>

            {/* ── MAIN CONTENT MODULE CARD ── */}
            <div className="content-module-card">
                
                {/* Module Header Bar */}
                <div className="module-header-bar">
                    <div className="module-title-group">
                        <h2>
                            <span className="material-symbols-outlined" style={{ color: '#DC2626' }}>report_problem</span>
                            Quản Lý Báo Cáo & Khiếu Nại (Tranh Chấp 2 Chiều)
                        </h2>
                        <span className="module-subtitle">
                            Trung tâm hòa giải và xử lý phản ánh: Khách du lịch khiếu nại Homestay & Chủ nhà khiếu nại Khách du lịch
                        </span>
                    </div>

                    {/* Tabs phân loại 2 chiều */}
                    <div className="content-tabs">
                        <button
                            type="button"
                            className={`content-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                            onClick={() => setActiveTab('all')}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>view_list</span>
                            Tất Cả Khiếu Nại
                        </button>
                        <button
                            type="button"
                            className={`content-tab-btn ${activeTab === 'tourist_to_homestay' ? 'active' : ''}`}
                            onClick={() => setActiveTab('tourist_to_homestay')}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>person</span>
                            Khách ➔ Homestay
                        </button>
                        <button
                            type="button"
                            className={`content-tab-btn ${activeTab === 'homestay_to_tourist' ? 'active' : ''}`}
                            onClick={() => setActiveTab('homestay_to_tourist')}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>cottage</span>
                            Homestay ➔ Khách
                        </button>
                    </div>
                </div>

                {/* Module Toolbar (Search & Filter & Action) */}
                <div className="module-toolbar">
                    <div className="toolbar-left">
                        <div className="search-box-sm">
                            <span className="material-symbols-outlined" style={{ color: '#64748B', marginRight: '6px', fontSize: '18px' }}>search</span>
                            <input
                                type="text"
                                placeholder="Tìm mã khiếu nại, mã booking, khách hàng, homestay..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <select
                            className="select-filter-sm"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">Tất cả trạng thái</option>
                            <option value="pending">Chờ tiếp nhận</option>
                            <option value="investigating">Đang xác minh / Đối chất</option>
                            <option value="resolved">Đã giải quyết</option>
                            <option value="rejected">Đã bác bỏ</option>
                        </select>

                        <select
                            className="select-filter-sm"
                            value={severityFilter}
                            onChange={(e) => setSeverityFilter(e.target.value)}
                        >
                            <option value="all">Tất cả mức độ</option>
                            <option value="urgent">Khẩn cấp</option>
                            <option value="medium">Trung bình</option>
                            <option value="low">Bình thường</option>
                        </select>
                    </div>

                    <button
                        type="button"
                        className="btn-admin-primary"
                        style={{ backgroundColor: '#DC2626' }}
                        onClick={handleOpenCreateModal}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add_alert</span>
                        <span>Ghi Nhận Khiếu Nại Mới</span>
                    </button>
                </div>

                {/* Data Table View */}
                <div className="table-responsive">
                    <table className="admin-data-table">
                        <thead>
                            <tr>
                                <th>Mã Hồ Sơ</th>
                                <th>Chiều Khiếu Nại</th>
                                <th>Các Bên Tranh Chấp</th>
                                <th>Nội Dung & Yêu Cầu</th>
                                <th>Mức Độ</th>
                                <th>Trạng Thái</th>
                                <th style={{ textAlign: 'right', paddingRight: '20px' }}>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '48px 20px', color: '#64748B' }}>
                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                                            <span className="material-symbols-outlined" style={{ animation: 'spin 1s linear infinite' }}>sync</span>
                                            <span>Đang tải dữ liệu hồ sơ từ Neon PostgreSQL...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : error ? (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px 20px', color: '#DC2626' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                            <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>error</span>
                                            <span>{error}</span>
                                            <button
                                                className="btn-dash-action"
                                                style={{ marginTop: '8px' }}
                                                onClick={fetchData}
                                            >
                                                Thử lại
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : complaints.length === 0 ? (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '48px 20px', color: '#94A3B8' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                            <span className="material-symbols-outlined" style={{ fontSize: '36px', color: '#CBD5E1' }}>inbox</span>
                                            <span>Không có hồ sơ khiếu nại nào phù hợp với bộ lọc hiện tại.</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                complaints.map((item) => {
                                    const isTouristToHs = item.direction === 'tourist_to_homestay';
                                    const reporterName = isTouristToHs
                                        ? (item.reporter?.name || 'Khách hàng')
                                        : (item.reporter?.homestay || item.reporter?.name || 'Chủ Homestay');
                                    const reporterRole = isTouristToHs ? 'Du khách' : item.reporter?.name;

                                    const reportedName = isTouristToHs
                                        ? (item.reported?.homestay || item.reported?.name || 'Homestay')
                                        : (item.reported?.name || 'Khách hàng');
                                    const reportedRole = isTouristToHs ? item.reported?.name : 'Du khách';

                                    return (
                                        <tr key={item.id} className={item.id === highlightedComplaintId ? 'highlight-new-complaint' : ''}>
                                            <td>
                                                <div className="dispute-code-highlight">{item.code}</div>
                                                <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
                                                    Đơn: <strong style={{ color: '#2563EB' }}>{item.bookingCode}</strong>
                                                </div>
                                                <div style={{ fontSize: '11px', color: '#94A3B8' }}>{item.createdAt}</div>
                                            </td>

                                            <td>
                                                {isTouristToHs ? (
                                                    <span className="dispute-direction-badge tourist-to-homestay">
                                                        <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>person</span>
                                                        Khách ➔ Homestay
                                                    </span>
                                                ) : (
                                                    <span className="dispute-direction-badge homestay-to-tourist">
                                                        <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>cottage</span>
                                                        Homestay ➔ Khách
                                                    </span>
                                                )}
                                            </td>

                                            <td>
                                                <div className="dispute-parties-box">
                                                    <div className="party-item">
                                                        <span className="party-label reporter">Nguyên đơn</span>
                                                        <span>
                                                            <strong>{reporterName}</strong>{' '}
                                                            <span style={{ fontSize: '11px', color: '#64748B' }}>({reporterRole})</span>
                                                        </span>
                                                    </div>
                                                    <div className="party-item">
                                                        <span className="party-label reported">Bị đơn</span>
                                                        <span>
                                                            <strong>{reportedName}</strong>{' '}
                                                            <span style={{ fontSize: '11px', color: '#64748B' }}>({reportedRole})</span>
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            <td>
                                                <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '13px', maxWidth: '280px', lineHeight: 1.35 }}>
                                                    {item.title}
                                                </div>
                                                <div style={{ fontSize: '11.5px', color: '#D97706', marginTop: '3px' }}>
                                                    Yêu cầu: {item.demands}
                                                </div>
                                            </td>

                                            <td>
                                                <span className={`severity-badge ${item.severity || 'medium'}`}>
                                                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                                                        {item.severity === 'urgent' ? 'priority_high' : 'flag'}
                                                    </span>
                                                    {item.severityText}
                                                </span>
                                            </td>

                                            <td>
                                                <span className={`dispute-status-badge ${item.status || 'pending'}`}>
                                                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }}></span>
                                                    <span>{item.statusText}</span>
                                                </span>
                                            </td>

                                            <td style={{ textAlign: 'right', paddingRight: '20px' }}>
                                                <button
                                                    type="button"
                                                    className="btn-dash-action"
                                                    onClick={() => handleOpenDisputeModal(item)}
                                                >
                                                    <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#15803D' }}>gavel</span>
                                                    <span>Xử lý</span>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

            </div>

            {/* ── MODAL 1: CHI TIẾT & HÒA GIẢI TRANH CHẤP (RESOLUTION CENTER) ── */}
            {showDisputeModal && selectedDispute && (
                <div className="modal-overlay" onClick={handleCloseDisputeModal}>
                    <div className="modal-container" style={{ maxWidth: '880px' }} onClick={(e) => e.stopPropagation()}>
                        
                        {/* Header */}
                        <div className="modal-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span className="material-symbols-outlined" style={{ color: '#DC2626', fontSize: '26px' }}>gavel</span>
                                <div>
                                    <h3 className="modal-title" style={{ margin: 0, fontSize: '16px' }}>
                                        Hòa Giải & Xử Lý Khiếu Nại <span style={{ color: '#15803D' }}>{selectedDispute.code}</span>
                                    </h3>
                                    <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                                        <span>Đơn: <strong>{selectedDispute.bookingCode}</strong> ({selectedDispute.bookingTotal})</span>
                                        {' • '}
                                        <span>{selectedDispute.dates}</span>
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span className={`dispute-direction-badge ${selectedDispute.direction === 'tourist_to_homestay' ? 'tourist-to-homestay' : 'homestay-to-tourist'}`}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                                        {selectedDispute.direction === 'tourist_to_homestay' ? 'person' : 'cottage'}
                                    </span>
                                    {selectedDispute.directionText}
                                </span>
                                <button type="button" className="modal-close-btn" onClick={handleCloseDisputeModal}>
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="modal-body" style={{ maxHeight: '76vh', overflowY: 'auto' }}>
                            
                            {/* Grid 2 bên tranh chấp */}
                            <div className="dispute-modal-grid">

                                {/* Bên Khiếu Nại (Reporter) */}
                                <div className="dispute-card-panel highlight-blue">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <span className="party-label reporter">Bên Đưa Khiếu Nại (Nguyên đơn)</span>
                                    </div>
                                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#1E293B', marginBottom: '6px' }}>
                                        {selectedDispute.direction === 'tourist_to_homestay'
                                            ? `${selectedDispute.reporter?.name} (SĐT: ${selectedDispute.reporter?.phone})`
                                            : `${selectedDispute.reporter?.homestay || selectedDispute.reporter?.name} (Chủ: ${selectedDispute.reporter?.name} - SĐT: ${selectedDispute.reporter?.phone})`}
                                    </h4>
                                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#DC2626', marginBottom: '6px' }}>
                                        {selectedDispute.title}
                                    </div>
                                    <div style={{ fontSize: '12.5px', color: '#475569', lineHeight: 1.55, background: '#FFFFFF', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                                        {selectedDispute.content || 'Không có mô tả chi tiết.'}
                                    </div>

                                    <div style={{ marginTop: '10px', fontSize: '12.5px', color: '#9A3412', fontWeight: 700 }}>
                                        Yêu cầu đền bù:{' '}
                                        <span style={{ color: '#C2410C' }}>{selectedDispute.demands || 'Hòa giải theo quy chế sàn.'}</span>
                                    </div>

                                    {/* Bằng chứng ảnh */}
                                    <div style={{ marginTop: '12px' }}>
                                        <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#64748B' }}>Bằng chứng đính kèm (Ảnh/Biên bản):</span>
                                        {selectedDispute.evidence && selectedDispute.evidence.length > 0 ? (
                                            <div className="evidence-gallery">
                                                {selectedDispute.evidence.map((url, idx) => (
                                                    <img
                                                        key={idx}
                                                        src={url}
                                                        alt="Bằng chứng"
                                                        className="evidence-thumb"
                                                        onClick={() => setPreviewImage(url)}
                                                        title="Bấm để xem ảnh lớn"
                                                    />
                                                ))}
                                            </div>
                                        ) : (
                                            <div style={{ fontSize: '12px', color: '#94A3B8', fontStyle: 'italic', marginTop: '4px' }}>
                                                Không có ảnh/video đính kèm.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Bên Bị Khiếu Nại (Reported) & Lịch sử đối chất */}
                                <div className="dispute-card-panel highlight-purple">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <span className="party-label reported">Bên Bị Khiếu Nại (Bị đơn)</span>
                                    </div>
                                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#1E293B', marginBottom: '6px' }}>
                                        {selectedDispute.direction === 'tourist_to_homestay'
                                            ? `${selectedDispute.reported?.homestay || selectedDispute.reported?.name} (${selectedDispute.reported?.name} - ${selectedDispute.reported?.region || 'Toàn quốc'})`
                                            : `${selectedDispute.reported?.name} (Du khách - SĐT: ${selectedDispute.reported?.phone})`}
                                    </h4>
                                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', marginBottom: '4px' }}>
                                        Giải trình / Phản hồi từ bị đơn:
                                    </div>
                                    <div style={{ fontSize: '12.5px', color: '#475569', lineHeight: 1.55, background: '#FFFFFF', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                                        {selectedDispute.reportedResponse || 'Đang chờ gửi thông báo yêu cầu giải trình cho bên bị khiếu nại.'}
                                    </div>

                                    {/* Dòng thời gian vụ việc */}
                                    <div style={{ marginTop: '14px' }}>
                                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748B' }}>Tiến trình xử lý vụ việc:</span>
                                        <div className="dispute-timeline">
                                            {selectedDispute.timeline && selectedDispute.timeline.length > 0 ? (
                                                selectedDispute.timeline.map((step, idx) => (
                                                    <div key={idx} className="timeline-step">
                                                        <div className="timeline-dot"></div>
                                                        <div className="timeline-time">{step.time}</div>
                                                        <div className="timeline-desc">{step.desc}</div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div style={{ fontSize: '12px', color: '#94A3B8', fontStyle: 'italic' }}>
                                                    Chưa ghi nhận tiến trình.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                            </div>

                            {/* Khung phán quyết & Hòa giải của Admin Sàn YÊN */}
                            <div className="dispute-card-panel resolution-box" style={{ marginTop: '20px' }}>
                                <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#166534', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span className="material-symbols-outlined">balance</span>
                                    <span>Quyết Định Hòa Giải Của Admin Sàn YÊN Homestay</span>
                                </h4>

                                <div className="form-group-grid">
                                    <div className="form-field">
                                        <label className="form-label">Phương Án Phán Quyết / Xử Lý <span style={{ color: 'red' }}>*</span></label>
                                        <select
                                            className="form-select"
                                            value={resolutionAction}
                                            onChange={(e) => setResolutionAction(e.target.value)}
                                        >
                                            <option value="refund_guest">💰 Hoàn tiền cho Khách (Trừ từ ví tạm giữ của Homestay)</option>
                                            <option value="charge_guest">💸 Yêu cầu Khách bồi thường thiệt hại cho Homestay</option>
                                            <option value="mediate_ok">🤝 Hòa giải thành công (Hai bên tự thỏa thuận, không phạt)</option>
                                            <option value="reject">❌ Bác bỏ khiếu nại (Không đủ chứng cứ / Vi phạm quy chế)</option>
                                        </select>
                                    </div>

                                    <div className="form-field">
                                        <label className="form-label">Số Tiền Bồi Hoàn / Khấu Trừ (VNĐ)</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            placeholder="0"
                                            value={resolutionAmount}
                                            onChange={(e) => setResolutionAmount(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="form-field full">
                                    <label className="form-label">Căn Cứ & Ghi Chú Kết Luận Của Ban Quản Trị YÊN</label>
                                    <textarea
                                        className="form-input"
                                        rows="2"
                                        placeholder="Ghi chú điều khoản quy chế sàn áp dụng và kết luận cuối cùng gửi cho hai bên..."
                                        value={adminNote}
                                        onChange={(e) => setAdminNote(e.target.value)}
                                    ></textarea>
                                </div>
                            </div>

                        </div>

                        {/* Footer */}
                        <div className="modal-footer">
                            <button type="button" className="btn-admin-cancel" onClick={handleCloseDisputeModal}>
                                Đóng
                            </button>
                            <button
                                type="button"
                                className="btn-admin-primary"
                                style={{ backgroundColor: '#15803D' }}
                                onClick={handleApplyResolution}
                                disabled={submittingResolution}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>verified</span>
                                <span>{submittingResolution ? 'Đang cập nhật CSDL...' : 'Ban Hành Quyết Định Giải Quyết'}</span>
                            </button>
                        </div>

                    </div>
                </div>
            )}

            {/* ── MODAL 2: GHI NHẬN KHIẾU NẠI MỚI (ADMIN HOTLINE / TẠO TRỰC TIẾP) ── */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="modal-container" style={{ maxWidth: '720px' }} onClick={(e) => e.stopPropagation()}>
                        
                        <div className="modal-header">
                            <h3 className="modal-title">
                                <span className="material-symbols-outlined" style={{ color: '#DC2626' }}>add_alert</span>
                                <span>Ghi Nhận Hồ Sơ Khiếu Nại Mới (Kết Nối CSDL)</span>
                            </h3>
                            <button type="button" className="modal-close-btn" onClick={() => setShowCreateModal(false)}>
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="modal-body">
                            
                            {/* 1. Chiều khiếu nại & Chọn đơn đặt phòng */}
                            <div className="form-group-grid">
                                <div className="form-field">
                                    <label className="form-label">Chiều Khiếu Nại <span style={{ color: 'red' }}>*</span></label>
                                    <select
                                        className="form-select"
                                        value={newDirection}
                                        onChange={(e) => handleDirectionChange(e.target.value)}
                                    >
                                        <option value="tourist_to_homestay">👤 Khách du lịch khiếu nại Homestay</option>
                                        <option value="homestay_to_tourist">🏡 Homestay khiếu nại Khách du lịch</option>
                                    </select>
                                </div>

                                <div className="form-field">
                                    <label className="form-label">
                                        Liên Kết Đơn Đặt Phòng (CSDL Thực Tế)
                                    </label>
                                    <select
                                        className="form-select"
                                        value={selectedBookingCode}
                                        onChange={(e) => handleBookingSelect(e.target.value)}
                                    >
                                        <option value="">-- Chọn đơn đặt phòng trong CSDL --</option>
                                        {availableBookings.map((b) => (
                                            <option key={b.bookingId} value={b.bookingCode}>
                                                {b.bookingCode}: {b.touristName} ➔ {b.homestayName} ({b.totalPrice})
                                            </option>
                                        ))}
                                        <option value="manual">➕ Nhập mã đơn thủ công...</option>
                                    </select>
                                </div>
                            </div>

                            {/* Badge chi tiết đơn đặt phòng đã chọn */}
                            {selectedBookingInfo && (
                                <div style={{ 
                                    background: '#F0FDF4', 
                                    border: '1px solid #86EFAC', 
                                    borderRadius: '8px', 
                                    padding: '10px 14px', 
                                    marginBottom: '16px', 
                                    fontSize: '12.5px', 
                                    color: '#166534', 
                                    display: 'flex', 
                                    flexWrap: 'wrap', 
                                    gap: '12px', 
                                    alignItems: 'center' 
                                }}>
                                    <span><strong style={{ color: '#15803D' }}>Mã:</strong> {selectedBookingInfo.bookingCode}</span>
                                    <span><strong>Homestay:</strong> {selectedBookingInfo.homestayName}</span>
                                    <span><strong>Khách:</strong> {selectedBookingInfo.touristName}</span>
                                    <span><strong>Thời gian:</strong> {selectedBookingInfo.stayDates}</span>
                                    <span><strong>Tổng tiền:</strong> {selectedBookingInfo.totalPrice}</span>
                                </div>
                            )}

                            {/* Trường nhập mã booking nếu chọn thủ công */}
                            {(!selectedBookingInfo || selectedBookingCode === 'manual') && (
                                <div className="form-field" style={{ marginBottom: '16px' }}>
                                    <label className="form-label">Mã Đơn Đặt Phòng (Booking Code)</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Ví dụ: #BK-8553"
                                        value={newBookingCode}
                                        onChange={(e) => setNewBookingCode(e.target.value)}
                                    />
                                </div>
                            )}

                            {/* 2. Thông tin Nguyên đơn & Bị đơn */}
                            <div className="form-group-grid">
                                <div className="form-field">
                                    <label className="form-label">Bên Gửi Khiếu Nại (Nguyên đơn) <span style={{ color: 'red' }}>*</span></label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder={newDirection === 'tourist_to_homestay' ? 'Tên du khách khiếu nại...' : 'Tên chủ nhà hoặc homestay...'}
                                        value={newReporterName}
                                        onChange={(e) => setNewReporterName(e.target.value)}
                                    />
                                </div>

                                <div className="form-field">
                                    <label className="form-label">Số ĐT Người Gửi</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Ví dụ: 0912 345 678"
                                        value={newReporterPhone}
                                        onChange={(e) => setNewReporterPhone(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="form-group-grid">
                                <div className="form-field">
                                    <label className="form-label">Bên Bị Khiếu Nại (Bị đơn) <span style={{ color: 'red' }}>*</span></label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder={newDirection === 'tourist_to_homestay' ? 'Tên homestay hoặc chủ nhà bị khiếu nại...' : 'Tên du khách bị khiếu nại...'}
                                        value={newReportedName}
                                        onChange={(e) => setNewReportedName(e.target.value)}
                                    />
                                </div>

                                <div className="form-field">
                                    <label className="form-label">Số ĐT Bên Bị Khiếu Nại</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Ví dụ: 0988 765 432"
                                        value={newReportedPhone}
                                        onChange={(e) => setNewReportedPhone(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* 3. Phân loại & Mức độ */}
                            <div className="form-group-grid">
                                <div className="form-field">
                                    <label className="form-label">Chuyên Mục Khiếu Nại</label>
                                    <select
                                        className="form-select"
                                        value={newReportType}
                                        onChange={(e) => setNewReportType(e.target.value)}
                                    >
                                        <option value="Tiện nghi & Dịch vụ phòng">Tiện nghi & Dịch vụ phòng</option>
                                        <option value="Hư hỏng tài sản & Gây mất trật tự">Hư hỏng tài sản & Gây mất trật tự</option>
                                        <option value="Thái độ phục vụ & Ứng xử">Thái độ phục vụ & Ứng xử</option>
                                        <option value="Sai lệch hạng phòng & Quảng cáo">Sai lệch hạng phòng & Quảng cáo</option>
                                        <option value="Hủy phòng & Hoàn tiền cọc">Hủy phòng & Hoàn tiền cọc</option>
                                        <option value="Vệ sinh & An toàn">Vệ sinh & An toàn</option>
                                        <option value="Khác">Khiếu nại khác</option>
                                    </select>
                                </div>

                                <div className="form-field">
                                    <label className="form-label">Mức Độ Nghiêm Trọng</label>
                                    <select
                                        className="form-select"
                                        value={newSeverity}
                                        onChange={(e) => setNewSeverity(e.target.value)}
                                    >
                                        <option value="medium">Trung bình</option>
                                        <option value="urgent">Khẩn cấp (Cần xử lý ngay)</option>
                                        <option value="low">Bình thường</option>
                                    </select>
                                </div>
                            </div>

                            {/* 4. Tiêu đề & Nội dung */}
                            <div className="form-field full">
                                <label className="form-label">Tiêu Đề Khiếu Nại <span style={{ color: 'red' }}>*</span></label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Ví dụ: Phòng không có nước nóng và sàn nhà vệ sinh bị ẩm mốc..."
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                />
                            </div>

                            <div className="form-field full">
                                <label className="form-label">Nội Dung Chi Tiết Sự Việc <span style={{ color: 'red' }}>*</span></label>
                                <textarea
                                    className="form-input"
                                    rows="3"
                                    placeholder="Mô tả chi tiết diễn biến sự việc, thời gian xảy ra, phản hồi giữa hai bên..."
                                    value={newContent}
                                    onChange={(e) => setNewContent(e.target.value)}
                                ></textarea>
                            </div>

                            {/* 5. Yêu cầu & Bồi thường */}
                            <div className="form-group-grid">
                                <div className="form-field">
                                    <label className="form-label">Yêu Cầu / Nguyện Vọng Của Nguyên Đơn</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Ví dụ: Yêu cầu hoàn 40% tiền phòng đêm đầu tiên..."
                                        value={newDemands}
                                        onChange={(e) => setNewDemands(e.target.value)}
                                    />
                                </div>

                                <div className="form-field">
                                    <label className="form-label">Số Tiền Đòi Bồi Thường (VNĐ nếu có)</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder="0"
                                        value={newRequestedAmount}
                                        onChange={(e) => setNewRequestedAmount(e.target.value)}
                                    />
                                </div>
                            </div>

                        </div>

                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn-admin-cancel"
                                onClick={() => setShowCreateModal(false)}
                            >
                                Hủy bỏ
                            </button>
                            <button
                                type="button"
                                className="btn-admin-primary"
                                style={{ backgroundColor: '#DC2626' }}
                                onClick={handleSaveNewDispute}
                                disabled={submittingCreate}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>save</span>
                                <span>{submittingCreate ? 'Đang lưu vào CSDL...' : 'Lưu Hồ Sơ Khiếu Nại'}</span>
                            </button>
                        </div>

                    </div>
                </div>
            )}

            {/* ── IMAGE PREVIEW LIGHTBOX MODAL ── */}
            {previewImage && (
                <div className="modal-overlay" style={{ zIndex: 11000 }} onClick={() => setPreviewImage(null)}>
                    <div style={{ position: 'relative', maxWidth: '85vw', maxHeight: '85vh' }} onClick={(e) => e.stopPropagation()}>
                        <img
                            src={previewImage}
                            alt="Ảnh bằng chứng phóng to"
                            style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: '12px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', objectFit: 'contain' }}
                        />
                        <button
                            type="button"
                            className="modal-close-btn"
                            style={{ position: 'absolute', top: '-14px', right: '-14px', background: '#FFFFFF', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
                            onClick={() => setPreviewImage(null)}
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>
                </div>
            )}

            {/* ── TOAST NOTIFICATION ── */}
            {toast.show && (
                <div className={`admin-dispute-toast ${toast.type}`}>
                    <span className="material-symbols-outlined">
                        {toast.type === 'success' ? 'check_circle' : 'error'}
                    </span>
                    <span>{toast.message}</span>
                </div>
            )}

        </div>
    );
}
