import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.endpoints import (
    auth, projects, brands, items, inventory,
    orders, transactions, investments, triage, brand_content, order_parser,
    image_gen,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)-8s [%(name)s] %(message)s",
)

app = FastAPI(
    title="ContentForge AI API",
    description="AI-powered marketing content generation & SME business management",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auth & Marketing
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(projects.router, prefix="/api/projects", tags=["Projects"])

# Business Management
app.include_router(brands.router, prefix="/api/brands", tags=["Brands"])
app.include_router(items.router, prefix="/api/brands", tags=["Items"])
app.include_router(inventory.router, prefix="/api/brands", tags=["Inventory"])
app.include_router(orders.router, prefix="/api/brands", tags=["Orders"])
app.include_router(transactions.router, prefix="/api/brands", tags=["Transactions"])
app.include_router(investments.router, prefix="/api/brands", tags=["Investments"])
app.include_router(brand_content.router, prefix="/api/brands", tags=["Brand Content"])

# AI Utilities
app.include_router(order_parser.router, prefix="/api", tags=["Order Parser"])
app.include_router(image_gen.router, prefix="/api", tags=["Image Generation"])

# Triage Dashboard
app.include_router(triage.router, prefix="/api/triage", tags=["Triage"])


@app.get("/")
def root():
    """Root endpoint."""
    return {"message": "ContentForge AI API", "version": "2.0.0", "docs": "/docs"}


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}
