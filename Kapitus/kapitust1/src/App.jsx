import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, ComposedChart, Area
} from 'recharts';

// Sample data based on the provided data tables
const data = [
  // Pre Period - Desktop
  { period: 'Pre Period', week: 'Week 1', device: 'Desktop', traffic: 1914, shortFormSubmits: 215, shortFormRate: 11.23, longFormStarts: 186, longFormStartRate: 64.14, longFormSubmits: 75, longFormSubmitRate: 40.32, applyNowClicks: 75, applyNowCTR: 3.92 },
  { period: 'Pre Period', week: 'Week 2', device: 'Desktop', traffic: 4075, shortFormSubmits: 202, shortFormRate: 4.96, longFormStarts: 174, longFormStartRate: 65.91, longFormSubmits: 78, longFormSubmitRate: 44.83, applyNowClicks: 62, applyNowCTR: 1.52 },
  { period: 'Pre Period', week: 'Week 3', device: 'Desktop', traffic: 2823, shortFormSubmits: 184, shortFormRate: 6.52, longFormStarts: 158, longFormStartRate: 68.10, longFormSubmits: 60, longFormSubmitRate: 37.97, applyNowClicks: 48, applyNowCTR: 1.70 },
  { period: 'Pre Period', week: 'Week 4', device: 'Desktop', traffic: 2025, shortFormSubmits: 175, shortFormRate: 8.64, longFormStarts: 154, longFormStartRate: 61.60, longFormSubmits: 72, longFormSubmitRate: 46.75, applyNowClicks: 75, applyNowCTR: 3.70 },
  // Pre Period - Mobile
  { period: 'Pre Period', week: 'Week 1', device: 'Mobile', traffic: 1704, shortFormSubmits: 172, shortFormRate: 10.09, longFormStarts: 142, longFormStartRate: 66.67, longFormSubmits: 47, longFormSubmitRate: 33.10, applyNowClicks: 41, applyNowCTR: 2.41 },
  { period: 'Pre Period', week: 'Week 2', device: 'Mobile', traffic: 7537, shortFormSubmits: 211, shortFormRate: 2.80, longFormStarts: 158, longFormStartRate: 56.03, longFormSubmits: 53, longFormSubmitRate: 33.54, applyNowClicks: 71, applyNowCTR: 0.94 },
  { period: 'Pre Period', week: 'Week 3', device: 'Mobile', traffic: 6568, shortFormSubmits: 161, shortFormRate: 2.45, longFormStarts: 126, longFormStartRate: 62.69, longFormSubmits: 36, longFormSubmitRate: 28.57, applyNowClicks: 40, applyNowCTR: 0.61 },
  { period: 'Pre Period', week: 'Week 4', device: 'Mobile', traffic: 1632, shortFormSubmits: 161, shortFormRate: 9.87, longFormStarts: 132, longFormStartRate: 68.04, longFormSubmits: 54, longFormSubmitRate: 40.91, applyNowClicks: 33, applyNowCTR: 2.02 },
  // Post Period - Desktop
  { period: 'Post Period', week: 'Week 1', device: 'Desktop', traffic: 2100, shortFormSubmits: 255, shortFormRate: 12.14, longFormStarts: 225, longFormStartRate: 70.31, longFormSubmits: 95, longFormSubmitRate: 42.22, applyNowClicks: 82, applyNowCTR: 3.90 },
  { period: 'Post Period', week: 'Week 2', device: 'Desktop', traffic: 4250, shortFormSubmits: 240, shortFormRate: 5.65, longFormStarts: 210, longFormStartRate: 68.63, longFormSubmits: 95, longFormSubmitRate: 45.24, applyNowClicks: 70, applyNowCTR: 1.65 },
  { period: 'Post Period', week: 'Week 3', device: 'Desktop', traffic: 3000, shortFormSubmits: 215, shortFormRate: 7.17, longFormStarts: 190, longFormStartRate: 70.37, longFormSubmits: 78, longFormSubmitRate: 41.05, applyNowClicks: 55, applyNowCTR: 1.83 },
  { period: 'Post Period', week: 'Week 4', device: 'Desktop', traffic: 2200, shortFormSubmits: 205, shortFormRate: 9.32, longFormStarts: 185, longFormStartRate: 65.84, longFormSubmits: 90, longFormSubmitRate: 48.65, applyNowClicks: 80, applyNowCTR: 3.64 },
  // Post Period - Mobile
  { period: 'Post Period', week: 'Week 1', device: 'Mobile', traffic: 1850, shortFormSubmits: 195, shortFormRate: 10.54, longFormStarts: 168, longFormStartRate: 70.29, longFormSubmits: 60, longFormSubmitRate: 35.71, applyNowClicks: 48, applyNowCTR: 2.59 },
  { period: 'Post Period', week: 'Week 2', device: 'Mobile', traffic: 7800, shortFormSubmits: 245, shortFormRate: 3.14, longFormStarts: 190, longFormStartRate: 60.51, longFormSubmits: 68, longFormSubmitRate: 35.79, applyNowClicks: 75, applyNowCTR: 0.96 },
  { period: 'Post Period', week: 'Week 3', device: 'Mobile', traffic: 6800, shortFormSubmits: 195, shortFormRate: 2.87, longFormStarts: 160, longFormStartRate: 65.31, longFormSubmits: 52, longFormSubmitRate: 32.50, applyNowClicks: 50, applyNowCTR: 0.74 },
  { period: 'Post Period', week: 'Week 4', device: 'Mobile', traffic: 1800, shortFormSubmits: 190, shortFormRate: 10.56, longFormStarts: 165, longFormStartRate: 72.05, longFormSubmits: 70, longFormSubmitRate: 42.42, applyNowClicks: 45, applyNowCTR: 2.50 },
];

