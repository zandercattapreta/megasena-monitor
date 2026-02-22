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

import { Aposta } from '../types';
import { CardAposta } from './CardAposta';

interface ListaApostasProps {
  apostas: Aposta[];
  onApostaExcluida: () => void;
}

export function ListaApostas({ apostas, onApostaExcluida }: ListaApostasProps) {
  if (apostas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <div className="text-6xl mb-4">🎱</div>
        <p className="text-lg font-medium">Nenhuma aposta cadastrada</p>
        <p className="text-sm">Comece adicionando números acima</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {apostas.map(aposta => (
        <CardAposta
          key={aposta.id}
          aposta={aposta}
          onExcluida={onApostaExcluida}
        />
      ))}
    </div>
  );
}
