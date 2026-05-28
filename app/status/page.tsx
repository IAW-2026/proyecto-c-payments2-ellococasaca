'use client';

import { useState, useEffect } from 'react';
import { searchCharges } from '../lib/actions';
import { useUser } from '@clerk/nextjs';

export interface Charge {
  id: string;
  order_id: string;
  amount?: { toString(): string };
  status?: string | null;
}

export default function StatusPage() {
  const [charges, setCharges] = useState<Charge[]>([]);
  const { isLoaded, user } = useUser();

  useEffect(() => {
    if (isLoaded && user) {
      searchCharges(user.id).then(response => {
        if ('message' in response) {
          console.error(response.message);
        } else {
          setCharges(Array.isArray(response) ? response.flat() : []);
        }
      }).catch(console.error);
    }
  }, [isLoaded, user]);
  
  if (!isLoaded) return <div className="min-h-screen bg-white p-8 text-center text-gray-500">Loading...</div>;
  if (!user) return <div className="min-h-screen bg-white p-8 text-center text-gray-500">Please sign in to view your forms.</div>;

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">Forms Status</h1>
        
        {/* Responsive grid for the gray squares */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {charges.map((charge, index) => (
            <div 
              key={charge.id} 
              className="bg-gray-100 rounded-lg shadow-md p-6 min-h-[300px] flex flex-col items-center justify-center border border-gray-200 overflow-hidden"
            >
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Form #{index + 1}</h2>
              <div className="text-gray-500 text-sm mb-4 w-full px-4">
                <div className="space-y-2 text-left bg-white p-4 rounded-md shadow-sm border border-gray-200">
                  <p className="truncate" title={charge.id}><strong>ID:</strong> {charge.id}</p>
                  <p className="truncate" title={charge.order_id}><strong>Order ID:</strong> {charge.order_id}</p>
                  <p><strong>Amount:</strong> {charge.amount?.toString()}</p>
                  <p><strong>Status:</strong> {charge.status || 'N/A'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
