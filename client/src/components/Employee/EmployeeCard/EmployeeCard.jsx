import React, { useState, useEffect } from 'react';
import { Mail, FileText, Edit2, Link } from 'lucide-react';
import EmployeeModal from '../EmployeeModal/EmployeeModal';
import './EmployeeCard.css';

const EmployeeCard = ({ 
  employee, 
  onEdit, 
  isLead = false, 
  onConnect,
  isCEO = false,
  className = "",
  draggableProps = {}
}) => {
  const [showModal, setShowModal] = useState(false);
  const [adminDocumentCount, setAdminDocumentCount] = useState(0);

  useEffect(() => {
    if (employee.id === 'admin') {
      fetchAdminDocumentCount();
    }
  }, [employee]);

  const fetchAdminDocumentCount = async () => {
    const collectionId = localStorage.getItem('collectionId');
    try {
      const response = await fetch(`http://localhost:5000/api/org/${collectionId}/admin/documents`);
      const data = await response.json();
      if (data.success) {
        const documentCount = Object.values(data.data || {}).flat().length;
        setAdminDocumentCount(documentCount);
      }
    } catch (error) {
      console.error('Error fetching admin documents:', error);
    }
  };

  const handleDocumentUpload = async (section, e) => {
    const files = Array.from(e.target.files);
    if (files.length) {
      const collectionId = localStorage.getItem('collectionId');
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });

      try {
        const response = await fetch(`/api/org/${collectionId}/${employee.id}/upload`, {
          method: 'POST',
          body: formData
        });
        
        const data = await response.json();
        if (data.success) {
          const updatedEmployee = {
            ...employee,
            documents: {
              ...employee.documents,
              [section]: [
                ...(employee.documents[section] || []),
                ...data.files
              ]
            }
          };
          onEdit(updatedEmployee);
          if (employee.id === 'admin') {
            fetchAdminDocumentCount(); // Update document count after upload
          }
        }
      } catch (error) {
        console.error('Error uploading files:', error);
      }
    }
  };

  const handleDocumentDelete = (section, file) => {
    const updatedDocs = employee.documents[section].filter(
      f => f.name !== file.name
    );
    
    const updatedEmployee = {
      ...employee,
      documents: {
        ...employee.documents,
        [section]: updatedDocs
      }
    };
    onEdit(updatedEmployee);
    if (employee.id === 'admin') {
      fetchAdminDocumentCount(); // Update document count after delete
    }
  };

  const handleDocumentView = async (file, section) => {
    if (typeof file === 'string') {
      // If the file is a URL, open it directly
      try {
        const userId = employee.id;
        const filePath = `${userId}/${section}/${file}`; // Construct the path dynamically
        const response = await fetch(`http://localhost:5000/api/org/signed-url?fileName=${encodeURIComponent(filePath)}`);
        const data = await response.json();
        console.log('Response Data:', data); // Log the entire response data
        if (data.success) {
          console.log('Generated Signed URL:', data.url); // Print the signed URL in the console
          window.open(data.url, '_blank');
        } else {
          console.error('Failed to get signed URL:', data.message);
        }
      } catch (error) {
        console.error('Error fetching signed URL:', error);
      }
    } else {
      // If the file is Base64 data, create a blob and open it
      const byteCharacters = atob(file.data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: file.type });
  
      // Create a URL for the blob
      const fileUrl = URL.createObjectURL(blob);
      console.log('Generated Blob URL:', fileUrl); // Print the blob URL in the console
      window.open(fileUrl, '_blank');
  
      // Clean up the URL after the window opens
      setTimeout(() => URL.revokeObjectURL(fileUrl), 1000);
    }
  };;

  const nameColor = isLead ? "text-yellow-400" : "text-gray-100";
  const cardWidth = isCEO ? "w-[300px]" : "w-full";

  return (
    <>
      <div 
        id={`employee-${employee.id}`}
        className={`employee-card group ${cardWidth} ${className}`}
        {...draggableProps}
      >
        <div className="flex items-center gap-4">
          <div className="employee-avatar">
            {employee.avatar || employee.name.split(' ').map(n => n[0]).join('')}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <h3 className={`font-medium ${nameColor} truncate`}>{employee.name}</h3>
                <p className="text-sm text-gray-400 truncate">{employee.position}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                {onConnect && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onConnect(employee.id);
                    }}
                    className="p-1 hover:bg-gray-700 rounded"
                  >
                    <Link size={14} className="text-yellow-400" />
                  </button>
                )}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowModal(true);
                  }}
                  className="edit-button"
                >
                  <Edit2 size={14} className="text-gray-400" />
                </button>
              </div>
            </div>
            
            <div className="mt-2 flex items-center gap-3 text-sm text-gray-500">
              <div className="flex items-center gap-1 min-w-0">
                <Mail size={14} className="flex-shrink-0" />
                <span className="hidden group-hover:inline truncate">{employee.email}</span>
              </div>
              <div className="flex items-center gap-1">
                <FileText size={14} className="flex-shrink-0" />
                <span className="hidden group-hover:inline">
                  {employee.id === 'admin' ? adminDocumentCount : Object.values(employee.documents || {}).flat().length} docs
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <EmployeeModal
          employee={employee}
          onClose={() => setShowModal(false)}
          onDocumentUpload={handleDocumentUpload}
          onDocumentDelete={handleDocumentDelete}
          onDocumentView={handleDocumentView}
          onUpdateEmployee={onEdit}
        />
      )}
    </>
  );
};

export default EmployeeCard;