// Route data
const routeData = [
  { route: 'Direct Short Form', device: 'Desktop', period: 'Pre Period', submits: 245 },
  { route: 'Direct Short Form', device: 'Desktop', period: 'Post Period', submits: 298 },
  { route: 'Direct Short Form', device: 'Mobile', period: 'Pre Period', submits: 170 },
  { route: 'Direct Short Form', device: 'Mobile', period: 'Post Period', submits: 210 },
  { route: 'Apply Now CTA', device: 'Desktop', period: 'Pre Period', submits: 29 },
  { route: 'Apply Now CTA', device: 'Desktop', period: 'Post Period', submits: 60 },
  { route: 'Apply Now CTA', device: 'Mobile', period: 'Pre Period', submits: 18 },
  { route: 'Apply Now CTA', device: 'Mobile', period: 'Post Period', submits: 40 },
];

// Summary data
const summaryData = [
  { name: 'Desktop Direct', value: 21.6 },
  { name: 'Mobile Direct', value: 23.5 },
  { name: 'Desktop Apply Now', value: 106.9 },
  { name: 'Mobile Apply Now', value: 122.2 },
];

// Week-by-week comparison data
const weeklyComparisonData = [
  { name: 'Week 1', prePeriod: 122, postPeriod: 155 },
  { name: 'Week 2', prePeriod: 131, postPeriod: 163 },
  { name: 'Week 3', prePeriod: 96, postPeriod: 130 },
  { name: 'Week 4', prePeriod: 126, postPeriod: 160 },
];

// Funnel data
const calculateFunnelData = (periodFilter, deviceFilter) => {
  // Filter data based on period and device
  const filteredData = data.filter(
    item => 
      (periodFilter === 'All' || item.period === periodFilter) && 
      (deviceFilter === 'All' || item.device === deviceFilter)
  );
  
  // Sum values
  const traffic = filteredData.reduce((sum, item) => sum + item.traffic, 0);
  const shortFormSubmits = filteredData.reduce((sum, item) => sum + item.shortFormSubmits, 0);
  const longFormStarts = filteredData.reduce((sum, item) => sum + item.longFormStarts, 0);
  const longFormSubmits = filteredData.reduce((sum, item) => sum + item.longFormSubmits, 0);
  
  return [
    { name: 'Traffic', value: traffic },
    { name: 'Short Form Submits', value: shortFormSubmits },
    { name: 'Long Form Starts', value: longFormStarts },
    { name: 'Long Form Submits', value: longFormSubmits },
  ];
};

