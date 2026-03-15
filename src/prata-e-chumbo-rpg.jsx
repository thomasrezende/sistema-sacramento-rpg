import { useState, useRef, useEffect, useCallback } from "react";

// ─── GOOGLE FONTS ─────────────────────────────────────────────────────────────
const _fontLink = document.createElement("link");
_fontLink.rel = "stylesheet";
_fontLink.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@400;500;600&family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap";
document.head.appendChild(_fontLink);

// ─── GLOBAL STYLE ─────────────────────────────────────────────────────────────
const _style = document.createElement("style");
_style.textContent = `
  *, *::before, *::after { box-sizing: border-box; }
  body { font-family: 'Inter', system-ui, sans-serif; font-size: 15px; line-height: 1.6; }
  input, textarea, select, button { font-family: inherit; }
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: #0a0a0a; }
  ::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: #3a3a3a; }
  ::placeholder { opacity: 0.38; }
`;
document.head.appendChild(_style);

// ─── PALETTE ─────────────────────────────────────────────────────────────────
const C = {
  bg: "#000000", bg1: "#0a0a0a", bg2: "#111111", bg3: "#1c1c1c",
  border: "#2a2a2a", border2: "#3a3a3a",
  silver: "#C8C8C8", silverDim: "#909090", silverFaint: "#484848",
  white: "#f0f0f0", gray: "#aaaaaa", grayDark: "#606060",
  red: "#d63c3c", redDim: "#7a1a1a",
  fontBody: "'Inter', system-ui, sans-serif",
  fontSerif: "'Crimson Text', Georgia, serif",
  fontDisplay: "'Playfair Display', Georgia, serif",
};

// ─── STORAGE ─────────────────────────────────────────────────────────────────
const STORAGE_KEY = "prata_chumbo_v3";
const saveChars = (chars) => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(chars)); } catch (e) { console.warn("save err", e); } };
const loadChars = () => { try { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : []; } catch { return []; } };

// ─── CÍRCULOS DE DOR ─────────────────────────────────────────────────────────
const CIRCULOS_DOR = [
  { num: 1, nome: "Atordoamento",  efeito: "−1 Ação de Combate no próximo turno.",                       cor: "#c07020" },
  { num: 2, nome: "Queda",         efeito: "Gaste 1 Movimento para se levantar.",                         cor: "#b05050" },
  { num: 3, nome: "Distração",     efeito: "Não pode atacar o mesmo alvo no próximo ataque.",             cor: "#a04040" },
  { num: 4, nome: "Sangramento",   efeito: "+1 Círculo de Vida marcado por turno até fim do combate.",    cor: "#8b2020" },
  { num: 5, nome: "Intimidação",   efeito: "Se afaste do atacante no próximo turno.",                     cor: "#702020" },
  { num: 6, nome: "Desorientação", efeito: "Testes de Violência −1 no próximo turno.",                   cor: "#550000" },
];

// ─── HABILIDADES DE COMBATE (15) ─────────────────────────────────────────────
const HABILIDADES_COMBATE = [
  { nome: "Armas da Natureza",  desc: "Você prefere lutar com métodos \"ultrapassados\". Sempre que lutar usando armas rústicas (facas de pedra, lanças de madeira, machadinhas e armas rudimentares), o dano do seu ataque aumenta em +1 para cada ponto em Físico que tiver.", tabela: null },
  { nome: "Ataque Sacana",      desc: "Sua honra pode ser a primeira pá de terra que cai em cima do seu caixão. Ao realizar um ataque surpresa usando facas, navalhas ou qualquer outra lâmina oculta, o golpe causa dano adicional que aumenta a cada nível.", tabela: [{nivel:1,val:"1 dano adicional"},{nivel:3,val:"2 danos adicionais"},{nivel:6,val:"3 danos adicionais"}] },
  { nome: "Briga de Bar",       desc: "Você sabe improvisar armas com aquilo que estiver na sua frente: uma cadeira, uma garrafa, ou o bebum segurando a garrafa. Objetos pequenos e médios causam 3 dano. Objetos grandes causam 1 dano, mas os Testes de Violência têm −1 de penalidade.", tabela: null },
  { nome: "Coldre de Sabão",    desc: "Quem inventou o ditado \"quem ri por último, ri melhor\" era meio tantan. Na Iniciativa, você pode puxar duas cartas e escolher a que quiser, a maior ou a menor, de acordo com a estratégia que pensar para seu turno na hora do combate.", tabela: null },
  { nome: "Dedo Quente",        desc: "Você sente a alma de um revólver como o fogo de uma paixão ardente, fazendo de seus tiros tão precisos quanto mortais. Sempre que atirar com um revólver, você recebe +1 nos Testes de Violência. Além disso, contra alvos sem cobertura, o dano dos tiros aumenta conforme seu nível.", tabela: [{nivel:1,val:"1 dano adicional"},{nivel:3,val:"2 danos adicionais"},{nivel:6,val:"3 danos adicionais"}] },
  { nome: "Fúria dos Aflitos",  desc: "Sua raiva é imparável e seu ódio é infinito, a ponto de você não medir perigos e arriscar a própria pele para massacrar seus inimigos. Em combate, você reduz sua Defesa em 1 ponto e aumenta o dano de seus ataques corpo a corpo em 3.", tabela: null },
  { nome: "Gatilho Furioso",    desc: "Martelar o cão é a façanha de puxar o gatilho do revólver com uma das mãos enquanto bate no cão da arma com a outra. Você dispara dois tiros na mesma Ação de Combate, mas precisa gastar um Movimento para fazer isso. Se tiver mais Ações e Movimentos até o fim do turno, pode atirar várias vezes até seu revólver descarregar.", tabela: null },
  { nome: "Livramento",         desc: "Você ouviu a morte chamar seu nome, chegou sua hora, mas você não quer bater as botas. Quando riscar todos os seus Círculos de Vida, caia no chão, recupere 2 e permaneça com a sua carranca feia pela Terra. Se você cair outra vez no mesmo combate, acabou a colher de chá e será preciso fazer o Teste de Morte normalmente.", tabela: null },
  { nome: "Marretada",          desc: "Pra quê um revólver se sua mão é tão pesada quanto uma marreta? Quando luta de mãos vazias, apenas com o poder de seus socos e chutes, o dano de seus ataques desarmados aumenta em +1 para cada ponto no Atributo Físico que tiver.", tabela: null },
  { nome: "Parrudeza",          desc: "Difícil de morrer e duro de matar. Você tem um couro bem grosso ou só gosta muito de estar vivo. Você soma 2 Círculos de Vida à sua vida. Esta Habilidade pode ser escolhida várias vezes.", tabela: null },
  { nome: "Punhos do Oriente",  desc: "Você aprendeu artes marciais na sua terra natal ou com algum velho mestre que topou te ensinar, tornando-se uma grande máquina de distribuir chutes e socos. Você pode usar seus Movimentos para realizar ataques desarmados.", tabela: null },
  { nome: "Quebra-Ossos",       desc: "Aplique golpes especiais de luta livre, como agarrões, arremessos ou o famoso suplex. Para dar este golpe é preciso gastar um Movimento e uma Ação de Combate. Você pode escolher imobilizar o oponente ou potencializar o dano do seu golpe conforme seu nível.", tabela: [{nivel:1,val:"Dano +1+Dor"},{nivel:3,val:"Dano +1+2Dor"},{nivel:6,val:"Dano +2+3Dor"}] },
  { nome: "Sorte dos Covardes", desc: "Deixe as façanhas incríveis pra lá, o que importa para você é ter sorte. No começo de um combate, puxe uma carta do baralho e obtenha o efeito pelo naipe. Os efeitos duram até o final do combate. Req: máx. 1 Intelecto e 2 Violência. ♣ +2 Ações de Combate · ♥ +2 Vida · ♠ +2 Movimentos · ♦ +1 para Testes de Violência", tabela: null },
  { nome: "Valei-me",           desc: "Improvise explosivos com o que tiver em mãos (pano, garrafa, bebida, ferrolho, parafuso). Para fabricá-los é preciso ter sucesso em Teste de Tradição NA 7. Em combate, além do teste, você precisa gastar 2 Ações de Combate e 1 Movimento por explosivo. O dano aumenta conforme seu nível.", tabela: [{nivel:1,val:"2 danos"},{nivel:3,val:"3 danos"},{nivel:6,val:"5 danos"}] },
  { nome: "Zói de Gavião",      desc: "De vista afiada como uma ave de rapina, você acerta alvos distantes com maior precisão. Se atirar com um fuzil ou arco longo você recebe +1 nos Testes de Violência. Além disso, se estiver em uma posição vantajosa, o dano dos disparos aumenta conforme seu nível.", tabela: [{nivel:1,val:"1 dano adicional"},{nivel:3,val:"2 danos adicionais"},{nivel:6,val:"3 danos adicionais"}] },
];

// ─── HABILIDADES DE PROFISSÃO (15) ───────────────────────────────────────────
const HABILIDADES_PROFISSAO = [
  { nome: "Às na Manga",            desc: "Aquela mesa coberta por um pano verde no canto do Salão lhe é tão familiar quanto a latrina. É na mesa, não na latrina, que você ganha dinheiro, nas cartas e no blefe. Ao fazer Testes envolvendo jogos de cartas, role 2d6 e use o melhor dado.", tabela: null },
  { nome: "Boca na Botija",         desc: "Mal alguém sentou no cacto, você já está com o unguento na mão. Sua percepção é tão afiada quanto os dentes de um jacaré. Você quase nunca deixa passar algo desapercebido. Ao fazer Testes de Atenção, jogue 2d6 e use o melhor resultado. E mais: sua Defesa não é reduzida por ficar surpreso antes do combate.", tabela: null },
  { nome: "Canção da Emoção",       desc: "Uma viola, gaita ou violão está na sua mão enquanto você canta um modão. A melodia pode inspirar sua gangue a superar o pior dos combates. Uma vez por sessão, gaste 2 Ações de Combate para cada PJ beneficiado. Bônus concedidos por nível:", tabela: [{nivel:1,val:"+1 Movimento"},{nivel:3,val:"+1 Ação de Combate"},{nivel:4,val:"+1 em Violência"},{nivel:6,val:"+3 Vida temporários"}] },
  { nome: "Chamego",                desc: "Pula boi, pula cavalo, pula cavalo e boi! Foram tantos anos com o laço na mão que você sabe usar uma corda como ninguém. Ao fazer um teste para laçar algo ou alguém, jogue 2d6 e use o melhor resultado. Além disso, seus nós apertados dão penalidade de −1 para os Testes a quem tentar se soltar do chamego do seu laço.", tabela: null },
  { nome: "Cuspe e Cola",           desc: "Nas condições precárias da Guerra, tinham poucos trem para cuidar dos soldados feridos, às vezes era preciso limpar com cuspe e estancar com cola. Este é o único jeito de curar alguém no meio do combate. Para fazer isso, você precisa estar colado no seu paciente e gastar 2 Ações de Combate para cada Círculo de Dor que curar. O limite de usos aumenta conforme seu nível.", tabela: [{nivel:1,val:"1 uso por combate"},{nivel:3,val:"2 usos por combate"},{nivel:6,val:"4 usos por combate"}] },
  { nome: "Fogo no Céu",            desc: "Ah! A pólvora! Aquele pozinho preto que faz o fogo voar. Você tem fascínio por dinamites, TNT, nitroglicerina ou qualquer coisa que faça BOOOOOM! Ao fazer Testes envolvendo explosivos, jogue 2d6 e use o melhor resultado. Além disso, você também não corre o risco de explodir os próprios miolos caso tire uma falha crítica.", tabela: null },
  { nome: "Fumaça na Água",         desc: "O silêncio e a noite são os melhores amigos de quem sobrevive a base da subtração de bens alheios. Quando fizer Testes de Roubo para afanar coisas, se esconder ou caminhar na quietude, jogue 2d6 e use o melhor resultado que cair.", tabela: null },
  { nome: "Galope Certeiro",        desc: "Gaspar e Estrela, um homem e uma égua. Inseparáveis. A ligação entre humanos e suas montarias é sempre inquebrável e pode motivar vinganças e redenções. Ao fazer Testes de Montaria no lombo do seu próprio cavalo, jogue 2d6 e use o melhor resultado. Você também ignora a penalidade em Testes de Montaria quando estiver montado em outros animais não familiares a você.", tabela: null },
  { nome: "Natural da Natureza",    desc: "Os caminhos da natureza estão abertos para você. Você sabe nadar, escalar, subir em árvores, pular de galho em galho, abrir trilhas através das matas e pradarias. Sempre que fizer Testes de Suor, jogue 2d6 e use o melhor resultado. Além disso, você não precisa fazer testes para encontrar plantas, ervas medicinais ou comestíveis e abrigo em territórios inóspitos e selvagens.", tabela: null },
  { nome: "Não Vai Doer Nadinha",   desc: "Quantas vidas você salvou na Guerra? Quantos braços e pernas amputou? Você cuidou de viroses, cancro mole, unha encravada, gripe, caxumba que já desceu e tanta coisa que nada mais o assusta. Ao fazer testes de Medicina, jogue 2d6 e use o melhor resultado. Além disso, sua cura adicional aumenta conforme seu nível.", tabela: [{nivel:1,val:"+1 Vida curada"},{nivel:3,val:"+2 Vida curada"},{nivel:6,val:"+4 Vida curada"}] },
  { nome: "Sabiá Imperatriz",       desc: "Hora de tirar no dedo a última gota do perfume que vai esconder o futum de bosta que você tem. Sorria, seduza, convença e aperte as mãos certas para conseguir as informações que você tanto precisa. Ao fazer Testes de Negócios, jogue 2d6 e use o melhor resultado.", tabela: null },
  { nome: "Sabugos e Peçonhas",     desc: "Seus anos vivendo entre as matas do Oeste Selvagem lhe renderam conhecimento para saber tudo o que há de mal nas plantas. Você consegue produzir venenos mais eficientes. Eles causam 1 dano a cada ação feita pelo alvo envenenado. Ou seja, se o alvo usar uma ação para atirar, sofre 1. Se der outro tiro, sofre mais — até o veneno ser curado, resistido ou o alvo ficar inconsciente.", tabela: null },
  { nome: "Salve-se Quem Puder",    desc: "Lutar até morrer é coisa de quem não tem amor à vida, sô. Mesmo que as calças borradas fiquem para trás, ficar vivo não é descaso com ninguém. Ao fazer qualquer Teste para escapar ou fugir, jogue 2d6 e use o melhor resultado. Em situações de fuga, você recebe +1 Movimento que só pode ser usado para dar no pé.", tabela: null },
  { nome: "Sorrisão, Chapéu na Mão",desc: "Com a cara lavada e sorriso no rosto, você consegue levar vantagens sempre que existe uma negociação financeira. Sempre que estiver comprando ou vendendo itens comuns (e não itens especiais ou raros), você consegue comprar com 25% de desconto e vender 25% mais caro de acordo com os preços na tabela de equipamento.", tabela: null },
  { nome: "Zói de Coruja",          desc: "Na vivência ou na escola, seu objetivo sempre foi a busca pela teoria e pelo conhecimento. É uma sede de saber incontrolável que o transforma em enciclopédia ambulante. Sempre que fizer um Teste de Tradição para se lembrar de algum conhecimento lá do fundo da cachola, jogue 2d6 e fique com o melhor resultado.", tabela: null },
];

// ─── DEMAIS CONSTANTES ────────────────────────────────────────────────────────
const ANTECEDENTES = ["Atenção","Roubo","Montaria","Tradição","Medicina","Suor","Negócios","Violência"];
const ANTECEDENTES_DESC = { Atenção:"Detectar emboscadas, segredos, passagens ocultas", Roubo:"Roubar, se esconder, trapacear, malandragem", Montaria:"Cavalgar, cuidar de animais, adestrar", Tradição:"Culturas, regiões, plantas, conhecimento", Medicina:"Curar pessoas e animais, cirurgias, doenças", Suor:"Nadar, correr, escalar, trabalho físico", Negócios:"Mentir, convencer, seduzir, negociar", Violência:"Atirar, lutar, estratégias de batalha" };
const ATRIBUTOS = ["Físico","Velocidade","Intelecto","Coragem"];
const ATRIBUTOS_DESC = { Físico:"+1 Círculo de Vida por ponto", Velocidade:"+1 Movimento por ponto", Intelecto:"+1 Ponto de Antecedente por ponto", Coragem:"+1 Ação de Combate por ponto" };
const TRILHAS = ["Vingança","Fuga","Dívida","Remorso","Recomeço","Ambição"];
const LEVEL_TABLE = [
  {nivel:1,xp:0,bonus:"Base"},
  {nivel:2,xp:10,bonus:"+1 Vida/Físico · +1 Antecedente · +1 Habilidade"},
  {nivel:3,xp:20,bonus:"+1 Vida/Físico · +1 Atributo · +1 Habilidade"},
  {nivel:4,xp:30,bonus:"+3 Vida · +1 Atributo · +1 Habilidade"},
  {nivel:5,xp:45,bonus:"+1 Vida/Físico · +1 Atributo"},
  {nivel:6,xp:65,bonus:"+1 Atributo · +1 Habilidade"},
];
const CRIMES = [
  {crime:"Vandalismo",valor:10},{crime:"Insultar agentes da lei",valor:10},{crime:"Agressão a cavalos",valor:20},
  {crime:"Agressão",valor:50},{crime:"Destruição de propriedade",valor:50},{crime:"Furto",valor:100},
  {crime:"Agressão contra agentes da lei",valor:100},{crime:"Arrombamento de cofre",valor:100},{crime:"Assalto",valor:100},
  {crime:"Roubo de propriedade",valor:150},{crime:"Sequestro",valor:200},{crime:"Assassinato de cavalo",valor:200},
  {crime:"Roubo de diligências",valor:200},{crime:"Incêndio",valor:200},{crime:"Roubo de trem",valor:400},
  {crime:"Assassinato",valor:400},{crime:"Assassinato de agentes da lei",valor:500},
];
const HONOR_LABELS = { "-5":"Lendário Fora-da-lei","-4":"Infame","-3":"Desonrado","-2":"Mal Visto","-1":"Suspeito","0":"Neutro","1":"Respeitado","2":"Honrado","3":"Nobre","4":"Virtuoso","5":"Lendário Honrado" };


// ─── ATOMS ───────────────────────────────────────────────────────────────────
const btnSm = {background:"transparent",border:`1px solid ${C.border2}`,color:C.silverDim,width:28,height:28,cursor:"pointer",fontFamily:"'Inter',system-ui,sans-serif",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",padding:0,borderRadius:4};

const Dot = ({filled,danger,onClick,size=18}) => (
  <button onClick={onClick} style={{width:size,height:size,borderRadius:"50%",padding:0,flexShrink:0,border:`1.5px solid ${danger?C.red:C.silverDim}`,background:filled?(danger?C.red:C.silver):"transparent",cursor:"pointer",transition:"all 0.12s"}} />
);

const StatBox = ({label,value,onChange,min=0,max=9}) => (
  <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
    <span style={{fontSize:10,letterSpacing:2,color:C.silverDim,fontFamily:"'Inter',system-ui,sans-serif",textTransform:"uppercase",fontWeight:600}}>{label}</span>
    <div style={{display:"flex",alignItems:"center",gap:6}}>
      <button onClick={()=>onChange(Math.max(min,value-1))} style={btnSm}>−</button>
      <span style={{width:36,textAlign:"center",fontFamily:"'Playfair Display',Georgia,serif",fontSize:26,color:C.white,lineHeight:1}}>{value}</span>
      <button onClick={()=>onChange(Math.min(max,value+1))} style={btnSm}>+</button>
    </div>
  </div>
);

const SectionTitle = ({children}) => (
  <div style={{display:"flex",alignItems:"center",gap:12,margin:"28px 0 14px"}}>
    <div style={{height:1,flex:1,background:`linear-gradient(to right, transparent, ${C.silverFaint})`}}/>
    <span style={{fontFamily:"'Inter',system-ui,sans-serif",fontSize:10,letterSpacing:4,color:C.silverDim,textTransform:"uppercase",fontWeight:600}}>{children}</span>
    <div style={{height:1,flex:1,background:`linear-gradient(to left, transparent, ${C.silverFaint})`}}/>
  </div>
);

const Inp = ({value,onChange,placeholder,multiline,rows=3,style:s={}}) => {
  const base = {background:"transparent",border:"none",borderBottom:`1px solid ${C.border}`,color:C.white,fontFamily:"'Inter',system-ui,sans-serif",fontSize:15,width:"100%",outline:"none",padding:"6px 0",lineHeight:1.6,...s};
  return multiline
    ? <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows} style={{...base,resize:"vertical"}}/>
    : <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={base}/>;
};

// ─── DELETE MODAL ─────────────────────────────────────────────────────────────
function DeleteModal({charName,onConfirm,onCancel}) {
  const [typed,setTyped] = useState("");
  const ok = typed.trim().toUpperCase()==="REMOVER";
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{background:C.bg1,border:`1px solid ${C.border2}`,maxWidth:440,width:"100%",padding:"32px 36px"}}>
        <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:12,letterSpacing:4,color:C.red,textTransform:"uppercase",marginBottom:16}}>Excluir Personagem</div>
        <div style={{fontFamily:"'Inter',system-ui,sans-serif",fontSize:14,color:C.gray,lineHeight:1.9,marginBottom:24}}>
          Você está prestes a excluir <span style={{color:C.white}}>"{charName||"Sem nome"}"</span>.<br/>
          <span style={{color:C.red,fontSize:12}}>Atenção: essa operação é permanente e irreversível!</span>
        </div>
        <div style={{marginBottom:20}}>
          <div style={{fontSize:11,color:C.grayDark,letterSpacing:1,fontFamily:"'Inter',system-ui,sans-serif",marginBottom:8}}>
            Para confirmar, digite <span style={{color:C.silver}}>REMOVER</span> abaixo:
          </div>
          <input value={typed} onChange={e=>setTyped(e.target.value)} placeholder="REMOVER" autoFocus
            style={{background:C.bg3,border:`1px solid ${ok?C.red:C.border2}`,color:ok?C.red:C.white,fontFamily:"'Inter',system-ui,sans-serif",fontSize:15,width:"100%",padding:"8px 12px",outline:"none",letterSpacing:2,boxSizing:"border-box"}}/>
        </div>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
          <button onClick={onCancel} style={{background:"transparent",border:`1px solid ${C.border2}`,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",fontSize:11,padding:"7px 18px",cursor:"pointer",letterSpacing:1}}>Cancelar</button>
          <button onClick={onConfirm} disabled={!ok} style={{background:ok?C.redDim:"transparent",border:`1px solid ${ok?C.red:C.silverFaint}`,color:ok?C.white:C.silverFaint,fontFamily:"'Inter',system-ui,sans-serif",fontSize:11,padding:"7px 18px",cursor:ok?"pointer":"not-allowed",letterSpacing:1,transition:"all 0.2s"}}>Excluir definitivamente</button>
        </div>
      </div>
    </div>
  );
}

// ─── HONOR METER ─────────────────────────────────────────────────────────────
function HonorMeter({value,onChange}) {
  // Livre: sem limite fixo. A barra usa −10…+10 como referência visual mas aceita qualquer número.
  const VISUAL_MIN = -10, VISUAL_MAX = 10;
  const clamp = (v) => Math.max(VISUAL_MIN, Math.min(VISUAL_MAX, v));
  const pct = Math.max(0, Math.min(100, ((value - VISUAL_MIN) / (VISUAL_MAX - VISUAL_MIN)) * 100));
  const col = value < 0 ? C.red : value === 0 ? C.grayDark : C.silver;
  const label = HONOR_LABELS[String(Math.max(-5, Math.min(5, value)))] || (value < -5 ? "Lendário Fora-da-lei" : "Lendário Honrado");
  return (
    <div>
      {/* Título + label */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <span style={{fontSize:11,letterSpacing:3,color:C.silverDim,fontFamily:"'Inter',system-ui,sans-serif",textTransform:"uppercase",fontWeight:600}}>Honra</span>
        <span style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:13,color:col,letterSpacing:1}}>{label}</span>
      </div>

      {/* Valor atual grande + controles */}
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
        <button onClick={()=>onChange(value-1)}
          style={{width:36,height:36,background:"transparent",border:`1px solid ${C.border2}`,color:C.red,fontFamily:"'Inter',system-ui,sans-serif",fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>−</button>
        <div style={{flex:1,textAlign:"center"}}>
          <span style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:48,color:col,lineHeight:1}}>{value}</span>
        </div>
        <button onClick={()=>onChange(value+1)}
          style={{width:36,height:36,background:"transparent",border:`1px solid ${C.border2}`,color:C.silver,fontFamily:"'Inter',system-ui,sans-serif",fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>+</button>
      </div>

      {/* Barra visual */}
      <div style={{position:"relative",height:8,background:C.bg3,border:`1px solid ${C.border}`,borderRadius:4,overflow:"hidden"}}>
        {/* Metade esquerda (negativo) */}
        {value < 0 && (
          <div style={{position:"absolute",top:0,right:"50%",height:"100%",
            width:`${Math.min(50,(Math.abs(value)/VISUAL_MAX)*50)}%`,
            background:`linear-gradient(to left,${C.red},${C.redDim})`,borderRadius:"4px 0 0 4px",transition:"width 0.25s"}}/>
        )}
        {/* Metade direita (positivo) */}
        {value > 0 && (
          <div style={{position:"absolute",top:0,left:"50%",height:"100%",
            width:`${Math.min(50,(value/VISUAL_MAX)*50)}%`,
            background:`linear-gradient(to right,${C.border2},${C.silver})`,borderRadius:"0 4px 4px 0",transition:"width 0.25s"}}/>
        )}
        {/* Linha central */}
        <div style={{position:"absolute",top:0,left:"50%",width:2,height:"100%",background:C.border2,transform:"translateX(-50%)"}}/>
      </div>

      {/* Labels extremos */}
      <div style={{display:"flex",justifyContent:"space-between",marginTop:5}}>
        <span style={{fontSize:10,color:C.red,fontFamily:"'Inter',system-ui,sans-serif",letterSpacing:1,fontWeight:500}}>← INFAME</span>
        <span style={{fontSize:9,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif"}}>0 = Neutro</span>
        <span style={{fontSize:10,color:C.silver,fontFamily:"'Inter',system-ui,sans-serif",letterSpacing:1,fontWeight:500}}>HONRADO →</span>
      </div>

      {/* Tabela de referência compacta */}
      <div style={{display:"flex",flexWrap:"wrap",gap:4,marginTop:10}}>
        {[[-5,"Lendário Fora-da-lei"],[-4,"Infame"],[-3,"Desonrado"],[-2,"Mal Visto"],[-1,"Suspeito"],[0,"Neutro"],[1,"Respeitado"],[2,"Honrado"],[3,"Nobre"],[4,"Virtuoso"],[5,"Lendário Honrado"]].map(([n,lbl])=>(
          <button key={n} onClick={()=>onChange(n)} style={{
            background:value===n?(n<0?C.redDim:n===0?C.bg3:C.bg3):"transparent",
            border:`1px solid ${value===n?(n<0?C.red:n===0?C.border2:C.silver):C.border}`,
            color:value===n?(n<0?C.red:n===0?C.gray:C.silver):C.grayDark,
            fontFamily:"'Inter',system-ui,sans-serif",fontSize:10,padding:"3px 8px",
            cursor:"pointer",letterSpacing:0.5,borderRadius:2,transition:"all 0.12s",
          }}>{n} · {lbl}</button>
        ))}
      </div>
    </div>
  );
}

// ─── SKILL CARD ──────────────────────────────────────────────────────────────
function SkillCard({h,selected,onToggle}) {
  const [open,setOpen] = useState(false);
  return (
    <div style={{border:`1px solid ${selected?C.silver:C.border}`,background:selected?C.bg3:C.bg2,transition:"all 0.15s",marginBottom:4,width:"100%"}}>
      <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px"}}>
        <button onClick={onToggle} style={{width:16,height:16,borderRadius:"50%",border:`1.5px solid ${selected?C.silver:C.silverDim}`,background:selected?C.silver:"transparent",cursor:"pointer",padding:0,flexShrink:0,transition:"all 0.12s"}}/>
        <span onClick={onToggle} style={{flex:1,fontFamily:"'Playfair Display',Georgia,serif",fontSize:15,color:selected?C.white:C.gray,cursor:"pointer"}}>{h.nome}</span>
        <button onClick={()=>setOpen(o=>!o)} style={{background:"transparent",border:"none",color:C.grayDark,cursor:"pointer",fontSize:12,padding:"0 4px"}}>{open?"▲":"▼"}</button>
      </div>
      {open&&(
        <div style={{borderTop:`1px solid ${C.border}`,padding:"10px 14px"}}>
          <div style={{fontFamily:"'Inter',system-ui,sans-serif",fontSize:12,color:C.gray,lineHeight:1.8,marginBottom:h.tabela?8:0}}>{h.desc}</div>
          {h.tabela&&(
            <div style={{marginTop:8,borderTop:`1px solid ${C.border}`,paddingTop:6}}>
              {h.tabela.map(row=>(
                <div key={row.nivel} style={{display:"flex",gap:8,fontSize:10,color:C.silverDim,fontFamily:"'Inter',system-ui,sans-serif",padding:"2px 0"}}>
                  <span style={{color:C.grayDark,width:36,flexShrink:0}}>Nv.{row.nivel}</span>
                  <span>{row.val}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── CÍRCULOS DE DOR WIDGET ───────────────────────────────────────────────────
function CirculosDorWidget({ativos,onChange}) {
  const toggle = (num) => onChange(ativos.includes(num)?ativos.filter(n=>n!==num):[...ativos,num]);
  return (
    <div style={{border:`1px solid ${C.border}`,background:C.bg2}}>
      {CIRCULOS_DOR.map((cd,i)=>{
        const ativo = ativos.includes(cd.num);
        return (
          <div key={cd.num} onClick={()=>toggle(cd.num)} style={{
            display:"flex",alignItems:"center",gap:14,padding:"10px 14px",cursor:"pointer",
            borderBottom:i<5?`1px solid ${C.bg3}`:"none",
            background:ativo?`${cd.cor}18`:"transparent",
            transition:"background 0.15s",
          }}>
            <div style={{width:24,height:24,borderRadius:"50%",border:`2px solid ${ativo?cd.cor:C.silverFaint}`,background:ativo?cd.cor:"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:ativo?C.white:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",fontWeight:"bold",flexShrink:0,transition:"all 0.15s"}}>{cd.num}</div>
            <div style={{flex:1}}>
              <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:13,color:ativo?C.white:C.gray,marginBottom:2}}>{cd.nome}</div>
              <div style={{fontFamily:"'Inter',system-ui,sans-serif",fontSize:11,color:ativo?C.silver:C.grayDark,lineHeight:1.4}}>{cd.efeito}</div>
            </div>
            <div style={{width:18,height:18,borderRadius:"50%",border:`1.5px solid ${ativo?cd.cor:C.border2}`,background:ativo?cd.cor:"transparent",flexShrink:0,transition:"all 0.15s"}}/>
          </div>
        );
      })}
    </div>
  );
}

// ─── ADD HAB FORM ─────────────────────────────────────────────────────────────
function AddHabForm({onAdd}) {
  const [val,setVal]=useState("");
  return (
    <div style={{display:"flex",gap:8,alignItems:"center"}}>
      <div style={{flex:1}}><Inp value={val} onChange={setVal} placeholder="Nova habilidade do companheiro..."/></div>
      <button onClick={()=>{if(val.trim()){onAdd(val.trim());setVal("");}}} style={{background:"transparent",border:`1px solid ${C.border2}`,color:C.silverDim,fontFamily:"'Inter',system-ui,sans-serif",fontSize:11,padding:"5px 14px",cursor:"pointer",letterSpacing:1,whiteSpace:"nowrap"}}>Adicionar</button>
    </div>
  );
}



// ─── CATÁLOGO COMPLETO (Sacramento RPG — fiel ao livro) ──────────────────────
// espaco: 0=não ocupa | 0.5=½ linha | 1 | 2 | 3
// dano/balas/recarga: só armas. mecânicas visíveis no modal.
const CATALOGO = {

  "Armas Comuns": [
    {nome:"Revólver",          preco:"R$15–25",  espaco:1,   obs:"Coldre. 6 balas. Recarga 2 ações. Dano 1●.",         dano:"1●",balas:6, recarga:"2 ações"},
    {nome:"Fuzil",             preco:"R$25–40",  espaco:3,   obs:"Bandoleira + 24 balas. 5 balas. Recarga 2 ações. Dano 3●. Alcance longo.", dano:"3●",balas:5,recarga:"2 ações"},
    {nome:"Espingarda",        preco:"R$25–40",  espaco:2,   obs:"Bandoleira. 2 balas. 1 ação recarga. Dano 3●(longo)/2●(perto).", dano:"3●/2●",balas:2,recarga:"1 ação"},
    {nome:"Garrucha",          preco:"R$10–20",  espaco:1,   obs:"1 bala. 2 ações recarga. Somente perto. Dano 2●.",   dano:"2●",balas:1,recarga:"2 ações"},
    {nome:"Zarabatana",        preco:"R$3–10",   espaco:1,   obs:"Dano 1●+veneno. Silenciosa. Sem recarga."},
    {nome:"Estilingue",        preco:"R$1–5",    espaco:1,   obs:"Dano 2●. Sem munição."},
    {nome:"Boleadeira",        preco:"R$1",      espaco:1,   obs:"Dano 3●. Pode imobilizar alvo."},
    {nome:"Arco e flecha",     preco:"R$25",     espaco:1,   obs:"Dano 1●. Silencioso.",                              dano:"1●"},
    {nome:"Faca",              preco:"R$1–5",    espaco:0,   obs:"Coldre/bainha. Dano 3●. 1 faca extra não conta no limite de 4 armas.", dano:"3●"},
    {nome:"Navalha",           preco:"R$10",     espaco:0,   obs:"Discreta. Permite habilidade Ataque Sacana.",        dano:"1●"},
    {nome:"Sabre (Espada)",    preco:"R$5–25",   espaco:0,   obs:"Bainha. Dano 1●.",                                  dano:"1●"},
    {nome:"Lança",             preco:"R$15–25",  espaco:0,   obs:"Dano 1●.",                                          dano:"1●"},
    {nome:"Machadinha",        preco:"R$5–10",   espaco:1,   obs:"Dano 1●.",                                          dano:"1●"},
    {nome:"Machado de lenha",  preco:"R$1–2",    espaco:2,   obs:"Dano 2●.",                                          dano:"2●"},
    {nome:"Martelo de mão",    preco:"R$5–10",   espaco:1,   obs:"Dano 1●.",                                          dano:"1●"},
  ],

  "Armas Especiais": [
    {nome:"Pistola automática",         preco:"R$1000–2000",espaco:1,  obs:"11 balas. 2 ações recarga. Dano 1●. +1 tiro extra por Ação de Combate.",          dano:"1●",balas:11,recarga:"2 ações"},
    {nome:"Magnum de cano alongado",    preco:"R$2000–4000",espaco:1,  obs:"6 balas. 2 ações recarga. Calibre .357. Dano 2● devastador.",                     dano:"2●",balas:6, recarga:"2 ações"},
    {nome:"Mauser C69",                 preco:"R$2000–4000",espaco:1,  obs:"15 balas. 1 ação recarga. Dano 1●. Carregador grande.",                           dano:"1●",balas:15,recarga:"1 ação"},
    {nome:"Carabina de repetição",      preco:"R$1000–2000",espaco:2,  obs:"7 balas. 2 ações recarga. Dano 2●. Tiro extra na 1ª Ação (−1 teste).",            dano:"2●",balas:7, recarga:"2 ações"},
    {nome:"Derringer (escondido)",      preco:"R$300",      espaco:1,  obs:"2 balas. 1 ação recarga. Dano 1●. Na manga — permite Ataque Sacana.",             dano:"1●",balas:2, recarga:"1 ação"},
    {nome:"Espingarda de cano serrado", preco:"R$50–150",   espaco:2,  obs:"2 balas. 2 ações recarga. Dano 3●. Cabe no coldre de cintura.",                   dano:"3●",balas:2, recarga:"2 ações"},
    {nome:"Canhão de cavalaria",        preco:"não se vende",espaco:0, obs:"1 bala. 2 turnos recarga. Dano 6●. Área 3m raio. Teste de Violência NA 7.",       dano:"6●",balas:1, recarga:"2 turnos"},
    {nome:"Metralhadora montada",       preco:"não se vende",espaco:0, obs:"2 turnos recarga. Dano 3●×Ações. Atinge todos em linha. Não há como mirar.",      dano:"3●×Ações"},
    {nome:"Explosivos (TNT/Dinamite)",  preco:"R$30–40",    espaco:0.5,obs:"3 ações p/ lançar. Dano 5●. Área 1,5m raio. Risco falha crítica = explode na mão.",dano:"5●"},
  ],

  "Coldres & Munição": [
    {nome:"Bandoleira",              preco:"R$5–20",  espaco:0,   obs:"Carrega fuzil ou espingarda + 24 projéteis. Sem coldre = +2 Ações p/ pegar munição."},
    {nome:"Cinturão de bala",        preco:"R$15",    espaco:0,   obs:"Comporta até 36 projéteis de revólver."},
    {nome:"Coldre de revólver",      preco:"R$15",    espaco:0,   obs:"1 revólver + 36 balas. Sem coldre = +2 Ações p/ pegar munição."},
    {nome:"Coldre de ombro",         preco:"R$20",    espaco:0,   obs:"1 revólver oculto sob casaco."},
    {nome:"Bainha",                  preco:"R$3–10",  espaco:0,   obs:"Faca, espada ou arma branca equivalente."},
    {nome:"Munição revólver (×12)",  preco:"R$3–8",   espaco:1,   obs:"Caixa com 12 projéteis de revólver."},
    {nome:"Munição espingarda (×6)", preco:"R$7–10",  espaco:1,   obs:"Caixa com 6 cartuchos de espingarda."},
    {nome:"Munição fuzil (×6)",      preco:"R$6–12",  espaco:1,   obs:"Caixa com 6 projéteis de fuzil."},
    {nome:"Dinamite (unidade)",      preco:"R$30",    espaco:0.5, obs:"½ espaço. Limite de quantidade na mochila. Explosivo."},
    {nome:"Pavio (10m)",             preco:"R$10–15", espaco:2,   obs:"Para uso com explosivos."},
    {nome:"Detonador",               preco:"R$3–5",   espaco:1,   obs:"Para uso com explosivos."},
  ],

  "Proteção": [
    {nome:"Sobretudo (proteção)",        preco:"R$50–70",   espaco:0, obs:"Redução 1●. Limite dano 2●. Penalidade: −1 Ação de Combate (mín.1). Não reduz explosões."},
    {nome:"Colete de couro reforçado",   preco:"R$100–200", espaco:0, obs:"Redução 1●. Limite dano 3●. Penalidade: −1 Movimento (mín.1). Não reduz explosões."},
    {nome:"Colete de couro com madeira", preco:"R$150–250", espaco:0, obs:"Redução 2●. Limite dano 4●. Penalidade: −1 Ação e −1 Movimento (mín.1)."},
    {nome:"Ombreiras de ferro",          preco:"R$400–500", espaco:0, obs:"Redução 2●. Limite dano 4●. Penalidade: −2 Movimentos (mín.1)."},
    {nome:"Placas de metal",             preco:"R$100–400", espaco:0, obs:"Redução 3●. Limite dano 5●. Penalidade: −2 Mov e −1 Ação (mín.1)."},
    {nome:"Panelas chumbadas",           preco:"R$200–400", espaco:0, obs:"Redução 3●. Limite dano 4●. Penalidade: −1 Mov e −2 Ações (mín.1)."},
  ],

  "Medicamentos & Ervas": [
    {nome:"Adrenalina (seringa)",      preco:"R$400–500", espaco:0.5, obs:"Recupera 3● instantaneamente. Efeito rebote: −1 Ação e −1 Mov ao fim do combate. Usar mais de uma não acumula benefícios."},
    {nome:"Unguento (pasta)",          preco:"R$5–10",    espaco:0.5, obs:"Cura 1● durante descanso."},
    {nome:"Álcool (frasco)",           preco:"R$3–5",     espaco:0.5, obs:"Desinfeta feridas, evita envenenamento e inflamações."},
    {nome:"Arsênico (frasco)",         preco:"R$2–4",     espaco:0.5, obs:"Veneno oral. Diminui efeito de peçonhas. Em excesso é perigoso."},
    {nome:"Babosa (erva)",             preco:"R$2",       espaco:0.5, obs:"Trata dores musculares e feridas. Bom para o cabelo."},
    {nome:"Boldo (erva)",              preco:"R$2",       espaco:0.5, obs:"Chá serve para úlcera, dores musculares, dor de cabeça e insolação."},
    {nome:"Cânfora (pasta)",           preco:"R$10–30",   espaco:0.5, obs:"Machucados e dores musculares. 1 Ação de Combate em campo = cura 1●."},
    {nome:"Cavalinha (erva)",          preco:"R$2",       espaco:0.5, obs:"Desintoxica venenos. Trata cólera, malária, indigestão."},
    {nome:"Erva-doce (erva)",          preco:"R$2",       espaco:0.5, obs:"Prisão de ventre, flatulências."},
    {nome:"Folha de salgueiro (erva)", preco:"R$3",       espaco:0.5, obs:"Febre alta e dores de cabeça."},
    {nome:"Gengibre (raiz)",           preco:"R$2",       espaco:0.5, obs:"Tosses, resfriados e febres."},
    {nome:"Laxante (frasco)",          preco:"R$5–10",    espaco:0.5, obs:"Constipações, inchaço, barriga dura e falta de fibra."},
    {nome:"Mil-folhas (erva)",         preco:"R$2",       espaco:0.5, obs:"Circulação respiratória, desobstrução das vias nasais."},
    {nome:"Morfina (ampola)",          preco:"R$50–100",  espaco:0.5, obs:"Anestésico intenso. Causa sono e delírio. Usada antes de cirurgias."},
    {nome:"Pomada de cavalo (pasta)",  preco:"R$5–10",    espaco:0.5, obs:"Cura 3● da montaria durante descanso."},
    {nome:"Tônico milagroso (frasco)", preco:"R$10–50",   espaco:0.5, obs:"Teste de Sorte: carta preta = cura 3●. Carta vermelha = envenenado."},
    {nome:"Xarope de tosse (frasco)", preco:"R$2–5",     espaco:0.5, obs:"Tosse e doenças pulmonares."},
  ],

  "Provisões & Alimentos": [
    {nome:"Açúcar (½kg)",         preco:"R$1–2",        espaco:0.5, obs:""},
    {nome:"Azeite (garrafa)",      preco:"R$2",          espaco:1,   obs:""},
    {nome:"Atum (lata)",           preco:"R$0,10–0,50",  espaco:0.5, obs:""},
    {nome:"Biscoitos",             preco:"R$0,50–1",     espaco:0,   obs:"Não ocupam espaço."},
    {nome:"Café (lata)",           preco:"R$0,50–1",     espaco:0,   obs:"Máx. 3 espaços na mochila."},
    {nome:"Carne seca (1kg)",      preco:"R$1–2",        espaco:1,   obs:""},
    {nome:"Cenouras (5)",          preco:"R$0,05–0,25",  espaco:1,   obs:""},
    {nome:"Cerveja (garrafa)",     preco:"R$0,25–1",     espaco:1,   obs:""},
    {nome:"Chocolate (barra)",     preco:"R$1–4",        espaco:0,   obs:"Não ocupa espaço."},
    {nome:"Conhaque fino (garrafa)",preco:"R$40–60",     espaco:0.5, obs:""},
    {nome:"Ervilhas (lata)",       preco:"R$3–15",       espaco:0.5, obs:""},
    {nome:"Erva medicinal (½kg)",  preco:"R$5–50",       espaco:0.5, obs:"Genérico."},
    {nome:"Farinha (½kg)",         preco:"R$1–2",        espaco:0.5, obs:""},
    {nome:"Feijão (lata)",         preco:"R$0,50–2",     espaco:1,   obs:""},
    {nome:"Folhas de chá (½kg)",   preco:"R$1–2",        espaco:1,   obs:""},
    {nome:"Fósforos (10)",         preco:"R$0,05–0,10",  espaco:0,   obs:"Não ocupa espaço."},
    {nome:"Jornal",                preco:"R$0,25",       espaco:0,   obs:"Não ocupa espaço."},
    {nome:"Leite (½ litro)",       preco:"R$3–5",        espaco:1,   obs:""},
    {nome:"Maçã (3)",              preco:"R$0,10",       espaco:0,   obs:"Não ocupa espaço."},
    {nome:"Milho (lata)",          preco:"R$0,10–0,50",  espaco:0.5, obs:""},
    {nome:"Óleo (lata)",           preco:"R$1–2",        espaco:1,   obs:""},
    {nome:"Óleo de lanterna",      preco:"R$0,25–0,50",  espaco:0.5, obs:"Combustível para lanterna."},
    {nome:"Ovos (6)",              preco:"R$1–2,50",     espaco:0.5, obs:""},
    {nome:"Paierinho (5)",         preco:"R$0,50–1",     espaco:0,   obs:"Não ocupa espaço."},
    {nome:"Pinga (garrafa)",       preco:"R$0,25–1",     espaco:1,   obs:""},
    {nome:"Pão de queijo (10)",    preco:"R$1–2",        espaco:0.5, obs:""},
    {nome:"Sardinha (lata)",       preco:"R$0,10–0,25",  espaco:0.5, obs:""},
    {nome:"Sabão (barra)",         preco:"R$0,10–0,25",  espaco:0.5, obs:"Máx. 2 barras."},
    {nome:"Sopa",                  preco:"R$0,50–2",     espaco:0.5, obs:""},
    {nome:"Queijo (½kg)",          preco:"R$3–6",        espaco:0.5, obs:""},
    {nome:"Tabaco (½kg)",          preco:"R$2–5",        espaco:0.5, obs:""},
    {nome:"Tônico capilar (frasco)",preco:"R$10–15",     espaco:0.5, obs:""},
    {nome:"Vinho (garrafa)",       preco:"R$5–10",       espaco:1,   obs:""},
    {nome:"Uísque (garrafa)",      preco:"R$5–10",       espaco:1,   obs:""},
  ],

  "Roupas & Moda": [
    {nome:"Anel (latão a diamante)", preco:"R$1–1500",  espaco:0, obs:"Não ocupa espaço. Roupas vestidas não ocupam espaço na mochila."},
    {nome:"Avental de médico",       preco:"R$2–5",     espaco:0.5, obs:"Peça não vestida: ½ espaço."},
    {nome:"Batina",                  preco:"R$1–2",     espaco:0.5, obs:""},
    {nome:"Bengala",                 preco:"R$1–2",     espaco:0.5, obs:""},
    {nome:"Boina",                   preco:"R$0,50–1",  espaco:0,   obs:"Não ocupa espaço."},
    {nome:"Bolsa de mão",            preco:"R$10–20",   espaco:0.5, obs:""},
    {nome:"Botas",                   preco:"R$5–10",    espaco:0,   obs:"Não ocupa espaço vestido."},
    {nome:"Blusa de inverno",        preco:"R$10–30",   espaco:0,   obs:"Não ocupa espaço vestida."},
    {nome:"Blusa de verão",          preco:"R$1–5",     espaco:0,   obs:"Não ocupa espaço vestida."},
    {nome:"Brincos",                 preco:"R$5–1500",  espaco:0,   obs:""},
    {nome:"Calça",                   preco:"R$2–8",     espaco:0,   obs:"Não ocupa espaço vestida."},
    {nome:"Camisa",                  preco:"R$2–5",     espaco:0,   obs:"Não ocupa espaço vestida."},
    {nome:"Camisola",                preco:"R$10–25",   espaco:0.5, obs:""},
    {nome:"Cartola",                 preco:"R$15–20",   espaco:0,   obs:""},
    {nome:"Casaco",                  preco:"R$2–15",    espaco:0,   obs:""},
    {nome:"Ceroulas",                preco:"R$1–2",     espaco:0,   obs:""},
    {nome:"Chapéu",                  preco:"R$5–100",   espaco:0,   obs:"Não ocupa espaço vestido."},
    {nome:"Cinto",                   preco:"R$1–5",     espaco:0,   obs:""},
    {nome:"Colar",                   preco:"R$2–2500",  espaco:0,   obs:""},
    {nome:"Colete",                  preco:"R$3–15",    espaco:0,   obs:""},
    {nome:"Echarpe",                 preco:"R$1–2",     espaco:0,   obs:""},
    {nome:"Estetoscópio",            preco:"R$10–50",   espaco:0.5, obs:""},
    {nome:"Gargantilha",             preco:"R$0,50–1",  espaco:0,   obs:""},
    {nome:"Gravata",                 preco:"R$1–5",     espaco:0,   obs:""},
    {nome:"Jaqueta",                 preco:"R$10–300",  espaco:0,   obs:""},
    {nome:"Leque",                   preco:"R$1–3",     espaco:0,   obs:""},
    {nome:"Lenço de pescoço",        preco:"R$0,50–1",  espaco:0,   obs:""},
    {nome:"Lingerie",                preco:"R$3–100",   espaco:0,   obs:""},
    {nome:"Luvas",                   preco:"R$0,25–1",  espaco:0,   obs:""},
    {nome:"Macacão jeans",           preco:"R$0,50–3",  espaco:0,   obs:""},
    {nome:"Meias",                   preco:"R$0,10–0,25",espaco:0,  obs:""},
    {nome:"Óculos",                  preco:"R$5–25",    espaco:0.5, obs:""},
    {nome:"Paletó",                  preco:"R$20–50",   espaco:0.5, obs:""},
    {nome:"Perneiras",               preco:"R$10–15",   espaco:0,   obs:""},
    {nome:"Pijamas",                 preco:"R$1–30",    espaco:0.5, obs:""},
    {nome:"Poncho",                  preco:"R$1–50",    espaco:0,   obs:""},
    {nome:"Pulseira",                preco:"R$2–2000",  espaco:0,   obs:""},
    {nome:"Saia",                    preco:"R$1–15",    espaco:0,   obs:""},
    {nome:"Sapatos",                 preco:"R$2–100",   espaco:0,   obs:""},
    {nome:"Sobretudo",               preco:"R$10–200",  espaco:0,   obs:"Não ocupa espaço vestido."},
    {nome:"Sombrero",                preco:"R$5–20",    espaco:0,   obs:""},
    {nome:"Suspensórios",            preco:"R$1–5",     espaco:0,   obs:""},
    {nome:"Tuxedo",                  preco:"R$10–50",   espaco:0.5, obs:""},
    {nome:"Vestido",                 preco:"R$2–150",   espaco:0,   obs:""},
    {nome:"Xale de lã",             preco:"R$1–2",     espaco:0,   obs:""},
  ],

  "Armazém & Ferramentas": [
    {nome:"Acordeão (sanfona)", preco:"R$30–50",   espaco:1,   obs:"Instrumento musical."},
    {nome:"Algemas",            preco:"R$2–4",     espaco:0.5, obs:""},
    {nome:"Alicate de arame",   preco:"R$20–50",   espaco:1,   obs:""},
    {nome:"Arame (10m)",        preco:"R$3–5",     espaco:2,   obs:""},
    {nome:"Banjo",              preco:"R$50–100",  espaco:1,   obs:"Instrumento musical."},
    {nome:"Baralho",            preco:"R$0,50–2",  espaco:0,   obs:"Não ocupa espaço."},
    {nome:"Barraca",            preco:"R$7–12",    espaco:1,   obs:""},
    {nome:"Berimbau",           preco:"R$1–2",     espaco:1,   obs:""},
    {nome:"Binóculo",           preco:"R$25–40",   espaco:0.5, obs:""},
    {nome:"Brinquedo",          preco:"R$10–20",   espaco:0.5, obs:""},
    {nome:"Bússola",            preco:"R$1–5",     espaco:0,   obs:"Não ocupa espaço."},
    {nome:"Cadeado",            preco:"R$0,50–1",  espaco:0.5, obs:""},
    {nome:"Cantil",             preco:"R$3–5",     espaco:0,   obs:"Não ocupa espaço."},
    {nome:"Chave inglesa",      preco:"R$5",       espaco:1,   obs:""},
    {nome:"Corda (5m)",         preco:"R$1–5",     espaco:1,   obs:""},
    {nome:"Corrente (2m)",      preco:"R$10–25",   espaco:1,   obs:""},
    {nome:"Dados (3)",          preco:"R$0,50–1",  espaco:0,   obs:"Não ocupa espaço."},
    {nome:"Detonador",          preco:"R$3–5",     espaco:1,   obs:"Para uso com explosivos."},
    {nome:"Flauta",             preco:"R$2–100",   espaco:1,   obs:""},
    {nome:"Foice",              preco:"R$10–25",   espaco:1,   obs:""},
    {nome:"Forcado",            preco:"R$10–25",   espaco:1,   obs:""},
    {nome:"Gaita (Harmônica)",  preco:"R$15–25",   espaco:1,   obs:""},
    {nome:"Ganzá (Chocalho)",   preco:"R$5–10",    espaco:1,   obs:""},
    {nome:"Gazuas (20)",        preco:"R$0,50–1",  espaco:1,   obs:"Para arrombamento."},
    {nome:"Graxa (pote)",       preco:"R$1–2",     espaco:0.5, obs:""},
    {nome:"Isqueiro",           preco:"R$5–30",    espaco:0,   obs:"Não ocupa espaço."},
    {nome:"Lanterna",           preco:"R$5–10",    espaco:1,   obs:"Consome óleo de lanterna."},
    {nome:"Linha e agulha",     preco:"R$0,50–1",  espaco:0,   obs:"Não ocupa espaço."},
    {nome:"Lona (2m)",          preco:"R$20–30",   espaco:2,   obs:""},
    {nome:"Machado",            preco:"R$10–25",   espaco:1,   obs:""},
    {nome:"Marreta",            preco:"R$10–25",   espaco:1,   obs:""},
    {nome:"Mochila",            preco:"R$1",       espaco:0,   obs:"10 espaços de capacidade."},
    {nome:"Óculos",             preco:"R$20–50",   espaco:0.5, obs:""},
    {nome:"Pá",                 preco:"R$1–2",     espaco:1,   obs:""},
    {nome:"Pandeiro",           preco:"R$60–80",   espaco:1,   obs:""},
    {nome:"Panela",             preco:"R$3–10",    espaco:1,   obs:""},
    {nome:"Pavio (10m)",        preco:"R$10–15",   espaco:2,   obs:"Para uso com explosivos."},
    {nome:"Pé de cabra",        preco:"R$5–10",    espaco:1,   obs:"Para arrombamento."},
    {nome:"Pederneira",         preco:"R$0,50–1",  espaco:0.5, obs:""},
    {nome:"Picareta",           preco:"R$10–25",   espaco:2,   obs:""},
    {nome:"Pregos (20)",        preco:"R$0,50–1",  espaco:0,   obs:"Máx. 20 pacotes."},
    {nome:"Relógio de bolso",   preco:"R$25–50",   espaco:0.5, obs:""},
    {nome:"Sabão (barra)",      preco:"R$0,25–0,50",espaco:0.5,obs:"Máx. 2 barras."},
    {nome:"Saco de dormir",     preco:"R$0,25–0,50",espaco:1,  obs:""},
    {nome:"Tamborim",           preco:"R$10–20",   espaco:1,   obs:""},
    {nome:"Tesourão",           preco:"R$25–50",   espaco:2,   obs:""},
    {nome:"Vara de pescar",     preco:"R$3–5",     espaco:1,   obs:""},
    {nome:"Viola",              preco:"R$30–60",   espaco:1,   obs:""},
    {nome:"Violão",             preco:"R$30–60",   espaco:1,   obs:""},
    {nome:"Violino",            preco:"R$50–100",  espaco:1,   obs:""},
    {nome:"Zabumba",            preco:"R$30–50",   espaco:2,   obs:""},
  ],

  "Montaria & Transporte": [
    {nome:"Bolsa de montaria",  preco:"R$2–10",   espaco:0, obs:"+10 espaços extras no cavalo. Necessária para transportar objetos na montaria."},
    {nome:"Sela",               preco:"R$3–10",   espaco:0, obs:"Necessária para montar com conforto."},
    {nome:"Carroça",            preco:"R$15–30",  espaco:0, obs:"+30 espaços. Para grandes travessias. Comporta itens grandes demais para mochila."},
    {nome:"Carro",              preco:"R$1–25",   espaco:0, obs:"+20 espaços. Puxado por bois ou cavalos."},
    {nome:"Coche Elegante",     preco:"R$400",    espaco:0, obs:"Transporte de luxo. +30 espaços."},
    {nome:"Cavalo",             preco:"R$1–250",  espaco:0, obs:"Montaria principal. Veja aba Companheiro."},
    {nome:"Mula/Burrico",       preco:"R$1–100",  espaco:0, obs:"Resistente. Carrega mais peso."},
    {nome:"Canoa",              preco:"R$20–50",  espaco:0, obs:"Travessias fluviais."},
    {nome:"Apicultura",         preco:"R$5–10",   espaco:0, obs:"Serviço/criação."},
    {nome:"Bovino",             preco:"R$10–300", espaco:0, obs:"Criação."},
    {nome:"Galinhas",           preco:"R$1–3",    espaco:0, obs:"Criação."},
    {nome:"Curral (dia/sem.)",  preco:"R$1–2",    espaco:0, obs:"Cuida da montaria. Banho, alimentação e descanso."},
  ],
};

const CAT_KEYS = Object.keys(CATALOGO);
const espacoLabel = (e) => e===0?"—":e===0.5?"½":String(e);

// ─── BLANK CHAR ───────────────────────────────────────────────────────────────
const createBlankChar = () => ({
  id: Date.now(), nome:"", conceito:"", jogador:"", imagem:null,
  atributos:{Físico:0,Velocidade:0,Intelecto:0,Coragem:0},
  antecedentes:{Atenção:0,Roubo:0,Montaria:0,Tradição:0,Medicina:0,Suor:0,Negócios:0,Violência:0},
  vidaBase:6, vidaAtual:6, circulosDorAtivos:[],
  defesa:5, movimentos:1, acoes:1,
  nivel:1, xp:0, dinheiro:200,
  habilidades:[], habsCustom:[],
  trilha:{tipo:"",passos:["","","","","",""],completos:[false,false,false,false,false,false]},
  recompensa:0,
  inventario:[],
  historicoFinanceiro:[],
  montaria:{nome:"",tipo:"Cavalo",potencia:0,resistencia:0,fidelidade:0,habilidades:[],inventario:[]},
  notas:"", pontosSina:0, honra:0,
  cartasSina:[], // [{id, rank, suit, usada}]
  balasPorArma:{}, // {nomeArma: quantidade}
  cartasSina:[], // [{id, rank, suit, usada}]
  balasPorArma:{}, // {nomeArma: quantidade}
  antecedentesLocked:{},
  notasCards:[],
  antecedentesLocked:{},
  notasCards:[],
});

// ─── ITEM HELPER ──────────────────────────────────────────────────────────────
const newCustomItem = () => ({
  id: Date.now()+Math.random(), nome:"", cat:"Outros",
  espaco:1, qtd:1, preco:"", obs:"", compartimento:"mochila",
});

// Ícones de compartimento
const COMPARTIMENTOS = [
  {id:"mochila",   label:"Mochila",   limite:10, icon:"🎒"},
  {id:"montaria",  label:"Montaria",  limite:10, icon:"🐴"},
  {id:"carroca",   label:"Carroça",   limite:30, icon:"🛒"},
  {id:"equipado",  label:"Equipado",  limite:0,  icon:"👤"},
];

// ─── INVENTÁRIO TAB ──────────────────────────────────────────────────────────
// ─── BULLET TRACKER COMPONENT ────────────────────────────────────────────────
function BalasTracker({ max, atual, recarga, onChange }) {
  const vazia = atual === 0;
  return (
    <div style={{display:"flex",flexDirection:"column",gap:2,flexShrink:0,alignItems:"flex-start"}}>
      <div style={{display:"flex",gap:2,flexWrap:"wrap",maxWidth:120}}>
        {Array.from({length:max}).map((_,i)=>(
          <div key={i} onClick={()=>onChange(atual===i+1?i:i+1)}
            style={{width:9,height:9,borderRadius:"50%",cursor:"pointer",
              border:`1.5px solid ${i<atual?"#c09040":"#3a3a3a"}`,
              background:i<atual?"#c09040":"transparent",
              transition:"all 0.1s",
              flexShrink:0,
            }}/>
        ))}
      </div>
      <div style={{display:"flex",gap:4,alignItems:"center"}}>
        <span style={{fontSize:8,color:vazia?C.red:"#c09040",fontFamily:"'Inter',system-ui,sans-serif",letterSpacing:1}}>
          {atual}/{max}{vazia?" VAZIA":""}
        </span>
        {vazia&&recarga&&(
          <span style={{fontSize:8,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif"}}>↺{recarga}</span>
        )}
        {atual<max&&(
          <button onClick={()=>onChange(max)} style={{fontSize:7,background:"transparent",border:`1px solid ${C.border}`,color:C.grayDark,cursor:"pointer",padding:"0px 4px",letterSpacing:0.5}}>recarregar</button>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── SISTEMA DE DUELO (Five-Card-Draw / Pôquer Fechado) ──────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

// Valor numérico de uma carta para comparação
const CARD_RANK_VAL = {"A":14,"K":13,"Q":12,"J":11,"10":10,"9":9,"8":8,"7":7,"6":6,"5":5,"4":4,"3":3,"2":2};

// Presenças dos naipes (livro pág. 111)
const PRESENCAS = {
  "♥": { nome:"Enfermeira", desc:"PROTEÇÃO", vencer:"Recebe +1 na Defesa no próximo combate", perder:"O tiro não é mortal — se apostou Atributos, entrega 1 ponto a menos (mín. 1)" },
  "♦": { nome:"Fiandeira",  desc:"PASSADO",  vencer:"Troque os pontos de 2 Antecedentes do seu adversário (exceto Violência)", perder:"Troque os pontos de 2 dos seus Antecedentes" },
  "♣": { nome:"Faroleiro",  desc:"JORNADA",  vencer:"Elimine um passo da sua Trilha de Redenção", perder:"Adicione mais um passo à sua Trilha" },
  "♠": { nome:"Açougueiro", desc:"MORTE",    vencer:"Tiro mais letal — perdedor faz Teste de Morte e só o 6 salva", perder:"Ainda assim um tiro te acerta; fica com 1 Vida e −1 em Violência no próximo combate" },
};

// Ranking de mãos de pôquer (menor índice = melhor)
const HAND_RANKS = ["royal_flush","straight_flush","four_of_a_kind","full_house","flush","straight","three_of_a_kind","two_pair","one_pair","high_card"];
const HAND_NAMES = {
  royal_flush:"Royal Flush",straight_flush:"Straight Flush",four_of_a_kind:"Quadra",
  full_house:"Full House",flush:"Flush",straight:"Sequência",
  three_of_a_kind:"Trinca",two_pair:"Dois Pares",one_pair:"Par",high_card:"Carta Alta"
};

function buildFullDeck() {
  const ranks = ["A","K","Q","J","10","9","8","7","6","5","4","3","2"];
  const suits = ["♠","♥","♦","♣"];
  const deck = [];
  for(const s of suits) for(const r of ranks) deck.push({rank:r,suit:s,value:CARD_RANK_VAL[r]});
  deck.push({rank:"🃏",suit:"",value:0});
  deck.push({rank:"🃏",suit:"",value:0});
  return deck;
}

function shuffleDeck(deck) {
  const d = [...deck];
  for(let i=d.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[d[i],d[j]]=[d[j],d[i]];}
  return d;
}

function evaluateHand(cards5) {
  // Ignora coringas para simplificar (valor nulo)
  const real = cards5.filter(c=>c.rank!=="🃏");
  const vals  = real.map(c=>c.value).sort((a,b)=>b-a);
  const suits  = real.map(c=>c.suit);
  const rankCounts = {};
  vals.forEach(v=>{ rankCounts[v]=(rankCounts[v]||0)+1; });
  const counts = Object.values(rankCounts).sort((a,b)=>b-a);
  const isFlush  = real.length===5&&suits.every(s=>s===suits[0]);
  const isStraight = real.length===5&&(vals[0]-vals[4]===4)&&counts[0]===1;
  const isRoyal  = isStraight&&isFlush&&vals[0]===14;

  if(isRoyal) return { hand:"royal_flush", tiebreak:vals };
  if(isStraight&&isFlush) return { hand:"straight_flush", tiebreak:vals };
  if(counts[0]===4) return { hand:"four_of_a_kind", tiebreak:vals };
  if(counts[0]===3&&counts[1]===2) return { hand:"full_house", tiebreak:vals };
  if(isFlush) return { hand:"flush", tiebreak:vals };
  if(isStraight) return { hand:"straight", tiebreak:vals };
  if(counts[0]===3) return { hand:"three_of_a_kind", tiebreak:vals };
  if(counts[0]===2&&counts[1]===2) return { hand:"two_pair", tiebreak:vals };
  if(counts[0]===2) return { hand:"one_pair", tiebreak:vals };
  return { hand:"high_card", tiebreak:vals };
}

function compareHands(h1, h2) {
  const r1 = HAND_RANKS.indexOf(h1.hand);
  const r2 = HAND_RANKS.indexOf(h2.hand);
  if(r1!==r2) return r1<r2?1:-1;
  for(let i=0;i<Math.min(h1.tiebreak.length,h2.tiebreak.length);i++){
    if(h1.tiebreak[i]!==h2.tiebreak[i]) return h1.tiebreak[i]>h2.tiebreak[i]?1:-1;
  }
  return 0; // empate
}

function detectPresencas(allCards) {
  const naipeCounts = {"♠":0,"♥":0,"♦":0,"♣":0};
  allCards.filter(c=>c.suit).forEach(c=>{ if(naipeCounts[c.suit]!=null) naipeCounts[c.suit]++; });
  return Object.entries(naipeCounts).filter(([,n])=>n>=3).map(([suit])=>suit);
}

function DueloModal({ chars, onClose }) {
  const [fase, setFase] = useState("setup"); // setup | rodada1 | resultado
  const [deck, setDeck] = useState([]);
  const [mesa, setMesa] = useState([]); // 5 cartas na mesa
  const [maos, setMaos] = useState([[],[]]); // 2 cartas por duelista
  const [selecionadas, setSelecionadas] = useState([null,null]); // índice de carta selecionada (ou null = não trocar)
  const [duelistaNomes, setDuelistaNomes] = useState(["Duelista 1","Duelista 2"]);
  const [apostas, setApostas] = useState([1,1]); // Vida apostada
  const [revelado, setRevelado] = useState(false);
  const [resultado, setResultado] = useState(null);

  const iniciarDuelo = () => {
    const d = shuffleDeck(buildFullDeck());
    const m1 = [d[0],d[1]];
    const m2 = [d[2],d[3]];
    const me = [d[4],d[5],d[6],d[7],d[8]];
    setDeck(d.slice(9));
    setMaos([m1,m2]);
    setMesa(me);
    setSelecionadas([null,null]);
    setRevelado(false);
    setResultado(null);
    setFase("rodada1");
  };

  const trocarCarta = (duelistaIdx, cartaIdx) => {
    const novas = [...selecionadas];
    novas[duelistaIdx] = novas[duelistaIdx]===cartaIdx?null:cartaIdx;
    setSelecionadas(novas);
  };

  const revelar = () => {
    // Aplicar trocas
    const maosFinais = maos.map((mao,di)=>{
      if(selecionadas[di]==null) return mao; // manteve cartas, usa só mesa
      if(selecionadas[di]===-1) return []; // descartou tudo, usa só mesa
      // troca a carta selecionada do índice
      return mao; // simplificado: mantém as 2 na mão
    });

    // Monta as 7 cartas de cada duelista (2 mão + 5 mesa), escolhe melhor 5
    const melhores = maosFinais.map((mao)=>{
      const todas = [...mao,...mesa].filter(c=>c);
      // Encontra a melhor combinação de 5 entre as 7
      let melhor = null;
      for(let i=0;i<todas.length;i++) for(let j=i+1;j<todas.length;j++){
        const five = todas.filter((_,k)=>k!==i&&k!==j);
        const eval5 = evaluateHand(five);
        if(!melhor||compareHands(eval5,melhor)>0) melhor={...eval5,cards:five};
      }
      if(!melhor) melhor={...evaluateHand(todas.slice(0,5)),cards:todas.slice(0,5)};
      return melhor;
    });

    const cmp = compareHands(melhores[0],melhores[1]);
    const vencedor = cmp>0?0:cmp<0?1:-1; // -1 = empate

    // Detectar presenças
    const todasCartas = [...maosFinais[0],...maosFinais[1],...mesa];
    const presencas = detectPresencas(todasCartas);

    // Determinar quem tem qual presença
    const presD1 = detectPresencas([...maosFinais[0],...mesa]);
    const presD2 = detectPresencas([...maosFinais[1],...mesa]);

    setResultado({ vencedor, melhores, presencas, presD1, presD2, maosFinais });
    setRevelado(true);
  };

  const renderCard = (card, size="md", highlighted=false, onClick=null) => (
    <CardVisual key={card.rank+card.suit} card={card} size={size}
      style={{cursor:onClick?"pointer":"default",
        boxShadow:highlighted?"0 0 8px #c09040":""}}
      onClick={onClick}/>
  );

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.97)",zIndex:3000,overflowY:"auto"}}>
      <div style={{maxWidth:820,margin:"0 auto",padding:"24px 20px"}}>
        {/* Header */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24,borderBottom:`1px solid ${C.border}`,paddingBottom:14}}>
          <div>
            <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:16,letterSpacing:6,color:C.silver,textTransform:"uppercase"}}>Duelo</div>
            <div style={{fontSize:9,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",letterSpacing:2,marginTop:2}}>Five-Card-Draw · Pôquer Fechado</div>
          </div>
          <button onClick={onClose} style={{background:"transparent",border:`1px solid ${C.border}`,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",fontSize:10,padding:"5px 12px",cursor:"pointer",letterSpacing:1}}>✕ Fechar</button>
        </div>

        {fase==="setup"&&(
          <div>
            <div style={{fontFamily:"'Inter',system-ui,sans-serif",fontSize:12,color:C.grayDark,lineHeight:1.9,marginBottom:20}}>
              O duelo funciona como Pôquer Fechado (Five-Card-Draw). O Crupiê embaralha, distribui 2 cartas a cada duelista e coloca 5 na mesa. Vence quem tiver a melhor sequência.
            </div>
            {/* Nomes dos duelistas */}
            <div style={{display:"flex",gap:16,marginBottom:20,flexWrap:"wrap"}}>
              {[0,1].map(i=>(
                <div key={i} style={{flex:1,minWidth:180}}>
                  <div style={{fontSize:9,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",letterSpacing:2,marginBottom:4,textTransform:"uppercase"}}>Duelista {i+1}</div>
                  <input value={duelistaNomes[i]} onChange={e=>{const n=[...duelistaNomes];n[i]=e.target.value;setDuelistaNomes(n);}}
                    style={{background:"transparent",border:"none",borderBottom:`1px solid ${C.border}`,color:C.white,fontFamily:"'Playfair Display',Georgia,serif",fontSize:16,width:"100%",outline:"none",padding:"2px 0"}}/>
                </div>
              ))}
            </div>
            {/* Apostas de vida */}
            <div style={{display:"flex",gap:16,marginBottom:24,flexWrap:"wrap"}}>
              {[0,1].map(i=>(
                <div key={i}>
                  <div style={{fontSize:9,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",letterSpacing:2,marginBottom:6,textTransform:"uppercase"}}>{duelistaNomes[i]} — aposta (Vida)</div>
                  <div style={{display:"flex",gap:6,alignItems:"center"}}>
                    <button onClick={()=>{const a=[...apostas];a[i]=Math.max(1,a[i]-1);setApostas(a);}} style={{...btnSm,width:24,height:24,fontSize:13}}>−</button>
                    <span style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:22,color:C.white,width:32,textAlign:"center"}}>{apostas[i]}</span>
                    <button onClick={()=>{const a=[...apostas];a[i]++;setApostas(a);}} style={{...btnSm,width:24,height:24,fontSize:13}}>+</button>
                    <span style={{fontSize:10,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif"}}>Vida</span>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={iniciarDuelo} style={{background:"transparent",border:`1px solid ${C.silver}`,color:C.silver,fontFamily:"'Playfair Display',Georgia,serif",fontSize:11,letterSpacing:4,textTransform:"uppercase",padding:"10px 28px",cursor:"pointer"}}>
              Iniciar Duelo →
            </button>
          </div>
        )}

        {fase==="rodada1"&&(
          <div>
            {/* Mesa */}
            <div style={{marginBottom:24}}>
              <div style={{fontSize:9,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",letterSpacing:3,textTransform:"uppercase",marginBottom:10}}>Mesa (5 cartas abertas)</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {mesa.map((c,i)=><CardVisual key={i} card={c} size="md"/>)}
              </div>
            </div>

            {/* Mãos */}
            {[0,1].map(di=>(
              <div key={di} style={{marginBottom:20,padding:"14px 16px",border:`1px solid ${C.border}`,background:C.bg2}}>
                <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:14,color:C.white,marginBottom:10}}>
                  {duelistaNomes[di]} <span style={{fontSize:10,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif"}}>— {apostas[di]} Vida apostada</span>
                </div>
                <div style={{fontSize:10,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",marginBottom:8}}>
                  Suas 2 cartas (clique para selecionar qual descartar — ou mantenha ambas para usar com a mesa):
                </div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:8}}>
                  {maos[di].map((c,ci)=>(
                    <div key={ci} onClick={()=>trocarCarta(di,ci)} style={{cursor:"pointer",position:"relative"}}>
                      <CardVisual card={c} size="md"
                        style={{opacity:selecionadas[di]===ci?0.4:1,border:`2px solid ${selecionadas[di]===ci?"#c04040":"transparent"}`}}/>
                      {selecionadas[di]===ci&&(
                        <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:C.red,fontFamily:"'Inter',system-ui,sans-serif",fontWeight:"bold"}}>descartar</div>
                      )}
                    </div>
                  ))}
                </div>
                <div style={{fontSize:9,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif"}}>
                  {selecionadas[di]!=null?"Uma carta será descartada — usa apenas a outra + mesa":"Mantém as 2 cartas para combinar com a mesa"}
                </div>
              </div>
            ))}

            {!revelado&&(
              <button onClick={revelar} style={{background:"transparent",border:`1px solid ${C.silver}`,color:C.silver,fontFamily:"'Playfair Display',Georgia,serif",fontSize:11,letterSpacing:4,textTransform:"uppercase",padding:"10px 28px",cursor:"pointer"}}>
                Revelar Cartas →
              </button>
            )}

            {revelado&&resultado&&(
              <div style={{marginTop:20}}>
                {/* Mãos finais */}
                <div style={{display:"flex",gap:16,flexWrap:"wrap",marginBottom:20}}>
                  {[0,1].map(di=>{
                    const eh = resultado.melhores[di];
                    const ganhou = resultado.vencedor===di;
                    return (
                      <div key={di} style={{flex:"1 1 300px",padding:"14px 16px",border:`1px solid ${ganhou?"#8b7030":C.border}`,background:ganhou?"#1a1200":C.bg2}}>
                        <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:14,color:ganhou?"#c09040":C.white,marginBottom:6}}>
                          {duelistaNomes[di]} {ganhou&&"🏆"}
                        </div>
                        <div style={{fontSize:11,color:ganhou?"#c09040":C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",marginBottom:10,letterSpacing:1}}>{HAND_NAMES[eh.hand]}</div>
                        <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:8}}>
                          {eh.cards.map((c,i)=><CardVisual key={i} card={c} size="sm"/>)}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Resultado */}
                <div style={{padding:"14px 18px",border:`1px solid ${C.silver}`,background:C.bg3,marginBottom:16}}>
                  {resultado.vencedor===-1?(
                    <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:16,color:C.silver}}>Empate — decide-se entre os duelistas</div>
                  ):(
                    <>
                      <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:16,color:"#c09040",marginBottom:6}}>
                        {duelistaNomes[resultado.vencedor]} venceu o Duelo!
                      </div>
                      <div style={{fontFamily:"'Inter',system-ui,sans-serif",fontSize:12,color:C.gray,lineHeight:1.9}}>
                        · {duelistaNomes[1-resultado.vencedor]} perde {apostas[1-resultado.vencedor]} Círculos de Vida apostados<br/>
                        · Se zerar Vida: fazer Teste de Morte ou gastar uma Carta de Sina
                      </div>
                    </>
                  )}
                </div>

                {/* Presenças */}
                {resultado.presencas.length>0&&(
                  <div style={{marginBottom:16}}>
                    <div style={{fontSize:9,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",letterSpacing:3,textTransform:"uppercase",marginBottom:10}}>Presenças Ativadas (3+ do mesmo naipe)</div>
                    {resultado.presencas.map(suit=>{
                      const pr = PRESENCAS[suit];
                      const vencedorTemPresenca = resultado.presD1.includes(suit);
                      const perdedorTemPresenca = resultado.presD2.includes(suit);
                      return pr?(
                        <div key={suit} style={{padding:"10px 14px",border:`1px solid #3a2a00`,background:"#0d0900",marginBottom:8}}>
                          <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:13,color:"#c09040",marginBottom:4}}>
                            {suit} {pr.nome} — {pr.desc}
                          </div>
                          {resultado.vencedor!==-1&&(
                            <>
                              <div style={{fontSize:11,color:"#50c050",fontFamily:"'Inter',system-ui,sans-serif",marginBottom:2}}>
                                ✓ Vencedor: {pr.vencer}
                              </div>
                              <div style={{fontSize:11,color:C.red,fontFamily:"'Inter',system-ui,sans-serif"}}>
                                ✗ Perdedor: {pr.perder}
                              </div>
                            </>
                          )}
                        </div>
                      ):null;
                    })}
                  </div>
                )}

                {/* Sequências de referência */}
                <details style={{fontSize:9,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif"}}>
                  <summary style={{cursor:"pointer",color:C.silverDim,letterSpacing:1}}>Referência — Sequências (melhor → pior)</summary>
                  <div style={{marginTop:6,lineHeight:2,color:C.gray}}>
                    Royal Flush · Straight Flush · Quadra · Full House · Flush · Sequência · Trinca · Dois Pares · Par · Carta Alta
                  </div>
                </details>

                <div style={{display:"flex",gap:8,marginTop:16}}>
                  <button onClick={iniciarDuelo} style={{background:"transparent",border:`1px solid ${C.border2}`,color:C.silverDim,fontFamily:"'Inter',system-ui,sans-serif",fontSize:10,padding:"6px 16px",cursor:"pointer",letterSpacing:2}}>↺ Novo Duelo</button>
                  <button onClick={()=>setFase("setup")} style={{background:"transparent",border:`1px solid ${C.border}`,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",fontSize:10,padding:"6px 14px",cursor:"pointer",letterSpacing:1}}>Configurar</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function InventarioTab({char,upd}) {
  const inv = char.inventario || [];
  const [modalOpen,    setModalOpen]    = useState(false);
  const [catAtiva,     setCatAtiva]     = useState(CAT_KEYS[0]);
  const [busca,        setBusca]        = useState("");
  const [editId,       setEditId]       = useState(null);
  const [compAtivo,    setCompAtivo]    = useState("mochila"); // compartimento no modal
  const [showFinanca,  setShowFinanca]  = useState(false);
  const [txDesc,       setTxDesc]       = useState("");
  const [txVal,        setTxVal]        = useState("");
  const buscaRef = useRef();

  // ── Espaços por compartimento ─────────────────────────────────────────────
  const espacosPor = (comp) => inv
    .filter(it=>(it.compartimento||"mochila")===comp)
    .reduce((acc,it)=> acc + (it.espaco===0?0:it.espaco*(it.qtd||1)), 0);

  const addItem = (itemCat) => {
    const novo = {
      id: Date.now()+Math.random(),
      nome: itemCat.nome, cat: catAtiva,
      espaco: itemCat.espaco, qtd: 1,
      preco: itemCat.preco, obs: itemCat.obs||"",
      compartimento: compAtivo,
      dano: itemCat.dano||"", balas: itemCat.balas||0, balasAtuais: itemCat.balas||0, recarga: itemCat.recarga||"",
    };
    upd("inventario",[...inv, novo]);
  };

  const addCustom = () => {
    const novo = {
      id: Date.now()+Math.random(), nome:"", cat:"Outros",
      espaco:1, qtd:1, preco:"", obs:"",
      compartimento: compAtivo, dano:"", balas:0, recarga:"",
    };
    const next = [...inv, novo];
    upd("inventario", next);
    setTimeout(()=>setEditId(novo.id), 50);
  };

  const updItem    = (id,patch) => upd("inventario", inv.map(it=>it.id===id?{...it,...patch}:it));
  const removeItem = (id)       => upd("inventario", inv.filter(it=>it.id!==id));

  // ── Financeiro ───────────────────────────────────────────────────────────
  const historico = char.historicoFinanceiro || [];
  const saldo     = char.dinheiro || 0;

  const registrarTx = (tipo) => {
    const val = parseFloat((txVal||"").replace(",","."));
    if (!val || isNaN(val)) return;
    const delta = tipo==="receita"?val:-val;
    const nova  = {id:Date.now(), tipo, desc:txDesc||"—", val, ts:Date.now()};
    upd("dinheiro", Math.max(0, saldo+delta));
    upd("historicoFinanceiro", [nova, ...historico].slice(0,40));
    setTxDesc(""); setTxVal("");
  };

  // ── Busca / filtro catálogo ───────────────────────────────────────────────
  const itemsFiltrados = busca.trim()
    ? Object.entries(CATALOGO).flatMap(([cat,items])=>
        items.filter(it=>it.nome.toLowerCase().includes(busca.toLowerCase()))
             .map(it=>({...it,_cat:cat})))
    : (CATALOGO[catAtiva]||[]).map(it=>({...it,_cat:catAtiva}));

  // ── Agrupa inventário por compartimento → categoria ───────────────────────
  const invPorComp = COMPARTIMENTOS.reduce((acc,c)=>{
    acc[c.id] = inv.filter(it=>(it.compartimento||"mochila")===c.id);
    return acc;
  },{});

  const espacoCor = (usado,limite) =>
    limite===0?"transparent":
    usado>limite?C.red:
    usado>=limite*0.8?"#c07020":C.silver;

  // ── Câmara de armas no inventário ────────────────────────────────────────
  const armasEquipadas = inv.filter(it=>(it.compartimento||"mochila")==="equipado");

  return (
    <div>

      {/* ══ CONTROLE FINANCEIRO ══════════════════════════════════════════════ */}
      <div style={{marginTop:16,border:`1px solid ${C.border}`,background:C.bg2}}>
        {/* header clicável */}
        <div onClick={()=>setShowFinanca(f=>!f)}
          style={{display:"flex",alignItems:"center",justifyContent:"space-between",
                  padding:"10px 16px",cursor:"pointer",userSelect:"none"}}>
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            <span style={{fontSize:11,letterSpacing:2,color:C.silverDim,fontFamily:"'Inter',system-ui,sans-serif",textTransform:"uppercase"}}>Dinheiro</span>
            <span style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:22,color:C.silver}}>
              R${saldo.toLocaleString("pt-BR")}
            </span>
            <span style={{fontSize:9,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",letterSpacing:1}}>
              ≈ R$1 réis = R$50 hoje
            </span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            {/* botões rápidos +/- */}
            {[10,50,100].map(v=>(
              <button key={v} onClick={e=>{e.stopPropagation();upd("dinheiro",Math.max(0,saldo-v));}}
                style={{background:"transparent",border:`1px solid ${C.redDim}`,color:C.redDim,fontFamily:"'Inter',system-ui,sans-serif",fontSize:9,padding:"3px 7px",cursor:"pointer",letterSpacing:1}}>−{v}</button>
            ))}
            {[10,50,100].map(v=>(
              <button key={v} onClick={e=>{e.stopPropagation();upd("dinheiro",saldo+v);}}
                style={{background:"transparent",border:`1px solid ${C.silverFaint}`,color:C.silverDim,fontFamily:"'Inter',system-ui,sans-serif",fontSize:9,padding:"3px 7px",cursor:"pointer",letterSpacing:1}}>+{v}</button>
            ))}
            <span style={{fontSize:12,color:C.grayDark,marginLeft:8}}>{showFinanca?"▲":"▼"}</span>
          </div>
        </div>

        {showFinanca&&(
          <div style={{borderTop:`1px solid ${C.border}`,padding:"12px 16px"}}>
            {/* Transação manual */}
            <div style={{display:"flex",gap:8,alignItems:"flex-end",flexWrap:"wrap",marginBottom:14}}>
              <div style={{flex:2,minWidth:140}}>
                <div style={{fontSize:9,color:C.grayDark,letterSpacing:1,fontFamily:"'Inter',system-ui,sans-serif",marginBottom:3}}>DESCRIÇÃO</div>
                <input value={txDesc} onChange={e=>setTxDesc(e.target.value)} placeholder="ex: Comprou revólver..."
                  style={{background:"transparent",border:"none",borderBottom:`1px solid ${C.border}`,color:C.white,fontFamily:"'Inter',system-ui,sans-serif",fontSize:13,width:"100%",outline:"none",padding:"2px 0"}}/>
              </div>
              <div style={{minWidth:90}}>
                <div style={{fontSize:9,color:C.grayDark,letterSpacing:1,fontFamily:"'Inter',system-ui,sans-serif",marginBottom:3}}>VALOR (R$)</div>
                <input value={txVal} onChange={e=>setTxVal(e.target.value)} placeholder="0"
                  style={{background:"transparent",border:"none",borderBottom:`1px solid ${C.border}`,color:C.white,fontFamily:"'Inter',system-ui,sans-serif",fontSize:13,width:"100%",outline:"none",padding:"2px 0"}}/>
              </div>
              <button onClick={()=>registrarTx("despesa")}
                style={{background:"transparent",border:`1px solid ${C.redDim}`,color:C.red,fontFamily:"'Inter',system-ui,sans-serif",fontSize:10,padding:"5px 12px",cursor:"pointer",letterSpacing:1}}>
                − Gastar
              </button>
              <button onClick={()=>registrarTx("receita")}
                style={{background:"transparent",border:`1px solid ${C.silverFaint}`,color:C.silver,fontFamily:"'Inter',system-ui,sans-serif",fontSize:10,padding:"5px 12px",cursor:"pointer",letterSpacing:1}}>
                + Receber
              </button>
              <button onClick={()=>{const v=parseFloat((txVal||"").replace(",","."));if(!isNaN(v)&&v>0)upd("dinheiro",v);setTxVal("");}}
                style={{background:"transparent",border:`1px solid ${C.border}`,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",fontSize:10,padding:"5px 12px",cursor:"pointer",letterSpacing:1}}>
                = Definir
              </button>
            </div>
            {/* Histórico */}
            {historico.length>0&&(
              <div style={{maxHeight:130,overflowY:"auto"}}>
                <div style={{fontSize:11,letterSpacing:2,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",marginBottom:6}}>HISTÓRICO RECENTE</div>
                {historico.slice(0,12).map(h=>(
                  <div key={h.id} style={{display:"flex",gap:10,fontSize:11,fontFamily:"'Inter',system-ui,sans-serif",padding:"2px 0",borderBottom:`1px solid ${C.bg3}`,color:h.tipo==="receita"?C.silver:C.red}}>
                    <span style={{flexShrink:0}}>{h.tipo==="receita"?"+":"−"}R${h.val}</span>
                    <span style={{color:C.grayDark,flex:1}}>{h.desc}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══ CAPACIDADE POR COMPARTIMENTO ═════════════════════════════════════ */}
      <div style={{display:"flex",gap:8,marginTop:12,flexWrap:"wrap"}}>
        {COMPARTIMENTOS.map(comp=>{
          const usado  = espacosPor(comp.id);
          const limite = comp.limite;
          const pct    = limite===0?0:Math.min(100,(usado/limite)*100);
          const cor    = espacoCor(usado,limite);
          const count  = invPorComp[comp.id]?.length||0;
          return (
            <div key={comp.id} style={{flex:"1 1 160px",border:`1px solid ${C.border}`,background:C.bg2,padding:"10px 14px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                <span style={{fontSize:11,letterSpacing:2,color:C.silverDim,fontFamily:"'Inter',system-ui,sans-serif",textTransform:"uppercase"}}>{comp.icon} {comp.label}</span>
                <span style={{fontSize:11,color:cor,fontFamily:"'Inter',system-ui,sans-serif"}}>
                  {limite===0?"∞":`${usado%1===0?usado:usado.toFixed(1)}/${limite}`}
                </span>
              </div>
              {limite>0&&(
                <div style={{height:3,background:C.bg3}}>
                  <div style={{height:"100%",width:`${pct}%`,background:cor,transition:"width 0.3s"}}/>
                </div>
              )}
              <div style={{fontSize:9,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",marginTop:4}}>{count} item{count!==1?"s":""}</div>
            </div>
          );
        })}
      </div>

      {/* ══ REGRAS RÁPIDAS DE ESPAÇO ═════════════════════════════════════════ */}
      <div style={{marginTop:8,padding:"8px 12px",background:C.bg2,border:`1px solid ${C.border}`,fontSize:10,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",lineHeight:2}}>
        <span style={{color:C.silverDim}}>Regras de peso: </span>
        Mochila = 10 esp. · Montaria+Bolsa = +10 esp. · Carroça = +30 esp. · Carro = +20 esp.
        <span style={{color:C.border2}}> | </span>Roupas vestidas: 0 esp. · Coldre/bainha/bandoleira: 0 esp. · Items diminutos (moedas, botões): 0 esp.
        <span style={{color:C.border2}}> | </span>Máx. 4 armas (coldre/bainha): pegar arma extra em combate custa 2 Ações.
      </div>

      {/* ══ BOTÃO ADICIONAR ══════════════════════════════════════════════════ */}
      <div style={{display:"flex",gap:8,marginTop:14,marginBottom:4,flexWrap:"wrap",alignItems:"center"}}>
        <button onClick={()=>{setModalOpen(true);setTimeout(()=>buscaRef.current?.focus(),100);}}
          style={{background:"transparent",border:`1px solid ${C.silver}`,color:C.silver,
                  fontFamily:"'Playfair Display',Georgia,serif",fontSize:10,letterSpacing:3,
                  textTransform:"uppercase",padding:"8px 20px",cursor:"pointer",transition:"all 0.15s"}}
          onMouseEnter={e=>e.currentTarget.style.background=C.bg3}
          onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
          + Adicionar do Catálogo
        </button>
        <button onClick={addCustom}
          style={{background:"transparent",border:`1px dashed ${C.border2}`,color:C.grayDark,
                  fontFamily:"'Inter',system-ui,sans-serif",fontSize:10,padding:"8px 16px",cursor:"pointer",letterSpacing:1}}>
          + Item personalizado
        </button>
        {inv.length>0&&(
          <span style={{fontSize:10,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",marginLeft:"auto"}}>
            {inv.length} iten{inv.length!==1?"s":""} no inventário
          </span>
        )}
      </div>

      {/* ══ LISTA DO INVENTÁRIO POR COMPARTIMENTO ════════════════════════════ */}
      {inv.length===0?(
        <div style={{padding:"40px 0",textAlign:"center",color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",fontSize:13,letterSpacing:1}}>
          Inventário vazio. Use os botões acima para adicionar itens.
        </div>
      ):(
        COMPARTIMENTOS.map(comp=>{
          const items = invPorComp[comp.id]||[];
          if(items.length===0) return null;

          // agrupa por categoria dentro do compartimento
          const porCat = items.reduce((acc,it)=>{
            const c = it.cat||"Outros";
            if(!acc[c])acc[c]=[];
            acc[c].push(it);
            return acc;
          },{});

          const usado = espacosPor(comp.id);
          const cor   = espacoCor(usado,comp.limite);

          return (
            <div key={comp.id} style={{marginTop:18}}>
              {/* Cabeçalho do compartimento */}
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8,paddingBottom:6,borderBottom:`1px solid ${C.border}`}}>
                <span style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:11,letterSpacing:4,color:C.silver,textTransform:"uppercase"}}>
                  {comp.icon} {comp.label}
                </span>
                {comp.limite>0&&(
                  <span style={{fontSize:10,color:cor,fontFamily:"'Inter',system-ui,sans-serif"}}>
                    {usado%1===0?usado:usado.toFixed(1)} / {comp.limite} espaços
                  </span>
                )}
                {usado>comp.limite&&comp.limite>0&&(
                  <span style={{fontSize:9,color:C.red,fontFamily:"'Inter',system-ui,sans-serif",letterSpacing:1}}>⚠ EXCEDIDO</span>
                )}
              </div>

              {Object.entries(porCat).map(([cat,catItems])=>(
                <div key={cat} style={{marginBottom:14}}>
                  {/* Sub-cabeçalho categoria */}
                  <div style={{fontSize:11,letterSpacing:2,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",textTransform:"uppercase",marginBottom:5,paddingLeft:2}}>
                    {cat}
                  </div>

                  {catItems.map(it=>{
                    const espStr   = espacoLabel(it.espaco);
                    const totalEsp = it.espaco===0?0:it.espaco*(it.qtd||1);
                    const isEditing= editId===it.id;
                    return (
                      <div key={it.id} style={{
                        border:`1px solid ${isEditing?C.silver:C.border}`,
                        background:isEditing?C.bg3:C.bg1,
                        marginBottom:3,transition:"all 0.12s",
                      }}>
                        {/* ── ROW PRINCIPAL ── */}
                        <div style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",flexWrap:"wrap"}}>
                          {/* Qtd */}
                          <div style={{display:"flex",alignItems:"center",gap:3,flexShrink:0}}>
                            <button onClick={()=>updItem(it.id,{qtd:Math.max(1,(it.qtd||1)-1)})} style={{...btnSm,width:17,height:17,fontSize:11}}>−</button>
                            <span style={{width:22,textAlign:"center",fontFamily:"'Inter',system-ui,sans-serif",fontSize:14,color:C.white,flexShrink:0}}>{it.qtd||1}</span>
                            <button onClick={()=>updItem(it.id,{qtd:(it.qtd||1)+1})} style={{...btnSm,width:17,height:17,fontSize:11}}>+</button>
                          </div>

                          {/* Nome */}
                          <div style={{flex:1,minWidth:100,fontFamily:"'Playfair Display',Georgia,serif",fontSize:12,color:C.white,cursor:"pointer"}} onClick={()=>setEditId(isEditing?null:it.id)}>
                            {it.nome||<span style={{color:C.grayDark,fontStyle:"italic"}}>sem nome</span>}
                          </div>

                          {/* Chips mecânicos: dano */}
                          {it.dano&&(
                            <span style={{fontSize:9,background:"#2a0a0a",border:`1px solid ${C.redDim}`,color:C.red,padding:"1px 6px",fontFamily:"'Inter',system-ui,sans-serif",flexShrink:0}}>
                              ⚔ {it.dano}
                            </span>
                          )}
                          {it.balas>0&&(
                            <BalasTracker
                              max={it.balas}
                              atual={it.balasAtuais!=null?it.balasAtuais:it.balas}
                              recarga={it.recarga||""}
                              onChange={v=>updItem(it.id,{balasAtuais:v})}
                            />
                          )}

                          {/* Espaço */}
                          <div style={{textAlign:"right",flexShrink:0,minWidth:54}}>
                            <span style={{fontSize:10,color:it.espaco===0?C.grayDark:C.silverDim,fontFamily:"'Inter',system-ui,sans-serif"}}>
                              {espStr}
                              {it.qtd>1&&it.espaco>0&&(
                                <span style={{color:C.grayDark}}> ×{it.qtd}={totalEsp%1===0?totalEsp:totalEsp.toFixed(1)}</span>
                              )}
                            </span>
                            <span style={{fontSize:10,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",marginLeft:2}}>{it.espaco!==0?" esp.":""}</span>
                          </div>

                          {/* Preço */}
                          <div style={{fontSize:10,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",flexShrink:0,minWidth:68,textAlign:"right"}}>{it.preco||"—"}</div>

                          {/* Toggle editar */}
                          <button onClick={()=>setEditId(isEditing?null:it.id)}
                            style={{background:"transparent",border:"none",color:C.grayDark,cursor:"pointer",fontSize:12,padding:"0 3px",flexShrink:0}}>
                            {isEditing?"▲":"▼"}
                          </button>
                          {/* Remover */}
                          <button onClick={()=>removeItem(it.id)}
                            style={{background:"transparent",border:"none",color:C.redDim,cursor:"pointer",fontSize:12,padding:"0 2px",flexShrink:0}}
                            onMouseEnter={e=>e.currentTarget.style.color=C.red}
                            onMouseLeave={e=>e.currentTarget.style.color=C.redDim}>✕</button>
                        </div>

                        {/* ── OBS SEMPRE VISÍVEL ── */}
                        {!isEditing&&it.obs&&(
                          <div style={{padding:"0 10px 6px 56px",fontSize:10,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",fontStyle:"italic",fontSize:13,lineHeight:1.5}}>
                            {it.obs}
                          </div>
                        )}

                        {/* ── PAINEL EDIÇÃO ── */}
                        {isEditing&&(
                          <div style={{borderTop:`1px solid ${C.border}`,padding:"10px 12px",display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr",gap:12,flexWrap:"wrap"}}>
                            {/* Nome */}
                            <div>
                              <div style={{fontSize:9,color:C.grayDark,letterSpacing:1,fontFamily:"'Inter',system-ui,sans-serif",marginBottom:3}}>NOME</div>
                              <input value={it.nome} onChange={e=>updItem(it.id,{nome:e.target.value})}
                                style={{background:"transparent",border:"none",borderBottom:`1px solid ${C.border}`,color:C.white,fontFamily:"'Inter',system-ui,sans-serif",fontSize:13,width:"100%",outline:"none",padding:"2px 0"}}/>
                            </div>
                            {/* Espaço */}
                            <div>
                              <div style={{fontSize:9,color:C.grayDark,letterSpacing:1,fontFamily:"'Inter',system-ui,sans-serif",marginBottom:3}}>ESPAÇO</div>
                              <select value={it.espaco} onChange={e=>updItem(it.id,{espaco:parseFloat(e.target.value)})}
                                style={{background:C.bg1,border:`1px solid ${C.border}`,color:C.white,fontFamily:"'Inter',system-ui,sans-serif",fontSize:12,padding:"3px 6px",outline:"none",cursor:"pointer",width:"100%"}}>
                                {[0,0.5,1,2,3,4].map(v=><option key={v} value={v}>{v===0?"—":v===0.5?"½":v}</option>)}
                              </select>
                            </div>
                            {/* Preço */}
                            <div>
                              <div style={{fontSize:9,color:C.grayDark,letterSpacing:1,fontFamily:"'Inter',system-ui,sans-serif",marginBottom:3}}>PREÇO</div>
                              <input value={it.preco||""} onChange={e=>updItem(it.id,{preco:e.target.value})} placeholder="R$..."
                                style={{background:"transparent",border:"none",borderBottom:`1px solid ${C.border}`,color:C.white,fontFamily:"'Inter',system-ui,sans-serif",fontSize:12,width:"100%",outline:"none",padding:"2px 0"}}/>
                            </div>
                            {/* Compartimento */}
                            <div>
                              <div style={{fontSize:9,color:C.grayDark,letterSpacing:1,fontFamily:"'Inter',system-ui,sans-serif",marginBottom:3}}>LOCAL</div>
                              <select value={it.compartimento||"mochila"} onChange={e=>updItem(it.id,{compartimento:e.target.value})}
                                style={{background:C.bg1,border:`1px solid ${C.border}`,color:C.white,fontFamily:"'Inter',system-ui,sans-serif",fontSize:12,padding:"3px 6px",outline:"none",cursor:"pointer",width:"100%"}}>
                                {COMPARTIMENTOS.map(c=><option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                              </select>
                            </div>
                            {/* Notas — full width */}
                            <div style={{gridColumn:"1/-1"}}>
                              <div style={{fontSize:9,color:C.grayDark,letterSpacing:1,fontFamily:"'Inter',system-ui,sans-serif",marginBottom:3}}>NOTAS / EFEITOS MECÂNICOS</div>
                              <input value={it.obs||""} onChange={e=>updItem(it.id,{obs:e.target.value})} placeholder="Observações, regras especiais..."
                                style={{background:"transparent",border:"none",borderBottom:`1px solid ${C.border}`,color:C.white,fontFamily:"'Inter',system-ui,sans-serif",fontSize:12,width:"100%",outline:"none",padding:"2px 0"}}/>
                            </div>
                            {/* Dano / balas / categoria */}
                            <div>
                              <div style={{fontSize:9,color:C.grayDark,letterSpacing:1,fontFamily:"'Inter',system-ui,sans-serif",marginBottom:3}}>DANO</div>
                              <input value={it.dano||""} onChange={e=>updItem(it.id,{dano:e.target.value})} placeholder="ex: 1●"
                                style={{background:"transparent",border:"none",borderBottom:`1px solid ${C.border}`,color:C.white,fontFamily:"'Inter',system-ui,sans-serif",fontSize:12,width:"100%",outline:"none",padding:"2px 0"}}/>
                            </div>
                            <div>
                              <div style={{fontSize:9,color:C.grayDark,letterSpacing:1,fontFamily:"'Inter',system-ui,sans-serif",marginBottom:3}}>BALAS</div>
                              <input value={it.balas||""} onChange={e=>updItem(it.id,{balas:parseInt(e.target.value)||0})} placeholder="0"
                                style={{background:"transparent",border:"none",borderBottom:`1px solid ${C.border}`,color:C.white,fontFamily:"'Inter',system-ui,sans-serif",fontSize:12,width:"100%",outline:"none",padding:"2px 0"}}/>
                            </div>
                            <div>
                              <div style={{fontSize:9,color:C.grayDark,letterSpacing:1,fontFamily:"'Inter',system-ui,sans-serif",marginBottom:3}}>RECARGA</div>
                              <input value={it.recarga||""} onChange={e=>updItem(it.id,{recarga:e.target.value})} placeholder="ex: 2 ações"
                                style={{background:"transparent",border:"none",borderBottom:`1px solid ${C.border}`,color:C.white,fontFamily:"'Inter',system-ui,sans-serif",fontSize:12,width:"100%",outline:"none",padding:"2px 0"}}/>
                            </div>
                            <div>
                              <div style={{fontSize:9,color:C.grayDark,letterSpacing:1,fontFamily:"'Inter',system-ui,sans-serif",marginBottom:3}}>CATEGORIA</div>
                              <select value={it.cat||"Outros"} onChange={e=>updItem(it.id,{cat:e.target.value})}
                                style={{background:C.bg1,border:`1px solid ${C.border}`,color:C.white,fontFamily:"'Inter',system-ui,sans-serif",fontSize:11,padding:"3px 5px",outline:"none",cursor:"pointer",width:"100%"}}>
                                {[...CAT_KEYS,"Outros"].map(c=><option key={c} value={c}>{c}</option>)}
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          );
        })
      )}

      {/* ══ MODAL CATÁLOGO ═══════════════════════════════════════════════════ */}
      {modalOpen&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.95)",zIndex:1000,
                     display:"flex",alignItems:"flex-start",justifyContent:"center",
                     padding:"20px 12px",overflowY:"auto"}}>
          <div style={{background:C.bg1,border:`1px solid ${C.border2}`,width:"100%",maxWidth:860,
                       maxHeight:"92vh",display:"flex",flexDirection:"column"}}>

            {/* ── Cabeçalho modal ── */}
            <div style={{padding:"16px 20px",borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                <div>
                  <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:13,letterSpacing:4,color:C.silver,textTransform:"uppercase"}}>
                    Catálogo de Equipamento
                  </div>
                  <div style={{fontSize:9,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",marginTop:2,letterSpacing:1}}>
                    Clique em um item para adicioná-lo · Escolha o compartimento abaixo
                  </div>
                </div>
                <button onClick={()=>setModalOpen(false)}
                  style={{background:"transparent",border:`1px solid ${C.border}`,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",fontSize:12,padding:"5px 12px",cursor:"pointer"}}>
                  ✕
                </button>
              </div>

              {/* Busca */}
              <input ref={buscaRef} value={busca} onChange={e=>setBusca(e.target.value)}
                placeholder="Buscar item no catálogo..."
                style={{background:C.bg3,border:`1px solid ${C.border2}`,color:C.white,
                        fontFamily:"'Inter',system-ui,sans-serif",fontSize:13,padding:"7px 12px",width:"100%",
                        outline:"none",boxSizing:"border-box"}}/>

              {/* Selector compartimento destino */}
              <div style={{display:"flex",gap:6,marginTop:10,alignItems:"center"}}>
                <span style={{fontSize:9,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",letterSpacing:1,flexShrink:0}}>ADICIONAR EM:</span>
                {COMPARTIMENTOS.map(c=>(
                  <button key={c.id} onClick={()=>setCompAtivo(c.id)} style={{
                    background:compAtivo===c.id?C.bg3:"transparent",
                    border:`1px solid ${compAtivo===c.id?C.silver:C.border}`,
                    color:compAtivo===c.id?C.white:C.grayDark,
                    fontFamily:"'Inter',system-ui,sans-serif",fontSize:10,padding:"4px 10px",cursor:"pointer",letterSpacing:1,
                  }}>{c.icon} {c.label}</button>
                ))}
              </div>
            </div>

            {/* ── Corpo do modal: sidebar + lista ── */}
            <div style={{display:"flex",flex:1,overflow:"hidden",minHeight:0}}>

              {/* Sidebar categorias */}
              {!busca.trim()&&(
                <div style={{width:178,flexShrink:0,borderRight:`1px solid ${C.border}`,overflowY:"auto",padding:"6px 0"}}>
                  {CAT_KEYS.map(cat=>{
                    const ativo = catAtiva===cat;
                    return (
                      <button key={cat} onClick={()=>setCatAtiva(cat)} style={{
                        display:"block",width:"100%",textAlign:"left",
                        background:ativo?C.bg3:"transparent",
                        border:"none",borderLeft:`2px solid ${ativo?C.silver:"transparent"}`,
                        color:ativo?C.white:C.grayDark,
                        fontFamily:"'Inter',system-ui,sans-serif",fontSize:11,padding:"8px 12px",cursor:"pointer",transition:"all 0.1s",
                      }}>
                        {cat}
                        <span style={{float:"right",fontSize:9,color:C.grayDark}}>{CATALOGO[cat].length}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Lista de itens */}
              <div style={{flex:1,overflowY:"auto",padding:"0 0 8px"}}>
                {/* Header tabela */}
                <div style={{display:"grid",gridTemplateColumns:"1fr 90px 48px 1fr 70px",gap:6,
                             padding:"8px 14px",borderBottom:`1px solid ${C.border}`,
                             position:"sticky",top:0,background:C.bg2,zIndex:1}}>
                  {["ITEM","PREÇO","ESP.","MECÂNICA / NOTAS",""].map((h,i)=>(
                    <span key={i} style={{fontSize:10,letterSpacing:2,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif"}}>{h}</span>
                  ))}
                </div>

                {itemsFiltrados.length===0?(
                  <div style={{padding:"30px",textAlign:"center",color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",fontSize:12}}>
                    Nenhum item encontrado.
                  </div>
                ):(
                  itemsFiltrados.map((it,i)=>(
                    <div key={it.nome+i} onClick={()=>addItem(it)} style={{
                      display:"grid",gridTemplateColumns:"1fr 90px 48px 1fr 70px",gap:6,
                      padding:"8px 14px",cursor:"pointer",
                      background:i%2===0?C.bg2:"transparent",
                      borderBottom:`1px solid ${C.bg3}`,
                      transition:"all 0.1s",
                    }}
                      onMouseEnter={e=>{e.currentTarget.style.background=C.bg3;e.currentTarget.style.borderColor=C.silverFaint;}}
                      onMouseLeave={e=>{e.currentTarget.style.background=i%2===0?C.bg2:"transparent";e.currentTarget.style.borderColor=C.bg3;}}>
                      <div>
                        <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:14,color:C.white}}>{it.nome}</div>
                        {it._cat&&busca.trim()&&<div style={{fontSize:9,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",marginTop:1}}>{it._cat}</div>}
                      </div>
                      <span style={{fontFamily:"'Inter',system-ui,sans-serif",fontSize:11,color:C.silverDim,alignSelf:"center"}}>{it.preco}</span>
                      <span style={{fontFamily:"'Inter',system-ui,sans-serif",fontSize:12,color:it.espaco===0?C.grayDark:C.silver,textAlign:"center",alignSelf:"center"}}>
                        {espacoLabel(it.espaco)}
                      </span>
                      <div style={{alignSelf:"center"}}>
                        {it.dano&&<span style={{fontSize:9,color:C.red,fontFamily:"'Inter',system-ui,sans-serif",marginRight:6}}>⚔ {it.dano}</span>}
                        {it.balas>0&&<span style={{fontSize:9,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",marginRight:6}}>{it.balas}bal · {it.recarga}</span>}
                        <span style={{fontSize:10,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",lineHeight:1.4}}>{it.obs}</span>
                      </div>
                      <button style={{background:"transparent",border:`1px solid ${C.silverFaint}`,color:C.silverDim,
                                     fontFamily:"'Inter',system-ui,sans-serif",fontSize:9,padding:"3px 8px",cursor:"pointer",alignSelf:"center"}}>
                        + Add
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* ── Footer status ── */}
            <div style={{padding:"9px 20px",borderTop:`1px solid ${C.border}`,display:"flex",gap:20,alignItems:"center",flexShrink:0,flexWrap:"wrap"}}>
              {COMPARTIMENTOS.filter(c=>c.limite>0).map(c=>{
                const u=espacosPor(c.id);
                const cor=espacoCor(u,c.limite);
                return (
                  <span key={c.id} style={{fontFamily:"'Inter',system-ui,sans-serif",fontSize:11,color:cor}}>
                    {c.icon} {c.label}: {u%1===0?u:u.toFixed(1)}/{c.limite}
                  </span>
                );
              })}
              <span style={{fontSize:10,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",marginLeft:"auto"}}>
                Adicionando em: <strong style={{color:C.silver}}>{COMPARTIMENTOS.find(c=>c.id===compAtivo)?.icon} {COMPARTIMENTOS.find(c=>c.id===compAtivo)?.label}</strong>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// ─── CHAR SHEET ──────────────────────────────────────────────────────────────
const TABS=["Identidade","Atributos","Habilidades","Honra & Redenção","Equipamento","Companheiro","Notas"];


// ═══════════════════════════════════════════════════════════════════════════════
// ─── ANTECEDENTE GRID (com cadeado) ──────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

const TAPIRATY = "TAPIRATY";
const GIBIL = "GIBIL";

function LockModal({ antecedente, onConfirm, onCancel }) {
  const [input, setInput] = useState("");
  const ok = input.trim().toUpperCase() === TAPIRATY;
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",zIndex:3000,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{background:C.bg2,border:`1px solid ${C.border2}`,maxWidth:480,width:"100%",padding:"28px 28px"}}>
        <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:16,color:C.white,marginBottom:8}}>
          🔒 Trancar Antecedente: {antecedente}
        </div>
        <div style={{fontFamily:"'Inter',system-ui,sans-serif",fontSize:12,color:C.gray,lineHeight:1.9,marginBottom:16}}>
          Tem certeza que deseja <strong style={{color:C.white}}>bloquear permanentemente</strong> o antecedente <strong style={{color:C.silver}}>{antecedente}</strong>?
          <br/>
          <span style={{color:C.red,fontWeight:"bold"}}>Atenção: essa operação é permanente e irreversível!</span>
          <br/>
          Para desbloquear depois, será necessária uma senha especial que apenas o Juiz possui.
        </div>
        <div style={{fontFamily:"'Inter',system-ui,sans-serif",fontSize:11,color:C.grayDark,letterSpacing:2,marginBottom:8,textTransform:"uppercase"}}>
          Para confirmar, digite <strong style={{color:C.silver}}>TAPIRATY</strong> abaixo:
        </div>
        <input
          value={input} onChange={e=>setInput(e.target.value)} autoFocus
          placeholder="TAPIRATY"
          style={{width:"100%",background:C.bg3,border:`1px solid ${ok?C.silver:C.border2}`,color:C.white,
            fontFamily:"'Inter',system-ui,sans-serif",fontSize:14,letterSpacing:3,padding:"8px 12px",
            outline:"none",boxSizing:"border-box",marginBottom:16,textTransform:"uppercase"}}
        />
        <div style={{display:"flex",gap:10}}>
          <button
            onClick={()=>{ if(ok) onConfirm(); }}
            disabled={!ok}
            style={{background:ok?"#3a1a00":"transparent",border:`1px solid ${ok?C.red:C.border}`,
              color:ok?C.red:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",fontSize:10,
              letterSpacing:2,textTransform:"uppercase",padding:"8px 20px",cursor:ok?"pointer":"not-allowed"}}>
            🔒 Trancar
          </button>
          <button onClick={onCancel} style={{background:"transparent",border:`1px solid ${C.border}`,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",fontSize:10,letterSpacing:2,textTransform:"uppercase",padding:"8px 16px",cursor:"pointer"}}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

function UnlockModal({ antecedente, onConfirm, onCancel }) {
  const [input, setInput] = useState("");
  const ok = input.trim().toUpperCase() === GIBIL;
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",zIndex:3000,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{background:C.bg2,border:`1px solid ${C.border2}`,maxWidth:400,width:"100%",padding:"28px 28px"}}>
        <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:16,color:C.white,marginBottom:8}}>
          🗝 Desbloquear: {antecedente}
        </div>
        <div style={{fontFamily:"'Inter',system-ui,sans-serif",fontSize:11,color:C.grayDark,letterSpacing:2,marginBottom:8,textTransform:"uppercase"}}>
          Senha do Juiz:
        </div>
        <input
          value={input} onChange={e=>setInput(e.target.value)} autoFocus
          type="password" placeholder="••••••"
          style={{width:"100%",background:C.bg3,border:`1px solid ${ok?C.silver:C.border2}`,color:C.white,
            fontFamily:"'Inter',system-ui,sans-serif",fontSize:18,padding:"8px 12px",
            outline:"none",boxSizing:"border-box",marginBottom:16,letterSpacing:4}}
        />
        <div style={{display:"flex",gap:10}}>
          <button onClick={()=>{ if(ok) onConfirm(); }} disabled={!ok}
            style={{background:ok?C.bg3:"transparent",border:`1px solid ${ok?C.silver:C.border}`,color:ok?C.silver:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",fontSize:10,letterSpacing:2,textTransform:"uppercase",padding:"8px 20px",cursor:ok?"pointer":"not-allowed"}}>
            🗝 Desbloquear
          </button>
          <button onClick={onCancel} style={{background:"transparent",border:`1px solid ${C.border}`,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",fontSize:10,letterSpacing:2,textTransform:"uppercase",padding:"8px 16px",cursor:"pointer"}}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

function AntecedenteGrid({ char, upd, updAnte }) {
  const [lockTarget, setLockTarget] = useState(null);   // antecedente name to lock
  const [unlockTarget, setUnlockTarget] = useState(null); // antecedente name to unlock
  const locked = char.antecedentesLocked || {};

  return (
    <>
      {lockTarget && (
        <LockModal
          antecedente={lockTarget}
          onConfirm={() => {
            upd("antecedentesLocked", { ...locked, [lockTarget]: true });
            setLockTarget(null);
          }}
          onCancel={() => setLockTarget(null)}
        />
      )}
      {unlockTarget && (
        <UnlockModal
          antecedente={unlockTarget}
          onConfirm={() => {
            const next = { ...locked };
            delete next[unlockTarget];
            upd("antecedentesLocked", next);
            setUnlockTarget(null);
          }}
          onCancel={() => setUnlockTarget(null)}
        />
      )}

      <div style={{display:"flex",flexWrap:"wrap",gap:12}}>
        {ANTECEDENTES.map(a => {
          const val = char.antecedentes[a];
          const isLocked = !!locked[a];

          return (
            <div key={a} style={{
              width:168, padding:"12px 14px",
              border:`1px solid ${isLocked ? "#3a2a00" : C.border}`,
              background: isLocked ? "#0d0900" : C.bg2,
              position:"relative", overflow:"hidden",
              transition:"all 0.2s",
            }}>
              {/* Correntes decorativas quando travado */}
              {isLocked && (
                <div style={{position:"absolute",inset:0,pointerEvents:"none",opacity:0.12,
                  backgroundImage:"repeating-linear-gradient(45deg,#8b6914 0,#8b6914 2px,transparent 0,transparent 50%)",
                  backgroundSize:"12px 12px"}}/>
              )}

              {/* Header: nome + cadeado */}
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:3}}>
                <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:13,color:isLocked?"#8b6914":C.white}}>
                  {isLocked ? "🐄 " : ""}{a}
                </div>
                <button
                  onClick={() => isLocked ? setUnlockTarget(a) : setLockTarget(a)}
                  title={isLocked ? "Desbloquear (senha do Juiz)" : "Trancar antecedente"}
                  style={{background:"transparent",border:"none",cursor:"pointer",fontSize:14,padding:"0 0 0 4px",
                    color:isLocked?"#c09040":C.grayDark,lineHeight:1,
                    transition:"color 0.15s",
                  }}
                  onMouseEnter={e=>e.currentTarget.style.color=isLocked?"#e0b050":C.silver}
                  onMouseLeave={e=>e.currentTarget.style.color=isLocked?"#c09040":C.grayDark}
                >
                  {isLocked ? "⛓️" : "🔓"}
                </button>
              </div>

              <div style={{fontSize:10,color:isLocked?"#5a4a20":C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",marginBottom:10,lineHeight:1.4,minHeight:28}}>
                {ANTECEDENTES_DESC[a]}
              </div>

              {/* Dots — desabilitados se travado */}
              <div style={{display:"flex",gap:5,flexWrap:"wrap",opacity:isLocked?0.4:1}}>
                {[1,2,3,4,5,6].map(n=>(
                  <Dot key={n} filled={val>=n} size={15} onClick={()=>{ if(!isLocked) updAnte(a,val===n?n-1:n); }}/>
                ))}
              </div>
              <div style={{fontSize:10,color:isLocked?"#5a4a20":C.silverDim,fontFamily:"'Inter',system-ui,sans-serif",marginTop:6,display:"flex",alignItems:"center",gap:6}}>
                <span>{val}/6</span>
                {isLocked && <span style={{fontSize:9,letterSpacing:1,color:"#8b6914",textTransform:"uppercase"}}>trancado</span>}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── NOTAS TAB ────────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

const NOTE_COLORS = [
  { id:"default", bg:"#111111", border:"#2a2a2a", label:"" },
  { id:"blood",   bg:"#1a0505", border:"#5a1515", label:"" },
  { id:"gold",    bg:"#120e00", border:"#5a4010", label:"" },
  { id:"green",   bg:"#051208", border:"#1a4520", label:"" },
  { id:"blue",    bg:"#050a18", border:"#152055", label:"" },
  { id:"purple",  bg:"#0d0515", border:"#3a1555", label:"" },
];

const getNoteStyle = (colorId) => NOTE_COLORS.find(c=>c.id===colorId) || NOTE_COLORS[0];

function NotaCard({ nota, allNotas, onUpdate, onDelete, onConnect, connectMode, isConnectSource }) {
  const [expanded, setExpanded] = useState(false);
  const [imgPreview, setImgPreview] = useState(null);
  const fileRef = useRef();
  const pdfRef = useRef();
  const cs = getNoteStyle(nota.color);

  const upd = (patch) => onUpdate({ ...nota, ...patch });

  const handleImg = (e) => {
    const f = e.target.files[0]; if(!f) return;
    const r = new FileReader();
    r.onload = ev => upd({ images: [...(nota.images||[]), { data: ev.target.result, nome: f.name }] });
    r.readAsDataURL(f);
  };

  const handlePdf = (e) => {
    const f = e.target.files[0]; if(!f) return;
    const r = new FileReader();
    r.onload = ev => upd({ pdfs: [...(nota.pdfs||[]), { data: ev.target.result, nome: f.name }] });
    r.readAsDataURL(f);
  };

  const removeImg = (i) => upd({ images: (nota.images||[]).filter((_,j)=>j!==i) });
  const removePdf = (i) => upd({ pdfs: (nota.pdfs||[]).filter((_,j)=>j!==i) });

  const connections = nota.connections || [];
  const connectedNotas = allNotas.filter(n => connections.includes(n.id) && n.id !== nota.id);

  return (
    <div style={{
      border:`1.5px solid ${isConnectSource?"#c09040":cs.border}`,
      background: cs.bg,
      marginBottom:10,
      transition:"all 0.15s",
      boxShadow: isConnectSource ? `0 0 12px #c0904040` : "none",
    }}>
      {/* ── Header ── */}
      <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",borderBottom:`1px solid ${cs.border}`}}>
        {/* Título */}
        <input
          value={nota.titulo || ""}
          onChange={e => upd({ titulo: e.target.value })}
          placeholder="Título da nota..."
          style={{flex:1,background:"transparent",border:"none",color:nota.fechada?"#555":C.white,
            fontFamily:"'Playfair Display',Georgia,serif",fontSize:14,outline:"none",
            textDecoration:nota.fechada?"line-through":"none"}}
        />
        {/* Conexões badge */}
        {connections.length > 0 && (
          <span style={{fontSize:9,color:"#c09040",fontFamily:"'Inter',system-ui,sans-serif",letterSpacing:1}}>
            ⬡ {connections.length}
          </span>
        )}
        {/* Controles */}
        <div style={{display:"flex",gap:3,flexShrink:0}}>
          {/* Cor */}
          {NOTE_COLORS.map(nc=>(
            <div key={nc.id} onClick={()=>upd({color:nc.id})} style={{
              width:10,height:10,borderRadius:"50%",background:nc.border,cursor:"pointer",
              border:nota.color===nc.id?`1.5px solid ${C.silver}`:`1px solid ${nc.border}`,
              flexShrink:0,
            }}/>
          ))}
          {/* Fechar/abrir */}
          <button onClick={()=>upd({fechada:!nota.fechada})} title={nota.fechada?"Reabrir nota":"Fechar nota"}
            style={{background:"transparent",border:"none",cursor:"pointer",fontSize:11,color:nota.fechada?"#c09040":C.grayDark,padding:"0 2px"}}>
            {nota.fechada?"🔓":"🔒"}
          </button>
          {/* Conectar */}
          <button onClick={()=>onConnect(nota.id)} title="Conectar a outra nota"
            style={{background:"transparent",border:"none",cursor:"pointer",fontSize:11,
              color:isConnectSource?"#c09040":connectMode?C.silver:C.grayDark,padding:"0 2px"}}>
            ⬡
          </button>
          {/* Expandir */}
          <button onClick={()=>setExpanded(e=>!e)}
            style={{background:"transparent",border:"none",cursor:"pointer",fontSize:11,color:C.grayDark,padding:"0 2px"}}>
            {expanded?"▲":"▼"}
          </button>
          {/* Deletar */}
          <button onClick={onDelete}
            style={{background:"transparent",border:"none",cursor:"pointer",fontSize:11,color:C.redDim,padding:"0 2px"}}
            onMouseEnter={e=>e.currentTarget.style.color=C.red}
            onMouseLeave={e=>e.currentTarget.style.color=C.redDim}>
            ✕
          </button>
        </div>
      </div>

      {/* ── Corpo (se não fechada ou se expandida) ── */}
      {(!nota.fechada || expanded) && (
        <div style={{padding:"10px 12px"}}>
          {/* Texto principal */}
          <textarea
            value={nota.texto || ""}
            onChange={e => upd({ texto: e.target.value })}
            placeholder="Escreva suas anotações, pistas, suspeitas..."
            disabled={nota.fechada}
            rows={3}
            style={{width:"100%",background:"transparent",border:"none",
              color:nota.fechada?"#555":C.gray,fontFamily:"'Crimson Text',Georgia,serif",
              fontSize:14,lineHeight:1.8,outline:"none",resize:"vertical",
              boxSizing:"border-box",padding:0,
              fontStyle:nota.fechada?"italic":"normal"}}
          />

          {/* Imagens anexadas */}
          {(nota.images||[]).length > 0 && (
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:8}}>
              {nota.images.map((img,i)=>(
                <div key={i} style={{position:"relative",cursor:"pointer"}} onClick={()=>setImgPreview(img.data)}>
                  <img src={img.data} alt={img.nome} style={{width:60,height:60,objectFit:"cover",border:`1px solid ${cs.border}`}}/>
                  {!nota.fechada && (
                    <button onClick={e=>{e.stopPropagation();removeImg(i);}} style={{position:"absolute",top:-4,right:-4,background:C.bg,border:`1px solid ${C.border}`,color:C.red,fontSize:9,width:14,height:14,cursor:"pointer",padding:0,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* PDFs anexados */}
          {(nota.pdfs||[]).length > 0 && (
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:6}}>
              {nota.pdfs.map((pdf,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:6,padding:"4px 8px",border:`1px solid ${cs.border}`,background:C.bg3}}>
                  <span style={{fontSize:10,color:C.silver,fontFamily:"'Inter',system-ui,sans-serif"}}>📄 {pdf.nome.slice(0,20)}{pdf.nome.length>20?"…":""}</span>
                  <a href={pdf.data} download={pdf.nome} style={{fontSize:9,color:"#5090c0",textDecoration:"none",letterSpacing:1}}>↓</a>
                  {!nota.fechada && (
                    <button onClick={()=>removePdf(i)} style={{background:"transparent",border:"none",color:C.redDim,cursor:"pointer",fontSize:10,padding:0}}>✕</button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Conexões */}
          {connectedNotas.length > 0 && (
            <div style={{marginTop:8,display:"flex",gap:4,flexWrap:"wrap"}}>
              {connectedNotas.map(cn=>(
                <div key={cn.id} style={{display:"flex",alignItems:"center",gap:4,padding:"2px 8px",border:`1px solid ${getNoteStyle(cn.color).border}`,background:getNoteStyle(cn.color).bg}}>
                  <span style={{fontSize:9,color:"#c09040"}}>⬡</span>
                  <span style={{fontSize:10,color:C.gray,fontFamily:"'Inter',system-ui,sans-serif"}}>{cn.titulo||"Sem título"}</span>
                  <button onClick={()=>upd({connections:connections.filter(id=>id!==cn.id)})}
                    style={{background:"transparent",border:"none",color:C.grayDark,cursor:"pointer",fontSize:9,padding:0}}>✕</button>
                </div>
              ))}
            </div>
          )}

          {/* Botões de ação (só se não fechada) */}
          {!nota.fechada && (
            <div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}}>
              <button onClick={()=>fileRef.current.click()} style={{background:"transparent",border:`1px solid ${C.border}`,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",fontSize:9,padding:"3px 9px",cursor:"pointer",letterSpacing:1}}>
                🖼 Imagem
              </button>
              <button onClick={()=>pdfRef.current.click()} style={{background:"transparent",border:`1px solid ${C.border}`,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",fontSize:9,padding:"3px 9px",cursor:"pointer",letterSpacing:1}}>
                📄 PDF
              </button>
              <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleImg}/>
              <input ref={pdfRef} type="file" accept=".pdf" style={{display:"none"}} onChange={handlePdf}/>
            </div>
          )}
        </div>
      )}

      {/* Preview de imagem em modal */}
      {imgPreview && (
        <div onClick={()=>setImgPreview(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.95)",zIndex:4000,display:"flex",alignItems:"center",justifyContent:"center",cursor:"zoom-out"}}>
          <img src={imgPreview} style={{maxWidth:"90vw",maxHeight:"90vh",objectFit:"contain"}}/>
        </div>
      )}
    </div>
  );
}

function NotasTab({ char, upd }) {
  const [connectSource, setConnectSource] = useState(null); // id da nota sendo conectada
  const [filter, setFilter] = useState("all"); // all | open | closed
  const notas = char.notasCards || [];

  const addNota = () => {
    const nova = {
      id: Date.now() + Math.random(),
      titulo: "",
      texto: "",
      color: "default",
      fechada: false,
      images: [],
      pdfs: [],
      connections: [],
      criadaEm: Date.now(),
    };
    upd("notasCards", [nova, ...notas]);
  };

  const updateNota = (updated) => {
    upd("notasCards", notas.map(n => n.id === updated.id ? updated : n));
  };

  const deleteNota = (id) => {
    // Remove também conexões apontando para ela
    const sem = notas.filter(n => n.id !== id);
    const limpo = sem.map(n => ({
      ...n,
      connections: (n.connections||[]).filter(cid => cid !== id),
    }));
    upd("notasCards", limpo);
  };

  const handleConnect = (sourceId) => {
    if (!connectSource) {
      setConnectSource(sourceId);
      return;
    }
    if (connectSource === sourceId) {
      setConnectSource(null);
      return;
    }
    // Criar conexão bidirecional
    const updated = notas.map(n => {
      if (n.id === connectSource) {
        const conns = n.connections || [];
        return { ...n, connections: conns.includes(sourceId) ? conns : [...conns, sourceId] };
      }
      if (n.id === sourceId) {
        const conns = n.connections || [];
        return { ...n, connections: conns.includes(connectSource) ? conns : [...conns, connectSource] };
      }
      return n;
    });
    upd("notasCards", updated);
    setConnectSource(null);
  };

  const filtered = filter === "all" ? notas
    : filter === "open" ? notas.filter(n => !n.fechada)
    : notas.filter(n => n.fechada);

  const openCount = notas.filter(n => !n.fechada).length;
  const closedCount = notas.filter(n => n.fechada).length;

  return (
    <div>
      {/* Header de notas */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:10}}>
        <div style={{display:"flex",gap:4}}>
          {[["all","Todas",notas.length],["open","Abertas",openCount],["closed","Fechadas",closedCount]].map(([v,lbl,cnt])=>(
            <button key={v} onClick={()=>setFilter(v)} style={{
              background:"transparent",border:`1px solid ${filter===v?C.silver:C.border}`,
              color:filter===v?C.white:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",
              fontSize:9,padding:"4px 10px",cursor:"pointer",letterSpacing:1,
            }}>{lbl} {cnt}</button>
          ))}
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          {connectSource && (
            <div style={{fontSize:10,color:"#c09040",fontFamily:"'Inter',system-ui,sans-serif",letterSpacing:1}}>
              ⬡ Clique em outra nota para conectar — ou clique em ⬡ novamente para cancelar
            </div>
          )}
          <button onClick={addNota} style={{background:"transparent",border:`1px solid ${C.silver}`,color:C.silver,fontFamily:"'Playfair Display',Georgia,serif",fontSize:9,letterSpacing:3,textTransform:"uppercase",padding:"6px 16px",cursor:"pointer"}}>
            + Nova Nota
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{textAlign:"center",padding:"60px 0",color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",fontSize:12,letterSpacing:2}}>
          {notas.length === 0 ? "Nenhuma nota ainda. Clique em + Nova Nota para começar." : "Nenhuma nota neste filtro."}
        </div>
      ) : (
        filtered.map(n => (
          <NotaCard
            key={n.id}
            nota={n}
            allNotas={notas}
            onUpdate={updateNota}
            onDelete={() => deleteNota(n.id)}
            onConnect={handleConnect}
            connectMode={!!connectSource}
            isConnectSource={connectSource === n.id}
          />
        ))
      )}

      {/* Mapa de conexões (visualização simples) */}
      {notas.some(n=>(n.connections||[]).length>0) && (
        <div style={{marginTop:20,padding:"12px 14px",border:`1px solid ${C.border}`,background:C.bg2}}>
          <div style={{fontSize:9,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",letterSpacing:3,textTransform:"uppercase",marginBottom:10}}>Mapa de Conexões</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {notas.filter(n=>(n.connections||[]).length>0).map(n=>{
              const cs = getNoteStyle(n.color);
              return (
                <div key={n.id} style={{display:"flex",flexDirection:"column",gap:4,padding:"8px 10px",border:`1px solid ${cs.border}`,background:cs.bg}}>
                  <div style={{fontSize:10,color:C.white,fontFamily:"'Playfair Display',Georgia,serif"}}>{n.titulo||"Sem título"}</div>
                  <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                    {(n.connections||[]).map(cid=>{
                      const tgt = notas.find(x=>x.id===cid);
                      return tgt ? (
                        <div key={cid} style={{fontSize:9,color:"#c09040",fontFamily:"'Inter',system-ui,sans-serif",display:"flex",alignItems:"center",gap:3}}>
                          <span>⬡</span><span style={{color:C.gray}}>{tgt.titulo||"Sem título"}</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
// ─── MINI COMBAT TRACKER (inline na ficha) ───────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

function MiniCombatTracker({ char }) {
  const [combatants, setCombatants] = useState([]);
  const [rodada, setRodada] = useState(1);
  const [activeIdx, setActiveIdx] = useState(0);
  const [log, setLog] = useState([]);
  const [showLog, setShowLog] = useState(false);
  const [npcName, setNpcName] = useState("");
  const [npcNdc, setNpcNdc] = useState(1);
  const [critResult, setCritResult] = useState(null);

  const addLog = (msg) => setLog(prev => [{ id: Date.now(), msg, r: rodada }, ...prev].slice(0, 60));

  // Adicionar o próprio personagem
  const addSelf = () => {
    if (combatants.find(c => c.isSelf)) return;
    const c = {
      id: "self",
      isSelf: true,
      type: "pj",
      nome: char.nome || "Personagem",
      vidaAtual: char.vidaAtual || char.vidaBase || 6,
      vidaBase: char.vidaBase || 6,
      acoes: char.acoes || 1,
      movimentos: char.movimentos || 1,
      defesa: char.defesa || 5,
      circulosDor: (char.circulosDorAtivos || []).length,
      condicoes: char.circulosDorAtivos || [],
      card: null, cardDiscarded: false, card2: null,
      cobertura: 0, incapaz: false, perdeuTurno: false,
      ordem: combatants.length + 1,
    };
    setCombatants(prev => sortMini([...prev, c]));
    addLog(`⚔ ${c.nome} entrou no combate`);
  };

  const addNpc = () => {
    if (!npcName.trim()) return;
    const c = {
      id: Date.now() + Math.random(),
      type: "npc",
      nome: npcName.trim(),
      ndc: npcNdc,
      vidaAtual: npcNdc * 3,
      vidaBase: npcNdc * 3,
      acoes: npcNdc + 1,
      movimentos: 1,
      defesa: 5,
      circulosDor: 0,
      condicoes: [],
      card: null, cardDiscarded: false, card2: null,
      cobertura: 0, incapaz: false, perdeuTurno: false,
      ordem: combatants.length + 1,
    };
    setCombatants(prev => sortMini([...prev, c]));
    addLog(`🎲 ${c.nome} (NdC ${npcNdc}) entrou`);
    setNpcName("");
  };

  const sortMini = (list) => [...list].sort((a, b) => {
    if (a.incapaz && !b.incapaz) return 1;
    if (!a.incapaz && b.incapaz) return -1;
    if (a.cardDiscarded && !b.cardDiscarded) return 1;
    if (!a.cardDiscarded && b.cardDiscarded) return -1;
    const va = a.card ? a.card.value : -1;
    const vb = b.card ? b.card.value : -1;
    if (vb !== va) return vb - va;
    if (a.type === "pj" && b.type === "npc") return 1;
    if (a.type === "npc" && b.type === "pj") return -1;
    return 0;
  }).map((c, i) => ({ ...c, ordem: i + 1 }));

  const updC = (id, patch) => setCombatants(prev => sortMini(prev.map(c => c.id === id ? { ...c, ...patch } : c)));
  const removeC = (id) => setCombatants(prev => sortMini(prev.filter(c => c.id !== id)));

  const drawAll = () => {
    setCombatants(prev => sortMini(prev.map(c => ({ ...c, card: drawCard(), cardDiscarded: false, card2: null }))));
    setActiveIdx(0);
    addLog(`🃏 Rodada ${rodada} — iniciativa puxada`);
  };

  const nextTurn = () => {
    const ativos = combatants.filter(c => !c.incapaz);
    if (!ativos.length) return;
    const cur = ativos.findIndex(c => c.ordem === combatants[activeIdx]?.ordem);
    const nxt = (cur + 1) % ativos.length;
    if (nxt === 0) {
      setRodada(r => r + 1);
      setCombatants(prev => prev.map(c => ({ ...c, perdeuTurno: false })));
      addLog(`━━ Rodada ${rodada + 1} ━━`);
    }
    const globalIdx = combatants.findIndex(c => c.id === ativos[nxt]?.id);
    setActiveIdx(globalIdx >= 0 ? globalIdx : 0);
    addLog(`→ ${ativos[nxt]?.nome}`);
  };

  const rollCrit = (isCrit) => {
    const roll = Math.floor(Math.random() * 6) + 1;
    const critTbl = { 1: "Mortal: +2 Vida de dano", 2: "Desarmar: inimigo perde arma", 3: "Vantagem Tática: +1 Mov", 4: "Dança Maluca: inimigo perde turno", 5: "Vantagem Moral: +1 Violência", 6: "Marca da Vingança: inimigo foge" };
    const failTbl = { 1: "Acertou aliado/inocente", 2: "Guarda aberta: +1 p/ inimigos", 3: "Abatido: perde próximo turno", 4: "Arma quebra / dano anulado", 5: "Pressão: −1 nos ataques", 6: "Caiu — perde 2 ações para levantar" };
    const result = `${isCrit ? "🎯" : "💥"} ${roll}: ${isCrit ? critTbl[roll] : failTbl[roll]}`;
    setCritResult(result);
    addLog(result);
  };

  const rollDeath = () => {
    const roll = Math.floor(Math.random() * 6) + 1;
    const alive = roll === 1 || roll === 6;
    const msg = `☠ Teste de Morte: ${roll} — ${alive ? "SOBREVIVEU (recupera 3 Vida, gaste 1 Mov+1 Ação)" : "MORREU"}`;
    setCritResult(msg);
    addLog(msg);
  };

  const resetCombat = () => {
    setCombatants([]); setRodada(1); setActiveIdx(0); setLog([]); setCritResult(null);
  };

  const activeC = combatants[activeIdx];

  return (
    <div style={{ border: `1px solid ${C.border}`, background: C.bg1, marginBottom: 8 }}>
      {/* ── Header ── */}
      <div style={{ borderBottom: `1px solid ${C.border}`, padding: "8px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div>
            <span style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 11, letterSpacing: 3, color: C.silver, textTransform: "uppercase" }}>Tracker</span>
            <span style={{ fontFamily: "'Inter',system-ui,sans-serif", fontSize: 9, color: C.grayDark, letterSpacing: 2, marginLeft: 8 }}>Rodada {rodada}</span>
          </div>
          {activeC && (
            <div style={{ fontSize: 10, color: C.white, fontFamily: "'Inter',system-ui,sans-serif", background: C.bg3, padding: "2px 8px", border: `1px solid ${C.border2}` }}>
              → {activeC.nome}
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          <button onClick={drawAll} disabled={!combatants.length} style={{ ...btnSm, fontSize: 9, width: "auto", padding: "3px 8px", color: C.silver }}>🃏 Puxar Cartas</button>
          <button onClick={nextTurn} disabled={!combatants.length} style={{ ...btnSm, fontSize: 9, width: "auto", padding: "3px 8px" }}>→ Turno</button>
          <button onClick={() => rollCrit(true)} style={{ ...btnSm, fontSize: 9, width: "auto", padding: "3px 8px", color: "#c09040" }}>🎯</button>
          <button onClick={() => rollCrit(false)} style={{ ...btnSm, fontSize: 9, width: "auto", padding: "3px 8px", color: C.red }}>💥</button>
          <button onClick={rollDeath} style={{ ...btnSm, fontSize: 9, width: "auto", padding: "3px 8px", color: C.grayDark }}>☠</button>
          <button onClick={() => setShowLog(s => !s)} style={{ ...btnSm, fontSize: 9, width: "auto", padding: "3px 8px" }}>📜</button>
          <button onClick={resetCombat} style={{ ...btnSm, fontSize: 9, width: "auto", padding: "3px 8px", color: C.redDim }}>✕ Reset</button>
        </div>
      </div>

      {/* ── Resultado de crítico ── */}
      {critResult && (
        <div style={{ padding: "6px 12px", background: "#0d0800", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: "'Inter',system-ui,sans-serif", fontSize: 11, color: C.white }}>{critResult}</span>
          <button onClick={() => setCritResult(null)} style={{ background: "transparent", border: "none", color: C.grayDark, cursor: "pointer", fontSize: 12 }}>✕</button>
        </div>
      )}

      {/* ── Combatentes ── */}
      <div>
        {combatants.length === 0 ? (
          <div style={{ padding: "16px 12px", color: C.grayDark, fontFamily: "'Inter',system-ui,sans-serif", fontSize: 11, textAlign: "center" }}>
            Nenhum combatente. Adicione abaixo.
          </div>
        ) : (
          combatants.map((c, i) => {
            const isActive = i === activeIdx;
            const hasBonus = c.card && ["A", "K", "Q", "J"].includes(c.card.rank) && !c.cardDiscarded;
            return (
              <div key={c.id} style={{
                display: "flex", alignItems: "center", gap: 8, padding: "6px 12px",
                borderLeft: `3px solid ${isActive ? C.silver : "transparent"}`,
                background: isActive ? "#ffffff06" : "transparent",
                borderBottom: `1px solid ${C.bg3}`, flexWrap: "wrap",
              }}>
                {/* Ordem */}
                <div style={{ width: 20, height: 20, borderRadius: "50%", border: `1px solid ${isActive ? C.silver : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: isActive ? C.white : C.grayDark, fontFamily: "'Inter',system-ui,sans-serif", flexShrink: 0 }}>{c.ordem}</div>
                {/* Carta */}
                {c.card ? (
                  <CardVisual card={c.card} size="sm" discarded={c.cardDiscarded} />
                ) : (
                  <div style={{ width: 36, height: 50, border: `1px dashed ${C.border}`, borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: C.border2 }}>—</div>
                )}
                {/* Nome */}
                <div style={{ flex: 1, minWidth: 80 }}>
                  <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 12, color: c.incapaz ? C.grayDark : C.white, textDecoration: c.incapaz ? "line-through" : "none" }}>
                    {c.nome}
                    {c.type === "npc" && <span style={{ fontSize: 8, color: C.grayDark, marginLeft: 5, letterSpacing: 1 }}>NdC{c.ndc}</span>}
                  </div>
                  {hasBonus && <div style={{ fontSize: 8, color: "#c09040", fontFamily: "'Inter',system-ui,sans-serif", marginTop: 1 }}>{CARD_SPECIAL_BONUS[c.card.rank]}</div>}
                  {c.perdeuTurno && <div style={{ fontSize: 8, color: "#c07020", fontFamily: "'Inter',system-ui,sans-serif" }}>⚠ perde turno</div>}
                </div>
                {/* Vida */}
                <div style={{ display: "flex", alignItems: "center", gap: 3, flexShrink: 0 }}>
                  <button onClick={() => updC(c.id, { vidaAtual: Math.max(0, c.vidaAtual - 1) })} style={{ ...btnSm, width: 16, height: 16, fontSize: 10 }}>−</button>
                  <span style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 13, color: c.vidaAtual <= 1 ? C.red : C.white, width: 28, textAlign: "center" }}>{c.vidaAtual}/{c.vidaBase}</span>
                  <button onClick={() => updC(c.id, { vidaAtual: Math.min(c.vidaBase, c.vidaAtual + 1) })} style={{ ...btnSm, width: 16, height: 16, fontSize: 10 }}>+</button>
                </div>
                {/* Dor dots */}
                <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
                  {[1, 2, 3, 4, 5, 6].map(n => (
                    <div key={n} onClick={() => updC(c.id, { circulosDor: c.circulosDor === n ? n - 1 : n })}
                      style={{ width: 8, height: 8, borderRadius: "50%", border: `1px solid ${c.circulosDor >= n ? "#c04040" : C.border}`, background: c.circulosDor >= n ? "#c04040" : "transparent", cursor: "pointer" }} />
                  ))}
                </div>
                {/* Ações */}
                <div style={{ display: "flex", gap: 3, flexShrink: 0 }}>
                  <button onClick={() => updC(c.id, { card: drawCard(), cardDiscarded: false })} title="Puxar carta" style={{ ...btnSm, width: 22, height: 22, fontSize: 10 }}>🎴</button>
                  {hasBonus && <button onClick={() => updC(c.id, { cardDiscarded: true })} title="Descartar → fim da iniciativa" style={{ ...btnSm, width: 22, height: 22, fontSize: 10, color: "#c07020" }}>↓</button>}
                  <button onClick={() => updC(c.id, { incapaz: !c.incapaz })} style={{ ...btnSm, width: 22, height: 22, fontSize: 10, color: c.incapaz ? C.red : C.grayDark }}>✕</button>
                  <button onClick={() => removeC(c.id)} style={{ ...btnSm, width: 22, height: 22, fontSize: 10, color: C.border2 }}>🗑</button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Log ── */}
      {showLog && log.length > 0 && (
        <div style={{ borderTop: `1px solid ${C.border}`, maxHeight: 120, overflowY: "auto", background: C.bg2 }}>
          {log.map(e => (
            <div key={e.id} style={{ padding: "3px 12px", fontSize: 10, color: C.grayDark, fontFamily: "'Inter',system-ui,sans-serif", borderBottom: `1px solid ${C.bg3}` }}>
              <span style={{ color: C.border2, marginRight: 5, fontSize: 8 }}>R{e.r}</span>{e.msg}
            </div>
          ))}
        </div>
      )}

      {/* ── Adicionar combatentes ── */}
      <div style={{ borderTop: `1px solid ${C.border}`, padding: "8px 12px", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        {!combatants.find(c => c.isSelf) && (
          <button onClick={addSelf} style={{ background: "transparent", border: `1px solid ${C.silver}`, color: C.silver, fontFamily: "'Inter',system-ui,sans-serif", fontSize: 9, padding: "4px 10px", cursor: "pointer", letterSpacing: 1 }}>
            + {char.nome || "Meu Personagem"}
          </button>
        )}
        <div style={{ display: "flex", gap: 5, alignItems: "center", flex: 1, minWidth: 180 }}>
          <input value={npcName} onChange={e => setNpcName(e.target.value)} onKeyDown={e => e.key === "Enter" && addNpc()} placeholder="Nome do NPC..."
            style={{ flex: 1, background: "transparent", border: "none", borderBottom: `1px solid ${C.border}`, color: C.white, fontFamily: "'Inter',system-ui,sans-serif", fontSize: 11, outline: "none", padding: "2px 0" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <button onClick={() => setNpcNdc(n => Math.max(1, n - 1))} style={{ ...btnSm, width: 16, height: 16, fontSize: 10 }}>−</button>
            <span style={{ fontSize: 11, color: C.silver, fontFamily: "'Playfair Display',Georgia,serif", width: 16, textAlign: "center" }}>{npcNdc}</span>
            <button onClick={() => setNpcNdc(n => Math.min(6, n + 1))} style={{ ...btnSm, width: 16, height: 16, fontSize: 10 }}>+</button>
          </div>
          <button onClick={addNpc} style={{ background: "transparent", border: `1px solid ${C.border2}`, color: C.silverDim, fontFamily: "'Inter',system-ui,sans-serif", fontSize: 9, padding: "3px 8px", cursor: "pointer", letterSpacing: 1 }}>+ NPC</button>
        </div>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
// ─── DADO (1d6 / 2d6 pega-o-melhor) ─────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

// Mapa habilidade → qual antecedente recebe 2d6 pega-o-melhor
// Ex: "Galope Certeiro" → 2d6 apenas em Montaria
const HAB_2D6_MAP = {
  "Às na Manga":            "Roubo",      // jogos de carta = Roubo
  "Boca na Botija":         "Atenção",
  "Chamego":                "Montaria",   // laçar
  "Fogo no Céu":            "Violência",  // explosivos (teste de Violência)
  "Fumaça na Água":         "Roubo",
  "Galope Certeiro":        "Montaria",
  "Natural da Natureza":    "Suor",
  "Não Vai Doer Nadinha":   "Medicina",
  "Sabiá Imperatriz":       "Negócios",
  "Salve-se Quem Puder":    "Suor",       // fuga
  "Sorrisão, Chapéu na Mão":"Negócios",
  "Zói de Coruja":          "Tradição",
};

function rolarDado() { return Math.floor(Math.random()*6)+1; }

// Verifica se alguma habilidade do personagem dá 2d6 para este antecedente específico
function get2d6ForAnte(charHabilidades, antecedente) {
  return (charHabilidades||[]).some(h => HAB_2D6_MAP[h] === antecedente);
}

// Rola crítico/falha: se base=6 rola mais 1 dado; se esse dado=6 → crítico
// Se base=1 rola mais 1 dado; se esse dado=1 → falha crítica
// (conforme regra do livro: "quando o dado der 6, jogue novamente e torça para cair outro 6")
function rolarTeste(antecedente=0, bonus=0, usar2d6=false) {
  const d1 = rolarDado();
  let d2 = null;
  let base = d1;

  if(usar2d6) {
    d2 = rolarDado();
    base = Math.max(d1, d2);
  }

  const total = base + antecedente + bonus;
  const sucesso = total >= 6;

  // Crítico e falha: rola dado extra só quando d1=6 ou d1=1
  let critico = false, falhaCritica = false;
  let dExtra = null;
  if(base === 6) {
    dExtra = rolarDado();
    critico = dExtra === 6;
  } else if(base === 1) {
    dExtra = rolarDado();
    falhaCritica = dExtra === 1;
  }

  return { d1, d2, base, dExtra, antecedente, bonus, total, sucesso, critico, falhaCritica, usar2d6 };
}

const CRIT_TABLE = {
  1:"Mortal: +2 Vida de dano no seu turno",
  2:"Desarmar: inimigo não pode mais atirar com aquela arma",
  3:"Vantagem Tática: +1 Movimento no seu turno até o fim do combate",
  4:"Dança Maluca: inimigo perde seu próximo turno",
  5:"Vantagem Moral: +1 para seus Testes de Violência até o fim",
  6:"Marca da Vingança: inimigo foge, mas jura vingança",
};
const FAIL_TABLE = {
  1:"Seu ataque acerta um aliado ou pessoa inocente",
  2:"Guarda aberta: +1 em testes dos inimigos contra você até o fim",
  3:"Você está abatido — perde seu próximo turno para se recompor",
  4:"Sua arma quebra ou, em corpo a corpo, o dano é anulado",
  5:"Pressão: −1 no ataque contra os inimigos até o fim do combate",
  6:"Você cai igual bosta — perde duas ações para levantar",
};
const MORTE_TABLE = { 1:"SOBREVIVEU (recupera 3 Vida — gaste 1 Mov + 1 Ação de Combate)", 6:"SOBREVIVEU (recupera 3 Vida — gaste 1 Mov + 1 Ação de Combate)" };

function DiceRoller({ char }) {
  const [result, setResult] = useState(null);
  const [ante, setAnte] = useState("Violência");
  const [bonus, setBonus] = useState(0);
  const [modo, setModo] = useState("antecedente"); // antecedente | resistencia | sorte | morte | critico | falha
  const [atrib, setAtrib] = useState("Físico");
  const [open, setOpen] = useState(false);
  const [critRoll, setCritRoll] = useState(null);

  const ANTECEDENTES_LIST = Object.keys(char.antecedentes||{});
  const ATRIBUTOS_LIST    = Object.keys(char.atributos||{});

  // Detecta se alguma hab do personagem dá 2d6 para o antecedente selecionado
  const usar2d6 = modo==="antecedente" && get2d6ForAnte(char.habilidades, ante);
  const habQueGera = modo==="antecedente" ? (char.habilidades||[]).find(h => HAB_2D6_MAP[h] === ante) : null;

  const roll = () => {
    if(modo==="sorte") {
      const d = rolarDado();
      setResult({ tipo:"Teste de Sorte", d1:d, total:d, resultado: d%2===0?"✓ SIM (par)":"✗ NÃO (ímpar)", sucesso:d%2===0, critico:false, falhaCritica:false });
      setCritRoll(null);
      return;
    }
    if(modo==="morte") {
      const d = rolarDado();
      const vivo = d===1||d===6;
      setResult({ tipo:"Teste de Morte", d1:d, total:d, resultado: vivo?MORTE_TABLE[d]:"MORREU — sua alma vai para o limbo", sucesso:vivo, critico:false, falhaCritica:false });
      setCritRoll(null);
      return;
    }
    if(modo==="critico") {
      const d = rolarDado();
      setCritRoll({ tipo:"🎯 Acerto Crítico", d, resultado:CRIT_TABLE[d] });
      return;
    }
    if(modo==="falha") {
      const d = rolarDado();
      setCritRoll({ tipo:"💀 Falha Crítica", d, resultado:FAIL_TABLE[d] });
      return;
    }

    let val = 0;
    if(modo==="antecedente") val = (char.antecedentes||{})[ante]||0;
    else if(modo==="resistencia") val = (char.atributos||{})[atrib]||0;
    else if(modo==="tudo_nada") val = (char.antecedentes||{})["Violência"]||0;

    const r = rolarTeste(val, bonus, usar2d6);
    setResult({ tipo: modo==="antecedente"?`Teste de ${ante}`:modo==="resistencia"?`Resistência de ${atrib}`:"Tudo ou Nada", ...r });
    // Se crítico ou falha crítica, rolar tabela automaticamente
    if(r.critico) setCritRoll({ tipo:"🎯 Acerto Crítico", d: rolarDado(), resultado:null, autoTable:true });
    else if(r.falhaCritica) setCritRoll({ tipo:"💀 Falha Crítica", d: rolarDado(), resultado:null, autoTable:true });
    else setCritRoll(null);
  };

  // Quando resultado tiver crítico/falha e critRoll.autoTable, resolver resultado
  const critFinal = critRoll?.autoTable && critRoll.d ? {
    ...critRoll,
    resultado: result?.critico ? CRIT_TABLE[critRoll.d] : FAIL_TABLE[critRoll.d],
  } : critRoll;

  const diceColor = (val) => val===6?"#c09040":val===1?C.red:C.white;

  return (
    <div style={{border:`1px solid ${C.border}`,background:C.bg1,marginBottom:8}}>
      {/* Header */}
      <div onClick={()=>setOpen(o=>!o)} style={{
        padding:"8px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",
        borderBottom:open?`1px solid ${C.border}`:"none",
      }}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:13,letterSpacing:3,color:C.silver,textTransform:"uppercase"}}>🎲 Dados</span>
          {result&&!open&&(
            <span style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:16,color:result.critico?"#c09040":result.falhaCritica?C.red:result.sucesso?C.silver:C.grayDark,marginLeft:8}}>
              {result.total} {result.critico?"⚡ CRÍTICO!":result.falhaCritica?"💀 FALHA CRÍTICA!":result.sucesso?"✓":"✗"}
            </span>
          )}
        </div>
        <span style={{color:C.grayDark,fontSize:12}}>{open?"▲":"▼"}</span>
      </div>

      {open&&(
        <div style={{padding:"12px 14px"}}>
          {/* Modo */}
          <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:12}}>
            {[["antecedente","Antecedente"],["resistencia","Resistência"],["sorte","Sorte"],["tudo_nada","Tudo ou Nada"],["morte","Teste Morte"],["critico","▸ Crítico"],["falha","▸ Falha"]].map(([v,l])=>(
              <button key={v} onClick={()=>setModo(v)} style={{
                background:modo===v?C.bg3:"transparent",border:`1px solid ${modo===v?C.silver:C.border}`,
                color:modo===v?C.white:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",
                fontSize:9,padding:"4px 10px",cursor:"pointer",letterSpacing:1,
              }}>{l}</button>
            ))}
          </div>

          {/* Seletor antecedente */}
          {modo==="antecedente"&&(
            <div style={{marginBottom:10}}>
              <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                {ANTECEDENTES_LIST.map(a=>{
                  const has2d6 = get2d6ForAnte(char.habilidades, a);
                  return (
                    <button key={a} onClick={()=>setAnte(a)} style={{
                      background:ante===a?C.bg3:"transparent",border:`1px solid ${ante===a?C.silver:C.border}`,
                      color:ante===a?C.white:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",
                      fontSize:9,padding:"3px 8px",cursor:"pointer",position:"relative",
                    }}>
                      {a} ({(char.antecedentes||{})[a]||0})
                      {has2d6&&<span style={{position:"absolute",top:-5,right:-4,fontSize:7,color:"#c09040",background:C.bg}}>2d6</span>}
                    </button>
                  );
                })}
              </div>
              {habQueGera&&(
                <div style={{fontSize:9,color:"#c09040",fontFamily:"'Inter',system-ui,sans-serif",marginTop:5,letterSpacing:1}}>
                  ✦ {habQueGera} — puxará 2d6, usa o melhor resultado
                </div>
              )}
            </div>
          )}

          {/* Seletor atributo */}
          {modo==="resistencia"&&(
            <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:10}}>
              {ATRIBUTOS_LIST.map(a=>(
                <button key={a} onClick={()=>setAtrib(a)} style={{
                  background:atrib===a?C.bg3:"transparent",border:`1px solid ${atrib===a?C.silver:C.border}`,
                  color:atrib===a?C.white:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",
                  fontSize:9,padding:"3px 8px",cursor:"pointer",
                }}>{a} ({(char.atributos||{})[a]||0})</button>
              ))}
            </div>
          )}

          {/* Info rápida */}
          {modo==="sorte"&&<div style={{fontSize:10,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",marginBottom:10}}>Par = SIM · Ímpar = NÃO</div>}
          {modo==="tudo_nada"&&<div style={{fontSize:10,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",marginBottom:10,lineHeight:1.7}}>Uma rolagem para todas as Ações de Combate de atirar. Sucesso = +1 dano por tiro. Falha = todos erram o alvo.</div>}
          {modo==="morte"&&<div style={{fontSize:10,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",marginBottom:10,lineHeight:1.7}}>Role 1d6. Se cair 1 ou 6: vivo (gaste 1 Mov + 1 Ação, recupera 3 Vida). Qualquer outro número: morre.</div>}
          {(modo==="critico"||modo==="falha")&&<div style={{fontSize:10,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",marginBottom:10}}>Role 1d6 para determinar o efeito.</div>}

          {/* Bônus */}
          {!["sorte","morte","critico","falha"].includes(modo)&&(
            <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:12}}>
              <span style={{fontSize:9,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",letterSpacing:1,textTransform:"uppercase"}}>Bônus / Penalidade:</span>
              <button onClick={()=>setBonus(b=>b-1)} style={{...btnSm,width:22,height:22,fontSize:12}}>−</button>
              <span style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:16,color:bonus>0?"#50c050":bonus<0?C.red:C.white,width:28,textAlign:"center"}}>{bonus>0?"+":""}{bonus}</span>
              <button onClick={()=>setBonus(b=>b+1)} style={{...btnSm,width:22,height:22,fontSize:12}}>+</button>
              {bonus!==0&&<button onClick={()=>setBonus(0)} style={{...btnSm,fontSize:8,width:"auto",padding:"2px 6px",color:C.grayDark}}>reset</button>}
            </div>
          )}

          {/* Botão */}
          <button onClick={roll} style={{
            background:"transparent",border:`1px solid ${C.silver}`,color:C.silver,
            fontFamily:"'Playfair Display',Georgia,serif",fontSize:11,letterSpacing:4,
            textTransform:"uppercase",padding:"8px 24px",cursor:"pointer",display:"block",marginBottom:14,
          }}>🎲 Rolar</button>

          {/* Resultado de crítico/falha isolado (modos critico/falha) */}
          {critFinal&&(modo==="critico"||modo==="falha")&&(
            <div style={{border:`1px solid ${result?.critico?"#8b7030":C.redDim}`,background:result?.critico?"#1a1200":"#200000",padding:"10px 14px",marginBottom:10}}>
              <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:11,letterSpacing:3,color:result?.critico?"#c09040":C.red,marginBottom:4}}>{critFinal.tipo} — {critFinal.d}</div>
              <div style={{fontFamily:"'Inter',system-ui,sans-serif",fontSize:13,color:C.white}}>{critFinal.resultado}</div>
            </div>
          )}

          {/* Resultado de teste */}
          {result&&!["critico","falha"].includes(modo)&&(
            <div style={{
              border:`1px solid ${result.critico?"#c09040":result.falhaCritica?C.red:result.sucesso?"#3a5a3a":C.border}`,
              background:result.critico?"#1a1200":result.falhaCritica?"#200000":result.sucesso?"#0a140a":C.bg3,
              padding:"12px 16px",
            }}>
              <div style={{fontFamily:"'Inter',system-ui,sans-serif",fontSize:9,letterSpacing:2,color:C.grayDark,marginBottom:8,textTransform:"uppercase"}}>{result.tipo}</div>

              {/* Dados visuais */}
              <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:8,flexWrap:"wrap"}}>
                {/* d1 */}
                <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
                  <div style={{width:40,height:40,border:`2px solid ${diceColor(result.d1)}`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Playfair Display',Georgia,serif",fontSize:22,color:diceColor(result.d1)}}>{result.d1}</div>
                  <span style={{fontSize:8,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif"}}>{result.usar2d6?"d1":"dado"}</span>
                </div>
                {/* d2 (2d6) */}
                {result.d2!=null&&(
                  <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
                    <div style={{width:40,height:40,border:`2px solid ${result.d2===result.base?diceColor(result.d2):"#2a2a2a"}`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Playfair Display',Georgia,serif",fontSize:22,color:result.d2===result.base?diceColor(result.d2):C.grayDark,opacity:result.d2<result.d1?0.4:1}}>{result.d2}</div>
                    <span style={{fontSize:8,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif"}}>d2</span>
                  </div>
                )}
                {/* dado extra crítico/falha */}
                {result.dExtra!=null&&(
                  <>
                    <span style={{color:C.grayDark,fontSize:14,margin:"0 2px"}}>→</span>
                    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
                      <div style={{width:40,height:40,border:`2px solid ${diceColor(result.dExtra)}`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Playfair Display',Georgia,serif",fontSize:22,color:diceColor(result.dExtra)}}>{result.dExtra}</div>
                      <span style={{fontSize:8,color:result.critico?"#c09040":result.falhaCritica?C.red:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif"}}>{result.critico?"crítico!":result.falhaCritica?"falha!":"relance"}</span>
                    </div>
                  </>
                )}
                {/* Total */}
                {result.total!=null&&(
                  <>
                    <span style={{color:C.grayDark,fontSize:18,margin:"0 4px"}}>=</span>
                    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
                      <div style={{width:52,height:52,border:`2px solid ${result.sucesso?"#50c050":C.red}`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Playfair Display',Georgia,serif",fontSize:28,color:result.sucesso?"#50c050":C.red,background:result.sucesso?"#0a140a":"#1a0000"}}>{result.total}</div>
                      <span style={{fontSize:9,color:result.sucesso?"#50c050":C.red,fontFamily:"'Inter',system-ui,sans-serif",letterSpacing:1}}>{result.sucesso?"SUCESSO":"FALHA"}{modo==="antecedente"||modo==="tudo_nada"?" (NA 6)":""}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Resultado especial */}
              {result.resultado&&(
                <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:16,color:result.sucesso?C.silver:C.grayDark,marginBottom:6}}>{result.resultado}</div>
              )}
              {result.critico&&(
                <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:12,color:"#c09040",letterSpacing:2,marginBottom:4}}>⚡ ACERTO CRÍTICO!</div>
              )}
              {result.falhaCritica&&(
                <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:12,color:C.red,letterSpacing:2,marginBottom:4}}>💀 FALHA CRÍTICA!</div>
              )}

              {/* Resultado da tabela após crítico/falha automático */}
              {critFinal&&(result.critico||result.falhaCritica)&&(
                <div style={{border:`1px solid ${result.critico?"#5a4010":"#5a1010"}`,background:result.critico?"#0d0a00":"#0d0000",padding:"8px 12px",marginTop:6}}>
                  <div style={{fontSize:9,color:result.critico?"#c09040":C.red,fontFamily:"'Inter',system-ui,sans-serif",letterSpacing:2,marginBottom:3}}>{critFinal.tipo} — {critFinal.d}</div>
                  <div style={{fontSize:12,color:C.white,fontFamily:"'Inter',system-ui,sans-serif"}}>{critFinal.resultado}</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── CARTAS DE SINA ───────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

function CartasSinaWidget({ char, upd }) {
  const cartas = char.cartasSina || [];
  const MAX_CARTAS = 2;

  const addCarta = () => {
    if(cartas.length >= MAX_CARTAS) return;
    const carta = drawCard();
    upd("cartasSina", [...cartas, { ...carta, id: Date.now()+Math.random(), usada: false }]);
  };

  const usarCarta = (id) => {
    upd("cartasSina", cartas.map(c => c.id===id ? {...c, usada: true} : c));
  };

  const removerCarta = (id) => {
    upd("cartasSina", cartas.filter(c => c.id !== id));
  };

  const USOS = [
    "Refazer um teste que você ou aliado falhou",
    "Reanimar personagem morto (até 1 rodada após morte)",
    "Trocar cartas no Duelo",
    "+1 XP no final da sessão (se não usada)",
  ];

  return (
    <div>
      <div style={{fontSize:10,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",marginBottom:10,lineHeight:1.8}}>
        Máximo de 2 por sessão. Se não usadas, valem +1 XP cada no final.
      </div>
      <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:10}}>
        {cartas.map(c=>(
          <div key={c.id} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6,padding:"8px 12px",border:`1px solid ${c.usada?C.border:"#8b7030"}`,background:c.usada?C.bg3:"#1a1200",opacity:c.usada?0.5:1}}>
            <CardVisual card={c} size="md" discarded={c.usada}/>
            <div style={{fontSize:9,color:c.usada?C.grayDark:"#c09040",fontFamily:"'Inter',system-ui,sans-serif",letterSpacing:1}}>
              {c.usada?"USADA":"ATIVA"}
            </div>
            {!c.usada&&(
              <div style={{display:"flex",gap:4}}>
                <button onClick={()=>usarCarta(c.id)} style={{background:"transparent",border:`1px solid #8b7030`,color:"#c09040",fontFamily:"'Inter',system-ui,sans-serif",fontSize:8,padding:"2px 8px",cursor:"pointer",letterSpacing:1}}>Usar</button>
                <button onClick={()=>removerCarta(c.id)} style={{background:"transparent",border:`1px solid ${C.border}`,color:C.redDim,fontFamily:"'Inter',system-ui,sans-serif",fontSize:8,padding:"2px 6px",cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.color=C.red} onMouseLeave={e=>e.currentTarget.style.color=C.redDim}>✕</button>
              </div>
            )}
            {c.usada&&<button onClick={()=>removerCarta(c.id)} style={{background:"transparent",border:`1px solid ${C.border}`,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",fontSize:8,padding:"2px 6px",cursor:"pointer"}}>Descartar</button>}
          </div>
        ))}
        {cartas.length < MAX_CARTAS && (
          <div onClick={addCarta} style={{width:52,height:72,border:`1px dashed ${C.border2}`,borderRadius:4,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:C.grayDark,fontSize:22}} onMouseEnter={e=>e.currentTarget.style.borderColor=C.silver} onMouseLeave={e=>e.currentTarget.style.borderColor=C.border2}>+</div>
        )}
      </div>
      <div style={{fontSize:9,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",lineHeight:2}}>
        <strong style={{color:C.silverDim}}>Como ganhar:</strong> façanhas cinematográficas · agir pela Trilha · proteger inocentes · soluções criativas · não fazer algo egoísta
      </div>
      <div style={{marginTop:6}}>
        <details style={{fontSize:9,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif"}}>
          <summary style={{cursor:"pointer",color:C.silverDim,letterSpacing:1}}>Como usar</summary>
          <div style={{marginTop:4,lineHeight:2,color:C.gray}}>
            {USOS.map((u,i)=><div key={i}>· {u}</div>)}
          </div>
        </details>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── XP CHECKLIST (5 perguntas de fim de sessão) ─────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

const XP_PERGUNTAS = [
  "Seu PJ chegou vivo ao final da sessão?",
  "Seu PJ tem mais dinheiro do que no começo da sessão?",
  "Seu PJ fez algo que ajudou seu bando de alguma forma?",
  "Seu PJ resolveu o problema de alguém?",
  "Seu PJ terminou a sessão com alguma Carta de Sina?",
];

function XPChecklist({ char, upd }) {
  const [respostas, setRespostas] = useState([false,false,false,false,false]);
  const [aplicado, setAplicado] = useState(false);
  const [sinaBonus, setSinaBonus] = useState(0);

  // Bonus de sina não usadas
  const sinaXP = (char.cartasSina||[]).filter(c=>!c.usada).length;

  const total = respostas.filter(Boolean).length + sinaXP;

  const aplicarXP = () => {
    upd("xp", (char.xp||0) + total);
    setAplicado(true);
    // Limpar cartas de sina após sessão
    upd("cartasSina", []);
    setTimeout(() => { setRespostas([false,false,false,false,false]); setAplicado(false); }, 3000);
  };

  return (
    <div>
      <div style={{fontSize:10,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",marginBottom:10,lineHeight:1.7}}>
        Responda no final de cada sessão. +1 XP por "sim".
      </div>
      {XP_PERGUNTAS.map((p,i)=>(
        <div key={i} onClick={()=>setRespostas(r=>r.map((v,j)=>j===i?!v:v))}
          style={{display:"flex",alignItems:"center",gap:10,padding:"6px 8px",cursor:"pointer",marginBottom:4,
            background:respostas[i]?"#0a140a":"transparent",border:`1px solid ${respostas[i]?"#3a5a3a":C.border}`,
            transition:"all 0.15s",
        }}>
          <div style={{width:18,height:18,border:`1.5px solid ${respostas[i]?"#50c050":C.border2}`,background:respostas[i]?"#50c050":"transparent",borderRadius:2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:C.bg,flexShrink:0}}>
            {respostas[i]?"✓":""}
          </div>
          <span style={{fontFamily:"'Inter',system-ui,sans-serif",fontSize:11,color:respostas[i]?C.white:C.grayDark,lineHeight:1.5}}>{p}</span>
        </div>
      ))}
      {sinaXP > 0 && (
        <div style={{padding:"6px 8px",background:"#1a1200",border:`1px solid #5a4010`,marginTop:4,fontSize:10,color:"#c09040",fontFamily:"'Inter',system-ui,sans-serif"}}>
          +{sinaXP} XP de Cartas de Sina não usadas
        </div>
      )}
      <div style={{display:"flex",alignItems:"center",gap:14,marginTop:12}}>
        <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:20,color:total>0?C.silver:C.grayDark}}>
          +{total} XP
        </div>
        <button onClick={aplicarXP} disabled={total===0||aplicado} style={{
          background:"transparent",border:`1px solid ${total>0&&!aplicado?C.silver:C.border}`,
          color:total>0&&!aplicado?C.silver:C.grayDark,
          fontFamily:"'Playfair Display',Georgia,serif",fontSize:9,letterSpacing:3,
          textTransform:"uppercase",padding:"6px 16px",cursor:total>0&&!aplicado?"pointer":"not-allowed",
        }}>{aplicado?"✓ Aplicado!":"Aplicar XP"}</button>
        <span style={{fontSize:10,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif"}}>
          XP atual: {char.xp||0}
        </span>
      </div>
    </div>
  );
}

function CharSheet({char,update}) {
  const [tab,setTab]=useState(0);
  const fileRef=useRef();

  const upd=useCallback((field,val)=>update({...char,[field]:val}),[char,update]);
  const updMany=useCallback((patch)=>update({...char,...patch}),[char,update]);

  const updAtrib=(k,v)=>{
    const a={...char.atributos,[k]:Math.max(0,Math.min(4,v))};
    updMany({atributos:a,vidaBase:6+(a.Físico||0),movimentos:1+(a.Velocidade||0),acoes:1+(a.Coragem||0)});
  };
  const updAnte=(k,v)=>{
    if(v<0||v>6)return;
    const total=Object.values(char.antecedentes).reduce((a,b)=>a+b,0);
    const delta=v-char.antecedentes[k];
    const max=4+(char.atributos.Intelecto||0);
    if(delta>0&&total+delta>max)return;
    upd("antecedentes",{...char.antecedentes,[k]:v});
  };
  const toggleHab=(nome)=>upd("habilidades",char.habilidades.includes(nome)?char.habilidades.filter(x=>x!==nome):[...char.habilidades,nome]);
  const updMont=(f,v)=>upd("montaria",{...char.montaria,[f]:v});

  const handleImg=(e)=>{
    const f=e.target.files[0]; if(!f)return;
    const r=new FileReader(); r.onload=ev=>upd("imagem",ev.target.result); r.readAsDataURL(f);
  };

  const antTotal=Object.values(char.antecedentes).reduce((a,b)=>a+b,0);
  const antMax=4+(char.atributos.Intelecto||0);
  const condAtivas=(char.circulosDorAtivos||[]).length>0;

  return (
    <div style={{maxWidth:820,margin:"0 auto"}}>

      {/* ── HEADER ── */}
      <div style={{display:"flex",alignItems:"flex-start",gap:20,marginBottom:20}}>
        <div onClick={()=>fileRef.current.click()} style={{width:96,height:116,flexShrink:0,border:`1px dashed ${C.border2}`,cursor:"pointer",background:char.imagem?`url(${char.imagem}) center/cover`:C.bg2,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
          {!char.imagem&&<span style={{fontSize:9,color:C.grayDark,letterSpacing:2,textAlign:"center",padding:8,textTransform:"uppercase"}}>Foto</span>}
          <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleImg}/>
        </div>
        <div style={{flex:1}}>
          <Inp value={char.nome} onChange={v=>upd("nome",v)} placeholder="Nome do personagem" style={{fontSize:22,fontFamily:"'Playfair Display',Georgia,serif",letterSpacing:2,color:C.white}}/>
          <div style={{marginTop:6}}><Inp value={char.conceito} onChange={v=>upd("conceito",v)} placeholder="Conceito"/></div>
          <div style={{marginTop:6}}><Inp value={char.jogador} onChange={v=>upd("jogador",v)} placeholder="Jogador"/></div>
          <div style={{display:"flex",gap:16,marginTop:12,flexWrap:"wrap"}}>
            <StatBox label="Nível" value={char.nivel} onChange={v=>upd("nivel",v)} min={1} max={6}/>
            <StatBox label="XP" value={char.xp} onChange={v=>upd("xp",v)} min={0} max={99}/>
            <StatBox label="$$$" value={char.dinheiro} onChange={v=>upd("dinheiro",v)} min={0} max={99999}/>
            <StatBox label="Pts. de Sina" value={char.pontosSina} onChange={v=>upd("pontosSina",v)} min={0} max={20}/>
          </div>
        </div>
      </div>

      {/* ── VIDA / DOR / STATS ── */}
      <div style={{display:"flex",gap:24,flexWrap:"wrap",alignItems:"flex-end",paddingBottom:14,borderBottom:`1px solid ${C.border}`}}>
        <div>
          <span style={{fontSize:11,letterSpacing:2,color:C.red,fontFamily:"'Inter',system-ui,sans-serif",textTransform:"uppercase"}}>Vida</span>
          <div style={{display:"flex",gap:5,marginTop:6,flexWrap:"wrap",alignItems:"center"}}>
            {Array.from({length:char.vidaBase}).map((_,i)=>(
              <Dot key={i} filled={i<char.vidaAtual} danger onClick={()=>upd("vidaAtual",i<char.vidaAtual?i:i+1)}/>
            ))}
            <button onClick={()=>updMany({vidaBase:char.vidaBase+1,vidaAtual:Math.min(char.vidaAtual,char.vidaBase+1)})} style={{width:16,height:16,borderRadius:"50%",border:`1.5px dashed ${C.border2}`,background:"transparent",color:C.grayDark,cursor:"pointer",fontSize:10,padding:0,lineHeight:1}}>+</button>
            {char.vidaBase>6&&<button onClick={()=>updMany({vidaBase:char.vidaBase-1,vidaAtual:Math.min(char.vidaAtual,char.vidaBase-1)})} style={{width:16,height:16,borderRadius:"50%",border:`1.5px dashed ${C.border2}`,background:"transparent",color:C.grayDark,cursor:"pointer",fontSize:10,padding:0,lineHeight:1}}>−</button>}
          </div>
        </div>

        <div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:11,letterSpacing:2,color:C.silverDim,fontFamily:"'Inter',system-ui,sans-serif",textTransform:"uppercase"}}>Dor</span>
            {condAtivas&&<span style={{fontSize:9,color:C.red,fontFamily:"'Inter',system-ui,sans-serif",letterSpacing:1}}>● condições ativas</span>}
          </div>
          <div style={{display:"flex",gap:5,marginTop:6}}>
            {CIRCULOS_DOR.map((cd)=>{
              const ativo=(char.circulosDorAtivos||[]).includes(cd.num);
              return (
                <button key={cd.num} title={`${cd.nome}: ${cd.efeito}`} onClick={()=>{
                  const curr=char.circulosDorAtivos||[];
                  upd("circulosDorAtivos",ativo?curr.filter(n=>n!==cd.num):[...curr,cd.num]);
                }} style={{width:22,height:22,borderRadius:"50%",padding:0,border:`1.5px solid ${ativo?cd.cor:C.silverDim}`,background:ativo?cd.cor:"transparent",cursor:"pointer",transition:"all 0.12s",fontSize:10,color:ativo?C.white:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif"}}>{cd.num}</button>
              );
            })}
          </div>
        </div>

        <StatBox label="Defesa" value={char.defesa} onChange={v=>upd("defesa",v)} min={1} max={9}/>
        <StatBox label="Movimentos" value={char.movimentos} onChange={v=>upd("movimentos",v)} min={1} max={9}/>
        <StatBox label="Ações" value={char.acoes} onChange={v=>upd("acoes",v)} min={1} max={9}/>
      </div>

      {/* ── BANNER CONDIÇÕES ATIVAS ── */}
      {condAtivas&&(
        <div style={{background:"#0d0000",border:`1px solid ${C.redDim}`,borderTop:"none",padding:"8px 16px"}}>
          <div style={{display:"flex",flexWrap:"wrap",gap:12}}>
            {CIRCULOS_DOR.filter(cd=>(char.circulosDorAtivos||[]).includes(cd.num)).map(cd=>(
              <span key={cd.num} style={{fontSize:11,fontFamily:"'Inter',system-ui,sans-serif",color:C.gray}}>
                <span style={{color:cd.cor}}>● {cd.nome}</span> — {cd.efeito}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── DADO INTEGRADO ── */}
      <DiceRoller char={char}/>

      {/* ── TABS ── */}
      <div style={{display:"flex",borderBottom:`1px solid ${C.border}`,marginTop:18,flexWrap:"wrap"}}>
        {TABS.map((t,i)=>(
          <button key={t} onClick={()=>setTab(i)} style={{background:"transparent",border:"none",borderBottom:tab===i?`2px solid ${C.silver}`:"2px solid transparent",color:tab===i?C.white:C.grayDark,fontFamily:"'Playfair Display',Georgia,serif",fontSize:10,letterSpacing:2,textTransform:"uppercase",padding:"8px 12px",cursor:"pointer",transition:"all 0.15s"}}>{t}</button>
        ))}
      </div>

      <div style={{padding:"4px 0 56px"}}>

        {/* ── TAB 0: IDENTIDADE ── */}
        {tab===0&&(
          <div>
            <SectionTitle>Círculos de Dor — Condições de Combate</SectionTitle>
            <div style={{fontSize:10,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",marginBottom:12,letterSpacing:1}}>
              Clique em uma linha para marcar/desmarcar. A condição é instaurada imediatamente na ficha e no cabeçalho acima.
            </div>
            <CirculosDorWidget ativos={char.circulosDorAtivos||[]} onChange={v=>upd("circulosDorAtivos",v)}/>

            <SectionTitle>Descanso e Recuperação</SectionTitle>
            <DescansoWidget char={char} upd={upd}/>

            <SectionTitle>Iniciativa Rápida</SectionTitle>
            <MiniCombatTracker char={char}/>

            <SectionTitle>Recompensa pela Cabeça</SectionTitle>
            <div style={{display:"flex",gap:16,alignItems:"center",flexWrap:"wrap"}}>
              <div style={{fontFamily:"'Inter',system-ui,sans-serif",fontSize:26,color:C.silver}}>${char.recompensa.toLocaleString()}</div>
              <div style={{display:"flex",gap:6}}>
                <button onClick={()=>upd("recompensa",Math.max(0,char.recompensa-10))} style={{...btnSm,width:28,height:28}}>−</button>
                <button onClick={()=>upd("recompensa",char.recompensa+10)} style={{...btnSm,width:28,height:28}}>+</button>
              </div>
            </div>
            <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:12}}>
              {CRIMES.map(c=>(
                <button key={c.crime} onClick={()=>upd("recompensa",char.recompensa+c.valor)} style={{background:"transparent",border:`1px solid ${C.border}`,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",fontSize:10,padding:"3px 9px",cursor:"pointer"}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=C.silver;e.currentTarget.style.color=C.silver;}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.grayDark;}}>
                  {c.crime} <span style={{color:C.silverDim}}>+${c.valor}</span>
                </button>
              ))}
            </div>

            <SectionTitle>Cartas de Sina</SectionTitle>
            <CartasSinaWidget char={char} upd={upd}/>

            <SectionTitle>XP — Perguntas de Sessão</SectionTitle>
            <XPChecklist char={char} upd={upd}/>
          </div>
        )}

        {/* ── TAB 1: ATRIBUTOS ── */}
        {tab===1&&(
          <div>
            <SectionTitle>Atributos — 4 pontos distribuídos</SectionTitle>
            <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
              {ATRIBUTOS.map(a=>(
                <div key={a} style={{minWidth:148,padding:"14px 16px",border:`1px solid ${C.border}`,background:C.bg2}}>
                  <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:14,color:C.white,marginBottom:4}}>{a}</div>
                  <div style={{fontSize:10,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",marginBottom:12,lineHeight:1.4}}>{ATRIBUTOS_DESC[a]}</div>
                  <StatBox label={a} value={char.atributos[a]} onChange={v=>updAtrib(a,v)} max={4}/>
                </div>
              ))}
            </div>

            <SectionTitle>Antecedentes — {antTotal}/{antMax} pontos (máx. 6 cada)</SectionTitle>
            <AntecedenteGrid char={char} upd={upd} updAnte={updAnte}/>

            <SectionTitle>Progressão por Nível</SectionTitle>
            {LEVEL_TABLE.map(l=>(
              <div key={l.nivel} style={{display:"flex",gap:14,padding:"7px 0",borderBottom:`1px solid ${C.bg3}`,color:char.nivel>=l.nivel?C.white:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",fontSize:12}}>
                <span style={{width:40,color:C.silverDim}}>Nv.{l.nivel}</span>
                <span style={{width:60}}>{l.xp} XP</span>
                <span>{l.bonus}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── TAB 2: HABILIDADES ── */}
        {tab===2&&(
          <div>
            <div style={{fontSize:10,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",marginTop:14,letterSpacing:1}}>
              Escolha 2 habilidades no nível 1. Clique no nome para selecionar/deselecionar · ▼ para ver descrição completa.
            </div>

            <SectionTitle>
              Combate — {HABILIDADES_COMBATE.length} habilidades · {char.habilidades.filter(h=>HABILIDADES_COMBATE.find(x=>x.nome===h)).length} selecionadas
            </SectionTitle>
            <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
              {HABILIDADES_COMBATE.map(h=>(
                <SkillCard key={h.nome} h={h} selected={char.habilidades.includes(h.nome)} onToggle={()=>toggleHab(h.nome)}/>
              ))}
            </div>

            <SectionTitle>
              Profissão — {HABILIDADES_PROFISSAO.length} habilidades · {char.habilidades.filter(h=>HABILIDADES_PROFISSAO.find(x=>x.nome===h)).length} selecionadas
            </SectionTitle>
            <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
              {HABILIDADES_PROFISSAO.map(h=>(
                <SkillCard key={h.nome} h={h} selected={char.habilidades.includes(h.nome)} onToggle={()=>toggleHab(h.nome)}/>
              ))}
            </div>

            <SectionTitle>Habilidades Personalizadas</SectionTitle>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {(char.habsCustom||[]).map((h,i)=>(
                <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start"}}>
                  <div style={{width:160}}><Inp value={h.nome} onChange={v=>{const hs=[...char.habsCustom];hs[i]={...hs[i],nome:v};upd("habsCustom",hs);}} placeholder="Nome..."/></div>
                  <div style={{flex:1}}><Inp value={h.desc} onChange={v=>{const hs=[...char.habsCustom];hs[i]={...hs[i],desc:v};upd("habsCustom",hs);}} placeholder="Descrição..."/></div>
                  <button onClick={()=>upd("habsCustom",char.habsCustom.filter((_,j)=>j!==i))} style={{background:"transparent",border:`1px solid ${C.border}`,color:C.red,fontFamily:"'Inter',system-ui,sans-serif",fontSize:12,padding:"4px 10px",cursor:"pointer",marginTop:2}}>✕</button>
                </div>
              ))}
              <button onClick={()=>upd("habsCustom",[...(char.habsCustom||[]),{nome:"",desc:""}])} style={{background:"transparent",border:`1px dashed ${C.border2}`,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",fontSize:11,padding:"7px 16px",cursor:"pointer",letterSpacing:1,width:220}}>+ Adicionar habilidade</button>
            </div>
          </div>
        )}

        {/* ── TAB 3: HONRA & REDENÇÃO ── */}
        {tab===3&&(
          <div>
            <SectionTitle>Pontos de Honra</SectionTitle>
            <div style={{padding:"18px 0 6px"}}><HonorMeter value={char.honra} onChange={v=>upd("honra",v)}/></div>
            <div style={{marginTop:14,padding:"12px 16px",border:`1px solid ${C.border}`,background:C.bg2}}>
              <div style={{fontSize:10,color:C.silverDim,letterSpacing:2,textTransform:"uppercase",fontFamily:"'Inter',system-ui,sans-serif",marginBottom:8}}>Como funciona</div>
              <div style={{fontSize:12,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",lineHeight:1.8}}>
                A honra começa em 0 (neutro) e varia de −5 a +5. Atos nobres e justos aumentam a honra. Crimes, traições e atos vis a reduzem. O histórico afeta como NPCs, gangues e autoridades tratam o personagem.
              </div>
            </div>

            <SectionTitle>Trilha de Redenção</SectionTitle>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:20}}>
              {TRILHAS.map(t=>(
                <button key={t} onClick={()=>upd("trilha",{...char.trilha,tipo:t})} style={{background:char.trilha.tipo===t?C.bg3:"transparent",border:`1px solid ${char.trilha.tipo===t?C.silver:C.border}`,color:char.trilha.tipo===t?C.white:C.grayDark,fontFamily:"'Playfair Display',Georgia,serif",fontSize:10,letterSpacing:2,textTransform:"uppercase",padding:"6px 14px",cursor:"pointer"}}>{t}</button>
              ))}
            </div>
            {char.trilha.tipo&&(
              <div>
                {char.trilha.passos.map((p,i)=>(
                  <div key={i} style={{display:"flex",gap:12,alignItems:"flex-start",marginBottom:12}}>
                    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,paddingTop:4}}>
                      <span style={{fontSize:9,color:C.silverDim,fontFamily:"'Inter',system-ui,sans-serif"}}>{i+1}</span>
                      <Dot filled={char.trilha.completos[i]} size={14} onClick={()=>{const c=[...char.trilha.completos];c[i]=!c[i];upd("trilha",{...char.trilha,completos:c});}}/>
                    </div>
                    <div style={{flex:1,opacity:char.trilha.completos[i]?0.35:1,transition:"opacity 0.2s"}}>
                      <Inp value={p} onChange={v=>{const ps=[...char.trilha.passos];ps[i]=v;upd("trilha",{...char.trilha,passos:ps});}} placeholder={`Passo ${i+1}...`}/>
                    </div>
                  </div>
                ))}
                <div style={{marginTop:14,padding:"10px 14px",border:`1px solid ${C.border}`,background:C.bg2}}>
                  <div style={{fontSize:9,color:C.silver,letterSpacing:2,textTransform:"uppercase",fontFamily:"'Inter',system-ui,sans-serif"}}>Ao completar a Redenção</div>
                  <div style={{fontSize:12,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",marginTop:6,lineHeight:1.7}}>+1 Habilidade · +2 Círculos de Vida · Tira uma carta a mais na Iniciativa e escolhe a melhor.</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 4: EQUIPAMENTO ── */}
        {tab===4&&(
          <InventarioTab char={char} upd={upd}/>
        )}

        {/* ── TAB 5: COMPANHEIRO ── */}
        {tab===5&&(
          <div>
            <SectionTitle>Montaria / Companheiro</SectionTitle>
            <div style={{display:"flex",gap:16,flexWrap:"wrap",marginBottom:16,alignItems:"flex-end"}}>
              <div style={{flex:1,minWidth:180}}>
                <span style={{fontSize:11,letterSpacing:2,color:C.silverDim,fontFamily:"'Inter',system-ui,sans-serif",textTransform:"uppercase"}}>Nome</span>
                <Inp value={char.montaria.nome} onChange={v=>updMont("nome",v)} placeholder="Nome do companheiro..."/>
              </div>
              <div style={{minWidth:140}}>
                <span style={{fontSize:11,letterSpacing:2,color:C.silverDim,fontFamily:"'Inter',system-ui,sans-serif",textTransform:"uppercase"}}>Tipo</span>
                <select value={char.montaria.tipo||"Cavalo"} onChange={e=>updMont("tipo",e.target.value)} style={{display:"block",background:C.bg2,border:`1px solid ${C.border}`,color:C.white,fontFamily:"'Inter',system-ui,sans-serif",fontSize:13,padding:"5px 10px",marginTop:4,width:"100%",outline:"none",cursor:"pointer"}}>
                  {["Cavalo","Burro","Mula","Cachorro","Lobo","Cão de Guerra","Outro"].map(t=><option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div style={{display:"flex",gap:20,flexWrap:"wrap",marginBottom:20}}>
              <StatBox label="Potência" value={char.montaria.potencia} onChange={v=>updMont("potencia",v)} max={5}/>
              <StatBox label="Resistência" value={char.montaria.resistencia} onChange={v=>updMont("resistencia",v)} max={5}/>
            </div>
            <div style={{marginBottom:24}}>
              <span style={{fontSize:11,letterSpacing:2,color:C.silverDim,fontFamily:"'Inter',system-ui,sans-serif",textTransform:"uppercase"}}>Fidelidade</span>
              <div style={{display:"flex",gap:6,marginTop:10,flexWrap:"wrap"}}>
                {[0,1,2,3,4,5].map(n=>(
                  <button key={n} onClick={()=>updMont("fidelidade",n)} style={{width:40,height:40,border:`1px solid ${char.montaria.fidelidade>=n?C.silver:C.border}`,background:char.montaria.fidelidade>=n?C.bg3:"transparent",color:char.montaria.fidelidade>=n?C.white:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",fontSize:14,cursor:"pointer"}}>{n}</button>
                ))}
              </div>
              <div style={{marginTop:12,fontSize:11,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",lineHeight:2.2}}>
                {[[0,"Estranha: sem bônus."],[1,"+1 Atributo (sua escolha)."],[2,"+1 Atributo (sua escolha)."],[3,"Sem penalidade para saltar obstáculos perigosos."],[4,"Atende quando chamada pelo nome."],[5,"Vem até você em raio de 500m quando chamada."]].map(([n,txt])=>(
                  <div key={n} style={{color:char.montaria.fidelidade>=n?C.silver:C.grayDark}}><span style={{color:C.silverDim,marginRight:8}}>{n}</span>{txt}</div>
                ))}
              </div>
            </div>

            <SectionTitle>Habilidades do Companheiro</SectionTitle>
            <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:10}}>
              {(char.montaria.habilidades||[]).map((h,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:6,padding:"4px 10px",border:`1px solid ${C.silver}`,background:C.bg3}}>
                  <span style={{fontFamily:"'Inter',system-ui,sans-serif",fontSize:12,color:C.white}}>{h}</span>
                  <button onClick={()=>updMont("habilidades",char.montaria.habilidades.filter((_,j)=>j!==i))} style={{background:"transparent",border:"none",color:C.grayDark,cursor:"pointer",fontSize:11,padding:0}}>✕</button>
                </div>
              ))}
            </div>
            <AddHabForm onAdd={nome=>updMont("habilidades",[...(char.montaria.habilidades||[]),nome])}/>

            <SectionTitle>Inventário do Companheiro</SectionTitle>
            <div style={{fontSize:10,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",marginBottom:10}}>Bolsa de montaria: 10 espaços adicionais.</div>
            {(char.montaria.inventario||[]).map((item,i)=>(
              <div key={i} style={{display:"flex",gap:10,alignItems:"center",marginBottom:5}}>
                <span style={{width:18,textAlign:"right",fontSize:10,color:C.border2,fontFamily:"'Inter',system-ui,sans-serif"}}>{i+1}</span>
                <div style={{flex:1,borderBottom:`1px solid ${C.border}`}}>
                  <input value={item} onChange={e=>{const inv=[...(char.montaria.inventario||[])];inv[i]=e.target.value;updMont("inventario",inv);}} placeholder="item..." style={{background:"transparent",border:"none",outline:"none",color:C.white,fontFamily:"'Crimson Text', Georgia, serif",fontSize:14,width:"100%",padding:"2px 0"}}/>
                </div>
                <button onClick={()=>updMont("inventario",(char.montaria.inventario||[]).filter((_,j)=>j!==i))} style={{background:"transparent",border:"none",color:C.grayDark,cursor:"pointer",fontSize:12,padding:0}}>✕</button>
              </div>
            ))}
            <button onClick={()=>updMont("inventario",[...(char.montaria.inventario||[]),""])} style={{background:"transparent",border:`1px dashed ${C.border2}`,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",fontSize:10,padding:"5px 14px",cursor:"pointer",letterSpacing:1,marginTop:8}}>+ espaço</button>
          </div>
        )}

        {/* ── TAB 6: NOTAS ── */}
        {tab===6&&(
          <NotasTab char={char} upd={upd}/>
        )}

      </div>
    </div>
  );
}

// ─── LIBRARY ─────────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
// ─── DESCANSO E RECUPERAÇÃO ──────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
// Regras livro pág. 88:
// 24h descanso: todos os Círculos de Dor zerados + recupera 2 Vida
// 24h com cuidado médico (Medicina): todos Dor + 3 Vida
// Unguento: +1 Vida adicional ao usar durante descanso
// Cânfora em combate: 1 Ação → cura 1 Dor

function DescansoWidget({ char, upd }) {
  const [modo, setModo] = useState("normal"); // normal | medico
  const [unguentos, setUnguentos] = useState(0);
  const [log, setLog] = useState(null);

  const aplicarDescanso = () => {
    const cura_vida_base = modo === "medico" ? 3 : 2;
    const cura_unguentos = unguentos;
    const cura_total = cura_vida_base + cura_unguentos;

    const nova_vida = Math.min(char.vidaBase, (char.vidaAtual || 0) + cura_total);
    const vida_curada = nova_vida - (char.vidaAtual || 0);

    // Zerar todos os Círculos de Dor
    const updates = {
      vidaAtual: nova_vida,
      circulosDorAtivos: [],
    };

    // Se tem medicina (antecedente > 0), testa sucesso automaticamente
    const tem_medicina = modo === "medico" && ((char.antecedentes || {})["Medicina"] || 0) > 0;

    upd("vidaAtual", nova_vida);
    upd("circulosDorAtivos", []);

    setLog({
      vida_curada,
      cura_total,
      dor_zerada: true,
      modo,
      unguentos,
      nova_vida,
      vida_max: char.vidaBase,
    });
    setUnguentos(0);
  };

  const vida_faltando = (char.vidaBase || 6) - (char.vidaAtual || 6);
  const dor_ativas = (char.circulosDorAtivos || []).length;

  return (
    <div style={{ border: `1px solid ${C.border}`, background: C.bg2, padding: "14px 16px", marginBottom: 8 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        {[["normal", "Descanso Normal (24h)"], ["medico", "Com Cuidado Médico (+1 Vida)"]].map(([v, l]) => (
          <button key={v} onClick={() => setModo(v)} style={{
            background: modo === v ? C.bg3 : "transparent",
            border: `1px solid ${modo === v ? C.silver : C.border}`,
            color: modo === v ? C.white : C.grayDark,
            fontFamily: "'Inter',system-ui,sans-serif", fontSize: 10,
            padding: "5px 12px", cursor: "pointer", letterSpacing: 1,
          }}>{l}</button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: C.grayDark, fontFamily: "'Inter',system-ui,sans-serif" }}>
          Unguentos usados:
        </div>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <button onClick={() => setUnguentos(u => Math.max(0, u - 1))} style={{ ...btnSm, width: 22, height: 22, fontSize: 12 }}>−</button>
          <span style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 16, color: unguentos > 0 ? "#c09040" : C.white, width: 24, textAlign: "center" }}>{unguentos}</span>
          <button onClick={() => setUnguentos(u => u + 1)} style={{ ...btnSm, width: 22, height: 22, fontSize: 12 }}>+</button>
        </div>
        <div style={{ fontSize: 10, color: C.grayDark, fontFamily: "'Inter',system-ui,sans-serif" }}>
          (+{unguentos} Vida adicional)
        </div>
      </div>

      {/* Preview do que vai acontecer */}
      <div style={{ fontSize: 11, color: C.grayDark, fontFamily: "'Inter',system-ui,sans-serif", marginBottom: 12, lineHeight: 1.9, borderLeft: `2px solid ${C.border}`, paddingLeft: 10 }}>
        <span style={{ color: dor_ativas > 0 ? C.red : C.grayDark }}>● {dor_ativas} Círculos de Dor</span> serão zerados<br />
        <span style={{ color: vida_faltando > 0 ? "#50c050" : C.grayDark }}>
          ● +{modo === "medico" ? 3 : 2}{unguentos > 0 ? `+${unguentos}` : ""} Vida
          {vida_faltando === 0 ? " (já está com vida cheia)" : ` → de ${char.vidaAtual} para ${Math.min(char.vidaBase, (char.vidaAtual || 0) + (modo === "medico" ? 3 : 2) + unguentos)}/${char.vidaBase}`}
        </span>
      </div>

      <button onClick={aplicarDescanso}
        disabled={vida_faltando === 0 && dor_ativas === 0}
        style={{
          background: "transparent",
          border: `1px solid ${vida_faltando > 0 || dor_ativas > 0 ? C.silver : C.border}`,
          color: vida_faltando > 0 || dor_ativas > 0 ? C.silver : C.grayDark,
          fontFamily: "'Playfair Display',Georgia,serif", fontSize: 10,
          letterSpacing: 3, textTransform: "uppercase",
          padding: "7px 20px", cursor: vida_faltando > 0 || dor_ativas > 0 ? "pointer" : "not-allowed",
        }}>
        🏕 Descansar 24h
      </button>

      {log && (
        <div style={{ marginTop: 10, padding: "8px 12px", border: `1px solid #3a5a3a`, background: "#0a140a", fontFamily: "'Inter',system-ui,sans-serif", fontSize: 11, color: "#50c050", lineHeight: 1.9 }}>
          ✓ Descanso aplicado — Círculos de Dor zerados · +{log.vida_curada} Vida
          {log.vida_curada === 0 ? " (vida já estava cheia)" : ` → ${log.nova_vida}/${log.vida_max}`}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── SISTEMA DE BANDO / BASE ─────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

const BANDO_STORAGE_KEY = "prata_chumbo_bando_v1";
const saveBando = (b) => { try { localStorage.setItem(BANDO_STORAGE_KEY, JSON.stringify(b)); } catch(e){} };
const loadBando = () => { try { const r = localStorage.getItem(BANDO_STORAGE_KEY); return r ? JSON.parse(r) : null; } catch { return null; } };

// Tabela de níveis da Base (livro pág. 100)
const BASE_NIVEL_TABELA = [
  {nivel:1,  custo:150,  notoriedade:1},
  {nivel:2,  custo:200,  notoriedade:1},
  {nivel:3,  custo:270,  notoriedade:2},
  {nivel:4,  custo:360,  notoriedade:2},
  {nivel:5,  custo:480,  notoriedade:2},
  {nivel:6,  custo:620,  notoriedade:3},
  {nivel:7,  custo:780,  notoriedade:3},
  {nivel:8,  custo:960,  notoriedade:4},
  {nivel:9,  custo:1160, notoriedade:4},
  {nivel:10, custo:1380, notoriedade:5},
  {nivel:11, custo:1620, notoriedade:5},
  {nivel:12, custo:1880, notoriedade:6},
];

// Acomodações e NPCs (livro pág. 101-103)
const ACOMODACOES = {
  "♣ Descanso": {
    naipe:"♣",
    npcs: [
      { carta:"Q", nome:"Ordenante", bonus:"Bando inteiro: +1 Ação de Combate na 1ª Rodada do próximo combate", bonusPlus:"Bando inteiro: +1 Ação de Combate no próximo combate (acumula)" },
      { carta:"K", nome:"Cozinheiro", bonus:"+1 Movimento na 1ª Rodada do próximo combate", bonusPlus:"+1 Movimento no próximo combate (acumula)" },
      { carta:"J", nome:"Violeiro", bonus:"Recupere +1 Vida na Fase de Bando", bonusPlus:"Recupere +2 Vida na Fase de Bando (acumula)" },
    ]
  },
  "♠ Arsenal": {
    naipe:"♠",
    npcs: [
      { carta:"Q", nome:"Informante", bonus:"Entrega missão lucrativa (recompensa 150 réis)", bonusPlus:"Entrega missão bastante lucrativa (recompensa 500 réis)" },
      { carta:"K", nome:"Armeiro", bonus:"Recupera metade da munição (custo: 5 réis) · +1 em Violência no próximo combate (custo: 20 réis)", bonusPlus:"Incrementa arma +1 em Violência no próximo combate (custo: 20 réis)" },
      { carta:"J", nome:"Jagunço", bonus:"NPC comum NdC 2 para ajudar em pelejas", bonusPlus:"NPC comum NdC 4 para ajudar em pelejas" },
    ]
  },
  "♥ Enfermaria": {
    naipe:"♥",
    npcs: [
      { carta:"Q", nome:"Médico", bonus:"Remove veneno (custo: 50 réis) · Corta cabelo e barba (custo: 5 réis)", bonusPlus:"Recupera +2 Vida na Fase de Bando (custo: 1 unguento)" },
      { carta:"K", nome:"Cirurgião", bonus:"Recupera +2 Vida na Fase de Bando (custo: 1 unguento)", bonusPlus:"Recupera dano permanente (custo: 100 réis)" },
      { carta:"J", nome:"Veterinário", bonus:"Recupera toda Vida e Dor da montaria (custo: 1 pomada de cavalo)", bonusPlus:"+1 em Testes de Montaria por uma semana após visitar" },
    ]
  },
  "♦ Laboratório": {
    naipe:"♦",
    npcs: [
      { carta:"Q", nome:"Especialista em Veneno", bonus:"2 frascos de veneno à escolha (sonífero/intestinal)", bonusPlus:"5 frascos de veneno à escolha (sonífero/intestinal/incapacitante/mortal)" },
      { carta:"K", nome:"Farmacêutico", bonus:"1 unguento (custo: 3 réis)", bonusPlus:"3 unguentos + 1 seringa de adrenalina (custo: 3 réis cada + 10 réis)" },
      { carta:"J", nome:"Especialista em Bombas", bonus:"1 dinamite (custo: 10 réis)", bonusPlus:"5 dinamites + 10m pavio + detonador (custo: 40 réis)" },
    ]
  },
};

// Tabela de eventos na Fase de Bando (livro pág. 103)
// Indexado por [número][naipe], número 7-10, naipes ♠♥♦♣
const EVENTOS_BANDO = {
  "7": {
    "♠": "Base invadida por 2d6 animais selvagens (coiotes/lobos, NdC 2). Precisa matar ou afugentar.",
    "♥": "Uma pessoa desesperada pede ajuda ao bando. Role missão na tabela de NPC — recompensa 2d6×10 réis.",
    "♦": "Acampamento recebe doação de suprimentos. Cozinha e Enfermaria gratuitas nesta Fase. Sem acomodações: +1d6×10 réis.",
    "♣": "Incêndio acidental. Ordenante sem efeito nesta Fase. Sem Ordenante: bando perde 1d6×10 réis.",
  },
  "8": {
    "♠": "Dois NPCs caem na porrada. Escolham um perdedor — fica inativo nesta Fase. (Com 1 NPC: fase tranquila.)",
    "♥": "Noite de Festa! Teste de Físico. Sucesso: bebe com sabedoria. Falha: role na Tabela de Bebedeira.",
    "♦": "Dois NPCs se envolvem num romance. Ambos fornecem Bônus+ apenas nesta Fase. (Com 1 NPC: fase tranquila.)",
    "♣": "Um NPC da Base é acometido por doença misteriosa. Resolva em tempo ou o NPC morre e Base perde 1 nível.",
  },
  "9": {
    "♠": "Alguém perdeu munição. Armeiro sem efeito nesta Fase. Sem Armeiro: bando perde 1d6×10 réis.",
    "♥": "Noite de música! Teste de Intelecto. Sucesso: +1 Movimento no próximo combate. (Com Violeiro: ele fornece Bônus+.)",
    "♦": "Sorteie dois NPCs para um romance. Ambos fornecem Bônus+ apenas esta Fase.",
    "♣": "Base invadida por 2d6 bandidos. É preciso enfrentá-los em combate.",
  },
  "10": {
    "♠": "Noite de histórias de terror. Teste de Coragem. Falha: −1 Ação de Combate (mín. 0) na 1ª Rodada do próximo combate.",
    "♥": "Uma noite de silêncio para pensar na vida e redenção. O bando escolhe um PJ para ganhar uma Carta de Sina.",
    "♦": "Um cavalo selvagem aparece no acampamento. Teste de Montaria para domá-lo.",
    "♣": "Tempestade violenta. Nenhum bônus pode ser dado nesta Fase de Bando.",
  },
};

// Tabela de Missões de NPC — 3 colunas (pág. 104)
const MISSAO_QUEM = ["Mãe","Irmã","Amigo de infância","Filha","Pai","Mentor","Interesse romântico","Criança órfã","Filho","Irmão","Cunhado","Avô","Parceiro de bando"];
const MISSAO_PRECISO = ["Encontrar","Proteger","Provar","Resgatar","Ajudar","Recuperar","Descobrir","Investigar","Revelar","Curar","Defender","Capturar","Rastrear"];
const MISSAO_REVIRAVOLTA = ["Se tornou um xerife corrupto","Está devendo para uma gangue de bandidos","Ficou doente nas minas de Araguari","Está perdido nos ermos","Montou um bar e precisa de suprimentos","Sabe onde fica um tesouro escondido","É um rico e corrupto magnata das ferrovias","Foi sequestrado por bandidos","Foi preso injustamente","É líder de uma gangue perigosa","Se tornou um cultista fanático","Quer se vingar de um velho inimigo","Virou um ladrão de tumbas"];

const createBando = () => ({
  nome: "",
  nivel: 1,
  dinheiro: 0,
  notoriedade: 1,
  acomodacoes: [], // [{id, acomodacao_key, npc_carta, npc_nome, missaoResolvida, anotacoes}]
  notas: "",
  log: [], // últimos eventos da Fase de Bando
});

function gerarMissaoNPC() {
  // 3 cartas independentes — uma por coluna
  const rank = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
  const r1 = rank[Math.floor(Math.random()*rank.length)];
  const r2 = rank[Math.floor(Math.random()*rank.length)];
  const r3 = rank[Math.floor(Math.random()*rank.length)];
  const rankToIdx = {"A":0,"2":1,"3":2,"4":3,"5":4,"6":5,"7":6,"8":7,"9":8,"10":9,"J":10,"Q":11,"K":12};
  return {
    quem: MISSAO_QUEM[rankToIdx[r1] % MISSAO_QUEM.length],
    preciso: MISSAO_PRECISO[rankToIdx[r2] % MISSAO_PRECISO.length],
    reviravolta: MISSAO_REVIRAVOLTA[rankToIdx[r3] % MISSAO_REVIRAVOLTA.length],
    cartas: [r1, r2, r3],
  };
}

function puxarCartaFaseBando() {
  const rank = ["A","2","3","4","5","6","7","8","9","10","J","Q","K","🃏"];
  const suits = ["♠","♥","♦","♣"];
  const r = rank[Math.floor(Math.random()*rank.length)];
  if(r === "🃏") return {rank:"🃏", suit:"", tipo:"sina_comunitaria", display:"🃏 Coringa"};
  const s = suits[Math.floor(Math.random()*suits.length)];
  let tipo = "tranquila";
  if(["J","Q","K"].includes(r)) tipo = "missao_npc";
  else if(["7","8","9","10"].includes(r)) tipo = "evento";
  return {rank:r, suit:s, tipo, display:`${r}${s}`};
}

function BandoScreen() {
  const [bando, setBando] = useState(() => loadBando() || createBando());
  const [tab, setTab] = useState(0); // 0=Base, 1=Acomodações, 2=Fase de Bando, 3=Missões
  const [faseBandoCartas, setFaseBandoCartas] = useState([]);
  const [missaoGerada, setMissaoGerada] = useState(null);
  const [showAddAcomo, setShowAddAcomo] = useState(false);
  const [addAcomoKey, setAddAcomoKey] = useState(null);
  const [addAcomoNpcCarta, setAddAcomoNpcCarta] = useState(null);
  const [addAcomoNome, setAddAcomoNome] = useState("");

  const upd = (field, val) => {
    setBando(b => {
      const next = {...b, [field]: val};
      saveBando(next);
      return next;
    });
  };

  const updBando = (partial) => {
    setBando(b => {
      const next = {...b, ...partial};
      saveBando(next);
      return next;
    });
  };

  const nivelInfo = BASE_NIVEL_TABELA[bando.nivel-1] || BASE_NIVEL_TABELA[0];
  const proximoNivel = BASE_NIVEL_TABELA[bando.nivel] || null;

  const addLog = (msg) => {
    const ts = new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"});
    upd("log", [{msg,ts}, ...(bando.log||[])].slice(0,40));
  };

  const evoluirBase = () => {
    if(!proximoNivel) return;
    if(bando.dinheiro < proximoNivel.custo) return;
    updBando({
      nivel: bando.nivel+1,
      dinheiro: bando.dinheiro - proximoNivel.custo,
      notoriedade: proximoNivel.notoriedade,
    });
    addLog(`🏠 Base evoluiu para Nível ${bando.nivel+1}! Notoriedade agora: ${proximoNivel.notoriedade}`);
  };

  const addAcomodacao = () => {
    if(!addAcomoKey || !addAcomoNpcCarta) return;
    const acomoData = ACOMODACOES[addAcomoKey];
    const npcData = acomoData.npcs.find(n=>n.carta===addAcomoNpcCarta);
    const nova = {
      id: Date.now()+Math.random(),
      acomodacao_key: addAcomoKey,
      npc_carta: addAcomoNpcCarta,
      npc_nome: addAcomoNome || npcData?.nome || "",
      missaoResolvida: false,
      anotacoes: "",
    };
    upd("acomodacoes", [...(bando.acomodacoes||[]), nova]);
    addLog(`🏠 ${nova.npc_nome} (${addAcomoKey}) entrou para o bando`);
    setShowAddAcomo(false);
    setAddAcomoKey(null);
    setAddAcomoNpcCarta(null);
    setAddAcomoNome("");
  };

  const removeAcomo = (id) => {
    const a = bando.acomodacoes.find(a=>a.id===id);
    upd("acomodacoes", bando.acomodacoes.filter(a=>a.id!==id));
    if(a) addLog(`👋 ${a.npc_nome} saiu do bando`);
  };

  const toggleMissao = (id) => {
    upd("acomodacoes", bando.acomodacoes.map(a => {
      if(a.id!==id) return a;
      const nova = !a.missaoResolvida;
      if(nova) addLog(`✓ Missão de ${a.npc_nome} resolvida — Bônus+ desbloqueado!`);
      return {...a, missaoResolvida: nova};
    }));
  };

  const puxarCartas = () => {
    const qtd = bando.notoriedade || 1;
    const novas = Array.from({length:qtd}, ()=>puxarCartaFaseBando());
    setFaseBandoCartas(novas);
    novas.forEach(c => {
      if(c.tipo==="missao_npc") addLog(`🃏 Carta ${c.display}: missão de NPC surgiu!`);
      else if(c.tipo==="evento") addLog(`🃏 Carta ${c.display}: evento na Base!`);
      else if(c.tipo==="sina_comunitaria") addLog(`🃏 Coringa: Carta de Sina comunitária!`);
      else addLog(`🃏 Carta ${c.display}: Fase tranquila.`);
    });
  };

  const cardColFase = (c) => {
    if(!c.suit) return C.silverDim;
    return ["♥","♦"].includes(c.suit) ? "#c04040" : C.white;
  };

  const BANDO_TABS = ["Base","Acomodações","Fase de Bando","Missões NPC"];

  return (
    <div style={{maxWidth:900,margin:"0 auto",paddingBottom:60}}>
      {/* Header da Base */}
      <div style={{border:`1px solid ${C.border}`,background:C.bg1,padding:"20px 24px",marginBottom:2}}>
        <div style={{display:"flex",gap:20,alignItems:"flex-start",flexWrap:"wrap"}}>
          <div style={{flex:1,minWidth:200}}>
            <div style={{fontSize:9,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",letterSpacing:2,marginBottom:4,textTransform:"uppercase"}}>Nome do Bando</div>
            <input value={bando.nome} onChange={e=>upd("nome",e.target.value)}
              placeholder="Os Pavio Curto..."
              style={{background:"transparent",border:"none",borderBottom:`1px solid ${C.border}`,color:C.white,fontFamily:"'Playfair Display',Georgia,serif",fontSize:20,width:"100%",outline:"none",padding:"2px 0"}}/>
          </div>
          <div style={{display:"flex",gap:20,flexWrap:"wrap"}}>
            <div style={{textAlign:"center"}}>
              <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:32,color:C.silver}}>{bando.nivel}</div>
              <div style={{fontSize:9,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",letterSpacing:2,textTransform:"uppercase"}}>Nível</div>
            </div>
            <div style={{textAlign:"center"}}>
              <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:32,color:"#c09040"}}>{bando.notoriedade}</div>
              <div style={{fontSize:9,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",letterSpacing:2,textTransform:"uppercase"}}>Notoriedade</div>
            </div>
            <div style={{textAlign:"center"}}>
              <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:32,color:"#50c050"}}>R${bando.dinheiro}</div>
              <div style={{fontSize:9,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",letterSpacing:2,textTransform:"uppercase"}}>Caixa do Bando</div>
            </div>
            <div style={{textAlign:"center"}}>
              <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:32,color:C.silverDim}}>{(bando.acomodacoes||[]).length}</div>
              <div style={{fontSize:9,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",letterSpacing:2,textTransform:"uppercase"}}>NPCs</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs do Bando */}
      <div style={{display:"flex",borderBottom:`1px solid ${C.border}`,marginBottom:24}}>
        {BANDO_TABS.map((t,i)=>(
          <button key={t} onClick={()=>setTab(i)} style={{background:"transparent",border:"none",borderBottom:tab===i?`2px solid ${C.silver}`:"2px solid transparent",color:tab===i?C.white:C.grayDark,fontFamily:"'Playfair Display',Georgia,serif",fontSize:10,letterSpacing:2,textTransform:"uppercase",padding:"10px 14px",cursor:"pointer",transition:"all 0.15s"}}>{t}</button>
        ))}
      </div>

      {/* ── TAB 0: BASE ─────────────────────────────────────────────── */}
      {tab===0&&(
        <div>
          <SectionTitle>Caixa do Bando</SectionTitle>
          <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:16,flexWrap:"wrap"}}>
            <div style={{display:"flex",gap:6,alignItems:"center"}}>
              <button onClick={()=>upd("dinheiro",Math.max(0,bando.dinheiro-10))} style={{...btnSm,width:28,height:28,fontSize:13}}>−</button>
              <span style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:24,color:"#50c050",minWidth:80,textAlign:"center"}}>R${bando.dinheiro}</span>
              <button onClick={()=>upd("dinheiro",bando.dinheiro+10)} style={{...btnSm,width:28,height:28,fontSize:13}}>+</button>
            </div>
            {[50,100,200,500].map(v=>(
              <button key={v} onClick={()=>upd("dinheiro",bando.dinheiro+v)}
                style={{background:"transparent",border:`1px solid ${C.border}`,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",fontSize:9,padding:"4px 10px",cursor:"pointer"}}>+R${v}</button>
            ))}
          </div>

          <SectionTitle>Evolução da Base</SectionTitle>
          <div style={{marginBottom:16,fontSize:11,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",lineHeight:1.9}}>
            A cada nível a Base ganha 1 nova Acomodação (ou NPC adicional) e aumenta a Notoriedade.
          </div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:16}}>
            {BASE_NIVEL_TABELA.map(n=>(
              <div key={n.nivel} style={{
                padding:"8px 12px",border:`1px solid ${n.nivel===bando.nivel?C.silver:n.nivel<bando.nivel?"#3a5a3a":C.border}`,
                background:n.nivel===bando.nivel?C.bg3:n.nivel<bando.nivel?"#0a140a":"transparent",
                minWidth:70,textAlign:"center",
              }}>
                <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:16,color:n.nivel===bando.nivel?C.white:n.nivel<bando.nivel?"#50c050":C.grayDark}}>Nv.{n.nivel}</div>
                <div style={{fontSize:8,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",marginTop:2}}>R${n.custo}</div>
                <div style={{fontSize:8,color:"#c09040",fontFamily:"'Inter',system-ui,sans-serif"}}>Not.{n.notoriedade}</div>
              </div>
            ))}
          </div>
          {proximoNivel&&(
            <button onClick={evoluirBase} disabled={bando.dinheiro < proximoNivel.custo}
              style={{background:"transparent",border:`1px solid ${bando.dinheiro>=proximoNivel.custo?C.silver:C.border}`,color:bando.dinheiro>=proximoNivel.custo?C.silver:C.grayDark,fontFamily:"'Playfair Display',Georgia,serif",fontSize:10,letterSpacing:3,textTransform:"uppercase",padding:"8px 22px",cursor:bando.dinheiro>=proximoNivel.custo?"pointer":"not-allowed",marginBottom:16}}>
              Evoluir para Nível {bando.nivel+1} — R${proximoNivel.custo} {bando.dinheiro<proximoNivel.custo?`(faltam R${proximoNivel.custo-bando.dinheiro})`:""}
            </button>
          )}
          {!proximoNivel&&<div style={{fontSize:11,color:"#c09040",fontFamily:"'Playfair Display',Georgia,serif",letterSpacing:2}}>✦ Nível Máximo Atingido</div>}

          <SectionTitle>Notas do Bando</SectionTitle>
          <textarea value={bando.notas||""} onChange={e=>upd("notas",e.target.value)}
            placeholder="Objetivos, missões ativas, aliados, inimigos, segredos..."
            style={{width:"100%",minHeight:100,background:C.bg2,border:`1px solid ${C.border}`,color:C.white,fontFamily:"'Crimson Text',Georgia,serif",fontSize:14,padding:"10px 12px",outline:"none",resize:"vertical",boxSizing:"border-box",lineHeight:1.8}}/>

          <SectionTitle>Log de Eventos</SectionTitle>
          <div style={{maxHeight:200,overflowY:"auto"}}>
            {(bando.log||[]).length===0&&<div style={{fontSize:11,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif"}}>Nenhum evento registrado ainda.</div>}
            {(bando.log||[]).map((e,i)=>(
              <div key={i} style={{display:"flex",gap:10,fontSize:11,fontFamily:"'Inter',system-ui,sans-serif",padding:"3px 0",borderBottom:`1px solid ${C.bg3}`,color:C.gray}}>
                <span style={{color:C.grayDark,flexShrink:0}}>{e.ts}</span>
                <span>{e.msg}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 1: ACOMODAÇÕES ──────────────────────────────────────── */}
      {tab===1&&(
        <div>
          <div style={{fontSize:11,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",lineHeight:1.9,marginBottom:16}}>
            Cada Acomodação tem 3 NPCs disponíveis (Q, K, J). Inicialmente cada NPC dá um Bônus. Ao resolver sua Missão, passa a fornecer também o Bônus+.
            Não é possível ter dois NPCs com a mesma função.
          </div>
          <button onClick={()=>setShowAddAcomo(true)} style={{background:"transparent",border:`1px solid ${C.silver}`,color:C.silver,fontFamily:"'Playfair Display',Georgia,serif",fontSize:10,letterSpacing:3,textTransform:"uppercase",padding:"7px 18px",cursor:"pointer",marginBottom:16}}>
            + Adicionar NPC ao Bando
          </button>

          {/* Modal adicionar acomodação */}
          {showAddAcomo&&(
            <div style={{border:`1px solid ${C.silver}`,background:C.bg2,padding:"20px",marginBottom:16}}>
              <div style={{fontSize:11,letterSpacing:3,color:C.silver,fontFamily:"'Inter',system-ui,sans-serif",marginBottom:14,textTransform:"uppercase"}}>Selecionar Acomodação e NPC</div>

              <div style={{marginBottom:12}}>
                <div style={{fontSize:9,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",letterSpacing:2,marginBottom:6,textTransform:"uppercase"}}>Acomodação</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {Object.keys(ACOMODACOES).map(k=>(
                    <button key={k} onClick={()=>{setAddAcomoKey(k);setAddAcomoNpcCarta(null);}} style={{background:addAcomoKey===k?C.bg3:"transparent",border:`1px solid ${addAcomoKey===k?C.silver:C.border}`,color:addAcomoKey===k?C.white:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",fontSize:10,padding:"5px 12px",cursor:"pointer"}}>{k}</button>
                  ))}
                </div>
              </div>

              {addAcomoKey&&(
                <div style={{marginBottom:12}}>
                  <div style={{fontSize:9,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",letterSpacing:2,marginBottom:6,textTransform:"uppercase"}}>NPC</div>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                    {ACOMODACOES[addAcomoKey].npcs.map(n=>(
                      <div key={n.carta} onClick={()=>setAddAcomoNpcCarta(n.carta)} style={{border:`1px solid ${addAcomoNpcCarta===n.carta?C.silver:C.border}`,background:addAcomoNpcCarta===n.carta?C.bg3:"transparent",padding:"10px 14px",cursor:"pointer",maxWidth:220}}>
                        <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:12,color:addAcomoNpcCarta===n.carta?C.white:C.grayDark,marginBottom:4}}>{n.carta} — {n.nome}</div>
                        <div style={{fontSize:9,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",lineHeight:1.7}}>
                          <div><span style={{color:"#c09040"}}>Bônus:</span> {n.bonus}</div>
                          <div><span style={{color:C.silver}}>Bônus+:</span> {n.bonusPlus}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {addAcomoNpcCarta&&(
                <div style={{marginBottom:12}}>
                  <div style={{fontSize:9,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",letterSpacing:2,marginBottom:4,textTransform:"uppercase"}}>Nome do NPC (opcional)</div>
                  <input value={addAcomoNome} onChange={e=>setAddAcomoNome(e.target.value)} placeholder={ACOMODACOES[addAcomoKey]?.npcs.find(n=>n.carta===addAcomoNpcCarta)?.nome||"Nome..."}
                    style={{background:"transparent",border:"none",borderBottom:`1px solid ${C.border}`,color:C.white,fontFamily:"'Inter',system-ui,sans-serif",fontSize:13,width:"100%",outline:"none",padding:"2px 0"}}/>
                </div>
              )}

              <div style={{display:"flex",gap:8}}>
                <button onClick={addAcomodacao} disabled={!addAcomoKey||!addAcomoNpcCarta} style={{background:"transparent",border:`1px solid ${addAcomoKey&&addAcomoNpcCarta?C.silver:C.border}`,color:addAcomoKey&&addAcomoNpcCarta?C.silver:C.grayDark,fontFamily:"'Playfair Display',Georgia,serif",fontSize:10,letterSpacing:3,textTransform:"uppercase",padding:"6px 18px",cursor:addAcomoKey&&addAcomoNpcCarta?"pointer":"not-allowed"}}>Confirmar</button>
                <button onClick={()=>{setShowAddAcomo(false);setAddAcomoKey(null);setAddAcomoNpcCarta(null);setAddAcomoNome("");}} style={{background:"transparent",border:`1px solid ${C.border}`,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",fontSize:10,padding:"6px 14px",cursor:"pointer"}}>Cancelar</button>
              </div>
            </div>
          )}

          {/* Lista de acomodações existentes */}
          {(bando.acomodacoes||[]).length===0&&(
            <div style={{fontSize:11,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",padding:"20px 0"}}>
              Nenhum NPC no bando ainda. Adicione a primeira Acomodação acima.
            </div>
          )}
          {(bando.acomodacoes||[]).map(a=>{
            const acomoData = ACOMODACOES[a.acomodacao_key];
            const npcData = acomoData?.npcs.find(n=>n.carta===a.npc_carta);
            return (
              <div key={a.id} style={{border:`1px solid ${a.missaoResolvida?"#3a5a3a":C.border}`,background:a.missaoResolvida?"#0a140a":C.bg2,padding:"14px 16px",marginBottom:6}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10,marginBottom:8,flexWrap:"wrap"}}>
                  <div>
                    <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:14,color:C.white,marginBottom:2}}>
                      {a.npc_nome||npcData?.nome} <span style={{fontSize:10,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif"}}>{a.npc_carta} · {a.acomodacao_key}</span>
                    </div>
                    {a.missaoResolvida&&<span style={{fontSize:9,color:"#50c050",fontFamily:"'Inter',system-ui,sans-serif",letterSpacing:2}}>✓ MISSÃO RESOLVIDA — BÔNUS+ ATIVO</span>}
                  </div>
                  <div style={{display:"flex",gap:6}}>
                    <button onClick={()=>toggleMissao(a.id)} style={{background:"transparent",border:`1px solid ${a.missaoResolvida?"#50c050":C.border2}`,color:a.missaoResolvida?"#50c050":C.silverDim,fontFamily:"'Inter',system-ui,sans-serif",fontSize:9,padding:"3px 10px",cursor:"pointer",letterSpacing:1}}>
                      {a.missaoResolvida?"✓ Missão OK":"○ Missão pendente"}
                    </button>
                    <button onClick={()=>removeAcomo(a.id)} style={{background:"transparent",border:`1px solid ${C.border}`,color:C.redDim,fontFamily:"'Inter',system-ui,sans-serif",fontSize:9,padding:"3px 8px",cursor:"pointer"}}
                      onMouseEnter={e=>e.currentTarget.style.color=C.red} onMouseLeave={e=>e.currentTarget.style.color=C.redDim}>✕</button>
                  </div>
                </div>
                {npcData&&(
                  <div style={{fontSize:10,fontFamily:"'Inter',system-ui,sans-serif",lineHeight:1.9}}>
                    <span style={{color:"#c09040"}}>Bônus:</span> <span style={{color:C.gray}}>{npcData.bonus}</span>
                    {a.missaoResolvida&&<div><span style={{color:C.silver}}>Bônus+:</span> <span style={{color:C.gray}}>{npcData.bonusPlus}</span></div>}
                  </div>
                )}
                <textarea value={a.anotacoes||""} onChange={e=>upd("acomodacoes",bando.acomodacoes.map(x=>x.id===a.id?{...x,anotacoes:e.target.value}:x))}
                  placeholder="Histórico, missões, anotações..."
                  style={{width:"100%",minHeight:40,background:"transparent",border:"none",borderTop:`1px solid ${C.bg3}`,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",fontSize:10,padding:"6px 0",outline:"none",resize:"none",marginTop:8,boxSizing:"border-box"}}/>
              </div>
            );
          })}
        </div>
      )}

      {/* ── TAB 2: FASE DE BANDO ────────────────────────────────────── */}
      {tab===2&&(
        <div>
          <div style={{fontSize:11,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",lineHeight:1.9,marginBottom:16}}>
            A Fase de Bando acontece quando a gangue fica na Base por ~3 dias. Puxe uma carta do baralho por Notoriedade atual ({bando.notoriedade} carta{bando.notoriedade>1?"s":""}). A-6 = tranquila · J/Q/K = missão de NPC · 7-10 = evento.
          </div>

          <button onClick={puxarCartas} style={{background:"transparent",border:`1px solid ${C.silver}`,color:C.silver,fontFamily:"'Playfair Display',Georgia,serif",fontSize:11,letterSpacing:4,textTransform:"uppercase",padding:"10px 24px",cursor:"pointer",marginBottom:20,display:"block"}}>
            🃏 Puxar {bando.notoriedade} Carta{bando.notoriedade>1?"s":""} da Fase
          </button>

          {faseBandoCartas.length>0&&(
            <div>
              <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:20}}>
                {faseBandoCartas.map((c,i)=>(
                  <div key={i} style={{border:`1px solid ${c.tipo==="missao_npc"?"#8b7030":c.tipo==="evento"?"#1a4a8a":c.tipo==="sina_comunitaria"?"#3a1a6a":C.border}`,background:c.tipo==="missao_npc"?"#1a1200":c.tipo==="evento"?"#000d1a":c.tipo==="sina_comunitaria"?"#0a001a":C.bg3,padding:"16px 20px",minWidth:160}}>
                    <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:32,color:cardColFase(c),marginBottom:6}}>{c.display}</div>
                    <div style={{fontSize:9,letterSpacing:2,fontFamily:"'Inter',system-ui,sans-serif",textTransform:"uppercase",color:c.tipo==="missao_npc"?"#c09040":c.tipo==="evento"?"#4070c0":c.tipo==="sina_comunitaria"?"#9040c0":C.grayDark,marginBottom:6}}>
                      {c.tipo==="tranquila"?"Fase Tranquila":c.tipo==="missao_npc"?"Missão de NPC":c.tipo==="evento"?"Evento na Base":c.tipo==="sina_comunitaria"?"Carta de Sina Comunitária":""}
                    </div>
                    {/* Evento: mostrar efeito */}
                    {c.tipo==="evento"&&EVENTOS_BANDO[c.rank]&&(
                      <div style={{fontSize:11,color:C.gray,fontFamily:"'Inter',system-ui,sans-serif",lineHeight:1.8}}>
                        {EVENTOS_BANDO[c.rank][c.suit]||"Consulte a tabela de eventos."}
                      </div>
                    )}
                    {c.tipo==="missao_npc"&&(
                      <div style={{fontSize:10,color:"#c09040",fontFamily:"'Inter',system-ui,sans-serif",lineHeight:1.8}}>
                        NPC com carta {c.rank} terá uma missão. Veja aba Missões NPC para gerar.
                      </div>
                    )}
                    {c.tipo==="sina_comunitaria"&&(
                      <div style={{fontSize:10,color:"#9040c0",fontFamily:"'Inter',system-ui,sans-serif",lineHeight:1.8}}>
                        Qualquer membro do bando pode usá-la. Puxe outra carta para saber o que acontece na Fase.
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <SectionTitle>Log de Fases</SectionTitle>
          <div style={{maxHeight:200,overflowY:"auto"}}>
            {(bando.log||[]).filter(e=>e.msg.startsWith("🃏")||(e.msg&&false)).map((e,i)=>(
              <div key={i} style={{display:"flex",gap:10,fontSize:11,fontFamily:"'Inter',system-ui,sans-serif",padding:"3px 0",borderBottom:`1px solid ${C.bg3}`,color:C.gray}}>
                <span style={{color:C.grayDark,flexShrink:0}}>{e.ts}</span>
                <span>{e.msg}</span>
              </div>
            ))}
            {(bando.log||[]).filter(e=>e.msg.startsWith("🃏")).length===0&&(
              <div style={{fontSize:11,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif"}}>Nenhuma Fase de Bando registrada ainda.</div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: MISSÕES DE NPC ───────────────────────────────────── */}
      {tab===3&&(
        <div>
          <div style={{fontSize:11,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",lineHeight:1.9,marginBottom:16}}>
            Quando a carta de um NPC é puxada na Fase de Bando, gere a missão dele aqui. Puxe 3 cartas — uma por coluna (Quem, Preciso, Reviravolta).
          </div>
          <button onClick={()=>setMissaoGerada(gerarMissaoNPC())} style={{background:"transparent",border:`1px solid ${C.silver}`,color:C.silver,fontFamily:"'Playfair Display',Georgia,serif",fontSize:11,letterSpacing:4,textTransform:"uppercase",padding:"10px 24px",cursor:"pointer",marginBottom:20,display:"block"}}>
            🎲 Gerar Missão de NPC
          </button>

          {missaoGerada&&(
            <div style={{border:`1px solid #8b7030`,background:"#1a1200",padding:"20px 24px",marginBottom:20}}>
              <div style={{fontSize:9,color:"#c09040",fontFamily:"'Inter',system-ui,sans-serif",letterSpacing:3,textTransform:"uppercase",marginBottom:12}}>
                Cartas puxadas: {missaoGerada.cartas.join(" · ")}
              </div>
              <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:22,color:C.white,lineHeight:1.6,marginBottom:12}}>
                {missaoGerada.preciso} a/o<br/>
                <span style={{color:"#c09040"}}>{missaoGerada.quem}</span><br/>
                <span style={{fontSize:16,color:C.gray}}>que {missaoGerada.reviravolta.toLowerCase()}.</span>
              </div>
              <button onClick={()=>{addLog(`📋 Missão gerada: "${missaoGerada.preciso} ${missaoGerada.quem.toLowerCase()}" — ${missaoGerada.reviravolta}`);}} style={{background:"transparent",border:`1px solid ${C.border2}`,color:C.silverDim,fontFamily:"'Inter',system-ui,sans-serif",fontSize:9,padding:"4px 12px",cursor:"pointer",letterSpacing:1}}>Registrar no Log</button>
            </div>
          )}

          <SectionTitle>Tabela de Referência</SectionTitle>
          <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
            {[["Quem",MISSAO_QUEM],["Preciso",MISSAO_PRECISO],["Reviravolta",MISSAO_REVIRAVOLTA]].map(([titulo,lista])=>(
              <div key={titulo} style={{flex:"1 1 180px"}}>
                <div style={{fontSize:9,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>{titulo}</div>
                {lista.map((item,i)=>(
                  <div key={i} style={{fontSize:11,color:C.gray,fontFamily:"'Inter',system-ui,sans-serif",padding:"2px 0",borderBottom:`1px solid ${C.bg3}`}}>
                    <span style={{color:C.grayDark,marginRight:6,fontSize:9}}>{["A","2","3","4","5","6","7","8","9","10","J","Q","K"][i]}</span>
                    {item}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Library({chars,onSelect,onCreate,onDelete,onImport}) {
  const [deleteTarget,setDeleteTarget]=useState(null);
  const [importError,setImportError]=useState("");
  const fileRef=useRef();

  const exportChar=(c,e)=>{
    e.stopPropagation();
    const data=JSON.stringify(c,null,2);
    const blob=new Blob([data],{type:"application/json"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;
    a.download=`${(c.nome||"personagem").replace(/[^a-z0-9]/gi,"_").toLowerCase()}_prata_chumbo.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportAll=(e)=>{
    e.stopPropagation();
    const data=JSON.stringify({versao:"prata_chumbo_v1",fichas:chars},null,2);
    const blob=new Blob([data],{type:"application/json"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;
    a.download=`prata_chumbo_backup_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile=(e)=>{
    const file=e.target.files[0];
    if(!file)return;
    setImportError("");
    const reader=new FileReader();
    reader.onload=(ev)=>{
      try{
        const parsed=JSON.parse(ev.target.result);
        // Single char or backup file
        if(parsed.versao==="prata_chumbo_v1"&&Array.isArray(parsed.fichas)){
          parsed.fichas.forEach(c=>{
            const newChar={...createBlankChar(),...c,id:Date.now()+Math.random()};
            onImport(newChar);
          });
          setImportError(`✓ ${parsed.fichas.length} ficha(s) importada(s) com sucesso.`);
        } else if(parsed.id&&parsed.nome!==undefined){
          const newChar={...createBlankChar(),...parsed,id:Date.now()+Math.random()};
          onImport(newChar);
          setImportError(`✓ Ficha "${parsed.nome||"sem nome"}" importada com sucesso.`);
        } else {
          setImportError("✗ Arquivo inválido — não é uma ficha de Prata & Chumbo.");
        }
      }catch{
        setImportError("✗ Erro ao ler o arquivo. Certifique-se que é um JSON válido.");
      }
      e.target.value="";
    };
    reader.readAsText(file);
  };

  return (
    <div style={{maxWidth:820,margin:"0 auto"}}>
      {deleteTarget&&(
        <DeleteModal charName={deleteTarget.nome} onConfirm={()=>{onDelete(deleteTarget.id);setDeleteTarget(null);}} onCancel={()=>setDeleteTarget(null)}/>
      )}
      <div style={{marginBottom:28,display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
        <button onClick={onCreate} style={{background:"transparent",border:`1px solid ${C.silver}`,color:C.silver,fontFamily:"'Playfair Display',Georgia,serif",fontSize:10,letterSpacing:3,textTransform:"uppercase",padding:"8px 22px",cursor:"pointer"}}
          onMouseEnter={e=>e.currentTarget.style.background=C.bg3}
          onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
          + Nova Ficha
        </button>
        <input ref={fileRef} type="file" accept=".json" onChange={handleImportFile} style={{display:"none"}}/>
        <button onClick={()=>fileRef.current.click()} style={{background:"transparent",border:`1px solid ${C.border2}`,color:C.silverDim,fontFamily:"'Inter',system-ui,sans-serif",fontSize:9,letterSpacing:2,textTransform:"uppercase",padding:"7px 16px",cursor:"pointer"}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor=C.silver;e.currentTarget.style.color=C.white;}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border2;e.currentTarget.style.color=C.silverDim;}}>
          ↑ Importar JSON
        </button>
        {chars.length>0&&(
          <button onClick={exportAll} style={{background:"transparent",border:`1px solid ${C.border2}`,color:C.silverDim,fontFamily:"'Inter',system-ui,sans-serif",fontSize:9,letterSpacing:2,textTransform:"uppercase",padding:"7px 16px",cursor:"pointer"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=C.silver;e.currentTarget.style.color=C.white;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border2;e.currentTarget.style.color=C.silverDim;}}>
            ↓ Backup Completo
          </button>
        )}
      </div>
      {importError&&(
        <div style={{padding:"8px 14px",marginBottom:16,border:`1px solid ${importError.startsWith("✓")?"#3a5a3a":C.redDim}`,background:importError.startsWith("✓")?"#0a140a":"#1a0000",fontFamily:"'Inter',system-ui,sans-serif",fontSize:11,color:importError.startsWith("✓")?"#50c050":C.red,letterSpacing:1}}>
          {importError}
        </div>
      )}
      {chars.length===0&&(
        <div style={{textAlign:"center",padding:"80px 0",color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",fontSize:13,letterSpacing:2}}>
          Nenhum personagem ainda.<br/><span style={{fontSize:11,color:C.border2}}>Comece criando uma nova ficha ou importe um JSON.</span>
        </div>
      )}
      <div style={{display:"flex",flexDirection:"column",gap:2}}>
        {chars.map(c=>{
          const condAtivas=(c.circulosDorAtivos||[]).length;
          return (
            <div key={c.id} style={{display:"flex",alignItems:"center",gap:16,padding:"14px 16px",border:`1px solid ${C.border}`,background:C.bg1,transition:"background 0.15s"}}
              onMouseEnter={e=>e.currentTarget.style.background=C.bg2}
              onMouseLeave={e=>e.currentTarget.style.background=C.bg1}>
              {c.imagem
                ?<div style={{width:44,height:52,background:`url(${c.imagem}) center/cover`,flexShrink:0}}/>
                :<div style={{width:44,height:52,border:`1px dashed ${C.border}`,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:18,color:C.border2}}>✦</span></div>
              }
              <div style={{flex:1,cursor:"pointer"}} onClick={()=>onSelect(c)}>
                <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:15,color:C.white}}>
                  {c.nome||<span style={{color:C.grayDark}}>Sem nome</span>}
                </div>
                <div style={{fontSize:11,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",marginTop:2,display:"flex",gap:10,flexWrap:"wrap"}}>
                  <span>{c.conceito||"—"} · Nv.{c.nivel} · ${c.dinheiro}</span>
                  {c.honra!==0&&<span style={{color:c.honra>0?C.silverDim:C.redDim}}>{c.honra>0?"+":""}{c.honra} honra</span>}
                  {condAtivas>0&&<span style={{color:C.red}}>● {condAtivas} condição{condAtivas>1?"s":""} ativa{condAtivas>1?"s":""}</span>}
                </div>
              </div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                <button onClick={()=>onSelect(c)} style={{background:"transparent",border:`1px solid ${C.border}`,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",fontSize:10,padding:"4px 12px",cursor:"pointer",letterSpacing:1}}>Abrir</button>
                <button onClick={(e)=>exportChar(c,e)} style={{background:"transparent",border:`1px solid ${C.border}`,color:C.silverDim,fontFamily:"'Inter',system-ui,sans-serif",fontSize:10,padding:"4px 10px",cursor:"pointer",letterSpacing:1}}
                  title="Exportar esta ficha como JSON"
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=C.silver;e.currentTarget.style.color=C.white;}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.silverDim;}}>↓</button>
                <button onClick={()=>setDeleteTarget(c)} style={{background:"transparent",border:`1px solid ${C.border}`,color:C.redDim,fontFamily:"'Inter',system-ui,sans-serif",fontSize:10,padding:"4px 12px",cursor:"pointer"}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=C.red;e.currentTarget.style.color=C.red;}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.redDim;}}>
                  Excluir
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── SISTEMA DE CAMPANHA ──────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

const saveCampaignLocal = (c) => { try { localStorage.setItem("sacr_campaign", JSON.stringify(c)); } catch(e){} };
const loadCampaignLocal = () => { try { const r = localStorage.getItem("sacr_campaign"); return r ? JSON.parse(r) : null; } catch { return null; } };

// Gera um ID de campanha de 6 chars alfanuméricos maiúsculos
const genCampaignId = () => Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,6).padEnd(6,"X");

// Valor numérico de uma carta para ordenação de iniciativa
// Ás=14, K=13, Q=12, J=11, 10..2 = 10..2, Coringa=0
const CARD_VALUE = {
  "A":14,"K":13,"Q":12,"J":11,
  "10":10,"9":9,"8":8,"7":7,"6":6,"5":5,"4":4,"3":3,"2":2,"🃏":0,
};
const CARD_SUITS = ["♠","♥","♦","♣"];
const CARD_RANKS = ["A","K","Q","J","10","9","8","7","6","5","4","3","2","🃏"];
const CARD_SPECIAL_BONUS = {
  "A": "+1 para Testes de Violência (se descartar → vai para o fim da Iniciativa)",
  "K": "+1 Movimento (se descartar → vai para o fim da Iniciativa)",
  "Q": "+1 Ação de Combate (se descartar → vai para o fim da Iniciativa)",
  "J": "+1 em qualquer teste (se descartar → vai para o fim da Iniciativa)",
};

const drawCard = () => {
  const rank = CARD_RANKS[Math.floor(Math.random() * CARD_RANKS.length)];
  if (rank === "🃏") return { rank:"🃏", suit:"", value:0, display:"🃏 Coringa" };
  const suit = CARD_SUITS[Math.floor(Math.random() * CARD_SUITS.length)];
  return { rank, suit, value: CARD_VALUE[rank], display:`${rank}${suit}` };
};

const cardColor = (card) => {
  if (!card) return C.grayDark;
  if (card.rank === "🃏") return C.silverDim;
  if (card.suit === "♥" || card.suit === "♦") return "#c04040";
  return C.white;
};

// ─── CARD VISUAL ─────────────────────────────────────────────────────────────
function CardVisual({ card, size = "md", discarded = false, onClick, style: sx = {} }) {
  if (!card) return null;
  const isJoker = card.rank === "🃏";
  const isSpecial = ["A","K","Q","J"].includes(card.rank);
  const col = discarded ? C.grayDark : cardColor(card);
  const sizes = { sm: { w:36, h:50, rf:14, sf:10 }, md: { w:52, h:72, rf:20, sf:13 }, lg: { w:70, h:96, rf:26, sf:16 } };
  const s = sizes[size] || sizes.md;
  return (
    <div onClick={onClick} style={{
      width:s.w, height:s.h, borderRadius:4, border:`1.5px solid ${discarded?C.border:isSpecial?"#8b7030":col==="transparent"?C.border:C.border2}`,
      background: discarded ? C.bg3 : isSpecial ? "#1a1508" : C.bg2,
      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
      cursor: onClick ? "pointer" : "default", flexShrink:0, position:"relative", transition:"all 0.15s",
      boxShadow: !discarded && isSpecial ? `0 0 8px #8b703040` : "none",
      opacity: discarded ? 0.45 : 1,
      ...sx,
    }}>
      {isJoker ? (
        <span style={{fontSize:s.rf, lineHeight:1}}>🃏</span>
      ) : (
        <>
          <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:s.rf,color:col,lineHeight:1,fontWeight:"bold"}}>{card.rank}</div>
          <div style={{fontFamily:"'Inter',system-ui,sans-serif",fontSize:s.sf,color:col,lineHeight:1,marginTop:2}}>{card.suit}</div>
        </>
      )}
      {discarded && <div style={{position:"absolute",bottom:2,fontSize:7,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",letterSpacing:1,textTransform:"uppercase"}}>fim</div>}
    </div>
  );
}

// ─── COMBATANT ROW ────────────────────────────────────────────────────────────
function CombatantRow({ combatant, isActive, onUpdate, onRemove, roundNum }) {
  const [expanded, setExpanded] = useState(false);
  const c = combatant;
  const isNpc = c.type === "npc";
  const hasSpecial = c.card && ["A","K","Q","J"].includes(c.card.rank) && !c.cardDiscarded;
  const isJoker = c.card && c.card.rank === "🃏";

  const upd = (patch) => onUpdate({ ...c, ...patch });
  const handleDraw = () => upd({ card: drawCard(), cardDiscarded: false });
  const handleDiscard = () => upd({ cardDiscarded: true });
  const handleDrawTwo = () => {
    const a = drawCard(), b = drawCard();
    upd({ card: a, card2: b, cardDiscarded: false });
  };

  const vida = c.vidaAtual ?? c.vidaBase ?? 6;
  const vidaMax = c.vidaBase ?? 6;
  const acoes = c.acoes ?? 1;
  const movs = c.movimentos ?? 1;
  const defesa = c.defesa ?? 5;

  const rowBg = isActive ? "#ffffff08" : "transparent";
  const borderLeft = isActive ? `3px solid ${C.silver}` : `3px solid transparent`;

  return (
    <div style={{borderLeft, background:rowBg, transition:"all 0.15s", marginBottom:2}}>
      {/* ── Linha principal ── */}
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",flexWrap:"wrap"}}>

        {/* Ordem / ativo */}
        <div style={{width:28,height:28,borderRadius:"50%",border:`1.5px solid ${isActive?C.silver:C.border}`,background:isActive?C.silver:"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:isActive?C.bg:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",fontWeight:"bold",flexShrink:0}}>
          {c.ordem||"—"}
        </div>

        {/* Carta */}
        <div style={{display:"flex",gap:4,alignItems:"center",flexShrink:0}}>
          {c.card
            ? <CardVisual card={c.card} size="sm" discarded={c.cardDiscarded}/>
            : <div style={{width:36,height:50,border:`1px dashed ${C.border2}`,borderRadius:4,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",letterSpacing:1,textAlign:"center"}}>sem carta</div>
          }
          {c.card2 && <CardVisual card={c.card2} size="sm" discarded={c.cardDiscarded}/>}
        </div>

        {/* Nome + tipo */}
        <div style={{flex:1,minWidth:120}}>
          <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:14,color:c.incapaz?C.grayDark:C.white,textDecoration:c.incapaz?"line-through":"none"}}>
            {c.nome||"—"}
            {isNpc&&<span style={{marginLeft:6,fontSize:9,color:C.grayDark,letterSpacing:2,fontFamily:"'Inter',system-ui,sans-serif"}}>NdC {c.ndc||1}</span>}
          </div>
          {/* Condições ativas */}
          {(c.condicoes||[]).length>0&&(
            <div style={{display:"flex",gap:3,flexWrap:"wrap",marginTop:3}}>
              {c.condicoes.map(num=>{
                const cd=CIRCULOS_DOR.find(x=>x.num===num);
                return cd ? <span key={num} style={{fontSize:9,padding:"1px 5px",border:`1px solid ${cd.cor}`,color:cd.cor,fontFamily:"'Inter',system-ui,sans-serif",borderRadius:2}}>{cd.nome}</span> : null;
              })}
            </div>
          )}
        </div>

        {/* Vida */}
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:1,flexShrink:0}}>
          <span style={{fontSize:8,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",letterSpacing:1,textTransform:"uppercase"}}>Vida</span>
          <div style={{display:"flex",alignItems:"center",gap:4}}>
            <button onClick={()=>upd({vidaAtual:Math.max(0,vida-1)})} style={{...btnSm,width:20,height:20,fontSize:12}}>−</button>
            <span style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:18,color:vida<=2?C.red:vida<=vidaMax*0.5?"#c07020":C.white,width:36,textAlign:"center"}}>{vida}/{vidaMax}</span>
            <button onClick={()=>upd({vidaAtual:Math.min(vidaMax,vida+1)})} style={{...btnSm,width:20,height:20,fontSize:12}}>+</button>
          </div>
        </div>

        {/* Dor dots */}
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,flexShrink:0}}>
          <span style={{fontSize:8,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",letterSpacing:1,textTransform:"uppercase"}}>Dor</span>
          <div style={{display:"flex",gap:3}}>
            {[1,2,3,4,5,6].map(n=>{
              const ativo=(c.circulosDor||0)>=n;
              return <div key={n} onClick={()=>upd({circulosDor:c.circulosDor===n?n-1:n})} style={{width:10,height:10,borderRadius:"50%",border:`1.5px solid ${ativo?"#c04040":C.border}`,background:ativo?"#c04040":"transparent",cursor:"pointer",transition:"all 0.1s"}}/>;
            })}
          </div>
        </div>

        {/* Botões ação */}
        <div style={{display:"flex",gap:4,flexShrink:0}}>
          <button onClick={handleDraw} title="Puxar carta" style={{...btnSm,width:28,height:28,fontSize:11,color:C.silverDim}}>🎴</button>
          {hasSpecial&&<button onClick={handleDiscard} title="Descartar → ir para o fim" style={{...btnSm,width:28,height:28,fontSize:11,color:"#c07020"}}>↓</button>}
          <button onClick={()=>setExpanded(e=>!e)} style={{...btnSm,width:28,height:28,fontSize:11}}>{expanded?"▲":"▼"}</button>
          <button onClick={onRemove} style={{...btnSm,width:28,height:28,fontSize:11,color:C.redDim}} onMouseEnter={e=>e.currentTarget.style.color=C.red} onMouseLeave={e=>e.currentTarget.style.color=C.redDim}>✕</button>
        </div>

        {/* Status badge */}
        {c.incapaz&&<span style={{fontSize:9,padding:"2px 6px",border:`1px solid ${C.redDim}`,color:C.redDim,fontFamily:"'Inter',system-ui,sans-serif",letterSpacing:1}}>INCAPAZ</span>}
        {c.perdeuTurno&&<span style={{fontSize:9,padding:"2px 6px",border:`1px solid #c07020`,color:"#c07020",fontFamily:"'Inter',system-ui,sans-serif",letterSpacing:1}}>PERDE TURNO</span>}
      </div>

      {/* Bônus carta especial */}
      {hasSpecial&&!isJoker&&(
        <div style={{padding:"4px 12px 4px 52px",fontSize:10,color:"#c07030",fontFamily:"'Inter',system-ui,sans-serif",lineHeight:1.4,fontStyle:"italic"}}>
          ✦ {CARD_SPECIAL_BONUS[c.card.rank]}
        </div>
      )}
      {isJoker&&(
        <div style={{padding:"4px 12px 4px 52px",fontSize:10,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",lineHeight:1.4}}>
          🃏 Coringa — valor nulo, age por último (ou antes do último a critério do Juiz)
        </div>
      )}

      {/* Painel expandido */}
      {expanded&&(
        <div style={{borderTop:`1px solid ${C.bg3}`,padding:"10px 12px",display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:12}}>
          {/* Stats rápidos */}
          <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:8,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",letterSpacing:1,marginBottom:2}}>DEFESA</div>
              <div style={{display:"flex",gap:3}}>
                <button onClick={()=>upd({defesa:(defesa||5)-1})} style={{...btnSm,width:18,height:18,fontSize:10}}>−</button>
                <span style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:16,color:C.white,width:24,textAlign:"center"}}>{defesa}</span>
                <button onClick={()=>upd({defesa:(defesa||5)+1})} style={{...btnSm,width:18,height:18,fontSize:10}}>+</button>
              </div>
            </div>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:8,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",letterSpacing:1,marginBottom:2}}>AÇÕES</div>
              <div style={{display:"flex",gap:3}}>
                <button onClick={()=>upd({acoes:Math.max(0,(acoes||1)-1)})} style={{...btnSm,width:18,height:18,fontSize:10}}>−</button>
                <span style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:16,color:C.white,width:24,textAlign:"center"}}>{acoes}</span>
                <button onClick={()=>upd({acoes:(acoes||1)+1})} style={{...btnSm,width:18,height:18,fontSize:10}}>+</button>
              </div>
            </div>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:8,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",letterSpacing:1,marginBottom:2}}>MOV.</div>
              <div style={{display:"flex",gap:3}}>
                <button onClick={()=>upd({movimentos:Math.max(0,(movs||1)-1)})} style={{...btnSm,width:18,height:18,fontSize:10}}>−</button>
                <span style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:16,color:C.white,width:24,textAlign:"center"}}>{movs}</span>
                <button onClick={()=>upd({movimentos:(movs||1)+1})} style={{...btnSm,width:18,height:18,fontSize:10}}>+</button>
              </div>
            </div>
          </div>

          {/* Cobertura */}
          <div>
            <div style={{fontSize:8,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",letterSpacing:1,marginBottom:4,textTransform:"uppercase"}}>Cobertura</div>
            <div style={{display:"flex",gap:4}}>
              {[["Nenhuma",0],["Parcial",1],["Completa",2]].map(([lbl,val])=>(
                <button key={lbl} onClick={()=>upd({cobertura:val})} style={{background:c.cobertura===val?C.bg3:"transparent",border:`1px solid ${c.cobertura===val?C.silver:C.border}`,color:c.cobertura===val?C.white:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",fontSize:9,padding:"3px 6px",cursor:"pointer",letterSpacing:0.5}}>{lbl}</button>
              ))}
            </div>
            {c.cobertura>0&&<div style={{fontSize:9,color:C.silverDim,fontFamily:"'Inter',system-ui,sans-serif",marginTop:3}}>Defesa efetiva: {(defesa||5)+(c.cobertura||0)}</div>}
          </div>

          {/* Condições de Dor */}
          <div style={{gridColumn:"1/-1"}}>
            <div style={{fontSize:8,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",letterSpacing:1,marginBottom:6,textTransform:"uppercase"}}>Condições de Combate</div>
            <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
              {CIRCULOS_DOR.map(cd=>{
                const ativo=(c.condicoes||[]).includes(cd.num);
                return (
                  <button key={cd.num} onClick={()=>{
                    const cur=c.condicoes||[];
                    upd({condicoes:ativo?cur.filter(n=>n!==cd.num):[...cur,cd.num]});
                  }} style={{
                    background:ativo?`${cd.cor}22`:"transparent",border:`1px solid ${ativo?cd.cor:C.border}`,
                    color:ativo?cd.cor:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",fontSize:9,
                    padding:"3px 7px",cursor:"pointer",letterSpacing:0.5,transition:"all 0.1s",
                  }}>{cd.num}·{cd.nome}</button>
                );
              })}
            </div>
          </div>

          {/* Status */}
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {[["incapaz","INCAPAZ",C.red],["perdeuTurno","PERDE TURNO","#c07020"],["fugiu","FUGIU",C.grayDark]].map(([k,lbl,col])=>(
              <button key={k} onClick={()=>upd({[k]:!c[k]})} style={{background:c[k]?`${col}22`:"transparent",border:`1px solid ${c[k]?col:C.border}`,color:c[k]?col:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",fontSize:9,padding:"3px 8px",cursor:"pointer",letterSpacing:1}}>{lbl}</button>
            ))}
          </div>

          {/* Notas de combate */}
          <div style={{gridColumn:"1/-1"}}>
            <div style={{fontSize:8,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",letterSpacing:1,marginBottom:3,textTransform:"uppercase"}}>Notas de Combate</div>
            <input value={c.notasCombate||""} onChange={e=>upd({notasCombate:e.target.value})} placeholder="efeitos, apostas, status especial..."
              style={{background:"transparent",border:"none",borderBottom:`1px solid ${C.border}`,color:C.white,fontFamily:"'Inter',system-ui,sans-serif",fontSize:12,width:"100%",outline:"none",padding:"2px 0"}}/>
          </div>

          {/* Ações rápidas */}
          {isNpc&&(
            <div>
              <div style={{fontSize:8,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",letterSpacing:1,marginBottom:4,textTransform:"uppercase"}}>NPC Rápido — NdC</div>
              <div style={{display:"flex",gap:4,alignItems:"center"}}>
                <button onClick={()=>upd({ndc:Math.max(1,(c.ndc||1)-1)})} style={{...btnSm,width:20,height:20,fontSize:11}}>−</button>
                <span style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:16,color:C.white,width:20,textAlign:"center"}}>{c.ndc||1}</span>
                <button onClick={()=>upd({ndc:Math.min(6,(c.ndc||1)+1)})} style={{...btnSm,width:20,height:20,fontSize:11}}>+</button>
              </div>
              <div style={{fontSize:9,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",marginTop:4,lineHeight:1.6}}>
                Vida: {(c.ndc||1)*3} · Ações: {(c.ndc||1)+1} · Teste: 1d6+{c.ndc||1}
              </div>
            </div>
          )}
          {/* Carta dupla (Coldre de Sabão) */}
          <div>
            <div style={{fontSize:8,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",letterSpacing:1,marginBottom:4,textTransform:"uppercase"}}>Coldre de Sabão</div>
            <button onClick={handleDrawTwo} style={{background:"transparent",border:`1px solid ${C.border}`,color:C.silverDim,fontFamily:"'Inter',system-ui,sans-serif",fontSize:9,padding:"4px 10px",cursor:"pointer",letterSpacing:1}}>
              Puxar 2 cartas
            </button>
            {c.card&&c.card2&&<div style={{marginTop:4,display:"flex",gap:4}}>
              <button onClick={()=>upd({card:c.card,card2:undefined})} style={{...btnSm,fontSize:9,width:"auto",padding:"2px 8px"}}>Usar {c.card.display}</button>
              <button onClick={()=>upd({card:c.card2,card2:undefined})} style={{...btnSm,fontSize:9,width:"auto",padding:"2px 8px"}}>Usar {c.card2.display}</button>
            </div>}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── TRACKER DE COMBATE ───────────────────────────────────────────────────────
function CombatTracker({ chars, onClose }) {
  const [combatants, setCombatants] = useState([]);
  const [rodada, setRodada] = useState(1);
  const [activeIdx, setActiveIdx] = useState(0);
  const [log, setLog] = useState([]);
  const [addNpcName, setAddNpcName] = useState("");
  const [addNpcNdc, setAddNpcNdc] = useState(1);
  const [addNpcQtd, setAddNpcQtd] = useState(1);
  const [showLog, setShowLog] = useState(false);
  const [showAddNpc, setShowAddNpc] = useState(false);
  const [showAddPj, setShowAddPj] = useState(false);
  const [critRoll, setCritRoll] = useState(null);
  const [showDuelo, setShowDuelo] = useState(false);
  const logRef = useRef();

  const addLog = (msg) => setLog(prev=>[{id:Date.now(),msg,ts:rodada},...prev].slice(0,80));

  // Ordena combatants por valor de carta (desc), descartados vão pro final
  const sortCombatants = (list) => {
    return [...list].sort((a,b)=>{
      if(a.incapaz&&!b.incapaz) return 1;
      if(!a.incapaz&&b.incapaz) return -1;
      if(a.cardDiscarded&&!b.cardDiscarded) return 1;
      if(!a.cardDiscarded&&b.cardDiscarded) return -1;
      const va = a.card ? a.card.value : -1;
      const vb = b.card ? b.card.value : -1;
      if(vb!==va) return vb-va;
      // Empate: NPC vence PJ
      if(a.type==="pj"&&b.type==="npc") return 1;
      if(a.type==="npc"&&b.type==="pj") return -1;
      return 0;
    }).map((c,i)=>({...c,ordem:i+1}));
  };

  const updCombatant = (id, data) => {
    setCombatants(prev=>{
      const next = prev.map(c=>c.id===id?{...c,...data}:c);
      return sortCombatants(next);
    });
  };

  const removeCombatant = (id) => {
    setCombatants(prev=>{
      const next=prev.filter(c=>c.id!==id);
      return sortCombatants(next);
    });
  };

  const addPjToCombat = (char) => {
    if(combatants.find(c=>c.charId===char.id)) return;
    const novo = {
      id: Date.now()+Math.random(),
      charId: char.id,
      type: "pj",
      nome: char.nome||"Sem nome",
      vidaBase: char.vidaBase||(6+(char.atributos?.Físico||0)),
      vidaAtual: char.vidaAtual||(6+(char.atributos?.Físico||0)),
      acoes: char.acoes||(1+(char.atributos?.Coragem||0)),
      movimentos: char.movimentos||(1+(char.atributos?.Velocidade||0)),
      defesa: char.defesa||5,
      circulosDor: (char.circulosDorAtivos||[]).length,
      condicoes: char.circulosDorAtivos||[],
      card:null, cardDiscarded:false, card2:null,
      cobertura:0, incapaz:false, perdeuTurno:false, fugiu:false, notasCombate:"",
      ordem:combatants.length+1,
    };
    setCombatants(prev=>sortCombatants([...prev,novo]));
    addLog(`⚔ ${novo.nome} entrou no combate`);
  };

  const addNpcGroup = () => {
    if(!addNpcName.trim()) return;
    const novos = [];
    for(let i=0;i<addNpcQtd;i++){
      const ndc = addNpcNdc;
      novos.push({
        id: Date.now()+Math.random()+i,
        type:"npc",
        nome: addNpcQtd>1?`${addNpcName} ${i+1}`:addNpcName,
        ndc,
        vidaBase: ndc*3,
        vidaAtual: ndc*3,
        acoes: ndc+1,
        movimentos: 1,
        defesa: 5,
        circulosDor: 0,
        condicoes:[],
        card:null, cardDiscarded:false, card2:null,
        cobertura:0, incapaz:false, perdeuTurno:false, fugiu:false, notasCombate:"",
        ordem:combatants.length+i+1,
      });
    }
    setCombatants(prev=>sortCombatants([...prev,...novos]));
    addLog(`🎲 ${addNpcQtd}x ${addNpcName} (NdC ${addNpcNdc}) entrou no combate`);
    setAddNpcName(""); setAddNpcQtd(1);
  };

  const drawAllCards = () => {
    setCombatants(prev=>{
      const next = prev.map(c=>({...c, card:drawCard(), cardDiscarded:false, card2:null}));
      const sorted = sortCombatants(next);
      addLog(`🃏 Rodada ${rodada} — cartas puxadas para todos`);
      return sorted;
    });
    setActiveIdx(0);
  };

  const nextTurn = () => {
    const active = combatants.filter(c=>!c.incapaz&&!c.fugiu);
    if(active.length===0) return;
    const currentInList = active.findIndex(c=>c.ordem===combatants[activeIdx]?.ordem);
    const nextInList = (currentInList+1)%active.length;
    const nextCombatant = active[nextInList];
    if(nextInList===0) {
      // Nova rodada
      setRodada(r=>r+1);
      addLog(`━━ Início da Rodada ${rodada+1} ━━`);
      // Limpar perdeuTurno
      setCombatants(prev=>prev.map(c=>({...c,perdeuTurno:false})));
    }
    const globalIdx = combatants.findIndex(c=>c.id===nextCombatant?.id);
    setActiveIdx(globalIdx>=0?globalIdx:0);
    if(nextCombatant) addLog(`→ Turno de ${nextCombatant.nome}`);
  };

  const rollCrit = (isCrit) => {
    const roll = Math.floor(Math.random()*6)+1;
    const critTable = {
      1:"Mortal: +2 Círculos de Vida de dano",
      2:"Desarmar: inimigo não pode mais atirar com aquela arma",
      3:"Vantagem Tática: +1 Movimento até o fim do combate",
      4:"Dança Maluca: inimigo perde próximo turno",
      5:"Vantagem Moral: +1 para Testes de Violência até o fim",
      6:"Marca da Vingança: inimigo foge mas jura vingança",
    };
    const failTable = {
      1:"Acertou um aliado ou pessoa inocente",
      2:"Guarda aberta: +1 em testes dos inimigos contra você",
      3:"Abatido: perde próximo turno para se recompor",
      4:"Arma quebra (ou dano anulado em corpo a corpo)",
      5:"Pressão: −1 no ataque contra inimigos até o fim",
      6:"Caiu igual bosta — perde 2 ações para se levantar",
    };
    const result = isCrit ? critTable[roll] : failTable[roll];
    setCritRoll({type:isCrit?"ACERTO CRÍTICO":"FALHA CRÍTICA",roll,result,isCrit});
    addLog(`${isCrit?"🎯 CRÍTICO":"💥 FALHA CRÍTICA"} (${roll}): ${result}`);
  };

  const rollDeath = () => {
    const roll = Math.floor(Math.random()*6)+1;
    const alive = roll===1||roll===6;
    addLog(`☠ Teste de Morte: ${roll} — ${alive?"SOBREVIVEU (recupera 3 Vida, gasta 1 Mov + 1 Ação)":"MORREU"}`);
    setCritRoll({type:"TESTE DE MORTE",roll,result:alive?"SOBREVIVEU! Recupera 3 Círculos de Vida (gaste 1 Mov + 1 Ação de Combate)":"MORREU. Sua alma vai para o limbo...",isCrit:alive});
  };

  const activeC = combatants[activeIdx];
  const nAtivos = combatants.filter(c=>!c.incapaz&&!c.fugiu).length;

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.97)",zIndex:2000,overflowY:"auto",display:"flex",flexDirection:"column"}}>
      {/* Header */}
      <div style={{borderBottom:`1px solid ${C.border}`,padding:"12px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,flexWrap:"wrap",gap:8,position:"sticky",top:0,background:"#000000f0",zIndex:10}}>
        <div style={{display:"flex",alignItems:"center",gap:16}}>
          <div>
            <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:14,letterSpacing:6,color:C.silver,textTransform:"uppercase"}}>Tracker de Combate</div>
            <div style={{fontSize:9,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",letterSpacing:2,marginTop:1}}>RODADA {rodada} · {nAtivos} COMBATENTES ATIVOS</div>
          </div>
          {activeC&&<div style={{padding:"6px 14px",border:`1px solid ${C.silver}`,background:C.bg3}}>
            <div style={{fontSize:8,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",letterSpacing:2,textTransform:"uppercase"}}>turno atual</div>
            <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:13,color:C.white,marginTop:1}}>{activeC.nome}</div>
          </div>}
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
          {/* Botões de dados rápidos */}
          <button onClick={()=>rollCrit(true)} style={{background:"transparent",border:`1px solid #8b7030`,color:"#c09040",fontFamily:"'Inter',system-ui,sans-serif",fontSize:9,padding:"5px 10px",cursor:"pointer",letterSpacing:1}}>🎯 CRÍTICO</button>
          <button onClick={()=>rollCrit(false)} style={{background:"transparent",border:`1px solid ${C.redDim}`,color:C.red,fontFamily:"'Inter',system-ui,sans-serif",fontSize:9,padding:"5px 10px",cursor:"pointer",letterSpacing:1}}>💥 FALHA</button>
          <button onClick={rollDeath} style={{background:"transparent",border:`1px solid ${C.border2}`,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",fontSize:9,padding:"5px 10px",cursor:"pointer",letterSpacing:1}}>☠ MORTE</button>
          <button onClick={()=>setShowLog(s=>!s)} style={{background:"transparent",border:`1px solid ${C.border}`,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",fontSize:9,padding:"5px 10px",cursor:"pointer",letterSpacing:1}}>📜 LOG</button>
          <button onClick={()=>setShowDuelo(true)} style={{background:"transparent",border:`1px solid #8b7030`,color:"#c09040",fontFamily:"'Inter',system-ui,sans-serif",fontSize:9,padding:"5px 10px",cursor:"pointer",letterSpacing:1}}>🃏 DUELO</button>
          <button onClick={onClose} style={{background:"transparent",border:`1px solid ${C.border}`,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",fontSize:10,padding:"5px 12px",cursor:"pointer",letterSpacing:1}}>✕ Fechar</button>
        </div>
      </div>

      <div style={{display:"flex",flex:1,overflow:"hidden"}}>
        {/* Painel principal */}
        <div style={{flex:1,overflowY:"auto",padding:"16px 20px"}}>

          {/* Resultado de crítico/morte */}
          {critRoll&&(
            <div style={{border:`1px solid ${critRoll.isCrit?"#8b7030":C.redDim}`,background:critRoll.isCrit?"#1a1200":"#200000",padding:"12px 16px",marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div>
                <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:11,letterSpacing:4,color:critRoll.isCrit?"#c09040":C.red,textTransform:"uppercase",marginBottom:4}}>{critRoll.type} — {critRoll.roll}</div>
                <div style={{fontFamily:"'Inter',system-ui,sans-serif",fontSize:13,color:C.white,lineHeight:1.6}}>{critRoll.result}</div>
              </div>
              <button onClick={()=>setCritRoll(null)} style={{background:"transparent",border:"none",color:C.grayDark,cursor:"pointer",fontSize:14,marginLeft:12,flexShrink:0}}>✕</button>
            </div>
          )}

          {/* Controles de rodada */}
          <div style={{display:"flex",gap:10,marginBottom:20,flexWrap:"wrap",alignItems:"center"}}>
            <button onClick={drawAllCards} style={{background:"transparent",border:`1px solid ${C.silver}`,color:C.silver,fontFamily:"'Playfair Display',Georgia,serif",fontSize:10,letterSpacing:3,textTransform:"uppercase",padding:"7px 18px",cursor:"pointer"}}>
              🃏 Puxar Cartas — Iniciativa
            </button>
            <button onClick={nextTurn} disabled={combatants.length===0} style={{background:combatants.length>0?C.bg3:"transparent",border:`1px solid ${combatants.length>0?C.border2:C.border}`,color:combatants.length>0?C.white:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",fontSize:10,letterSpacing:2,textTransform:"uppercase",padding:"7px 18px",cursor:combatants.length>0?"pointer":"not-allowed"}}>
              → Próximo Turno
            </button>
            <button onClick={()=>setRodada(1)} style={{background:"transparent",border:`1px solid ${C.border}`,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",fontSize:9,padding:"5px 10px",cursor:"pointer",letterSpacing:1}}>Resetar Rodada</button>
          </div>

          {/* Lista de combatentes */}
          {combatants.length===0 ? (
            <div style={{textAlign:"center",padding:"60px 0",color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",fontSize:12,letterSpacing:2}}>
              Nenhum combatente ainda.<br/><span style={{fontSize:10,color:C.border2}}>Adicione PJs e NPCs para começar.</span>
            </div>
          ) : (
            <div style={{border:`1px solid ${C.border}`,background:C.bg1}}>
              {combatants.map((c,i)=>(
                <CombatantRow
                  key={c.id}
                  combatant={c}
                  isActive={i===activeIdx}
                  onUpdate={(data)=>updCombatant(c.id,data)}
                  onRemove={()=>removeCombatant(c.id)}
                  roundNum={rodada}
                />
              ))}
            </div>
          )}

          {/* Adicionar PJs */}
          <div style={{marginTop:20}}>
            <button onClick={()=>setShowAddPj(s=>!s)} style={{background:"transparent",border:`1px solid ${C.border2}`,color:C.silverDim,fontFamily:"'Inter',system-ui,sans-serif",fontSize:10,padding:"6px 14px",cursor:"pointer",letterSpacing:2,marginRight:8}}>
              + Adicionar PJ
            </button>
            <button onClick={()=>setShowAddNpc(s=>!s)} style={{background:"transparent",border:`1px solid ${C.border2}`,color:C.silverDim,fontFamily:"'Inter',system-ui,sans-serif",fontSize:10,padding:"6px 14px",cursor:"pointer",letterSpacing:2}}>
              + Adicionar NPC
            </button>
          </div>

          {showAddPj&&(
            <div style={{border:`1px solid ${C.border}`,background:C.bg2,padding:"12px 16px",marginTop:8}}>
              <div style={{fontSize:10,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",letterSpacing:2,marginBottom:10,textTransform:"uppercase"}}>Selecionar Personagem</div>
              {chars.length===0 ? <div style={{color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",fontSize:12}}>Nenhuma ficha disponível.</div> : (
                <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                  {chars.map(ch=>{
                    const jaEsta=combatants.find(c=>c.charId===ch.id);
                    return (
                      <button key={ch.id} onClick={()=>{if(!jaEsta)addPjToCombat(ch);}} disabled={!!jaEsta} style={{background:jaEsta?C.bg3:"transparent",border:`1px solid ${jaEsta?C.silver:C.border2}`,color:jaEsta?C.grayDark:C.white,fontFamily:"'Inter',system-ui,sans-serif",fontSize:11,padding:"6px 14px",cursor:jaEsta?"default":"pointer",letterSpacing:1}}>
                        {ch.nome||"Sem nome"} {jaEsta?"✓":""}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {showAddNpc&&(
            <div style={{border:`1px solid ${C.border}`,background:C.bg2,padding:"12px 16px",marginTop:8,display:"flex",gap:12,flexWrap:"wrap",alignItems:"flex-end"}}>
              <div style={{flex:1,minWidth:140}}>
                <div style={{fontSize:8,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",letterSpacing:1,marginBottom:4,textTransform:"uppercase"}}>Nome do NPC/Grupo</div>
                <input value={addNpcName} onChange={e=>setAddNpcName(e.target.value)} placeholder="ex: Capanga, Pistoleiro..."
                  style={{background:"transparent",border:"none",borderBottom:`1px solid ${C.border}`,color:C.white,fontFamily:"'Inter',system-ui,sans-serif",fontSize:13,width:"100%",outline:"none",padding:"2px 0"}}/>
              </div>
              <div style={{minWidth:80}}>
                <div style={{fontSize:8,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",letterSpacing:1,marginBottom:4,textTransform:"uppercase"}}>NdC (1–6)</div>
                <div style={{display:"flex",gap:4,alignItems:"center"}}>
                  <button onClick={()=>setAddNpcNdc(n=>Math.max(1,n-1))} style={{...btnSm,width:22,height:22,fontSize:12}}>−</button>
                  <span style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:18,color:C.white,width:24,textAlign:"center"}}>{addNpcNdc}</span>
                  <button onClick={()=>setAddNpcNdc(n=>Math.min(6,n+1))} style={{...btnSm,width:22,height:22,fontSize:12}}>+</button>
                </div>
                <div style={{fontSize:8,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",marginTop:2}}>Vida:{addNpcNdc*3} Ações:{addNpcNdc+1}</div>
              </div>
              <div style={{minWidth:70}}>
                <div style={{fontSize:8,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",letterSpacing:1,marginBottom:4,textTransform:"uppercase"}}>Quantidade</div>
                <div style={{display:"flex",gap:4,alignItems:"center"}}>
                  <button onClick={()=>setAddNpcQtd(n=>Math.max(1,n-1))} style={{...btnSm,width:22,height:22,fontSize:12}}>−</button>
                  <span style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:18,color:C.white,width:24,textAlign:"center"}}>{addNpcQtd}</span>
                  <button onClick={()=>setAddNpcQtd(n=>n+1)} style={{...btnSm,width:22,height:22,fontSize:12}}>+</button>
                </div>
              </div>
              <button onClick={addNpcGroup} style={{background:"transparent",border:`1px solid ${C.silver}`,color:C.silver,fontFamily:"'Inter',system-ui,sans-serif",fontSize:10,padding:"7px 16px",cursor:"pointer",letterSpacing:2}}>+ Adicionar</button>
            </div>
          )}

          {/* Referência rápida */}
          <div style={{marginTop:24,border:`1px solid ${C.border}`,background:C.bg2}}>
            <div style={{padding:"8px 14px",borderBottom:`1px solid ${C.border}`,fontFamily:"'Inter',system-ui,sans-serif",fontSize:9,letterSpacing:3,color:C.silverDim,textTransform:"uppercase"}}>Referência — Iniciativa</div>
            <div style={{padding:"10px 14px",display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:8}}>
              {[["A","14","#c09040","+1 Testes de Violência"],["K","13","#c09040","+1 Movimento"],["Q","12","#c09040","+1 Ação de Combate"],["J","11","#c09040","+1 em qualquer teste"],["🃏","0",C.grayDark,"Valor nulo — age por último"]].map(([rank,val,col,bonus])=>(
                <div key={rank} style={{display:"flex",gap:8,alignItems:"center"}}>
                  <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:16,color:col,width:24,textAlign:"center"}}>{rank}</div>
                  <div>
                    <div style={{fontSize:9,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif"}}>valor {val}</div>
                    <div style={{fontSize:10,color:C.white,fontFamily:"'Inter',system-ui,sans-serif",lineHeight:1.4}}>{bonus}</div>
                  </div>
                </div>
              ))}
              <div style={{fontSize:9,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",lineHeight:1.8,gridColumn:"1/-1",borderTop:`1px solid ${C.border}`,paddingTop:8,marginTop:4}}>
                Cartas especiais (A/K/Q/J): ative o bônus descartando a carta → vai para o fim da Iniciativa · Empate PJ vs NPC: NPC age primeiro
              </div>
            </div>
          </div>
        </div>

        {/* Painel de log */}
        {showLog&&(
          <div style={{width:280,borderLeft:`1px solid ${C.border}`,overflowY:"auto",flexShrink:0,background:C.bg1}}>
            <div style={{padding:"8px 12px",borderBottom:`1px solid ${C.border}`,fontFamily:"'Inter',system-ui,sans-serif",fontSize:9,letterSpacing:3,color:C.silverDim,textTransform:"uppercase",position:"sticky",top:0,background:C.bg1}}>
              Log de Combate
            </div>
            {log.length===0 ? <div style={{padding:"20px 12px",color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",fontSize:11}}>Nenhum evento ainda.</div> : (
              log.map(entry=>(
                <div key={entry.id} style={{padding:"6px 12px",borderBottom:`1px solid ${C.bg3}`,fontFamily:"'Inter',system-ui,sans-serif",fontSize:11,color:C.gray,lineHeight:1.5}}>
                  <span style={{color:C.grayDark,marginRight:6,fontSize:9}}>R{entry.ts}</span>{entry.msg}
                </div>
              ))
            )}
          </div>
        )}
      </div>
      {showDuelo&&<DueloModal chars={chars} onClose={()=>setShowDuelo(false)}/>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── CAMPANHA — GERENCIAMENTO LOCAL SIMPLES ──────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

const saveCampLocal = (d) => { try { localStorage.setItem("sacr_camp_v2", JSON.stringify(d)); } catch {} };
const loadCampLocal = () => { try { const r=localStorage.getItem("sacr_camp_v2"); return r?JSON.parse(r):null; } catch { return null; } };

function CampaignScreen({ chars }) {
  const [camp, setCamp] = useState(() => loadCampLocal());
  const [mode, setMode] = useState(camp ? "active" : "home");
  const [form, setForm] = useState({ nome:"", juiz:"", descricao:"" });
  const [notas, setNotas] = useState("");

  const persist = (next) => { setCamp(next); saveCampLocal(next); };

  const createCamp = () => {
    if(!form.nome.trim()) return;
    const data = { ...form, jogadores: [], criadoEm: Date.now() };
    persist(data);
    setMode("active");
  };

  const addChar = (char) => {
    const snap = {
      id: char.id, nome: char.nome||"Sem nome", conceito: char.conceito||"",
      jogador: char.jogador||"", nivel: char.nivel||1,
      vidaAtual: char.vidaAtual||(6+(char.atributos?.Físico||0)),
      vidaBase:  char.vidaBase ||(6+(char.atributos?.Físico||0)),
      circulosDorAtivos: char.circulosDorAtivos||[], defesa: char.defesa||5,
      acoes: char.acoes||1, movimentos: char.movimentos||1,
      honra: char.honra||0, recompensa: char.recompensa||0, imagem: char.imagem||null,
    };
    const lista = (camp.jogadores||[]);
    const nova  = lista.find(p=>p.id===char.id)
      ? lista.map(p=>p.id===char.id?snap:p)
      : [...lista, snap];
    persist({ ...camp, jogadores: nova });
  };

  const removeChar = (id) => persist({ ...camp, jogadores: (camp.jogadores||[]).filter(p=>p.id!==id) });

  const updVida = (id, delta) => {
    const nova = (camp.jogadores||[]).map(p=>{
      if(p.id!==id) return p;
      return { ...p, vidaAtual: Math.max(0, Math.min(p.vidaBase, (p.vidaAtual||0)+delta)) };
    });
    persist({ ...camp, jogadores: nova });
  };

  if(mode==="home") return (
    <div style={{maxWidth:680,margin:"0 auto",padding:"20px 0"}}>
      <SectionTitle>Campanha</SectionTitle>
      <div style={{fontFamily:"'Inter',system-ui,sans-serif",fontSize:12,color:C.grayDark,lineHeight:1.9,marginBottom:24}}>
        Registre os jogadores da campanha, acompanhe vida e condições, e acesse o tracker de combate — tudo localmente, sem configuração.
      </div>
      <div>
        <div style={{fontSize:9,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",letterSpacing:2,marginBottom:4,textTransform:"uppercase"}}>Nome da Campanha *</div>
        <Inp value={form.nome} onChange={v=>setForm(f=>({...f,nome:v}))} placeholder="ex: Sacramento — Temporada 1"/>
      </div>
      <div style={{marginTop:12}}>
        <div style={{fontSize:9,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",letterSpacing:2,marginBottom:4,textTransform:"uppercase"}}>Juiz / Narrador</div>
        <Inp value={form.juiz} onChange={v=>setForm(f=>({...f,juiz:v}))} placeholder="Nome do narrador..."/>
      </div>
      <div style={{marginTop:12}}>
        <div style={{fontSize:9,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",letterSpacing:2,marginBottom:4,textTransform:"uppercase"}}>Sinopse (opcional)</div>
        <Inp value={form.descricao} onChange={v=>setForm(f=>({...f,descricao:v}))} placeholder="Uma breve sinopse..." multiline rows={3}/>
      </div>
      <button onClick={createCamp} disabled={!form.nome.trim()} style={{
        background:"transparent",border:`1px solid ${form.nome.trim()?C.silver:C.border}`,
        color:form.nome.trim()?C.silver:C.grayDark,
        fontFamily:"'Playfair Display',Georgia,serif",fontSize:10,letterSpacing:4,
        textTransform:"uppercase",padding:"10px 24px",cursor:form.nome.trim()?"pointer":"not-allowed",marginTop:20
      }}>Criar Campanha →</button>
    </div>
  );

  if(mode==="active" && camp) {
    const jogadores = camp.jogadores||[];
    return (
      <div style={{maxWidth:820,margin:"0 auto",padding:"20px 0"}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:24,flexWrap:"wrap",gap:12}}>
          <div>
            <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:20,color:C.white}}>{camp.nome}</div>
            {camp.juiz&&<div style={{fontSize:11,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",marginTop:2}}>Juiz: {camp.juiz}</div>}
          </div>
          <button onClick={()=>{ persist(null); setCamp(null); setMode("home"); setForm({nome:"",juiz:"",descricao:""}); }} style={{
            background:"transparent",border:`1px solid ${C.border}`,color:C.grayDark,
            fontFamily:"'Inter',system-ui,sans-serif",fontSize:9,padding:"5px 12px",cursor:"pointer",letterSpacing:1
          }}>✕ Encerrar Campanha</button>
        </div>

        {/* Jogadores */}
        <SectionTitle>Jogadores ({jogadores.length})</SectionTitle>
        {jogadores.length===0 ? (
          <div style={{color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",fontSize:12,marginBottom:20,lineHeight:1.8}}>
            Nenhum personagem adicionado ainda. Selecione abaixo.
          </div>
        ) : (
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))",gap:10,marginBottom:24}}>
            {jogadores.map(p=>{
              const pct = p.vidaBase>0?(p.vidaAtual/p.vidaBase)*100:100;
              const vidaCor = pct<=25?C.red:pct<=55?"#c07020":C.silver;
              return (
                <div key={p.id} style={{border:`1px solid ${C.border}`,background:C.bg2,padding:"12px 14px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                    <div style={{flex:1}}>
                      <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:14,color:C.white}}>{p.nome}</div>
                      <div style={{fontSize:10,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",marginTop:1}}>
                        {p.conceito||"—"} · Nv.{p.nivel}{p.jogador?` · ${p.jogador}`:""}
                      </div>
                    </div>
                    {p.imagem&&<div style={{width:36,height:44,background:`url(${p.imagem}) center/cover`,borderRadius:2,flexShrink:0,marginLeft:8}}/>}
                  </div>
                  {/* Vida */}
                  <div style={{marginBottom:8}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
                      <span style={{fontSize:8,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",letterSpacing:1,textTransform:"uppercase"}}>Vida</span>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <button onClick={()=>updVida(p.id,-1)} style={{...btnSm,width:18,height:18,fontSize:11}}>−</button>
                        <span style={{fontSize:12,color:vidaCor,fontFamily:"'Playfair Display',Georgia,serif"}}>{p.vidaAtual}/{p.vidaBase}</span>
                        <button onClick={()=>updVida(p.id,+1)} style={{...btnSm,width:18,height:18,fontSize:11}}>+</button>
                      </div>
                    </div>
                    <div style={{height:4,background:C.bg3,borderRadius:2,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${pct}%`,background:vidaCor,transition:"width 0.3s",borderRadius:2}}/>
                    </div>
                  </div>
                  {/* Stats */}
                  <div style={{display:"flex",gap:10,fontSize:9,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",marginBottom:8,flexWrap:"wrap"}}>
                    <span>Def:{p.defesa}</span>
                    <span>Ações:{p.acoes}</span>
                    <span>Mov:{p.movimentos}</span>
                    {p.honra!==0&&<span style={{color:p.honra>0?C.silverDim:C.red}}>Honra:{p.honra>0?"+":""}{p.honra}</span>}
                    {(p.circulosDorAtivos||[]).length>0&&<span style={{color:C.red}}>⚠ {p.circulosDorAtivos.length} cond.</span>}
                    {p.recompensa>0&&<span style={{color:"#c09040"}}>${p.recompensa.toLocaleString()}</span>}
                  </div>
                  {/* Ações */}
                  <div style={{display:"flex",gap:6}}>
                    {chars.find(c=>c.id===p.id)&&(
                      <button onClick={()=>addChar(chars.find(c=>c.id===p.id))} style={{
                        background:"transparent",border:`1px solid ${C.border}`,color:C.grayDark,
                        fontFamily:"'Inter',system-ui,sans-serif",fontSize:9,padding:"3px 8px",cursor:"pointer",letterSpacing:1
                      }}>↑ Atualizar</button>
                    )}
                    <button onClick={()=>removeChar(p.id)} style={{
                      background:"transparent",border:`1px solid ${C.border}`,color:C.redDim,
                      fontFamily:"'Inter',system-ui,sans-serif",fontSize:9,padding:"3px 8px",cursor:"pointer"
                    }} onMouseEnter={e=>e.currentTarget.style.color=C.red} onMouseLeave={e=>e.currentTarget.style.color=C.redDim}>Remover</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Adicionar chars locais */}
        {chars.length>0&&(
          <div style={{marginBottom:28}}>
            <SectionTitle>Adicionar Personagem</SectionTitle>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {chars.map(ch=>{
                const jaEsta = jogadores.find(p=>p.id===ch.id);
                return (
                  <button key={ch.id} onClick={()=>addChar(ch)} style={{
                    background:jaEsta?C.bg3:"transparent",
                    border:`1px solid ${jaEsta?C.silver:C.border2}`,
                    color:jaEsta?C.silver:C.white,
                    fontFamily:"'Inter',system-ui,sans-serif",fontSize:11,
                    padding:"7px 14px",cursor:"pointer",letterSpacing:1,
                  }}>{ch.nome||"Sem nome"} {jaEsta?"(atualizar)":""}</button>
                );
              })}
            </div>
          </div>
        )}

        {/* Notas da campanha */}
        <SectionTitle>Notas da Campanha</SectionTitle>
        <Inp
          value={camp.notas||""}
          onChange={v=>persist({...camp,notas:v})}
          placeholder="Missões ativas, NPCs importantes, plot hooks..."
          multiline rows={6}
        />
      </div>
    );
  }

  return null;
}

// ── Estilos compartilhados ────────────────────────────────────────────────────
const btnBack      = {background:"transparent",border:"none",color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",fontSize:11,cursor:"pointer",letterSpacing:1,marginBottom:20,padding:0};
const btnPrimary   = {background:"transparent",border:`1px solid ${C.silver}`,color:C.silver,fontFamily:"'Playfair Display',Georgia,serif",fontSize:10,letterSpacing:4,textTransform:"uppercase",padding:"10px 24px",cursor:"pointer"};
const btnSecondary = {background:"transparent",border:`1px solid ${C.border2}`,color:C.silverDim,fontFamily:"'Inter',system-ui,sans-serif",fontSize:10,letterSpacing:2,textTransform:"uppercase",padding:"7px 14px",cursor:"pointer"};
const labelSt      = {fontSize:9,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",letterSpacing:2,marginBottom:4,textTransform:"uppercase"};
const errSt        = {fontSize:11,color:C.red,fontFamily:"'Inter',system-ui,sans-serif"};
const infoBox      = {padding:"10px 14px",border:`1px solid ${C.border}`,background:C.bg2};

// ─── APP ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [chars,setChars]=useState(()=>loadChars());
  const [activeId,setActiveId]=useState(null);
  const [view,setView]=useState("library"); // library | sheet | campaign | combat
  const [showCombat,setShowCombat]=useState(false);

  useEffect(()=>{ saveChars(chars); },[chars]);

  const saveTimer=useRef(null);
  const updateChar=useCallback((updated)=>{
    setChars(prev=>{
      const next=prev.map(c=>c.id===updated.id?updated:c);
      clearTimeout(saveTimer.current);
      saveTimer.current=setTimeout(()=>saveChars(next),350);
      return next;
    });
  },[]);

  const activeChar=chars.find(c=>c.id===activeId)||null;

  const createChar=()=>{
    const c=createBlankChar();
    const next=[c,...chars];
    setChars(next);
    saveChars(next);
    setActiveId(c.id);
    setView("sheet");
  };

  const deleteChar=(id)=>{
    const next=chars.filter(c=>c.id!==id);
    setChars(next);
    saveChars(next);
    if(activeId===id){setActiveId(null);setView("library");}
  };

  const importChar=(c)=>{
    setChars(prev=>{
      const next=[c,...prev];
      saveChars(next);
      return next;
    });
  };

  const NAV_TABS = [
    {id:"library",label:"Fichas"},
    {id:"bando",label:"Bando"},
  ];

  return (
    <div style={{minHeight:"100vh",background:C.bg,color:C.white,padding:"0 24px",backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.025'/%3E%3C/svg%3E")`}}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet"/>

      {/* NAV */}
      <div style={{borderBottom:`1px solid ${C.border}`,padding:"18px 0",display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:0,flexWrap:"wrap",gap:12}}>
        <div style={{cursor:"pointer"}} onClick={()=>{setView("library");setActiveId(null);}}>
          <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:18,letterSpacing:8,color:C.silver,textTransform:"uppercase"}}>
            Prata <span style={{color:C.border2}}>&</span> Chumbo
          </div>
          <div style={{fontSize:10,letterSpacing:5,color:C.grayDark,textTransform:"uppercase",fontFamily:"'Inter',system-ui,sans-serif",marginTop:2}}>Fichas de Personagem · RPG</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
          {view==="sheet"&&activeChar&&(
            <span style={{fontFamily:"'Inter',system-ui,sans-serif",fontSize:12,color:C.grayDark,letterSpacing:1}}>{activeChar.nome||"Sem nome"}</span>
          )}
          {/* Botão de Combate — sempre visível */}
          <button onClick={()=>setShowCombat(true)} style={{background:"transparent",border:`1px solid #8b7030`,color:"#c09040",fontFamily:"'Inter',system-ui,sans-serif",fontSize:10,cursor:"pointer",letterSpacing:2,textTransform:"uppercase",padding:"5px 14px",display:"flex",alignItems:"center",gap:6}}>
            ⚔ Combate
          </button>
          {view==="sheet"&&activeChar&&(
            <button onClick={()=>{setActiveId(null);setView("library");}} style={{background:"transparent",border:`1px solid ${C.border}`,color:C.grayDark,fontFamily:"'Inter',system-ui,sans-serif",fontSize:10,cursor:"pointer",letterSpacing:2,textTransform:"uppercase",padding:"5px 14px"}}>← Fichas</button>
          )}
        </div>
      </div>

      {/* Tabs de navegação principal */}
      {view!=="sheet"&&(
        <div style={{borderBottom:`1px solid ${C.border}`,display:"flex",gap:0,marginBottom:36}}>
          {NAV_TABS.map(t=>(
            <button key={t.id} onClick={()=>setView(t.id)} style={{background:"transparent",border:"none",borderBottom:view===t.id?`2px solid ${C.silver}`:"2px solid transparent",color:view===t.id?C.white:C.grayDark,fontFamily:"'Playfair Display',Georgia,serif",fontSize:10,letterSpacing:3,textTransform:"uppercase",padding:"10px 16px",cursor:"pointer",transition:"all 0.15s"}}>{t.label}</button>
          ))}
        </div>
      )}
      {view==="sheet"&&<div style={{marginBottom:36}}/>}

      <div style={{paddingBottom:80}}>
        {view==="library"&&<Library chars={chars} onSelect={c=>{setActiveId(c.id);setView("sheet");}} onCreate={createChar} onDelete={deleteChar} onImport={importChar}/>}
        {view==="sheet"&&activeChar&&<CharSheet char={activeChar} update={updateChar}/>}
        {view==="bando"&&<BandoScreen/>}

      </div>

      {/* Tracker de Combate — modal flutuante */}
      {showCombat&&<CombatTracker chars={chars} onClose={()=>setShowCombat(false)}/>}
    </div>
  );
}
