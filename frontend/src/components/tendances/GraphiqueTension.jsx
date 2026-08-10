// Graphique tension : systolique et diastolique (deux nuances de teal),
// pouls en courbe secondaire discrète (gris, fine, en pointillés) pour ne
// pas rivaliser visuellement avec la tension elle-même.
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const FORMATEUR_AXE = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit' });
const FORMATEUR_INFOBULLE = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

function Infobulle({ active, payload }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;

  return (
    <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2 font-sans text-xs">
      <p className="mb-1 text-neutral-400">{FORMATEUR_INFOBULLE.format(point.timestamp)}</p>
      <p className="font-mono text-teal">
        {point.valeur1}/{point.valeur2} mmHg
      </p>
      {point.pouls != null && <p className="font-mono text-neutral-500">{point.pouls} bpm</p>}
    </div>
  );
}

export default function GraphiqueTension({ donnees }) {
  return (
    <div className="rounded-xl bg-white p-3">
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={donnees} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
          <CartesianGrid vertical={false} stroke="#E5E1D8" />
          <XAxis
            dataKey="timestamp"
            type="number"
            domain={['dataMin', 'dataMax']}
            tickFormatter={(ts) => FORMATEUR_AXE.format(ts)}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: '#A3A3A3' }}
            minTickGap={24}
          />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#A3A3A3' }} width={32} />
          <Tooltip content={<Infobulle />} />
          <Line type="monotone" dataKey="valeur1" stroke="#1D9E75" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          <Line
            type="monotone"
            dataKey="valeur2"
            stroke="#1D9E75"
            strokeOpacity={0.5}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="pouls"
            stroke="#A3A3A3"
            strokeWidth={1.5}
            strokeDasharray="4 3"
            dot={false}
            activeDot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 font-sans text-[11px] text-neutral-500">
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-3 rounded-full bg-teal" /> Systolique
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-3 rounded-full bg-teal/50" /> Diastolique
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-3 rounded-full border-t border-dashed border-neutral-400" /> Pouls
        </span>
      </div>
    </div>
  );
}
