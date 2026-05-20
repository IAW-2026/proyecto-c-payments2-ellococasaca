"use client";

import React, { useState } from 'react';
import { id } from 'zod/locales';

export default function TestPage() {
  const [item, setItem] = useState('');
  const [amount, setAmount] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus(null);

    try {
      const response = await fetch('/api/charge', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          buyer_id:'user_2pLq...',
          seller_id:'user_2mRt...',
          amount: parseFloat(amount)
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit');
      }

      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        setStatus({ type: 'success', message: 'Successfully submitted!' });
        console.log('Success:', data);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setStatus({ type: 'error', message: 'An error occurred during submission.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-gray-100 p-8 rounded-lg shadow-lg w-full max-w-md flex flex-col gap-4">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center">Payment Details</h2>
        
        <div className="flex flex-col gap-2">
          <label htmlFor="item" className="text-sm font-medium text-gray-700">Item</label>
          <input 
            type="text" 
            id="item" 
            name="item" 
            value={item}
            onChange={(e) => setItem(e.target.value)}
            required
            className="border border-gray-300 bg-white text-gray-900 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter item name"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="amount" className="text-sm font-medium text-gray-700">Amount</label>
          <input 
            type="number" 
            id="amount" 
            name="amount" 
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            className="border border-gray-300 bg-white text-gray-900 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0.00"
            step="0.01"
            min="0"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="quantity" className="text-sm font-medium text-gray-700">Quantity</label>
          <input 
            type="number" 
            id="quantity" 
            name="quantity" 
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
            className="border border-gray-300 bg-white text-gray-900 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="1"
            min="1"
          />
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting}
          className="mt-4 bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Payment'}
        </button>

        {status && (
          <div className={`p-3 rounded-md mt-2 text-sm text-center ${status.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {status.message}
          </div>
        )}
      </form>
    </div>
  );
}
