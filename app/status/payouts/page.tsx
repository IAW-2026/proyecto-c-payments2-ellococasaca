import { searchAllPayoutsByUser } from '../../lib/actions';
import { auth } from '@clerk/nextjs/server';

export interface Payout {
  id: string;
  charge_id?: string | null;
  amount?: { toString(): string };
  status?: string | null;
}

export default async function PayoutsListPage() {
  const { userId } = await auth();
  
  if (!userId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8 text-center text-gray-500">
        <div className="text-xl font-bold uppercase tracking-widest text-gray-500">Please sign in to view your payouts.</div>
      </div>
    );
  }

  const response = await searchAllPayoutsByUser(userId);
  const payouts = Array.isArray(response) && !('message' in response) ? response.flat() as Payout[] : [];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <h1 className="text-4xl md:text-5xl text-gray-900 mb-8 text-center font-black uppercase italic tracking-tighter">
          Mis ventas
        </h1>
        
        <div className="flex flex-col space-y-4">
          {payouts.length === 0 ? (
            <div className="text-center text-gray-500 font-bold uppercase tracking-widest py-8 bg-white rounded-2xl border border-gray-100 shadow-sm">
              No se encontraron ventas.
            </div>
          ) : payouts.map((payout, index) => (
            <div 
              key={payout.id} 
              className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg text-gray-900 font-black uppercase italic tracking-tighter">Payout #{payouts.length - index}</h2>
                  <span className={`inline-block px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] ${
                    payout.status?.toLowerCase() === 'paid' ? 'bg-green-50 text-green-600' :
                    payout.status?.toLowerCase() === 'pending' ? 'bg-yellow-50 text-yellow-600' :
                    payout.status?.toLowerCase() === 'rejected' ? 'bg-red-50 text-red-600' :
                    'bg-blue-50 text-blue-600'
                  }`}>
                    {payout.status || 'N/A'}
                  </span>
                </div>
                
                <div className="flex flex-col md:flex-row md:gap-8 text-sm text-gray-600">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-1">ID</span>
                    <span className="font-medium font-mono text-xs" title={payout.id}>{payout.id}</span>
                  </div>
                  <div className="flex flex-col mt-2 md:mt-0">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-1">Charge ID</span>
                    <span className="font-medium font-mono text-xs" title={payout.charge_id || ''}>{payout.charge_id || 'N/A'}</span>
                  </div>
                </div>
              </div>
              
              <div className="text-left md:text-right mt-2 md:mt-0 bg-gray-50 md:bg-transparent p-4 md:p-0 rounded-xl md:rounded-none border md:border-none border-gray-100">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 block mb-1">Amount</span>
                <span className="text-2xl text-green-600 font-black tracking-tighter italic block">
                  ${payout.amount?.toString() || '0.00'}
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
