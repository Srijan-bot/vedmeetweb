import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Search, X } from 'lucide-react';
import { getProducts, getCategories, deleteProduct } from '../../lib/data';
import Button from '../../components/Button';

const ProductManager = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);

    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        const [prodData, catData] = await Promise.all([
            getProducts(),
            getCategories()
        ]);
        setProducts(prodData || []);
        setCategories(catData || []);
        setLoading(false);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            await deleteProduct(id);
            fetchProducts();
        }
    };

    if (loading) return <div>Loading...</div>;

    // Filter Products
    const filteredProducts = products.filter(product => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase().trim();

        // Product Name
        if (product.name?.toLowerCase().includes(query)) return true;

        // Brand
        if (product.brand?.toLowerCase().includes(query)) return true;

        // Category
        const catId = Array.isArray(product.category) ? product.category[0] : product.category;
        const cat = categories.find(c => c.id === catId || c.name === catId);
        if (cat?.name.toLowerCase().includes(query)) return true;
        if (String(catId).toLowerCase().includes(query)) return true;

        // SKU (via variants)
        const variants = product.product_variants || [];
        if (variants.some(v => v.sku?.toLowerCase().includes(query))) return true;

        return false;
    });

    // Logic for Sorting and Pagination
    // 1. Sort Products Alphabetically
    const sortedProducts = [...filteredProducts].sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    // 2. Pagination
    const itemsPerPage = 10;
    const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);

    // Ensure currentPage is valid
    if (currentPage > totalPages && totalPages > 0) setCurrentPage(1);

    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentProducts = sortedProducts.slice(startIndex, startIndex + itemsPerPage);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-sage-900">Products</h1>
                <Link to="/admin/products/new">
                    <Button size="sm" className="flex items-center gap-2">
                        <Plus className="h-4 w-4" /> Add New
                    </Button>
                </Link>
            </div>

            {/* Search Bar */}
            <div className="bg-white p-4 rounded-xl border border-sage-200 shadow-sm mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                    <input
                        type="text"
                        placeholder="Search by product name, SKU, category, or brand..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-sage-50 hover:bg-white text-sage-900 placeholder:text-stone-400 rounded-lg text-sm border border-sage-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-sage-500 transition-colors"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
                            title="Clear search"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-sage-100">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-sage-50 text-sage-900 text-xs uppercase tracking-wider">
                            <tr>
                                <th className="p-4 font-semibold">Product Name</th>
                                <th className="p-4 font-semibold">Category</th>
                                <th className="p-4 font-semibold">Rating</th>
                                <th className="p-4 font-semibold">Total Stock</th>
                                <th className="p-4 font-semibold">Price Range</th>
                                <th className="p-4 font-semibold">Status</th>
                                <th className="p-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-sage-100 text-sm">
                            {currentProducts.map((product) => {
                                // Prepare Variants
                                const variants = product.product_variants || [];
                                // Sort variants by price
                                variants.sort((a, b) => (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0));

                                // Calculate Stats
                                const totalStock = (product.stock_quantity || 0) + variants.reduce((sum, v) => sum + (v.stock_quantity || 0), 0);
                                // Note: Usually product.stock_quantity is independent or sum. Assuming independent or sum not maintained, let's just use variant sum if variants exist. 
                                // Actually data.js addProduct sets stock_quantity on product. Let's use what's there or sum variants.
                                const displayStock = variants.length > 0 ? variants.reduce((sum, v) => sum + (v.stock_quantity || 0), 0) : product.stock_quantity;

                                const prices = variants.map(v => v.price).filter(p => !isNaN(p));
                                if (product.price) prices.push(product.price);
                                const minPrice = Math.min(...prices);
                                const maxPrice = Math.max(...prices);
                                const priceDisplay = prices.length > 0
                                    ? (minPrice === maxPrice ? `₹${minPrice.toFixed(2)}` : `₹${minPrice.toFixed(2)} - ${maxPrice.toFixed(2)}`)
                                    : '-';

                                return (
                                    <React.Fragment key={product.id}>
                                        {/* PARENT ROW */}
                                        <tr className="bg-sage-50/80 hover:bg-sage-100 transition-colors border-l-4 border-l-sage-400">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={product.image || 'https://via.placeholder.com/40'}
                                                        alt={product.name}
                                                        className="w-10 h-10 object-cover rounded-md bg-gray-200"
                                                    />
                                                    <div>
                                                        <div className="font-bold text-sage-900 text-base">{product.name}</div>
                                                        <div className="text-xs text-sage-500">{variants.length} Variants</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 text-stone-600 capitalize">
                                                {(() => {
                                                    const catId = Array.isArray(product.category) ? product.category[0] : product.category;
                                                    const cat = categories.find(c => c.id === catId || c.name === catId);
                                                    return cat ? cat.name : (catId || '-');
                                                })()}
                                            </td>
                                            <td className="p-4 text-stone-600">
                                                {product.rating ? (
                                                    <span className="flex items-center gap-1">
                                                        ⭐ {product.rating.toFixed(1)} <span className="text-xs text-gray-400">({product.reviews || 0})</span>
                                                    </span>
                                                ) : '-'}
                                            </td>
                                            <td className="p-4 font-bold text-sage-800">{displayStock}</td>
                                            <td className="p-4 font-mono text-sage-700">{priceDisplay}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${displayStock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {displayStock > 0 ? 'Active' : 'Out of Stock'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right space-x-2">
                                                <Link to={`/admin/products/edit/${product.id}`}>
                                                    <button className="p-1.5 text-sage-600 hover:bg-sage-100 rounded-md transition-colors">
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(product.id)}
                                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>

                                        {/* CHILD VARIANTS */}
                                        {variants.map((v, idx) => {
                                            const isLast = idx === variants.length - 1;
                                            return (
                                                <tr key={v.id} className={`hover:bg-sage-50 transition-colors group ${!isLast ? 'border-b border-sage-50' : ''}`}>
                                                    <td className="p-4 pl-12 relative">
                                                        {/* Tree Lines */}
                                                        <div className="absolute left-6 top-0 bottom-1/2 w-4 border-l-2 border-sage-200"></div>
                                                        <div className="absolute left-6 top-1/2 w-4 border-t-2 border-sage-200"></div>

                                                        <div className="flex items-center gap-2">
                                                            <span className="w-1.5 h-1.5 bg-sage-300 rounded-full"></span>
                                                            <span className="text-sm font-medium text-sage-700">{v.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-sm text-stone-500 font-mono">{v.sku || '-'}</td>
                                                    <td className="p-4 text-sm text-stone-500">
                                                        {/* Specs: Weight/Dimensions/Volume */}
                                                        {[
                                                            v.weight,
                                                            v.dimensions,
                                                            v.volume,
                                                            v.pieces ? `${v.pieces} pcs` : null
                                                        ].filter(Boolean).join(' | ') || '-'}
                                                    </td>
                                                    <td className="p-4 text-sm text-sage-600">{v.stock_quantity}</td>
                                                    <td className="p-4 text-sm text-sage-700 font-mono">
                                                        ₹{v.price ? v.price.toFixed(2) : '0.00'}
                                                    </td>
                                                    <td className="p-4 text-sm text-stone-400">
                                                        {v.stock_quantity < 10 ? 'Low Stock' : 'In Stock'}
                                                    </td>
                                                    <td className="p-4"></td>
                                                </tr>
                                            );
                                        })}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div className="p-4 border-t border-sage-200 bg-sage-50 flex items-center justify-between text-sm text-stone-500">
                    <div>Showing {products.length > 0 ? startIndex + 1 : 0} to {Math.min(startIndex + itemsPerPage, products.length)} of {products.length} Products</div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1 bg-white hover:bg-sage-100 disabled:opacity-50 border border-sage-200 rounded text-sage-600 transition-colors"
                        >
                            Previous
                        </button>

                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) pageNum = i + 1;
                            else if (currentPage <= 3) pageNum = i + 1;
                            else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                            else pageNum = currentPage - 2 + i;

                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => setCurrentPage(pageNum)}
                                    className={`px-3 py-1 border rounded transition-colors ${currentPage === pageNum
                                        ? 'bg-blue-600 hover:bg-blue-500 border-blue-600 text-white'
                                        : 'bg-white hover:bg-sage-100 border-sage-200 text-sage-600'
                                        }`}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}

                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="px-3 py-1 bg-white hover:bg-sage-100 disabled:opacity-50 border border-sage-200 rounded text-sage-600 transition-colors"
                        >
                            Next
                        </button>
                    </div>
                </div>

            </div>
            {
                products.length === 0 && !loading && (
                    <div className="p-8 text-center text-stone-500 bg-white border border-sage-100 rounded-xl mt-4">
                        No products found.
                    </div>
                )
            }
        </div >
    );
};

export default ProductManager;
