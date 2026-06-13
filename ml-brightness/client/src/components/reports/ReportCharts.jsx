import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts';

const COLORS = {
  'Linear Regression': '#3b82f6',
  'Random Forest':     '#16a34a',
  'XGBoost':           '#d97706',
  'Neural Network':    '#7c3aed',
};

const TIP = {
  contentStyle: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.1)', padding: '10px 14px' },
  labelStyle:   { color: '#64748b', fontWeight: 600, marginBottom: 4 },
  cursor:       { fill: 'rgba(99,102,241,0.04)' },
};

const AXIS = { fill: '#94a3b8', fontSize: 11, fontFamily: 'Inter' };
const GRID = { strokeDasharray: '3 3', stroke: '#f1f5f9' };

// ── Bar Chart: R², MAE, RMSE comparison ──────────────────────
export function MetricsBarChart({ data }) {
  const barData = data.map(m => ({
    name:  m.name.replace(' ', '\n'),
    short: m.name === 'Linear Regression' ? 'LinReg' : m.name === 'Neural Network' ? 'NeuNet' : m.name,
    r2:    +m.r2.toFixed(4),
    mae:   +m.mae.toFixed(4),
    rmse:  +m.rmse.toFixed(4),
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={barData} margin={{ top: 8, right: 16, bottom: 8, left: 0 }} barGap={4}>
        <CartesianGrid {...GRID} vertical={false}/>
        <XAxis dataKey="short" tick={AXIS} axisLine={false} tickLine={false}/>
        <YAxis tick={AXIS} axisLine={false} tickLine={false}/>
        <Tooltip {...TIP}/>
        <Legend wrapperStyle={{ fontSize: 12, color: '#64748b', paddingTop: 8 }}/>
        <Bar dataKey="r2"   name="R² Score" radius={[6,6,0,0]}>
          {barData.map((_, i) => <Cell key={i} fill={Object.values(COLORS)[i]}/>)}
        </Bar>
        <Bar dataKey="mae"  name="MAE"      fill="#f1f5f9" radius={[6,6,0,0]}/>
        <Bar dataKey="rmse" name="RMSE"     fill="#e2e8f0" radius={[6,6,0,0]}/>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Pie Chart: R² performance distribution ───────────────────
const RADIAN = Math.PI / 180;
function CustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) {
  const r  = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x  = cx + r * Math.cos(-midAngle * RADIAN);
  const y  = cy + r * Math.sin(-midAngle * RADIAN);
  return percent > 0.05 ? (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>
      {(percent * 100).toFixed(1)}%
    </text>
  ) : null;
}

export function PerformancePieChart({ data }) {
  const total   = data.reduce((s, m) => s + m.r2, 0);
  const pieData = data.map(m => ({ name: m.name, value: +(m.r2 / total * 100).toFixed(3) }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={pieData}
          cx="50%" cy="50%"
          outerRadius={100} innerRadius={50}
          dataKey="value"
          labelLine={false}
          label={CustomLabel}
          paddingAngle={3}
        >
          {pieData.map((_, i) => (
            <Cell key={i} fill={Object.values(COLORS)[i]} stroke="none"/>
          ))}
        </Pie>
        <Tooltip
          {...TIP}
          formatter={(v, name) => [`${v}%`, name]}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: '#64748b' }}/>
      </PieChart>
    </ResponsiveContainer>
  );
}

// ── Line Chart: MAE & RMSE error trends ──────────────────────
export function ErrorTrendChart({ data }) {
  const lineData = data.map(m => ({
    name:  m.name === 'Linear Regression' ? 'LinReg' : m.name === 'Neural Network' ? 'NeuNet' : m.name,
    MAE:   +m.mae.toFixed(4),
    RMSE:  +m.rmse.toFixed(4),
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={lineData} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
        <CartesianGrid {...GRID}/>
        <XAxis dataKey="name" tick={AXIS} axisLine={false} tickLine={false}/>
        <YAxis tick={AXIS} axisLine={false} tickLine={false}/>
        <Tooltip {...TIP}/>
        <Legend wrapperStyle={{ fontSize: 12, color: '#64748b', paddingTop: 8 }}/>
        <Line type="monotone" dataKey="MAE"  stroke="#6366f1" strokeWidth={2.5} dot={{ r: 5, fill: '#6366f1', strokeWidth: 0 }} activeDot={{ r: 7 }} name="MAE"/>
        <Line type="monotone" dataKey="RMSE" stroke="#f43f5e" strokeWidth={2.5} dot={{ r: 5, fill: '#f43f5e', strokeWidth: 0 }} activeDot={{ r: 7 }} name="RMSE"/>
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── Radar Chart: overall model profile ───────────────────────
export function ModelRadarChart({ data }) {
  // Normalize each metric to 0–100 for radar
  const maxR2   = Math.max(...data.map(m => m.r2));
  const maxMAE  = Math.max(...data.map(m => m.mae));
  const maxRMSE = Math.max(...data.map(m => m.rmse));

  const radarData = [
    { metric: 'R² Score',  ...Object.fromEntries(data.map(m => [m.name, +(m.r2 / maxR2 * 100).toFixed(1)])) },
    { metric: 'Low MAE',   ...Object.fromEntries(data.map(m => [m.name, +Math.max(0, (1 - m.mae  / maxMAE)  * 100).toFixed(1)])) },
    { metric: 'Low RMSE',  ...Object.fromEntries(data.map(m => [m.name, +Math.max(0, (1 - m.rmse / maxRMSE) * 100).toFixed(1)])) },
    { metric: 'Speed',     'Linear Regression': 95, 'Random Forest': 70, 'XGBoost': 85, 'Neural Network': 50 },
    { metric: 'Simplicity','Linear Regression': 90, 'Random Forest': 55, 'XGBoost': 60, 'Neural Network': 40 },
  ];

  return (
    <ResponsiveContainer width="100%" height={260}>
      <RadarChart data={radarData} margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
        <PolarGrid stroke="#e2e8f0"/>
        <PolarAngleAxis dataKey="metric" tick={{ fill: '#64748b', fontSize: 11 }}/>
        <Tooltip {...TIP}/>
        <Legend wrapperStyle={{ fontSize: 12, color: '#64748b', paddingTop: 8 }}/>
        {data.map(m => (
          <Radar key={m.name} name={m.name} dataKey={m.name}
            stroke={COLORS[m.name]} fill={COLORS[m.name]} fillOpacity={0.12} strokeWidth={2}/>
        ))}
      </RadarChart>
    </ResponsiveContainer>
  );
}
