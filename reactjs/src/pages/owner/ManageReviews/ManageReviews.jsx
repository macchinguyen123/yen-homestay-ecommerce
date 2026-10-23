import React, { useState, useMemo, useEffect } from 'react';
import './ManageReviews.css';

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

// NLP phân tích cảm xúc & khía cạnh tiếng Việt thông minh cho đánh giá du khách
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
    aiSummary = `Khách phàn nàn và bức xúc về ${aspectTags.join(', ')} (${rating}⭐). Chủ nhà nên nhanh chóng gửi phản hồi xin lỗi và cam kết khắc phục.`;
  } else if (sentiment === 'POSITIVE') {
    aiSummary = `Khách rất hài lòng và đánh giá cao ${aspectTags.join(', ')} (${rating}⭐). Nên gửi lời cảm ơn và tặng mã ưu đãi cho lần ghé thăm sau.`;
  } else {
    aiSummary = `Khách ghi nhận trải nghiệm ở mức trung tính về ${aspectTags.join(', ')}. Có một số điểm cần cải thiện thêm.`;
  }

  return {
    sentiment,
    sentimentScore: Math.round(sentimentScore * 100) / 100,
    aspectTags,
    aiSummary
  };
}

export default function ManageReviews() {
  const [reviewsList, setReviewsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all'); // all, negative, neutral, positive, unreplied, 5, 4, 3, 2, 1
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('Tất cả phòng / cơ sở');
  const [showCharts, setShowCharts] = useState(true);
  const [reviewDateFrom, setReviewDateFrom] = useState('');
  const [reviewDateTo, setReviewDateTo] = useState('');
  const [reviewSortBy, setReviewSortBy] = useState('newest'); // 'newest' | 'oldest' | 'rating-desc' | 'rating-asc'

  // Input trả lời review & Toast
  const [replyInputs, setReplyInputs] = useState({});
  const [replyVoucher, setReplyVoucher] = useState({});
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // ── 1. Nạp Dữ Liệu Động từ CSDL & Phân tích AI ─────────────────────────────
  const fetchReviews = async () => {
    setLoading(true);
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const ownerEmail = user?.email || 'lethimai86@gmail.com';
    const ownerId = user?.id || 2;

    try {
      let rawReviews = [];

      // Cách 1: Thử endpoint tổng hợp Review Analytics
      const resAnalytics = await fetch(
        `http://localhost:8081/api/owner/reviews/analytics?ownerId=${ownerId}&email=${encodeURIComponent(ownerEmail)}`
      ).catch(() => null);

      if (resAnalytics && resAnalytics.ok) {
        const json = await resAnalytics.json();
        if (json && json.reviews && json.reviews.length > 0) {
          rawReviews = json.reviews.map((r) => ({
            id: r.reviewId || r.id,
            customerName: r.customerName || 'Khách du lịch',
            roomName: r.homestayName || 'Homestay',
            rating: r.rating || 5,
            createdAt: r.reviewedAt || 'Vừa xong',
            content: r.comment || '',
            images: [],
            sentiment: r.sentiment,
            sentimentScore: r.sentimentScore,
            aspectTags: r.aspectTags,
            aiSummary: r.aiSummary,
            ownerReply: r.ownerReply
          }));
        }
      }

      // Cách 2: Gọi API public reviews theo owner
      if (rawReviews.length === 0) {
        const resOwner = await fetch(
          `http://localhost:8081/api/public/reviews/owner?ownerId=${ownerId}&email=${encodeURIComponent(ownerEmail)}`
        ).catch(() => null);

        if (resOwner && resOwner.ok) {
          const list = await resOwner.json();
          if (Array.isArray(list) && list.length > 0) {
            rawReviews = list;
          }
        }
      }

      // Cách 3: Dự phòng quét theo homestays thực tế của chủ nhà trong Neon DB
      if (rawReviews.length === 0) {
        const storedHomestays = JSON.parse(localStorage.getItem('owner_homestays') || '[]');
        let homestayIds = storedHomestays.map((h) => h.id);

        if (homestayIds.length === 0) {
          const resHs = await fetch('http://localhost:8081/api/public/homestays').catch(() => null);
          if (resHs && resHs.ok) {
            const allHs = await resHs.json();
            const myHs = allHs.filter((h) => String(h.ownerId) === String(ownerId) || String(h.ownerId) === '2');
            homestayIds = myHs.length > 0 ? myHs.map((h) => h.id) : [1, 2, 3];
          }
        }

        const reviewPromises = homestayIds.map((hsId) =>
          fetch(`http://localhost:8081/api/public/reviews/homestay/${hsId}`)
            .then((r) => (r.ok ? r.json() : []))
            .catch(() => [])
        );
        const results = await Promise.all(reviewPromises);
        rawReviews = results.flat();
      }

      // Chuẩn hóa và chạy AI Sentiment & Aspect Analysis cho từng review thực tế
      const mapped = rawReviews.map((r, idx) => {
        const nlp = analyzeReviewNLP(r.comment, r.rating || 5);
        const name = r.touristName || r.customerName || `Khách du lịch #${idx + 1}`;
        const initials = name
          .split(' ')
          .filter(Boolean)
          .map((n) => n[0])
          .join('')
          .slice(-2)
          .toUpperCase() || 'KH';

        return {
          id: r.id || r.reviewId || idx + 1,
          customerName: name,
          customerInitials: initials,
          customerType: r.rating >= 5 ? 'Khách thân thiết' : 'Khách lưu trú',
          roomName: r.roomName || r.homestayName || 'Phòng nghỉ homestay',
          stayPeriod: r.formattedDate || 'Gần đây',
          rating: r.rating || 5,
          createdAt: r.formattedDate || r.reviewedAt || 'Gần đây',
          content: r.comment || '',
          images: Array.isArray(r.images)
            ? r.images.map((img) => (typeof img === 'string' ? { url: img, caption: 'Ảnh thực tế' } : img))
            : [],
          sentiment: r.sentiment || nlp.sentiment,
          sentimentScore: r.sentimentScore || nlp.sentimentScore,
          aspectTags: Array.isArray(r.aspectTags)
            ? r.aspectTags
            : typeof r.aspectTags === 'string' && r.aspectTags.trim()
            ? r.aspectTags.split(',').map((s) => s.trim())
            : nlp.aspectTags,
          aiSummary: r.aiSummary || nlp.aiSummary,
          reply: r.ownerReply
            ? {
                hostName: 'Chủ nhà (Lê Thị Mai)',
                repliedAt: 'Đã phản hồi',
                content: r.ownerReply
              }
            : null
        };
      });

      setReviewsList(mapped);
    } catch (err) {
      console.error('Lỗi nạp dữ liệu đánh giá thực tế:', err);
      showToast('⚠️ Không thể tải dữ liệu đánh giá: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  // ── 2. Tính Toán Số Liệu Thống Kê & Phân Tích AI Động (Realtime) ───────────
  const dynamicStats = useMemo(() => {
    const total = reviewsList.length;
    if (total === 0) {
      return {
        total: 0,
        unreplied: 0,
        responseRate: 100,
        mediaCount: 0,
        avgScore: '5.00',
        counts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        posCount: 0,
        negCount: 0,
        neuCount: 0,
        posPercent: 100,
        negPercent: 0,
        neuPercent: 0,
        nssScore: 100,
        aspectCounts: { 'Vệ sinh': 0, 'Dịch vụ': 0, 'Tiện nghi': 0, 'Giá cả': 0, 'Vị trí': 0 },
        aspectScores: { 'Vệ sinh': 5.0, 'Dịch vụ': 5.0, 'Tiện nghi': 5.0, 'Giá cả': 5.0, 'Vị trí': 5.0 },
        painPoints: [],
        topPraises: [],
        roomTypes: ['Tất cả phòng / cơ sở'],
        keywords: []
      };
    }

    const unreplied = reviewsList.filter((r) => !r.reply).length;
    const replied = total - unreplied;
    const responseRate = ((replied / total) * 100).toFixed(1);
    const mediaCount = reviewsList.filter((r) => r.images && r.images.length > 0).length;
    const avgScore = (reviewsList.reduce((sum, r) => sum + r.rating, 0) / total).toFixed(2);

    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let posCount = 0;
    let negCount = 0;
    let neuCount = 0;

    const aspectOccur = { 'Vệ sinh': 0, 'Dịch vụ': 0, 'Tiện nghi': 0, 'Giá cả': 0, 'Vị trí': 0 };
    const aspectRatingSum = { 'Vệ sinh': 0, 'Dịch vụ': 0, 'Tiện nghi': 0, 'Giá cả': 0, 'Vị trí': 0 };

    const painPointsSet = new Set();
    const topPraisesSet = new Set();

    const roomsSet = new Set(['Tất cả phòng / cơ sở']);
    const wordFreq = {};

    reviewsList.forEach((r) => {
      // Sao
      if (counts[r.rating] !== undefined) counts[r.rating]++;

      // Sentiment
      if (r.sentiment === 'NEGATIVE') {
        negCount++;
        if (r.aspectTags) {
          r.aspectTags.forEach((t) => painPointsSet.add(t));
        }
      } else if (r.sentiment === 'NEUTRAL') {
        neuCount++;
      } else {
        posCount++;
        if (r.aspectTags) {
          r.aspectTags.forEach((t) => topPraisesSet.add(t));
        }
      }

      // Rooms
      if (r.roomName) roomsSet.add(r.roomName);

      // Aspects
      if (Array.isArray(r.aspectTags)) {
        r.aspectTags.forEach((tag) => {
          if (aspectOccur[tag] !== undefined) {
            aspectOccur[tag]++;
            aspectRatingSum[tag] += r.rating;
          }
        });
      }

      // Trích xuất từ khóa động từ bình luận thực tế
      const words = (r.content || '')
        .toLowerCase()
        .replace(/[.,/#!$%^&*;:{}=\-_`~()?"']/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length >= 3 && !['cho', 'của', 'với', 'trong', 'được', 'mình', 'nhưng', 'cũng', 'khách', 'homestay'].includes(w));

      words.forEach((w) => {
        wordFreq[w] = (wordFreq[w] || 0) + 1;
      });
    });

    const posPercent = Math.round((posCount / total) * 100);
    const negPercent = Math.round((negCount / total) * 100);
    const neuPercent = 100 - posPercent - negPercent;
    const nssScore = posPercent - negPercent; // Net Sentiment Score

    const aspectScores = {};
    Object.keys(aspectOccur).forEach((key) => {
      aspectScores[key] =
        aspectOccur[key] > 0
          ? (aspectRatingSum[key] / aspectOccur[key]).toFixed(2)
          : (parseFloat(avgScore) || 5.0).toFixed(2);
    });

    // Top 8 từ khóa xuất hiện nhiều nhất
    const keywords = Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([text, count]) => ({
        text,
        count,
        highlight: count >= 2
      }));

    return {
      total,
      unreplied,
      responseRate,
      mediaCount,
      avgScore,
      counts,
      posCount,
      negCount,
      neuCount,
      posPercent,
      negPercent,
      neuPercent,
      nssScore,
      aspectCounts: aspectOccur,
      aspectScores,
      painPoints: Array.from(painPointsSet),
      topPraises: Array.from(topPraisesSet),
      roomTypes: Array.from(roomsSet),
      keywords
    };
  }, [reviewsList]);

  // ── 3. Dữ Liệu Biểu Đồ Chart.js ───────────────────────────────────────────
  // A. Biểu đồ tròn Doughnut: Phân bổ 3 sắc thái
  const doughnutData = {
    labels: ['Tích cực (Positive)', 'Trung tính (Neutral)', 'Tiêu cực (Negative)'],
    datasets: [
      {
        data: [dynamicStats.posCount, dynamicStats.neuCount, dynamicStats.negCount],
        backgroundColor: ['#16a34a', '#eab308', '#dc2626'],
        hoverBackgroundColor: ['#15803d', '#ca8a04', '#b91c1c'],
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
      },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const val = ctx.raw || 0;
            const pct = dynamicStats.total > 0 ? Math.round((val / dynamicStats.total) * 100) : 0;
            return ` ${ctx.label}: ${val} lượt (${pct}%)`;
          }
        }
      }
    },
    cutout: '70%'
  };

  // B. Biểu đồ cột Bar: 5 Khía cạnh dịch vụ & Điểm hài lòng
  const aspectBarData = {
    labels: ['Vệ sinh', 'Dịch vụ', 'Tiện nghi', 'Giá cả', 'Vị trí'],
    datasets: [
      {
        label: 'Điểm hài lòng (thang 5.0)',
        data: [
          parseFloat(dynamicStats.aspectScores['Vệ sinh'] || 5.0),
          parseFloat(dynamicStats.aspectScores['Dịch vụ'] || 5.0),
          parseFloat(dynamicStats.aspectScores['Tiện nghi'] || 5.0),
          parseFloat(dynamicStats.aspectScores['Giá cả'] || 5.0),
          parseFloat(dynamicStats.aspectScores['Vị trí'] || 5.0)
        ],
        backgroundColor: [
          parseFloat(dynamicStats.aspectScores['Vệ sinh'] || 5.0) < 3.5 ? '#f87171' : '#34d399',
          parseFloat(dynamicStats.aspectScores['Dịch vụ'] || 5.0) < 3.5 ? '#f87171' : '#60a5fa',
          parseFloat(dynamicStats.aspectScores['Tiện nghi'] || 5.0) < 3.5 ? '#f87171' : '#a78bfa',
          parseFloat(dynamicStats.aspectScores['Giá cả'] || 5.0) < 3.5 ? '#f87171' : '#fbbf24',
          parseFloat(dynamicStats.aspectScores['Vị trí'] || 5.0) < 3.5 ? '#f87171' : '#38bdf8'
        ],
        borderRadius: 8,
        barThickness: 28
      }
    ]
  };

  const aspectBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        min: 0,
        max: 5,
        ticks: { stepSize: 1, font: { size: 11, weight: 600 } },
        grid: { color: '#f1f5f9' }
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 12, weight: 700 } }
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => ` Điểm hài lòng: ${ctx.raw} / 5.0 ⭐`
        }
      }
    }
  };

  // ── 4. Lọc Danh Sách Đánh Giá ─────────────────────────────────────────────
  const filteredReviews = useMemo(() => {
    let list = reviewsList.filter((r) => {
      // Lọc theo tab
      if (activeFilter === 'negative' && r.sentiment !== 'NEGATIVE') return false;
      if (activeFilter === 'neutral' && r.sentiment !== 'NEUTRAL') return false;
      if (activeFilter === 'positive' && r.sentiment !== 'POSITIVE') return false;
      if (activeFilter === 'unreplied' && r.reply) return false;
      if (['5', '4', '3', '2', '1'].includes(activeFilter) && r.rating !== parseInt(activeFilter, 10)) {
        return false;
      }

      // Lọc theo phòng / homestay
      if (
        selectedRoom !== 'Tất cả phòng / cơ sở' &&
        !r.roomName.toLowerCase().includes(selectedRoom.toLowerCase())
      ) {
        return false;
      }

      // Lọc theo khoảng thời gian
      if (reviewDateFrom || reviewDateTo) {
        const rDate = r.createdAt && r.createdAt !== 'Gần đây'
          ? new Date(r.createdAt)
          : null;
        if (rDate) {
          if (reviewDateFrom && rDate < new Date(reviewDateFrom)) return false;
          if (reviewDateTo && rDate > new Date(reviewDateTo + 'T23:59:59')) return false;
        }
      }

      // Tìm kiếm
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = r.customerName.toLowerCase().includes(q);
        const matchContent = r.content.toLowerCase().includes(q);
        const matchRoom = r.roomName.toLowerCase().includes(q);
        const matchTag = r.aspectTags?.some((t) => t.toLowerCase().includes(q));
        if (!matchName && !matchContent && !matchRoom && !matchTag) return false;
      }

      return true;
    });

    // Sắp xếp
    if (reviewSortBy === 'oldest') {
      list = [...list].sort((a, b) => {
        const da = a.createdAt && a.createdAt !== 'Gần đây' ? new Date(a.createdAt) : new Date(0);
        const db = b.createdAt && b.createdAt !== 'Gần đây' ? new Date(b.createdAt) : new Date(0);
        return da - db;
      });
    } else if (reviewSortBy === 'rating-desc') {
      list = [...list].sort((a, b) => b.rating - a.rating);
    } else if (reviewSortBy === 'rating-asc') {
      list = [...list].sort((a, b) => a.rating - b.rating);
    }
    // 'newest' is default API order

    return list;
  }, [reviewsList, activeFilter, selectedRoom, searchQuery, reviewDateFrom, reviewDateTo, reviewSortBy]);

  // Gợi ý câu trả lời AI thông minh theo sắc thái của đánh giá
  const getAiSuggestedTemplates = (sentiment, customerName) => {
    if (sentiment === 'NEGATIVE') {
      return [
        {
          id: 'neg_1',
          tone: 'Xin lỗi & Cam kết khắc phục',
          text: `Dạ chào bạn ${customerName}, homestay thành thật xin lỗi vì trải nghiệm chưa trọn vẹn của bạn. Chúng tôi đã lập tức kiểm tra và chấn chỉnh ngay chất lượng phòng và dịch vụ để không tái diễn sự việc này.`
        },
        {
          id: 'neg_2',
          tone: 'Hỗ trợ & Tặng Voucher tạ lỗi',
          text: `Cảm ơn bạn ${customerName} đã đóng góp ý kiến thẳng thắn. Homestay xin gửi tặng bạn voucher ưu đãi 15% cho lần lưu trú tới và cam kết sẽ phục vụ bạn chu đáo hơn rất nhiều.`
        }
      ];
    }
    return [
      {
        id: 'pos_1',
        tone: 'Cảm ơn chân thành & Tri ân',
        text: `Dạ Yên Homestay xin chân thành cảm ơn bạn ${customerName} và gia đình đã dành tình cảm yêu mến. Chúc bạn luôn dồi dào sức khỏe và mong sớm được đón tiếp bạn trở lại!`
      },
      {
        id: 'pos_2',
        tone: 'Hẹn hội ngộ mùa tới',
        text: `Rất vui vì bạn ${customerName} đã có kỳ nghỉ tuyệt vời tại homestay! Hẹn gặp lại bạn vào những chuyến du lịch thư giãn tiếp theo nhé!`
      }
    ];
  };

  // ── 5. Xử Lý Gửi Phản Hồi ─────────────────────────────────────────────────
  const handleReplyChange = (reviewId, text) => {
    setReplyInputs((prev) => ({ ...prev, [reviewId]: text }));
  };

  const handleSelectQuickTemplate = (reviewId, text) => {
    setReplyInputs((prev) => ({ ...prev, [reviewId]: text }));
  };

  const handleToggleVoucher = (reviewId) => {
    setReplyVoucher((prev) => ({ ...prev, [reviewId]: !prev[reviewId] }));
  };

  const handleSendReply = async (reviewId, customerName) => {
    const text = replyInputs[reviewId]?.trim();
    if (!text) {
      showToast('⚠️ Vui lòng nhập nội dung phản hồi trước khi gửi!');
      return;
    }

    try {
      showToast(`Đang gửi phản hồi cho ${customerName}...`);
      const payload = { reply: text };

      // Gửi lên backend API
      await fetch(`http://localhost:8081/api/owner/reviews/${reviewId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => null);

      // Cập nhật state UI tức thì
      setReviewsList((prev) =>
        prev.map((r) =>
          r.id === reviewId
            ? {
                ...r,
                reply: {
                  hostName: 'Chủ nhà (Lê Thị Mai)',
                  repliedAt: 'Vừa xong',
                  content: text,
                  voucherCode: replyVoucher[reviewId] ? 'YENHOST10' : null
                }
              }
            : r
        )
      );

      setReplyInputs((prev) => ({ ...prev, [reviewId]: '' }));
      showToast(`✅ Đã gửi phản hồi thành công đến du khách ${customerName}!`);
    } catch (e) {
      showToast('Lỗi gửi phản hồi: ' + e.message);
    }
  };

  return (
    <div className="manage-reviews-container">
      {/* ── BANNER ĐẦU TRANG ── */}
      <div className="reviews-banner">
        <div className="banner-glow" />
        <div className="banner-content">
          <div className="banner-tag">
            <span className="material-symbols-outlined text-[15px]">psychology</span>
            Trung tâm AI Quản lý &amp; Phân tích Đánh giá
          </div>
          <h1 className="banner-title">Quản lý Đánh giá &amp; Phân tích Cảm xúc du khách</h1>
          <p className="banner-subtitle">
            Phân tích tự động 3 sắc thái (Tích cực - Tiêu cực - Trung tính), trực quan hóa biểu đồ và nhận diện khía cạnh phản ánh.
          </p>
        </div>
        <div className="banner-actions">
          <button
            type="button"
            className="btn-send-reply"
            onClick={() => setShowCharts((prev) => !prev)}
            style={{ background: showCharts ? '#0f766e' : '#334155' }}
          >
            <span className="material-symbols-outlined text-[16px]">
              {showCharts ? 'visibility_off' : 'monitoring'}
            </span>
            {showCharts ? 'Thu gọn biểu đồ' : 'Mở biểu đồ phân tích'}
          </button>
          <button type="button" className="btn-send-reply" onClick={fetchReviews} disabled={loading}>
            <span className="material-symbols-outlined text-[16px]">{loading ? 'sync' : 'refresh'}</span>
            {loading ? 'Đang nạp...' : 'Làm mới dữ liệu'}
          </button>
        </div>
      </div>

      {/* ── THẺ THỐNG KÊ NHANH (KPI METRICS) ── */}
      <div className="reviews-stats-grid">
        {/* Điểm TB */}
        <div className="stat-card-modern">
          <div>
            <div className="stat-header-modern">
              <span className="stat-title-modern">Điểm đánh giá TB</span>
              <div className="stat-icon-wrapper amber">
                <span className="material-symbols-outlined">grade</span>
              </div>
            </div>
            <div className="stat-value-modern primary-green">
              {dynamicStats.avgScore}
              <span className="stat-unit">/5.0</span>
            </div>
          </div>
          <div className="stat-subtext">Dựa trên {dynamicStats.total} lượt đánh giá thực tế</div>
        </div>

        {/* Chỉ số Net Sentiment Score (NSS) */}
        <div className="stat-card-modern">
          <div>
            <div className="stat-header-modern">
              <span className="stat-title-modern">Chỉ số Cảm xúc ròng (NSS)</span>
              <div className="stat-icon-wrapper emerald">
                <span className="material-symbols-outlined">sentiment_satisfied</span>
              </div>
            </div>
            <div
              className="stat-value-modern"
              style={{ color: dynamicStats.nssScore >= 50 ? '#16a34a' : dynamicStats.nssScore >= 0 ? '#ca8a04' : '#dc2626' }}
            >
              {dynamicStats.nssScore > 0 ? `+${dynamicStats.nssScore}%` : `${dynamicStats.nssScore}%`}
            </div>
          </div>
          <div className="stat-subtext">
            {dynamicStats.nssScore >= 70
              ? '🌟 Khách cực kỳ yêu mến'
              : dynamicStats.nssScore >= 30
              ? '✅ Khá tốt, cần duy trì'
              : '⚠️ Cần cải thiện dịch vụ'}
          </div>
        </div>

        {/* Chưa phản hồi */}
        <div className="stat-card-modern">
          <div>
            <div className="stat-header-modern">
              <span className="stat-title-modern">Chưa phản hồi</span>
              <div className="stat-icon-wrapper red">
                <span className="material-symbols-outlined">mark_chat_unread</span>
              </div>
            </div>
            <div className="stat-value-modern alert-red">
              {String(dynamicStats.unreplied).padStart(2, '0')}
              <span className="stat-unit"> lượt</span>
            </div>
          </div>
          <div className="stat-subtext">Tỷ lệ đã phản hồi: {dynamicStats.responseRate}%</div>
        </div>

        {/* Đánh giá tiêu cực cần lưu ý */}
        <div className="stat-card-modern">
          <div>
            <div className="stat-header-modern">
              <span className="stat-title-modern">Đánh giá tiêu cực (AI)</span>
              <div className="stat-icon-wrapper red">
                <span className="material-symbols-outlined">warning</span>
              </div>
            </div>
            <div className="stat-value-modern" style={{ color: dynamicStats.negCount > 0 ? '#dc2626' : '#166534' }}>
              {dynamicStats.negCount}
              <span className="stat-unit"> lượt ({dynamicStats.negPercent}%)</span>
            </div>
          </div>
          <div className="stat-subtext">
            {dynamicStats.negCount > 0 ? '🚨 Cần ưu tiên xử lý xoa dịu khách' : '✅ Trạng thái lưu trú rất tốt'}
          </div>
        </div>
      </div>

      {/* ── KHU VỰC BIỂU ĐỒ PHÂN TÍCH ĐA CHIỀU (CHARTS DASHBOARD) ── */}
      {showCharts && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: '20px',
            marginBottom: '4px'
          }}
        >
          {/* BIỂU ĐỒ 1: DOUGHNUT CHART - PHÂN BỔ 3 SẮC THÁI CẢM XÚC */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid #eef2f6',
              boxShadow: '0 2px 12px rgba(21, 67, 50, 0.05)',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="material-symbols-outlined" style={{ color: '#16a34a', fontSize: '20px' }}>
                    pie_chart
                  </span>
                  Phân bổ Cảm xúc Du khách
                </h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Tỷ lệ % Tích cực, Trung tính và Tiêu cực</span>
              </div>
              <span
                style={{
                  background: '#f0fdf4',
                  color: '#166534',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: 700
                }}
              >
                Tổng {dynamicStats.total} đánh giá
              </span>
            </div>

            {/* Doughnut Chart Canvas */}
            <div style={{ position: 'relative', height: '220px', width: '100%' }}>
              <Doughnut data={doughnutData} options={doughnutOptions} />
              {/* Tỉ lệ tích cực nổi bật ở tâm biểu đồ */}
              <div
                style={{
                  position: 'absolute',
                  top: '40%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                  pointerEvents: 'none'
                }}
              >
                <div style={{ fontSize: '24px', fontWeight: 900, color: '#16a34a' }}>
                  {dynamicStats.posPercent}%
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>TÍCH CỰC</div>
              </div>
            </div>

            {/* Quick Sentiment Summary Pills */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginTop: '16px' }}>
              <div
                onClick={() => setActiveFilter('positive')}
                style={{
                  background: activeFilter === 'positive' ? '#dcfce7' : '#f8fafc',
                  border: '1px solid #bbf7d0',
                  borderRadius: '10px',
                  padding: '8px 10px',
                  textAlign: 'center',
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontSize: '11px', color: '#15803d', fontWeight: 700 }}>🟢 TÍCH CỰC</div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#166534' }}>
                  {dynamicStats.posCount} <small style={{ fontSize: '11px', fontWeight: 500 }}>({dynamicStats.posPercent}%)</small>
                </div>
              </div>

              <div
                onClick={() => setActiveFilter('neutral')}
                style={{
                  background: activeFilter === 'neutral' ? '#fef9c3' : '#f8fafc',
                  border: '1px solid #fef08a',
                  borderRadius: '10px',
                  padding: '8px 10px',
                  textAlign: 'center',
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontSize: '11px', color: '#854d0e', fontWeight: 700 }}>🟡 TRUNG TÍNH</div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#a16207' }}>
                  {dynamicStats.neuCount} <small style={{ fontSize: '11px', fontWeight: 500 }}>({dynamicStats.neuPercent}%)</small>
                </div>
              </div>

              <div
                onClick={() => setActiveFilter('negative')}
                style={{
                  background: activeFilter === 'negative' ? '#fee2e2' : '#f8fafc',
                  border: '1px solid #fecaca',
                  borderRadius: '10px',
                  padding: '8px 10px',
                  textAlign: 'center',
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontSize: '11px', color: '#b91c1c', fontWeight: 700 }}>🔴 TIÊU CỰC</div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#dc2626' }}>
                  {dynamicStats.negCount} <small style={{ fontSize: '11px', fontWeight: 500 }}>({dynamicStats.negPercent}%)</small>
                </div>
              </div>
            </div>
          </div>

          {/* BIỂU ĐỒ 2: BAR CHART - 5 KHÍA CẠNH DỊCH VỤ CỐT LÕI */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid #eef2f6',
              boxShadow: '0 2px 12px rgba(21, 67, 50, 0.05)',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="material-symbols-outlined" style={{ color: '#2563eb', fontSize: '20px' }}>
                    bar_chart
                  </span>
                  Mức độ Hài lòng theo Khía cạnh
                </h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Điểm số trung bình từ 1.0 đến 5.0 sao</span>
              </div>
              <span
                style={{
                  background: '#eff6ff',
                  color: '#1e40af',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: 700
                }}
              >
                5 Tiêu chuẩn chất lượng
              </span>
            </div>

            {/* Bar Chart Canvas */}
            <div style={{ height: '220px', width: '100%' }}>
              <Bar data={aspectBarData} options={aspectBarOptions} />
            </div>

            {/* Quick Insight Bar */}
            <div
              style={{
                marginTop: '16px',
                padding: '10px 14px',
                background: '#f8fafc',
                borderRadius: '10px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '12px'
              }}
            >
              <span style={{ color: '#64748b' }}>Tiêu chí được khen nhiều nhất:</span>
              <strong style={{ color: '#16a34a', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>thumb_up</span>
                Dịch vụ &amp; Thái độ ({dynamicStats.aspectScores['Dịch vụ'] || 5.0}★)
              </strong>
            </div>
          </div>

          {/* CARD 3: PHÂN TÍCH ĐIỂM NÓNG & KHUYẾN NGHỊ CHIẾN LƯỢC AI */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid #eef2f6',
              boxShadow: '0 2px 12px rgba(21, 67, 50, 0.05)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="material-symbols-outlined" style={{ color: '#ea580c', fontSize: '20px' }}>
                    lightbulb
                  </span>
                  Đề xuất Hành động AI cho Chủ nhà
                </h3>
                <span style={{ fontSize: '11px', background: '#fff7ed', color: '#c2410c', padding: '3px 8px', borderRadius: '12px', fontWeight: 700 }}>
                  AI Advisor
                </span>
              </div>

              {/* Red Flags / Urgent Notice */}
              {dynamicStats.negCount > 0 ? (
                <div
                  style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    marginBottom: '12px'
                  }}
                >
                  <div style={{ color: '#991b1b', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '17px' }}>warning</span>
                    Điểm nóng cần khắc phục gấp:
                  </div>
                  <div style={{ color: '#b91c1c', fontSize: '12.5px', marginTop: '4px', lineHeight: 1.5 }}>
                    Phát hiện phản ánh về <strong>{dynamicStats.painPoints.join(', ') || 'Vệ sinh phòng ốc và Thiết bị'}</strong>. Chủ nhà nên kiểm tra bảo dưỡng và gửi phản hồi giải tỏa khách hàng.
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    marginBottom: '12px'
                  }}
                >
                  <div style={{ color: '#166534', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '17px' }}>verified</span>
                    Chất lượng dịch vụ hoàn hảo:
                  </div>
                  <div style={{ color: '#15803d', fontSize: '12.5px', marginTop: '4px', lineHeight: 1.5 }}>
                    Không có phản ánh tiêu cực nào tồn đọng! Tiếp tục duy trì phong cách hiếu khách để giữ vững vị thế Superhost.
                  </div>
                </div>
              )}

              {/* Key Highlights */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', color: '#334155' }}>
                  <span className="material-symbols-outlined" style={{ color: '#16a34a', fontSize: '18px', marginTop: '1px' }}>
                    check_circle
                  </span>
                  <span><strong>Phản hồi tức thì:</strong> Giữ thời gian phản hồi dưới 2 giờ để tăng 25% tỷ lệ khách đặt lại.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', color: '#334155' }}>
                  <span className="material-symbols-outlined" style={{ color: '#3b82f6', fontSize: '18px', marginTop: '1px' }}>
                    redeem
                  </span>
                  <span><strong>Tặng voucher tạ lỗi:</strong> Gửi mã giảm giá 10-15% cho khách chưa hài lòng giúp đảo ngược cảm xúc tiêu cực.</span>
                </div>
              </div>
            </div>

            {/* Action button */}
            <button
              type="button"
              onClick={() => showToast('Đã áp dụng bộ checklist tối ưu vận hành cho homestay!')}
              style={{
                marginTop: '16px',
                padding: '10px',
                background: '#f8fafc',
                border: '1px dashed #cbd5e1',
                borderRadius: '10px',
                color: '#334155',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>content_copy</span>
              Sao chép Checklist khắc phục sự cố
            </button>
          </div>
        </div>
      )}

      {/* ── BỘ LỌC ĐÁNH GIÁ & TÌM KIẾM ── */}
      <div className="reviews-filter-bar">
        <div className="filter-btn-group">
          <button
            type="button"
            className={`filter-tab-btn ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            Tất cả ({dynamicStats.total})
          </button>

          {dynamicStats.negCount > 0 && (
            <button
              type="button"
              className={`filter-tab-btn ${activeFilter === 'negative' ? 'active' : ''}`}
              onClick={() => setActiveFilter('negative')}
              style={{
                color: activeFilter === 'negative' ? '#ffffff' : '#dc2626',
                background: activeFilter === 'negative' ? '#dc2626' : '#fef2f2',
                borderColor: '#fca5a5'
              }}
            >
              🚨 Tiêu cực / Cần xử lý ({dynamicStats.negCount})
            </button>
          )}

          <button
            type="button"
            className={`filter-tab-btn ${activeFilter === 'neutral' ? 'active' : ''}`}
            onClick={() => setActiveFilter('neutral')}
            style={{
              color: activeFilter === 'neutral' ? '#ffffff' : '#854d0e',
              background: activeFilter === 'neutral' ? '#ca8a04' : '#fefce8'
            }}
          >
            Trung tính ({dynamicStats.neuCount})
          </button>

          <button
            type="button"
            className={`filter-tab-btn ${activeFilter === 'positive' ? 'active' : ''}`}
            onClick={() => setActiveFilter('positive')}
          >
            Tích cực ({dynamicStats.posCount})
          </button>

          <button
            type="button"
            className={`filter-tab-btn ${activeFilter === 'unreplied' ? 'active' : ''}`}
            onClick={() => setActiveFilter('unreplied')}
          >
            Chưa phản hồi
            {dynamicStats.unreplied > 0 && <span className="filter-badge-unreplied">{dynamicStats.unreplied}</span>}
          </button>

          <button
            type="button"
            className={`filter-tab-btn ${activeFilter === '5' ? 'active' : ''}`}
            onClick={() => setActiveFilter('5')}
          >
            5 Sao ({dynamicStats.counts[5]})
          </button>

          <button
            type="button"
            className={`filter-tab-btn ${activeFilter === '4' ? 'active' : ''}`}
            onClick={() => setActiveFilter('4')}
          >
            4 Sao ({dynamicStats.counts[4]})
          </button>

          <button
            type="button"
            className={`filter-tab-btn ${activeFilter === '1' ? 'active' : ''}`}
            onClick={() => setActiveFilter('1')}
          >
            1 Sao ({dynamicStats.counts[1]})
          </button>
        </div>

        <div className="filter-tools" style={{ flexWrap: 'wrap', gap: '8px' }}>
          <div className="search-input-box">
            <span className="material-symbols-outlined">search</span>
            <input
              type="text"
              placeholder="Tìm theo tên khách, nội dung, khía cạnh..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select
            className="select-room-filter"
            value={selectedRoom}
            onChange={(e) => setSelectedRoom(e.target.value)}
          >
            {dynamicStats.roomTypes.map((type, idx) => (
              <option key={idx} value={type}>
                {type}
              </option>
            ))}
          </select>
          {/* Preset Buttons */}
          <div style={{ display: 'inline-flex', background: '#f1f5f9', borderRadius: '8px', padding: '2px', gap: '2px' }}>
            <button
              type="button"
              className="filter-tab-btn"
              style={{
                padding: '4px 8px',
                fontSize: '11.5px',
                background: !reviewDateFrom && !reviewDateTo ? '#166534' : 'transparent',
                color: !reviewDateFrom && !reviewDateTo ? '#fff' : '#475569'
              }}
              onClick={() => { setReviewDateFrom(''); setReviewDateTo(''); }}
            >
              Tất cả
            </button>
            <button
              type="button"
              className="filter-tab-btn"
              style={{
                padding: '4px 8px',
                fontSize: '11.5px',
                background: reviewDateFrom && reviewDateTo && Math.round((new Date(reviewDateTo) - new Date(reviewDateFrom)) / 86400000) <= 8 ? '#166534' : 'transparent',
                color: reviewDateFrom && reviewDateTo && Math.round((new Date(reviewDateTo) - new Date(reviewDateFrom)) / 86400000) <= 8 ? '#fff' : '#475569'
              }}
              onClick={() => {
                const end = new Date();
                const start = new Date(Date.now() - 7 * 86400000);
                setReviewDateFrom(start.toISOString().split('T')[0]);
                setReviewDateTo(end.toISOString().split('T')[0]);
              }}
            >
              1 tuần
            </button>
            <button
              type="button"
              className="filter-tab-btn"
              style={{
                padding: '4px 8px',
                fontSize: '11.5px',
                background: reviewDateFrom && reviewDateTo && Math.round((new Date(reviewDateTo) - new Date(reviewDateFrom)) / 86400000) > 8 && Math.round((new Date(reviewDateTo) - new Date(reviewDateFrom)) / 86400000) <= 35 ? '#166534' : 'transparent',
                color: reviewDateFrom && reviewDateTo && Math.round((new Date(reviewDateTo) - new Date(reviewDateFrom)) / 86400000) > 8 && Math.round((new Date(reviewDateTo) - new Date(reviewDateFrom)) / 86400000) <= 35 ? '#fff' : '#475569'
              }}
              onClick={() => {
                const end = new Date();
                const start = new Date(Date.now() - 30 * 86400000);
                setReviewDateFrom(start.toISOString().split('T')[0]);
                setReviewDateTo(end.toISOString().split('T')[0]);
              }}
            >
              1 tháng
            </button>
            <button
              type="button"
              className="filter-tab-btn"
              style={{
                padding: '4px 8px',
                fontSize: '11.5px',
                background: reviewDateFrom && reviewDateTo && Math.round((new Date(reviewDateTo) - new Date(reviewDateFrom)) / 86400000) > 35 ? '#166534' : 'transparent',
                color: reviewDateFrom && reviewDateTo && Math.round((new Date(reviewDateTo) - new Date(reviewDateFrom)) / 86400000) > 35 ? '#fff' : '#475569'
              }}
              onClick={() => {
                const end = new Date();
                const start = new Date(Date.now() - 365 * 86400000);
                setReviewDateFrom(start.toISOString().split('T')[0]);
                setReviewDateTo(end.toISOString().split('T')[0]);
              }}
            >
              1 năm
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Từ:</span>
            <input
              type="date"
              className="select-room-filter"
              style={{ padding: '6px 10px', fontSize: '12px' }}
              value={reviewDateFrom}
              onChange={(e) => setReviewDateFrom(e.target.value)}
            />
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Đến:</span>
            <input
              type="date"
              className="select-room-filter"
              style={{ padding: '6px 10px', fontSize: '12px' }}
              value={reviewDateTo}
              onChange={(e) => setReviewDateTo(e.target.value)}
            />
          </div>
          <select
            className="select-room-filter"
            value={reviewSortBy}
            onChange={(e) => setReviewSortBy(e.target.value)}
            title="Sắp xếp đánh giá"
          >
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
            <option value="rating-desc">Sao cao nhất</option>
            <option value="rating-asc">Sao thấp nhất</option>
          </select>
          {(reviewDateFrom || reviewDateTo || searchQuery || selectedRoom !== 'Tất cả phòng / cơ sở' || activeFilter !== 'all' || reviewSortBy !== 'newest') && (
            <button
              type="button"
              className="filter-tab-btn"
              style={{ background: '#fee2e2', color: '#dc2626', fontWeight: 600 }}
              onClick={() => {
                setReviewDateFrom('');
                setReviewDateTo('');
                setSearchQuery('');
                setSelectedRoom('Tất cả phòng / cơ sở');
                setActiveFilter('all');
                setReviewSortBy('newest');
              }}
              title="Đặt lại bộ lọc"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>restart_alt</span>
              Đặt lại
            </button>
          )}
        </div>
      </div>

      {/* ── BỐ CỤC CHÍNH (MAIN GRID 2 CỘT) ── */}
      <div className="reviews-main-grid">
        {/* CỘT TRÁI (8 PHẦN): DANH SÁCH ĐÁNH GIÁ THỰC TẾ */}
        <div className="reviews-list-col">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: '16px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '36px', color: '#16a34a', animation: 'spin 1s linear infinite' }}>
                sync
              </span>
              <p style={{ marginTop: '10px', color: '#64748b' }}>Đang nạp dữ liệu đánh giá và phân tích AI từ CSDL...</p>
            </div>
          ) : filteredReviews.length === 0 ? (
            <div className="empty-reviews-state">
              <span className="material-symbols-outlined">rate_review</span>
              <p>Không tìm thấy đánh giá nào phù hợp với bộ lọc hiện tại.</p>
            </div>
          ) : (
            filteredReviews.map((review) => {
              const hasReplied = Boolean(review.reply);
              const isUnreplied = !hasReplied;
              const isNegative = review.sentiment === 'NEGATIVE';
              const isPositive = review.sentiment === 'POSITIVE';

              return (
                <div
                  key={review.id}
                  className="review-item-card"
                  style={{
                    borderLeft: isNegative ? '4px solid #dc2626' : isPositive ? '4px solid #16a34a' : '4px solid #eab308'
                  }}
                >
                  {/* Header review */}
                  <div className="review-user-row">
                    <div className="reviewer-meta-box">
                      <div
                        className="reviewer-avatar-circle"
                        style={{
                          background: isNegative ? '#fee2e2' : isPositive ? '#dcfce7' : '#fef9c3',
                          color: isNegative ? '#b91c1c' : isPositive ? '#15803d' : '#854d0e'
                        }}
                      >
                        {review.customerInitials}
                      </div>
                      <div className="reviewer-details">
                        <h4>
                          {review.customerName}
                          <span className={`customer-tag ${review.rating >= 5 ? 'vip' : ''}`}>
                            {review.customerType}
                          </span>
                        </h4>
                        <p className="stay-subinfo">
                          <span className="material-symbols-outlined text-[15px]">door_open</span>
                          {review.roomName} • {review.stayPeriod}
                        </p>
                      </div>
                    </div>

                    <div className="review-stars-box">
                      <div className="star-rating-icons">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <i
                            key={s}
                            className={`bi ${s <= review.rating ? 'bi-star-fill' : 'bi-star'}`}
                            style={{ color: s <= review.rating ? (isNegative ? '#dc2626' : '#eab308') : '#cbd5e1' }}
                          />
                        ))}
                      </div>
                      <span className="time-label">{review.createdAt}</span>
                      {isUnreplied && <span className="badge-unreplied-pill">Chưa phản hồi</span>}
                    </div>
                  </div>

                  {/* AI SENTIMENT BADGES & ASPECT TAGS */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '8px 0 12px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: isPositive ? '#dcfce7' : isNegative ? '#fee2e2' : '#fef9c3',
                        color: isPositive ? '#15803d' : isNegative ? '#b91c1c' : '#854d0e',
                        border: isNegative ? '1px solid #fca5a5' : '1px solid transparent'
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                        {isPositive ? 'sentiment_very_satisfied' : isNegative ? 'report' : 'sentiment_neutral'}
                      </span>
                      {isPositive ? 'Tích cực' : isNegative ? 'Tiêu cực (Cần xử lý)' : 'Trung tính'}
                      {review.sentimentScore && ` (${Math.round(review.sentimentScore * 100)}%)`}
                    </span>

                    {/* Aspect Tags */}
                    {review.aspectTags &&
                      review.aspectTags.map((tag) => (
                        <span
                          key={tag}
                          style={{
                            background: '#f1f5f9',
                            color: '#334155',
                            padding: '3px 9px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 600,
                            border: '1px solid #e2e8f0'
                          }}
                        >
                          🏷️ {tag}
                        </span>
                      ))}
                  </div>

                  {/* KHỐI TÓM TẮT & GỢI Ý CỦA AI */}
                  {review.aiSummary && (
                    <div
                      style={{
                        background: isNegative ? '#fff1f2' : '#f8fafc',
                        border: isNegative ? '1px solid #fecdd3' : '1px solid #e2e8f0',
                        borderRadius: '10px',
                        padding: '10px 14px',
                        marginBottom: '14px',
                        fontSize: '13px',
                        color: isNegative ? '#9f1239' : '#475569',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px'
                      }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: '18px', color: isNegative ? '#e11d48' : '#16a34a', marginTop: '1px' }}
                      >
                        auto_awesome
                      </span>
                      <div>
                        <strong style={{ display: 'block', marginBottom: '2px' }}>AI Nhận định &amp; Khuyến nghị:</strong>
                        <span>{review.aiSummary}</span>
                      </div>
                    </div>
                  )}

                  {/* Nội dung đánh giá */}
                  <p className="review-comment-body" style={{ fontSize: '14.5px', lineHeight: 1.6, color: '#1e293b' }}>
                    {review.content}
                  </p>

                  {/* Ảnh đính kèm (nếu có) */}
                  {review.images && review.images.length > 0 && (
                    <div className="review-media-gallery">
                      {review.images.map((img, imgIdx) => (
                        <div key={imgIdx} className="media-thumbnail-wrap">
                          <img src={img.url} alt={img.caption || 'Ảnh review'} />
                          {img.caption && <span className="media-caption-badge">{img.caption}</span>}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Đã phản hồi: Hộp phản hồi của chủ nhà */}
                  {hasReplied && (
                    <div className="existing-reply-box" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                      <div className="existing-reply-header">
                        <span className="host-signature" style={{ color: '#166534', fontWeight: 700 }}>
                          <span className="material-symbols-outlined text-[16px]">verified</span>
                          Phản hồi từ {review.reply.hostName} • {review.reply.repliedAt}
                        </span>
                        {review.reply.voucherCode && (
                          <span className="voucher-badge">Đã tặng voucher {review.reply.voucherCode}</span>
                        )}
                      </div>
                      <p className="existing-reply-text" style={{ color: '#14532d' }}>
                        {review.reply.content}
                      </p>
                    </div>
                  )}

                  {/* Chưa phản hồi: Form AI gợi ý và soạn phản hồi nhanh */}
                  {isUnreplied && (
                    <div className="reply-input-section" style={{ marginTop: '14px' }}>
                      <div className="reply-input-header">
                        <span className="target-customer-label">
                          <span className="material-symbols-outlined text-[16px] text-secondary">chat</span>
                          Soạn phản hồi gửi du khách {review.customerName}
                        </span>
                        <span className="quick-templates-title">💡 Gợi ý câu mẫu AI:</span>
                      </div>

                      {/* Gợi ý mẫu phản hồi phù hợp với ngữ cảnh cảm xúc */}
                      <div className="quick-templates-list">
                        {getAiSuggestedTemplates(review.sentiment, review.customerName).map((tpl) => (
                          <button
                            key={tpl.id}
                            type="button"
                            className="quick-template-chip"
                            onClick={() => handleSelectQuickTemplate(review.id, tpl.text)}
                            style={{
                              background: isNegative ? '#fee2e2' : '#f1f5f9',
                              color: isNegative ? '#991b1b' : '#334155',
                              borderColor: isNegative ? '#fca5a5' : '#cbd5e1'
                            }}
                          >
                            {tpl.tone}
                          </button>
                        ))}
                      </div>

                      {/* Textarea nhập nội dung */}
                      <textarea
                        className="reply-textarea"
                        placeholder="Nhập lời cảm ơn hoặc giải pháp xử lý chân thành gửi du khách..."
                        value={replyInputs[review.id] || ''}
                        onChange={(e) => handleReplyChange(review.id, e.target.value)}
                      />

                      {/* Footer công cụ */}
                      <div className="reply-footer-bar">
                        <div className="flex items-center gap-3">
                          <label className="voucher-checkbox-label">
                            <input
                              type="checkbox"
                              checked={Boolean(replyVoucher[review.id])}
                              onChange={() => handleToggleVoucher(review.id)}
                            />
                            Đính kèm voucher giảm 10% (YENHOST10)
                          </label>
                        </div>

                        <div className="reply-action-btns">
                          <button
                            type="button"
                            className="btn-send-reply"
                            onClick={() => handleSendReply(review.id, review.customerName)}
                          >
                            Gửi phản hồi du khách
                            <span className="material-symbols-outlined text-[15px]">send</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* ── CỘT PHẢI (4 PHẦN): PHÂN TÍCH KHÍA CẠNH & Ý KIẾN DU KHÁCH THỰC TẾ ── */}
        <div className="reviews-side-col">
          {/* PHÂN TÍCH 5 KHÍA CẠNH DỊCH VỤ THỰC TẾ */}
          <div className="side-panel-card">
            <div className="panel-card-header">
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                  Phân tích 5 Khía cạnh Cốt lõi
                </h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Đánh giá dựa trên trải nghiệm thực tế</span>
              </div>
              <span className="badge-verified-guest">100% Khách thật</span>
            </div>

            <div className="criteria-list-modern">
              {[
                { name: 'Vệ sinh phòng ốc', key: 'Vệ sinh' },
                { name: 'Dịch vụ & Thái độ phục vụ', key: 'Dịch vụ' },
                { name: 'Tiện nghi & Cơ sở vật chất', key: 'Tiện nghi' },
                { name: 'Giá cả & Độ tương xứng', key: 'Giá cả' },
                { name: 'Vị trí & Cảnh quan', key: 'Vị trí' }
              ].map((item, idx) => {
                const count = dynamicStats.aspectCounts[item.key] || 0;
                const score = parseFloat(dynamicStats.aspectScores[item.key] || 5.0);
                const percent = Math.min(Math.round((score / 5.0) * 100), 100);

                return (
                  <div key={idx} className="criteria-row-modern">
                    <div className="criteria-label-row">
                      <span className="criteria-title" style={{ fontWeight: 600, color: '#334155' }}>
                        {item.name}
                        {count > 0 && (
                          <small style={{ color: '#64748b', marginLeft: '6px' }}>({count} lượt)</small>
                        )}
                      </span>
                      <strong className="criteria-score" style={{ color: score < 3.5 ? '#dc2626' : '#166534' }}>
                        {score.toFixed(2)} / 5.0
                      </strong>
                    </div>
                    <div className="criteria-track">
                      <div
                        className="criteria-fill"
                        style={{
                          width: `${percent}%`,
                          background: score < 3.5 ? '#dc2626' : score < 4.2 ? '#ca8a04' : '#166534'
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="positive-trend-pill">
              <span>Mức độ hài lòng chung:</span>
              <strong>
                {dynamicStats.avgScore} / 5.0 ⭐
                <span className="material-symbols-outlined text-[16px]">trending_up</span>
              </strong>
            </div>
          </div>

          {/* TỪ KHÓA ĐƯỢC DU KHÁCH NHẮC NHIỀU NHẤT TRONG BÌNH LUẬN */}
          <div className="side-panel-card">
            <div className="panel-card-header">
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>Từ khóa nhắc nhiều nhất</h3>
              <span className="material-symbols-outlined text-slate-400 text-[18px]">tag</span>
            </div>

            <div className="keywords-bubble-group">
              {dynamicStats.keywords.length > 0 ? (
                dynamicStats.keywords.map((kw, idx) => (
                  <span key={idx} className={`keyword-bubble ${kw.highlight ? 'highlight' : 'normal'}`}>
                    {kw.text}
                    <small>{kw.count}x</small>
                  </span>
                ))
              ) : (
                <span style={{ fontSize: '13px', color: '#94a3b8' }}>Chưa có đủ từ khóa để thống kê.</span>
              )}
            </div>
          </div>

          {/* HUY HIỆU SUPERHOST & CAM KẾT CHẤT LƯỢNG */}
          <div className="superhost-banner-card">
            <div className="superhost-icon-circle">
              <span className="material-symbols-outlined">workspace_premium</span>
            </div>
            <h4>Tiêu chuẩn Chủ Nhà Ưu Tú (Superhost)</h4>
            <p>
              Duy trì tỷ lệ phản hồi trên 95% và điểm đánh giá trung bình từ 4.8★ trở lên để nhận huy hiệu ưu tiên hiển
              thị trên Yên Homestay.
            </p>
            <button
              type="button"
              className="btn-superhost-share"
              onClick={() => showToast('Cảm ơn bạn đã luôn chăm sóc chu đáo cho du khách!')}
            >
              Xem tiêu chuẩn chất lượng
            </button>
          </div>
        </div>
      </div>

      {/* TOAST THÔNG BÁO */}
      {toastMessage && (
        <div className="review-toast">
          <span className="material-symbols-outlined text-emerald-400">info</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
