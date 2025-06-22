import { useCallback, useEffect, useRef, useState } from 'react';
import './App.css';
import './index.css';
import Terminal from './components/Terminal';
import Tree from './components/Tree';
import socket from './socket';
import AceEditor from 'react-ace';

import 'ace-builds/src-noconflict/mode-javascript';
import 'ace-builds/src-noconflict/theme-monokai';
import 'ace-builds/src-noconflict/theme-dracula';
import 'ace-builds/src-noconflict/theme-twilight';
import 'ace-builds/src-noconflict/theme-tomorrow_night';
import 'ace-builds/src-noconflict/theme-github';
import 'ace-builds/src-noconflict/ext-language_tools';

function App() {
  const [fileTree, setFileTree] = useState([]);
  const [selectedFile, setSelectedFile] = useState('');
  const [code, setCode] = useState('');
  const [selectedFileContent, setSelectedFileContent] = useState('');
  const isSaved = code === selectedFileContent;

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
  };

  const stopDraggingTerminal = () => {
    isDraggingTerminal.current = false;
  };

  const handleTerminalMouseMove = (e) => {
    if (!isDraggingTerminal.current) return;
    const dy = e.clientY - startY.current;
    const newHeight = startHeight.current - dy;
    const clampedHeight = Math.min(978, Math.min(newHeight, 500));
    setTerminalHeight(clampedHeight);
  };

  const startDraggingSidebar = (e) => {
    e.preventDefault();
    isDraggingSidebar.current = true;
    startX.current = e.clientX;
    startSidebarWidth.current = sidebarWidth;
  };

  const stopDraggingSidebar = () => {
    isDraggingSidebar.current = false;
  };

  const handleSidebarMouseMove = (e) => {
    if (!isDraggingSidebar.current) return;
    const dx = e.clientX - startX.current;
    const newWidth = startSidebarWidth.current + dx;
    const clampedWidth = Math.max(180, Math.min(newWidth, 600));
    setSidebarWidth(clampedWidth);
  };

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

  const getFileTree = async () => {
    const response = await fetch('http://localhost:9000/files');
    const result = await response.json();
    setFileTree(result.tree);
  };

  const getFileContent = useCallback(async () => {
    if (!selectedFile) return;
    const response = await fetch(`http://localhost:9000/files/content?path=${selectedFile}`);
    const result = await response.json();
    setSelectedFileContent(result.content);
  }, [selectedFile]);

  useEffect(() => {
    getFileTree();
  }, []);

  useEffect(() => {
    setCode('');
  }, [selectedFile, selectedFileContent]);

  useEffect(() => {
    if (selectedFile) getFileContent();
  }, [selectedFile, getFileContent]);

  useEffect(() => {
    if (selectedFile && selectedFileContent) {
      setCode(selectedFileContent);
    }
  }, [selectedFile, selectedFileContent]);

  useEffect(() => {
    socket.on('file:refresh', getFileTree);
    return () => {
      socket.off('file:refresh', getFileTree);
    };
  }, []);

  useEffect(() => {
    if (selectedFile && code && !isSaved) {
      const timer = setTimeout(() => {
        socket.emit('file:change', {
          path: '/' + selectedFile,
          content: code,
        });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [code, selectedFile, isSaved]);

  return (
    <div className="playground-container">
      <div className="project-name">
        Cloud <span>IDE</span>
      </div>

      <div className="main-body">
        <div
          className="editor-container"
          style={{ height: `calc(100% - ${terminalHeight}px)` }}
        >
          <div className="files" style={{ width: `${sidebarWidth}px` }}>
            <Tree
              onSelect={(path) => {
                setSelectedFile(path);
                console.log(path);
              }}
              tree={fileTree}
            />
          </div>

          <div className="sidebar-resizer" onMouseDown={startDraggingSidebar}></div>

          <div className="editor">
            {selectedFile && <p className="file-name">{selectedFile.replaceAll('/', ' > ')}</p>}
            {selectedFile && (
              <AceEditor
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
          <Terminal />
        </div>
      </div>
    </div>
  );
}

export default App;