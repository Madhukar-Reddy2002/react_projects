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
  const [confidenceVsDurationData, setConfidenceVsDurationData] = useState([]);

  
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
    const upliftLevels = [5, 8, 10, 12.5, 15, 20, 25];
    
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

  const se = Math.sqrt(pPool * (1 - pPool) * (1 / nA + 1 / nB));
  const z = (pB - pA) / se;

  // Updated p-value calculation
  let pValue;
  if (testType === 'one_tailed') {
    pValue = 1 - normalCDF(Math.abs(z));
  } else {
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
  const pA = convA / nA;
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

  // Now generate Confidence Level vs Duration Graph Data
  const confidenceLevels = [80, 85, 90, 95, 99];
  const simulatedData = confidenceLevels.map(level => {
    const zAlpha = zScores[testType][level];
    const zBeta = powerScores[power];
    const confidenceConstant = 2 * Math.pow((zAlpha + zBeta), 2);
    const cr = conversionRate / 100;
    const uplift = expectedUplift / 100;
    const numerator = numVariants * confidenceConstant * Math.pow(Math.sqrt(cr * (1 - cr)) / (cr * uplift), 2);
    const duration = numerator / dailyVisitors;
    return {
      confidenceLevel: `${level}%`,
      duration: Math.ceil(duration)
    };
  });

  setConfidenceVsDurationData(simulatedData);
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-200 via-blue-100 to-white p-4 md:p-6">
      <div className="backdrop-blur-lg bg-white/20 border border-white/30 rounded-2xl shadow-2xl p-6 md:p-8 mb-8">
  {/* Header */}
  <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-blue-500 to-cyan-400 mb-8 text-center tracking-tight drop-shadow-lg">
    A/B Test Analyzer & Calculator
  </h1>

  {/* Navigation Tabs */}
  <div className="flex flex-col md:flex-row justify-center gap-4">
    <button 
  className={`w-full md:w-auto py-3 px-6 rounded-full font-semibold transition-all duration-300 ease-in-out cursor-pointer transform hover:scale-105 ${
    showDurationSection 
      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-700' 
      : 'bg-white/50 text-gray-700 border border-blue-300 hover:bg-blue-100 hover:border-blue-400 shadow-md hover:shadow-lg hover:text-blue-800'
  }`}
  onClick={() => {
    setShowDurationSection(true);
    setShowAnalysisSection(false);
  }}
>
  Test Duration Calculator
</button>

<button 
  className={`w-full md:w-auto py-3 px-6 rounded-full font-semibold transition-all duration-300 ease-in-out cursor-pointer transform hover:scale-105 ${
    showAnalysisSection 
      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-700' 
      : 'bg-white/50 text-gray-700 border border-blue-300 hover:bg-blue-100 hover:border-blue-400 shadow-md hover:shadow-lg hover:text-blue-800'
  }`}
  onClick={() => {
    setShowDurationSection(false);
    setShowAnalysisSection(true);
  }}
>
  Significance Calculator
</button>
  </div>
</div>
      
      {/* Test Duration Calculator Section */}
      {showDurationSection && (
  <div className="mb-8">
    <div className="backdrop-blur-lg bg-white/20 border border-white/30 rounded-2xl shadow-2xl p-6 md:p-8 mb-8">
      <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-6 text-center tracking-tight">
        Test Duration Calculator
      </h2>
      <p className="mb-8 text-gray-700 text-center max-w-2xl mx-auto">
        Quickly estimate how many days your A/B test should run based on traffic, baseline performance, and your expected uplift.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Card - Test Parameters */}
        <div className="backdrop-blur-sm bg-white/30 border border-white/40 p-6 rounded-2xl shadow-md hover:shadow-lg transition duration-300">
          <h3 className="text-xl font-bold text-blue-700 mb-6">Test Parameters</h3>

          <div className="space-y-6">

            {/* Daily Visitors */}
            <div>
              <label className="block text-gray-700 mb-2 font-medium">Daily Visitors (all variants)</label>
              <input
                type="number"
                min="1"
                value={dailyVisitors}
                onChange={(e) => setDailyVisitors(parseInt(e.target.value))}
                className="w-full p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition shadow-sm"
              />
            </div>

            {/* Baseline Conversion Rate */}
            <div>
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

            {/* Minimum Detectable Uplift */}
            <div>
              <label className="block text-gray-700 mb-2 font-medium">Minimum Detectable Effect (Expected Uplift %)</label>
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

            {/* Number of Variants */}
            {/* Number of Variants */}
<div>
  <label className="block text-gray-700 mb-2 font-medium">Number of Variants (including Control)</label>
  
  <div className="flex items-center space-x-3">
  {/* Minus Button */}
  <button
    type="button"
    onClick={() => handleVariantCountChange(Math.max(2, numVariants - 1))}
    className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold rounded-lg transition-all duration-200 ease-in-out cursor-pointer transform hover:scale-105 hover:shadow-md"
  >
    <svg 
      width="16" 
      height="16" 
      viewBox="0 0 24 24" 
      fill="none" 
      className="transition-transform duration-200 ease-in-out hover:scale-110"
    >
      <path 
        d="M5 12h14" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round"
      />
    </svg>
  </button>

  {/* Number Display */}
  <input
    type="number"
    min="2"
    max="5"
    value={numVariants}
    onChange={(e) => handleVariantCountChange(e.target.value)}
    className="w-20 text-center p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition-all duration-200 shadow-sm hover:shadow-md hover:border-blue-300 cursor-pointer"
  />

  {/* Plus Button */}
  <button
    type="button"
    onClick={() => handleVariantCountChange(Math.min(5, numVariants + 1))}
    className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold rounded-lg transition-all duration-200 ease-in-out cursor-pointer transform hover:scale-105 hover:shadow-md"
  >
    <svg 
      width="16" 
      height="16" 
      viewBox="0 0 24 24" 
      fill="none" 
      className="transition-transform duration-200 ease-in-out hover:scale-110"
    >
      <path 
        d="M12 5v14m-7-7h14" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round"
      />
    </svg>
  </button>
</div>

</div>

          </div>
        </div>

        {/* Right Card - Statistical Parameters */}
        <div className="backdrop-blur-sm bg-white/30 border border-white/40 p-6 rounded-2xl shadow-md hover:shadow-lg transition duration-300">
          <h3 className="text-xl font-bold text-blue-700 mb-6">Statistical Settings</h3>

          <div className="space-y-6">

            {/* Test Type */}
            <div>
              <label className="block text-gray-700 mb-2 font-medium">Test Type</label>
              <select
                value={testType}
                onChange={(e) => setTestType(e.target.value)}
                className="w-full p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition shadow-sm"
              >
                <option value="one_tailed">One-Tailed (Detect Improvements Only)</option>
                <option value="two_tailed">Two-Tailed (Detect Any Difference)</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                {testType === 'one_tailed' 
                  ? "Best for optimization experiments aiming for improvements." 
                  : "Use two-tailed if any difference (good or bad) matters."}
              </p>
            </div>

            {/* Confidence Level */}
            <div>
              <label className="block text-gray-700 mb-2 font-medium">Confidence Level (%)</label>
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

            {/* Statistical Power */}
            <div>
              <label className="block text-gray-700 mb-2 font-medium">Statistical Power (%)</label>
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

          </div>

          {/* Expandable Formula Section */}
          <details className="mt-8 bg-blue-50/70 p-4 rounded-lg backdrop-blur-sm shadow-inner cursor-pointer">
  <summary className="font-semibold text-blue-700 cursor-pointer">
    📈 View Test Duration Formula & Terms
  </summary>
  <div className="mt-4 text-sm text-blue-800 leading-relaxed space-y-4">

    {/* Formula */}
    <div>
      <p className="font-semibold mb-2">Test Duration (Days):</p>
      <p className="bg-blue-100 p-3 rounded-lg shadow-inner text-blue-900">
        (Variants × Confidence Constant × (√(CR × (1 - CR)) ÷ (CR × Uplift))²) ÷ Daily Visitors
      </p>
    </div>

    {/* Confidence Constant */}
    <div className="mt-6">
      <p className="font-semibold mb-2">Confidence Constant:</p>
      <p className="bg-blue-100 p-3 rounded-lg shadow-inner text-blue-900">
        Confidence Constant = 2 × (Zα + Zβ)²
      </p>
    </div>

    {/* Definitions */}
    <div className="mt-6">
      <p className="font-semibold mb-2">Where:</p>
      <ul className="list-disc ml-6 space-y-2">
        <li><strong>Variants</strong> — Number of groups including control</li>
        <li><strong>CR</strong> — Baseline Conversion Rate (expressed as decimal)</li>
        <li><strong>Uplift</strong> — Minimum detectable improvement (as decimal)</li>
        <li><strong>Zα</strong> — Z-Score corresponding to the selected Confidence Level</li>
        <li><strong>Zβ</strong> — Z-Score corresponding to the selected Statistical Power</li>
        <li><strong>Daily Visitors</strong> — Average number of users exposed daily to the test</li>
      </ul>
    </div>

    {/* Tip */}
    <div className="mt-8 p-4 bg-blue-100 rounded-xl text-blue-900">
      Higher confidence and lower minimum detectable uplift both require a longer test duration.
    </div>

  </div>
</details>

        </div>
      </div>

      {/* Calculate Button */}
      <div className="mt-8 flex justify-center">
        <button
  onClick={handleCalculateDuration}
  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-indigo-600 hover:to-purple-600 text-white font-bold py-3 px-10 rounded-full shadow-lg hover:shadow-2xl transform transition-all duration-300 ease-in-out"
>
  🚀 Calculate Test Duration
</button>
      </div>

    </div>
  </div>
)}
      
      {/* Test Analysis Section */}
      {showAnalysisSection && (
  <div className="mb-8">
    <div className="backdrop-blur-lg bg-white/20 border border-white/30 rounded-2xl shadow-2xl p-6 md:p-10 mb-10">
      
      {/* Section Header */}
      <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-8 text-center tracking-tight">
        Test Results Analyzer
      </h2>
      <p className="text-gray-700 text-center max-w-2xl mx-auto leading-relaxed mb-10">
        Enter your A/B test data to determine if the results are statistically significant.
      </p>

      {/* Test Settings Card */}
      <div className="backdrop-blur-md bg-white/30 border border-white/40 p-6 rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 mb-10">
        <h3 className="text-2xl font-bold text-blue-700 mb-6">Test Settings</h3>

        <div className="space-y-6">

          {/* Hypothesis Test Type */}
          <div>
            <label className="block text-gray-700 mb-2 font-semibold">Hypothesis Test Type</label>
            <select
              value={testType}
              onChange={(e) => setTestType(e.target.value)}
              className="w-full p-3 bg-white/80 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition shadow-md"
            >
              <option value="one_tailed">One-Tailed (Detect Improvements Only)</option>
              <option value="two_tailed">Two-Tailed (Detect Any Difference)</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              {testType === 'one_tailed'
                ? "Use one-tailed if you only care about improvements."
                : "Use two-tailed to detect any significant difference (positive or negative)."}
            </p>
          </div>

          {/* Number of Variants */}
          <div>
  <label className="block text-gray-700 mb-2 font-semibold">Number of Variants (including Control)</label>

  <div className="flex items-center space-x-3">
    {/* Minus Button */}
    <button
      type="button"
      onClick={() => handleVariantCountChange(Math.max(2, numVariants - 1))}
      className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold rounded-lg transition"
      disabled={numVariants <= 2}
    >
      −
    </button>

    {/* Number Display */}
    <input
      type="number"
      min="2"
      max="5"
      value={numVariants}
      onChange={(e) => handleVariantCountChange(e.target.value)}
      className="w-20 text-center p-3 bg-white/80 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition shadow-md"
    />

    {/* Plus Button */}
    <button
      type="button"
      onClick={() => handleVariantCountChange(Math.min(5, numVariants + 1))}
      className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold rounded-lg transition"
      disabled={numVariants >= 5}
    >
      +
    </button>
  </div>

</div>
        </div>

        {/* Expandable Statistical Info */}
        {/* Expandable Statistical Info */}
<details className="mt-8 bg-blue-50/80 p-4 rounded-lg backdrop-blur-sm shadow-inner cursor-pointer">
  <summary className="font-semibold text-blue-700 cursor-pointer">
    📊 View Statistical Formula & Terms
  </summary>
  <div className="mt-4 text-sm text-blue-800 leading-relaxed space-y-4">
    
    {/* Formula */}
    <div>
      <p className="font-semibold mb-2">Test Statistic (Z-Score):</p>
      <p className="bg-blue-100 p-3 rounded-lg shadow-inner text-blue-900">
        Z = (pB - pA) ÷ √(pPool × (1 - pPool) × (1/nA + 1/nB))
      </p>
    </div>

    {/* Definitions */}
    <div>
      <p className="font-semibold mt-4 mb-2">Where:</p>
      <ul className="list-disc ml-6 space-y-2">
        <li><strong>pA</strong> — Conversion rate of Control group (A)</li>
        <li><strong>pB</strong> — Conversion rate of Variant group (B)</li>
        <li><strong>pPool</strong> — Combined conversion rate across A and B</li>
        <li><strong>nA</strong> — Number of visitors in Control group</li>
        <li><strong>nB</strong> — Number of visitors in Variant group</li>
      </ul>
    </div>

    {/* Key Metrics */}
    <div className="mt-6">
      <p className="font-semibold mb-2">Key Metrics:</p>
      <ul className="list-disc ml-6 space-y-2">
        <li><strong>p-value</strong>: Probability that the observed difference is due to random chance.</li>
        <li><strong>Confidence %</strong>: (1 - p-value) × 100; how confident we are in the observed effect.</li>
        <li><strong>Uplift %</strong>: Percentage improvement of the variant over the control.</li>
      </ul>
    </div>

    {/* Tip */}
    <div className="mt-8 p-4 bg-blue-100 rounded-xl text-blue-900">
      A p-value below 0.05 typically indicates a statistically significant result at the 95% confidence level.
    </div>

  </div>
</details>

      </div>

      {/* Test Data Card */}
      <div className="backdrop-blur-md bg-white/30 border border-white/40 p-6 rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 mb-10">
        <h3 className="text-2xl font-bold text-blue-700 mb-6">Test Data</h3>

        {/* Control Group */}
        <div className="mb-8 p-6 bg-white/40 rounded-xl shadow-inner backdrop-blur-sm">
          <h4 className="text-lg font-bold text-blue-600 mb-4">Control Group (A)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 mb-2 font-medium">Visitors</label>
              <input
                type="number"
                min="1"
                value={controlData.visitors}
                onChange={(e) => setControlData({ ...controlData, visitors: parseInt(e.target.value) })}
                className="w-full p-3 bg-white/80 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition shadow-md"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2 font-medium">Conversions</label>
              <input
                type="number"
                min="0"
                value={controlData.conversions}
                onChange={(e) => setControlData({ ...controlData, conversions: parseInt(e.target.value) })}
                className="w-full p-3 bg-white/80 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition shadow-md"
              />
            </div>
          </div>
        </div>

        {/* Variant Groups */}
        {Array.from({ length: numVariants - 1 }).map((_, i) => (
  <div key={i} className="mb-8 p-6 bg-white/40 rounded-xl shadow-inner backdrop-blur-sm">
    <h4 className="text-lg font-bold text-blue-600 mb-4">
      Variant {String.fromCharCode(66 + i)}
    </h4>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      
      {/* Visitors Input */}
      <div>
        <label className="block text-gray-700 mb-2 font-medium">Visitors</label>
        <input
          type="number"
          min="0"
          value={variantData[i]?.visitors === undefined ? '' : variantData[i]?.visitors}
          onChange={(e) => updateVariantData(i, 'visitors', e.target.value)}
          placeholder="Enter Visitors"
          className="w-full p-3 bg-white/80 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition shadow-md"
        />
      </div>

      {/* Conversions Input */}
      <div>
        <label className="block text-gray-700 mb-2 font-medium">Conversions</label>
        <input
          type="number"
          min="0"
          value={variantData[i]?.conversions === undefined ? '' : variantData[i]?.conversions}
          onChange={(e) => updateVariantData(i, 'conversions', e.target.value)}
          placeholder="Enter Conversions"
          className="w-full p-3 bg-white/80 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition shadow-md"
        />
      </div>

    </div>
  </div>
))}

      </div>

      {/* Analyze Button */}
      <div className="mt-12 flex justify-center">
        <button
          onClick={handleAnalyzeResults}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-indigo-600 hover:to-purple-600 text-white font-bold py-3 px-10 rounded-full shadow-lg hover:shadow-2xl transform transition-all duration-300"
        >
          📊 Analyze Results
        </button>
      </div>

    </div>
  </div>
)}
      
      {/* Results Section for Duration Calculator */}
      {showResultsSection && durationResults && showDurationSection && (
  <div className="mb-8">
    <div className="backdrop-blur-lg bg-white/20 border border-white/30 rounded-2xl shadow-2xl p-6 md:p-10 mb-8">
      
      {/* Section Header */}
      <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-8 text-center tracking-tight">
        Test Duration Results
      </h2>

      {/* Flex Container for Results + Graphs */}
      <div className="flex flex-col lg:flex-row gap-8 items-center">

        {/* Left: Duration Analysis */}
        <div className="w-full lg:w-1/2 backdrop-blur-md bg-white/30 border border-white/40 p-6 rounded-2xl shadow-md hover:shadow-2xl transition duration-300">

          <h3 className="text-2xl font-bold text-blue-700 mb-6 text-center">Duration Analysis</h3>

          {/* Main Result */}
          <div className="relative bg-gradient-to-r from-blue-500 to-indigo-500 p-1 rounded-xl shadow-lg mb-6 overflow-hidden">

  {/* Optional Light Pattern Background */}
  <div className="absolute inset-0 bg-[url('/path/to/your-light-pattern.svg')] bg-cover opacity-10 rounded-xl"></div>

  <div className="relative bg-white/90 p-6 rounded-lg flex flex-col items-center">

    {/* Days */}
    <p className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 text-center mb-2">
      {durationResults.duration} days
    </p>

    {/* Weeks */}
    <p className="text-lg font-bold text-indigo-700 mb-1">
      (~{(durationResults.duration / 7).toFixed(1)} weeks)
    </p>

    {/* Caption */}
    <p className="text-center text-gray-600 font-medium">Recommended Test Duration</p>
  </div>

</div>

          {/* Samples Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/60 p-4 rounded-lg backdrop-blur-sm shadow-inner">
              <p className="font-semibold text-gray-700 mb-1">Total Sample Size</p>
              <p className="text-xl font-bold text-blue-600">{durationResults.samplesNeeded.toLocaleString()}</p>
              <p className="text-xs text-gray-500">visitors needed</p>
            </div>
            <div className="bg-white/60 p-4 rounded-lg backdrop-blur-sm shadow-inner">
              <p className="font-semibold text-gray-700 mb-1">Per Variant</p>
              <p className="text-xl font-bold text-blue-600">{durationResults.samplesPerVariant.toLocaleString()}</p>
              <p className="text-xs text-gray-500">visitors per variant</p>
            </div>
          </div>

          {/* Expandable Statistical Parameters */}
          <details className="mt-6 bg-blue-50/70 p-4 rounded-lg backdrop-blur-sm shadow-inner cursor-pointer">
            <summary className="font-semibold text-blue-700 cursor-pointer">
              📈 View Statistical Parameters
            </summary>
            <div className="mt-4 text-sm text-blue-800 leading-relaxed">
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
          </details>

        </div>

        {/* Right: Graphs */}
        <div className="w-full lg:w-1/2 flex flex-col gap-8">

          {/* Graph 1: Duration vs Uplift */}
          <div className="backdrop-blur-md bg-white/30 border border-white/40 p-6 rounded-2xl shadow-md hover:shadow-2xl transition duration-300">
            <h3 className="text-xl font-bold text-blue-700 mb-4 text-center">Duration vs Uplift</h3>
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

          {/* Graph 2: Confidence vs Duration */}
          <div className="backdrop-blur-md bg-white/30 border border-white/40 p-6 rounded-2xl shadow-md hover:shadow-2xl transition duration-300">
            <h3 className="text-xl font-bold text-blue-700 mb-4 text-center">Confidence Level vs Duration</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={confidenceVsDurationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#c7d2fe" />
                <XAxis dataKey="confidenceLevel" stroke="#6366f1" />
                <YAxis stroke="#6366f1" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="duration" stroke="#60a5fa" strokeWidth={3} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

        </div>

      </div>

    </div>
  </div>
)}

      {/* Test Results Analysis Section */}
      {showResultsSection && analysisResults && showAnalysisSection && (
  <div className="mb-8">
    <div className="backdrop-blur-lg bg-white/20 border border-white/30 rounded-2xl shadow-2xl p-6 md:p-10 mb-8">

      {/* Section Header */}
      <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-8 text-center tracking-tight">
        Significance Analysis
      </h2>

      {/* Table Wrapper */}
      <div className="overflow-x-auto rounded-xl backdrop-blur-md bg-white/30 border border-white/40 p-6 shadow-lg hover:shadow-2xl transition duration-300">
        <table className="w-full text-sm text-gray-700">
          <thead className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
            <tr>
              <th className="px-4 py-3 text-left">Variant</th>
              <th className="px-4 py-3 text-left">Visitors</th>
              <th className="px-4 py-3 text-left">Conversions</th>
              <th className="px-4 py-3 text-left">Conversion Rate</th>
              <th className="px-4 py-3 text-left">Uplift</th>
              <th className="px-4 py-3 text-left">Confidence</th>
              <th className="px-4 py-3 text-left">Significant?</th>
            </tr>
          </thead>
          <tbody>

            {/* Control Group */}
            <tr className="bg-white/80 border-b border-gray-200">
              <td className="px-4 py-4 font-semibold">Control (A)</td>
              <td className="px-4 py-4">{analysisResults.control.visitors}</td>
              <td className="px-4 py-4">{analysisResults.control.conversions}</td>
              <td className="px-4 py-4">{analysisResults.control.conversionRate.toFixed(2)}%</td>
              <td className="px-4 py-4 text-center">-</td>
              <td className="px-4 py-4 text-center">-</td>
              <td className="px-4 py-4 text-center">-</td>
            </tr>

            {/* Variant Groups */}
            {analysisResults.variants.map((v, idx) => (
              <tr key={`variant-${idx}`} className="hover:bg-blue-50 transition duration-300">
                <td className="px-4 py-4 font-semibold">Variant {v.variant}</td>
                <td className="px-4 py-4">{v.visitors}</td>
                <td className="px-4 py-4">{v.conversions}</td>
                <td className="px-4 py-4">{v.conversionRate.toFixed(2)}%</td>
                <td className="px-4 py-4">{v.uplift.toFixed(2)}%</td>
                <td className="px-4 py-4">{v.confidence.toFixed(2)}%</td>
                <td className="px-4 py-4">
                  <span className={`px-3 py-1 rounded-full text-white text-xs ${
                    v.isSignificant ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                  }`}>
                    {v.isSignificant ? 'Yes' : 'No'}
                  </span>
                </td>
              </tr>
            ))}

          </tbody>
        </table>

        {/* Expandable Required Conversions for each Variant */}
        {analysisResults.variants.map((v, idx) => (
          <div key={`required-${idx}`} className="mt-4 bg-blue-50/70 rounded-lg p-4 backdrop-blur-sm shadow-inner">
            <details>
              <summary className="font-semibold text-blue-700 cursor-pointer">
                📋 View Required Conversions for Variant {v.variant}
              </summary>
              <div className="mt-4">
                <table className="w-full text-sm">
                  <thead className="text-gray-600">
                    <tr>
                      <th className="text-left py-2 px-2">Confidence Level</th>
                      <th className="text-left py-2 px-2">Required Conversions</th>
                      <th className="text-left py-2 px-2">Current Conversions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {v.requiredConversionsTable.map((r, i) => (
                      <tr key={i}>
                        <td className="py-1 px-2">{r.level}%</td>
                        <td className="py-1 px-2">{r.conversions}</td>
                        <td className="py-1 px-2">{r.current}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </div>
        ))}

      </div>

      {/* Helpful Next Steps */}
      {/* Helpful Insights */}
<div className="mt-10 p-6 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl backdrop-blur-md shadow-2xl">
  <h3 className="text-xl font-bold text-blue-700 mb-6">🔍 Insights Summary</h3>

  <div className="space-y-6 text-gray-800 text-sm">

    {/* Example Insight for a Variant */}
    {analysisResults.variants.map((variant, idx) => (
      <div key={idx} className="p-4 bg-white/60 rounded-xl backdrop-blur-sm shadow-inner">
        <h4 className="font-semibold text-blue-700 mb-3">Variant {variant.variant}</h4>

        {/* Insight Message */}
        <p className="mb-2">
          {variant.isSignificant 
            ? `🎯 Statistically significant with ${variant.confidence.toFixed(2)}% confidence.`
            : `⚠️ Not enough evidence to declare a statistically significant improvement.`}
        </p>

        {/* Additional Guidance */}
        {!variant.isSignificant && (
          <>
            <p className="mb-1">⏳ Need approximately {variant.requiredConversionsTable.find(r => r.level === 95)?.conversions - variant.conversions} more conversions to reach 95% confidence.</p>
            <p className="mb-1">📈 Current confidence: {variant.confidence.toFixed(2)}%.</p>
            <p className="mb-1">🔄 Consider extending test duration or increasing traffic.</p>
          </>
        )}

        {/* Divider */}
        <div className="border-t border-blue-200 mt-4 pt-4 text-xs text-gray-600">
          (Based on Two-Tailed test at 95% target confidence.)
        </div>
      </div>
    ))}

  </div>
</div>

    </div>
  </div>
)}
    </div>
  );
}
