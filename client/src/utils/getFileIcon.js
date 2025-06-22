import {
  FaFileCode,
  FaFileAlt,
  FaFileCsv,
  FaFilePdf,
  FaFileImage,
  FaFileWord,
  FaFileExcel,
  FaFileArchive,
  FaFile,
} from 'react-icons/fa';


export const getFileIcon = (filename) => {
  const ext = filename.split('.').pop().toLowerCase();

  const iconMap = {
    js: FaFileCode,
    jsx: FaFileCode,
    ts: FaFileCode,
    py: FaFileCode,
    java: FaFileCode,
    cpp: FaFileCode,
    c: FaFileCode,
    tsx: FaFileCode,
    json: FaFileCode,
    html: FaFileCode,
    css: FaFileCode,
    txt: FaFileAlt,
    md: FaFileAlt,
    csv: FaFileCsv,
    pdf: FaFilePdf,
    png: FaFileImage,
    jpg: FaFileImage,
    jpeg: FaFileImage,
    gif: FaFileImage,
    doc: FaFileWord,
    docx: FaFileWord,
    xls: FaFileExcel,
    xlsx: FaFileExcel,
    zip: FaFileArchive,
    rar: FaFileArchive,
  };

  return iconMap[ext] || FaFile;
};