// Graphique glycémie : une seule courbe (corail), mais chaque point porte
// une forme différente selon le contexte de la mesure (à jeun / avant
// repas / après repas / coucher) — pour distinguer les contextes sans
// sortir de la palette teal/corail du design system.
import { useMemo } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CONTEXTES_PAR_TYPE } from '../../validation/mesureValidation.js';
import { arrondirPourUnite, convertirDepuisMgDl } from '../../lib/uniteGlycemie.js';

const CORAIL = '#D85A30';
const TAILLE = 4;

const FORMES = {
  a_jeun: 'cercle',
  avant_repas: 'triangle',
  apres_repas: 'losange',
  coucher: 'carre',
};

function Forme({ forme, cx, cy, taille = TAILLE, className }) {
  switch (forme) {
    case 'triangle': {
      const points = [
        [cx, cy - taille],
        [cx - taille, cy + taille * 0.75],
        [cx + taille, cy + taille * 0.75],
      ]
        .map((p) => p.join(','))
        .join(' ');
      return <polygon points={points} fill={CORAIL} className={className} />;
    }
    case 'losange': {
      const points = [
        [cx, cy - taille],
        [cx + taille, cy],
        [cx, cy + taille],
        [cx - taille, cy],
      ]
        .map((p) => p.join(','))
        .join(' ');
      return <polygon points={points} fill={CORAIL} className={className} />;
    }
    case 'carre':
      return <rect x={cx - taille * 0.85} y={cy - taille * 0.85} width={taille * 1.7} height={taille * 1.7} fill={CORAIL} className={className} />;
    case 'cercle':
    default:
      return <circle cx={cx} cy={cy} r={taille * 0.85} fill={CORAIL} className={className} />;
  }
}

function PointGlycemie(props) {
  const { cx, cy, payload } = props;
  return <Forme forme={FORMES[payload.contexte]} cx={cx} cy={cy} />;
}

const FORMATEUR_AXE = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit' });
const FORMATEUR_INFOBULLE = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

const LIBELLE_CONTEXTE = Object.fromEntries(CONTEXTES_PAR_TYPE.glycemie.map((c) => [c.valeur, c.label]));

function Infobulle({ active, payload, unite }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;

  return (
    <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2 font-sans text-xs">
      <p className="mb-1 text-neutral-400">{FORMATEUR_INFOBULLE.format(point.timestamp)}</p>
      <p className="font-mono text-corail">
        {point.valeur1} {unite}
      </p>
      <p className="text-neutral-500">{LIBELLE_CONTEXTE[point.contexte]}</p>
    </div>
  );
}

export default function GraphiqueGlycemie({ donnees, unite = 'mg/dL' }) {
  // Le graphique reçoit des valeurs mg/dL (unité canonique de l'API,
  // voir lib/uniteGlycemie.js) et les convertit vers l'unité préférée de
  // l'utilisateur juste pour l'affichage (axe, courbe, infobulle).
  const donneesConverties = useMemo(
    () =>
      donnees.map((mesure) => ({
        ...mesure,
        valeur1: arrondirPourUnite(convertirDepuisMgDl(mesure.valeur1, unite), unite),
      })),
    [donnees, unite],
  );

  return (
    <div className="rounded-xl bg-white p-3">
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={donneesConverties} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
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
          <Tooltip content={<Infobulle unite={unite} />} />
          <Line
            type="monotone"
            dataKey="valeur1"
            stroke="#D85A30"
            strokeWidth={2}
            dot={<PointGlycemie />}
            activeDot={{ r: 5, fill: CORAIL }}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1.5 font-sans text-[11px] text-neutral-500">
        {CONTEXTES_PAR_TYPE.glycemie.map((c) => (
          <span key={c.valeur} className="flex items-center gap-1.5">
            <svg width={10} height={10} viewBox="-5 -5 10 10">
              <Forme forme={FORMES[c.valeur]} cx={0} cy={0} taille={4} />
            </svg>
            {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}
