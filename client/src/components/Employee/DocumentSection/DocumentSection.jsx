import React from 'react';
import { FileText, Upload, Trash2, Eye } from 'lucide-react';
import './DocumentSection.css';

const DocumentSection = ({ title, files, section, onUpload, onDelete, onView }) => (
  <div className="document-section">
    <h3 className="text-gray-200 font-medium mb-2">{title}</h3>
    <div className="space-y-2">
      {files.map((file, index) => (
        <div key={index} className="flex items-center justify-between bg-gray-700 p-2 rounded">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <FileText size={16} className="text-gray-400 flex-shrink-0" />
            <span className="text-sm text-gray-200 truncate">
              {typeof file === 'string' ? file.split('/').pop() : file.name}
            </span>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button 
              onClick={() => onView?.(file, section)}
              className="p-1 hover:bg-gray-600 rounded group"
              title="View Document"
            >
              <Eye size={16} className="text-blue-400 group-hover:text-blue-300" />
            </button>
            <button 
              onClick={() => onDelete?.(file)}
              className="p-1 hover:bg-gray-600 rounded group"
              title="Delete Document"
            >
              <Trash2 size={16} className="text-red-400 group-hover:text-red-300" />
            </button>
          </div>
        </div>
      ))}
      <label className="upload-label flex items-center justify-center p-2 border-2 border-dashed border-gray-600 rounded-lg hover:border-gray-500 cursor-pointer group">
        <input
          type="file"
          className="hidden"
          accept=".pdf"
          multiple
          onChange={onUpload}
        />
        <Upload size={16} className="text-gray-400 mr-2 group-hover:text-gray-300" />
        <span className="text-sm text-gray-400 group-hover:text-gray-300">Upload PDF(s)</span>
      </label>
    </div>
  </div>
);

export default DocumentSection;