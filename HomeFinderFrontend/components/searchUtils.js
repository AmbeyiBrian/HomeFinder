// searchUtils.js

const searchProperties = (properties, searchTerm) => {
  if (!searchTerm) return properties;

  const searchTermLower = searchTerm.toLowerCase().trim();

  return properties.filter(property => {
    // Convert all searchable values to strings and lowercase for comparison
    const searchableFields = {
      title: property.title?.toLowerCase() || '',
      description: property.description?.toLowerCase() || '',
      price: property.price?.toString() || '',
      location: [
        property.address,
        property.city,
        property.state,
        property.zip_code
      ].filter(Boolean).join(' ').toLowerCase(),
      propertyType: property.property_type?.name?.toLowerCase() || '',
      listingType: property.listing_type?.toLowerCase() || '',
      features: [
        `${property.bedrooms} bedroom`,
        `${property.bathrooms} bathroom`,
        `${property.square_feet} sqft`
      ].join(' ').toLowerCase(),
      status: property.status?.toLowerCase() || ''
    };

    // Search through all fields
    return Object.values(searchableFields).some(field =>
      field.includes(searchTermLower)
    );
  });
};

// Helper function to format price ranges for searching
const getPriceRange = (searchTerm) => {
  // Match patterns like "under 500k", "500k-1m", "above 1m"
  const priceMatches = searchTerm.match(/(\d+[km])-(\d+[km])|under (\d+[km])|above (\d+[km])/i);

  if (!priceMatches) return null;

  const convertToNumber = (value) => {
    if (!value) return null;
    const num = parseInt(value.replace(/[km]/i, ''));
    if (value.toLowerCase().includes('k')) return num * 1000;
    if (value.toLowerCase().includes('m')) return num * 1000000;
    return num;
  };

  if (priceMatches[1] && priceMatches[2]) {
    // Range: "500k-1m"
    return {
      min: convertToNumber(priceMatches[1]),
      max: convertToNumber(priceMatches[2])
    };
  } else if (priceMatches[3]) {
    // Under: "under 500k"
    return {
      min: 0,
      max: convertToNumber(priceMatches[3])
    };
  } else if (priceMatches[4]) {
    // Above: "above 1m"
    return {
      min: convertToNumber(priceMatches[4]),
      max: Number.MAX_SAFE_INTEGER
    };
  }

  return null;
};

// Advanced search function with special terms handling
const advancedSearchProperties = (properties, searchTerm) => {
  if (!searchTerm) return properties;

  const searchTermLower = searchTerm.toLowerCase().trim();

  // Handle special search terms
  const specialTerms = {
    bedrooms: /(\d+)\s*bed(room)?s?/i,
    bathrooms: /(\d+)\s*bath(room)?s?/i,
    priceRange: /(under|above|between)\s*(\d+[km])/i,
    propertyType: /(house|apartment|office|land)/i,
    listingType: /(sale|rent)/i
  };

  // Extract special terms
  const priceRange = getPriceRange(searchTermLower);
  const bedroomMatch = searchTermLower.match(specialTerms.bedrooms);
  const bathroomMatch = searchTermLower.match(specialTerms.bathrooms);
  const propertyTypeMatch = searchTermLower.match(specialTerms.propertyType);
  const listingTypeMatch = searchTermLower.match(specialTerms.listingType);

  return properties.filter(property => {
    let matches = true;

    // Price range filtering
    if (priceRange) {
      const propertyPrice = parseFloat(property.price);
      matches = matches && propertyPrice >= priceRange.min && propertyPrice <= priceRange.max;
    }

    // Bedroom filtering
    if (bedroomMatch) {
      matches = matches && property.bedrooms === parseInt(bedroomMatch[1]);
    }

    // Bathroom filtering
    if (bathroomMatch) {
      matches = matches && property.bathrooms === parseInt(bathroomMatch[1]);
    }

    // Property type filtering
    if (propertyTypeMatch) {
      matches = matches && property.property_type.name.toLowerCase() === propertyTypeMatch[1].toLowerCase();
    }

    // Listing type filtering
    if (listingTypeMatch) {
      matches = matches && property.listing_type.toLowerCase() === listingTypeMatch[1].toLowerCase();
    }

    // If no special terms matched, do a general search
    if (!priceRange && !bedroomMatch && !bathroomMatch && !propertyTypeMatch && !listingTypeMatch) {
      const searchableText = [
        property.title,
        property.description,
        property.address,
        property.city,
        property.state,
        property.property_type.name
      ].filter(Boolean).join(' ').toLowerCase();

      matches = searchableText.includes(searchTermLower);
    }

    return matches;
  });
};

export { searchProperties, advancedSearchProperties };