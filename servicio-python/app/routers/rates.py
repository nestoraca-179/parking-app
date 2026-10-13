from fastapi import APIRouter, Depends, Path, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import RateCreate, RateOut, RateUpdate
from app.security import Principal, get_current_user, require_admin
from app.services import parking_service

router = APIRouter(prefix="/api/parking/rates", tags=["rates"])


@router.get("", response_model=list[RateOut])
def list_rates(
    db: Session = Depends(get_db),
    principal: Principal = Depends(get_current_user),
):
    return parking_service.list_rates(db)


@router.post("", response_model=RateOut, status_code=status.HTTP_201_CREATED)
def create_rate(
    data: RateCreate,
    db: Session = Depends(get_db),
    principal: Principal = Depends(require_admin),
):
    return parking_service.create_rate(db, data)


@router.put("/{vehicleType}", response_model=RateOut)
def update_rate(
    data: RateUpdate,
    vehicle_type: str = Path(alias="vehicleType"),
    db: Session = Depends(get_db),
    principal: Principal = Depends(require_admin),
):
    return parking_service.update_rate(db, vehicle_type, data)
