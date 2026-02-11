/**
 * Warehouse Cartonization and Packing Optimization Engine
 * Matches items to optimal cartons based on dimensions, weight, and constraints.
 */

/**
 * Produces a packing plan that assigns order items to the best-fit cartons to minimize billable weight while respecting dimensional and weight constraints.
 *
 * @param {Object} input - Input configuration for packing.
 * @param {string} input.orderId - External order identifier.
 * @param {number} [input.volumetricDivisor=5000] - Divisor used to convert carton volume to volumetric weight.
 * @param {number} [input.packingClearanceCm=0] - Clearance added to reported carton inner dimensions.
 * @param {Array<Object>} input.items - Array of item definitions; each item must include at least:
 *   - {string} sku
 *   - {number} qty
 *   - {number} weightKg
 *   - {Object} dimensionsCm with numeric L, W, H
 *   - {boolean} [rotatable]
 *   - {boolean} [uprightOnly]
 *   - {boolean} [fragile]
 * @param {Array<Object>} input.cartons - Array of carton definitions; each carton must include at least:
 *   - {string} cartonId
 *   - {Object} innerDimensionsCm with numeric L, W, H
 *   - {number} emptyWeightKg
 *   - {number} maxWeightKg
 *
 * @returns {Object} The packing result containing:
 *   - {string} orderId
 *   - {Array<Object>} recommendedCartons — list of committed cartons with fields:
 *       - {string} cartonId
 *       - {Object} finalDimensionsCm {L, W, H} (inner dimensions plus clearance)
 *       - {number} deadWeightKg (carton empty weight + packed item weights, rounded to 2 decimals)
 *       - {number} volumetricWeightKg (carton volumetric weight, rounded to 2 decimals)
 *       - {number} billableWeightKg (max of dead and volumetric weight, rounded to 2 decimals)
 *       - {Array<string>} itemsPacked (SKUs packed into the carton)
 *       - {string} layoutStrategy (e.g., "Layered Best Fit")
 *       - {Array<Object>} layers (per-carton layer details)
 *   - {Array<string>} optimizationReason — human-readable summary(s) of outcome
 *   - {Array<string>} constraintViolations — any constraint messages for items that could not be packed
 */
function optimizePacking(input) {
    const { orderId, volumetricDivisor = 5000, packingClearanceCm = 0, items, cartons } = input;

    // 1. Expand items by quantity
    const expandedItems = [];
    items.forEach(item => {
        for (let i = 0; i < item.qty; i++) {
            expandedItems.push({
                ...item,
                id: `${item.sku}_${i}`, // Unique ID for tracking
                originalQty: item.qty
            });
        }
    });

    // Sort items by volume (largest first) - heuristic for better packing
    expandedItems.sort((a, b) => {
        const volA = a.dimensionsCm.L * a.dimensionsCm.W * a.dimensionsCm.H;
        const volB = b.dimensionsCm.L * b.dimensionsCm.W * b.dimensionsCm.H;
        return volB - volA;
    });

    // 2. Filter valid cartons
    const result = {
        orderId,
        recommendedCartons: [],
        optimizationReason: [],
        constraintViolations: []
    };

    let remainingItems = [...expandedItems];

    while (remainingItems.length > 0) {
        let bestCartonSolution = null;
        let itemsPackedInBest = [];

        // Try each carton definition to find the best fit for current remaining items
        for (const carton of cartons) {
            const packingResult = packItemsIntoCarton(remainingItems, carton, packingClearanceCm);

            if (packingResult.packedItems.length > 0) {
                // Calculate metrics for this solution
                const deadWeight = packingResult.packedItems.reduce((sum, item) => sum + item.weightKg, 0) + carton.emptyWeightKg;
                const volWeight = (carton.innerDimensionsCm.L * carton.innerDimensionsCm.W * carton.innerDimensionsCm.H) / volumetricDivisor;
                const billableWeight = Math.max(deadWeight, volWeight);

                // Scoring: We want to maximize items packed, then minimize billable weight.
                const isBetter = isBetterSolution(bestCartonSolution, {
                    carton,
                    packedItems: packingResult.packedItems,
                    layers: packingResult.layers,
                    billableWeight,
                    deadWeight,
                    volumetricWeight: volWeight
                }, remainingItems.length);

                if (isBetter) {
                    bestCartonSolution = {
                        carton,
                        packedItems: packingResult.packedItems,
                        layers: packingResult.layers,
                        billableWeight,
                        deadWeight,
                        volumetricWeight: volWeight
                    };
                    itemsPackedInBest = packingResult.packedItems;
                }
            }
        }

        if (!bestCartonSolution) {
            // Could not pack remaining items into ANY carton. 
            const violationMsg = `Could not pack ${remainingItems.length} items. They might be too large or heavy for available cartons.`;
            result.constraintViolations.push(violationMsg);
            result.optimizationReason.push("Partial failure: Some items could not be packed.");
            break;
        }

        // Commit this carton
        result.recommendedCartons.push({
            cartonId: bestCartonSolution.carton.cartonId,
            finalDimensionsCm: {
                L: bestCartonSolution.carton.innerDimensionsCm.L + packingClearanceCm,
                W: bestCartonSolution.carton.innerDimensionsCm.W + packingClearanceCm,
                H: bestCartonSolution.carton.innerDimensionsCm.H + packingClearanceCm
            },
            deadWeightKg: Number(bestCartonSolution.deadWeight.toFixed(2)),
            volumetricWeightKg: Number(bestCartonSolution.volumetricWeight.toFixed(2)),
            billableWeightKg: Number(bestCartonSolution.billableWeight.toFixed(2)),
            itemsPacked: bestCartonSolution.packedItems.map(i => i.sku),
            layoutStrategy: "Layered Best Fit",
            layers: bestCartonSolution.layers
        });

        // Remove packed items from remaining
        const packedIds = new Set(itemsPackedInBest.map(i => i.id));
        remainingItems = remainingItems.filter(item => !packedIds.has(item.id));
    }

    if (result.recommendedCartons.length > 0 && result.constraintViolations.length === 0) {
        result.optimizationReason.push(`Successfully packed into ${result.recommendedCartons.length} cartons minimized for billable weight.`);
    }

    return result;
}

