from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import SpaceCreate, SpaceOut, SpaceStatus, SpaceUpdate, VehicleType
from app.security import Principal, get_current_user, require_admin
from app.services import parking_service

router = APIRouter(prefix="/api/parking/spaces", tags=["spaces"])


@router.get("", response_model=list[SpaceOut])
def list_spaces(
    status: SpaceStatus | None = None,
    vehicle_type: VehicleType | None = Query(default=None, alias="vehicleType"),
    db: Session = Depends(get_db),
    principal: Principal = Depends(get_current_user),
):
    return parking_service.list_spaces(db, status, vehicle_type)


@router.post("", response_model=SpaceOut, status_code=201)
def create_space(
    data: SpaceCreate,
    db: Session = Depends(get_db),
    principal: Principal = Depends(require_admin),
):
    return parking_service.create_space(db, data)


@router.put("/{space_id}", response_model=SpaceOut)
def update_space(
    space_id: int,
    data: SpaceUpdate,
    db: Session = Depends(get_db),
    principal: Principal = Depends(require_admin),
):
    return parking_service.update_space(db, space_id, data)


@router.delete("/{space_id}", status_code=204)
def delete_space(
    space_id: int,
    db: Session = Depends(get_db),
    principal: Principal = Depends(require_admin),
):
    parking_service.delete_space(db, space_id)
    return Response(status_code=204)
