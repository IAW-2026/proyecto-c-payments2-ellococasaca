'use client';

import { useState } from 'react';

export default function StatusPage() {
  // This state represents the variable quantity of forms you mentioned.
  // You can change the initial array or update it dynamically later.
  const [forms, setForms] = useState([1, 2, 3]);

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">Forms Status</h1>
        
        {/* Responsive grid for the gray squares */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {forms.map((formId) => (
            <div 
              key={formId} 
              className="bg-gray-100 rounded-lg shadow-md p-6 min-h-[300px] flex flex-col items-center justify-center border border-gray-200"
            >
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Form #{formId}</h2>
              <p className="text-gray-500 text-sm mb-4 text-center">
                Placeholder for your form content.
              </p>
              {/* You can inject your different forms here */}
            </div>
          ))}
        </div>

        {/* Buttons to demonstrate variable quantity */}
        <div className="mt-8 flex justify-center space-x-4">
          <button 
            onClick={() => setForms([...forms, forms.length + 1])}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            Add Form
          </button>
          <button 
            onClick={() => setForms(forms.slice(0, -1))}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition-colors"
            disabled={forms.length === 0}
          >
            Remove Form
          </button>
        </div>
      </div>
    </div>
  );
}
