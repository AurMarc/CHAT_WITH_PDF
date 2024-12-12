import { useState, useEffect, useRef } from 'react'
import { uploadPDF, askQuestion, getDocuments } from './services/api'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

function App() {
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const CustomCodeBlock = ({ node, inline, className, children, ...props }) => {
    const match = /language-(\w+)/.exec(className || '')
    return !inline && match ? (
      <SyntaxHighlighter
        style={oneDark}
        language={match[1]}
        PreTag="div"
        className="rounded-md"
        {...props}
      >
        {String(children).replace(/\n$/, '')}
      </SyntaxHighlighter>
    ) : (
      <code className={`${className} bg-gray-800 rounded-md px-1`} {...props}>
        {children}
      </code>
    )
  }

  const fetchDocuments = async () => {
    try {
      const docs = await getDocuments();
      setDocuments(docs);
    } catch (error) {
      setError('Error fetching documents');
    }
  };

  const formatFilename = (filename) => {
    const parts = filename.split('_');
    return parts.length > 1 ? parts.slice(1).join('_') : filename;
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    try {
      await uploadPDF(file);
      const updatedDocs = await getDocuments();
      const newDoc = updatedDocs[updatedDocs.length - 1];
      setDocuments(updatedDocs);
      setSelectedDoc(newDoc);
      
      setError(null);
      setChatHistory(prev => [...prev, {
        type: 'system',
        content: `Successfully uploaded ${file.name}`
      }]);
    } catch (error) {
      setError('Error uploading file');
    } finally {
      setLoading(false);
    }
  };

  const simulateTyping = async (answer) => {
    setIsTyping(true);
    let displayText = '';
    const words = answer.split(' ');
    
    for (let i = 0; i < words.length; i++) {
      displayText += words[i] + ' ';
      setChatHistory(prev => {
        const newHistory = [...prev];
        newHistory[newHistory.length - 1] = {
          type: 'assistant',
          content: displayText.trim()
        };
        return newHistory;
      });
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    setIsTyping(false);
  };

  const handleAskQuestion = async (e) => {
    e.preventDefault();
    if (!selectedDoc || !question.trim()) return;

    setLoading(true);
    setChatHistory(prev => [...prev, { type: 'human', content: question }]);
    
    try {
      const response = await askQuestion(selectedDoc.id, question);
      setChatHistory(prev => [...prev, { type: 'assistant', content: '' }]);
      setQuestion('');
      await simulateTyping(response.answer);
    } catch (error) {
      setError('Error getting answer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-black">
      {/* Header - With inline title and controls */}
      <div className="w-full bg-black py-4 px-4 border-b border-gray-800">
        <h1 className="absolute left-4 top-5 text-xl font-semibold text-white">PDF Chat</h1>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4">
            {/* Document Selection */}
            <select
              value={selectedDoc?.id || ''}
              onChange={(e) => setSelectedDoc(documents.find(d => d.id === Number(e.target.value)))}
              className="flex-1 rounded-lg bg-[#1F1F1F] px-4 py-2.5 text-white border border-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-700"
            >
              <option value="">Select a PDF document</option>
              {documents.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {formatFilename(doc.filename)}
                </option>
              ))}
            </select>

            {/* Upload Button */}
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1F1F1F] text-white hover:bg-[#2C2C2C] cursor-pointer transition-colors border border-gray-800"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Upload PDF
            </label>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto">
          {error && (
            <div className="m-4 p-4 bg-red-900/10 border border-red-600/20 text-red-400 rounded-lg">
              {error}
            </div>
          )}

          {chatHistory.map((message, index) => (
            <div
              key={index}
              className={`border-b border-gray-800 ${
                message.type === 'assistant' || message.type === 'system' 
                  ? 'bg-[#1F1F1F]' 
                  : ''
              }`}
            >
              <div className="max-w-3xl mx-auto p-6">
                <div className="flex gap-6 m-auto">
                  <div className="flex-shrink-0 mt-1">
                    {message.type === 'assistant' || message.type === 'system' ? (
                      <div className="w-8 h-8 bg-[#19C37D] rounded-full flex items-center justify-center text-white text-sm font-medium">
                        AI
                      </div>
                    ) : (
                      <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white border border-gray-800 text-sm font-medium">
                        You
                      </div>
                    )}
                  </div>
                  <div className="min-h-[20px] flex flex-1 flex-col items-start gap-3 text-gray-100">
                    <ReactMarkdown 
                      className="prose prose-invert max-w-none"
                      components={{
                        code: CustomCodeBlock
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {loading && !isTyping && (
            <div className="bg-[#1F1F1F] border-b border-gray-800">
              <div className="max-w-3xl mx-auto p-6">
                <div className="flex gap-6">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-8 h-8 bg-[#19C37D] rounded-full flex items-center justify-center text-white text-sm font-medium">
                      AI
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-800 bg-black p-4">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleAskQuestion} className="relative">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={selectedDoc ? "Ask about the PDF..." : "Please select a PDF first"}
              className="w-full rounded-xl border border-gray-800 bg-[#1F1F1F] px-4 py-3 pr-12 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-700"
              disabled={!selectedDoc || loading || isTyping}
            />
            <button
              type="submit"
              disabled={!selectedDoc || loading || !question.trim() || isTyping}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-white disabled:hover:text-gray-400 disabled:opacity-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default App;