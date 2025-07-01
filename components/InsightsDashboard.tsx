import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Sector } from 'recharts';
import { PredictionOutput, PatientData, AgeDistributionData, DiagnosisDistributionData, LengthOfStayData } from '../types';
import { Card } from './common/Card';

interface InsightsDashboardProps {
  predictions: PredictionOutput[];
  batchPatients: PatientData[];
}

const COLORS = ['#FFDF00', '#FFBB28', '#FF8042', '#00C49F', '#0088FE', '#8884D8'];


interface ActiveShapeProps {
  cx?: number;
  cy?: number;
  midAngle?: number;
  innerRadius?: number;
  outerRadius?: number;
  startAngle?: number;
  endAngle?: number;
  fill?: string;
  payload?: DiagnosisDistributionData; 
  percent?: number; 
  value?: number; 
}

const renderActiveShape = (props: ActiveShapeProps) => { 
  const RADIAN = Math.PI / 180;
  const { cx = 0, cy = 0, midAngle = 0, innerRadius = 0, outerRadius = 0, startAngle = 0, endAngle = 0, fill, payload, percent = 0, value } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  // Check if current theme is dark to adjust text color for better contrast
  const isDarkTheme = typeof window !== 'undefined' && document.documentElement.classList.contains('dark');
  const labelFillColor = isDarkTheme ? '#FFFFFF' : '#333333';


  return (
    <g>
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} className="font-bold text-lg">
        {payload?.diagnosis} 
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill={labelFillColor}>{`${value} (${(percent * 100).toFixed(0)}%)`}</text>
    </g>
  );
};


