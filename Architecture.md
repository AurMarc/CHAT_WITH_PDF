# Architecture Design for PDF Chat Application

## High-Level Design (HLD)

### Overview
The **PDF Chat Application** enables users to upload PDF documents, extract their content, and query them interactively using an AI-powered chat interface. The architecture is divided into **frontend**, **backend**, and **database** components, ensuring modularity, scalability, and responsiveness.

### Components
1. **Frontend**: 
   - Built with **React 18** and styled using **TailwindCSS**.
   - Provides an intuitive and responsive user interface.
   - Key features include:
     - PDF upload and selection.
     - Interactive chat interface with AI responses.
     - Real-time typing animations and code syntax highlighting.
     - Dark theme UI and responsive design.
   
2. **Backend**:
   - Powered by **FastAPI**.
   - Manages PDF processing, AI query handling, and database interactions.
   - Key features include:
     - PDF text extraction and embedding creation using **PyMuPDF** and **LangChain**.
     - Vector similarity search with **ChromaDB**.
     - OpenAI's **GPT-3.5-turbo** for generating responses.

3. **Database**:
   - **SQLite** is used for managing documents.
   - Stores metadata about uploaded PDFs.

4. **Vector Store**:
   - **ChromaDB** manages vector embeddings for efficient text search and retrieval.

---

## Low-Level Design (LLD)

### Frontend
#### Key Features
1. **PDF Upload and Selection**:
   - Allows users to upload PDF files and select them for querying.
   - Uses a file input component.

2. **Chat Interface**:
   - Renders messages in a chat-like UI.
   - Displays AI responses with real-time typing animations.

3. **Dark Theme UI**:
   - Follows ChatGPT-like styling with TailwindCSS.

4. **Code Syntax Highlighting**:
   - Implements `react-syntax-highlighter` for displaying code snippets in AI responses.

#### Key Dependencies
- **react-markdown**: For rendering AI responses in markdown.
- **react-syntax-highlighter**: For syntax highlighting in code snippets.

#### Example Component: ChatBox
```jsx
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import { github } from 'react-syntax-highlighter/dist/esm/styles/hljs';

const ChatBox = ({ messages, onSendMessage }) => {
  const [input, setInput] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSendMessage(input);
    setInput("");
  };

  return (
    <div className="chat-box">
      <div className="messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={msg.type === 'ai' ? 'ai-message' : 'user-message'}>
            <ReactMarkdown
              components={{
                code({ inline, children, className, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <SyntaxHighlighter
                      style={github}
                      language={match[1]}
                      PreTag="div"
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {msg.content}
            </ReactMarkdown>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="input-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask something..."
          className="input-field"
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
};

export default ChatBox;
```

---

### Backend
#### Key Endpoints
1. **POST /upload/**:
   - Accepts PDF files for upload.
   - Processes text extraction and embedding creation.

2. **POST /ask/{document_id}**:
   - Handles AI-powered Q&A for a specific document.

3. **GET /documents/**:
   - Returns a list of all uploaded documents.

#### Example Endpoint: Upload PDF
```python
from fastapi import FastAPI, File, UploadFile, HTTPException
from sqlalchemy.orm import Session
import fitz  # PyMuPDF
from models import Document
from database import SessionLocal

app = FastAPI()

@app.post("/upload/")
def upload_pdf(file: UploadFile):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    # Save file locally
    file_path = f"uploads/{file.filename}"
    with open(file_path, "wb") as f:
        f.write(file.file.read())

    # Extract text
    pdf_document = fitz.open(file_path)
    text = "\n".join([page.get_text() for page in pdf_document])

    # Store metadata
    db: Session = SessionLocal()
    new_document = Document(
        filename=file.filename,
        original_filename=file.filename,
        upload_date=datetime.utcnow(),
        file_path=file_path
    )
    db.add(new_document)
    db.commit()

    return {"message": "File uploaded successfully", "document_id": new_document.id}
```

#### Error Handling
- Validate file type for uploads.
- Handle missing or malformed requests gracefully with appropriate HTTP status codes.

#### Performance Optimizations
- Use background tasks for embedding creation.
- Cache frequently accessed embeddings.

---

### Database Schema
```sql
CREATE TABLE documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    upload_date DATETIME NOT NULL,
    file_path TEXT NOT NULL
);
```

---

### Integration Points
1. **Frontend to Backend**:
   - Use Axios or Fetch API for interacting with `/upload/`, `/ask/{document_id}`, and `/documents/` endpoints.

2. **Backend to Database**:
   - SQLAlchemy ORM for handling SQLite interactions.

3. **Backend to AI Services**:
   - LangChain and OpenAI API for generating embeddings and AI responses.

---

## Conclusion
This architecture is designed to ensure a seamless user experience with real-time interactivity and efficient PDF-based query processing. By separating concerns between the frontend, backend, and database, it allows for easier scalability and maintainability.