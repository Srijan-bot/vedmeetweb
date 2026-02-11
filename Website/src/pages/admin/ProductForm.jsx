import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getProduct, addProduct, updateProduct, getCategories, getConcerns, getBrands, uploadFile, getVariants, addVariant, updateVariant } from '../../lib/data';
import { supabase } from '../../lib/supabase';
import { generateProductContent } from '../../lib/gemini';
import {
    Sparkles, Trash2, X, Save, LayoutDashboard, Image as ImageIcon,
    DollarSign, Package, Settings, Search, ChevronLeft, UploadCloud
} from 'lucide-react';
import Button from '../../components/Button';
import MultiSelect from '../../components/MultiSelect';

import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const parseWithUnit = (str, defaultUnit) => {
    if (!str) return { value: '', unit: defaultUnit };

    // List of known units to check against, sorted by length to match "fl oz" before "oz"
    const KNOWN_UNITS = [
        'fl oz', 'mg', 'kg', 'lb', 'oz', 'ml', 'pcs', 'tabs', 'caps',
        'strips', 'pack', 'jar', 'bottle', 'box', 'cm', 'in', 'g', 'l', 'm'
    ];

    for (const unit of KNOWN_UNITS) {
        // Match explicit " value unit" pattern (case-insensitive unit)
        // We look for the unit at the end of the string, preceded by space
        const regex = new RegExp(`^(.*)\\s+(${unit})$`, 'i');
        const match = str.match(regex);
        if (match) {
            return { value: match[1], unit: match[2].toLowerCase() };
        }
    }

    // Fallback: If no known unit found, assume the whole string is the value
    // This handles "10x10x10" without a unit suffix correctly (assigning defaultUnit)
    return { value: str, unit: defaultUnit };
};

const ProductForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = !!id;

    // --- State Management ---
    const [activeTab, setActiveTab] = useState('basic');
    const [categories, setCategories] = useState([]);
    const [concerns, setConcerns] = useState([]);
    const [brands, setBrands] = useState([]);
    const [overrideGST, setOverrideGST] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        // Global/Summary fields (read-only or calculated)
        price: '',
        stock_quantity: '',
        stock_status: 'In Stock',

        category: [],
        concern: [],
        image: '',
        brand: '',
        features: '',
        ingredients: '',
        benefits: '',
        usage: '',
        discount_percentage: 0,
        disc_price: null,
        meta_keywords: '',
        specifications: '', // General specs only
        // Removed specific physical props from main form state control, managed via variants summary
        images: [],
        seo_title: '',
        meta_description: '',
        short_description: '',
        product_type: 'Cosmetic',
        hsn_code: '',
        gst_rate: '',
        cost_price: ''
    });

    // Variants are now the source of truth for physical specs and price
    const [variants, setVariants] = useState([]);
    const [mainImageFile, setMainImageFile] = useState(null);
    const [additionalImageFiles, setAdditionalImageFiles] = useState({});
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [role, setRole] = useState(null);

    const isSeoWriter = role === 'seo_writer';

    // --- Role & Data Fetching ---
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
        } else {
            // New Product: Initialize with 1 Standard Variant
            setVariants([{
                id: `temp-${Date.now()}`,
                name: 'Standard',
                sku: '',
                price: '',
                stock_quantity: 0,
                cost_price: 0,
                gst_rate: 18,
                hsn_code: '',
                min_stock_level: 10,
                reorder_quantity: 50,
                net_qty: '', net_unit: 'g', // New unified field
            }]);
        }
    }, [id]);

    const fetchProduct = async () => {
        const data = await getProduct(id);
        if (data) {
            const processedData = { ...data };
            if (processedData.images && !Array.isArray(processedData.images)) {
                processedData.images = [];
            } else if (!processedData.images) {
                processedData.images = [];
            }

            setFormData({
                ...processedData,
                category: Array.isArray(processedData.category) ? processedData.category : (processedData.category ? [processedData.category] : []),
                concern: Array.isArray(processedData.concern) ? processedData.concern : (processedData.concern ? [processedData.concern] : []),
                gst_rate: processedData.gst_rate || '',
                product_type: processedData.product_type || 'Cosmetic',
            });

            if (processedData.gst_rate && processedData.gst_rate > 0) {
                setOverrideGST(true);
            }

            // Fetch Variants
            const vData = await getVariants(id);
            if (vData && vData.length > 0) {
                const parsedVariants = vData.map(v => {
                    const vol = parseWithUnit(v.volume, 'g'); // Using volume col for Net Qty (size)
                    const w = parseWithUnit(v.weight, 'g');   // Using weight col for Shipping Weight
                    const d = parseWithUnit(v.dimensions, 'cm');

                    return {
                        ...v,
                        net_qty: vol.value, net_unit: vol.unit || 'g',
                        shipping_weight_value: w.value, shipping_weight_unit: w.unit || 'g',
                        dimensions_value: d.value, dimensions_unit: d.unit || 'cm',
                        pieces: v.pieces || ''
                    };
                });
                setVariants(parsedVariants);
            } else {
                // If existing product has NO variants (legacy data), construct one from main product data
                const vol = parseWithUnit(processedData.volume, 'g');
                const w = parseWithUnit(processedData.weight, 'g');
                const d = parseWithUnit(processedData.dimensions, 'cm');

                setVariants([{
                    id: `temp-${Date.now()}`,
                    name: 'Standard',
                    sku: '',
                    price: processedData.price,
                    stock_quantity: processedData.stock_quantity,
                    cost_price: processedData.cost_price,
                    gst_rate: processedData.gst_rate || 18,
                    hsn_code: processedData.hsn_code,
                    min_stock_level: 10,
                    reorder_quantity: 50, // Default REORDER level

                    net_qty: vol.value, net_unit: vol.unit || 'g',
                    shipping_weight_value: w.value, shipping_weight_unit: w.unit || 'g',
                    dimensions_value: d.value, dimensions_unit: d.unit || 'cm',
                    pieces: processedData.pieces || ''
                }]);
            }
        }
    };

    // --- Handlers ---
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

    const handleAIGenerate = async () => {
        if (!formData.name) {
            alert("Please enter a Product Name first.");
            return;
        }
        setGenerating(true);
        try {
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
                short_description: content.short_description || prev.short_description,
                features: content.features || prev.features,
                ingredients: content.ingredients || prev.ingredients,
                benefits: content.benefits || prev.benefits,
                usage: content.usage || prev.usage,
                seo_title: content.seo_title || prev.seo_title,
                meta_keywords: content.meta_keywords || prev.meta_keywords,
                meta_description: content.meta_description || prev.meta_description
            }));
            alert("Content generated successfully using AI!");
        } catch (error) {
            console.error("Gemini Error:", error);
            alert(`Failed to generate content: ${error.message}`);
        } finally {
            setGenerating(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (variants.length === 0) {
            alert("Product must have at least one variant.");
            return;
        }

        setLoading(true);
        try {
            // First variant is the "primary" one for summary fields
            const primaryVariant = variants[0];
            const totalStock = variants.reduce((sum, v) => sum + parseInt(v.stock_quantity || 0), 0);

            // Map variant fields to payload:
            // volume -> Net Quantity (Size)
            // weight -> Shipping Weight (Logistics)
            const mapVariantToPayload = (v) => ({
                volume: v.net_qty ? `${v.net_qty} ${v.net_unit}` : null,
                weight: v.shipping_weight_value ? `${v.shipping_weight_value} ${v.shipping_weight_unit}` : null,
                dimensions: v.dimensions_value ? `${v.dimensions_value} ${v.dimensions_unit}` : null,
                pieces: v.pieces ? parseInt(v.pieces) : null
            });

            const primarySpecs = mapVariantToPayload(primaryVariant);

            // Clean payload
            const finalPayload = {
                ...formData,
                // Inherited from Primary Variant
                price: parseFloat(primaryVariant.price || 0),
                cost_price: parseFloat(primaryVariant.cost_price || 0),
                stock_quantity: totalStock,

                weight: primarySpecs.weight,
                volume: primarySpecs.volume,
                pieces: primarySpecs.pieces,
                dimensions: primarySpecs.dimensions,

                // Form Fields
                discount_percentage: parseInt(formData.discount_percentage || 0),
                gst_rate: overrideGST ? parseFloat(formData.gst_rate || 0) : null,
                hsn_code: overrideGST ? formData.hsn_code : null,
                product_type: formData.product_type,
                images: formData.images.filter(url => url.trim() !== '')
            };

            // 1. Upload Main Image
            if (mainImageFile) {
                const fileName = `${Date.now()}_${mainImageFile.name.replace(/\s+/g, '-')}`;
                const publicUrl = await uploadFile(mainImageFile, 'products', fileName);
                finalPayload.image = publicUrl;
            }

            // 2. Upload Additional Images
            const newImages = [...finalPayload.images];
            const uploadPromises = Object.entries(additionalImageFiles).map(async ([index, file]) => {
                const fileName = `${Date.now()}_more_${index}_${file.name.replace(/\s+/g, '-')}`;
                const publicUrl = await uploadFile(file, 'products', fileName);
                if (index < newImages.length) {
                    newImages[index] = publicUrl;
                } else {
                    newImages[parseInt(index)] = publicUrl;
                }
            });

            await Promise.all(uploadPromises);
            finalPayload.images = newImages.filter(img => img && img.trim() !== '');

            let productId = id;
            if (isEditMode) {
                await updateProduct(id, finalPayload);
            } else {
                const newProduct = await addProduct(finalPayload);
                if (newProduct && newProduct[0]) {
                    productId = newProduct[0].id;
                }
            }

            // Handle Variants
            for (const variant of variants) {
                const vSpecs = mapVariantToPayload(variant);

                const variantPayload = {
                    ...variant,
                    product_id: productId,
                    price: parseFloat(variant.price || 0),
                    cost_price: parseFloat(variant.cost_price || 0),
                    mrp: parseFloat(variant.mrp || 0),
                    gst_rate: parseFloat(variant.gst_rate || 0),

                    weight: vSpecs.weight,
                    volume: vSpecs.volume,
                    pieces: vSpecs.pieces,
                    dimensions: vSpecs.dimensions,

                    // Remove helper keys
                    net_qty: undefined, net_unit: undefined,
                    shipping_weight_value: undefined, shipping_weight_unit: undefined,
                    dimensions_value: undefined, dimensions_unit: undefined,
                };

                // Clean undefineds
                Object.keys(variantPayload).forEach(key => variantPayload[key] === undefined && delete variantPayload[key]);

                if (variant.id && variant.id.includes('-')) {
                    if (variant.id.startsWith('temp-')) {
                        const { id, ...insertData } = variantPayload;
                        await addVariant(insertData);
                    } else {
                        await updateVariant(variant.id, variantPayload);
                    }
                } else {
                    if (variant.id) await updateVariant(variant.id, variantPayload);
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

    // --- Sub-Components for Tabs ---

    const BasicDetailsTab = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">Product Name</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="e.g. Luxury Face Cream"
                                className="flex-1 px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500"
                                required
                            />
                            <button
                                type="button"
                                onClick={handleAIGenerate}
                                disabled={generating || isSeoWriter}
                                className="bg-purple-50 text-purple-700 px-4 py-2 rounded-lg font-medium hover:bg-purple-100 transition-colors flex items-center gap-2 disabled:opacity-50 border border-purple-200"
                                title="Auto-fill details with AI"
                            >
                                <Sparkles className="w-4 h-4" />
                                {generating ? '...' : 'AI Fill'}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">Description</label>
                        <div className="bg-white rounded-lg border border-stone-200 overflow-hidden">
                            <ReactQuill
                                theme="snow"
                                value={formData.description}
                                onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
                                className="min-h-[200px]"
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
                </div>

                <div className="space-y-4">
                    <div className="bg-stone-50 p-4 rounded-xl border border-stone-100 space-y-4">
                        <h3 className="font-semibold text-stone-800 flex items-center gap-2">
                            <Settings className="w-4 h-4" /> Configuration
                        </h3>
                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">Product Type</label>
                            <select
                                name="product_type"
                                value={formData.product_type}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-stone-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-500"
                            >
                                <option value="Cosmetic">Cosmetic</option>
                                <option value="Medicine">Medicine</option>
                                <option value="Consumable">Consumable</option>
                                <option value="Equipment">Equipment</option>
                                <option value="Service">Service</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">Brand</label>
                            <select
                                name="brand"
                                value={formData.brand || ''}
                                onChange={handleChange}
                                disabled={isSeoWriter}
                                className="w-full px-3 py-2 border border-stone-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-500 disabled:bg-gray-100"
                            >
                                <option value="">Select Brand</option>
                                {brands.map(b => (
                                    <option key={b.id} value={b.name}>{b.name}</option>
                                ))}
                            </select>
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
                </div>
            </div>
        </div>
    );

    const MediaTab = () => (
        <div className="space-y-8">
            {/* Main Image */}
            <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
                <h3 className="text-lg font-serif font-bold text-stone-800 mb-4 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-sage-600" /> Main Product Image
                </h3>
                <div className="flex flex-col md:flex-row gap-6 items-start">
                    <div className="w-full md:w-1/3">
                        <div className="aspect-square bg-stone-50 border-2 border-dashed border-stone-300 rounded-xl flex flex-col items-center justify-center relative overflow-hidden group hover:border-sage-400 transition-colors">
                            {(mainImageFile || formData.image) ? (
                                <>
                                    <img
                                        src={mainImageFile ? URL.createObjectURL(mainImageFile) : formData.image}
                                        alt="Main Preview"
                                        className="w-full h-full object-cover"
                                        onError={(e) => e.target.style.display = 'none'}
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <p className="text-white font-medium">Click to Change</p>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center p-4">
                                    <UploadCloud className="w-10 h-10 text-stone-400 mx-auto mb-2" />
                                    <p className="text-stone-500 font-medium">Upload Main Image</p>
                                    <p className="text-xs text-stone-400 mt-1">SVG, PNG, JPG</p>
                                </div>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        setMainImageFile(e.target.files[0]);
                                    }
                                }}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                        </div>
                        <div className="mt-3">
                            <label className="block text-xs font-medium text-stone-500 mb-1">OR enter URL</label>
                            <input
                                type="url"
                                value={formData.image || ''}
                                onChange={(e) => {
                                    setFormData(prev => ({ ...prev, image: e.target.value }));
                                    setMainImageFile(null);
                                }}
                                placeholder="https://..."
                                className="w-full px-3 py-2 border border-stone-200 rounded-md text-xs"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Gallery */}
            <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
                <h3 className="text-lg font-serif font-bold text-stone-800 mb-4 flex items-center gap-2">
                    <LayoutDashboard className="w-5 h-5 text-sage-600" /> Gallery Images
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {formData.images && formData.images.map((img, index) => (
                        <div key={index} className="relative group aspect-square bg-stone-50 rounded-lg border border-stone-200 overflow-hidden">
                            <img
                                src={additionalImageFiles[index] ? URL.createObjectURL(additionalImageFiles[index]) : img}
                                alt={`Gallery ${index}`}
                                className="w-full h-full object-cover"
                                onError={(e) => e.target.src = 'https://via.placeholder.com/150?text=No+Image'}
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const newImages = formData.images.filter((_, i) => i !== index);
                                        setFormData(prev => ({ ...prev, images: newImages }));
                                    }}
                                    className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                                    title="Remove Image"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                <div className="text-xs text-white max-w-[90%] truncate px-2">
                                    {additionalImageFiles[index] ? 'Local File' : 'URL Link'}
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Add New Button */}
                    <div className="relative aspect-square bg-stone-50 border-2 border-dashed border-stone-300 rounded-lg flex flex-col items-center justify-center hover:border-sage-400 transition-colors cursor-pointer text-stone-500 hover:text-sage-600">
                        <UploadCloud className="w-8 h-8 mb-2" />
                        <span className="text-xs font-semibold">Add Images</span>
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
                                    const newImages = [...currentImages, ...files.map(() => '')];
                                    setFormData(prev => ({ ...prev, images: newImages }));
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
                    </div>
                </div>
                <div className="mt-4 flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setFormData(prev => ({ ...prev, images: [...(prev.images || []), ''] }))}>
                        + Add Image URL Slot
                    </Button>
                </div>
            </div>
        </div>
    );

    const PricingTab = () => (
        <div className="space-y-6 max-w-4xl">
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 mb-4">
                <p className="text-sm text-amber-800 font-medium">
                    Note: Base Price and Stock are now managed in the <strong>Variants</strong> tab.
                    Every product must have at least one variant (e.g., "Standard").
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm space-y-4">
                    <h3 className="font-bold text-stone-800 flex items-center gap-2">
                        <DollarSign className="w-4 h-4" /> Discounts & Offers
                    </h3>

                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">Discount Percentage (%)</label>
                        <input
                            type="number"
                            name="discount_percentage"
                            value={formData.discount_percentage}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-stone-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-500"
                        />
                    </div>

                    {isEditMode && formData.discount_percentage > 0 && (
                        <div className="bg-orange-50 p-3 rounded-lg border border-orange-100 flex items-center justify-between">
                            <div>
                                <span className="text-sm font-bold text-orange-800 block">Active Discount: {formData.discount_percentage}% OFF</span>
                                <span className="text-xs text-orange-600">Applied to all variant prices automatically.</span>
                            </div>
                            <button type="button" onClick={removeDiscount} className="text-red-500 hover:text-red-700 p-1">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-stone-50 p-6 rounded-xl border border-stone-200">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-stone-800">Tax & GST</h3>
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="overrideGST"
                            checked={overrideGST}
                            onChange={(e) => setOverrideGST(e.target.checked)}
                            className="h-4 w-4 text-sage-600 focus:ring-sage-500 border-gray-300 rounded"
                        />
                        <label htmlFor="overrideGST" className="text-sm font-medium text-stone-700 cursor-pointer">
                            Override GST at Product Level
                        </label>
                    </div>
                </div>
                <div className={`grid grid-cols-2 gap-4 transition-opacity ${!overrideGST ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">HSN Code</label>
                        <input
                            type="text"
                            name="hsn_code"
                            value={formData.hsn_code || ''}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-stone-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-500 bg-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">GST Rate (%)</label>
                        <select
                            name="gst_rate"
                            value={formData.gst_rate || ''}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-stone-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-500 bg-white"
                        >
                            <option value="">Default</option>
                            <option value="0">0% (Exempt)</option>
                            <option value="5">5%</option>
                            <option value="12">12%</option>
                            <option value="18">18%</option>
                            <option value="28">28%</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );

    const SpecsTab = () => (
        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm max-w-4xl">
            <h3 className="text-lg font-serif font-bold text-stone-800 mb-6">General Specifications</h3>

            <div className="mb-4 bg-blue-50 p-3 rounded text-sm text-blue-700">
                Specific physical attributes like Net Quantity (Weight/Volume) are now managed per <strong>Variant</strong>.
            </div>

            <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Other / Custom Specifications</label>
                <textarea
                    name="specifications"
                    value={formData.specifications || ''}
                    onChange={handleChange}
                    rows="4"
                    placeholder="Additional details... (e.g. Shelf Life: 24 Months, Material: Glass)"
                    className="w-full px-3 py-2 border border-stone-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-500 bg-stone-50"
                />
            </div>
        </div>
    );

    const VariantsTab = () => (
        <div className="space-y-6">
            <div className="flex items-center justify-between bg-purple-50 p-4 rounded-lg border border-purple-100">
                <div>
                    <h3 className="text-lg font-bold text-purple-900">Product Variants</h3>
                    <p className="text-sm text-purple-700">Manage pricing, stock, and specs for each variation.</p>
                </div>
            </div>

            <div className="space-y-4">
                {variants.map((variant, index) => (
                    <div key={variant.id || index} className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm relative group hover:border-sage-300 transition-colors">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                            <div className='md:col-span-2'>
                                <label className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-1 block">Variant Name</label>
                                <input
                                    type="text"
                                    value={variant.name}
                                    onChange={(e) => {
                                        const newV = [...variants];
                                        newV[index].name = e.target.value;
                                        setVariants(newV);
                                    }}
                                    placeholder="Standard, Small, Red, etc."
                                    className="w-full text-sm font-semibold border-b border-stone-200 focus:border-sage-500 outline-none py-1"
                                />
                            </div>
                            <div className='md:col-span-1'>
                                <label className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-1 block">SKU</label>
                                <input
                                    type="text"
                                    value={variant.sku}
                                    onChange={(e) => {
                                        const newV = [...variants];
                                        newV[index].sku = e.target.value;
                                        setVariants(newV);
                                    }}
                                    placeholder="Unique code"
                                    className="w-full text-sm border-b border-stone-200 focus:border-sage-500 outline-none py-1"
                                />
                            </div>
                            <div className='md:col-span-1'>
                                <label className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-1 block">Price</label>
                                <input
                                    type="number"
                                    value={variant.price}
                                    onChange={(e) => {
                                        const newV = [...variants];
                                        newV[index].price = e.target.value;
                                        setVariants(newV);
                                    }}
                                    placeholder="0.00"
                                    className="w-full text-sm border-b border-stone-200 focus:border-sage-500 outline-none py-1"
                                />
                            </div>
                            <div className='md:col-span-1'>
                                <label className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-1 block">Stock</label>
                                <span className="text-sm text-stone-400 block py-1">{variant.stock_quantity || 0} (Inv)</span>
                            </div>
                        </div>

                        {/* Refined Fields: Net Qty, Pack, Shipping Weight, Dimensions */}
                        <div className="bg-stone-50 p-3 rounded-lg grid grid-cols-2 lg:grid-cols-4 gap-3 items-end">

                            {/* 1. Net Quantity (Content Size for End User) */}
                            <div>
                                <label className="text-[10px] uppercase text-stone-500 font-bold mb-1 block">Net Qty (Size)</label>
                                <div className="flex bg-white border border-stone-200 rounded overflow-hidden h-8">
                                    <input
                                        value={variant.net_qty || ''}
                                        onChange={(e) => {
                                            const newV = [...variants];
                                            newV[index].net_qty = e.target.value;
                                            setVariants(newV);
                                        }}
                                        className="w-full px-2 text-sm outline-none"
                                        placeholder="100, 50, etc."
                                    />
                                    <select
                                        value={variant.net_unit || 'g'}
                                        onChange={(e) => {
                                            const newV = [...variants];
                                            newV[index].net_unit = e.target.value;
                                            setVariants(newV);
                                        }}
                                        className="bg-stone-100 border-l border-stone-200 text-[10px] px-1 font-medium outline-none"
                                    >
                                        <optgroup label="Mass">
                                            <option value="g">g</option>
                                            <option value="kg">kg</option>
                                            <option value="mg">mg</option>
                                        </optgroup>
                                        <optgroup label="Liquid">
                                            <option value="ml">ml</option>
                                            <option value="l">l</option>
                                        </optgroup>
                                        <optgroup label="Pack">
                                            <option value="pcs">pcs</option>
                                            <option value="tabs">tabs</option>
                                            <option value="caps">caps</option>
                                            <option value="strips">strips</option>
                                            <option value="pack">pack</option>
                                        </optgroup>
                                    </select>
                                </div>
                            </div>

                            {/* 2. Pieces / pack */}
                            <div>
                                <label className="text-[10px] uppercase text-stone-500 font-bold mb-1 block">Pieces / Pack</label>
                                <input
                                    type="number"
                                    value={variant.pieces || ''}
                                    onChange={(e) => {
                                        const newV = [...variants];
                                        newV[index].pieces = e.target.value;
                                        setVariants(newV);
                                    }}
                                    className="w-full bg-white border border-stone-200 rounded px-2 text-sm h-8"
                                    placeholder="No. of items"
                                />
                            </div>

                            {/* 3. Shipping Weight (Mandatory) */}
                            <div>
                                <label className="text-[10px] uppercase text-red-500 font-bold mb-1 block">Shipping Weight *</label>
                                <div className="flex bg-white border border-red-100 rounded overflow-hidden h-8">
                                    <input
                                        value={variant.shipping_weight_value || ''}
                                        onChange={(e) => {
                                            const newV = [...variants];
                                            newV[index].shipping_weight_value = e.target.value;
                                            setVariants(newV);
                                        }}
                                        className="w-full px-2 text-sm outline-none"
                                        placeholder="Required"
                                        required
                                    />
                                    <select
                                        value={variant.shipping_weight_unit || 'g'}
                                        onChange={(e) => {
                                            const newV = [...variants];
                                            newV[index].shipping_weight_unit = e.target.value;
                                            setVariants(newV);
                                        }}
                                        className="bg-stone-100 border-l border-stone-200 text-xs px-1 font-medium outline-none"
                                    >
                                        <option value="g">g</option>
                                        <option value="kg">kg</option>
                                        <option value="lb">lb</option>
                                    </select>
                                </div>
                            </div>

                            {/* 4. Dimensions */}
                            <div>
                                <label className="text-[10px] uppercase text-stone-500 font-bold mb-1 block">Dimensions (LxWxH)</label>
                                <div className="flex bg-white border border-stone-200 rounded overflow-hidden h-8">
                                    <input
                                        value={variant.dimensions_value || ''}
                                        onChange={(e) => {
                                            const newV = [...variants];
                                            newV[index].dimensions_value = e.target.value;
                                            setVariants(newV);
                                        }}
                                        className="w-full px-2 text-sm outline-none"
                                        placeholder="10x10x10"
                                    />
                                    <select
                                        value={variant.dimensions_unit || 'cm'}
                                        onChange={(e) => {
                                            const newV = [...variants];
                                            newV[index].dimensions_unit = e.target.value;
                                            setVariants(newV);
                                        }}
                                        className="bg-stone-100 border-l border-stone-200 text-xs px-1 font-medium outline-none"
                                    >
                                        <option value="cm">cm</option>
                                        <option value="m">m</option>
                                        <option value="in">in</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Reorder Level - moved down slightly */}
                        <div className="flex gap-4 items-center bg-stone-50 p-3 rounded-lg mt-2">
                            <div>
                                <label className="text-[10px] uppercase text-stone-500 font-bold mb-1 block">Reorder Level</label>
                                <input
                                    value={variant.min_stock_level || 10}
                                    onChange={(e) => {
                                        const newV = [...variants];
                                        newV[index].min_stock_level = e.target.value;
                                        setVariants(newV);
                                    }}
                                    className="w-20 bg-white border border-stone-200 rounded px-2 text-sm h-8"
                                />
                            </div>
                        </div>

                        {/* Actions */}
                        {variants.length > 1 && (
                            <button
                                type="button"
                                onClick={() => {
                                    if (confirm("Delete this variant?")) {
                                        const newV = variants.filter((_, i) => i !== index);
                                        setVariants(newV);
                                    }
                                }}
                                className="absolute top-2 right-2 text-red-300 hover:text-red-500"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                ))}

                <button
                    type="button"
                    onClick={() => setVariants([...variants, {
                        id: `temp-${Date.now()}`,
                        name: '', sku: '',
                        price: variants[0]?.price || '',
                        stock_quantity: 0, cost_price: 0, gst_rate: 18, hsn_code: '',
                        min_stock_level: 10,
                        reorder_quantity: 50,
                        net_qty: '', net_unit: 'g'
                    }])}
                    className="w-full py-3 border-2 border-dashed border-sage-300 rounded-xl text-sage-600 font-medium hover:bg-sage-50 transition-colors flex items-center justify-center gap-2"
                >
                    <UploadCloud className="w-5 h-5" /> Add New Variant
                </button>
            </div>
        </div>
    );

    const SEOTab = () => (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm space-y-4">
                <h3 className="text-lg font-serif font-bold text-stone-800 flex items-center gap-2">
                    <Search className="w-5 h-5 text-blue-500" /> Search Engine Optimization
                </h3>
                <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">SEO Title (Meta Title)</label>
                    <input
                        type="text"
                        name="seo_title"
                        value={formData.seo_title || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-stone-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Meta Description</label>
                    <textarea
                        name="meta_description"
                        value={formData.meta_description || ''}
                        onChange={handleChange}
                        rows="3"
                        className="w-full px-3 py-2 border border-stone-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Meta Keywords</label>
                    <textarea
                        name="meta_keywords"
                        value={formData.meta_keywords || ''}
                        onChange={handleChange}
                        rows="2"
                        className="w-full px-3 py-2 border border-stone-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-500"
                    />
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm space-y-4">
                <h3 className="text-lg font-serif font-bold text-stone-800">Marketing & Content</h3>
                <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Features</label>
                    <textarea
                        name="features"
                        value={formData.features || ''}
                        onChange={handleChange}
                        rows="4"
                        placeholder="Bullet points..."
                        className="w-full px-3 py-2 border border-stone-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Ingredients</label>
                    <textarea
                        name="ingredients"
                        value={formData.ingredients || ''}
                        onChange={handleChange}
                        rows="3"
                        className="w-full px-3 py-2 border border-stone-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Usage Instructions</label>
                    <textarea
                        name="usage"
                        value={formData.usage || ''}
                        onChange={handleChange}
                        rows="3"
                        className="w-full px-3 py-2 border border-stone-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-500"
                    />
                </div>
            </div>
        </div>
    );

    // --- Tab Button Component ---
    const TabButton = ({ id, label, icon: Icon, active }) => (
        <button
            type="button"
            onClick={() => setActiveTab(id)}
            className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${active
                ? 'bg-sage-100 text-sage-900 font-semibold'
                : 'text-stone-600 hover:bg-stone-50'
                }`}
        >
            <Icon className={`w-5 h-5 ${active ? 'text-sage-700' : 'text-stone-400'}`} />
            {label}
        </button>
    );

    return (
        <div className="min-h-screen bg-stone-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-stone-200 sticky top-0 z-10 px-4 py-3 shadow-sm">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/admin/products')} className="p-2 hover:bg-stone-100 rounded-full text-stone-500">
                            <ChevronLeft />
                        </button>
                        <div>
                            <h1 className="text-xl font-serif font-bold text-stone-800">
                                {isEditMode ? 'Edit Product' : 'New Product'}
                            </h1>
                            <p className="text-xs text-stone-500">{formData.name || 'Untitled Product'}</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Button type="button" variant="outline" onClick={() => navigate('/admin/products')}>
                            Cancel
                        </Button>
                        <Button type="button" onClick={handleSubmit} disabled={loading} className="flex items-center gap-2">
                            <Save className="w-4 h-4" />
                            {loading ? 'Saving...' : 'Save Product'}
                        </Button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar Tabs */}
                    <div className="w-full lg:w-64 flex-shrink-0">
                        <div className="bg-white rounded-xl border border-stone-200 p-2 space-y-1 sticky top-24">
                            <TabButton id="basic" label="Basic Details" icon={LayoutDashboard} active={activeTab === 'basic'} />
                            <TabButton id="media" label="Media & Images" icon={ImageIcon} active={activeTab === 'media'} />
                            <TabButton id="variants" label="Variants" icon={Settings} active={activeTab === 'variants'} />
                            <TabButton id="pricing" label="Tax & Accounting" icon={DollarSign} active={activeTab === 'pricing'} />
                            <TabButton id="specs" label="Specifications" icon={Package} active={activeTab === 'specs'} />
                            <TabButton id="seo" label="SEO & Marketing" icon={Search} active={activeTab === 'seo'} />
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1">
                        <form onSubmit={(e) => e.preventDefault()}>
                            {activeTab === 'basic' && BasicDetailsTab()}
                            {activeTab === 'media' && MediaTab()}
                            {activeTab === 'pricing' && PricingTab()}
                            {activeTab === 'specs' && SpecsTab()}
                            {activeTab === 'variants' && VariantsTab()}
                            {activeTab === 'seo' && SEOTab()}
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductForm;
