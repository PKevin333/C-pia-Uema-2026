import { useState, useRef, useCallback, useEffect } from 'react';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface OverlayImagem {
  img: HTMLImageElement;
  rect: DOMRect;
}

export const ALÇAS = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'] as const;
export type DireçãoAlça = typeof ALÇAS[number];

export const CURSOR_POR_ALÇA: Record<DireçãoAlça, string> = {
  nw: 'nw-resize', n: 'n-resize',  ne: 'ne-resize',
  e:  'e-resize',  se: 'se-resize', s:  's-resize',
  sw: 'sw-resize', w:  'w-resize',
};

export const POSIÇÃO_ALÇAS: Record<DireçãoAlça, React.CSSProperties> = {
  nw: { left: -5,     top: -5     },
  n:  { left: '50%',  top: -5,    transform: 'translateX(-50%)' },
  ne: { right: -5,    top: -5     },
  e:  { right: -5,    top: '50%', transform: 'translateY(-50%)' },
  se: { right: -5,    bottom: -5  },
  s:  { left: '50%',  bottom: -5, transform: 'translateX(-50%)' },
  sw: { left: -5,     bottom: -5  },
  w:  { left: -5,     top: '50%', transform: 'translateY(-50%)' },
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useInteracaoImagem(
  refEditor: React.RefObject<HTMLDivElement>,
  aoAlterarConteudo: () => void,
) {
  const [selecionada, setSelecionada] = useState<OverlayImagem | null>(null);
  const refOverlay                    = useRef<HTMLDivElement>(null);
  const refIndicadorSoltura           = useRef<HTMLDivElement | null>(null);

  // ── Utilitários ──────────────────────────────────────────────────────────

  /** Atualiza o rect da imagem selecionada com base na posição atual na tela */
  const sincronizarRect = useCallback((img: HTMLImageElement) => {
    setSelecionada({ img, rect: img.getBoundingClientRect() });
  }, []);

  const desselecionar = useCallback(() => setSelecionada(null), []);

  // ── Seleciona imagem ao clicar ────────────────────────────────────────────

  const aoClicarNoEditor = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === 'IMG') {
      sincronizarRect(e.target as HTMLImageElement);
    } else {
      desselecionar();
    }
  }, [sincronizarRect, desselecionar]);

  // ── Desseleciona ao clicar fora do editor e do overlay ───────────────────

  useEffect(() => {
    const aoClicarFora = (e: MouseEvent) => {
      const foraDoOverlay = !refOverlay.current?.contains(e.target as Node);
      const foraDoEditor  = !refEditor.current?.contains(e.target as Node);
      if (foraDoOverlay && foraDoEditor) desselecionar();
    };
    document.addEventListener('mousedown', aoClicarFora);
    return () => document.removeEventListener('mousedown', aoClicarFora);
  }, [refEditor, desselecionar]);

  // ── Sincroniza overlay ao rolar a página ──────────────────────────────────

  useEffect(() => {
    const elScroll = refEditor.current?.closest('.overflow-y-auto');
    if (!elScroll) return;
    const aoRolar = () => {
      setSelecionada(prev => prev ? { ...prev, rect: prev.img.getBoundingClientRect() } : prev);
    };
    elScroll.addEventListener('scroll', aoRolar);
    return () => elScroll.removeEventListener('scroll', aoRolar);
  }, [refEditor]);

  // ── Redimensionar arrastando as alças ─────────────────────────────────────

  const iniciarRedimensionamento = useCallback((e: React.MouseEvent, direcao: DireçãoAlça) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selecionada) return;

    const { img }   = selecionada;
    const origemX   = e.clientX;
    const origemY   = e.clientY;
    const larguraI  = img.offsetWidth;
    const alturaI   = img.offsetHeight;
    const proporção = larguraI / alturaI;

    const aoMover = (ev: MouseEvent) => {
      const dx = ev.clientX - origemX;
      const dy = ev.clientY - origemY;
      let novaLargura = larguraI;

      if      (direcao.includes('e')) novaLargura = larguraI + dx;
      else if (direcao.includes('w')) novaLargura = larguraI - dx;
      else if (direcao.includes('s')) novaLargura = larguraI + dy * proporção;
      else if (direcao.includes('n')) novaLargura = larguraI - dy * proporção;

      img.style.width  = `${Math.max(40, novaLargura)}px`;
      img.style.height = 'auto';
      sincronizarRect(img);
    };

    const aoSoltar = () => {
      document.removeEventListener('mousemove', aoMover);
      document.removeEventListener('mouseup', aoSoltar);
      aoAlterarConteudo();
    };

    document.addEventListener('mousemove', aoMover);
    document.addEventListener('mouseup', aoSoltar);
  }, [selecionada, sincronizarRect, aoAlterarConteudo]);

  // ── Arrastar imagem para reposicionar no fluxo do documento ──────────────
  //
  // Estratégia: durante o arrasto, percorremos os filhos em bloco do editor e
  // encontramos o ponto de inserção mais próximo comparando a posição Y do
  // cursor com o ponto médio de cada elemento. Uma linha azul fina ("indicador
  // de soltura") mostra onde a imagem será inserida. Ao soltar, movemos o nó
  // raiz da imagem (figure ou img) para essa posição via insertBefore / appendChild.

  const iniciarArrasto = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selecionada || !refEditor.current) return;

    const { img }    = selecionada;
    const raizImagem = (img.closest('figure') ?? img) as HTMLElement;
    const editor     = refEditor.current;

    // Cria a linha indicadora de soltura
    const indicador  = document.createElement('div');
    indicador.style.cssText = [
      'position:fixed', 'height:3px', 'border-radius:2px',
      'background:#3b82f6', 'pointer-events:none', 'z-index:9998',
      'transition:top 60ms ease',
    ].join(';');
    document.body.appendChild(indicador);
    refIndicadorSoltura.current = indicador;

    // Fantasma: clone semitransparente que segue o cursor
    const fantasma = raizImagem.cloneNode(true) as HTMLElement;
    fantasma.style.cssText = [
      'position:fixed', 'opacity:0.45', 'pointer-events:none',
      'z-index:9997', `width:${raizImagem.offsetWidth}px`,
    ].join(';');
    document.body.appendChild(fantasma);

    let nodoAlvo: Element | null = null;
    let inserirAntes              = true;

    const obterFilhosBlocos = (): Element[] =>
      Array.from(editor.children).filter(
        (el) => el !== raizImagem && getComputedStyle(el).display !== 'inline',
      );

    const aoMover = (ev: MouseEvent) => {
      // Move o fantasma junto ao cursor
      fantasma.style.left = `${ev.clientX - raizImagem.offsetWidth / 2}px`;
      fantasma.style.top  = `${ev.clientY - raizImagem.offsetHeight / 2}px`;

      // Encontra o ponto de inserção mais próximo
      const blocos     = obterFilhosBlocos();
      const rectEditor = editor.getBoundingClientRect();
      let   melhor: Element | null = null;
      let   menorDistancia         = Infinity;
      let   antes                  = true;

      blocos.forEach((bloco) => {
        const r      = bloco.getBoundingClientRect();
        const meio   = r.top + r.height / 2;
        const dist   = Math.abs(ev.clientY - meio);
        if (dist < menorDistancia) {
          menorDistancia = dist;
          melhor         = bloco;
          antes          = ev.clientY < meio;
        }
      });

      nodoAlvo     = melhor;
      inserirAntes = antes;

      // Posiciona o indicador
      if (melhor) {
        const r = (melhor as HTMLElement).getBoundingClientRect();
        indicador.style.top   = `${antes ? r.top - 2 : r.bottom - 2}px`;
        indicador.style.left  = `${rectEditor.left}px`;
        indicador.style.width = `${rectEditor.width}px`;
      }
    };

    const aoSoltar = () => {
      document.removeEventListener('mousemove', aoMover);
      document.removeEventListener('mouseup', aoSoltar);
      fantasma.remove();
      indicador.remove();
      refIndicadorSoltura.current = null;

      if (nodoAlvo) {
        if (inserirAntes) {
          editor.insertBefore(raizImagem, nodoAlvo);
        } else {
          nodoAlvo.insertAdjacentElement('afterend', raizImagem);
        }
      }

      sincronizarRect(img);
      aoAlterarConteudo();
    };

    document.addEventListener('mousemove', aoMover);
    document.addEventListener('mouseup', aoSoltar);
  }, [selecionada, refEditor, sincronizarRect, aoAlterarConteudo]);

  // ── Alinhamento (float / margin auto) ────────────────────────────────────

  const definirAlinhamento = useCallback((alinhamento: 'left' | 'center' | 'right') => {
    if (!selecionada) return;
    const { img } = selecionada;
    const alvo    = (img.closest('figure') as HTMLElement) ?? img;

    Object.assign(alvo.style, {
      float:        '',
      display:      'block',
      marginTop:    '12px',
      marginBottom: '12px',
      marginLeft:   alinhamento === 'right'  ? 'auto' : alinhamento === 'center' ? 'auto' : '',
      marginRight:  alinhamento === 'left'   ? 'auto' : alinhamento === 'center' ? 'auto' : '',
    });

    if (alinhamento === 'left') {
      alvo.style.float       = 'left';
      alvo.style.marginRight = '16px';
      alvo.style.marginLeft  = '';
    } else if (alinhamento === 'right') {
      alvo.style.float       = 'right';
      alvo.style.marginLeft  = '16px';
      alvo.style.marginRight = '';
    }

    aoAlterarConteudo();
    setTimeout(() => sincronizarRect(img), 30);
  }, [selecionada, sincronizarRect, aoAlterarConteudo]);

  // ── Definir largura por percentual ────────────────────────────────────────

  const definirLarguraPorcentual = useCallback((porcentagem: number) => {
    if (!selecionada) return;
    const { img } = selecionada;
    const pai     = (img.closest('figure') as HTMLElement) ?? img.parentElement;
    img.style.width  = `${Math.round((pai?.offsetWidth ?? 600) * porcentagem / 100)}px`;
    img.style.height = 'auto';
    aoAlterarConteudo();
    setTimeout(() => sincronizarRect(img), 30);
  }, [selecionada, sincronizarRect, aoAlterarConteudo]);

  // ── Deletar imagem ────────────────────────────────────────────────────────

  const deletarImagem = useCallback(() => {
    if (!selecionada) return;
    (selecionada.img.closest('figure') ?? selecionada.img).remove();
    desselecionar();
    aoAlterarConteudo();
  }, [selecionada, desselecionar, aoAlterarConteudo]);

  // ── Estilo do overlay (posição fixa sobre a imagem) ───────────────────────

  const estiloOverlay: React.CSSProperties = selecionada
    ? { position: 'fixed', left: selecionada.rect.left, top: selecionada.rect.top, width: selecionada.rect.width, height: selecionada.rect.height, pointerEvents: 'none', zIndex: 9999 }
    : { display: 'none' };

  return {
    selecionada,
    refOverlay,
    estiloOverlay,
    aoClicarNoEditor,
    iniciarRedimensionamento,
    iniciarArrasto,
    definirAlinhamento,
    definirLarguraPorcentual,
    deletarImagem,
  };
}
