import {searchAllCharges} from '../lib/actions'


export default async function DataViewer() {
  
  const response = await searchAllCharges();

  // 1. Check if the response is an error object
  if ('message' in response) {
    return <div className="p-4 text-red-500">Error: {response.message}</div>;
  }

  // 2. The error message indicates it returns a 2D array (Type[][]), so we should flatten it
  const charges = Array.isArray(response) ? response.flat() : [];
  
  return (
    <div className="p-4 space-y-8">
      <div>
        <h2 className="text-xl font-bold mb-4">Cargo</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border text-left text-sm text-gray-900">
            <thead className="bg-gray-100 font-medium">
              <tr>
                <th className="py-2 px-4 border">ID</th>
                <th className="py-2 px-4 border">ID Compra</th>
                <th className="py-2 px-4 border">ID Vendedor</th>
                <th className="py-2 px-4 border">Monto</th>
                <th className="py-2 px-4 border">Estado</th>
              </tr>
            </thead>
            <tbody>
              {charges.map(charge => (
                <tr key={charge.id} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border">{charge.id}</td>
                  <td className="py-2 px-4 border">{charge.buyer_id || 'N/A'}</td>
                  <td className="py-2 px-4 border">{charge.amount?.toString()}</td>
                  <td className="py-2 px-4 border">{charge.status || 'N/A'}</td>
                </tr>
              ))}
              {charges.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-2 px-4 border text-center text-gray-500">No se encontraron movimientos.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