/**
 * Selects the preferred packing solution between a current best and a candidate using packing priorities.
 *
 * Preference order: 1) maximize the number of packed items, 2) if counts are equal, prefer the lower billable weight.
 *
 * @param {Object|null} currentBest - The currently selected best solution, or `null` if none.
 * @param {Object} candidate - The candidate solution to compare.
 * @param {number} totalRemainingCount - Total number of items remaining to pack (not used in comparison).
 * @returns {boolean} `true` if the candidate is preferred over `currentBest`, `false` otherwise.
 */
function isBetterSolution(currentBest, candidate, totalRemainingCount) {
    if (!currentBest) return true;

    const candidateCount = candidate.packedItems.length;
    const currentCount = currentBest.packedItems.length;

    // 1. Maximize number of items packed (greedy approach)
    if (candidateCount > currentCount) return true;
    if (candidateCount < currentCount) return false;

    // 2. If same item count, minimize billable weight
    if (candidate.billableWeight < currentBest.billableWeight) return true;

    return false;
}

/**
 * Pack as many individual items as possible into the given carton using a layered placement strategy.
 *
 * Attempts to fill the carton's inner volume and weight allowance by forming successive horizontal layers until no further items fit or height/weight limits are reached. The algorithm respects item constraints such as fragility and orientation (e.g., upright-only liquids) and prioritizes non-fragile and larger-volume items.
 *
 * @param {Array<Object>} items - Expanded per-unit items to place; each item must include `id`, `sku`, `dimensionsCm` (`L`, `W`, `H`), `weightKg`, and constraint flags (e.g., `fragile`, `rotatable`, `uprightOnly`).
 * @param {Object} carton - Carton definition containing `innerDimensionsCm` (`L`, `W`, `H`), `maxWeightKg`, and `emptyWeightKg`.
 * @param {number} clearance - Packing clearance in centimeters to account for when reporting final carton dimensions (not applied to placement logic here).
 * @returns {{ packedItems: Array<Object>, layers: Array<{heightCm: number, items: Array<string>}> }} An object with `packedItems` (the item objects that were placed) and `layers` (an ordered list of layers with `heightCm` and an array of item SKUs placed in that layer).
 */
