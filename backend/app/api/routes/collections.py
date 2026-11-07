import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.document import Document
from app.models.collection import Collection, CollectionDocument
from app.schemas.collection import CollectionCreate, CollectionUpdate, CollectionResponse

router = APIRouter()

@router.post("", response_model=CollectionResponse, status_code=status.HTTP_201_CREATED)
def create_collection(
    collection_in: CollectionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    coll = Collection(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        name=collection_in.name.strip(),
        description=collection_in.description
    )
    db.add(coll)
    db.commit()
    db.refresh(coll)
    return CollectionResponse(
        id=coll.id,
        user_id=coll.user_id,
        name=coll.name,
        description=coll.description,
        created_at=coll.created_at,
        document_ids=[]
    )

@router.get("", response_model=List[CollectionResponse])
def list_collections(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    collections = (
        db.query(Collection)
        .filter(Collection.user_id == current_user.id)
        .order_by(Collection.created_at.desc())
        .all()
    )
    results = []
    for c in collections:
        doc_ids = [cd.document_id for cd in c.documents]
        results.append(CollectionResponse(
            id=c.id,
            user_id=c.user_id,
            name=c.name,
            description=c.description,
            created_at=c.created_at,
            document_ids=doc_ids
        ))
    return results

@router.get("/{collection_id}", response_model=CollectionResponse)
def get_collection(
    collection_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    coll = db.query(Collection).filter(
        Collection.id == collection_id,
        Collection.user_id == current_user.id
    ).first()
    if not coll:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    doc_ids = [cd.document_id for cd in coll.documents]
    return CollectionResponse(
        id=coll.id,
        user_id=coll.user_id,
        name=coll.name,
        description=coll.description,
        created_at=coll.created_at,
        document_ids=doc_ids
    )

@router.patch("/{collection_id}", response_model=CollectionResponse)
def update_collection(
    collection_id: str,
    collection_in: CollectionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    coll = db.query(Collection).filter(
        Collection.id == collection_id,
        Collection.user_id == current_user.id
    ).first()
    if not coll:
        raise HTTPException(status_code=404, detail="Collection not found")

    if collection_in.name is not None:
        coll.name = collection_in.name.strip()
    if collection_in.description is not None:
        coll.description = collection_in.description

    db.commit()
    db.refresh(coll)
    doc_ids = [cd.document_id for cd in coll.documents]
    return CollectionResponse(
        id=coll.id,
        user_id=coll.user_id,
        name=coll.name,
        description=coll.description,
        created_at=coll.created_at,
        document_ids=doc_ids
    )

@router.delete("/{collection_id}", status_code=status.HTTP_200_OK)
def delete_collection(
    collection_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    coll = db.query(Collection).filter(
        Collection.id == collection_id,
        Collection.user_id == current_user.id
    ).first()
    if not coll:
        raise HTTPException(status_code=404, detail="Collection not found")

    db.delete(coll)
    db.commit()
    return {"message": "Collection deleted successfully", "id": collection_id}

@router.post("/{collection_id}/documents/{document_id}", response_model=CollectionResponse)
def add_document_to_collection(
    collection_id: str,
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    coll = db.query(Collection).filter(
        Collection.id == collection_id,
        Collection.user_id == current_user.id
    ).first()
    if not coll:
        raise HTTPException(status_code=404, detail="Collection not found")

    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Check if already added
    exists = db.query(CollectionDocument).filter(
        CollectionDocument.collection_id == collection_id,
        CollectionDocument.document_id == document_id
    ).first()
    if not exists:
        assoc = CollectionDocument(
            id=str(uuid.uuid4()),
            collection_id=collection_id,
            document_id=document_id
        )
        db.add(assoc)
        db.commit()
        db.refresh(coll)

    doc_ids = [cd.document_id for cd in coll.documents]
    return CollectionResponse(
        id=coll.id,
        user_id=coll.user_id,
        name=coll.name,
        description=coll.description,
        created_at=coll.created_at,
        document_ids=doc_ids
    )

@router.delete("/{collection_id}/documents/{document_id}", response_model=CollectionResponse)
def remove_document_from_collection(
    collection_id: str,
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    coll = db.query(Collection).filter(
        Collection.id == collection_id,
        Collection.user_id == current_user.id
    ).first()
    if not coll:
        raise HTTPException(status_code=404, detail="Collection not found")

    assoc = db.query(CollectionDocument).filter(
        CollectionDocument.collection_id == collection_id,
        CollectionDocument.document_id == document_id
    ).first()
    if assoc:
        db.delete(assoc)
        db.commit()
        db.refresh(coll)

    doc_ids = [cd.document_id for cd in coll.documents]
    return CollectionResponse(
        id=coll.id,
        user_id=coll.user_id,
        name=coll.name,
        description=coll.description,
        created_at=coll.created_at,
        document_ids=doc_ids
    )
