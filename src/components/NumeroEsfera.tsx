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

interface NumeroEsferaProps {
  numero: number;
  selecionado?: boolean;
  acertou?: boolean;
  tamanho?: 'small' | 'medium' | 'large';
  onClick?: () => void;
}

export function NumeroEsfera({ 
  numero, 
  selecionado = false, 
  acertou = false,
  tamanho = 'medium',
  onClick 
}: NumeroEsferaProps) {
  const sizeClasses = {
    small: 'w-6 h-6 text-xs',
    medium: 'w-10 h-10 text-lg',
    large: 'w-12 h-12 text-xl'
  };

  return (
    <div
      onClick={onClick}
      className={`
        ${sizeClasses[tamanho]} rounded-full font-bold flex items-center justify-center
        transition-all duration-300 select-none
        ${onClick ? 'cursor-pointer' : ''}
        ${acertou 
          ? 'bg-green-sphere text-white winning-sphere scale-110 font-black' 
          : selecionado 
            ? 'bg-green-sphere text-white scale-105 border-transparent shadow-md font-bold' 
            : 'bg-card border-2 border-border text-foreground hover:border-green-sphere hover:text-green-sphere'}
      `}
    >
      {numero.toString().padStart(2, '0')}
    </div>
  );
}
