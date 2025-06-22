import React, { useState } from 'react';
import '../styles/Tree.css';
import { FaFolder, FaFolderOpen } from 'react-icons/fa';
import { getFileIcon } from '../utils/getFileIcon';

const FileTreeNode = ({ fileName, nodes, onSelect, path }) => {
  const isDirectory = !!nodes;
  const [expanded, setExpanded] = useState(false);

  const handleClick = (e) => {
    e.stopPropagation();
    if (isDirectory) {
      setExpanded((prev) => !prev);
    } else {
      onSelect(path);
    }
  };

  const Icon = isDirectory
    ? expanded
      ? FaFolderOpen
      : FaFolder
    : getFileIcon(fileName);

  return (
    <div className="tree-node" onClick={handleClick}>
      <div className="node-label">
        <Icon />
        <span>{fileName}</span>
      </div>

      {isDirectory && expanded && (
        <ul className="tree-children">
          {Object.keys(nodes).map((child) => (
            <li key={child}>
              <FileTreeNode
                fileName={child}
                onSelect={onSelect}
                nodes={nodes[child]}
                path={`${path}/${child}`}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const Tree = ({ tree, onSelect }) => {
  return (
    <div className="file-tree-root">
      {Object.entries(tree).map(([name, data]) => (
        <FileTreeNode
          key={name}
          fileName={name}
          nodes={data}
          onSelect={onSelect}
          path={name}
        />
      ))}
    </div>
  );
};

export default Tree;