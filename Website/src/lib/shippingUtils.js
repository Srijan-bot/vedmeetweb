/**
 * Shipping Logic Utility
 * Handles dimension parsing, stacking, box selection, and price calculation.
 */

// --- 1. Parsing Helpers ---

/**
 * Calculates Haversine distance in km between two points.
 * Input: strings "(lng,lat)" or objects {x,y} or arrays [lng, lat]
 */
// --- 1. Parsing Helpers ---

/**
 * Calculates Haversine distance in km between two points.
 * Input: strings "(lng,lat)" or objects {x,y} or arrays [lng, lat]
 * Output: Distance in km * 1.25 (Road Distance Approximation)
 */
export const calculateDistance = (coord1, coord2) => {
    if (!coord1 || !coord2) return null;

    const toRad = (value) => (value * Math.PI) / 180;

    const parseCoord = (c) => {
        if (typeof c === 'string') {
            const parts = c.replace(/[()]/g, '').split(',').map(Number);
            return [parts[0], parts[1]]; // lng, lat
        }
        if (c.x !== undefined && c.y !== undefined) return [c.x, c.y];
        if (Array.isArray(c)) return c;
        return null;
    };

    const p1 = parseCoord(coord1);
    const p2 = parseCoord(coord2);

    if (!p1 || !p2) return null;

    const [lon1, lat1] = p1;
    const [lon2, lat2] = p2;

    const R = 6371; // km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    // Return direct Haversine distance without multiplier
    return R * c;
};

export const parseDimensions = (dimString) => {
    if (!dimString) return { l: 0, w: 0, h: 0 };
    // Expected format: "10x10x10 cm" or "10 x 10 x 10"
    const match = dimString.match(/(\d+(?:\.\d+)?)\s*[xX]\s*(\d+(?:\.\d+)?)\s*[xX]\s*(\d+(?:\.\d+)?)/);
    if (!match) return { l: 0, w: 0, h: 0 };
    return {
        l: parseFloat(match[1]),
        w: parseFloat(match[2]),
        h: parseFloat(match[3])
    };
};

export const parseWeight = (weightString) => {
    if (!weightString) return 0;
    // Expected: "500 g", "1.5 kg"
    const lower = weightString.toLowerCase();
    const value = parseFloat(lower);
    if (isNaN(value)) return 0;

    if (lower.includes('kg')) return value * 1000;
    if (lower.includes('mg')) return value / 1000;
    // Default or 'g' is grams
    return value;
};


// --- 2. Stacking & Safety Margin ---

/**
 * Calculates the total occupied space for a list of items.
 * Strategy: Simplified Stacking (Stack by Height)
 * - Max Length of any item
 * - Max Width of any item
 * - Sum of Heights of all items
 * - Add +2cm safety margin to resulting L, W, H
 */
export const calculateRequiredDimensions = (items) => {
    let maxL = 0;
    let maxW = 0;
    let totalH = 0;
    let totalProductWeight = 0;

    items.forEach(item => {
        // Parse variant specs or fallback to product specs
        const dimStr = item.variant?.dimensions || item.product?.dimensions;
        const weightStr = item.variant?.weight || item.product?.weight;

        const { l, w, h } = parseDimensions(dimStr);
        const weight = parseWeight(weightStr); // per unit weight

        // Apply quantity
        // If l,w,h are 0, assume default small size to avoid blocking
        const effL = l || 10;
        const effW = w || 10;
        const effH = h || 5;
        const effWeight = weight || 100;

        // Update totals
        // Check if this item determines the box footprint
        maxL = Math.max(maxL, effL);
        maxW = Math.max(maxW, effW);
        totalH += (effH * item.quantity);
        totalProductWeight += (effWeight * item.quantity);
    });

    // Apply Safety Margin (+2cm)
    return {
        l: maxL + 2,
        w: maxW + 2,
        h: totalH + 2,
        weight: totalProductWeight
    };
};


// --- 3. Box Selection ---

export const selectBestBox = (requiredDims, availableBoxes) => {
    if (!availableBoxes || availableBoxes.length === 0) return null;

    // Filter boxes that fit
    const validBoxes = availableBoxes.filter(box =>
        box.length_cm >= requiredDims.l &&
        box.width_cm >= requiredDims.w &&
        box.height_cm >= requiredDims.h
    );

    if (validBoxes.length === 0) return null; // No box fits

    // Sort by Volume (as proxy for "smallest")
    validBoxes.sort((a, b) => {
        const volA = a.length_cm * a.width_cm * a.height_cm;
        const volB = b.length_cm * b.width_cm * b.height_cm;
        return volA - volB;
    });

    return validBoxes[0];
};

