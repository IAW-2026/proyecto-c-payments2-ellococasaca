import { searchCharges, searchPayoutsByUser, syncUser } from '../lib/actions';
import { auth } from '@clerk/nextjs/server';
import Link from 'next/link';

export interface Charge {
  id: string;
  amount?: { toString(): string };
  status?: string | null;
}

export interface Payout {
  id: string;
  charge_id?: string | null;
  amount?: { toString(): string };
  status?: string | null;
}

export default async function StatusPage() {
  const { userId } = await auth();
  
  if (!userId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8 text-center text-gray-500">
        <div className="text-xl font-bold uppercase tracking-widest text-gray-500">Por favor, inicie sesión para ver su estado.</div>
      </div>
    );
  }

  await syncUser(userId);

  const [chargesResponse, payoutsResponse] = await Promise.all([
    searchCharges(userId),
    searchPayoutsByUser(userId)
  ]);

  const charges = Array.isArray(chargesResponse) && !('message' in chargesResponse)
    ? chargesResponse.flat() as Charge[]
    : [];

  const payouts = Array.isArray(payoutsResponse) && !('message' in payoutsResponse)
    ? payoutsResponse.flat() as Payout[]
    : [];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-16">
        
        {/* COMPRAS SECTION */}
        <section>
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <h1 className="text-4xl md:text-5xl text-gray-900 text-center font-black uppercase italic tracking-tighter m-0">
              Compras
            </h1>
            <Link 
              href="/status/charges"
              className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 text-sm"
            >
              Ver todas las compras
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {charges.length === 0 ? (
              <div className="col-span-full text-center text-gray-500 font-bold uppercase tracking-widest py-8">
                No se encontraron compras.
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
                  <div className="flex flex-col"><span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-1">Monto</span><span className="text-xl text-blue-600 font-black tracking-tighter italic truncate">${charge.amount?.toString() || '0.00'}</span></div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <hr className="border-gray-200" />

        {/* VENTAS SECTION */}
        <section>
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <h1 className="text-4xl md:text-5xl text-gray-900 text-center font-black uppercase italic tracking-tighter m-0">
              Ventas
            </h1>
            <Link 
              href="/status/payouts"
              className="px-6 py-3 bg-green-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-green-700 transition-colors shadow-lg shadow-green-600/20 text-sm"
            >
              Ver todas las ventas
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {payouts.length === 0 ? (
              <div className="col-span-full text-center text-gray-500 font-bold uppercase tracking-widest py-8">
                No se encontraron ventas.
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
                  <div className="flex flex-col"><span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-1">ID Compra</span><span className="text-sm font-bold text-gray-900 truncate" title={payout.charge_id || ''}>{payout.charge_id || 'N/A'}</span></div>
                  <div className="flex flex-col"><span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-1">Monto</span><span className="text-xl text-green-600 font-black tracking-tighter italic truncate">${payout.amount?.toString() || '0.00'}</span></div>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}