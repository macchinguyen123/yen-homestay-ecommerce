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

if __name__ == "__main__":
    import uvicorn
    # Khởi chạy trên cổng 8000
    uvicorn.run(app, host="0.0.0.0", port=8000)
