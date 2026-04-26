import React, { useState } from 'react';
import MessageModal from '../../components/common/MessageModal';

/**
 * Example component showing how to use the MessageModal component
 */
const ModalExample = () => {
  const [modal, setModal] = useState({
    isOpen: false,
    type: '',
    title: '',
    message: ''
  });

  const showModal = (type, title, message) => {
    setModal({
      isOpen: true,
      type,
      title,
      message
    });
  };

  const closeModal = () => {
    setModal({
      isOpen: false,
      type: '',
      title: '',
      message: ''
    });
  };

  const handleSuccess = () => {
    showModal('success', 'Success!', 'Operation completed successfully.');
  };

  const handleError = () => {
    showModal('error', 'Error!', 'Something went wrong. Please try again.');
  };

  const handleAutoClose = () => {
    showModal('success', 'Auto Close!', 'This modal will close automatically in 3 seconds.');
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Modal Example</h2>
      
      <div className="space-y-3">
        <button
          onClick={handleSuccess}
          className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition-colors"
        >
          Show Success Modal
        </button>
        
        <button
          onClick={handleError}
          className="w-full bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 transition-colors"
        >
          Show Error Modal
        </button>
        
        <button
          onClick={handleAutoClose}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
        >
          Show Auto-Close Modal
        </button>
      </div>

      {/* Usage Instructions */}
      <div className="mt-6 text-sm text-gray-600">
        <h4 className="font-semibold mb-2">Usage in your components:</h4>
        <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
{`import MessageModal from '../components/common/MessageModal';

const MyComponent = () => {
  const [modal, setModal] = useState({
    isOpen: false,
    type: '',
    title: '',
    message: ''
  });

  const showModal = (type, title, message) => {
    setModal({ isOpen: true, type, title, message });
  };

  const closeModal = () => {
    setModal({ isOpen: false, type: '', title: '', message: '' });
  };

  return (
    <>
      <button onClick={() => showModal('success', 'Success!', 'Operation completed.')}>
        Show Success
      </button>
      
      <MessageModal
        isOpen={modal.isOpen}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onClose={closeModal}
        autoClose={modal.type === 'success'}
        autoCloseDelay={3000}
      />
    </>
  );
};`}
        </pre>
      </div>

      {/* Message Modal */}
      <MessageModal
        isOpen={modal.isOpen}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onClose={closeModal}
        autoClose={modal.type === 'success'}
        autoCloseDelay={3000}
      />
    </div>
  );
};

export default ModalExample;
