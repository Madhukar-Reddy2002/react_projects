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
  
  // Z-score mapping for confidence levels
  const zScores = {
    // Two-sided test values
    80: 1.28,
    85: 1.44,
    90: 1.64,
    95: 1.96,
    99: 2.58
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
    const zAlpha = zScores[confidenceLevel];
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
          isSignificant: stats.isSignificant
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
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 rounded-lg shadow-lg">
      {/* Header */}
      <h1 className="text-4xl font-bold text-blue-700 mb-6">A/B Test Analyzer & Calculator</h1>
      
      {/* Navigation Tabs */}
      <div className="flex mb-6 border-b border-gray-300">
        <button 
          className={`py-2 px-4 font-semibold ${showDurationSection ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
          onClick={() => {
            setShowDurationSection(true);
            setShowAnalysisSection(false);
          }}
        >
          Test Duration Calculator
        </button>
        <button 
          className={`py-2 px-4 font-semibold ${showAnalysisSection ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
          onClick={() => {
            setShowDurationSection(false);
            setShowAnalysisSection(true);
          }}
        >
          Test Results Analyzer
        </button>
      </div>
      
      {/* Test Duration Calculator Section */}
      {showDurationSection && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-blue-600 mb-4 pb-2 border-b-2 border-blue-600">Test Duration Calculator</h2>
          <p className="mb-4">Calculate how long your A/B test should run based on your parameters.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-blue-500 mb-4">Test Parameters</h3>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-2 font-medium">Number of Variants (including Control)</label>
                <input
                  type="number"
                  min="2"
                  max="5"
                  value={numVariants}
                  onChange={(e) => handleVariantCountChange(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
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
                  className="w-full p-2 border border-gray-300 rounded"
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
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-2 font-medium">Daily Visitors (all variants combined)</label>
                <input
                  type="number"
                  min="1"
                  value={dailyVisitors}
                  onChange={(e) => setDailyVisitors(parseInt(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-blue-500 mb-4">Statistical Parameters</h3>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-2 font-medium">Confidence Level</label>
                <select
                  value={confidenceLevel}
                  onChange={(e) => setConfidenceLevel(parseInt(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded"
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
                  className="w-full p-2 border border-gray-300 rounded"
                >
                  <option value="80">80%</option>
                  <option value="85">85%</option>
                  <option value="90">90%</option>
                  <option value="95">95%</option>
                  <option value="99">99%</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-2 font-medium">Test Type</label>
                <select
                  value={testType}
                  onChange={(e) => setTestType(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                >
                  <option value="one_tailed">One-Tailed (Detect Improvements Only)</option>
                  <option value="two_tailed">Two-Tailed (Detect Any Difference)</option>
                </select>
              </div>
              
              <div className="bg-blue-50 p-4 rounded mt-6">
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
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded shadow-md transition duration-200"
            >
              Calculate Test Duration
            </button>
          </div>
        </div>
      )}
      
      {/* Test Analysis Section */}
      {showAnalysisSection && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-blue-600 mb-4 pb-2 border-b-2 border-blue-600">Test Results Analyzer</h2>
          <p className="mb-4">Enter your actual test results to analyze statistical significance.</p>
          
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h3 className="text-xl font-semibold text-blue-500 mb-4">Test Settings</h3>
            
            <div className="mb-4">
              <label className="block text-gray-700 mb-2 font-medium">Hypothesis Test Type</label>
              <select
                value={testType}
                onChange={(e) => setTestType(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
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
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h3 className="text-xl font-semibold text-blue-500 mb-4">Test Data</h3>
            
            {/* Control Group */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-lg text-gray-700 mb-3">Control (A)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 mb-1">Visitors</label>
                  <input
                    type="number"
                    min="1"
                    value={controlData.visitors}
                    onChange={(e) => setControlData({...controlData, visitors: parseInt(e.target.value)})}
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-1">Conversions</label>
                  <input
                    type="number"
                    min="0"
                    value={controlData.conversions}
                    onChange={(e) => setControlData({...controlData, conversions: parseInt(e.target.value)})}
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
              </div>
            </div>
            
            {/* Variant Groups */}
            {Array.from({ length: numVariants - 1 }).map((_, i) => (
              <div key={i} className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-lg text-gray-700 mb-3">Variant {String.fromCharCode(66 + i)}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 mb-1">Visitors</label>
                    <input
                      type="number"
                      min="1"
                      value={variantData[i]?.visitors || 1000}
                      onChange={(e) => updateVariantData(i, 'visitors', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-1">Conversions</label>
                    <input
                      type="number"
                      min="0"
                      value={variantData[i]?.conversions || 150}
                      onChange={(e) => updateVariantData(i, 'conversions', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 flex justify-center">
            <button
              onClick={handleAnalyzeResults}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded shadow-md transition duration-200"
            >
              Analyze Results
            </button>
          </div>
        </div>
      )}
      
      {/* Results Section */}
      {showResultsSection && durationResults && showDurationSection && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-blue-600 mb-4 pb-2 border-b-2 border-blue-600">Test Duration Results</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-blue-500 mb-4">Duration Analysis</h3>
              
              <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-500">
                <p className="text-2xl font-bold text-blue-800 mb-2">
                  {durationResults.duration} days
                </p>
                <p className="text-gray-600">Recommended test duration</p>
              </div>
              
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="font-semibold text-gray-800">Total Sample Size</p>
                  <p className="text-xl font-bold text-blue-600">{durationResults.samplesNeeded.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">visitors needed</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="font-semibold text-gray-800">Per Variant</p>
                  <p className="text-xl font-bold text-blue-600">{durationResults.samplesPerVariant.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">visitors per variant</p>
                </div>
              </div>
              
              <div className="mt-6">
                <h4 className="font-semibold text-gray-700 mb-2">Statistical Parameters</h4>
                <table className="w-full text-sm">
                  <tbody>
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
                      <td className="py-2 font-medium text-gray-800">{durationResults.zAlpha}</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-gray-600">Z-Beta:</td>
                      <td className="py-2 font-medium text-gray-800">{durationResults.zBeta}</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-gray-600">Confidence Constant:</td>
                      <td className="py-2 font-medium text-gray-800">{durationResults.confidenceConstant.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-blue-500 mb-4">Duration by Uplift</h3>
              <p className="mb-4 text-gray-600">How test duration changes with different uplift percentages:</p>
              
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={durationResults.chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="uplift" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="days" 
                      name="Test Duration (Days)"
                      stroke="#2563eb" 
                      activeDot={{ r: 8 }} 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-6">
                <h4 className="font-semibold text-gray-700 mb-2">Duration by Uplift</h4>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-2 text-left">Expected Uplift</th>
                      <th className="p-2 text-left">Test Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {durationResults.chartData.map((item, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                        <td className="p-2">{item.uplift}</td>
                        <td className="p-2 font-medium">{item.days} days</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          <div className="mt-6 bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-blue-500 mb-4">Tips for Running Your Test</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-700 mb-2">Run Complete Business Cycles</h4>
                <p className="text-gray-700 text-sm">Always run tests for at least one full week, ideally two weeks to account for day-of-week effects.</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-700 mb-2">Avoid Peeking</h4>
                <p className="text-gray-700 text-sm">Don't end your test early based on initial results. This increases the risk of false positives.</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-700 mb-2">Look Beyond Significance</h4>
                <p className="text-gray-700 text-sm">Consider practical significance in addition to statistical significance when making decisions.</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Analysis Results */}
      {showResultsSection && analysisResults && showAnalysisSection && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-blue-600 mb-4 pb-2 border-b-2 border-blue-600">Test Analysis Results</h2>
          
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h3 className="text-xl font-semibold text-blue-500 mb-4">Results Summary</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-3 text-left">Variant</th>
                    <th className="p-3 text-left">Visitors</th>
                    <th className="p-3 text-left">Conversions</th>
                    <th className="p-3 text-left">Conv. Rate</th>
                    <th className="p-3 text-left">Uplift</th>
                    <th className="p-3 text-left">Confidence</th>
                    <th className="p-3 text-left">Significance</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Control Row */}
                  <tr className="border-b">
                    <td className="p-3 font-medium">A (Control)</td>
                    <td className="p-3">{analysisResults.control.visitors.toLocaleString()}</td>
                    <td className="p-3">{analysisResults.control.conversions.toLocaleString()}</td>
                    <td className="p-3">{analysisResults.control.conversionRate.toFixed(2)}%</td>
                    <td className="p-3">-</td>
                    <td className="p-3">-</td>
                    <td className="p-3">-</td>
                  </tr>
                  
                  {/* Variant Rows */}
                  {analysisResults.variants.map((variant, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                      <td className="p-3 font-medium">{variant.variant}</td>
                      <td className="p-3">{variant.visitors.toLocaleString()}</td>
                      <td className="p-3">{variant.conversions.toLocaleString()}</td>
                      <td className="p-3">{variant.conversionRate.toFixed(2)}%</td>
                      <td className={`p-3 ${variant.uplift > 0 ? 'text-green-600' : 'text-red-600'} font-medium`}>
                        {variant.uplift > 0 ? '+' : ''}{variant.uplift.toFixed(2)}%
                      </td>
                      <td className="p-3">{variant.confidence.toFixed(2)}%</td>
                      <td className="p-3">
                        {variant.isSignificant ? (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                            Significant
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                            Not Significant
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-blue-500 mb-4">Interpretation</h3>
              
              {analysisResults.variants.some(v => v.isSignificant) ? (
                <div className="p-4 bg-green-50 border-l-4 border-green-500 text-green-700">
                  <p className="font-medium">Significant results detected!</p>
                  <p className="mt-2">
                    At least one variant shows a statistically significant difference from the control.
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-gray-50 border-l-4 border-gray-500 text-gray-700">
                  <p className="font-medium">No significant results detected.</p>
                  <p className="mt-2">
                    None of the variants show a statistically significant difference from the control at the 95% confidence level.
                  </p>
                </div>
              )}
              
              <div className="mt-6">
                <h4 className="font-semibold text-gray-700 mb-2">What this means:</h4>
                <ul className="list-disc pl-5 space-y-2 text-gray-700">
                  <li>
                    Statistical significance (95%+ confidence) indicates the difference is unlikely to be due to random chance.
                  </li>
                  <li>
                    Consider practical significance too - a small uplift might be statistically significant but not worth implementing.
                  </li>
                  <li>
                    For inconclusive tests, consider extending the test duration or increasing sample size.
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-blue-500 mb-4">Visualization</h3>
              
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="variant" 
                      type="category" 
                      data={[
                        { variant: 'A', rate: analysisResults.control.conversionRate },
                        ...analysisResults.variants.map(v => ({ 
                          variant: v.variant, 
                          rate: v.conversionRate 
                        }))
                      ]} 
                    />
                    <YAxis domain={['dataMin - 1', 'dataMax + 1']} />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      data={[
                        { variant: 'A', rate: analysisResults.control.conversionRate },
                        ...analysisResults.variants.map(v => ({ 
                          variant: v.variant, 
                          rate: v.conversionRate 
                        }))
                      ]}
                      dataKey="rate" 
                      name="Conversion Rate (%)"
                      stroke="#2563eb" 
                      activeDot={{ r: 8 }} 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-6">
                <h4 className="font-semibold text-gray-700 mb-2">Next Steps</h4>
                <div className="p-4 bg-blue-50 rounded-lg text-blue-700">
                  {analysisResults.variants.some(v => v.isSignificant && v.uplift > 0) ? (
                    <p>
                      Consider implementing the winning variant(s) and conducting follow-up tests to verify results.
                    </p>
                  ) : (
                    <p>
                      Review your test design and consider testing more substantial changes or extending test duration.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-gray-200 text-center text-gray-500 text-sm">
        <p>A/B Test Analyzer Tool © 2025</p>
        <p className="mt-1">
          This tool implements standard statistical methods for A/B testing. Always consult with a statistics professional for critical business decisions.
        </p>
      </div>
    </div>
  );
}
