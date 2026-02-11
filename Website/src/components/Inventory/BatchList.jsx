import React, { useEffect, useState } from 'react';
import { getBatches } from '../../lib/data';
import { Calendar, AlertCircle } from 'lucide-react';

const BatchList = ({ variantId }) => {
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBatches = async () => {
            setLoading(true);
            const data = await getBatches(variantId);
            setBatches(data || []);
            setLoading(false);
        };
        if (variantId) fetchBatches();
    }, [variantId]);

    if (loading) return <div className="p-4 text-xs text-gray-500">Loading batches...</div>;

    if (batches.length === 0) return (
        <div className="p-4 text-xs text-gray-500 bg-gray-50 rounded italic">
            No specific batch details found. (Legacy Stock)
        </div>
    );

    return (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 mt-2">
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Batch Details</h4>
            <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                    <thead className="text-gray-500 font-medium border-b border-gray-200">
                        <tr>
                            <th className="py-2">Batch No</th>
                            <th className="py-2">Expiry</th>
                            <th className="py-2 text-right">Cost Price</th>
                            <th className="py-2 text-right">Stock</th>
                            <th className="py-2 text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {batches.map(batch => {
                            const isExpired = new Date(batch.expiry_date) < new Date();
                            const isNearExpiry = !isExpired && (new Date(batch.expiry_date) - new Date() < 1000 * 60 * 60 * 24 * 90); // 90 days

                            return (
                                <tr key={batch.id}>
                                    <td className="py-2 font-mono text-gray-700">{batch.batch_number}</td>
                                    <td className="py-2 flex items-center gap-1">
                                        <Calendar size={12} className="text-gray-400" />
                                        <span className={`${isExpired ? 'text-red-600 font-bold' : isNearExpiry ? 'text-orange-600' : 'text-gray-700'}`}>
                                            {batch.expiry_date || 'N/A'}
                                        </span>
                                        {isExpired && <span className="px-1 py-0.5 bg-red-100 text-red-700 rounded text-[10px]">Exp</span>}
                                    </td>
                                    <td className="py-2 text-right text-gray-600">₹{batch.cost_price}</td>
                                    <td className="py-2 text-right font-bold text-gray-800">{batch.current_quantity || batch.initial_quantity}</td> {/* fallback if current_quantity logic pending */}
                                    <td className="py-2 text-center">
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${batch.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {batch.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default BatchList;