export const InsightsDashboard: React.FC<InsightsDashboardProps> = ({ predictions, batchPatients }) => {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [isDark, setIsDark] = React.useState(false);

  React.useEffect(() => {
    const root = document.documentElement;
    setIsDark(root.classList.contains('dark'));
    
    const observer = new MutationObserver(() => {
        setIsDark(root.classList.contains('dark'));
    });
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };
  
  const processedData = useMemo(() => {
    const ageGroups: { [key: string]: { count: number, readmitted: number } } = {
      "0-18": { count: 0, readmitted: 0 },
      "19-40": { count: 0, readmitted: 0 },
      "41-65": { count: 0, readmitted: 0 },
      "66+": { count: 0, readmitted: 0 },
    };
    const diagnosisCounts: { [key: string]: { count: number, readmitted: number } } = {};
    let totalLengthOfStayReadmitted = 0;
    let countReadmitted = 0;
    let totalLengthOfStayNotReadmitted = 0;
    let countNotReadmitted = 0;

    if (predictions.length === 0 || batchPatients.length === 0) { 
      return {
        ageDistribution: [
          { ageGroup: "0-18", count: 10, readmitted: 1 },
          { ageGroup: "19-40", count: 30, readmitted: 3 },
          { ageGroup: "41-65", count: 50, readmitted: 10 },
          { ageGroup: "66+", count: 40, readmitted: 15 },
        ],
        diagnosisDistribution: [
          { diagnosis: "Cardiovascular", count: 40, readmitted: 12 },
          { diagnosis: "Respiratory", count: 30, readmitted: 8 },
          { diagnosis: "Diabetes", count: 25, readmitted: 7 },
          { diagnosis: "Other", count: 35, readmitted: 5 },
        ],
        lengthOfStay: [
          { status: "Readmitted", averageDays: 8.5 },
          { status: "Not Readmitted", averageDays: 5.2 },
        ],
        overallReadmissionRate: 25.0 
      };
    }
    
    batchPatients.forEach(patient => {
      const prediction = predictions.find((_, i) => batchPatients[i]?.id === patient.id); 
      const age = Number(patient.data.demographics.age);
      const los = Number(patient.data.medicalHistory.lengthOfStayDays);
      const isReadmittedRisk = prediction ? prediction.riskPercentage > 50 : false; 

      let ageGroupKey = "66+";
      if (age <= 18) ageGroupKey = "0-18";
      else if (age <= 40) ageGroupKey = "19-40";
      else if (age <= 65) ageGroupKey = "41-65";
      
      ageGroups[ageGroupKey].count++;
      if (isReadmittedRisk) ageGroups[ageGroupKey].readmitted++;

      const primaryDiagnosis = (patient.data.medicalHistory.diagnosisCodes.split(',')[0] || "Unknown").trim();
      if (!diagnosisCounts[primaryDiagnosis]) diagnosisCounts[primaryDiagnosis] = { count: 0, readmitted: 0 };
      diagnosisCounts[primaryDiagnosis].count++;
      if (isReadmittedRisk) diagnosisCounts[primaryDiagnosis].readmitted++;

      if (isReadmittedRisk) {
        totalLengthOfStayReadmitted += los;
        countReadmitted++;
      } else {
        totalLengthOfStayNotReadmitted += los;
        countNotReadmitted++;
      }
    });

    const ageDistribution: AgeDistributionData[] = Object.entries(ageGroups).map(([key, value]) => ({
      ageGroup: key, ...value
    }));
    const diagnosisDistribution: DiagnosisDistributionData[] = Object.entries(diagnosisCounts)
      .map(([key, value]) => ({ diagnosis: key, ...value }))
      .sort((a,b) => b.count - a.count) 
      .slice(0, 5); 
      
    const lengthOfStay: LengthOfStayData[] = [
      { status: "Readmitted (High Risk)", averageDays: countReadmitted > 0 ? parseFloat((totalLengthOfStayReadmitted / countReadmitted).toFixed(1)) : 0 },
      { status: "Not Readmitted (Lower Risk)", averageDays: countNotReadmitted > 0 ? parseFloat((totalLengthOfStayNotReadmitted / countNotReadmitted).toFixed(1)) : 0 },
    ];
    
    const overallReadmissionRate = batchPatients.length > 0 ? parseFloat(((countReadmitted / batchPatients.length) * 100).toFixed(1)) : 0;

    return { ageDistribution, diagnosisDistribution, lengthOfStay, overallReadmissionRate };

  }, [predictions, batchPatients]);

  const chartTextColor = isDark ? '#E0E0E0' : '#374151'; // Muted text for dark, slate-700 for light
  const tooltipStyle = {
    backgroundColor: isDark ? '#002020' : '#FFFFFF',
    border: `1px solid ${isDark ? '#FFDF00' : '#E5E7EB'}`,
    borderRadius: '4px',
    color: isDark ? '#E0E0E0' : '#1F2937' // text-primary for dark, text-gray-800 for light
  };
  const legendStyle = { color: chartTextColor };
  const labelStyle = { color: isDark ? '#FFDF00' : '#004040' }; // Primary for dark, secondary for light

  if (predictions.length === 0 && batchPatients.length === 0) {
     return (
        <Card title="Insights Dashboard">
            <p className="text-slate-600 dark:text-text-secondary">No batch data processed yet. Please upload and predict batch data to see insights, or view mock data below.</p>
            {renderCharts(processedData.ageDistribution, processedData.diagnosisDistribution, processedData.lengthOfStay, processedData.overallReadmissionRate)}
        </Card>
     );
  }
  
  function renderCharts(
    ageDistribution: AgeDistributionData[], 
    diagnosisDistribution: DiagnosisDistributionData[], 
    lengthOfStay: LengthOfStayData[],
    overallReadmissionRate: number
  ) {
    return (
      <div className="space-y-8">
          <div className="text-center p-4 bg-slate-50 dark:bg-dark-secondary rounded-lg">
            <h4 className="text-2xl font-bold text-secondary dark:text-primary">{overallReadmissionRate.toFixed(1)}%</h4>
            <p className="text-slate-600 dark:text-text-secondary">Overall High Readmission Risk Rate (based on processed batch)</p>
          </div>

          <Card title="Readmission Risk by Age Group" className="bg-white dark:bg-secondary">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ageDistribution} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} stroke={isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)"}/>
                <XAxis dataKey="ageGroup" stroke={chartTextColor} />
                <YAxis stroke={chartTextColor} />
                <Tooltip contentStyle={tooltipStyle} itemStyle={{color: chartTextColor}} labelStyle={labelStyle}/>
                <Legend wrapperStyle={legendStyle} />
                <Bar dataKey="count" fill="#0088FE" name="Total Patients" />
                <Bar dataKey="readmitted" fill="#FF8042" name="High Risk Patients" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card title="Top 5 Diagnoses (High Risk Distribution)" className="bg-white dark:bg-secondary">
            <ResponsiveContainer width="100%" height={400}>
               <PieChart>
                <Pie
                  activeIndex={activeIndex}
                  activeShape={renderActiveShape}
                  data={diagnosisDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  fill="#FFDF00"
                  dataKey="readmitted" 
                  nameKey="diagnosis"
                  onMouseEnter={onPieEnter}
                  paddingAngle={2}
                >
                  {diagnosisDistribution.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} itemStyle={{color: chartTextColor}} labelStyle={labelStyle}/>
                <Legend wrapperStyle={legendStyle} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
          
          <Card title="Average Length of Stay (High Risk vs. Lower Risk)" className="bg-white dark:bg-secondary">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={lengthOfStay} layout="vertical" margin={{ top: 5, right: 30, left: 50, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} stroke={isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)"}/>
                <XAxis type="number" stroke={chartTextColor} />
                <YAxis dataKey="status" type="category" width={150} stroke={chartTextColor} tick={{ fill: chartTextColor }} />
                <Tooltip contentStyle={tooltipStyle} itemStyle={{color: chartTextColor}} labelStyle={labelStyle}/>
                <Legend wrapperStyle={legendStyle}/>
                <Bar dataKey="averageDays" fill="#00C49F" name="Avg. LoS (Days)" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
           <p className="text-xs text-center text-slate-500 dark:text-gray-400 mt-4">
            Note: "Readmitted" in these charts refers to patients predicted with high readmission risk (&gt;50%) for illustrative purposes. 
            Actual readmission outcomes would be used in a real-world scenario.
          </p>
        </div>
    );
  }

  return (
    <Card title="Insights Dashboard">
       {renderCharts(processedData.ageDistribution, processedData.diagnosisDistribution, processedData.lengthOfStay, processedData.overallReadmissionRate)}
    </Card>
  );
};
