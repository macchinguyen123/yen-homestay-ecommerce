import os
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"
os.environ["PYTHONIOENCODING"] = "utf-8"
os.environ["PYTHONUTF8"] = "1"

import io
import logging
from contextlib import asynccontextmanager
from typing import List

import requests
import torch
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from pydantic import BaseModel, HttpUrl
from transformers import CLIPModel, CLIPProcessor

# Cấu hình logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("clip-service")

MODEL_ID = "openai/clip-vit-base-patch32"
device = "cuda" if torch.cuda.is_available() else "cpu"

model = None
processor = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Tải trước mô hình CLIP khi service khởi động"""
    global model, processor
    logger.info(f"Đang tải mô hình CLIP '{MODEL_ID}' trên thiết bị: {device.upper()}...")
    try:
        model = CLIPModel.from_pretrained(MODEL_ID).to(device)
        processor = CLIPProcessor.from_pretrained(MODEL_ID)
        model.eval()
        logger.info(" Mô hình CLIP đã sẵn sàng phục vụ (Vector 512 dimensions)!")
    except Exception as e:
        logger.error(f"Lỗi khi tải mô hình CLIP: {e}", exc_info=True)
        raise e
    yield
    logger.info("Đang tắt AI Service...")

app = FastAPI(
    title="YÊN Homestay - Visual Search AI Microservice",
    description="Microservice trích xuất đặc trưng vector 512 chiều từ hình ảnh sử dụng mô hình OpenAI CLIP",
    version="1.0.0",
    lifespan=lifespan
)

# Cấu hình CORS để Frontend hoặc Backend dễ dàng gọi thử
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class UrlImageRequest(BaseModel):
    image_url: str

class VectorResponse(BaseModel):
    dim: int
    embedding: List[float]

def extract_embedding_from_pil(image: Image.Image) -> List[float]:
    """Hàm trích xuất vector 512 chiều từ đối tượng PIL Image và chuẩn hóa L2"""
    inputs = processor(images=image, return_tensors="pt").to(device)
    with torch.no_grad():
        image_features = model.get_image_features(**inputs)
        if hasattr(image_features, "pooler_output"):
            image_features = image_features.pooler_output
        # Chuẩn hóa L2 norm để độ dài vector = 1.0 (phục vụ Cosine Distance trên pgvector)
        image_features = image_features / image_features.norm(p=2, dim=-1, keepdim=True)
        vector = image_features[0].cpu().numpy().tolist()
    return vector

@app.get("/")
def root():
    return {
        "service": "YÊN Homestay Visual Search AI Service",
        "model": MODEL_ID,
        "device": device,
        "dim": 512,
        "status": "running"
    }

@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": model is not None, "device": device}

@app.post("/extract-vector-url", response_model=VectorResponse)
def extract_vector_url(req: UrlImageRequest):
    """Trích xuất vector từ URL ảnh có sẵn trên internet hoặc S3/Cloudinary/Neon"""
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        resp = requests.get(req.image_url, headers=headers, timeout=12)
        resp.raise_for_status()

        image = Image.open(io.BytesIO(resp.content)).convert("RGB")
        vector = extract_embedding_from_pil(image)
        return VectorResponse(dim=len(vector), embedding=vector)
    except requests.exceptions.RequestException as e:
        logger.error(f"Lỗi khi tải ảnh từ URL: {req.image_url} -> {e}")
        raise HTTPException(status_code=400, detail=f"Không thể tải ảnh từ URL: {str(e)}")
    except Exception as e:
        logger.error(f"Lỗi xử lý ảnh: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Lỗi trích xuất vector: {str(e)}")

@app.post("/extract-vector-file", response_model=VectorResponse)
async def extract_vector_file(file: UploadFile = File(...)):
    """Trích xuất vector từ file ảnh tải lên trực tiếp (multipart/form-data)"""
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Tập tin tải lên phải là hình ảnh (jpg, png, webp, ...)")
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        vector = extract_embedding_from_pil(image)
        return VectorResponse(dim=len(vector), embedding=vector)
    except Exception as e:
        logger.error(f"Lỗi xử lý file ảnh: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Lỗi trích xuất vector từ file: {str(e)}")

# ==============================================================================
# PHẦN 2: REVIEW SENTIMENT & ASPECT-BASED NLP SERVICE
# ==============================================================================

class ReviewAnalyzeRequest(BaseModel):
    review_id: int | None = None
    rating: int = 5
    comment: str

class ReviewAnalyzeResponse(BaseModel):
    sentiment: str              # POSITIVE, NEGATIVE, NEUTRAL
    sentiment_score: float      # 0.0 - 1.0
    aspect_tags: List[str]      # ["Vệ sinh", "Dịch vụ", ...]
    ai_summary: str             # Tóm tắt góp ý

POSITIVE_WORDS = {
    "tuyệt vời", "xuất sắc", "rất tốt", "hài lòng", "sạch sẽ", "nhiệt tình", "thân thiện",
    "chu đáo", "đẹp", "thoáng mát", "yên tĩnh", "xứng đáng", "tiện nghi", "chất lượng",
    "ưng ý", "ngon", "ấm cúng", "thích", "chill", "view đẹp", "rẻ", "hợp lý", "ok", "tốt"
}

NEGATIVE_WORDS = {
    "tệ", "thất vọng", "dơ", "bẩn", "kinh khủng", "hôi", "ồn ào", "cũ", "kém",
    "khó chịu", "cau có", "chảnh", "thái độ", "đắt", "chặt chém", "lừa đảo", "hỏng",
    "chậm", "chán", "muỗi", "ẩm mốc", "xa", "nguy hiểm", "chật", "chê", "không đáng"
}

NEGATION_WORDS = {"không", "chẳng", "chả", "chưa", "kém", "ít"}

ASPECT_KEYWORDS = {
    "Vệ sinh": ["sạch", "dơ", "bẩn", "rác", "mùi", "toilet", "vệ sinh", "ẩm mốc", "ga giường", "khăn"],
    "Dịch vụ": ["chủ nhà", "nhân viên", "nhiệt tình", "thân thiện", "lễ tân", "thái độ", "phục vụ", "hỗ trợ", "chu đáo"],
    "Tiện nghi": ["wifi", "mạng", "máy lạnh", "điều hòa", "nóng lạnh", "tivi", "tủ lạnh", "giường", "nệm", "ồn", "cách âm"],
    "Giá cả": ["giá", "tiền", "đắt", "rẻ", "hợp lý", "xứng đáng", "phụ thu", "voucher", "ưu đãi"],
    "Vị trí": ["vị trí", "view", "cảnh", "trung tâm", "xa", "gần", "dốc", "hẻm", "đường", "yên tĩnh", "biển", "đồi"]
}

def analyze_vietnamese_review(comment: str, rating: int) -> dict:
    text = (comment or "").lower().strip()
    pos_score = 0
    neg_score = 0

    for pw in POSITIVE_WORDS:
        if pw in text:
            pos_score += 1.5
    for nw in NEGATIVE_WORDS:
        if nw in text:
            neg_score += 1.8

    for neg in NEGATION_WORDS:
        for pw in POSITIVE_WORDS:
            if f"{neg} {pw}" in text or f"{neg} được {pw}" in text:
                pos_score -= 1.5
                neg_score += 2.0

    if rating >= 4:
        pos_score += (rating - 3) * 1.5
    elif rating <= 2:
        neg_score += (3 - rating) * 2.0

    if neg_score > pos_score and (neg_score >= 1.5 or rating <= 2):
        sentiment = "NEGATIVE"
        sentiment_score = min(0.99, max(0.65, 0.5 + (neg_score - pos_score) * 0.1))
    elif pos_score > neg_score and (pos_score >= 1.5 or rating >= 4):
        sentiment = "POSITIVE"
        sentiment_score = min(0.99, max(0.65, 0.5 + (pos_score - neg_score) * 0.1))
    else:
        sentiment = "NEUTRAL"
        sentiment_score = 0.55

    detected_aspects = []
    for aspect, kw_list in ASPECT_KEYWORDS.items():
        if any(kw in text for kw in kw_list):
            detected_aspects.append(aspect)

    aspect_str = ", ".join(detected_aspects) if detected_aspects else "trải nghiệm chung"
    if sentiment == "POSITIVE":
        ai_summary = f"Khách khen ngợi về {aspect_str}, trải nghiệm rất hài lòng ({rating}⭐)."
    elif sentiment == "NEGATIVE":
        ai_summary = f"Khách phàn nàn và không hài lòng về {aspect_str} ({rating}⭐)."
    else:
        ai_summary = f"Khách đánh giá mức trung bình, có góp ý liên quan đến {aspect_str} ({rating}⭐)."

    return {
        "sentiment": sentiment,
        "sentiment_score": round(float(sentiment_score), 2),
        "aspect_tags": detected_aspects,
        "ai_summary": ai_summary
    }

@app.post("/analyze-review", response_model=ReviewAnalyzeResponse)
def analyze_review_endpoint(req: ReviewAnalyzeRequest):
    result = analyze_vietnamese_review(req.comment, req.rating)
    return ReviewAnalyzeResponse(**result)

if __name__ == "__main__":
    import uvicorn
    # Khởi chạy trên cổng 8000
    uvicorn.run(app, host="0.0.0.0", port=8000)
