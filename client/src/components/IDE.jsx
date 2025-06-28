import { useCallback, useEffect, useRef, useState } from 'react';
import '../App.css';
import '../index.css';
import Terminal from './Terminal';
import Tree from './Tree';
import createSocket from '../socket'
import AceEditor from 'react-ace';
import { useParams } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'

import 'ace-builds/src-noconflict/mode-javascript';
import 'ace-builds/src-noconflict/mode-python';
import 'ace-builds/src-noconflict/mode-java';
import 'ace-builds/src-noconflict/mode-c_cpp';
import 'ace-builds/src-noconflict/mode-html';
import 'ace-builds/src-noconflict/theme-monokai';
import 'ace-builds/src-noconflict/theme-dracula';
import 'ace-builds/src-noconflict/theme-twilight';
import 'ace-builds/src-noconflict/theme-tomorrow_night';
import 'ace-builds/src-noconflict/theme-github';
import 'ace-builds/src-noconflict/ext-language_tools';

const IDE = () => {
  const [socket, setSocket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [fileTree, setFileTree] = useState([])
  const [language, setLanguage] = useState('javascript')
  const [selectedFile, setSelectedFile] = useState('')
  const [code, setCode] = useState('');
  const [selectedFileContent, setSelectedFileContent] = useState('')
  const [error, setError] = useState(null)
  const isSaved = code === selectedFileContent;
  const { projectId } = useParams()
  const navigate = useNavigate()

  // Add refs to prevent duplicate requests
  const fetchingFileTree = useRef(false)
  const fetchingFileContent = useRef(false)

  // Terminal resizer
  const [terminalHeight, setTerminalHeight] = useState(200);
  const isDraggingTerminal = useRef(false);
  const startY = useRef(0);
  const startHeight = useRef(0);

  // Sidebar resizer
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const isDraggingSidebar = useRef(false);
  const startX = useRef(0);
  const startSidebarWidth = useRef(0);

  const startDraggingTerminal = (e) => {
    e.preventDefault();
    isDraggingTerminal.current = true;
    startY.current = e.clientY;
    startHeight.current = terminalHeight;
  }

  const stopDraggingTerminal = () => {
    isDraggingTerminal.current = false;
  }

  const handleTerminalMouseMove = (e) => {
    if (!isDraggingTerminal.current) return;
    const dy = e.clientY - startY.current;
    const newHeight = startHeight.current - dy;
    const clampedHeight = Math.min(978, Math.min(newHeight, 500));
    setTerminalHeight(clampedHeight);
  }

  const startDraggingSidebar = (e) => {
    e.preventDefault();
    isDraggingSidebar.current = true;
    startX.current = e.clientX;
    startSidebarWidth.current = sidebarWidth;
  }

  const stopDraggingSidebar = () => {
    isDraggingSidebar.current = false;
  }

  const handleSidebarMouseMove = (e) => {
    if (!isDraggingSidebar.current) return;
    const dx = e.clientX - startX.current;
    const newWidth = startSidebarWidth.current + dx;
    const clampedWidth = Math.max(180, Math.min(newWidth, 600));
    setSidebarWidth(clampedWidth);
  }

  // Enhanced getFileTree with error handling and duplicate prevention
  const getFileTree = useCallback(async () => {
    if (fetchingFileTree.current || !projectId) return;

    fetchingFileTree.current = true;
    setError(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(`http://localhost:9000/files?projectId=${projectId}`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem('accessToken')}`
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setFileTree(result.tree || []);
    } catch (error) {
      console.error('Error fetching file tree:', error);
      if (error.name === 'AbortError') {
        setError('Request timed out. Please try again.');
      } else if (error.message.includes('Failed to fetch')) {
        setError('Cannot connect to server. Please check if the server is running.');
      } else {
        setError(`Error loading files: ${error.message}`);
      }
    } finally {
      fetchingFileTree.current = false;
    }
  }, [projectId])

  const getModeFromFileName = (filename) => {
    if (!filename) return 'text';
    const extension = filename.split('.').pop();

    switch (extension) {
      case 'js':
      case 'jsx':
        return 'javascript';
      case 'ts':
      case 'tsx':
        return 'typescript';
      case 'py':
        return 'python';
      case 'java':
        return 'java';
      case 'cpp':
      case 'cc':
      case 'c':
      case 'h':
      case 'hpp':
        return 'c_cpp';
      case 'html':
        return 'html';
      case 'css':
        return 'css';
      case 'json':
        return 'json';
      case 'md':
        return 'markdown';
      case 'txt':
        return 'text';
      case 'sh':
        return 'sh';
      default:
        return 'text';
    }
  }

  // Enhanced getFileContent with error handling and duplicate prevention
  const getFileContent = useCallback(async () => {
    if (!selectedFile || fetchingFileContent.current || !projectId) return;

    fetchingFileContent.current = true;
    setError(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`http://localhost:9000/files/content?path=${selectedFile}&projectId=${projectId}`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem('accessToken')}`
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setSelectedFileContent(result.content || '');
    } catch (error) {
      console.error('Error fetching file content:', error);
      if (error.name === 'AbortError') {
        setError('Request timed out. Please try again.');
      } else if (error.message.includes('Failed to fetch')) {
        setError('Cannot connect to server. Please check if the server is running.');
      } else {
        setError(`Error loading file: ${error.message}`);
      }
    } finally {
      fetchingFileContent.current = false;
    }
  }, [selectedFile, projectId]);

  // Socket connection setup
  useEffect(() => {
    if (!projectId) return

    const s = createSocket(projectId)
    setSocket(s)

    s.on('connect', () => {
      setLoading(false)
      console.log('Socket connected');
      // Load file tree once connected
      getFileTree();
    })

    s.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setLoading(false)
      setError('Failed to connect to development server');
    });

    s.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    return () => {
      s.disconnect();
    };
  }, [projectId, getFileTree])

  // Mouse event handlers for resizers
  useEffect(() => {
    const handleMouseMove = (e) => {
      handleTerminalMouseMove(e);
      handleSidebarMouseMove(e);
    };

    const handleMouseUp = () => {
      stopDraggingTerminal();
      stopDraggingSidebar();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Handle file content loading when file is selected
  useEffect(() => {
    if (selectedFile) {
      setCode('')
      setSelectedFileContent('')
      getFileContent()
      setLanguage(getModeFromFileName(selectedFile))
    }
  }, [selectedFile, getFileContent]);

  // Update code when file content is loaded
  useEffect(() => {
    if (selectedFile && selectedFileContent !== null) {
      setCode(selectedFileContent);
    }
  }, [selectedFile, selectedFileContent]);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    // Debounced file refresh handler
    let refreshTimeout;
    const debouncedRefresh = () => {
      clearTimeout(refreshTimeout);
      refreshTimeout = setTimeout(() => {
        if (!fetchingFileTree.current) {
          getFileTree();
        }
      }, 500); // 500ms debounce
    };

    socket.on('file:refresh', debouncedRefresh);

    return () => {
      socket.off('file:refresh', debouncedRefresh);
      clearTimeout(refreshTimeout);
    };
  }, [socket, getFileTree]);

  // Auto-save functionality
  useEffect(() => {
    if (!socket || !selectedFile || !code || isSaved) return;

    const timer = setTimeout(() => {
      socket.emit('file:change', {
        path: '/' + selectedFile,
        content: code,
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, [code, selectedFile, isSaved, socket])

  if (loading) {
    return (
      <div className="spinner-container">
        <div className="spinner" />
        <p className="loading-text">Starting your container...</p>
      </div>
    );
  }

  return (
    <div className="playground-container">
      <div className="navbar">
        <div className="logo">🧠 cloud IDE</div>
        <div className="nav-right">
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              backgroundColor: 'var(--primary)',
              color: 'white',
              border: 'none',
              padding: '8px 14px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500',
            }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>


      {error && (
        <div className="error-banner" style={{
          background: '#ff4444',
          color: 'white',
          padding: '8px 16px',
          margin: '0 0 8px 0',
          borderRadius: '4px',
          fontSize: '14px'
        }}>
          {error}
          <button
            onClick={() => {
              setError(null);
              getFileTree();
            }}
            style={{
              marginLeft: '12px',
              background: 'rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '3px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      )}

      <div className="main-body">
        <div
          className="editor-container"
          style={{ height: `calc(100% - ${terminalHeight}px)` }}
        >
          <div className="files" style={{ width: `${sidebarWidth}px` }}>
            <Tree
              onSelect={(path) => {
                setSelectedFile(path);
                console.log('Selected file:', path);
              }}
              tree={fileTree}
            />
          </div>

          <div className="sidebar-resizer" onMouseDown={startDraggingSidebar}></div>

          <div className="editor">
            {selectedFile && <p className="file-name">{selectedFile.replaceAll('/', ' > ')}</p>}
            {selectedFile && (
              <AceEditor
                mode={language}
                value={code}
                onChange={(e) => setCode(e)}
                width="100%"
                height="100%"
                theme="twilight"
                fontSize={14}
                showPrintMargin={false}
                showGutter={true}
                highlightActiveLine={true}
                setOptions={{
                  enableBasicAutocompletion: true,
                  enableLiveAutocompletion: true,
                  enableSnippets: true,
                  showLineNumbers: true,
                  tabSize: 2,
                }}
              />
            )}
          </div>
        </div>

        <div className="resizer">
          <div className="resizer-handle" onMouseDown={startDraggingTerminal}></div>
        </div>

        <div className="terminal-container" style={{ height: `${terminalHeight}px` }}>
          <Terminal socket={socket} />
        </div>
      </div>
    </div>
  );
}

export default IDE