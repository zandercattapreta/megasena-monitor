/*
 * PROGRAMA: GridNumeros.tsx
 * DESCRIÇÃO: Este componente renderiza a grade interativa de números de 1 a 60.
 *            Controla a seleção de dezenas para aposta respeitando um limite máximo definido.
 *            Ao clicar em um número, inclui ou remove o elemento na listagem, ordenando-o de forma crescente.
 * QUEM O CHAMA: Renderizado dentro do componente `FormCadastro.tsx` (formulário de nova aposta).
 * QUEM ELE CHAMA:
 *   - Componentes: `NumeroEsfera.tsx` (para desenhar individualmente cada esfera clicável).
 * O QUE ESPERA RECEBER:
 *   - `selecionados`: Vetor com os números atualmente selecionados na aposta (number[]).
 *   - `onChange`: Callback disparado ao alterar a listagem de dezenas selecionadas.
 *   - `maxSelecao`: Limite máximo de dezenas que podem ser selecionadas (padrão 20).
 * O QUE ENVIA (RETORNA):
 *   - Retorna um contêiner em grid HTML composto por 60 botões em formato de esferas.
 *
 * Copyright (C) 2025 Zander Cattapreta
 * Licensed under the GNU General Public License v3
 */

import { useCallback, useRef, useEffect } from 'react';
import { NumeroEsfera } from './NumeroEsfera';

interface GridNumerosProps {
  selecionados: number[];
  onChange: (numeros: number[]) => void;
  maxSelecao?: number;
}

export function GridNumeros({ selecionados, onChange, maxSelecao = 20 }: GridNumerosProps) {
  // Inicializa um vetor estático contendo dezenas de 1 a 60
  const numeros = Array.from({ length: 60 }, (_, i) => i + 1);

  // Mantém a referência mais recente de selecionados para o callback
  const selecionadosRef = useRef(selecionados);
  useEffect(() => {
    selecionadosRef.current = selecionados;
  }, [selecionados]);

  /// Trata a ativação ou desativação de uma dezena da grade
  const toggleNumero = useCallback((num: number) => {
    const atuais = selecionadosRef.current;
    if (atuais.includes(num)) {
      // Se já estiver selecionado, remove do vetor
      onChange(atuais.filter(n => n !== num));
    } else if (atuais.length < maxSelecao) {
      // Se estiver abaixo do limite máximo de dezenas, adiciona e ordena o vetor de forma crescente
      onChange([...atuais, num].sort((a, b) => a - b));
    }
  }, [onChange, maxSelecao]);

  return (
    <div className="grid grid-cols-10 gap-2 p-4 bg-muted/20 rounded-2xl border border-border/50">
      {numeros.map(num => (
        <NumeroEsfera
          key={num}
          numero={num}
          selecionado={selecionados.includes(num)}
          onClick={toggleNumero}
        />
      ))}
    </div>
  );
}
