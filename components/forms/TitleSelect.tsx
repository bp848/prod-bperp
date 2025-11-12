
import React, { useEffect, useState } from 'react';
import { getTitles } from '../../services/dataService';
import { Title } from '../../types';

type Props = {
  value?: string; // id
  onChange: (id: string) => void;
  required?: boolean;
  name?: string;
  id?: string;
  disabled?: boolean;
  className?: string; // Added className prop
};

export default function TitleSelect({ value, onChange, required, name = 'positionId', id = 'positionId', disabled, className }: Props) {
  const [list, setList] = useState<Title[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTitles().then(setList).finally(() => setLoading(false));
  }, []);

  return (
    <select
      id={id}
      name={name}
      required={required}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled || loading}
      className={`w-full text-sm bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 ${className || ''}`}
    >
      <option value="">役職を選択</option>
      {list.map(t => (
        <option key={t.id} value={t.id}>{t.name}</option>
      ))}
    </select>
  );
}
