import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getProduct, addProduct, updateProduct, getCategories, getConcerns, getBrands, uploadFile, getVariants, addVariant, updateVariant } from '../../lib/data';
import { supabase } from '../../lib/supabase';
import { generateProductContent } from '../../lib/gemini';
import { Sparkles, Trash2, X } from 'lucide-react';
import Button from '../../components/Button';
import MultiSelect from '../../components/MultiSelect';

import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const ProductForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = !!id;

    const [categories, setCategories] = useState([]);
    const [concerns, setConcerns] = useState([]);
    const [brands, setBrands] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        category: [], // Now an array
        concern: [],  // Now an array
        image: '',
        brand: '',
        stock_quantity: '',
        stock_status: 'In Stock',
        features: '',
        ingredients: '',
        benefits: '',
        usage: '',
        discount_percentage: 0,
        disc_price: null,
        meta_keywords: '',
        specifications: '', // New field
        images: [],
        seo_title: '',
        meta_description: '',
        short_description: ''
    });
    const [variants, setVariants] = useState([]);
    const [hasVariants, setHasVariants] = useState(false);
    const [mainImageFile, setMainImageFile] = useState(null);
    const [additionalImageFiles, setAdditionalImageFiles] = useState({}); // Keyed by index
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);

    const [role, setRole] = useState(null);

    const isSeoWriter = role === 'seo_writer';

    useEffect(() => {
        const getRole = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', session.user.id)
                    .single();
                setRole(profile?.role || 'user');
            }
        };
        getRole();
    }, []);

    const handleAIGenerate = async () => {
        if (!formData.name) {
            alert("Please enter a Product Name first.");
            return;
        }
        setGenerating(true);
        try {
            // Join names for context
            const catNames = categories.filter(c => formData.category.includes(c.id)).map(c => c.name).join(', ');
            const conNames = concerns.filter(c => formData.concern.includes(c.id)).map(c => c.name).join(', ');

            const content = await generateProductContent({
                name: formData.name,
                categoryName: catNames,
                concernName: conNames
            });

            setFormData(prev => ({
                ...prev,
                description: content.description || prev.description,
                features: content.features || prev.features,
                ingredients: content.ingredients || prev.ingredients,
                benefits: content.benefits || prev.benefits,
                usage: content.usage || prev.usage
            }));
        } catch (error) {
            console.error("Gemini Error:", error);
            alert(`Failed to generate content: ${error.message}`);
        } finally {
            setGenerating(false);
        }
    };

    useEffect(() => {
        const loadMetadata = async () => {
            const cats = await getCategories();
            setCategories(cats);
            const cons = await getConcerns();
            setConcerns(cons);
            const brs = await getBrands();
            setBrands(brs);
        };
        loadMetadata();

        if (isEditMode) {
            fetchProduct();
            fetchVariants();
        }
    }, [id]);

    const fetchVariants = async () => {
        const vData = await getVariants(id);
        if (vData && vData.length > 0) {
            setVariants(vData);
            setHasVariants(true);
        }
    };

    const fetchProduct = async () => {
        const data = await getProduct(id);
        if (data) {
            // Ensure array fallbacks for existing string data during migration transition
            const processedData = { ...data };
            // Ensure images is an array
            if (processedData.images && !Array.isArray(processedData.images)) {
                processedData.images = [];
            } else if (!processedData.images) {
                processedData.images = [];
            }

            setFormData({
                ...processedData,
                category: Array.isArray(processedData.category) ? processedData.category : (processedData.category ? [processedData.category] : []),
                concern: Array.isArray(processedData.concern) ? processedData.concern : (processedData.concern ? [processedData.concern] : [])
            });
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleMultiChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const removeDiscount = () => {
        if (confirm("Are you sure you want to remove the discount?")) {
            setFormData(prev => ({ ...prev, discount_percentage: 0, disc_price: null }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Clean payload
            const payload = {
                ...formData,
                price: parseFloat(formData.price),
                stock_quantity: parseInt(formData.stock_quantity || 0),
                discount_percentage: parseInt(formData.discount_percentage || 0),
                // Filter out empty image URLs from the additional images array
                images: formData.images.filter(url => url.trim() !== '')
            };

            // 1. Upload Main Image if changed/new
            if (mainImageFile) {
                const fileName = `${Date.now()}_${mainImageFile.name.replace(/\s+/g, '-')}`;
                try {
                    const publicUrl = await uploadFile(mainImageFile, 'products', fileName);
                    payload.image = publicUrl;
                } catch (uploadError) {
                    console.error("Main image upload failed:", uploadError);
                    alert("Failed to upload main image. Please try again.");
                    setLoading(false);
                    return;
                }
            }

            // 2. Upload Additional Images if changed/new
            // We need to resolve all promises
            const newImages = [...payload.images];

            // Handle existing image slots that have new files
            const uploadPromises = Object.entries(additionalImageFiles).map(async ([index, file]) => {
                const fileName = `${Date.now()}_more_${index}_${file.name.replace(/\s+/g, '-')}`;
                try {
                    const publicUrl = await uploadFile(file, 'products', fileName);
                    // If the index exists in the array, replace it. If it's a new add, append via logic below?
                    // Actually, the formData.images has placeholders or old callbacks.
                    // The easiest way is to trust the index mapping from the UI.
                    if (index < newImages.length) {
                        newImages[index] = publicUrl;
                    } else {
                        // This case happens if we added a new slot and immediately uploaded
                        // But wait, the UI logic for adding slots pushes an empty string to formData.images
                        // So the index *should* exist.
                        newImages[parseInt(index)] = publicUrl;
                    }
                } catch (err) {
                    console.error(`Image ${index} upload failed:`, err);
                    throw err; // Fail whole op?
                }
            });

            await Promise.all(uploadPromises);
            payload.images = newImages.filter(img => img && img.trim() !== '');

            let productId = id;
            if (isEditMode) {
                await updateProduct(id, payload);
            } else {
                const newProduct = await addProduct(payload);
                if (newProduct && newProduct[0]) {
                    productId = newProduct[0].id;
                }
            }

            // Handle Variants
            if (hasVariants) {
                for (const variant of variants) {
                    const variantPayload = {
                        ...variant,
                        product_id: productId,
                        price: parseFloat(variant.price || 0),
                        cost_price: parseFloat(variant.cost_price || 0),
                        mrp: parseFloat(variant.mrp || 0),
                        gst_rate: parseFloat(variant.gst_rate || 0),
                    };

                    if (variant.id && variant.id.includes('-')) {
                        // It's a temp ID we generated or real ID? 
                        // Existing IDs from DB are UUIDs. 
                        // Temp IDs might be 'temp-123'
                        if (variant.id.startsWith('temp-')) {
                            // Insert
                            const { id, ...insertData } = variantPayload; // remove temp id
                            await addVariant(insertData);
                        } else {
                            // Update
                            await updateVariant(variant.id, variantPayload);
                        }
                    } else if (!variant.id) {
                        await addVariant(variantPayload);
                    } else {
                        // It is a real UUID, update it
                        await updateVariant(variant.id, variantPayload);
                    }
                }
            }

            navigate('/admin/products');
        } catch (error) {
            console.error("Error saving product:", error);
            alert("Failed to save product");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
            <h1 className="text-3xl font-serif font-bold text-sage-900 mb-8">
                {isEditMode ? 'Edit Product' : 'Add New Product'}
            </h1>

            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-sm border border-sage-100 space-y-6">
                <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Product Name</label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="flex-1 px-3 py-2 border border-sage-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-500 disabled:bg-gray-100"
                            required
                        />
                        <button
                            type="button"
                            onClick={handleAIGenerate}
                            disabled={generating || isSeoWriter}
                            className="bg-purple-100 text-purple-700 px-4 py-2 rounded-md font-medium hover:bg-purple-200 transition-colors flex items-center gap-2 disabled:opacity-50"
                            title="Auto-fill details with AI"
                        >
                            <Sparkles className="w-4 h-4" />
                            {generating ? 'Generating...' : 'Auto-Fill with AI'}
                        </button>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Description</label>
                    <div className="bg-white">
                        <ReactQuill
                            theme="snow"
                            value={formData.description}
                            onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
                            className="h-64 mb-12"
                            modules={{
                                toolbar: [
                                    [{ 'header': [1, 2, 3, false] }],
                                    ['bold', 'italic', 'underline', 'strike'],
                                    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                                    ['clean']
                                ],
                            }}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">Price (Rs.)</label>
                        <input
                            type="number"
                            name="price"
                            value={formData.price}
                            disabled={true}
                            placeholder="Set in Inventory"
                            title="Manage Price in Inventory"
                            className="w-full px-3 py-2 border border-sage-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-500 disabled:bg-gray-100 disabled:text-gray-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">Categories</label>
                        <div className={isSeoWriter ? "opacity-50 pointer-events-none" : ""}>
                            <MultiSelect
                                options={categories}
                                value={formData.category}
                                onChange={(val) => handleMultiChange('category', val)}
                                placeholder="Select Categories"
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">Brand</label>
                        <select
                            name="brand"
                            value={formData.brand || ''}
                            onChange={handleChange}
                            disabled={isSeoWriter}
                            className="w-full px-3 py-2 border border-sage-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-500 disabled:bg-gray-100 disabled:text-gray-500"
                            required
                        >
                            <option value="">Select Brand</option>
                            {brands.map(b => (
                                <option key={b.id} value={b.name}>{b.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">Health Concerns</label>
                        <div className={isSeoWriter ? "opacity-50 pointer-events-none" : ""}>
                            <MultiSelect
                                options={concerns}
                                value={formData.concern}
                                onChange={(val) => handleMultiChange('concern', val)}
                                placeholder="Select Concerns"
                            />
                        </div>
                    </div>
                </div>

                {/* Discount Section */}
                {isEditMode && formData.discount_percentage > 0 && (
                    <div className="bg-orange-50 p-4 rounded-md border border-orange-200 flex items-center justify-between">
                        <div>
                            <span className="text-sm font-bold text-orange-800">Active Discount: {formData.discount_percentage}% OFF</span>
                            <p className="text-xs text-orange-600">Sale Price: Rs. {formData.disc_price}</p>
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={removeDiscount} className="text-red-600 border-red-200 hover:bg-red-50">
                            <Trash2 size={14} className="mr-1" />
                            Remove Discount
                        </Button>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">Stock Status</label>
                        <select
                            name="stock_status"
                            value={formData.stock_status || 'In Stock'}
                            disabled={true}
                            className="w-full px-3 py-2 border border-sage-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-500 disabled:bg-gray-100 disabled:text-gray-500"
                        >
                            <option value="In Stock">In Stock</option>
                            <option value="Low Stock">Low Stock</option>
                            <option value="Out of Stock">Out of Stock</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">Stock Quantity</label>
                        <input
                            type="number"
                            name="stock_quantity"
                            value={formData.stock_quantity}
                            disabled={true}
                            placeholder="Set in Inventory"
                            title="Manage Stock in Inventory"
                            className="w-full px-3 py-2 border border-sage-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-500 disabled:bg-gray-100 disabled:text-gray-500"
                            required
                        />
                    </div>
                </div>

                {/* Variants Section */}
                <div className="border-t border-sage-100 pt-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-serif font-bold text-sage-900">Product Variants</h3>
                            <p className="text-sm text-stone-500">Enable this if the product has multiple options (e.g., Sizes, Colors).</p>
                        </div>
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="hasVariants"
                                checked={hasVariants}
                                onChange={(e) => setHasVariants(e.target.checked)}
                                className="mr-2 h-5 w-5 text-saffron-600 focus:ring-saffron-500 border-gray-300 rounded"
                            />
                            <label htmlFor="hasVariants" className="font-medium text-sage-900">Enable Variants</label>
                        </div>
                    </div>

                    {hasVariants && (
                        <div className="space-y-4 bg-sage-50 p-4 rounded-lg">
                            {variants.map((variant, index) => (
                                <div key={variant.id || index} className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white p-3 rounded shadow-sm border border-gray-100 relative">
                                    <div>
                                        <label className="text-xs font-medium text-gray-500">Variant Name (e.g. 100g)</label>
                                        <input
                                            type="text"
                                            value={variant.name}
                                            onChange={(e) => {
                                                const newV = [...variants];
                                                newV[index].name = e.target.value;
                                                setVariants(newV);
                                            }}
                                            placeholder="Size / Color"
                                            className="w-full text-sm border-gray-200 rounded p-1"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-500">SKU</label>
                                        <input
                                            type="text"
                                            value={variant.sku}
                                            onChange={(e) => {
                                                const newV = [...variants];
                                                newV[index].sku = e.target.value;
                                                setVariants(newV);
                                            }}
                                            placeholder="SKU-123"
                                            className="w-full text-sm border-gray-200 rounded p-1"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-500">Price</label>
                                        <input
                                            type="number"
                                            value={variant.price}
                                            disabled={true}
                                            placeholder="Set in Inventory"
                                            className="w-full text-sm border-gray-200 rounded p-1 bg-gray-50 text-gray-400"
                                            title="Manage Price in Inventory"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-500">Stock</label>
                                        <input
                                            type="number"
                                            value={variant.stock_quantity}
                                            disabled={true}
                                            placeholder="Use Inventory"
                                            className="w-full text-sm border-gray-200 rounded p-1 bg-gray-50 text-gray-400"
                                            title="Manage stock specifically in Inventory page"
                                        />
                                    </div>

                                    {/* Accounting / GST Extras */}
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="text-xs font-medium text-gray-500">Cost Price</label>
                                        <input
                                            type="number"
                                            value={variant.cost_price}
                                            disabled={true}
                                            className="w-full text-sm border-gray-200 rounded p-1 bg-gray-50 text-gray-400"
                                            title="Manage Cost in Inventory"
                                        />
                                    </div>
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="text-xs font-medium text-gray-500">GST %</label>
                                        <select
                                            value={variant.gst_rate}
                                            disabled={true}
                                            className="w-full text-sm border-gray-200 rounded p-1 bg-gray-50 text-gray-400"
                                            title="Manage GST in Inventory"
                                        >
                                            <option value="0">0%</option>
                                            <option value="5">5%</option>
                                            <option value="12">12%</option>
                                            <option value="18">18%</option>
                                            <option value="28">28%</option>
                                        </select>
                                    </div>
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="text-xs font-medium text-gray-500">HSN Code</label>
                                        <input
                                            type="text"
                                            value={variant.hsn_code || ''}
                                            disabled={true}
                                            placeholder="HSN"
                                            className="w-full text-sm border-gray-200 rounded p-1 bg-gray-50 text-gray-400"
                                            title="Manage HSN in Inventory"
                                        />
                                    </div>
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="text-xs font-medium text-gray-500">Min Stock (Reorder Level)</label>
                                        <input
                                            type="number"
                                            value={variant.min_stock_level || 10}
                                            disabled={true}
                                            className="w-full text-sm border-gray-200 rounded p-1 bg-gray-50 text-gray-400"
                                            title="Manage Min Stock in Inventory"
                                        />
                                    </div>
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="text-xs font-medium text-gray-500">Reorder Qty</label>
                                        <input
                                            type="number"
                                            value={variant.reorder_quantity || 50}
                                            disabled={true}
                                            className="w-full text-sm border-gray-200 rounded p-1 bg-gray-50 text-gray-400"
                                            title="Manage Reorder Qty in Inventory"
                                        />
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            const newV = variants.filter((_, i) => i !== index);
                                            setVariants(newV);
                                        }}
                                        className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1 hover:bg-red-200"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setVariants([...variants, { id: `temp-${Date.now()}`, name: '', sku: '', price: formData.price || '', stock_quantity: 0, cost_price: 0, gst_rate: 18, hsn_code: '', min_stock_level: 10, reorder_quantity: 50 }])}
                                className="w-full dashed border-2 border-sage-300 text-sage-600"
                            >
                                + Add Variant
                            </Button>
                        </div>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Features (One per line)</label>
                    <textarea
                        name="features"
                        value={formData.features || ''}
                        onChange={handleChange}
                        rows="4"
                        placeholder="- 100% Organic&#10;- Cruelty Free&#10;- Sustainably Sourced"
                        className="w-full px-3 py-2 border border-sage-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Key Ingredients</label>
                    <p className="text-xs text-stone-500 mb-1">Format: Name (Benefit). Example: Ashwagandha (Stress Relief), Amla (Immunity)</p>
                    <textarea
                        name="ingredients"
                        value={formData.ingredients || ''}
                        onChange={handleChange}
                        rows="3"
                        placeholder="Ashwagandha (Stress Relief), Black Pepper (Digestion)..."
                        className="w-full px-3 py-2 border border-sage-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Benefits (One per line for bullet points)</label>
                    <textarea
                        name="benefits"
                        value={formData.benefits || ''}
                        onChange={handleChange}
                        rows="4"
                        placeholder="- Reduces stress&#10;- Improves sleep"
                        className="w-full px-3 py-2 border border-sage-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Meta Keywords (Search optimization)</label>
                    <p className="text-xs text-stone-500 mb-1">Comma separated keywords for search. Ex: immunity, stress, sleep</p>
                    <textarea
                        name="meta_keywords"
                        value={formData.meta_keywords || ''}
                        onChange={handleChange}
                        rows="2"
                        placeholder="immunity, stress, sleep, herbal"
                        className="w-full px-3 py-2 border border-sage-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Product Specifications (In the box, Weight, etc.)</label>
                    <textarea
                        name="specifications"
                        value={formData.specifications || ''}
                        onChange={handleChange}
                        rows="3"
                        placeholder="In the box: 1 Bottle&#10;Weight: 100g&#10;Shelf Life: 24 Months"
                        className="w-full px-3 py-2 border border-sage-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-500"
                        required
                    />
                </div>

                <div className="border-t border-sage-100 pt-6">
                    <h3 className="text-lg font-serif font-bold text-sage-900 mb-4">SEO & Short Description</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">SEO Title (Meta Title)</label>
                            <input
                                type="text"
                                name="seo_title"
                                value={formData.seo_title || ''}
                                onChange={handleChange}
                                placeholder="Custom title for search engines"
                                className="w-full px-3 py-2 border border-sage-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">Short Description (SEO & Product Page)</label>
                            <textarea
                                name="meta_description"
                                value={formData.meta_description || ''}
                                onChange={handleChange}
                                rows="3"
                                placeholder="Brief summary shown beside product image and in search results..."
                                className="w-full px-3 py-2 border border-sage-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-500"
                            />
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Usage Instructions</label>
                    <textarea
                        name="usage"
                        value={formData.usage || ''}
                        onChange={handleChange}
                        rows="3"
                        placeholder="Take 1 teaspoon daily..."
                        className="w-full px-3 py-2 border border-sage-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Main Product Image</label>
                    <div className="space-y-2">
                        {/* File Upload Option */}
                        <div className="border-2 border-dashed border-sage-200 rounded-lg p-4 text-center hover:bg-sage-50 transition-colors cursor-pointer relative">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        setMainImageFile(e.target.files[0]);
                                        // Optional: Clear URL input if file is chosen to avoid confusion, 
                                        // or keep it for fallback. Let's just set a local preview.
                                    }
                                }}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="text-sage-600">
                                {mainImageFile ? (
                                    <span className="font-semibold text-sage-800">Selected: {mainImageFile.name}</span>
                                ) : (
                                    <span>Click to upload or drag and drop</span>
                                )}
                            </div>
                        </div>

                        {/* URL Fallback / Override */}
                        <div className="flex gap-2 items-center">
                            <span className="text-xs text-stone-500">OR use URL:</span>
                            <input
                                type="url"
                                name="image"
                                value={formData.image}
                                onChange={(e) => {
                                    setFormData(prev => ({ ...prev, image: e.target.value }));
                                    setMainImageFile(null); // Clear file if URL is manually edited
                                }}
                                className="flex-1 px-3 py-1 border border-sage-200 rounded-md text-sm"
                                placeholder="https://..."
                            />
                        </div>

                        {/* Preview */}
                        {(mainImageFile || formData.image) && (
                            <div className="mt-2">
                                <p className="text-xs text-stone-500 mb-1">Preview:</p>
                                <img
                                    src={mainImageFile ? URL.createObjectURL(mainImageFile) : formData.image}
                                    alt="Preview"
                                    className="h-32 w-32 object-contain rounded-md border border-stone-200"
                                    onError={(e) => e.target.style.display = 'none'}
                                />
                            </div>
                        )}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">Additional Images (Gallery)</label>
                    <div className="space-y-3">
                        {formData.images && formData.images.map((img, index) => (
                            <div key={index} className="mb-4 bg-gray-50 p-2 rounded-lg">
                                <div className="flex gap-2 mb-2">
                                    <input
                                        type="url"
                                        value={img}
                                        onChange={(e) => {
                                            const newImages = [...formData.images];
                                            newImages[index] = e.target.value;
                                            setFormData(prev => ({ ...prev, images: newImages }));
                                        }}
                                        className="flex-1 px-3 py-2 border border-sage-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-500"
                                        placeholder="https://..."
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const newImages = formData.images.filter((_, i) => i !== index);
                                            setFormData(prev => ({ ...prev, images: newImages }));
                                        }}
                                        className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg text-sm font-medium"
                                    >
                                        Remove
                                    </button>
                                </div>
                                <div className="ml-1">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                                setAdditionalImageFiles(prev => ({ ...prev, [index]: e.target.files[0] }));
                                            }
                                        }}
                                        className="text-xs text-stone-500"
                                    />
                                    {additionalImageFiles[index] && <span className="text-xs text-green-600 ml-2">File selected: {additionalImageFiles[index].name}</span>}
                                </div>
                            </div>
                        ))}
                        <div className="flex gap-2 mt-2">
                            <div className="relative">
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files.length > 0) {
                                            const files = Array.from(e.target.files);
                                            const currentImages = formData.images || [];
                                            const startIndex = currentImages.length;

                                            // Add empty slots for the new files
                                            const newImages = [...currentImages, ...files.map(() => '')];
                                            setFormData(prev => ({ ...prev, images: newImages }));

                                            // Store files map
                                            setAdditionalImageFiles(prev => {
                                                const updated = { ...prev };
                                                files.forEach((file, i) => {
                                                    updated[startIndex + i] = file;
                                                });
                                                return updated;
                                            });
                                        }
                                    }}
                                />
                                <Button type="button" variant="secondary" className="pointer-events-none">
                                    Upload Images (Bulk)
                                </Button>
                            </div>

                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, images: [...(prev.images || []), ''] }))}
                                className="text-sm font-bold text-sage-600 hover:text-sage-800 flex items-center gap-1 px-3 py-2"
                            >
                                + Add Image URL Row
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 pt-4">
                    <Button type="submit" disabled={loading} className="flex-1">
                        {loading ? 'Saving...' : (isEditMode ? 'Update Product' : 'Create Product')}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => navigate('/admin/products')}>
                        Cancel
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default ProductForm;
