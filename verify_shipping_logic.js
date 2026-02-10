import { calculateShippingCost } from './src/lib/shippingUtils.js';

// Mock Data
const mockRates = [
    { slab: '≤50 g', local: 19, z1: 47, z2: 47, z3: 47, z4: 47, z5: 47 },
    { slab: '51–250 g', local: 24, z1: 59, z2: 63, z3: 68, z4: 72, z5: 77 },
    { slab: '251–500 g', local: 28, z1: 70, z2: 75, z3: 82, z4: 86, z5: 93 },
    { slab: '501–1000 g', local: 38, z1: 85, z2: 95, z3: 110, z4: 120, z5: 135 },
    { slab: '1001–2000 g', local: 50, z1: 110, z2: 125, z3: 150, z4: 170, z5: 190 },
    { slab: 'Each Extra 1 kg', local: 15, z1: 25, z2: 35, z3: 45, z4: 55, z5: 65 },
];

const mockBoxes = [
    { box_id: 1, name: 'Small', length_cm: 20, width_cm: 15, height_cm: 10, weight_g: 80 },
    { box_id: 2, name: 'Medium', length_cm: 30, width_cm: 20, height_cm: 15, weight_g: 150 },
    { box_id: 3, name: 'Large', length_cm: 40, width_cm: 30, height_cm: 20, weight_g: 300 },
];

// Test Cases
const testCases = [
    {
        name: "Small Item, Short Distance (z1)",
        items: [{ product: { weight: '50 g', dimensions: '10x5x2' }, quantity: 1 }],
        distance: 100, // z1
        description: "Should fit small box, minimal weight slab"
    },
    {
        name: "Heavy Item, Long Distance (z5)",
        items: [{ product: { weight: '2.5 kg', dimensions: '20x10x10' }, quantity: 1 }],
        distance: 2500, // z5
        description: "Should trigger Extra Weight logic (>2kg)"
    },
    {
        name: "Volumetric High, Actual Low",
        items: [{ product: { weight: '100 g', dimensions: '35x25x15' }, quantity: 1 }],
        distance: 600, // z3
        description: "Should pick Large Box and charge by Volume"
    }
];

console.log("=== Running Shipping Logic Verification ===\n");

testCases.forEach((test, idx) => {
    console.log(`Test ${idx + 1}: ${test.name}`);
    console.log(`Desc: ${test.description}`);
    
    // Construct simplified order object for utils
    const orderDetails = { items: test.items };
    
    try {
        const result = calculateShippingCost(orderDetails, mockRates, mockBoxes, test.distance);
        
        console.log("  -> Selected Box:", result.selectedBox?.name);
        console.log("  -> Actual Wt:", result.actualTotalWeight, "g");
        console.log("  -> Volumetric Wt:", result.volumetricWeight, "g");
        console.log("  -> Chargeable Wt:", result.chargeableWeight, "g");
        console.log("  -> Zone:", result.zoneKey);
        console.log("  -> Applied Slab:", result.appliedSlab);
        console.log("  -> TOTAL COST: ₹", result.totalCost);
        console.log("  -> Breakdown: Base", result.baseCost, "+ Extra", result.extraCost);
        console.log("\n------------------------------------------------\n");
    } catch (e) {
        console.error("  FAILED:", e);
    }
});
