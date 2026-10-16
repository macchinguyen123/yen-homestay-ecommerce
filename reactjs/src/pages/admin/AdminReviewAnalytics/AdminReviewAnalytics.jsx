import React, { useState, useEffect, useMemo } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

// NLP phân tích cảm xúc tiếng Việt độc lập dự phòng
function analyzeReviewNLP(comment, rating) {
  const text = (comment || '').toLowerCase();
  const posWords = [
    'tuyệt vời', 'rất thích', 'hài lòng', 'xuất sắc', 'sạch sẽ', 'thân thiện', 'nhiệt tình',
    'ấm cúng', 'đẹp', 'ngon', 'chu đáo', 'yên tĩnh', 'thoải mái', 'ưng ý', 'đáng tiền',
    'đáng nhớ', 'tốt', 'thích', 'chân thành', 'tiện lợi', 'gọn gàng', 'view đẹp'
  ];
  const negWords = [
    'bẩn', 'tệ', 'thất vọng', 'mùi', 'ẩm mốc', 'ồn ào', 'hỏng', 'chập chờn', 'kém',
    'chậm', 'khó chịu', 'đắt', 'không ngủ được', 'chảy nước', 'không giống', 'thô lỗ',
    'thất thoát', 'bực', 'muỗi', 'côn trùng', 'dơ'
  ];

  let posScore = 0;
  let negScore = 0;
  posWords.forEach((w) => {
    if (text.includes(w)) posScore++;
  });
  negWords.forEach((w) => {
    if (text.includes(w)) negScore += 2;
  });

  if (rating <= 2) negScore += 3;
  if (rating >= 4) posScore += 2;

  let sentiment = 'POSITIVE';
  let sentimentScore = 0.92;
  if (negScore > posScore || rating <= 2) {
    sentiment = 'NEGATIVE';
    sentimentScore = Math.min(0.85 + negScore * 0.04, 0.99);
  } else if (Math.abs(posScore - negScore) <= 1 && rating === 3) {
    sentiment = 'NEUTRAL';
    sentimentScore = 0.75;
  }

  const aspectTags = [];
  if (
    text.includes('vệ sinh') || text.includes('sạch') || text.includes('bẩn') ||
    text.includes('mùi') || text.includes('mốc') || text.includes('dọn phòng') ||
    text.includes('ga gối') || text.includes('nhà vệ sinh') || text.includes('bồn tắm')
  ) {
    aspectTags.push('Vệ sinh');
  }
  if (
    text.includes('thái độ') || text.includes('nhân viên') || text.includes('chủ nhà') ||
    text.includes('phục vụ') || text.includes('nhiệt tình') || text.includes('thân thiện') ||
    text.includes('hướng dẫn') || text.includes('hỗ trợ') || text.includes('chăm sóc')
  ) {
    aspectTags.push('Dịch vụ');
  }
  if (
    text.includes('điều hòa') || text.includes('wifi') || text.includes('nước nóng') ||
    text.includes('giường') || text.includes('tivi') || text.includes('bếp') ||
    text.includes('tiện nghi') || text.includes('bãi đỗ xe') || text.includes('hồ bơi') ||
    text.includes('tủ lạnh')
  ) {
    aspectTags.push('Tiện nghi');
  }
  if (
    text.includes('giá') || text.includes('tiền') || text.includes('đắt') ||
    text.includes('rẻ') || text.includes('xứng đáng') || text.includes('chi phí') ||
    text.includes('phụ thu')
  ) {
    aspectTags.push('Giá cả');
  }
  if (
    text.includes('vị trí') || text.includes('view') || text.includes('cảnh') ||
    text.includes('gần') || text.includes('xa') || text.includes('trung tâm') ||
    text.includes('đường đi') || text.includes('phố') || text.includes('biển')
  ) {
    aspectTags.push('Vị trí');
  }
  if (aspectTags.length === 0) aspectTags.push('Trải nghiệm chung');

  let aiSummary = '';
  if (sentiment === 'NEGATIVE') {
    aiSummary = `Khách phàn nàn và bức xúc về ${aspectTags.join(', ')} (${rating}⭐). Cần Admin nhắc nhở chủ nhà xử lý khẩn cấp.`;
  } else if (sentiment === 'POSITIVE') {
    aiSummary = `Khách rất hài lòng và đánh giá cao ${aspectTags.join(', ')} (${rating}⭐). Điểm cộng uy tín cho homestay.`;
  } else {
    aiSummary = `Khách đánh giá trung tính, ghi nhận trải nghiệm ở mức chấp nhận được về ${aspectTags.join(', ')}.`;
  }

  return {
    sentiment,
    sentimentScore: Math.round(sentimentScore * 100) / 100,
    aspectTags,
    aiSummary
  };
}

