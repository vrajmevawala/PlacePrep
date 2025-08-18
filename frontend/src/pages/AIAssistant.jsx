import React, { useState, useEffect, useRef } from 'react';
import { 
  Brain, 
  Send, 
  Bot,
  FileText,
  Image,
  Upload,
  Lightbulb,
  MessageCircle,
  BookOpen,
  Target,
  BarChart3
} from 'lucide-react';

const AIAssistant = ({ user }) => {
  // AI Chat State
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      type: 'bot',
      message: "Hi! I'm your AI study assistant powered by Gemini. I can help you with:\n• Solving MCQs and explaining concepts\n• Aptitude and DSA problem-solving\n• Technical interview preparation\n• Analyzing PDFs and images\n• Study tips and strategies\n\nWhat would you like help with today?",
      timestamp: new Date()
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // File Analysis State
  const [selectedAnalysisFile, setSelectedAnalysisFile] = useState(null);
  const [analysisType, setAnalysisType] = useState('summary');
  const [analyzing, setAnalyzing] = useState(false);

  // Refs
  const chatContainerRef = useRef(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Handle file selection for analysis
  const handleAnalysisFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && (file.type === 'application/pdf' || file.type.startsWith('image/'))) {
      setSelectedAnalysisFile(file);
    } else {
      alert('Please select a valid PDF or image file.');
    }
  };

  // Handle file analysis
  const handleAnalyzeFile = async () => {
    if (!selectedAnalysisFile) {
      alert('Please select a file to analyze.');
      return;
    }

    setAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedAnalysisFile);
      formData.append('analysisType', analysisType);

      const response = await fetch('/api/resources/ai/analyze', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        
        // Add analysis result to chat
        const analysisMessage = {
          id: Date.now(),
          type: 'bot',
          message: `📄 **File Analysis Result**\n\n**File:** ${selectedAnalysisFile.name}\n**Type:** ${data.type}\n**Analysis:**\n\n${data.analysis}`,
          timestamp: new Date(data.timestamp)
        };
        setChatMessages(prev => [...prev, analysisMessage]);
        
        // Reset file selection
        setSelectedAnalysisFile(null);
      } else {
        const errorData = await response.json();
        const errorMessage = {
          id: Date.now(),
          type: 'bot',
          message: `❌ **File Analysis Error**\n\n**File:** ${selectedAnalysisFile.name}\n**Error:** ${errorData.message}\n\n${errorData.suggestion || 'Please try again with a different file.'}`,
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Error analyzing file:', error);
      const errorMessage = {
        id: Date.now(),
        type: 'bot',
        message: `❌ **File Analysis Error**\n\n**File:** ${selectedAnalysisFile.name}\n**Error:** Failed to analyze file. Please try again.\n\nMake sure your file is not corrupted and try uploading it again.`,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setAnalyzing(false);
    }
  };

  // Handle chatbot message send
  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      message: newMessage,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/resources/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          message: newMessage,
          context: 'AI Assistant - General study help'
        })
      });

      if (response.ok) {
        const data = await response.json();
        const botResponse = {
          id: Date.now() + 1,
          type: 'bot',
          message: data.message,
          timestamp: new Date(data.timestamp)
        };
        setChatMessages(prev => [...prev, botResponse]);
      } else {
        const errorData = await response.json();
        const botResponse = {
          id: Date.now() + 1,
          type: 'bot',
          message: `Sorry, I encountered an error: ${errorData.message || 'Failed to get response'}`,
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, botResponse]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const botResponse = {
        id: Date.now() + 1,
        type: 'bot',
        message: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, botResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AI Study Assistant</h1>
              <p className="text-gray-600">Powered by Gemini - Your intelligent learning companion</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chat Interface */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
              <div className="p-6">
                <div className="bg-gray-50 rounded-xl p-4 h-[70vh] flex flex-col">
                  {/* Chat Messages */}
                  <div 
                    ref={chatContainerRef}
                    className="flex-1 overflow-y-auto space-y-4 mb-4"
                  >
                    {chatMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs px-4 py-3 rounded-2xl ${
                            message.type === 'user'
                              ? 'bg-black text-white'
                              : 'bg-green-100 text-gray-800 shadow-sm border border-green-200'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-line">{message.message}</p>
                          <p className="text-xs opacity-70 mt-2">
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))}
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="bg-green-100 text-gray-800 px-4 py-3 rounded-2xl shadow-sm border border-green-200">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Message Input */}
                  <div className="flex space-x-3">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Ask me anything about aptitude, DSA, or technical topics..."
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || isTyping}
                      className="bg-black text-white p-3 rounded-xl hover:bg-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* File Analysis Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">File Analysis</h3>
                <p className="text-sm text-gray-600">Upload files for AI analysis</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Analysis Type</label>
                  <select
                    value={analysisType}
                    onChange={(e) => setAnalysisType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                  >
                    <option value="summary">Summary</option>
                    <option value="explanation">Explanation</option>
                    <option value="questions">Generate Questions</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Upload File</label>
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={handleAnalysisFileSelect}
                    className="w-full text-sm"
                  />
                  {selectedAnalysisFile && (
                    <p className="text-xs text-gray-600 mt-2">Selected: {selectedAnalysisFile.name}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Supported: PDF files and images (JPEG, PNG, etc.)
                  </p>
                </div>
                
                <button
                  onClick={handleAnalyzeFile}
                  disabled={!selectedAnalysisFile || analyzing}
                  className="w-full px-4 py-3 bg-black text-white text-sm rounded-lg hover:bg-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {analyzing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Analyze File</span>
                    </>
                  )}
                </button>
                
                <div className="text-xs text-gray-500 space-y-1">
                  <p><strong>Tips:</strong></p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>PDFs and images are analyzed using AI vision</li>
                    <li>Ensure files are clear and readable</li>
                    <li>Analysis results will appear in the chat</li>
                    <li>Supported: PDF, JPEG, PNG, and other image formats</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => setNewMessage("Help me with aptitude questions")}
                  className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Target className="w-5 h-5 text-blue-500" />
                  <span className="text-sm">Aptitude Help</span>
                </button>
                <button
                  onClick={() => setNewMessage("Explain DSA concepts")}
                  className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <BarChart3 className="w-5 h-5 text-green-500" />
                  <span className="text-sm">DSA Concepts</span>
                </button>
                <button
                  onClick={() => setNewMessage("Technical interview tips")}
                  className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <BookOpen className="w-5 h-5 text-purple-500" />
                  <span className="text-sm">Interview Tips</span>
                </button>
                <button
                  onClick={() => setNewMessage("Study strategies")}
                  className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Lightbulb className="w-5 h-5 text-yellow-500" />
                  <span className="text-sm">Study Strategies</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant; 