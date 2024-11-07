import React, { useState, useRef, useEffect } from 'react';
import Draggable from 'react-draggable';
import Xarrow, { Xwrapper } from 'react-xarrows';
import { 
  Plus, Building2, Brain, Save, Trash2, Edit2, 
  MoveDiagonal, UserPlus, X, AlertCircle, MessageSquare,
  Send, Paperclip, Download
} from 'lucide-react';
import EmployeeCard from '../Employee/EmployeeCard/EmployeeCard';

// ChatInterface Component
const ChatInterface = ({ orgData, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const collectionId = localStorage.getItem('collectionId');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    try {
      setIsLoading(true);
      const newMessage = { role: 'user', content: input };
      setMessages(prev => [...prev, newMessage]);
      setInput('');

      const response = await fetch('http://localhost:5000/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          collectionId,
          context: {
            departments: orgData.departments,
            adminData: orgData.adminData,
            connections: orgData.connections
          }
        })
      });

      const data = await response.json();
      if (data.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-24 right-8 w-96 bg-gray-800 rounded-lg shadow-xl border border-gray-700 flex flex-col max-h-[600px]">
      <div className="flex justify-between items-center p-4 border-b border-gray-700">
        <h3 className="text-gray-200 font-medium">AI Assistant</h3>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-gray-300"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div 
            key={index} 
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 text-gray-200'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your organization..."
            className="flex-1 bg-gray-700 text-gray-200 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSend()}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-500 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white" />
            ) : (
              <Send size={20} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// File Upload Component
const FileUpload = ({ onUpload, accept = ".pdf", multiple = true }) => {
  const handleChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const filePromises = files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve({
            name: file.name,
            type: file.type,
            size: file.size,
            data: reader.result.split(',')[1], // Get base64 data
            uploadedAt: new Date().toISOString()
          });
        };
        reader.readAsDataURL(file);
      });
    });

    const uploadedFiles = await Promise.all(filePromises);
    onUpload(uploadedFiles);
  };

  return (
    <label className="cursor-pointer flex items-center gap-2 text-blue-400 hover:text-blue-300">
      <input
        type="file"
        className="hidden"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
      />
      <Paperclip size={16} />
      <span>Upload Files</span>
    </label>
  );
};

// Toast Component
const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? 'bg-green-600' : 'bg-red-600';

  return (
    <div className={`${bgColor} text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2`}>
      {type === 'error' ? <AlertCircle size={18} /> : null}
      {message}
    </div>
  );
};

