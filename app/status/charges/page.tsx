'use client';

import { useState, useEffect } from 'react';
import { searchAllChargesByUser } from '../../lib/actions';
import { useUser } from '@clerk/nextjs';

export interface Charge {
  id: string;
  order_id: string;
  amount?: { toString(): string };
  status?: string | null;
}

export default function ChargesListPage() {
  const [charges, setCharges] = useState<Charge[]>([]);
  const { isLoaded, user } = useUser();

  useEffect(() => {
    if (isLoaded && user) {
      searchAllChargesByUser(user.id).then(response => {
        if ('message' in response) {
          console.error(response.message);
        } else {
          setCharges(Array.isArray(response) ? response.flat() : []);
        }
      }).catch(console.error);
    }
  }, [isLoaded, user]);
  
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="text-blue-600 text-2xl font-black uppercase italic tracking-tighter animate-pulse">Loading...</div>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8 text-center text-gray-500">
        <div className="text-xl font-bold uppercase tracking-widest text-gray-500">Please sign in to view your charges.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <h1 className="text-4xl md:text-5xl text-gray-900 mb-8 text-center font-black uppercase italic tracking-tighter">
          Mis compras
        </h1>
        
        <div className="flex flex-col space-y-4">
          {charges.length === 0 ? (
            <div className="text-center text-gray-500 font-bold uppercase tracking-widest py-8 bg-white rounded-2xl border border-gray-100 shadow-sm">
              No se encontraron compras.
            </div>
          ) : charges.map((charge, index) => (
            <div 
              key={charge.id} 
              className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg text-gray-900 font-black uppercase italic tracking-tighter">Charge #{charges.length - index}</h2>
                  <span className={`inline-block px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] ${
                    charge.status?.toLowerCase() === 'approved' ? 'bg-green-50 text-green-600' :
                    charge.status?.toLowerCase() === 'pending' ? 'bg-yellow-50 text-yellow-600' :
                    charge.status?.toLowerCase() === 'rejected' ? 'bg-red-50 text-red-600' :
                    'bg-blue-50 text-blue-600'
                  }`}>
                    {charge.status || 'N/A'}
                  </span>
                </div>
                
                <div className="flex flex-col md:flex-row md:gap-8 text-sm text-gray-600">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-1">ID</span>
                    <span className="font-medium font-mono text-xs" title={charge.id}>{charge.id}</span>
                  </div>
                  <div className="flex flex-col mt-2 md:mt-0">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-1">Order ID</span>
                    <span className="font-medium font-mono text-xs" title={charge.order_id}>{charge.order_id}</span>
                  </div>
                </div>
              </div>
              
              <div className="text-left md:text-right mt-2 md:mt-0 bg-gray-50 md:bg-transparent p-4 md:p-0 rounded-xl md:rounded-none border md:border-none border-gray-100">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 block mb-1">Amount</span>
                <span className="text-2xl text-blue-600 font-black tracking-tighter italic block">
                  ${charge.amount?.toString() || '0.00'}
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