export const calculateVolumetricWeight = (box) => {
    if (!box) return 0;
    // Formula: (L x W x H) / 5000 -> result in kg
    const volKg = (box.length_cm * box.width_cm * box.height_cm) / 5000;
    return volKg * 1000; // Convert to grams
};


// --- 4. Rate Calculation ---

export const determineDistanceCategory = (distanceKm) => {
    if (distanceKm === null || distanceKm === undefined) return 'z5'; // Default to max

    // Standard Zones
    if (distanceKm <= 50) return 'local';
    if (distanceKm <= 200) return 'z1';
    if (distanceKm <= 500) return 'z2';
    if (distanceKm <= 1000) return 'z3';
    if (distanceKm <= 2000) return 'z4';
    return 'z5';
};

const parseSlabString = (slabStr) => {
    // Attempt to parse "51-250 g" or "upto 50 g"
    if (!slabStr) return 999999;

    const lower = slabStr.toLowerCase();

    if (lower.includes('extra')) return -1; // Special flag for extra

    // Extract numbers
    const numbers = lower.match(/\d+/g)?.map(Number);
    if (!numbers) return 999999;

    // If range "51-250", take the max (250)
    return Math.max(...numbers);
};

export const calculateShippingCost = (orderDetails, shippingRates, packagingBoxes, distanceKm, isLocal = false) => {
    // 1. Calculate Required Dims
    const req = calculateRequiredDimensions(orderDetails.items);

    // 2. Select Box
    const selectedBox = selectBestBox(req, packagingBoxes);

    // Fallback "Custom Box" if no box fits
    const activeBox = selectedBox || {
        name: 'Custom Box (Auto-sized)',
        length_cm: req.l,
        width_cm: req.w,
        height_cm: req.h,
        weight_g: 500 // fallback packaging weight
    };

    // 3. Current Weight Calculations
    const volumetricWeight = calculateVolumetricWeight(activeBox);
    const actualTotalWeight = req.weight + (activeBox.weight_g || 0); // Content + Box

    // Per user request: Charge based on Actual Weight ONLY (ignore volumetric)
    const chargeableWeight = actualTotalWeight;

    // 4. Rate Lookup
    const zoneKey = isLocal ? 'local' : determineDistanceCategory(distanceKm);

    // Clean and Sort Rates
    // We expect rates to have 'weight_limit' (number) OR we parse 'slab' string
    let parsedRates = shippingRates.map(r => ({
        ...r,
        limit: r.weight_limit !== undefined ? r.weight_limit : parseSlabString(r.slab),
        isExtra: r.is_extra || (r.slab && r.slab.toLowerCase().includes('extra'))
    }));

    // Split into normal slabs and extra rule
    const normalSlabs = parsedRates.filter(r => !r.isExtra && r.limit > 0).sort((a, b) => a.limit - b.limit);
    const extraRateRow = parsedRates.find(r => r.isExtra);

    let baseCost = 0;
    let extraCost = 0;
    let appliedSlab = '';

    // Find matching slab
    const matchedSlab = normalSlabs.find(r => chargeableWeight <= r.limit);
    const maxSlab = normalSlabs[normalSlabs.length - 1]; // The highest defined slab (e.g. 2000g)

    if (matchedSlab) {
        // Fits within a standard slab
        baseCost = parseFloat(matchedSlab[zoneKey] || 0);
        appliedSlab = matchedSlab.slab;
    } else if (maxSlab) {
        // Exceeds max slab -> Base = Max Slab Price
        baseCost = parseFloat(maxSlab[zoneKey] || 0);
        appliedSlab = `${maxSlab.slab} + Extra`;

        if (extraRateRow) {
            const excessWeight = chargeableWeight - maxSlab.limit;
            // Round up to next 1000g (or whatever unit, assuming 1kg for now based on slab name "Every Extra 1kg")
            const extraUnits = Math.ceil(excessWeight / 1000);
            const unitPrice = parseFloat(extraRateRow[zoneKey] || 0);
            extraCost = extraUnits * unitPrice;
        }
    }

    return {
        productWeight: req.weight,
        reqDims: req,
        selectedBox: activeBox,
        volumetricWeight,
        actualTotalWeight,
        chargeableWeight,
        distanceKm,
        zoneKey,
        appliedSlab,
        baseCost,
        extraCost,
        totalCost: baseCost + extraCost
    };
};
