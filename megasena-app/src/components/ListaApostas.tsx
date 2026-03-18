import { useState, useMemo } from "react";
import { Aposta } from "../types";
import { CardAposta } from "./CardAposta";

interface ListaApostasProps {
  apostas: Aposta[];
  onApostaExcluida: () => void;
}

type FiltroApostas = "todas" | "ativas" | "vencidas" | "premiadas";

const calcularPreco = (qtdNumeros: number): number => {
  const precos: Record<number, number> = {
    6: 5.0,
    7: 35.0,
    8: 140.0,
    9: 420.0,
    10: 1050.0,
    11: 2310.0,
    12: 4620.0,
    13: 8580.0,
    14: 15015.0,
    15: 25025.0,
    16: 40040.0,
    17: 61880.0,
    18: 92820.0,
    19: 135660.0,
    20: 193800.0,
  };
  return precos[qtdNumeros] || 0;
};

export function ListaApostas({ apostas, onApostaExcluida }: ListaApostasProps) {
  const [filtro, setFiltro] = useState<FiltroApostas>("todas");

  const analytics = useMemo(() => {
    let totalGasto = 0;
    let quadras = 0;
    let quinas = 0;
    let senas = 0;
    const frequencia: Record<number, number> = {};

    apostas.forEach((aposta) => {
      totalGasto +=
        calcularPreco(aposta.numeros.length) * aposta.quantidadeConcursos;

      aposta.numeros.forEach((n) => {
        frequencia[n] = (frequencia[n] || 0) + 1;
      });

      if (aposta.acertos) {
        Object.values(aposta.acertos).forEach((acertos) => {
          if (acertos === 4) quadras++;
          if (acertos === 5) quinas++;
          if (acertos === 6) senas++;
        });
      }
    });

    const numerosQuentes = Object.entries(frequencia)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([n]) => Number(n));

    return { totalGasto, quadras, quinas, senas, numerosQuentes };
  }, [apostas]);

  const filtradas = useMemo(() => {
    return apostas.filter((aposta) => {
      const resultadosRecebidos = Object.keys(
        aposta.resultadosConcursos || {},
      ).length;
      const isAtiva = resultadosRecebidos < aposta.quantidadeConcursos;
      const isVencida = resultadosRecebidos >= aposta.quantidadeConcursos;

      let isPremiada = false;
      if (aposta.acertos) {
        Object.values(aposta.acertos).forEach((acertos) => {
          if (acertos >= 4) isPremiada = true;
        });
      }

      if (filtro === "ativas" && !isAtiva) return false;
      if (filtro === "vencidas" && !isVencida) return false;
      if (filtro === "premiadas" && !isPremiada) return false;

      return true;
    });
  }, [apostas, filtro]);

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
    <div className="space-y-6">
      {/* Dashboard de Analytics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-2xl p-4 flex flex-col justify-center shadow-sm">
          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">
            Investimento
          </span>
          <span className="text-lg font-black text-foreground mt-1 tracking-tight">
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(analytics.totalGasto)}
          </span>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 flex flex-col justify-center shadow-sm">
          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">
            Premiações
          </span>
          <div className="flex items-center gap-3 mt-1">
            <div className="flex items-center gap-1" title="Quadras">
              <span className="text-sm font-black text-yellow-500">
                {analytics.quadras}
              </span>
              <span className="text-[10px] font-bold text-muted-foreground">
                Qd
              </span>
            </div>
            <div className="flex items-center gap-1" title="Quinas">
              <span className="text-sm font-black text-yellow-600">
                {analytics.quinas}
              </span>
              <span className="text-[10px] font-bold text-muted-foreground">
                Qn
              </span>
            </div>
            <div className="flex items-center gap-1" title="Senas">
              <span className="text-sm font-black text-yellow-700">
                {analytics.senas}
              </span>
              <span className="text-[10px] font-bold text-muted-foreground">
                Sn
              </span>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 flex flex-col justify-center col-span-2 shadow-sm">
          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-2">
            Dezenas Quentes (Top 5)
          </span>
          <div className="flex gap-2">
            {analytics.numerosQuentes.map((n) => (
              <div
                key={n}
                className="w-8 h-8 rounded-full bg-green-sphere/10 border border-green-sphere/30 text-green-sphere flex items-center justify-center text-xs font-black shadow-sm"
              >
                {n.toString().padStart(2, "0")}
              </div>
            ))}
            {analytics.numerosQuentes.length === 0 && (
              <span className="text-xs text-muted-foreground">
                Nenhuma aposta registrada
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => setFiltro("todas")}
          className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all shadow-sm ${
            filtro === "todas"
              ? "bg-foreground text-background ring-2 ring-foreground/20"
              : "bg-card border border-border text-muted-foreground hover:bg-muted"
          }`}
        >
          Todas
        </button>
        <button
          onClick={() => setFiltro("ativas")}
          className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all shadow-sm ${
            filtro === "ativas"
              ? "bg-green-sphere text-white ring-2 ring-green-sphere/20"
              : "bg-card border border-border text-muted-foreground hover:bg-muted"
          }`}
        >
          Ativas
        </button>
        <button
          onClick={() => setFiltro("vencidas")}
          className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all shadow-sm ${
            filtro === "vencidas"
              ? "bg-muted-foreground text-background ring-2 ring-muted-foreground/20"
              : "bg-card border border-border text-muted-foreground hover:bg-muted"
          }`}
        >
          Vencidas
        </button>
        <button
          onClick={() => setFiltro("premiadas")}
          className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all shadow-sm ${
            filtro === "premiadas"
              ? "bg-yellow-500 text-white ring-2 ring-yellow-500/20"
              : "bg-card border border-border text-muted-foreground hover:bg-muted"
          }`}
        >
          Premiadas
        </button>
      </div>

      {/* Lista */}
      <div className="space-y-3">
        {filtradas.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm border border-dashed border-border rounded-3xl font-medium">
            Nenhuma aposta encontrada para este filtro.
          </div>
        ) : (
          filtradas.map((aposta) => (
            <CardAposta
              key={aposta.id}
              aposta={aposta}
              onExcluida={onApostaExcluida}
            />
          ))
        )}
      </div>
    </div>
  );
}
