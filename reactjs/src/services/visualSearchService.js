const API_BASE = 'http://localhost:8081/api/public/search';

export const visualSearchService = {
  /**
   * Tìm kiếm homestay bằng upload file ảnh
   * @param {File} file File ảnh từ input/drag-drop
   * @param {number} limit Số lượng kết quả mong muốn
   */
  async searchByImage(file, limit = 8) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE}/image?limit=${limit}`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || `Lỗi máy chủ (${response.status})`);
    }

    return await response.json();
  },

  /**
   * Tìm kiếm bằng URL ảnh
   * @param {string} imageUrl URL ảnh
   * @param {number} limit Số lượng kết quả
   */
  async searchByImageUrl(imageUrl, limit = 8) {
    const response = await fetch(`${API_BASE}/image-url?limit=${limit}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageUrl }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || `Lỗi máy chủ (${response.status})`);
    }

    return await response.json();
  },

  /**
   * Đồng bộ vector cho dữ liệu cũ (Admin/Migration)
   */
  async syncEmbeddings() {
    const response = await fetch(`${API_BASE}/sync-embeddings`, {
      method: 'POST',
    });
    return await response.json();
  },

  /**
   * Chạy cấu hình bảng pgvector trên Neon
   */
  async setupPgvector() {
    const response = await fetch(`${API_BASE}/setup-pgvector`, {
      method: 'POST',
    });
    return await response.json();
  }
};
