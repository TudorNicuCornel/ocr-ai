import React, { useState, useEffect } from 'react';
import { User, Phone, Mail, X, Save } from 'lucide-react';
import DocumentSection from '../DocumentSection/DocumentSection';
import './EmployeeModal.css';

const EmployeeModal = ({ 
  employee, 
  onClose, 
  onDocumentUpload, 
  onDocumentDelete, 
  onDocumentView,
  onUpdateEmployee 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedEmployee, setEditedEmployee] = useState(employee);
  const [documents, setDocuments] = useState(employee.documents || {});
  const collectionId = localStorage.getItem('collectionId');

  useEffect(() => {
    console.log('Employee Data:', employee);
    console.log('Is Admin:', employee.id === 'admin');
    console.log('Documents:', employee.documents);

    // Fetch admin documents if the employee is admin
    if (employee.id === 'admin') {
      fetchAdminDocuments();
    } else {
      setEditedEmployee(employee);
      setDocuments(employee.documents || {});
    }
  }, [employee]);

  const fetchAdminDocuments = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/org/${collectionId}/admin/documents`);
      const data = await response.json();
      if (data.success) {
        setDocuments(data.data);
        setEditedEmployee({
          ...employee,
          documents: data.data
        });
      }
    } catch (error) {
      console.error('Error fetching admin documents:', error);
    }
  };

  const handleSave = () => {
    onUpdateEmployee(editedEmployee);
    setIsEditing(false);
  };

  const handleFileUpload = async (section, e) => {
    const files = Array.from(e.target.files);
    if (files.length) {
      const formData = new FormData();
      formData.append('file', files[0]);
      formData.append('section', section);

      try {
        const response = await fetch(`http://localhost:5000/api/org/${collectionId}/${editedEmployee.id}/upload`, {
          method: 'POST',
          body: formData
        });

        const data = await response.json();
        if (data.success) {
          const updatedDocuments = {
            ...documents,
            [section]: [...(documents[section] || []), data.fileUrl]
          };
          setDocuments(updatedDocuments);
          setEditedEmployee({
            ...editedEmployee,
            documents: updatedDocuments
          });
          onUpdateEmployee({
            ...editedEmployee,
            documents: updatedDocuments
          });
        }
      } catch (error) {
        console.error('Error uploading file:', error);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg w-[80vw] max-w-[1200px] h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
              {editedEmployee.avatar || editedEmployee.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex flex-col gap-2">
              {isEditing ? (
                <input
                  type="text"
                  value={editedEmployee.name}
                  onChange={(e) => setEditedEmployee({...editedEmployee, name: e.target.value})}
                  className="bg-gray-700 text-gray-200 px-3 py-2 rounded text-xl font-bold"
                />
              ) : (
                <h2 className="text-xl font-bold text-gray-200">{editedEmployee.name}</h2>
              )}
              {isEditing ? (
                <input
                  type="text"
                  value={editedEmployee.position}
                  onChange={(e) => setEditedEmployee({...editedEmployee, position: e.target.value})}
                  className="bg-gray-700 text-gray-400 px-3 py-1 rounded"
                />
              ) : (
                <p className="text-gray-400">{editedEmployee.position}</p>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            {isEditing ? (
              <button
                onClick={handleSave}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500"
              >
                <Save size={20} />
                Save Changes
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="text-blue-400 hover:text-blue-300 px-4 py-2 rounded"
              >
                Edit Profile
              </button>
            )}
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-300"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 gap-8">
            {/* Left Column - Contact Information */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-200 mb-4">Contact Information</h3>
                <div className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm text-gray-400">Email</label>
                    {isEditing ? (
                      <input
                        type="email"
                        value={editedEmployee.email}
                        onChange={(e) => setEditedEmployee({...editedEmployee, email: e.target.value})}
                        className="bg-gray-700 text-gray-200 px-3 py-2 rounded"
                      />
                    ) : (
                      <div className="flex items-center gap-2 text-gray-300">
                        <Mail size={16} />
                        <span>{editedEmployee.email}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm text-gray-400">Phone</label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={editedEmployee.phone}
                        onChange={(e) => setEditedEmployee({...editedEmployee, phone: e.target.value})}
                        className="bg-gray-700 text-gray-200 px-3 py-2 rounded"
                      />
                    ) : (
                      <div className="flex items-center gap-2 text-gray-300">
                        <Phone size={16} />
                        <span>{editedEmployee.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {isEditing && editedEmployee.id !== 'admin' && (
                <div className="pt-4 border-t border-gray-700">
                  <label className="flex items-center gap-2 text-gray-300">
                    <input
                      type="checkbox"
                      checked={editedEmployee.isLead}
                      onChange={(e) => setEditedEmployee({...editedEmployee, isLead: e.target.checked})}
                      className="rounded bg-gray-700 border-gray-600"
                    />
                    Department Lead
                  </label>
                </div>
              )}
            </div>

            {/* Right Column - Documents */}
            <div>
              <h3 className="text-lg font-medium text-gray-200 mb-4">Documents</h3>
              <div className="space-y-4">
                <DocumentSection
                  title="CI"
                  files={documents.ci || []}
                  section="ci"
                  onUpload={handleFileUpload}
                  onDelete={onDocumentDelete}
                  onView={onDocumentView}
                />
                <DocumentSection
                  title="Contract de munca"
                  files={documents.contract || []}
                  section="contract"
                  onUpload={handleFileUpload}
                  onDelete={onDocumentDelete}
                  onView={onDocumentView}
                />
                <DocumentSection
                  title="CV"
                  files={documents.cv || []}
                  section="cv"
                  onUpload={handleFileUpload}
                  onDelete={onDocumentDelete}
                  onView={onDocumentView}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeModal;