"use client";

import { useState, useRef, useCallback } from "react";

// ─────────────────────────────────────────────
// 🔧 CONFIGURAÇÃO — edite apenas aqui
// ─────────────────────────────────────────────
const KIWIFY_URL = "https://pay.kiwify.com.br/uiagx19";
const TEMPLATE_URL = "/Template Figurinha.png";
const PRECO = "R$19,90";
// ─────────────────────────────────────────────

type Tela = "landing" | "passo1" | "passo2" | "passo3" | "confirma" | "preview";

interface Dados {
  nome: string;
  sobrenome: string;
  dia: string;
  mes: string;
  ano: string;
  email: string;
  clube: string;
  peso: string;
  altura: string;
}

const MESES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const DIAS = Array.from({length:31},(_,i)=>String(i+1).padStart(2,"0"));
const ANOS = Array.from({length:20},(_,i)=>String(2024-i));

export default function Home() {
  const [tela, setTela] = useState<Tela>("landing");
  const [dados, setDados] = useState<Dados>({
    nome:"", sobrenome:"", dia:"", mes:"", ano:"", email:"",
    clube:"", peso:"", altura:""
  });
  const [fotoOriginal, setFotoOriginal] = useState<string|null>(null);
  const [fotoProcessada, setFotoProcessada] = useState<string|null>(null);
  const [processando, setProcessando] = useState(false);
  const [erroProcessamento, setErroProcessamento] = useState<string|null>(null);
  const [etapaProcessamento, setEtapaProcessamento] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const atualizaDados = (campo: keyof Dados, valor: string) =>
    setDados(d => ({...d, [campo]: valor}));

  // ── Upload foto ──────────────────────────────
  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setFotoOriginal(url);
    setFotoProcessada(null);
    setErroProcessamento(null);
  }

  // ── Processa foto: remove fundo + camiseta ───
  async function processarFoto() {
    if (!fotoOriginal) return;
    setProcessando(true);
    setErroProcessamento(null);

    try {
      const blob = await fetch(fotoOriginal).then(r => r.blob());
      const base64 = await new Promise<string>((res, rej) => {
        const reader = new FileReader();
        reader.onload = () => res((reader.result as string).split(",")[1]);
        reader.onerror = rej;
        reader.readAsDataURL(blob);
      });

      setEtapaProcessamento("Removendo fundo...");
      const resp = await fetch("/api/processar-foto", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({imageBase64: base64, mimeType: blob.type}),
      });

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || "Erro no processamento");
      }

      setEtapaProcessamento("Aplicando camiseta...");
      const {imageUrl} = await resp.json();
      setFotoProcessada(imageUrl);
    } catch (err: unknown) {
      setErroProcessamento(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setProcessando(false);
      setEtapaProcessamento("");
    }
  }

  // ── Monta data formatada ─────────────────────
  const dataFormatada = dados.dia && dados.mes && dados.ano
    ? `${dados.dia}-${MESES[parseInt(dados.mes)-1]}-${dados.ano}`
    : "00-00-0000";

  const nomeCompleto = `${dados.nome} ${dados.sobrenome}`.trim().toUpperCase();
  const fotoFinal = fotoProcessada || fotoOriginal;

  // ── Progresso ────────────────────────────────
  const passos = ["passo1","passo2","passo3","confirma"];
  const progressoPct = tela === "preview" ? 100
    : passos.indexOf(tela) >= 0 ? ((passos.indexOf(tela)+1)/4)*100 : 0;

  function irParaKiwify() {
    window.open(KIWIFY_URL, "_blank");
  }

  // ════════════════════════════════════════════
  return (
    <main className="min-h-screen font-sans" style={{fontFamily:"'Nunito', sans-serif"}}>

      {/* ══════════════ LANDING ══════════════ */}
      {tela === "landing" && (
        <div className="min-h-screen bg-[#FFD600] flex flex-col items-center px-5 py-10 text-center">
          <div className="mb-2">
            <span className="bg-[#1B3A8A] text-white text-[10px] font-black tracking-widest uppercase px-4 py-1.5 rounded-full">
              ⚽ Copa do Mundo 2026
            </span>
          </div>

          <h1 className="text-[#1B3A8A] font-black text-3xl leading-tight mt-4 mb-2 max-w-sm"
              style={{fontFamily:"'Bebas Neue', sans-serif", letterSpacing:"1px"}}>
            TRANSFORME SEU FILHO EM UMA{" "}
            <span className="text-[#006633]">FIGURINHA DA COPA!</span>
          </h1>

          <p className="text-[#1B3A8A]/80 text-sm mb-6 max-w-xs leading-relaxed">
            Responda algumas perguntas rápidas e veja como criar uma figurinha exclusiva com o nome, foto e estilo do seu pequeno craque.
          </p>

          {/* Figurinha demo */}
          <div className="relative mb-8" style={{width:220, height:300}}>
            <div className="absolute inset-0 rounded-2xl overflow-hidden shadow-2xl border-4 border-white/50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={TEMPLATE_URL} alt="Template" className="w-full h-full object-cover"/>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white/20 font-black text-4xl rotate-[-30deg] select-none"
                    style={{fontFamily:"'Bebas Neue', sans-serif"}}>PRÉVIA</span>
            </div>
          </div>

          <button
            onClick={() => setTela("passo1")}
            className="w-full max-w-xs bg-[#1B3A8A] text-white font-black text-xl rounded-2xl py-5 shadow-lg hover:bg-[#142d6e] active:scale-95 transition-all"
            style={{fontFamily:"'Bebas Neue', sans-serif", letterSpacing:"2px"}}
          >
            INICIAR ⚽
          </button>

          <p className="text-[#1B3A8A]/60 text-xs mt-4">
            Mais de 500 famílias já criaram a figurinha do seu craque!
          </p>
        </div>
      )}

      {/* ══════════════ PASSOS ══════════════ */}
      {["passo1","passo2","passo3","confirma","preview"].includes(tela) && (
        <div className="min-h-screen bg-[#FFD600]">

          {/* Barra de progresso */}
          {tela !== "preview" && (
            <div className="px-5 pt-5 pb-2">
              <div className="flex justify-between mb-1">
                <span className="text-[#1B3A8A]/60 text-xs font-bold">
                  Passo {passos.indexOf(tela)+1} de 4
                </span>
                <span className="text-[#1B3A8A]/60 text-xs font-bold">{Math.round(progressoPct)}%</span>
              </div>
              <div className="h-2 bg-[#1B3A8A]/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#1B3A8A] rounded-full transition-all duration-500"
                  style={{width:`${progressoPct}%`}}
                />
              </div>
            </div>
          )}

          {/* ── PASSO 1: Nome + Foto ── */}
          {tela === "passo1" && (
            <div className="px-5 py-4">
              <div className="bg-white rounded-3xl p-6 shadow-xl">
                <div className="text-center mb-5">
                  <span className="text-3xl">✏️</span>
                  <h2 className="text-[#1B3A8A] font-black text-xl mt-1"
                      style={{fontFamily:"'Bebas Neue', sans-serif", letterSpacing:"1px"}}>
                    QUAL O NOME DO CRAQUE?
                  </h2>
                  <p className="text-gray-500 text-xs mt-1">O nome que vai aparecer na figurinha</p>
                </div>

                <div className="space-y-3 mb-4">
                  <div>
                    <label className="text-[#1B3A8A] text-[10px] font-black uppercase tracking-wider block mb-1">Nome</label>
                    <input
                      value={dados.nome}
                      onChange={e => atualizaDados("nome", e.target.value)}
                      placeholder="Ex: Pedro"
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1B3A8A] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[#1B3A8A] text-[10px] font-black uppercase tracking-wider block mb-1">Sobrenome</label>
                    <input
                      value={dados.sobrenome}
                      onChange={e => atualizaDados("sobrenome", e.target.value)}
                      placeholder="Ex: Silva"
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1B3A8A] transition-colors"
                    />
                  </div>
                </div>

                {/* Upload foto */}
                <div className="mb-5">
                  <label className="text-[#1B3A8A] text-[10px] font-black uppercase tracking-wider block mb-2">
                    📸 Foto do craque
                  </label>
                  <div
                    onClick={() => fileRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
                      fotoOriginal ? "border-[#1B3A8A] bg-[#1B3A8A]/5" : "border-gray-300 hover:border-[#1B3A8A]"
                    }`}
                  >
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload}/>
                    {!fotoOriginal ? (
                      <>
                        <div className="text-3xl mb-1">📷</div>
                        <p className="text-[#1B3A8A] font-bold text-sm">Toque para enviar</p>
                        <p className="text-gray-400 text-xs mt-1">Foto de rosto, bem iluminada</p>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={fotoOriginal} alt="Foto" className="w-24 h-24 rounded-full object-cover border-3 border-[#1B3A8A]" style={{border:"3px solid #1B3A8A"}}/>
                        <button onClick={e=>{e.stopPropagation();fileRef.current?.click();}} className="text-[#1B3A8A] text-xs underline bg-transparent border-none cursor-pointer">
                          Trocar foto
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  disabled={!dados.nome || !dados.sobrenome || !fotoOriginal}
                  onClick={() => setTela("passo2")}
                  className="w-full bg-[#1B3A8A] text-white font-black text-lg rounded-xl py-4 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#142d6e] active:scale-95 transition-all"
                  style={{fontFamily:"'Bebas Neue', sans-serif", letterSpacing:"2px"}}
                >
                  PRÓXIMO →
                </button>
              </div>
            </div>
          )}

          {/* ── PASSO 2: Data + Email ── */}
          {tela === "passo2" && (
            <div className="px-5 py-4">
              <div className="bg-white rounded-3xl p-6 shadow-xl">
                <div className="text-center mb-5">
                  <span className="text-3xl">🎂</span>
                  <h2 className="text-[#1B3A8A] font-black text-xl mt-1"
                      style={{fontFamily:"'Bebas Neue', sans-serif", letterSpacing:"1px"}}>
                    DATA DE NASCIMENTO
                  </h2>
                  <p className="text-gray-500 text-xs mt-1">Pra calcular a idade na figurinha</p>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[
                    {label:"Dia", campo:"dia" as keyof Dados, opts:DIAS},
                    {label:"Mês", campo:"mes" as keyof Dados, opts:MESES.map((m,i)=>({v:String(i+1).padStart(2,"0"),l:m}))},
                    {label:"Ano", campo:"ano" as keyof Dados, opts:ANOS},
                  ].map(({label, campo, opts}) => (
                    <div key={campo}>
                      <label className="text-[#1B3A8A] text-[10px] font-black uppercase tracking-wider block mb-1">{label}</label>
                      <select
                        value={dados[campo]}
                        onChange={e => atualizaDados(campo, e.target.value)}
                        className="w-full border-2 border-gray-200 rounded-xl px-2 py-3 text-sm focus:outline-none focus:border-[#1B3A8A] transition-colors"
                      >
                        <option value="">--</option>
                        {opts.map((o: string | {v:string,l:string}) =>
                          typeof o === "string"
                            ? <option key={o} value={o}>{o}</option>
                            : <option key={o.v} value={o.v}>{o.l}</option>
                        )}
                      </select>
                    </div>
                  ))}
                </div>

                <div className="mb-5">
                  <label className="text-[#1B3A8A] text-[10px] font-black uppercase tracking-wider block mb-1">Seu melhor e-mail</label>
                  <input
                    type="email"
                    value={dados.email}
                    onChange={e => atualizaDados("email", e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1B3A8A] transition-colors"
                  />
                </div>

                <div className="flex gap-2">
                  <button onClick={() => setTela("passo1")} className="flex-1 border-2 border-[#1B3A8A] text-[#1B3A8A] font-black text-base rounded-xl py-3 hover:bg-[#1B3A8A]/5 transition-all" style={{fontFamily:"'Bebas Neue', sans-serif"}}>VOLTAR</button>
                  <button
                    disabled={!dados.dia || !dados.mes || !dados.ano || !dados.email}
                    onClick={() => setTela("passo3")}
                    className="flex-2 flex-1 bg-[#1B3A8A] text-white font-black text-base rounded-xl py-3 disabled:opacity-40 hover:bg-[#142d6e] transition-all"
                    style={{fontFamily:"'Bebas Neue', sans-serif"}}
                  >PRÓXIMO →</button>
                </div>
              </div>
            </div>
          )}

          {/* ── PASSO 3: Clube + Dados ── */}
          {tela === "passo3" && (
            <div className="px-5 py-4">
              <div className="bg-white rounded-3xl p-6 shadow-xl">
                <div className="text-center mb-5">
                  <span className="text-3xl">⭐</span>
                  <h2 className="text-[#1B3A8A] font-black text-xl mt-1"
                      style={{fontFamily:"'Bebas Neue', sans-serif", letterSpacing:"1px"}}>
                    CLUBE E DADOS
                  </h2>
                  <p className="text-gray-500 text-xs mt-1">O clube do coração e os dados pra figurinha</p>
                </div>

                <div className="space-y-3 mb-5">
                  <div>
                    <label className="text-[#1B3A8A] text-[10px] font-black uppercase tracking-wider block mb-1">Clube do coração</label>
                    <input
                      value={dados.clube}
                      onChange={e => atualizaDados("clube", e.target.value)}
                      placeholder="Ex: Corinthians"
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1B3A8A] transition-colors"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[#1B3A8A] text-[10px] font-black uppercase tracking-wider block mb-1">Peso (kg)</label>
                      <input
                        value={dados.peso}
                        onChange={e => atualizaDados("peso", e.target.value)}
                        placeholder="Ex: 32"
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1B3A8A] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-[#1B3A8A] text-[10px] font-black uppercase tracking-wider block mb-1">Altura (m)</label>
                      <input
                        value={dados.altura}
                        onChange={e => atualizaDados("altura", e.target.value)}
                        placeholder="Ex: 1,40"
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1B3A8A] transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => setTela("passo2")} className="flex-1 border-2 border-[#1B3A8A] text-[#1B3A8A] font-black text-base rounded-xl py-3 hover:bg-[#1B3A8A]/5 transition-all" style={{fontFamily:"'Bebas Neue', sans-serif"}}>VOLTAR</button>
                  <button
                    disabled={!dados.clube || !dados.peso || !dados.altura}
                    onClick={() => setTela("confirma")}
                    className="flex-1 bg-[#1B3A8A] text-white font-black text-base rounded-xl py-3 disabled:opacity-40 hover:bg-[#142d6e] transition-all"
                    style={{fontFamily:"'Bebas Neue', sans-serif"}}
                  >PRÓXIMO →</button>
                </div>
              </div>
            </div>
          )}

          {/* ── PASSO 4: Confirmação ── */}
          {tela === "confirma" && (
            <div className="px-5 py-4">
              <div className="bg-white rounded-3xl p-6 shadow-xl">
                <div className="text-center mb-4">
                  <span className="text-3xl">⚠️</span>
                  <h2 className="text-[#1B3A8A] font-black text-xl mt-1"
                      style={{fontFamily:"'Bebas Neue', sans-serif", letterSpacing:"1px"}}>
                    CONFIRA SEUS DADOS
                  </h2>
                  <p className="text-gray-500 text-xs mt-1">A figurinha será gerada em breve. Revise com atenção.</p>
                  <p className="text-red-500 text-[11px] font-bold mt-1">Não fazemos alterações após a aprovação e pagamento.</p>
                </div>

                {/* Foto */}
                {fotoOriginal && (
                  <div className="flex justify-center mb-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={fotoOriginal} alt="Foto" className="w-20 h-20 rounded-full object-cover" style={{border:"3px solid #1B3A8A"}}/>
                  </div>
                )}

                {/* Dados */}
                <div className="space-y-2 mb-5 text-sm">
                  {[
                    {l:"Nome", v:`${dados.nome} ${dados.sobrenome}`},
                    {l:"Nascimento", v:dataFormatada},
                    {l:"Peso", v:`${dados.peso} kg`},
                    {l:"Altura", v:`${dados.altura} m`},
                    {l:"Clube", v:dados.clube},
                    {l:"E-mail", v:dados.email},
                  ].map(({l,v}) => (
                    <div key={l} className="flex justify-between border-b border-gray-100 pb-2">
                      <span className="text-[#1B3A8A] font-black text-[10px] uppercase tracking-wider">{l}</span>
                      <span className="text-gray-700 font-semibold text-xs">{v}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setTela("preview")}
                  className="w-full bg-[#1B3A8A] text-white font-black text-lg rounded-xl py-4 hover:bg-[#142d6e] active:scale-95 transition-all mb-2"
                  style={{fontFamily:"'Bebas Neue', sans-serif", letterSpacing:"1px"}}
                >
                  ENTENDI, GERAR FIGURINHA ⚽
                </button>
                <button onClick={() => setTela("passo1")} className="w-full border-2 border-gray-300 text-gray-500 font-black text-sm rounded-xl py-3 hover:border-gray-400 transition-all" style={{fontFamily:"'Bebas Neue', sans-serif"}}>
                  CORRIGIR DADOS
                </button>
              </div>
            </div>
          )}

          {/* ══════════════ PREVIEW / RESULTADO ══════════════ */}
          {tela === "preview" && (
            <div className="bg-[#FFD600] min-h-screen px-5 py-6">

              {/* Título */}
              <div className="text-center mb-4">
                <h2 className="text-[#1B3A8A] font-black text-4xl"
                    style={{fontFamily:"'Bebas Neue', sans-serif", letterSpacing:"2px"}}>
                  GOOLL! 🥅
                </h2>
                <p className="text-[#006633] font-black text-sm">Sua figurinha está pronta!</p>
              </div>

              {/* Figurinha gerada */}
              <div className="relative mx-auto mb-4" style={{width:240, height:340}}>
                {/* Template como fundo */}
                <div className="absolute inset-0 rounded-2xl overflow-hidden shadow-2xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={TEMPLATE_URL} alt="Template" className="w-full h-full object-cover"/>
                </div>

                {/* Foto da criança posicionada no centro */}
                {fotoFinal && (
                  <div className="absolute inset-0 flex items-end justify-center" style={{paddingBottom:"72px"}}>
                    <div style={{width:"75%", height:"68%", overflow:"hidden", display:"flex", alignItems:"flex-end", justifyContent:"center"}}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={fotoFinal}
                        alt="Criança"
                        style={{
                          width:"100%",
                          height:"100%",
                          objectFit:"cover",
                          objectPosition:"top center",
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Nome sobreposto na faixa azul escura */}
                <div className="absolute bottom-0 left-0 right-0" style={{paddingBottom:"30px"}}>
                  <div style={{
                    background:"rgba(15,40,100,0.92)",
                    borderRadius:"0 0 0 12px",
                    padding:"6px 10px 4px",
                    marginRight:"50px",
                  }}>
                    <p style={{color:"#fff", fontFamily:"'Bebas Neue',sans-serif", fontSize:"14px", letterSpacing:"1px", margin:0, lineHeight:1.1}}>
                      {nomeCompleto || "NOME SOBRENOME"}
                    </p>
                    <p style={{color:"rgba(255,255,255,0.8)", fontSize:"9px", fontWeight:700, margin:0, letterSpacing:"0.3px"}}>
                      {dataFormatada} | {dados.altura}m | {dados.peso}kg
                    </p>
                  </div>
                  <div style={{
                    background:"rgba(10,30,80,0.92)",
                    borderRadius:"0 0 0 0",
                    padding:"4px 10px",
                    marginRight:"50px",
                    marginTop:"2px",
                  }}>
                    <p style={{color:"rgba(255,255,255,0.9)", fontSize:"9px", fontWeight:900, margin:0, letterSpacing:"1px", textTransform:"uppercase"}}>
                      {dados.clube || "CLUBE FAVORITO"}
                    </p>
                  </div>
                </div>

                {/* Marca d'água PRÉVIA */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{transform:"rotate(-30deg)"}}>
                  <span style={{
                    fontFamily:"'Bebas Neue',sans-serif",
                    fontSize:"52px",
                    color:"rgba(255,255,255,0.15)",
                    letterSpacing:"6px",
                    userSelect:"none"
                  }}>PRÉVIA</span>
                </div>
              </div>

              {/* Botão processar foto */}
              {!fotoProcessada && (
                <div className="mb-4">
                  <button
                    onClick={processarFoto}
                    disabled={processando}
                    className="w-full bg-[#006633] text-white font-black text-base rounded-xl py-3 flex items-center justify-center gap-2 disabled:opacity-60 hover:bg-[#004d26] transition-all"
                    style={{fontFamily:"'Bebas Neue', sans-serif", letterSpacing:"1px"}}
                  >
                    {processando ? (
                      <><span className="animate-spin">⚙️</span> {etapaProcessamento || "Processando..."}</>
                    ) : (
                      "🪄 APLICAR CAMISETA DA SELEÇÃO"
                    )}
                  </button>
                  {erroProcessamento && (
                    <p className="text-red-700 text-xs text-center mt-2 bg-red-100 rounded-xl p-2">{erroProcessamento}</p>
                  )}
                </div>
              )}

              {fotoProcessada && (
                <p className="text-center text-[#006633] font-bold text-xs mb-3">✅ Camiseta da Seleção aplicada!</p>
              )}

              {/* Preço e CTA */}
              <div className="text-center mb-4">
                <p className="text-[#1B3A8A]/70 text-xs mb-1">Receba o arquivo digital para impressão</p>
                <p className="text-[#006633] font-black text-4xl" style={{fontFamily:"'Bebas Neue', sans-serif"}}>
                  {PRECO}
                </p>
                <p className="text-[#1B3A8A]/50 text-[10px] line-through">de R$29,90</p>
              </div>

              <button
                onClick={irParaKiwify}
                className="w-full bg-[#1B3A8A] text-white font-black text-xl rounded-2xl py-5 shadow-xl hover:bg-[#142d6e] active:scale-95 transition-all mb-3"
                style={{fontFamily:"'Bebas Neue', sans-serif", letterSpacing:"2px"}}
              >
                RECEBER MINHA FIGURINHA 🏆
              </button>

              <div className="flex items-center justify-center gap-1 mb-4">
                <span className="text-[#006633] text-xs">✅</span>
                <span className="text-[#006633] font-black text-xs uppercase tracking-wide">Acesso liberado na hora</span>
              </div>

              <p className="text-[#1B3A8A]/50 text-[10px] text-center leading-relaxed px-4">
                É só voltar aqui em <strong>Minha Área</strong> após o pagamento.
              </p>

              <button
                onClick={() => { setTela("landing"); setFotoOriginal(null); setFotoProcessada(null); setDados({nome:"",sobrenome:"",dia:"",mes:"",ano:"",email:"",clube:"",peso:"",altura:""}); }}
                className="block mx-auto mt-4 text-[#1B3A8A]/40 text-xs underline bg-transparent border-none cursor-pointer"
              >
                Criar outra figurinha
              </button>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
