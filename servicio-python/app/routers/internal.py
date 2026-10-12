from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import SpaceOut
from app.security import Principal, require_service
from app.services import parking_service

router = APIRouter(prefix="/internal/parking", tags=["internal"], include_in_schema=False)


@router.get("/spaces", response_model=list[SpaceOut])
def list_all_spaces(
    db: Session = Depends(get_db),
    principal: Principal = Depends(require_service),
):
    return parking_service.list_spaces(db)
