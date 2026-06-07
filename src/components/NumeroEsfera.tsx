/*
 * PROGRAMA: NumeroEsfera.tsx
 * DESCRIÇÃO: Este componente renderiza de forma visual uma dezena da Mega-Sena em formato esférico (circular).
 *            Permite personalizar a exibição com base em estados (selecionado, não selecionado ou dezena acertada)
 *            e tamanhos dinâmicos (pequeno, médio ou grande). Também é clicável se um callback for provido.
 * QUEM O CHAMA: Chamado por múltiplos componentes (como `App.tsx`, `CardAposta.tsx`, `FormCadastro.tsx`,
 *               `GridNumeros.tsx` e `ModalResultado.tsx`) para renderizar dezenas.
 * QUEM ELE CHAMA: Não realiza chamadas funcionais de subcomponentes.
 * O QUE ESPERA RECEBER:
 *   - `numero`: Dezena a ser desenhada (number).
 *   - `selecionado`: Flag opcional de destaque da dezena.
 *   - `acertou`: Flag opcional indicando se a dezena foi acertada no sorteio (adiciona classes animadas).
 *   - `tamanho`: Define a escala visual ('small' | 'medium' | 'large').
 *   - `onClick`: Callback opcional disparado quando a esfera é clicada.
 * O QUE ENVIA (RETORNA):
 *   - Retorna um contêiner HTML div estilizado em formato de esfera com o número formatado com dois dígitos.
 *
 * Copyright (C) 2025 Zander Cattapreta
 * Licensed under the GNU General Public License v3
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
  
  // Mapeamento de classes CSS correspondentes ao tamanho solicitado da esfera
  const sizeClasses = {
    small: 'w-7 h-7 text-[10px]',
    medium: 'w-8 h-8 sm:w-10 sm:h-10 text-xs sm:text-lg',
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
      {/* Exibe o número formatado sempre com 2 dígitos (ex: 01, 09, 10) */}
      {numero.toString().padStart(2, '0')}
    </div>
  );
}
