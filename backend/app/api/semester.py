from fastapi import APIRouter, Depends, HTTPException, Response, Request, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.schemas import SemesterCreate, SemesterResponse, SemesterUpdate, SemesterJoin
from app.crud import create_semester, get_active_semester, end_semester, get_semester, delete_semester, get_semesters
from app.core import get_db, limiter
from app.auth import get_current_user, require_admin

router = APIRouter(prefix="/semesters", tags=["Semesters"])


# ADMIN ONLY
@router.post("", response_model=SemesterResponse)
@limiter.limit("10/minute;100/hour")
async def create_semester_route(
    request: Request, 
    data: SemesterCreate, 
    current_user = Depends(require_admin),
    db: Session = Depends(get_db)
):
    try:
        existing_active = get_active_semester(db)
        if existing_active:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, 
                detail="An active semester already exists. Please end it before creating a new one."
            )
        
        semester = create_semester(data, db)
        return semester
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Semester with this access code already exists")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create semester")


# ADMIN ONLY
@router.get("", response_model=list[SemesterResponse])
@limiter.limit("100/minute;1000/hour")
async def get_all_semesters_route(
    request: Request,
    skip: int = 0,
    limit: int = 100,
    current_user = Depends(require_admin),
    db: Session = Depends(get_db)
):
    try:
        semesters = get_semesters(skip, limit, db)
        return semesters
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to retrieve semesters")


@router.get("/active", response_model=SemesterResponse)
@limiter.limit("100/minute;1000/hour")
async def get_active_semester_route(request: Request, db: Session = Depends(get_db)):
    try:
        semester = get_active_semester(db)
        if not semester:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="No active semester found"
            )
        
        return semester
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to retrieve active semester")


@router.get("/{id}", response_model=SemesterResponse)
@limiter.limit("100/minute;1000/hour")
async def get_semester_route(
    request: Request,
    id: int,
    db: Session = Depends(get_db)
):
    try:
        semester = get_semester(id, db)
        if not semester:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Semester not found")
        return semester
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to retrieve semester")


# ADMIN ONLY
@router.patch("/{id}", response_model=SemesterResponse)
@limiter.limit("5/minute;50/hour")
async def update_semester_route(
    request: Request,
    id: int,
    data: SemesterUpdate,
    current_user = Depends(require_admin),
    db: Session = Depends(get_db)
):
    try:
        semester = get_semester(id, db)
        if not semester:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Semester not found")
        
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(semester, field, value)
        
        db.commit()
        db.refresh(semester)
        return semester
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail = "Failed to update semester")


# ADMIN ONLY
@router.patch("/{id}/end", response_model=SemesterResponse)
@limiter.limit("5/minute;50/hour")
async def end_semester_route(
    request: Request,
    id: int,
    current_user = Depends(require_admin),
    db: Session = Depends(get_db)
):
    try:
        semester = get_semester(id, db)
        if not semester:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Semester not found")
        
        if not semester.is_active:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Semester is already ended")
        
        ended_semester = end_semester(id, db)
        return ended_semester
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to end semester")


@router.post("/{id}/join", response_model=SemesterResponse)
@limiter.limit("10/minute;100/hour")
async def join_semester_route(
    request: Request,
    id: int,
    data: SemesterJoin,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        semester = get_semester(id, db)
        if not semester:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Semester not found")
        
        if semester.access_code != data.access_code:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid access code")
        
        if not semester.is_active:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This semester is not active")
            
        return semester
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to join semester")
    

# ADMIN ONLY
@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("5/minute;30/hour")
async def delete_semester_route(
    request: Request, 
    id: int, 
    current_user = Depends(require_admin), 
    db: Session = Depends(get_db)
):
    try:
        result = delete_semester(id, db)
        if not result:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Semester not found")  # Add this
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to delete semester")