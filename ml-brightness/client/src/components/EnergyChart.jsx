import {
  AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts';

const TIP = {
  contentStyle: {
    background: 'rgba(2,6,23,0.97)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12,
    fontSize: 11,
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    padding: '10px 14px',
  },
  labelStyle:  { color: 'rgba(255,255,255,0.5)', marginBottom: 4 },
  itemStyle:   { color: 'rgba(255,255,255,0.8)' },
  cursor:      { stroke: 'rgba(255,255,255,0.08)', strokeWidth: 1 },
};

const AXIS = { fill: 'rgba(255,255,255,0.25)', fontSize: 10, fontFamily: 'Inter' };
const GRID = { strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.04)' };
const LEG  = { wrapperStyle: { fontSize: 11, color: 'rgba(255,255,255,0.45)', paddingTop: 8 } };

export function LiveEnergyChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={210}>
      <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
        <defs>
          <linearGradient id="gBaseline" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#e63946" stopOpacity={0.35}/>
            <stop offset="100%" stopColor="#e63946" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="gML" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#06d6a0" stopOpacity={0.35}/>
            <stop offset="100%" stopColor="#06d6a0" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid {...GRID}/>
        <XAxis dataKey="time" tick={AXIS} interval="preserveStartEnd" axisLine={false} tickLine={false}/>
        <YAxis tick={AXIS} domain={[0, 110]} axisLine={false} tickLine={false}/>
        <Tooltip {...TIP}/>
        <Legend {...LEG}/>
        <Area type="monotoneX" dataKey="baseline" stroke="#e63946" strokeWidth={1.5} fill="url(#gBaseline)" name="Baseline 100%" dot={false} strokeDasharray="5 3"/>
        <Area type="monotoneX" dataKey="ml"       stroke="#06d6a0" strokeWidth={2.5} fill="url(#gML)"       name="ML Brightness %" dot={false}/>
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function SavingsChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={190}>
      <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
        <defs>
          <linearGradient id="gSaving" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#4cc9f0" stopOpacity={0.3}/>
            <stop offset="100%" stopColor="#4cc9f0" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid {...GRID}/>
        <XAxis dataKey="time" tick={AXIS} interval="preserveStartEnd" axisLine={false} tickLine={false}/>
        <YAxis tick={AXIS} domain={[0, 100]} axisLine={false} tickLine={false}/>
        <Tooltip {...TIP}/>
        <Area type="monotoneX" dataKey="saving" stroke="#4cc9f0" strokeWidth={2.5} fill="url(#gSaving)" name="Energy Saved %" dot={false}/>
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function LuxBrightnessChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={190}>
      <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
        <defs>
          <linearGradient id="luxLine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#f9c74f"/>
            <stop offset="100%" stopColor="#f4845f"/>
          </linearGradient>
        </defs>
        <CartesianGrid {...GRID}/>
        <XAxis dataKey="time" tick={AXIS} interval="preserveStartEnd" axisLine={false} tickLine={false}/>
        <YAxis yAxisId="lux"    orientation="left"  tick={{ ...AXIS, fill: '#f9c74f' }} domain={[0, 1000]} axisLine={false} tickLine={false}/>
        <YAxis yAxisId="bright" orientation="right" tick={{ ...AXIS, fill: '#a855f7' }} domain={[0, 100]}  axisLine={false} tickLine={false}/>
        <Tooltip {...TIP}/>
        <Legend {...LEG}/>
        <Line yAxisId="lux"    type="monotoneX" dataKey="lux"    stroke="#f9c74f" strokeWidth={2.5} dot={false} name="Lux"/>
        <Line yAxisId="bright" type="monotoneX" dataKey="ml"     stroke="#a855f7" strokeWidth={2.5} dot={false} name="ML Brightness %"/>
        <Line yAxisId="bright" type="monotoneX" dataKey="actual" stroke="#4cc9f0" strokeWidth={1.5} dot={false} name="Actual %" strokeDasharray="4 2"/>
      </LineChart>
    </ResponsiveContainer>
  );
}

export function EnvChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={170}>
      <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
        <defs>
          <linearGradient id="tempLine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#f87171"/>
            <stop offset="100%" stopColor="#fb923c"/>
          </linearGradient>
        </defs>
        <CartesianGrid {...GRID}/>
        <XAxis dataKey="time" tick={AXIS} interval="preserveStartEnd" axisLine={false} tickLine={false}/>
        <YAxis tick={AXIS} axisLine={false} tickLine={false}/>
        <Tooltip {...TIP}/>
        <Legend {...LEG}/>
        <Line type="monotoneX" dataKey="temp"     stroke="#f87171" strokeWidth={2.5} dot={false} name="Temp °C"/>
        <Line type="monotoneX" dataKey="humidity" stroke="#4cc9f0" strokeWidth={2.5} dot={false} name="Humidity %"/>
      </LineChart>
    </ResponsiveContainer>
  );
}