// New Employee Dialog Component
const NewEmployeeDialog = ({ onAdd, onClose }) => {
    const [employeeData, setEmployeeData] = useState({
      name: '',
      position: '',
      email: '',
      phone: '',
    });
  
    const handleSubmit = (e) => {
      e.preventDefault();
      if (employeeData.name.trim()) {
        onAdd({
          id: Date.now().toString(),
          ...employeeData,
          isLead: false,
          documents: {
            ci: [],
            contract: [],
            cv: []
          }
        });
        onClose();
      }
    };
  
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-lg p-6 w-96">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-200">Add New Employee</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-300">
              <X size={24} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Name</label>
              <input
                type="text"
                value={employeeData.name}
                onChange={(e) => setEmployeeData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full bg-gray-700 text-gray-200 px-3 py-2 rounded"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Position</label>
              <input
                type="text"
                value={employeeData.position}
                onChange={(e) => setEmployeeData(prev => ({ ...prev, position: e.target.value }))}
                className="w-full bg-gray-700 text-gray-200 px-3 py-2 rounded"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Email</label>
              <input
                type="email"
                value={employeeData.email}
                onChange={(e) => setEmployeeData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full bg-gray-700 text-gray-200 px-3 py-2 rounded"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Phone</label>
              <input
                type="tel"
                value={employeeData.phone}
                onChange={(e) => setEmployeeData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full bg-gray-700 text-gray-200 px-3 py-2 rounded"
              />
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-400 hover:text-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
                disabled={!employeeData.name.trim()}
              >
                Add
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };
  
  // Department Card Component
  const DepartmentCard = ({ 
    department, 
    position,
    onDrag,
    onAddEmployee, 
    onDelete, 
    onEdit,
    onConnectEmployee,
    onUpdateEmployee,
  }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [departmentName, setDepartmentName] = useState(department.name);
    const [showNewEmployeeDialog, setShowNewEmployeeDialog] = useState(false);
    const cardRef = useRef(null);
  
    const handleDrag = (e, data) => {
      onDrag(department.id, { x: data.x, y: data.y });
    };
  
    const handleSaveName = () => {
      onEdit(department.id, departmentName);
      setIsEditing(false);
    };
  
    const handleFileUpload = async (employeeId, section, files) => {
      const employee = department.employees.find(emp => emp.id === employeeId);
      if (employee) {
        const updatedEmployee = {
          ...employee,
          documents: {
            ...employee.documents,
            [section]: [...(employee.documents[section] || []), ...files]
          }
        };
        onUpdateEmployee(department.id, updatedEmployee);
      }
    };
  
    return (
      <Draggable
        position={position}
        onDrag={handleDrag}
        handle=".drag-handle"
      >
        <div 
          ref={cardRef}
          id={`department-${department.id}`}
          className="absolute"
        >
          <div className="bg-gray-800 rounded-lg shadow-lg p-4 w-[400px] border border-gray-700">
            <div className="drag-handle cursor-move flex justify-between items-center mb-3 text-gray-300 hover:text-gray-100">
              {isEditing ? (
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    value={departmentName}
                    onChange={(e) => setDepartmentName(e.target.value)}
                    className="flex-1 p-1 rounded bg-gray-700 text-gray-100 border-gray-600"
                    autoFocus
                    onKeyPress={(e) => e.key === 'Enter' && handleSaveName()}
                  />
                  <button
                    onClick={handleSaveName}
                    className="px-2 bg-blue-600 rounded"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <h3 className="font-bold text-lg">{department.name}</h3>
              )}
              <MoveDiagonal size={18} />
            </div>
  
            <div className="space-y-2 mb-3">
              {department.employees.map((employee) => (
                <EmployeeCard
                  key={employee.id}
                  employee={employee}
                  isLead={employee.isLead}
                  onConnect={onConnectEmployee}
                  onEdit={(updatedEmployee) => onUpdateEmployee(department.id, updatedEmployee)}
                  onFileUpload={(section, files) => handleFileUpload(employee.id, section, files)}
                />
              ))}
            </div>
  
            <div className="flex justify-between mt-3 border-t border-gray-700 pt-3">
              <button
                onClick={() => setShowNewEmployeeDialog(true)}
                className="text-blue-400 hover:text-blue-300 py-1 px-2 rounded text-sm flex items-center gap-1"
              >
                <UserPlus size={14} />
                Add Member
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => onDelete(department.id)}
                  className="text-red-400 hover:text-red-300 p-1 rounded"
                >
                  <Trash2 size={16} />
                </button>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-gray-400 hover:text-gray-300 p-1 rounded"
                >
                  <Edit2 size={16} />
                </button>
              </div>
            </div>
          </div>
  
          {showNewEmployeeDialog && (
            <NewEmployeeDialog
              onAdd={(newEmployee) => {
                onAddEmployee(department.id, newEmployee);
                setShowNewEmployeeDialog(false);
              }}
              onClose={() => setShowNewEmployeeDialog(false)}
            />
          )}
        </div>
      </Draggable>
    );
  };

  // Main OrgChart Component
const OrgChart = () => {
    const [departments, setDepartments] = useState([]);
    const [positions, setPositions] = useState({
      admin: { x: window.innerWidth / 2 - 150, y: 50 }
    });
    const [loading, setLoading] = useState(true);
    const [connections, setConnections] = useState([]);
    const [connectingFrom, setConnectingFrom] = useState(null);
    const [adminData, setAdminData] = useState(null);
    const [toast, setToast] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const collectionId = localStorage.getItem('collectionId');
  
    useEffect(() => {
      loadInitialData();
    }, []);
  
    const loadInitialData = async () => {
      try {
        // Load admin data
        const adminResponse = await fetch(`http://localhost:5000/api/admin/${collectionId}`);
        const adminResult = await adminResponse.json();
        
        if (adminResult.success) {
          setAdminData({
            id: 'admin',
            name: `${adminResult.adminData.firstName} ${adminResult.adminData.lastName}`,
            position: adminResult.adminData.position || 'CEO',
            email: adminResult.userData.email,
            phone: adminResult.adminData.phone,
            documents: adminResult.adminData.documents || {
              ci: [],
              contract: [],
              cv: []
            }
          });
        }
  
        // Load org chart data
        const orgResponse = await fetch(`http://localhost:5000/api/org/${collectionId}`);
        const orgResult = await orgResponse.json();
  
        if (orgResult.success && orgResult.data) {
          setDepartments(orgResult.data.departments || []);
          setConnections(orgResult.data.connections || []);
          setPositions(prev => ({
            ...prev,
            ...(orgResult.data.positions || {})
          }));
        }
      } catch (error) {
        console.error('Error loading data:', error);
        showToast('Failed to load organization data', 'error');
      } finally {
        setLoading(false);
      }
    };
  
    const generateDepartments = async () => {
      try {
        setIsGenerating(true);
        const response = await fetch(`http://localhost:5000/api/admin/${collectionId}`);
        const adminData = await response.json();
  
        if (!adminData.success) {
          throw new Error('Failed to fetch company data');
        }
  
        const { cui, caenCode, denCaen } = adminData.userData.companyData;
  
        const aiResponse = await fetch('http://localhost:5000/api/ai/generate-departments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            cui,
            caenCode,
            denCaen
          })
        });
  
        const result = await aiResponse.json();
        
        if (result.success) {
          const newDepartments = result.departments.map((dept, index) => ({
            ...dept,
            position: {
              x: (window.innerWidth / (result.departments.length + 1)) * (index + 1) - 200,
              y: 300
            }
          }));
  
          setDepartments(prev => [...prev, ...newDepartments]);
          await saveOrgChart([...departments, ...newDepartments], connections, positions, adminData);
          showToast('Departments generated successfully');
        }
      } catch (error) {
        console.error('Error generating departments:', error);
        showToast('Failed to generate departments', 'error');
      } finally {
        setIsGenerating(false);
      }
    };
  
    // Function that needs to be updated to handle document merging
    const handleUpdateEmployee = async (departmentId, updatedEmployee) => {
      if (departmentId === 'admin') {
        const newAdminData = { ...updatedEmployee };
        setAdminData(newAdminData);
        await saveOrgChart(departments, connections, positions, newAdminData);
      } else {
        const newDepartments = departments.map(dept => {
          if (dept.id === departmentId) {
            const employees = dept.employees.map(emp => {
              if (emp.id === updatedEmployee.id) {
                return {
                  ...emp,
                  ...updatedEmployee,
                  documents: {
                    ci: mergeDocuments(emp.documents.ci, updatedEmployee.documents.ci),
                    contract: mergeDocuments(emp.documents.contract, updatedEmployee.documents.contract),
                    cv: mergeDocuments(emp.documents.cv, updatedEmployee.documents.cv)
                  }
                };
              }
              return {
                ...emp,
                isLead: updatedEmployee.isLead && emp.id !== updatedEmployee.id ? false : emp.isLead
              };
            });

            return { ...dept, employees };
          }
          return dept;
        });

        setDepartments(newDepartments);
        await saveOrgChart(newDepartments, connections, positions, adminData);
      }
    };

    // Helper function to merge documents without duplicates
    const mergeDocuments = (existingDocs = [], newDocs = []) => {
      const existingPaths = existingDocs.map(doc => (typeof doc === 'string' ? doc : doc.path));
      const newUniqueDocs = newDocs.filter(doc => {
        const path = typeof doc === 'string' ? doc : doc.path;
        return !existingPaths.includes(path);
      });
      return [...existingDocs, ...newUniqueDocs];
    };

    // Update saveOrgChart to use mergeDocuments
    const saveOrgChart = async (deps = departments, conns = connections, pos = positions, admin = adminData) => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:5000/api/org/${collectionId}/save`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            departments: deps,
            connections: conns,
            positions: pos,
            adminData: admin
          })
        });

        if (response.ok) {
          showToast('Organization chart saved successfully');
        } else {
          showToast('Failed to save organization chart', 'error');
        }
      } catch (error) {
        console.error('Error saving org chart:', error);
        showToast('Failed to save organization chart', 'error');
      } finally {
        setLoading(false);
      }
    };
  
    const handleAddEmployee = async (departmentId, newEmployee) => {
      const newDepartments = departments.map(dept => {
        if (dept.id === departmentId) {
          return {
            ...dept,
            employees: [...dept.employees, newEmployee]
          };
        }
        return dept;
      });
      
      setDepartments(newDepartments);
      await saveOrgChart(newDepartments, connections, positions, adminData);
    };
  
    const handleDeleteConnection = async (connectionId) => {
      const newConnections = connections.filter(conn => conn.id !== connectionId);
      setConnections(newConnections);
      await saveOrgChart(departments, newConnections, positions, adminData);
    };
  
    const handleConnectEmployee = async (employeeId) => {
      if (!connectingFrom) {
        setConnectingFrom(employeeId);
      } else {
        if (connectingFrom !== employeeId) {
          const newConnection = { 
            id: Date.now().toString(),
            from: connectingFrom, 
            to: employeeId 
          };
          const newConnections = [...connections, newConnection];
          setConnections(newConnections);
          await saveOrgChart(departments, newConnections, positions, adminData);
        }
        setConnectingFrom(null);
      }
    };
  
    const handleDrag = (id, newPosition) => {
      setPositions(prev => ({
        ...prev,
        [id]: newPosition
      }));
    };
  
    const handleDragStop = async () => {
      await saveOrgChart(departments, connections, positions, adminData);
    };
  
    const addDepartment = async () => {
      const newDept = {
        id: Date.now().toString(),
        name: 'New Department',
        employees: [],
        position: { x: 400, y: 300 }
      };
      const newDepartments = [...departments, newDept];
      setDepartments(newDepartments);
      await saveOrgChart(newDepartments, connections, positions, adminData);
    };
  
    const showToast = (message, type = 'success') => {
      setToast({ message, type });
    };
  
    if (loading && !adminData) {
      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
        </div>
      );
    }
  
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100">
        <div className="fixed top-0 left-0 right-0 bg-gray-800 p-4 shadow-lg z-10">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <h1 className="text-2xl font-bold">Organization Chart</h1>
            <div className="flex gap-4">
              <button 
                onClick={generateDepartments}
                className="flex items-center gap-2 bg-purple-700 hover:bg-purple-600 text-white px-4 py-2 rounded-lg"
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white" />
                ) : (
                  <Brain size={20} />
                )}
                {isGenerating ? 'Generating...' : 'Generate with AI'}
              </button>
              <button 
                onClick={() => saveOrgChart()}
                className="flex items-center gap-2 bg-green-700 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
                disabled={loading}
              >
                <Save size={20} />
                Save Chart
              </button>
            </div>
          </div>
        </div>
  
        <div className="relative w-full h-screen overflow-auto pt-20 bg-gray-900">
          <Xwrapper>
            {adminData && (
              <Draggable
                position={positions.admin}
                onDrag={(e, data) => handleDrag('admin', { x: data.x, y: data.y })}
                onStop={handleDragStop}
              >
                <div 
                  id="admin-card"
                  className="relative"
                  style={{ width: '300px' }}
                >
                  <EmployeeCard
                    employee={adminData}
                    onConnect={handleConnectEmployee}
                    className="cursor-move"
                    isCEO={true}
                    onEdit={(updatedEmployee) => handleUpdateEmployee('admin', updatedEmployee)}
                  />
                </div>
              </Draggable>
            )}
  
            {departments.map(dept => (
              <React.Fragment key={dept.id}>
                <DepartmentCard
                  department={dept}
                  position={positions[dept.id] || dept.position}
                  onDrag={handleDrag}
                  onAddEmployee={handleAddEmployee}
                  onDelete={async (deptId) => {
                    const newDepartments = departments.filter(d => d.id !== deptId);
                    const deptEmployeeIds = dept.employees.map(e => e.id);
                    const newConnections = connections.filter(conn => 
                      !deptEmployeeIds.includes(conn.from) && !deptEmployeeIds.includes(conn.to)
                    );
                    setDepartments(newDepartments);
                    setConnections(newConnections);
                    await saveOrgChart(newDepartments, newConnections, positions, adminData);
                  }}
                  onEdit={async (deptId, newName) => {
                    const newDepartments = departments.map(d => {
                      if (d.id === deptId) {
                        return { ...d, name: newName };
                      }
                      return d;
                    });
                    setDepartments(newDepartments);
                    await saveOrgChart(newDepartments, connections, positions, adminData);
                  }}
                  onConnectEmployee={handleConnectEmployee}
                  onUpdateEmployee={handleUpdateEmployee}
                />
                
                <Xarrow
                  start="admin-card"
                  end={`department-${dept.id}`}
                  color="#4B5563"
                  strokeWidth={2}
                  path="smooth"
                  startAnchor={{
                    position: "bottom",
                    offset: { x: -50, y: 0 }
                  }}
                  endAnchor={{
                    position: "top",
                    offset: { x: 0, y: 0 }
                  }}
                  curveness={0.8}
                />
              </React.Fragment>
            ))}
  
            {connections.map((connection) => (
              <div key={connection.id} className="group">
                <Xarrow
                  start={`employee-${connection.from}`}
                  end={`employee-${connection.to}`}
                  color="#EAB308"
                  strokeWidth={2}
                  path="smooth"
                  labels={{
                    middle: (
                      <button
                        onClick={() => handleDeleteConnection(connection.id)}
                        className="hidden group-hover:flex bg-red-500 text-white p-1 rounded-full"
                        title="Delete Connection"
                      >
                        <X size={12} />
                      </button>
                    )
                  }}
                />
              </div>
            ))}
          </Xwrapper>
  
          <button 
            onClick={addDepartment}
            className="fixed bottom-8 right-8 flex items-center gap-2 bg-blue-700 hover:bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg"
          >
            <Building2 size={20} />
            Add Department
          </button>
  
          <button 
            onClick={() => setShowChat(true)}
            className="fixed bottom-8 right-32 flex items-center gap-2 bg-purple-700 hover:bg-purple-600 text-white p-3 rounded-lg shadow-lg"
          >
            <MessageSquare size={20} />
          </button>
  
          {showChat && (
            <ChatInterface 
              onClose={() => setShowChat(false)} 
              orgData={{ departments, adminData, connections }}
            />
          )}
  
          {connectingFrom && (
            <div className="fixed bottom-8 left-8 bg-yellow-600 text-white px-4 py-2 rounded-lg shadow-lg">
              Click on another employee to create a connection
            </div>
          )}
  
          {toast && (
            <div className="fixed bottom-4 right-4">
              <Toast
                message={toast.message}
                type={toast.type}
                onClose={() => setToast(null)}
              />
            </div>
          )}
  
          {loading && (
            <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  export default OrgChart;

