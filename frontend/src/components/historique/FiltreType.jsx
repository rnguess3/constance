import SelecteurSegments from '../SelecteurSegments.jsx';

const OPTIONS = [
  { valeur: 'tout', label: 'Tout' },
  { valeur: 'tension', label: 'Tension' },
  { valeur: 'glycemie', label: 'Glycémie' },
];

export default function FiltreType({ valeur, onChange }) {
  return <SelecteurSegments options={OPTIONS} valeur={valeur} onChange={onChange} />;
}
