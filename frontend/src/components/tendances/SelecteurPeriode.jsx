import SelecteurSegments from '../SelecteurSegments.jsx';
import { PERIODES } from '../../lib/statistiques.js';

const OPTIONS = PERIODES.map(({ valeur, label }) => ({ valeur, label }));

export default function SelecteurPeriode({ valeur, onChange }) {
  return <SelecteurSegments options={OPTIONS} valeur={valeur} onChange={onChange} />;
}