export default function AdminReviewAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sentimentFilter, setSentimentFilter] = useState('ALL');
  const [selectedHomestay, setSelectedHomestay] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  // ── 1. Nạp và Tổng Hợp Đánh Giá CỦA TẤT CẢ HOMESTAY TOÀN SÀN ─────────────
  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      let rawReviews = [];
      let allHomestaysMap = {};

      // 1. Thử gọi endpoint tổng hợp phân tích của admin
      const resAdmin = await fetch('http://localhost:8081/api/admin/reviews/analytics').catch(() => null);
      if (resAdmin && resAdmin.ok) {
        const json = await resAdmin.json();
        if (json && json.reviews && json.reviews.length > 0) {
          setData(json);
          setLoading(false);
          return;
        }
      }

      // 2. Thử gọi API lấy toàn bộ reviews toàn sàn
      const resAll = await fetch('http://localhost:8081/api/public/reviews/all').catch(() => null);
      if (resAll && resAll.ok) {
        const list = await resAll.json();
        if (Array.isArray(list) && list.length > 0) {
          rawReviews = list;
        }
      }

      // 3. Dự phòng: Quét qua tất cả Homestay đang hoạt động trên hệ thống
      const resHs = await fetch('http://localhost:8081/api/public/homestays').catch(() => null);
      if (resHs && resHs.ok) {
        const hsList = await resHs.json();
        if (Array.isArray(hsList)) {
          hsList.forEach((h) => {
            allHomestaysMap[h.id] = h.name || `Homestay #${h.id}`;
          });

          // Nếu chưa có reviews, quét song song tất cả homestay ID
          if (rawReviews.length === 0) {
            const promises = hsList.map((h) =>
              fetch(`http://localhost:8081/api/public/reviews/homestay/${h.id}`)
                .then((r) => (r.ok ? r.json() : []))
                .catch(() => [])
            );
            const nested = await Promise.all(promises);
            rawReviews = nested.flat();
          }
        }
      }

      // 4. Nếu database chưa có review nào, tạo danh sách rỗng chuẩn hóa
      const total = rawReviews.length;
      if (total === 0) {
        setData({
          totalReviews: 0,
          averageRating: 5.0,
          positivePercent: 100,
          negativePercent: 0,
          neutralPercent: 0,
          unrepliedCount: 0,
          responseRate: 100,
          aspectCounts: { 'Vệ sinh': 0, 'Dịch vụ': 0, 'Tiện nghi': 0, 'Giá cả': 0, 'Vị trí': 0 },
          ratingCounts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
          reviews: []
        });
        setLoading(false);
        return;
      }

      // 5. Chuẩn hóa & chạy AI Sentiment Analysis cho toàn bộ đánh giá sàn
      let posCount = 0;
      let negCount = 0;
      let neuCount = 0;
      let unreplied = 0;
      let starSum = 0;
      const aspectOccur = { 'Vệ sinh': 0, 'Dịch vụ': 0, 'Tiện nghi': 0, 'Giá cả': 0, 'Vị trí': 0 };
      const ratingOccur = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

      const items = rawReviews.map((r, idx) => {
        const rating = r.rating || 5;
        starSum += rating;
        if (ratingOccur[rating] !== undefined) ratingOccur[rating]++;

        const nlp = analyzeReviewNLP(r.comment, rating);
        const sentiment = r.sentiment || nlp.sentiment;
        if (sentiment === 'NEGATIVE') negCount++;
        else if (sentiment === 'NEUTRAL') neuCount++;
        else posCount++;

        const hasReply = Boolean(r.ownerReply);
        if (!hasReply) unreplied++;

        const tags = Array.isArray(r.aspectTags)
          ? r.aspectTags
          : typeof r.aspectTags === 'string' && r.aspectTags.trim()
          ? r.aspectTags.split(',').map((s) => s.trim())
          : nlp.aspectTags;

        tags.forEach((t) => {
          if (aspectOccur[t] !== undefined) aspectOccur[t]++;
        });

        const hsName = r.homestayName || allHomestaysMap[r.homestayId] || `Homestay #${r.homestayId}`;

        return {
          reviewId: r.id || r.reviewId || idx + 1,
          homestayId: r.homestayId,
          homestayName: hsName,
          customerName: r.touristName || r.customerName || `Khách du lịch #${idx + 1}`,
          customerAvatar: r.touristAvatar || r.customerAvatar || null,
          rating,
          comment: r.comment || '',
          sentiment,
          sentimentScore: r.sentimentScore || nlp.sentimentScore,
          aspectTags: tags,
          aiSummary: r.aiSummary || nlp.aiSummary,
          ownerReply: r.ownerReply || null,
          reviewedAt: r.formattedDate || r.reviewedAt || 'Gần đây'
        };
      });

      const avgRating = Math.round((starSum / total) * 10) / 10;
      const posPct = Math.round((posCount / total) * 100);
      const negPct = Math.round((negCount / total) * 100);
      const neuPct = 100 - posPct - negPct;
      const respRate = Math.round(((total - unreplied) / total) * 100);

      setData({
        totalReviews: total,
        averageRating: avgRating,
        positivePercent: posPct,
        negativePercent: negPct,
        neutralPercent: neuPct,
        unrepliedCount: unreplied,
        responseRate: respRate,
        aspectCounts: aspectOccur,
        ratingCounts: ratingOccur,
        reviews: items
      });
    } catch (e) {
      console.error('Lỗi tải dữ liệu phân tích đánh giá toàn sàn:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Quét đồng bộ AI toàn bộ đánh giá cũ
  const handleSyncOldReviews = async () => {
    setSyncing(true);
    setSyncMessage('Đang quét và chạy phân tích AI cho tất cả đánh giá trên toàn hệ thống...');
    try {
      const res = await fetch('http://localhost:8081/api/public/reviews/sync-sentiment', { method: 'POST' });
      const json = await res.json();
      setSyncMessage(`Hoàn tất! Đã quét và cập nhật phân tích cảm xúc AI.`);
      await fetchAnalytics();
    } catch (e) {
      setSyncMessage('Lỗi đồng bộ: ' + e.message);
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMessage(''), 5000);
    }
  };

  // ── 2. Dữ liệu Biểu đồ Trực quan ──────────────────────────────────────────
  const doughnutData = {
    labels: ['Tích cực (Positive)', 'Tiêu cực (Negative)', 'Trung tính (Neutral)'],
    datasets: [
      {
        data: [
          data?.positivePercent ?? 0,
          data?.negativePercent ?? 0,
          data?.neutralPercent ?? 0
        ],
        backgroundColor: ['#16a34a', '#dc2626', '#eab308'],
        hoverBackgroundColor: ['#15803d', '#b91c1c', '#ca8a04'],
        borderWidth: 3,
        borderColor: '#ffffff'
      }
    ]
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 14,
          padding: 12,
          font: { size: 12, weight: 600 }
        }
      }
    },
    cutout: '68%'
  };

  // Biểu đồ khía cạnh phản ánh
  const aspectKeys = data?.aspectCounts ? Object.keys(data.aspectCounts) : ['Vệ sinh', 'Dịch vụ', 'Tiện nghi', 'Giá cả', 'Vị trí'];
  const aspectValues = data?.aspectCounts ? Object.values(data.aspectCounts) : [0, 0, 0, 0, 0];

  const barData = {
    labels: aspectKeys,
    datasets: [
      {
        label: 'Số lượt phản ánh',
        data: aspectValues,
        backgroundColor: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#06b6d4'],
        borderRadius: 8,
        barThickness: 32
      }
    ]
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1, font: { size: 11 } },
        grid: { color: '#f1f5f9' }
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 12, weight: 600 } }
      }
    }
  };

  // ── 3. Danh sách Homestay để lọc ──────────────────────────────────────────
  const homestayOptions = useMemo(() => {
    if (!data || !data.reviews) return [];
    const map = new Map();
    data.reviews.forEach((r) => {
      if (r.homestayId && r.homestayName) {
        map.set(r.homestayId, r.homestayName);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [data]);

  // Lọc danh sách đánh giá
  const filteredReviews = useMemo(() => {
    if (!data || !data.reviews) return [];
    return data.reviews.filter((r) => {
      // 1. Lọc theo cảm xúc
      if (sentimentFilter !== 'ALL' && r.sentiment !== sentimentFilter) {
        return false;
      }
      // 2. Lọc theo homestay cụ thể
      if (selectedHomestay !== 'ALL' && String(r.homestayId) !== String(selectedHomestay)) {
        return false;
      }
      // 3. Tìm kiếm từ khóa
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchCustomer = (r.customerName || '').toLowerCase().includes(q);
        const matchHomestay = (r.homestayName || '').toLowerCase().includes(q);
        const matchComment = (r.comment || '').toLowerCase().includes(q);
        const matchTag = r.aspectTags?.some((t) => t.toLowerCase().includes(q));
        if (!matchCustomer && !matchHomestay && !matchComment && !matchTag) return false;
      }
      return true;
    });
  }, [data, sentimentFilter, selectedHomestay, searchTerm]);

  return (
    <div style={{ padding: '28px', maxWidth: '1360px', margin: '0 auto', fontFamily: 'Roboto, sans-serif', color: '#1e293b' }}>
      {/* ── HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#0f172a', fontSize: '24px', fontWeight: 800 }}>
            <span className="material-symbols-outlined" style={{ verticalAlign: 'middle', marginRight: '8px', color: '#16a34a' }}>
              rate_review
            </span>
            Phân tích &amp; Giám sát Đánh giá Toàn Sàn (AI Review Analytics)
          </h2>
          <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '14px' }}>
            Hệ thống AI tự động phân tích cảm xúc (Tích cực - Tiêu cực - Trung tính) và nhận diện khía cạnh phục vụ của tất cả homestay.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            onClick={fetchAnalytics}
            disabled={loading}
            style={{
              padding: '10px 18px',
              backgroundColor: '#f1f5f9',
              color: '#334155',
              border: '1px solid #cbd5e1',
              borderRadius: '10px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              {loading ? 'sync' : 'refresh'}
            </span>
            {loading ? 'Đang tải...' : 'Làm mới'}
          </button>

          <button
            type="button"
            onClick={handleSyncOldReviews}
            disabled={syncing}
            style={{
              padding: '10px 18px',
              backgroundColor: '#16a34a',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 600,
              cursor: syncing ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(22, 163, 74, 0.25)'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              {syncing ? 'sync' : 'auto_fix_high'}
            </span>
            {syncing ? 'Đang phân tích AI...' : 'Quét & Phân tích Đánh giá Cũ'}
          </button>
        </div>
      </div>

      {syncMessage && (
        <div style={{ padding: '12px 18px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '12px', color: '#166534', fontWeight: 600, marginBottom: '20px' }}>
          {syncMessage}
        </div>
      )}

      {/* ── KPI CARDS TOÀN HỆ THỐNG ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px', marginBottom: '26px' }}>
        {/* Tổng đánh giá */}
        <div style={{ background: '#ffffff', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ color: '#64748b', fontSize: '12.5px', fontWeight: 700, textTransform: 'uppercase' }}>
            TỔNG ĐÁNH GIÁ TOÀN SÀN
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', margin: '6px 0 2px' }}>
            {data?.totalReviews || 0}
          </div>
          <div style={{ color: '#eab308', fontSize: '13px', fontWeight: 700 }}>
            ★ {data?.averageRating || 5.0} / 5.0 điểm trung bình
          </div>
        </div>

        {/* Tỷ lệ tích cực */}
        <div style={{ background: '#f0fdf4', padding: '20px', borderRadius: '16px', border: '1.5px solid #bbf7d0', boxShadow: '0 2px 8px rgba(22, 163, 74, 0.05)' }}>
          <div style={{ color: '#166534', fontSize: '12.5px', fontWeight: 700, textTransform: 'uppercase' }}>
            TỶ LỆ TÍCH CỰC (POSITIVE)
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#16a34a', margin: '6px 0 2px' }}>
            {data?.positivePercent || 0}%
          </div>
          <div style={{ color: '#15803d', fontSize: '13px', fontWeight: 500 }}>
            Du khách hài lòng và đánh giá tốt
          </div>
        </div>

        {/* Tỷ lệ tiêu cực */}
        <div style={{ background: '#fef2f2', padding: '20px', borderRadius: '16px', border: '1.5px solid #fecaca', boxShadow: '0 2px 8px rgba(220, 38, 38, 0.05)' }}>
          <div style={{ color: '#991b1b', fontSize: '12.5px', fontWeight: 700, textTransform: 'uppercase' }}>
            TỶ LỆ TIÊU CỰC (NEGATIVE)
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#dc2626', margin: '6px 0 2px' }}>
            {data?.negativePercent || 0}%
          </div>
          <div style={{ color: '#b91c1c', fontSize: '13px', fontWeight: 500 }}>
            Cần theo dõi &amp; nhắc nhở chủ nhà
          </div>
        </div>

        {/* Tỷ lệ phản hồi của Host */}
        <div style={{ background: '#ffffff', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ color: '#64748b', fontSize: '12.5px', fontWeight: 700, textTransform: 'uppercase' }}>
            TỶ LỆ PHẢN HỒI CỦA CÁC HOST
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#2563eb', margin: '6px 0 2px' }}>
            {data?.responseRate || 0}%
          </div>
          <div style={{ color: '#64748b', fontSize: '13px' }}>
            Còn <strong>{data?.unrepliedCount || 0}</strong> đánh giá chưa trả lời
          </div>
        </div>
      </div>

      {/* ── BIỂU ĐỒ PHÂN TÍCH ĐA CHIỀU TOÀN SÀN ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        {/* Biểu đồ Doughnut */}
        <div style={{ background: '#ffffff', padding: '22px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
              Phân bổ Cảm xúc Đánh giá Toàn Sàn (Sentiment Breakdown)
            </h3>
            <span style={{ fontSize: '12px', color: '#64748b' }}>AI NLP Model</span>
          </div>
          <div style={{ height: '230px', position: 'relative' }}>
            <Doughnut data={doughnutData} options={doughnutOptions} />
          </div>
        </div>

        {/* Biểu đồ Bar Khía cạnh */}
        <div style={{ background: '#ffffff', padding: '22px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
              Các khía cạnh khách hàng phản ánh nhiều nhất (Aspect Tags)
            </h3>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Toàn bộ Homestay</span>
          </div>
          <div style={{ height: '230px' }}>
            <Bar data={barData} options={barOptions} />
          </div>
        </div>
      </div>

      {/* ── BẢNG DANH SÁCH & BỘ LỌC ĐÁNH GIÁ CHI TIẾT ── */}
      <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
        {/* Thanh công cụ lọc */}
        <div style={{ padding: '18px 22px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          {/* Lọc theo cảm xúc */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { key: 'ALL', label: `Tất cả (${data?.reviews?.length || 0})` },
              { key: 'NEGATIVE', label: '🔴 Tiêu cực / Khiếu nại' },
              { key: 'POSITIVE', label: '🟢 Tích cực' },
              { key: 'NEUTRAL', label: '🟡 Trung tính' }
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setSentimentFilter(tab.key)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '8px',
                  border: sentimentFilter === tab.key ? '1.5px solid #16a34a' : '1px solid #cbd5e1',
                  background: sentimentFilter === tab.key ? '#f0fdf4' : '#ffffff',
                  color: sentimentFilter === tab.key ? '#166534' : '#475569',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Lọc theo Homestay & Ô tìm kiếm */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              value={selectedHomestay}
              onChange={(e) => setSelectedHomestay(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                color: '#334155',
                outline: 'none',
                maxWidth: '220px'
              }}
            >
              <option value="ALL">Tất cả Homestay ({homestayOptions.length})</option>
              {homestayOptions.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>

            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Tìm khách, homestay, nội dung..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: '8px 12px 8px 34px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  outline: 'none',
                  width: '240px'
                }}
              />
              <span className="material-symbols-outlined" style={{ position: 'absolute', left: '8px', top: '7px', fontSize: '18px', color: '#94a3b8' }}>
                search
              </span>
            </div>
          </div>
        </div>

        {/* Bảng chi tiết */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', color: '#64748b', borderBottom: '1px solid #e2e8f0', textTransform: 'uppercase', fontSize: '11.5px', letterSpacing: '0.5px' }}>
                <th style={{ padding: '12px 18px' }}>Homestay</th>
                <th style={{ padding: '12px 18px' }}>Khách hàng</th>
                <th style={{ padding: '12px 18px' }}>Đánh giá &amp; Sao</th>
                <th style={{ padding: '12px 18px' }}>Sắc thái AI</th>
                <th style={{ padding: '12px 18px', width: '38%' }}>Nội dung &amp; AI Tóm tắt</th>
                <th style={{ padding: '12px 18px' }}>Chủ nhà phản hồi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                    <span className="material-symbols-outlined" style={{ animation: 'spin 1s linear infinite', fontSize: '28px', color: '#16a34a' }}>
                      sync
                    </span>
                    <div style={{ marginTop: '6px' }}>Đang nạp toàn bộ đánh giá của tất cả homestay...</div>
                  </td>
                </tr>
              ) : filteredReviews.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                    Không tìm thấy đánh giá nào phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                filteredReviews.map((r) => {
                  const isNeg = r.sentiment === 'NEGATIVE';
                  const isPos = r.sentiment === 'POSITIVE';

                  return (
                    <tr key={r.reviewId} style={{ borderBottom: '1px solid #f1f5f9', background: isNeg ? '#fffafb' : '#ffffff' }}>
                      {/* Homestay */}
                      <td style={{ padding: '14px 18px', fontWeight: 700, color: '#0f172a' }}>
                        <div>{r.homestayName}</div>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>ID: #{r.homestayId}</span>
                      </td>

                      {/* Khách hàng */}
                      <td style={{ padding: '14px 18px', color: '#334155' }}>
                        <div style={{ fontWeight: 600 }}>{r.customerName}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>{r.reviewedAt}</div>
                      </td>

                      {/* Số sao */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ color: isNeg ? '#dc2626' : '#eab308', fontWeight: 800, fontSize: '14px' }}>
                          ★ {r.rating} / 5
                        </div>
                      </td>

                      {/* Sắc thái AI & Thẻ khía cạnh */}
                      <td style={{ padding: '14px 18px' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 700,
                            display: 'inline-block',
                            background: isPos ? '#dcfce7' : isNeg ? '#fee2e2' : '#fef9c3',
                            color: isPos ? '#15803d' : isNeg ? '#b91c1c' : '#854d0e',
                            marginBottom: '4px'
                          }}
                        >
                          {isPos ? 'Tích cực' : isNeg ? 'Tiêu cực' : 'Trung tính'}
                          {r.sentimentScore && ` (${Math.round(r.sentimentScore * 100)}%)`}
                        </span>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {r.aspectTags &&
                            r.aspectTags.map((tag) => (
                              <span key={tag} style={{ fontSize: '10px', background: '#f1f5f9', color: '#475569', padding: '1px 5px', borderRadius: '4px' }}>
                                {tag}
                              </span>
                            ))}
                        </div>
                      </td>

                      {/* Nội dung & Tóm tắt AI */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ color: '#1e293b', marginBottom: '6px', lineHeight: 1.5 }}>
                          "{r.comment}"
                        </div>
                        {r.aiSummary && (
                          <div style={{ fontSize: '12px', color: isNeg ? '#991b1b' : '#166534', background: isNeg ? '#fee2e2' : '#f0fdf4', padding: '6px 10px', borderRadius: '6px', fontStyle: 'italic' }}>
                            💡 AI: {r.aiSummary}
                          </div>
                        )}
                      </td>

                      {/* Trạng thái phản hồi của chủ nhà */}
                      <td style={{ padding: '14px 18px' }}>
                        {r.ownerReply ? (
                          <span style={{ color: '#16a34a', fontWeight: 600, fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>check_circle</span>
                            Đã phản hồi
                          </span>
                        ) : (
                          <span style={{ color: isNeg ? '#dc2626' : '#94a3b8', fontWeight: 600, fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>pending</span>
                            {isNeg ? 'Cần nhắc Host' : 'Chưa trả lời'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