// Colors
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function Dashboard() {
  // State for filters
  const [periodFilter, setPeriodFilter] = useState('All');
  const [deviceFilter, setDeviceFilter] = useState('All');
  const [weekFilter, setWeekFilter] = useState('All');
  
  // Filter data based on selected filters
  const filteredData = data.filter(
    item => 
      (periodFilter === 'All' || item.period === periodFilter) && 
      (deviceFilter === 'All' || item.device === deviceFilter) &&
      (weekFilter === 'All' || item.week === weekFilter)
  );
  
  // Filter route data
  const filteredRouteData = routeData.filter(
    item => 
      (periodFilter === 'All' || item.period === periodFilter) && 
      (deviceFilter === 'All' || item.device === deviceFilter)
  );
  
  // Prepare data for conversion rate comparison
  const conversionRateData = filteredData.reduce((acc, item) => {
    const existingItem = acc.find(i => i.week === item.week && i.device === item.device);
    if (existingItem) {
      if (item.period === 'Pre Period') {
        existingItem.preRate = item.longFormSubmitRate;
      } else {
        existingItem.postRate = item.longFormSubmitRate;
      }
    } else {
      acc.push({
        week: item.week,
        device: item.device,
        preRate: item.period === 'Pre Period' ? item.longFormSubmitRate : 0,
        postRate: item.period === 'Post Period' ? item.longFormSubmitRate : 0
      });
    }
    return acc;
  }, []);

  return (
    <div className="bg-gray-100 p-6 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">A/B Test Performance Dashboard</h1>
        
        {/* Filter Controls */}
        <div className="bg-white p-4 rounded-lg shadow mb-6 flex flex-wrap gap-4">
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Period</label>
            <select 
              className="border rounded p-2 min-w-32"
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
            >
              <option value="All">All Periods</option>
              <option value="Pre Period">Pre Period</option>
              <option value="Post Period">Post Period</option>
            </select>
          </div>
          
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Device</label>
            <select 
              className="border rounded p-2 min-w-32"
              value={deviceFilter}
              onChange={(e) => setDeviceFilter(e.target.value)}
            >
              <option value="All">All Devices</option>
              <option value="Desktop">Desktop</option>
              <option value="Mobile">Mobile</option>
            </select>
          </div>
          
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Week</label>
            <select 
              className="border rounded p-2 min-w-32"
              value={weekFilter}
              onChange={(e) => setWeekFilter(e.target.value)}
            >
              <option value="All">All Weeks</option>
              <option value="Week 1">Week 1</option>
              <option value="Week 2">Week 2</option>
              <option value="Week 3">Week 3</option>
              <option value="Week 4">Week 4</option>
            </select>
          </div>
        </div>
        
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Total Long Form Submissions</h3>
            <div className="mt-2 flex items-baseline">
              <div className="text-2xl font-semibold">
                {filteredData.reduce((sum, item) => sum + item.longFormSubmits, 0)}
              </div>
              <div className="ml-2 text-sm text-green-600">+28.0%</div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Avg. Submit Rate</h3>
            <div className="mt-2 flex items-baseline">
              <div className="text-2xl font-semibold">
                {(filteredData.reduce((sum, item) => sum + item.longFormSubmitRate, 0) / filteredData.length).toFixed(2)}%
              </div>
              <div className="ml-2 text-sm text-green-600">+3.67%</div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Apply Now CTR</h3>
            <div className="mt-2 flex items-baseline">
              <div className="text-2xl font-semibold">
                {(filteredData.reduce((sum, item) => sum + item.applyNowCTR, 0) / filteredData.length).toFixed(2)}%
              </div>
              <div className="ml-2 text-sm text-green-600">+0.11%</div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Traffic</h3>
            <div className="mt-2 flex items-baseline">
              <div className="text-2xl font-semibold">
                {filteredData.reduce((sum, item) => sum + item.traffic, 0).toLocaleString()}
              </div>
              <div className="ml-2 text-sm text-green-600">+5.05%</div>
            </div>
          </div>
        </div>
        
        {/* Main Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Conversion Funnel */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Conversion Funnel</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={calculateFunnelData(periodFilter, deviceFilter)}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          {/* Week-by-Week Comparison */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Week-by-Week Submissions Comparison</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={weeklyComparisonData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="prePeriod" name="Pre Period" fill="#8884d8" />
                <Bar dataKey="postPeriod" name="Post Period" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          {/* Conversion Rate Trends */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Conversion Rate Improvement</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={conversionRateData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="preRate" name="Pre Period Rate" stroke="#8884d8" />
                <Line type="monotone" dataKey="postRate" name="Post Period Rate" stroke="#82ca9d" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          {/* Route Comparison */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Conversion Route Comparison</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={filteredRouteData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="route" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="submits" name="Submissions" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Percentage Improvement by Route */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">% Improvement by Route</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={summaryData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({name, value}) => `${name}: ${value}%`}
                >
                  {summaryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Device Comparison */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Device Comparison (Long Form Submits)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart
                data={filteredData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="longFormSubmits" name="Long Form Submits" barSize={20} fill="#413ea0" />
                <Line type="monotone" dataKey="longFormSubmitRate" name="Submit Rate %" stroke="#ff7300" yAxisId={0} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}