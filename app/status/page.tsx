'use client';

import { useState, useEffect } from 'react';
import { searchCharges, searchPayoutsByUser } from '../lib/actions';
import { useUser } from '@clerk/nextjs';

export interface Charge {
  id: string;
  order_id: string;
  amount?: { toString(): string };
  status?: string | null;
}

export interface Payout {
  id: string;
  charge_id?: string | null;
  amount?: { toString(): string };
  status?: string | null;
}

export default function StatusPage() {
  const [charges, setCharges] = useState<Charge[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
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

      searchPayoutsByUser(user.id).then(response => {
        if ('message' in response) {
          console.error(response.message);
        } else {
          setPayouts(Array.isArray(response) ? response.flat() : []);
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
        <div className="text-xl font-bold uppercase tracking-widest text-gray-500">Please sign in to view your forms.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-16">
        
        {/* COMPRAS SECTION */}
        <section>
          <h1 className="text-4xl md:text-5xl text-gray-900 mb-8 text-center font-black uppercase italic tracking-tighter">
            Compras
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {charges.length === 0 ? (
              <div className="col-span-full text-center text-gray-500 font-bold uppercase tracking-widest py-8">
                No purchases found.
              </div>
            ) : charges.map((charge, index) => (
              <div 
                key={charge.id} 
                className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-blue-900/5 flex flex-col justify-between"
              >
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-xl text-gray-900 font-black uppercase italic tracking-tighter">Compra #{index + 1}</h2>
                  <span className="inline-block px-3 py-1 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-[0.3em]">
                    {charge.status || 'N/A'}
                  </span>
                </div>
                
                <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 space-y-5 flex-grow">
                  <div className="flex flex-col"><span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-1">ID</span><span className="text-sm font-bold text-gray-900 truncate" title={charge.id}>{charge.id}</span></div>
                  <div className="flex flex-col"><span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-1">Order ID</span><span className="text-sm font-bold text-gray-900 truncate" title={charge.order_id}>{charge.order_id}</span></div>
                  <div className="flex flex-col"><span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-1">Amount</span><span className="text-xl text-blue-600 font-black tracking-tighter italic truncate">${charge.amount?.toString() || '0.00'}</span></div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <hr className="border-gray-200" />

        {/* VENTAS SECTION */}
        <section>
          <h1 className="text-4xl md:text-5xl text-gray-900 mb-8 text-center font-black uppercase italic tracking-tighter">
            Ventas
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {payouts.length === 0 ? (
              <div className="col-span-full text-center text-gray-500 font-bold uppercase tracking-widest py-8">
                No sales found.
              </div>
            ) : payouts.map((payout, index) => (
              <div 
                key={payout.id} 
                className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-green-900/5 flex flex-col justify-between"
              >
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-xl text-gray-900 font-black uppercase italic tracking-tighter">Venta #{index + 1}</h2>
                  <span className="inline-block px-3 py-1 bg-green-50 text-green-600 rounded-xl text-[10px] font-black uppercase tracking-[0.3em]">
                    {payout.status || 'N/A'}
                  </span>
                </div>
                
                <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 space-y-5 flex-grow">
                  <div className="flex flex-col"><span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-1">ID</span><span className="text-sm font-bold text-gray-900 truncate" title={payout.id}>{payout.id}</span></div>
                  <div className="flex flex-col"><span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-1">Charge ID</span><span className="text-sm font-bold text-gray-900 truncate" title={payout.charge_id || ''}>{payout.charge_id || 'N/A'}</span></div>
                  <div className="flex flex-col"><span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-1">Amount</span><span className="text-xl text-green-600 font-black tracking-tighter italic truncate">${payout.amount?.toString() || '0.00'}</span></div>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
