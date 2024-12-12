# PDF Chat

Chat with your PDFs. Upload a PDF and ask questions about its content.

## Setup & Installation

### Clone the Repository
```bash
git clone https://github.com/adc77/CHAT.git
cd CHAT
```

### Backend Setup

1. **Create and activate virtual environment:**

   ```bash
   cd backend
   python -m venv venv
   
   # On Windows
   venv\Scripts\activate
   
   # On macOS/Linux
   source venv/bin/activate
   ```

2. **Install Python dependencies:**

   ```bash
   pip install -r requirements.txt
   ```

3. **Create `.env` file:**

   Create a `.env` file in the `backend` directory and add the following:
   ```plaintext
   DATABASE_URL=sqlite:///./pdf_chat.db
   OPENAI_API_KEY=your_openai_api_key_here
   UPLOAD_DIR=./uploads
   ```

4. **Start the backend server:**

   ```bash
   uvicorn app.main:app --reload
   ```

   The backend will run on [http://localhost:8000](http://localhost:8000).

### Frontend Setup

1. **Open a new terminal and navigate to the frontend directory:**

   ```bash
   cd pdf-chat-frontend
   ```

2. **Install Node dependencies:**

   ```bash
   npm install
   ```

3. **Start the frontend development server:**

   ```bash
   npm run dev
   ```

   The frontend will run on [http://localhost:5173](http://localhost:5173).

## Usage

1. Open [http://localhost:5173](http://localhost:5173) in your browser.
2. Upload a PDF file.
3. Select your uploaded document.
4. Start asking questions about the document content.

## Note

Make sure to have both backend and frontend servers running simultaneously in separate terminals.