function packItemsIntoCarton(items, carton, clearance) {
    const L = carton.innerDimensionsCm.L;
    const W = carton.innerDimensionsCm.W;
    const H = carton.innerDimensionsCm.H;
    const maxWeight = carton.maxWeightKg;

    let currentWeight = carton.emptyWeightKg;
    const packedItems = [];
    const layers = []; // { heightCm: number, items: [] }

    // Prioritize packing non-fragile first (bottom), then fragile.
    // Liquid must be upright (handled in orientation).

    let candidates = [...items].sort((a, b) => {
        if (a.fragile !== b.fragile) return a.fragile ? 1 : -1; // Non-fragile first (bottom)
        // Then by volume
        const volA = a.dimensionsCm.L * a.dimensionsCm.W * a.dimensionsCm.H;
        const volB = b.dimensionsCm.L * b.dimensionsCm.W * b.dimensionsCm.H;
        return volB - volA;
    });

    let currentHeight = 0;

    while (candidates.length > 0 && currentHeight < H) {
        const remainingH = H - currentHeight;

        // Try to form a layer
        const layerResult = formLayer(candidates, L, W, remainingH, maxWeight - currentWeight);

        if (layerResult.items.length === 0) {
            // Cannot fit anything more
            break;
        }

        // Add layer
        layers.push({
            heightCm: layerResult.height,
            items: layerResult.items.map(i => i.sku)
        });

        packedItems.push(...layerResult.items);
        currentWeight += layerResult.weight;
        currentHeight += layerResult.height;

        // Remove packed from candidates
        const packedIds = new Set(layerResult.items.map(i => i.id));
        candidates = candidates.filter(i => !packedIds.has(i.id));
    }

    return { packedItems, layers };
}

/**
 * Build a single horizontal layer by selecting and placing candidate items within an L×W footprint,
 * respecting the maximum layer height and remaining weight capacity.
 * @param {Array<Object>} candidates - Candidate item objects (each must include id, weightKg and dimensions/rotation flags used by getAllowedOrientations).
 * @param {number} maxL - Available layer length (cm).
 * @param {number} maxW - Available layer width (cm).
 * @param {number} maxH - Maximum allowed layer height (cm).
 * @param {number} maxWeightAllowed - Remaining allowable weight for the layer (kg).
 * @returns {{items: Array<Object>, height: number, weight: number}} An object with:
 *  - `items`: the subset of candidates placed in this layer (in placement order),
 *  - `height`: the resulting layer height in cm (maximum item height placed),
 *  - `weight`: the total weight of items placed in kg.
 */
function formLayer(candidates, maxL, maxW, maxH, maxWeightAllowed) {
    const layerItems = [];
    let layerWeight = 0;

    // Placements within the layer
    const placements = []; // {x, y, l, w, h}

    let layerHeight = 0;

    for (const item of candidates) {
        if (item.weightKg + layerWeight > maxWeightAllowed) continue;

        // Get allowed orientations that fit maxH
        const orientations = getAllowedOrientations(item, maxH);

        // Try to place this item in the layer
        for (const orient of orientations) {
            const position = findPosition(placements, orient.l, orient.w, maxL, maxW);

            if (position) {
                placements.push({
                    x: position.x,
                    y: position.y,
                    l: orient.l,
                    w: orient.w,
                    h: orient.h,
                    id: item.id
                });

                layerItems.push(item);
                layerWeight += item.weightKg;
                layerHeight = Math.max(layerHeight, orient.h);
                break; // Item placed, move to next item
            }
        }
    }

    return {
        items: layerItems,
        height: layerHeight,
        weight: layerWeight
    };
}

/**
 * Determine all axis-aligned orientations of an item that fit within a given height limit.
 *
 * Returns unique orientation objects that respect the item's rotation constraints:
 * - If `rotatable === false`, only the original orientation is considered.
 * - If `uprightOnly` is true, only orientations that keep the original height (H) are considered, with L/W swap allowed.
 * - Otherwise, all height-respecting permutations are considered and L/W swapping is included.
 * Orientations are sorted by footprint area (L × W) in descending order.
 *
 * @param {Object} item - Item descriptor.
 * @param {Object} item.dimensionsCm - Item dimensions in centimeters.
 * @param {number} item.dimensionsCm.L - Length.
 * @param {number} item.dimensionsCm.W - Width.
 * @param {number} item.dimensionsCm.H - Height.
 * @param {boolean} [item.rotatable] - If false, disallow all rotations.
 * @param {boolean} [item.uprightOnly] - If true, preserve the original height while allowing L/W swap.
 * @param {number} maxH - Maximum allowed height for the orientation (cm).
 * @returns {Array<{l: number, w: number, h: number}>} Array of feasible orientations, each with `l`, `w`, and `h` in cm, sorted by descending footprint area.
 */
