from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Form, Body
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import uuid
import os

from . import database, pdf_processor, chat_engine
from .database import SessionLocal, Document

app = FastAPI()
chat_engine = chat_engine.ChatEngine()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Add this class for the question
class QuestionRequest(BaseModel):
    question: str

@app.post("/upload/")
async def upload_pdf(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):

    print(f"Received file: {file.filename}")
    print(f"Content type: {file.content_type}")

    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    try:
        # Generate unique filename
        unique_filename = f"{uuid.uuid4()}_{file.filename}"
        
        # Save the file
        file_path = pdf_processor.save_uploaded_pdf(file, unique_filename)
        
        doc = Document(
            filename=unique_filename,
            original_filename=file.filename,
            file_path=file_path
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)
        
        text = pdf_processor.extract_text_from_pdf(file_path)
        chat_engine.create_knowledge_base(text, str(doc.id))
        
        return {
            "document_id": doc.id,
            "message": "PDF uploaded and processed successfully",
            "filename": file.filename,
            "file_path": file_path
        }
    except Exception as e:
        print(f"Error during upload: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ask/{document_id}")
async def ask_question(
    document_id: int,
    question_request: QuestionRequest,
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    try:
        answer = chat_engine.get_answer(question_request.question, str(doc.id))
        return {"answer": answer}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/documents/")
async def list_documents(db: Session = Depends(get_db)):
    docs = db.query(Document).all()
    return docs