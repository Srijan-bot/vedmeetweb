import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Filter, ChevronDown, Star, ArrowRight, Search, X } from 'lucide-react';
import { getProducts, getCategories, getConcerns, getBrands } from '../lib/data';
import Button from '../components/Button';
import { useCart } from '../context/CartContext';

const Shop = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [concerns, setConcerns] = useState([]);
  const [brands, setBrands] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToCart } = useCart();

  // Filters
  // Filters
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'All');
  const [selectedConcern, setSelectedConcern] = useState(searchParams.get('concern') || 'All');
  const [selectedBrand, setSelectedBrand] = useState(searchParams.get('brand') || 'All');
  const [selectedDosage, setSelectedDosage] = useState('All'); // New Dosage Filter
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [sortBy, setSortBy] = useState('featured');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Search Enhancements
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [didYouMean, setDidYouMean] = useState(null);

  // Helper: Derive Dosage Form
  const getDosageForm = (name) => {
    const lower = name.toLowerCase();
    if (lower.includes('tablet') || lower.includes('tab')) return 'Tablet';
    if (lower.includes('syrup')) return 'Syrup';
    if (lower.includes('oil') || lower.includes('taila')) return 'Oil';
    if (lower.includes('churna') || lower.includes('powder')) return 'Powder/Churna';
    if (lower.includes('balm') || lower.includes('gel')) return 'Balm/Gel';
    if (lower.includes('capsule') || lower.includes('cap')) return 'Capsule';
    if (lower.includes('tea')) return 'Tea';
    if (lower.includes('juice')) return 'Juice';
    if (lower.includes('prash')) return 'Chyawanprash';
    return 'Other';
  };

  // Helper: Symptom Mapping (Simple Implementation)
  const getSymptomConcerns = (query) => {
    const q = query.toLowerCase();
    const map = {
      'burning': 'Digestive Health',
      'acid': 'Digestive Health',
      'gas': 'Digestive Health',
      'stomach': 'Digestive Health',
      'hair': 'Hair Care',
      'bald': 'Hair Care',
      'dandruff': 'Hair Care',
      'pain': 'Pain Relief',
      'ache': 'Pain Relief',
      'joint': 'Pain Relief',
      'cold': 'Immunity Boosters',
      'cough': 'Immunity Boosters',
      'immunity': 'Immunity Boosters',
      'flu': 'Immunity Boosters',
      'sugar': 'Diabetes',
      'diabet': 'Diabetes',
      'tooth': 'Oral Care',
      'mouth': 'Oral Care',
      'gum': 'Oral Care',
      'skin': 'Dark Spots & Pigmentation', // Assuming category/concern exists or maps to similar
      'face': 'Dark Spots & Pigmentation',
      'acne': 'Dark Spots & Pigmentation'
    };

    // Find all matching concerns
    const matches = Object.keys(map).filter(key => q.includes(key)).map(key => map[key]);
    return [...new Set(matches)]; // Unique
  };

  // Helper: Levenshtein Distance for "Did you mean?"
  const levenshteinDistance = (a, b) => {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) { matrix[i] = [i]; }
    for (let j = 0; j <= a.length; j++) { matrix[0][j] = j; }
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) == a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
        }
      }
    }
    return matrix[b.length][a.length];
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [prodData, catData, conData, brandData] = await Promise.all([
        getProducts(),
        getCategories(),
        getConcerns(),
        getBrands()
      ]);
      setProducts(prodData);
      setCategories([{ id: 'All', name: 'All' }, ...catData]);
      setConcerns([{ id: 'All', name: 'All' }, ...conData]);
      setBrands([{ id: 'All', name: 'All' }, ...brandData]);
      setLoading(false);
    };
    loadData();
  }, []);

  // Update Suggestions based on Query
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    const lowerQuery = searchQuery.toLowerCase();
    const matched = products.filter(p => p.name.toLowerCase().includes(lowerQuery)).slice(0, 5);
    setSuggestions(matched);
  }, [searchQuery, products]);

  useEffect(() => {
    let result = [...products];
    setDidYouMean(null); // Reset

    // Filter by Category
    if (selectedCategory !== 'All') {
      result = result.filter(p => {
        const pCats = normalizeToArray(p.category);
        return pCats.includes(selectedCategory) ||
          pCats.includes(categories.find(c => c.id === selectedCategory)?.name);
      });
    }

    // Filter by Concern
    if (selectedConcern !== 'All') {
      const concernName = concerns.find(c => c.id === selectedConcern)?.name || selectedConcern;
      result = result.filter(p => {
        const pCons = normalizeToArray(p.concern);
        if (pCons.includes(selectedConcern)) return true;
        return pCons.some(c => c.toLowerCase().includes(concernName.toLowerCase())) ||
          (p.features && p.features.toLowerCase().includes(concernName.toLowerCase())) ||
          (p.description && p.description.toLowerCase().includes(concernName.toLowerCase()));
      });
    }

    // Filter by Brand
    if (selectedBrand !== 'All') {
      const brandName = brands.find(b => b.id === selectedBrand)?.name || selectedBrand;
      result = result.filter(p => {
        if (p.brand === selectedBrand) return true;
        if (p.brand === brandName) return true;
        if (typeof p.brand === 'string' && p.brand.toLowerCase() === brandName.toLowerCase()) return true;
        return false;
      });
    }

    // Filter by Dosage Form
    if (selectedDosage !== 'All') {
      result = result.filter(p => getDosageForm(p.name) === selectedDosage);
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      // 1. Direct Match
      const searchResult = result.filter(p => {
        return (
          p.name.toLowerCase().includes(query) ||
          (p.meta_keywords && p.meta_keywords.toLowerCase().includes(query)) ||
          (p.description && p.description.toLowerCase().includes(query))
        );
      });

      // 2. Symptom Search (Smart Fallback)
      if (searchResult.length === 0) {
        const symptomConcerns = getSymptomConcerns(query);
        if (symptomConcerns.length > 0) {
          const symptomResult = result.filter(p => {
            const pCons = normalizeToArray(p.concern).map(c => c.toLowerCase());
            const pCats = normalizeToArray(p.category).map(c => c.toLowerCase());
            return symptomConcerns.some(sc => pCons.includes(sc.toLowerCase()) || pCats.includes(sc.toLowerCase()));
          });

          if (symptomResult.length > 0) {
            result = symptomResult;
            // Maybe show a message "Showing results for related concerns..."
          } else {
            result = []; // No matches found
          }
        } else {
          result = [];
        }
      } else {
        result = searchResult;
      }

      // 3. Did You Mean? (If still 0 results)
      if (result.length === 0) {
        // Find closest product name
        let closest = null;
        let minDist = 3; // Tolerance

        for (const p of products) {
          const dist = levenshteinDistance(query, p.name.toLowerCase().substring(0, Math.max(query.length, 5)));
          if (dist < minDist) {
            minDist = dist;
            closest = p;
          }
        }

        if (closest) {
          setDidYouMean(closest.name);
        }
      }
    }

    // Filter by Price
    result = result.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);

    // Sorting
    if (sortBy === 'price-low') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    setFilteredProducts(result);
  }, [products, selectedCategory, selectedConcern, selectedBrand, selectedDosage, priceRange, sortBy, searchQuery, brands]);

  // Helper to normalize category/concern to array of strings
  const normalizeToArray = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;

    // Handle Postgres array string format "{a,b}"
    if (typeof value === 'string') {
      if (value.startsWith('{') && value.endsWith('}')) {
        return value.slice(1, -1).split(',').map(s => s.trim().replace(/"/g, ''));
      }
      // Handle JSON string format "["a","b"]" (if saved as text)
      if (value.startsWith('[') && value.endsWith(']')) {
        try {
          return JSON.parse(value);
        } catch (e) {
          console.error("Failed to parse JSON category:", value);
        }
      }
      // Handle comma-separated string fallback
      if (value.includes(',')) {
        return value.split(',').map(s => s.trim());
      }
      // Single string
      return [value];
    }
    return [];
  };

  useEffect(() => {
    // Debug logging
    if (products.length > 0) {
      console.log("Debug: All Products Categories:", products.map(p => ({ name: p.name, category: p.category, normalized: normalizeToArray(p.category) })));
    }

    const cat = searchParams.get('category');
    const con = searchParams.get('concern');
    const brand = searchParams.get('brand');
    const search = searchParams.get('search');
    if (cat) setSelectedCategory(cat);
    if (con) setSelectedConcern(con);
    if (brand) setSelectedBrand(brand);
    if (search) setSearchQuery(search);
  }, [searchParams, products]);

  // Update URL params when filters change (optional, but good for UX)
  // For simplicity, we just sync *from* URL initially, but we could sync *to* URL too

  // Filters updated from DB now

  return (
    <div className="container mx-auto px-4 md:px-6 py-8">
      {/* Breadcrumbs */}
      <nav className="text-sm text-stone-500 mb-8 flex items-center gap-2">
        <Link to="/" className="hover:text-sage-700">Home</Link>
        <span>/</span>
        <span className="font-semibold text-sage-900">Shop</span>
      </nav>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Filters */}
        {/* Sidebar Filters */}
        <div className={`
                    fixed inset-0 z-[60] bg-white transform transition-transform duration-300 md:static md:translate-x-0 md:w-64 md:block md:bg-transparent md:p-0
                    ${showMobileFilters ? 'translate-x-0' : '-translate-x-full'}
                `}>
          <div className="flex flex-col h-full md:block">
            {/* Mobile Header */}
            <div className="flex justify-between items-center md:hidden p-4 border-b border-stone-100">
              <h2 className="font-serif font-bold text-xl text-sage-900">Filters</h2>
              <button onClick={() => setShowMobileFilters(false)} className="p-1 text-stone-500 hover:text-stone-800">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Filter Content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-0 space-y-8">
              <div>
                <h3 className="font-serif font-semibold text-lg mb-4 text-sage-900">Categories</h3>
                <div className="space-y-2">
                  {categories.map(cat => (
                    <label key={cat.id} className="flex items-center gap-2 cursor-pointer group">
                      <div className={`w-4 h-4 rounded-full border border-sage-300 flex items-center justify-center transition-colors ${String(selectedCategory) === String(cat.id) ? 'bg-sage-600 border-sage-600' : 'group-hover:border-sage-500'}`}>
                        {String(selectedCategory) === String(cat.id) && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <input
                        type="radio"
                        name="category"
                        value={cat.id}
                        checked={String(selectedCategory) === String(cat.id)}
                        onChange={() => setSelectedCategory(cat.id)}
                        className="hidden"
                      />
                      <span className={`text-sm ${String(selectedCategory) === String(cat.id) ? 'text-sage-900 font-medium' : 'text-stone-600'}`}>{cat.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-serif font-semibold text-lg mb-4 text-sage-900">Health Concern</h3>
                <div className="space-y-2">
                  {concerns.map(concern => (
                    <label key={concern.id} className="flex items-center gap-2 cursor-pointer group">
                      <div className={`w-4 h-4 rounded border border-sage-300 flex items-center justify-center transition-colors ${String(selectedConcern) === String(concern.id) ? 'bg-sage-600 border-sage-600' : 'group-hover:border-sage-500'}`}>
                        {String(selectedConcern) === String(concern.id) && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      <input
                        type="radio"
                        name="concern"
                        value={concern.id}
                        checked={String(selectedConcern) === String(concern.id)}
                        onChange={() => setSelectedConcern(concern.id)}
                        className="hidden"
                      />
                      <span className={`text-sm ${String(selectedConcern) === String(concern.id) ? 'text-sage-900 font-medium' : 'text-stone-600'}`}>{concern.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-serif font-semibold text-lg mb-4 text-sage-900">Brands</h3>
                <div className="space-y-2">
                  {brands.map(brand => (
                    <label key={brand.id} className="flex items-center gap-2 cursor-pointer group">
                      <div className={`w-4 h-4 rounded-full border border-sage-300 flex items-center justify-center transition-colors ${String(selectedBrand) === String(brand.id) ? 'bg-sage-600 border-sage-600' : 'group-hover:border-sage-500'}`}>
                        {String(selectedBrand) === String(brand.id) && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <input
                        type="radio"
                        name="brand"
                        value={brand.id}
                        checked={String(selectedBrand) === String(brand.id)}
                        onChange={() => setSelectedBrand(brand.id)}
                        className="hidden"
                      />
                      <span className={`text-sm ${String(selectedBrand) === String(brand.id) ? 'text-sage-900 font-medium' : 'text-stone-600'}`}>{brand.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-serif font-semibold text-lg mb-4 text-sage-900">Dosage Form</h3>
                <div className="space-y-2">
                  {['All', 'Tablet', 'Syrup', 'Churna', 'Oil', 'Balm/Gel', 'Capsule', 'Tea', 'Juice', 'Other'].map(dosage => (
                    <label key={dosage} className="flex items-center gap-2 cursor-pointer group">
                      <div className={`w-4 h-4 rounded-full border border-sage-300 flex items-center justify-center transition-colors ${String(selectedDosage) === dosage ? 'bg-sage-600 border-sage-600' : 'group-hover:border-sage-500'}`}>
                        {String(selectedDosage) === dosage && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <input
                        type="radio"
                        name="dosage"
                        value={dosage}
                        checked={String(selectedDosage) === dosage}
                        onChange={() => setSelectedDosage(dosage)}
                        className="hidden"
                      />
                      <span className={`text-sm ${String(selectedDosage) === dosage ? 'text-sage-900 font-medium' : 'text-stone-600'}`}>{dosage}</span>
                    </label>
                  ))}
                </div>
              </div>

            </div>

            {/* Mobile Footer Button */}
            <div className="p-4 border-t border-stone-100 md:hidden bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
              <Button onClick={() => setShowMobileFilters(false)} className="w-full">
                View Results
              </Button>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1">
          {/* Header: Title & Sort */}
          {/* Mobile Header Layout */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-sage-900 w-full md:w-auto hidden md:block">All Products</h1>

            {/* Mobile: Search + Filter/Sort Bar */}
            <div className="w-full md:hidden space-y-3">
              {/* Search */}
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Search for herbs, kits..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  className="w-full pl-10 pr-4 py-3 text-sm border border-stone-200 rounded-xl bg-stone-50 focus:outline-none focus:border-sage-500 focus:bg-white transition-all shadow-sm"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />

                {/* Mobile Suggestions */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-stone-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
                    {suggestions.map(s => (
                      <Link
                        key={s.id}
                        to={`/product/${s.id}`}
                        className="flex items-center gap-3 p-3 hover:bg-sage-50 border-b border-stone-50 last:border-0"
                      >
                        <img src={s.image} alt="" className="w-8 h-8 rounded object-cover" />
                        <div>
                          <div className="text-sm font-medium text-sage-900">{s.name}</div>
                          <div className="text-[10px] text-stone-500">{s.brand}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Filter & Sort Row */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShowMobileFilters(true)}
                  className="flex items-center justify-center gap-2 bg-white border border-stone-200 text-stone-700 py-3 rounded-xl text-sm font-semibold hover:bg-sage-50 transition-colors shadow-sm active:scale-95"
                >
                  <Filter className="w-4 h-4" />
                  Filters
                </button>

                <div className="relative">
                  <select
                    className="w-full appearance-none bg-white border border-stone-200 text-stone-700 py-3 pl-4 pr-10 rounded-xl text-sm font-semibold focus:outline-none focus:border-sage-500 shadow-sm"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="featured">Featured</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="rating">Top Rated</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Desktop: Toolbar */}
            <div className="hidden md:flex items-center gap-4 w-full md:w-auto">
              <div className="relative flex-1 md:flex-none">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  className="pl-4 pr-10 py-2 text-sm text-stone-600 border border-sage-200 rounded-full focus:outline-none focus:border-sage-400 w-full md:w-64"
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />

                {/* Desktop Suggestions */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full right-0 w-80 mt-2 bg-white border border-stone-200 rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto">
                    {suggestions.map(s => (
                      <Link
                        key={s.id}
                        to={`/product/${s.id}`}
                        className="flex items-center gap-3 p-3 hover:bg-sage-50 border-b border-stone-50 last:border-0"
                      >
                        <img src={s.image} alt="" className="w-10 h-10 rounded object-cover" />
                        <div>
                          <div className="text-sm font-medium text-sage-900 line-clamp-1">{s.name}</div>
                          <div className="text-xs text-stone-500">{s.brand} • <span className="text-saffron-600 font-bold">₹{s.disc_price || s.price}</span></div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative group">
                <select
                  className="appearance-none bg-transparent pl-4 pr-10 py-2 text-sm font-medium text-stone-600 border border-sage-200 rounded-full focus:outline-none focus:border-sage-400 cursor-pointer"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="featured">Featured</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Top Rated</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-white rounded-xl overflow-hidden border border-stone-100 shadow-sm">
                  <div className="aspect-[3/4] bg-gray-100 animate-pulse" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 w-1/2 bg-gray-100 rounded animate-pulse" />
                    <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
                    <div className="h-8 w-full bg-gray-100 rounded animate-pulse mt-2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6 pb-20">
              {filteredProducts.length === 0 && didYouMean && (
                <div className="col-span-full mb-4 p-4 bg-saffron-50 border border-saffron-100 rounded-lg flex items-center gap-2">
                  <span className="text-stone-600">Did you mean:</span>
                  <button
                    onClick={() => setSearchQuery(didYouMean)}
                    className="font-bold text-saffron-700 underline hover:text-saffron-800"
                  >
                    {didYouMean}?
                  </button>
                </div>
              )}

              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <div key={product.id} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group flex flex-col border border-stone-100">
                    <Link to={`/product/${product.id}`} className="relative aspect-[3/4] overflow-hidden bg-gray-100 block">
                      <img
                        src={product.image}
                        alt={product.name}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      {product.rating > 0 && product.reviews > 0 && (
                        <div className="absolute top-2 right-2 bg-white/95 backdrop-blur px-1.5 py-0.5 rounded-full flex items-center gap-1 text-[10px] font-bold text-sage-900 shadow-sm">
                          <Star className="h-3 w-3 fill-saffron-400 text-saffron-400" />
                          {product.rating.toFixed(1)}
                        </div>
                      )}

                      {product.discount_percentage > 0 && (
                        <div className="absolute top-2 left-2 bg-saffron-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm">
                          {product.discount_percentage}% OFF
                        </div>
                      )}

                      {/* Desktop Overlay */}
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:flex items-center justify-center">
                        <Button variant="secondary" size="sm" className="translate-y-4 group-hover:translate-y-0 transition-transform duration-300 bg-white text-sage-900 border-0 shadow-lg">
                          View Details
                        </Button>
                      </div>
                    </Link>

                    <div className="p-3 flex-1 flex flex-col items-start text-left">
                      <div className="text-[10px] text-saffron-600 font-bold uppercase tracking-wider mb-1 truncate w-full">
                        {(() => {
                          const pCats = normalizeToArray(product.category);
                          return categories.find(c => c.id === pCats[0])?.name || pCats[0] || 'Ayurveda';
                        })()}
                      </div>

                      <Link to={`/product/${product.id}`} className="block w-full">
                        <h3 className="text-sm font-serif font-bold text-sage-900 mb-1 hover:text-sage-700 leading-tight line-clamp-2 min-h-[2.5em]">
                          {product.name}
                        </h3>
                      </Link>

                      {/* Description hidden on mobile, visible on desktop small */}
                      <p className="text-stone-500 text-xs line-clamp-2 mb-3 hidden md:block">
                        {product.meta_description || product.short_description || product.description}
                      </p>

                      <div className="w-full mt-auto pt-3 flex flex-col gap-2 border-t border-stone-100/50">
                        <div className="flex items-center justify-start gap-2">
                          {product.discount_percentage > 0 ? (
                            <>
                              <span className="text-sm font-bold text-sage-900">₹{product.disc_price.toFixed(0)}</span>
                              <span className="text-[10px] text-stone-400 line-through">₹{product.price.toFixed(0)}</span>
                            </>
                          ) : (
                            <span className="text-sm font-bold text-sage-900">₹{product.price.toFixed(0)}</span>
                          )}
                        </div>

                        <button
                          onClick={(e) => { e.preventDefault(); addToCart(product); }}
                          className="w-full bg-sage-50 text-sage-900 hover:bg-sage-900 hover:text-white transition-all py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 md:col-span-3 lg:col-span-4 text-center py-20">
                  <h3 className="text-xl font-serif text-sage-800 mb-2">No products found</h3>
                  <button onClick={() => { setSelectedCategory('All'); setSelectedConcern('All'); setSelectedBrand('All'); setSelectedDosage('All'); setSortBy('featured'); setSearchQuery(''); }} className="mt-4 text-saffron-600 underline font-medium">Clear filters</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div >
  );
};

export default Shop;
