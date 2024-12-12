from langchain.embeddings import OpenAIEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.vectorstores import Chroma
from langchain.chains import RetrievalQA
from langchain.chat_models import ChatOpenAI
from .config import settings

class ChatEngine:
    def __init__(self):
        # for debugging
        if not settings.openai_api_key:
            raise ValueError("OpenAI API key is not set")
        print(f"API Key prefix: {settings.openai_api_key[:7]}...")

        self.embeddings = OpenAIEmbeddings(openai_api_key=settings.openai_api_key)
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
        )
        self.llm = ChatOpenAI(
            temperature=0,
            openai_api_key=settings.openai_api_key,
            model_name="gpt-3.5-turbo"
        )

    def create_knowledge_base(self, text: str, document_id: str):
        """Create a vector store from the document text."""
        texts = self.text_splitter.split_text(text)
        return Chroma.from_texts(
            texts,
            self.embeddings,
            collection_name=f"doc_{document_id}"
        )

    def get_answer(self, question: str, document_id: str) -> str:
        """Get answer for a question using the document's knowledge base."""
        db = Chroma(
            collection_name=f"doc_{document_id}",
            embedding_function=self.embeddings
        )
        retriever = db.as_retriever()
        qa_chain = RetrievalQA.from_chain_type(
            llm=self.llm,
            chain_type="stuff",
            retriever=retriever
        )
        return qa_chain.run(question)