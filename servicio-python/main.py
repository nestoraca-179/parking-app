import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy import text
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.database import SessionLocal, init_db
from app.errors import ApiError
from app.routers import internal, rates, spaces, tickets
from app.seed import seed_database

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
logger = logging.getLogger("parking.main")

NOT_FOUND_CODES = {404: "NOT_FOUND", 405: "METHOD_NOT_ALLOWED"}


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    seed_database()
    yield


app = FastAPI(
    title="Parking Service",
    version="1.0.0",
    docs_url="/api/parking/docs",
    openapi_url="/api/parking/openapi.json",
    redoc_url=None,
    lifespan=lifespan,
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    started_at = time.perf_counter()
    response = await call_next(request)
    if request.url.path != "/health":
        elapsed_ms = int((time.perf_counter() - started_at) * 1000)
        logger.info("%s %s %s %sms", request.method, request.url.path, response.status_code, elapsed_ms)
    return response


@app.exception_handler(ApiError)
async def handle_api_error(request: Request, error: ApiError):
    return JSONResponse(status_code=error.status_code, content={"error": error.error, "message": error.message})


@app.exception_handler(RequestValidationError)
async def handle_validation_error(request: Request, error: RequestValidationError):
    first = error.errors()[0]
    location = ".".join(str(part) for part in first["loc"] if part not in ("body", "query", "path"))
    message = first["msg"].removeprefix("Value error, ")
    detail = f"{location}: {message}" if location else message
    return JSONResponse(status_code=400, content={"error": "VALIDATION_ERROR", "message": detail})


@app.exception_handler(StarletteHTTPException)
async def handle_http_error(request: Request, error: StarletteHTTPException):
    code = NOT_FOUND_CODES.get(error.status_code, "HTTP_ERROR")
    return JSONResponse(status_code=error.status_code, content={"error": code, "message": str(error.detail)})


@app.exception_handler(Exception)
async def handle_unexpected_error(request: Request, error: Exception):
    logger.exception("Unhandled error")
    return JSONResponse(status_code=500, content={"error": "INTERNAL_ERROR", "message": "Unexpected server error"})


@app.get("/health", include_in_schema=False)
def health():
    try:
        with SessionLocal() as db:
            db.execute(text("SELECT 1"))
    except Exception:
        return JSONResponse(status_code=503, content={"status": "unavailable"})
    return {"status": "ok"}


app.include_router(spaces.router)
app.include_router(rates.router)
app.include_router(tickets.router)
app.include_router(internal.router)
