from fastapi import APIRouter
from app.api.endpoints import router as api_router

api_router_root = APIRouter()
api_router_root.include_router(api_router, prefix="/api")
api_router_root.include_router(api_router)  # Allow routes like /login without prefix
