const predictYield = async (data) => {
  try {
    const { cropType, farmSize, soilType, region, plantingDate, weatherData } = data;

    const baseYields = {
      'Maize': 2.5,
      'Rice': 3.0,
      'Beans': 1.2,
      'Cassava': 8.0,
      'Sweet Potato': 6.5,
      'Sunflower': 1.8,
      'Sorghum': 2.0,
      'Millet': 1.5
    };

    const soilFactors = {
      'loamy': 1.0,
      'clay': 0.85,
      'sandy': 0.75,
      'silt': 0.9
    };

    const regionalFactors = {
      'Dar es Salaam': 0.9,
      'Arusha': 1.1,
      'Dodoma': 0.85,
      'Mwanza': 1.0,
      'Mbeya': 1.05,
      'Morogoro': 0.95,
      'Tanga': 1.0,
      'Moshi': 1.15,
      'Iringa': 1.0,
      'Kilimanjaro': 1.1
    };

    const baseYield = baseYields[cropType] || 2.0;
    const soilFactor = soilFactors[soilType] || 0.9;
    const regionalFactor = regionalFactors[region] || 1.0;
    const weatherFactor = 0.9 + Math.random() * 0.2;

    const predictedYield = farmSize * baseYield * soilFactor * regionalFactor * weatherFactor;
    const confidence = 0.7 + Math.random() * 0.2;

    const marketPrice = 800 + Math.random() * 400;
    const estimatedRevenue = predictedYield * marketPrice;

    return {
      yield: Math.round(predictedYield * 100) / 100,
      confidence: Math.round(confidence * 100) / 100,
      factors: {
        soil: soilFactor,
        region: regionalFactor,
        weather: Math.round(weatherFactor * 100) / 100
      },
      recommendations: [
        'Apply fertilizer 2 weeks after planting',
        'Ensure adequate irrigation during flowering stage',
        'Monitor for pests regularly',
        'Harvest at optimal maturity for best quality'
      ],
      estimatedRevenue: Math.round(estimatedRevenue)
    };
  } catch (error) {
    console.error('Yield prediction error:', error);
    throw error;
  }
};

const generateRecommendations = (data) => {
  const { category, region, products, prices } = data;

  const recommendations = [];

  if (products.length > 20) {
    recommendations.push('Market is saturated. Consider differentiating your product or exploring other regions.');
  } else if (products.length < 5) {
    recommendations.push('Low competition detected. Good opportunity to enter the market.');
  }

  if (prices && prices.length > 0) {
    const latestPrice = prices[0].price.average;
    const oldPrice = prices[prices.length - 1].price.average;
    
    if (latestPrice > oldPrice * 1.1) {
      recommendations.push('Prices are rising. Good time to sell.');
    } else if (latestPrice < oldPrice * 0.9) {
      recommendations.push('Prices are falling. Consider holding inventory if possible.');
    }
  }

  recommendations.push('Maintain high quality standards to command premium prices.');
  recommendations.push('Build strong relationships with buyers for repeat business.');

  return recommendations;
};

module.exports = { predictYield, generateRecommendations };