function getAllowedOrientations(item, maxH) {
    // item.dimensionsCm {L, W, H}
    const dims = [item.dimensionsCm.L, item.dimensionsCm.W, item.dimensionsCm.H];

    const possible = [];

    if (item.rotatable === false) {
        // Only one orientation: Original
        if (item.dimensionsCm.H <= maxH) {
            possible.push({ l: item.dimensionsCm.L, w: item.dimensionsCm.W, h: item.dimensionsCm.H });
        }
        return possible;
    }

    if (item.uprightOnly) {
        // Can rotate on Z axis (swap L/W) but H must be H.
        if (item.dimensionsCm.H <= maxH) {
            possible.push({ l: item.dimensionsCm.L, w: item.dimensionsCm.W, h: item.dimensionsCm.H });
            possible.push({ l: item.dimensionsCm.W, w: item.dimensionsCm.L, h: item.dimensionsCm.H });
        }
        return possible;
    }

    // Fully rotatable: 3 choices for Height constraint, then 2 choices for L/W per Height.
    const perms = [
        [dims[0], dims[1], dims[2]], // H is dims[2]
        [dims[0], dims[2], dims[1]], // H is dims[1]
        [dims[1], dims[2], dims[0]], // H is dims[0]
    ];

    const checked = new Set();

    for (const p of perms) {
        const h = p[2];
        const l = p[0];
        const w = p[1];

        if (h <= maxH) {
            const key1 = `${l}x${w}x${h}`;
            if (!checked.has(key1)) {
                possible.push({ l, w, h });
                checked.add(key1);
            }

            const key2 = `${w}x${l}x${h}`;
            if (!checked.has(key2)) {
                possible.push({ l: w, w: l, h });
                checked.add(key2);
            }
        }
    }

    // Sort orientations? Keep largest footprint first to fill layer?
    possible.sort((a, b) => (b.l * b.w) - (a.l * a.w));

    return possible;
}

/**
 * Finds a placement coordinate for a rectangle inside a bounded footprint without overlapping existing rectangles.
 *
 * Considers anchor points at the origin and at the right and bottom corners of each existing rectangle, prioritizing points by smallest Y then X (top-left first). Returns the first anchor that fits within bounds and does not intersect any existing rectangle.
 *
 * @param {{x: number, y: number, l: number, w: number}[]} existingRects - Already placed rectangles with top-left coordinate (x,y) and dimensions l (length in X) and w (width in Y).
 * @param {number} l - Length of the rectangle to place (size along X).
 * @param {number} w - Width of the rectangle to place (size along Y).
 * @param {number} maxL - Maximum allowed length (X extent) of the footprint.
 * @param {number} maxW - Maximum allowed width (Y extent) of the footprint.
 * @returns {{x: number, y: number} | null} The top-left coordinate where the rectangle can be placed, or `null` if no non-overlapping position fits.
 */
function findPosition(existingRects, l, w, maxL, maxW) {
    if (existingRects.length === 0) {
        if (l <= maxL && w <= maxW) return { x: 0, y: 0 };
        return null;
    }

    // Try to place at (0,0) and every corner of existing rects
    let points = [{ x: 0, y: 0 }];
    for (const r of existingRects) {
        points.push({ x: r.x + r.l, y: r.y });
        points.push({ x: r.x, y: r.y + r.w });
    }

    // Sort points Y then X (top-left priority)
    points.sort((a, b) => a.y - b.y || a.x - b.x);

    for (const p of points) {
        // Check bounds
        if (p.x + l > maxL || p.y + w > maxW) continue;

        // Check collision
        let collision = false;
        for (const r of existingRects) {
            if (rectIntersect(p.x, p.y, l, w, r.x, r.y, r.l, r.w)) {
                collision = true;
                break;
            }
        }

        if (!collision) return p;
    }

    return null;
}

/**
 * Determine whether two axis-aligned rectangles intersect.
 * @param {number} x1 - X coordinate of the first rectangle's top-left corner.
 * @param {number} y1 - Y coordinate of the first rectangle's top-left corner.
 * @param {number} l1 - Length (extent along X) of the first rectangle.
 * @param {number} w1 - Width (extent along Y) of the first rectangle.
 * @param {number} x2 - X coordinate of the second rectangle's top-left corner.
 * @param {number} y2 - Y coordinate of the second rectangle's top-left corner.
 * @param {number} l2 - Length (extent along X) of the second rectangle.
 * @param {number} w2 - Width (extent along Y) of the second rectangle.
 * @returns {boolean} `true` if the rectangles overlap, `false` otherwise.
 */
function rectIntersect(x1, y1, l1, w1, x2, y2, l2, w2) {
    return x1 < x2 + l2 &&
        x1 + l1 > x2 &&
        y1 < y2 + w2 &&
        y1 + w1 > y2;
}

export { optimizePacking };