import { useState } from 'react';
import { LineChart, XAxis, YAxis, CartesianGrid, Line, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function ABTestAnalyzer() {
  // Input state - Test parameters
  const [numVariants, setNumVariants] = useState(2);
  const [conversionRate, setConversionRate] = useState(15);
  const [expectedUplift, setExpectedUplift] = useState(10);
  const [dailyVisitors, setDailyVisitors] = useState(350);
  const [confidenceLevel, setConfidenceLevel] = useState(80);
  const [power, setPower] = useState(80);
  const [testType, setTestType] = useState('one_tailed');
  
  // Input state - Actual test data
  const [controlData, setControlData] = useState({ visitors: 1000, conversions: 150 });
  const [variantData, setVariantData] = useState([
    { visitors: 1000, conversions: 180 },
    { visitors: 1000, conversions: 165 },
    { visitors: 1000, conversions: 155 }
  ]);
  
  // Results state
  const [durationResults, setDurationResults] = useState(null);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [showDurationSection, setShowDurationSection] = useState(true);
  const [showAnalysisSection, setShowAnalysisSection] = useState(false);
  const [showResultsSection, setShowResultsSection] = useState(false);
  
  // Z-score mapping for confidence levels - separated by test type
  const zScores = {
    one_tailed: {
      80: 0.84,
      85: 1.04,
      90: 1.28,
      95: 1.645,
      99: 2.33
    },
    two_tailed: {
      80: 1.28,
      85: 1.44,
      90: 1.645,
      95: 1.96,
      99: 2.58
    }
  };
  
  // Z-score mapping for power
  const powerScores = {
    80: 0.84,
    85: 1.04,
    90: 1.28,
    95: 1.64,
    99: 2.33
  };
  
  // Calculate test duration using the provided formula
  const calculateTestDuration = () => {
    // Choose appropriate Z-Alpha based on test type
    const zAlpha = zScores[testType][confidenceLevel];
    const zBeta = powerScores[power];
    
    // ConfidenceConstant = 2*(Z_alpha + Z_beta)^2
    const confidenceConstant = 2 * Math.pow((zAlpha + zBeta), 2);
    
    // Convert percentage values to decimals
    const cr = conversionRate / 100;
    const uplift = expectedUplift / 100;
    
    // Test Duration (Days) = (Variants * ConfidenceConstant * POWER(SQRT(CR*(1-CR))/(CR*Uplift),2))/DailyVisitors
    const numerator = numVariants * confidenceConstant * Math.pow(Math.sqrt(cr * (1 - cr)) / (cr * uplift), 2);
    const duration = numerator / dailyVisitors;
    
    // Calculate samples needed
    const samplesNeeded = Math.ceil(duration * dailyVisitors);
    const samplesPerVariant = Math.ceil(samplesNeeded / numVariants);
    
    // Create chart data for different uplift levels
    const chartData = [];
    const upliftLevels = [5, 10, 15, 20, 25];
    
    for (let upliftLevel of upliftLevels) {
      const upliftDecimal = upliftLevel / 100;
      const formula = numVariants * confidenceConstant * Math.pow(Math.sqrt(cr * (1 - cr)) / (cr * upliftDecimal), 2);
      const days = formula / dailyVisitors;
      
      chartData.push({
        uplift: upliftLevel + '%',
        days: Math.ceil(days)
      });
    }
    
    return {
      confidenceConstant,
      zAlpha,
      zBeta,
      duration: Math.ceil(duration),
      samplesNeeded,
      samplesPerVariant,
      chartData
    };
  };
  
  // Calculate statistical significance
  const calculateSignificance = (convA, nA, convB, nB, testType = 'one_tailed') => {
    const pA = convA / nA;
    const pB = convB / nB;
    const pPool = (convA + convB) / (nA + nB);
    
    const se = Math.sqrt(pPool * (1 - pPool) * (1/nA + 1/nB));
    const z = (pB - pA) / se;
    
    // Calculate p-value based on test type
    let pValue;
    if (testType === 'one_tailed') {
      // One-tailed test (testing if variant is better)
      pValue = 1 - normalCDF(z);
    } else {
      // Two-tailed test (testing if there's any difference)
      pValue = 2 * (1 - normalCDF(Math.abs(z)));
    }
    
    const confidence = (1 - pValue) * 100;
    const uplift = ((pB - pA) / pA) * 100;
    
    return {
      confidence: Math.round(confidence * 100) / 100,
      pA: Math.round(pA * 10000) / 100,
      pB: Math.round(pB * 10000) / 100,
      uplift: Math.round(uplift * 100) / 100,
      pValue: Math.round(pValue * 10000) / 10000,
      isSignificant: confidence >= 95
    };
  };
  
  // Calculate required conversions to reach significance
  const calculateRequiredConversions = (nA, convA, nB, confidenceLevel, testType) => {
    const pA = convA / nA; // Control conversion rate
    const z = zScores[testType][confidenceLevel];
    
    const se = Math.sqrt(pA * (1 - pA) * (2 / nB));
    const minPB = pA + z * se;
    const requiredConvB = minPB * nB;
    
    return Math.ceil(requiredConvB);
  };
  
  // Standard normal cumulative distribution function
  const normalCDF = (x) => {
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp(-x * x / 2);
    let prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    if (x > 0) {
      prob = 1 - prob;
    }
    return prob;
  };
  
  // Handle the form submission for test duration
  const handleCalculateDuration = () => {
    const results = calculateTestDuration();
    setDurationResults(results);
    setShowResultsSection(true);
  };
  
  // Handle the form submission for test analysis
  const handleAnalyzeResults = () => {
    const controlVisitors = controlData.visitors;
    const controlConversions = controlData.conversions;
    const controlRate = (controlConversions / controlVisitors) * 100;
    
    const results = [];
    
    // Calculate for each variant
    for (let i = 0; i < numVariants - 1; i++) {
      if (i < variantData.length) {
        const variantVisitors = variantData[i].visitors;
        const variantConversions = variantData[i].conversions;
        
        const stats = calculateSignificance(
          controlConversions, controlVisitors,
          variantConversions, variantVisitors,
          testType
        );
        
        // Calculate required conversions for different confidence levels
        const requiredConversionsTable = [80, 85, 90, 95, 99].map(level => ({
          level,
          conversions: calculateRequiredConversions(
            controlVisitors, controlConversions, 
            variantVisitors, level, 
            testType
          ),
          current: variantConversions
        }));
        
        results.push({
          variant: String.fromCharCode(66 + i), // B, C, D...
          visitors: variantVisitors,
          conversions: variantConversions,
          conversionRate: stats.pB,
          control: {
            conversionRate: stats.pA
          },
          uplift: stats.uplift,
          confidence: stats.confidence,
          pValue: stats.pValue,
          isSignificant: stats.isSignificant,
          requiredConversionsTable
        });
      }
    }
    
    setAnalysisResults({
      control: {
        variant: 'A',
        visitors: controlVisitors,
        conversions: controlConversions,
        conversionRate: controlRate
      },
      variants: results
    });
    
    setShowResultsSection(true);
  };

  // Update number of variants in the form
  const handleVariantCountChange = (value) => {
    const newCount = parseInt(value);
    setNumVariants(newCount);
    
    // Ensure we have enough variant data objects
    if (newCount > variantData.length + 1) {
      const newVariantData = [...variantData];
      for (let i = variantData.length; i < newCount - 1; i++) {
        newVariantData.push({ visitors: 1000, conversions: 150 });
      }
      setVariantData(newVariantData);
    }
  };
  
  // Update variant data
  const updateVariantData = (index, field, value) => {
    const newVariantData = [...variantData];
    newVariantData[index] = { 
      ...newVariantData[index], 
      [field]: parseInt(value) 
    };
    setVariantData(newVariantData);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen">
      <div className="backdrop-blur-md bg-white/70 rounded-2xl shadow-xl p-6 md:p-8 mb-6">
        {/* Header */}
        <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-6 text-center">A/B Test Analyzer & Calculator</h1>
        
        {/* Navigation Tabs */}
        <div className="flex flex-wrap md:flex-nowrap mb-6 justify-center">
          <button 
            className={`py-2 px-4 rounded-lg font-semibold transition duration-200 mx-1 ${showDurationSection ? 'bg-blue-600 text-white shadow-lg' : 'bg-white/80 text-gray-600 hover:bg-blue-100 shadow-md'}`}
            onClick={() => {
              setShowDurationSection(true);
              setShowAnalysisSection(false);
            }}
          >
            Test Duration Calculator
          </button>
          <button 
            className={`py-2 px-4 rounded-lg font-semibold transition duration-200 mx-1 ${showAnalysisSection ? 'bg-blue-600 text-white shadow-lg' : 'bg-white/80 text-gray-600 hover:bg-blue-100 shadow-md'}`}
            onClick={() => {
              setShowDurationSection(false);
              setShowAnalysisSection(true);
            }}
          >
            Test Results Analyzer
          </button>
        </div>
      </div>
      
      {/* Test Duration Calculator Section */}
      {showDurationSection && (
        <div className="mb-8">
          <div className="backdrop-blur-md bg-white/70 rounded-2xl shadow-xl p-6 md:p-8 mb-6">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-4 pb-2 border-b-2 border-blue-200">Test Duration Calculator</h2>
            <p className="mb-4 text-gray-700">Calculate how long your A/B test should run based on your parameters.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="backdrop-blur-sm bg-white/50 p-6 rounded-xl shadow-md hover:shadow-lg transition duration-300">
                <h3 className="text-xl font-semibold text-blue-600 mb-4">Test Parameters</h3>
                
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2 font-medium">Number of Variants (including Control)</label>
                  <input
                    type="number"
                    min="2"
                    max="5"
                    value={numVariants}
                    onChange={(e) => handleVariantCountChange(e.target.value)}
                    className="w-full p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition shadow-sm"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2 font-medium">Baseline Conversion Rate (%)</label>
                  <input
                    type="number"
                    min="0.1"
                    max="100"
                    step="0.1"
                    value={conversionRate}
                    onChange={(e) => setConversionRate(parseFloat(e.target.value))}
                    className="w-full p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition shadow-sm"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2 font-medium">Expected Uplift (%)</label>
                  <input
                    type="number"
                    min="0.1"
                    max="100"
                    step="0.1"
                    value={expectedUplift}
                    onChange={(e) => setExpectedUplift(parseFloat(e.target.value))}
                    className="w-full p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition shadow-sm"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2 font-medium">Daily Visitors (all variants combined)</label>
                  <input
                    type="number"
                    min="1"
                    value={dailyVisitors}
                    onChange={(e) => setDailyVisitors(parseInt(e.target.value))}
                    className="w-full p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition shadow-sm"
                  />
                </div>
              </div>
              
              <div className="backdrop-blur-sm bg-white/50 p-6 rounded-xl shadow-md hover:shadow-lg transition duration-300">
                <h3 className="text-xl font-semibold text-blue-600 mb-4">Statistical Parameters</h3>
                
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2 font-medium">Test Type</label>
                  <select
                    value={testType}
                    onChange={(e) => setTestType(e.target.value)}
                    className="w-full p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition shadow-sm"
                  >
                    <option value="one_tailed">One-Tailed (Detect Improvements Only)</option>
                    <option value="two_tailed">Two-Tailed (Detect Any Difference)</option>
                  </select>
                  <p className="mt-1 text-sm text-gray-500">
                    {testType === 'one_tailed' 
                      ? "One-tailed has more power to detect positive improvements." 
                      : "Two-tailed can detect both positive and negative changes."}
                  </p>
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2 font-medium">Confidence Level</label>
                  <select
                    value={confidenceLevel}
                    onChange={(e) => setConfidenceLevel(parseInt(e.target.value))}
                    className="w-full p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition shadow-sm"
                  >
                    <option value="80">80%</option>
                    <option value="85">85%</option>
                    <option value="90">90%</option>
                    <option value="95">95%</option>
                    <option value="99">99%</option>
                  </select>
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2 font-medium">Statistical Power</label>
                  <select
                    value={power}
                    onChange={(e) => setPower(parseInt(e.target.value))}
                    className="w-full p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition shadow-sm"
                  >
                    <option value="80">80%</option>
                    <option value="85">85%</option>
                    <option value="90">90%</option>
                    <option value="95">95%</option>
                    <option value="99">99%</option>
                  </select>
                </div>
                
                <div className="bg-blue-50/70 p-4 rounded-lg mt-6 backdrop-blur-sm shadow-inner">
                  <p className="text-sm text-blue-700">
                    <strong>Formula Used:</strong> Test Duration (Days) = (Variants * ConfidenceConstant * POWER(SQRT(CR*(1-CR))/(CR*Uplift),2))/DailyVisitors
                  </p>
                  <p className="text-sm text-blue-700 mt-2">
                    <strong>Where:</strong> ConfidenceConstant = 2*(Z_alpha + Z_beta)^2
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-center">
              <button
                onClick={handleCalculateDuration}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:shadow-xl transition duration-200"
              >
                Calculate Test Duration
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Test Analysis Section */}
      {showAnalysisSection && (
        <div className="mb-8">
          <div className="backdrop-blur-md bg-white/70 rounded-2xl shadow-xl p-6 md:p-8 mb-6">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-4 pb-2 border-b-2 border-blue-200">Test Results Analyzer</h2>
            <p className="mb-4 text-gray-700">Enter your actual test results to analyze statistical significance.</p>
            
            <div className="backdrop-blur-sm bg-white/50 p-6 rounded-xl shadow-md mb-6 hover:shadow-lg transition duration-300">
              <h3 className="text-xl font-semibold text-blue-600 mb-4">Test Settings</h3>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-2 font-medium">Hypothesis Test Type</label>
                <select
                  value={testType}
                  onChange={(e) => setTestType(e.target.value)}
                  className="w-full p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition shadow-sm"
                >
                  <option value="one_tailed">One-Tailed (Detect Improvements Only)</option>
                  <option value="two_tailed">Two-Tailed (Detect Any Difference)</option>
                </select>
                <p className="mt-1 text-sm text-gray-500">
                  {testType === 'one_tailed' 
                    ? "One-tailed tests if variant is better than control. Good for optimization testing." 
                    : "Two-tailed tests if there's any difference. More scientifically rigorous."}
                </p>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-2 font-medium">Number of Variants (including Control)</label>
                <input
                  type="number"
                  min="2"
                  max="5"
                  value={numVariants}
                  onChange={(e) => handleVariantCountChange(e.target.value)}
                  className="w-full p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition shadow-sm"
                />
              </div>
            </div>
            
            <div className="backdrop-blur-sm bg-white/50 p-6 rounded-xl shadow-md mb-6 hover:shadow-lg transition duration-300">
              <h3 className="text-xl font-semibold text-blue-600 mb-4">Test Data</h3>
              
              {/* Control Group */}
              <div className="mb-6 p-4 bg-white/50 rounded-lg shadow-inner backdrop-blur-sm">
                <h4 className="font-semibold text-lg text-blue-700 mb-3">Control (A)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 mb-1">Visitors</label>
                    <input
                      type="number"
                      min="1"
                      value={controlData.visitors}
                      onChange={(e) => setControlData({...controlData, visitors: parseInt(e.target.value)})}
                      className="w-full p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-1">Conversions</label>
                    <input
                      type="number"
                      min="0"
                      value={controlData.conversions}
                      onChange={(e) => setControlData({...controlData, conversions: parseInt(e.target.value)})}
                      className="w-full p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition shadow-sm"
                    />
                  </div>
                </div>
              </div>
              
              {/* Variant Groups */}
              {Array.from({ length: numVariants - 1 }).map((_, i) => (
                <div key={i} className="mb-6 p-4 bg-white/50 rounded-lg shadow-inner backdrop-blur-sm">
                  <h4 className="font-semibold text-lg text-blue-700 mb-3">Variant {String.fromCharCode(66 + i)}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 mb-1">Visitors</label>
                      <input
                        type="number"
                        min="1"
                        value={variantData[i]?.visitors || 1000}
                        onChange={(e) => updateVariantData(i, 'visitors', e.target.value)}
                        className="w-full p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-1">Conversions</label>
                      <input
                        type="number"
                        min="0"
                        value={variantData[i]?.conversions || 150}
                        onChange={(e) => updateVariantData(i, 'conversions', e.target.value)}
                        className="w-full p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition shadow-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 flex justify-center">
              <button
                onClick={handleAnalyzeResults}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:shadow-xl transition duration-200"
              >
                Analyze Results
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Results Section for Duration Calculator */}
      {showResultsSection && durationResults && showDurationSection && (
        <div className="mb-8">
          <div className="backdrop-blur-md bg-white/70 rounded-2xl shadow-xl p-6 md:p-8 mb-6">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-4 pb-2 border-b-2 border-blue-200">Test Duration Results</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="backdrop-blur-sm bg-white/50 p-6 rounded-xl shadow-md hover:shadow-lg transition duration-300">
                <h3 className="text-xl font-semibold text-blue-600 mb-4">Duration Analysis</h3>
                
                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-1 rounded-lg shadow-lg">
                  <div className="bg-white p-5 rounded-md">
                    <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-2 text-center">
                      {durationResults.duration} days
                    </p>
                    <p className="text-gray-600 text-center">Recommended test duration</p>
                  </div>
                </div>
                
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white/60 rounded-lg shadow-inner backdrop-blur-sm">
                    <p className="font-semibold text-gray-800">Total Sample Size</p>
                    <p className="text-xl font-bold text-blue-600">{durationResults.samplesNeeded.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">visitors needed</p>
                  </div>
                  <div className="p-4 bg-white/60 rounded-lg shadow-inner backdrop-blur-sm">
                    <p className="font-semibold text-gray-800">Per Variant</p>
                    <p className="text-xl font-bold text-blue-600">{durationResults.samplesPerVariant.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">visitors per variant</p>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h4 className="font-semibold text-gray-700 mb-2">Statistical Parameters</h4>
                  <div className="bg-white/60 rounded-lg shadow-inner p-4 backdrop-blur-sm">
                    <table className="w-full text-sm">
                      <tbody>
                        <tr>
                          <td className="py-2 text-gray-600">Test Type:</td>
                          <td className="py-2 font-medium text-gray-800">{testType === 'one_tailed' ? 'One-Tailed' : 'Two-Tailed'}</td>
                        </tr>
                        <tr>
                          <td className="py-2 text-gray-600">Confidence Level:</td>
                          <td className="py-2 font-medium text-gray-800">{confidenceLevel}%</td>
                        </tr>
                        <tr>
                          <td className="py-2 text-gray-600">Statistical Power:</td>
                          <td className="py-2 font-medium text-gray-800">{power}%</td>
                        </tr>
                        <tr>
                          <td className="py-2 text-gray-600">Z-Alpha:</td>
                          <td className="py-2 font-medium text-gray-800">{durationResults.zAlpha.toFixed(4)}</td>
                        </tr>
                        <tr>
                          <td className="py-2 text-gray-600">Z-Beta:</td>
                          <td className="py-2 font-medium text-gray-800">{durationResults.zBeta.toFixed(4)}</td>
                        </tr>
                        <tr>
                          <td className="py-2 text-gray-600">Confidence Constant:</td>
                          <td className="py-2 font-medium text-gray-800">{durationResults.confidenceConstant.toFixed(4)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                                  </div>
              </div>
            </div>

            {/* Duration vs Uplift Graph */}
            <div className="mt-8">
              <h3 className="text-xl font-semibold text-blue-600 mb-4">Duration vs Uplift Chart</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={durationResults.chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#c7d2fe" />
                  <XAxis dataKey="uplift" stroke="#6366f1" />
                  <YAxis stroke="#6366f1" />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="days" stroke="#6366f1" strokeWidth={3} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Test Results Analysis Section */}
      {showResultsSection && analysisResults && showAnalysisSection && (
        <div className="mb-8">
          <div className="backdrop-blur-md bg-white/70 rounded-2xl shadow-xl p-6 md:p-8 mb-6">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-6">Significance Analysis</h2>

            {/* Test Result Table */}
            <div className="overflow-x-auto rounded-lg backdrop-blur-sm bg-white/60 shadow-lg">
              <table className="w-full text-sm text-gray-700">
                <thead className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
                  <tr>
                    <th className="px-6 py-3">Variant</th>
                    <th className="px-6 py-3">Visitors</th>
                    <th className="px-6 py-3">Conversions</th>
                    <th className="px-6 py-3">Conversion Rate</th>
                    <th className="px-6 py-3">Uplift (%)</th>
                    <th className="px-6 py-3">Confidence (%)</th>
                    <th className="px-6 py-3">Significant?</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white/80">
                    <td className="px-6 py-4 font-semibold">Control (A)</td>
                    <td className="px-6 py-4">{analysisResults.control.visitors}</td>
                    <td className="px-6 py-4">{analysisResults.control.conversions}</td>
                    <td className="px-6 py-4">{analysisResults.control.conversionRate.toFixed(2)}%</td>
                    <td className="px-6 py-4">-</td>
                    <td className="px-6 py-4">-</td>
                    <td className="px-6 py-4">-</td>
                  </tr>
                  {analysisResults.variants.map((v, idx) => (
                    <tr key={idx} className="hover:bg-blue-50 transition duration-300">
                      <td className="px-6 py-4 font-semibold">Variant {v.variant}</td>
                      <td className="px-6 py-4">{v.visitors}</td>
                      <td className="px-6 py-4">{v.conversions}</td>
                      <td className="px-6 py-4">{v.conversionRate.toFixed(2)}%</td>
                      <td className="px-6 py-4">{v.uplift.toFixed(2)}%</td>
                      <td className="px-6 py-4">{v.confidence.toFixed(2)}%</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-white text-xs ${v.isSignificant ? 'bg-green-500' : 'bg-gray-400'}`}>
                          {v.isSignificant ? 'Yes' : 'No'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Helpful Next Steps */}
            <div className="mt-8 p-6 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl backdrop-blur-sm shadow-lg">
              <h3 className="text-xl font-bold text-blue-700 mb-4">Next Steps</h3>
              <ul className="list-disc space-y-2 text-gray-700 pl-6">
                <li>✅ If significant, consider deploying the winning variant.</li>
                <li>🔍 If not significant, increase sample size or extend test duration.</li>
                <li>📊 Always evaluate whether the uplift justifies operational effort.</li>
                <li>🎯 Use higher confidence (95%-99%) for important business decisions.</li>
              </ul>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
