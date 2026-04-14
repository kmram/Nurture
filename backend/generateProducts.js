const fs = require('fs');
const path = require('path');

const categories = [
    {
        type: "Honeymoon",
        locations: ["Maldives", "Bora Bora", "Paris", "Santorini", "Amalfi Coast", "Seychelles", "Fiji", "Venice", "Kyoto", "Bali", "Maui", "Tahiti", "Lucerne", "Capri", "Zanzibar"],
        resortNames: ["Four Seasons", "St. Regis", "Aman", "Rosewood", "Six Senses", "One&Only", "Ritz-Carlton", "Waldorf Astoria", "Bvlgari", "Capella"],
        vibes: ["Romantic, Secluded, Beach", "Romantic, Cultural, Historic", "Intimate, Scenic, Tranquil", "Luxury, Oceanfront, Exclusive", "Cliffside, Vibrant, Exclusive"],
        amenities: ["Private Pool", "Overwater Villa", "Couples Spa Treatment", "Candlelight Beach Dining", "Butler Service", "Sunset Cruise", "Champagne on Arrival"]
    },
    {
        type: "Family holidays",
        locations: ["Orlando", "Tokyo", "Gold Coast", "Hawaii", "Costa Rica", "London", "Rome", "Cancun", "Phuket", "San Diego", "Dubai", "Singapore", "Sydney", "Barcelona"],
        resortNames: ["Disney Grand Floridian", "Atlantis", "Hyatt Regency", "Club Med", "JW Marriott", "Hilton Grand Vacations", "Beaches Resort", "Four Seasons", "Ritz-Carlton Reserve"],
        vibes: ["Fun, Active, Kid-Friendly", "Relaxing, Spacious, Entertaining", "Cultural, Educational, Safe", "Resort-Style, Beach, Active"],
        amenities: ["Kids Club", "Water Park Access", "Connecting Rooms", "Family Excursions", "Babysitting Services", "All-Inclusive Dining", "Private Cinema"]
    },
    {
        type: "Safari Trips",
        locations: ["Serengeti, Tanzania", "Kruger, South Africa", "Masai Mara, Kenya", "Okavango Delta, Botswana", "Chobe, Botswana", "Etosha, Namibia", "Ngorongoro, Tanzania", "South Luangwa, Zambia"],
        resortNames: ["Singita", "andBeyond", "Wilderness Safaris", "Elewana", "Great Plains Conservation", "Asilia Africa", "Porini", "Sabi Sabi", "Lion Sands"],
        vibes: ["Wild, Adventurous, Remote", "Luxury, Wildlife, Exciting", "Scenic, Untamed, Exclusive", "Photographic, Immersive, Rustic Luxury"],
        amenities: ["Daily Game Drives", "Private Plunge Pool", "Outdoor Shower", "Guided Bush Walks", "Sundowners", "Binoculars Provided", "Helicopter Transfer"]
    },
    {
        type: "Cruises",
        locations: ["Caribbean", "Mediterranean", "Alaskan", "Norwegian Fjords", "Greek Isles", "Galapagos", "Rhine River", "Danube River", "Antarctica", "French Polynesia"],
        resortNames: ["Silversea", "Seabourn", "Regent Seven Seas", "Crystal Cruises", "Viking Ocean", "Oceania Cruises", "Azamara", "Ponant", "Scenic Luxury"],
        vibes: ["Relaxing, Scenic, Multi-Destination", "Cultural, Historic, Coastal", "Expedition, Wildlife, Adventurous", "Luxury, All-Inclusive, Elegant"],
        amenities: ["Ocean View Balcony", "Multiple Fine Dining venues", "Spa Access", "Specialized Shore Excursions", "Evening Entertainment", "Butler Service", "Unlimited Premium WiFi"]
    },
    {
        type: "Adventure Trips",
        locations: ["Patagonia", "New Zealand", "Banff", "Swiss Alps", "Iceland", "Machu Picchu", "Costa Rica", "Nepal", "Galapagos", "Zion National Park", "Moab", "Namib Desert"],
        resortNames: ["Explora", "Tierra", "Awasi", "Inkaterra", "Mashpi Lodge", "Clayoquot Wilderness", "Icehotel", "Longitude 131", "Nayara Tented Camp", "Amangiri"],
        vibes: ["Active, Thrilling, Rugged", "Nature, Energetic, Breathtaking", "High-Altitude, Challenging, Rewarding", "Extreme, Scenic, Remote"],
        amenities: ["Guided Hiking", "Mountain Biking", "Kayaking", "Pro Gear Provided", "Recovery Spa", "Expert Local Guides", "Stargazing Observatory"]
    },
    {
        type: "Skiing",
        locations: ["Whistler", "Chamonix", "Zermatt", "Aspen", "Niseko", "St. Moritz", "Courchevel", "Val d'Isere", "Queenstown", "Banff", "Park City", "Vail", "Cortina d'Ampezzo"],
        resortNames: ["Fairmont", "Four Seasons", "Aman", "The Chedi", "Kempinski", "Badrutt's Palace", "Cheval Blanc", "Montage", "Ritz-Carlton", "W Hotel"],
        vibes: ["Snowy, Active, Alpine", "Luxurious, Apres-Ski, Scenic", "Charming, Village, Welcoming", "Extreme, High-Altitude, Thrilling"],
        amenities: ["Ski-In/Ski-Out", "Equipment Valet", "Heated Pool", "Apres-Ski Lounge", "Private Instructor", "Lift Passes Included", "Gourmet Fondue Experience"]
    }
];

function getRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

const packages = [];
let idCounter = 1;

// Ensure we get a good mix
for (let i = 0; i < 100; i++) {
    // Cycle categories to get a balanced distribution
    const category = categories[i % categories.length];
    const loc = getRandom(category.locations);
    const brand = getRandom(category.resortNames);
    const vibe = getRandom(category.vibes);

    let ams = [];
    while (ams.length < 4) {
        let a = getRandom(category.amenities);
        if (!ams.includes(a)) ams.push(a);
    }

    let basePrice = 2000;
    if (category.type === "Safari Trips" || category.type === "Cruises") basePrice = 6000;
    if (category.type === "Honeymoon") basePrice = 4000;
    if (category.type === "Skiing") basePrice = 5000;

    const price = basePrice + Math.floor(Math.random() * 60) * 100; // Adds 0 to 6000

    // Optional hard constraints handled logic for realism
    const constraints = [];
    if (category.type !== "Skiing" && category.type !== "Adventure Trips") constraints.push("No intensive physical activity");
    if (category.type === "Family holidays") constraints.push("Must allow children under 10");
    else if (category.type === "Honeymoon") constraints.push("Adults only preferred");

    packages.push({
        id: `PKG-${idCounter.toString().padStart(3, '0')}`,
        resort_name: `${brand} ${loc}`,
        region: loc,
        package_type: category.type,
        vibe: vibe,
        price_gbp: price,
        duration_days: [5, 7, 7, 10, 14][Math.floor(Math.random() * 5)],
        key_amenities: ams,
        hard_constraints_handled: constraints
    });
    idCounter++;
}

// Scramble the array to mix them up
for (let i = packages.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [packages[i], packages[j]] = [packages[j], packages[i]];
}

const targetFile = path.join(__dirname, '../docs/products.json');
fs.writeFileSync(targetFile, JSON.stringify({ sample_packages: packages }, null, 2));
console.log(`Generated ${packages.length} packages successfully to products.json`);
