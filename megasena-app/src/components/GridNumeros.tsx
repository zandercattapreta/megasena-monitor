/*
 * MegaSena Monitor - Minimalist desktop application for managing bets.
 * Copyright (C) 2025 Zander Cattapreta
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { NumeroEsfera } from './NumeroEsfera';

interface GridNumerosProps {
  selecionados: number[];
  onChange: (numeros: number[]) => void;
  maxSelecao?: number;
}

export function GridNumeros({ selecionados, onChange, maxSelecao = 15 }: GridNumerosProps) {
  const numeros = Array.from({ length: 60 }, (_, i) => i + 1);

  const toggleNumero = (num: number) => {
    if (selecionados.includes(num)) {
      // Desselecionar
      onChange(selecionados.filter(n => n !== num));
    } else if (selecionados.length < maxSelecao) {
      // Selecionar (ordenado)
      onChange([...selecionados, num].sort((a, b) => a - b));
    }
  };

  return (
    <div className="grid grid-cols-10 gap-2 p-4 bg-muted/20 rounded-2xl border border-border/50">
      {numeros.map(num => (
        <NumeroEsfera
          key={num}
          numero={num}
          selecionado={selecionados.includes(num)}
          onClick={() => toggleNumero(num)}
        />
      ))}
    </div>
  );
}
