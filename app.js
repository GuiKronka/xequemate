// 1) Crie um projeto em supabase.com, habilite Authentication > Providers > Anonymous.
// 2) Execute sql/schema.sql no SQL Editor.
// 3) Cole a Project URL e a anon/public key abaixo.
const SUPABASE_URL = "https://ioftthhkqecqkxgtcyhy.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_DHyEhkFkPxnbUc5yk9sq8Q_CKym_f8e";
const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const $ = id => document.getElementById(id);
const chess = new Chess();
let user = null, room = null, channel = null, myColor = null, flipped = false;
let selected = null, legalTargets = [], gameRow = null, clockInterval = null, remaining = {w:600,b:600}, lastTick = Date.now();
let gameOver = false, rematchRequested = false;

function say(id, msg){ $(id).textContent = msg || ""; }
function timeText(ms){ const s=Math.max(0,Math.ceil(ms/1000)); return `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`; }
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
async function ensureUser(){
  if(user) return user;
  const {data,error}=await client.auth.getSession(); if(error) throw error;
  if(data.session) user=data.session.user;
  else {const r=await client.auth.signInAnonymously(); if(r.error) throw r.error; user=r.data.user;}
  return user;
}
function code(){return Math.random().toString(36).slice(2,8).toUpperCase();}
async function createRoom(){
  try{
    await ensureUser();
    const name=$("nickname").value.trim()||"Brancas";
    const seconds=Number($("timeControl").value);
    const {data,error}=await client.rpc("create_chess_room",{p_code:code(),p_name:name,p_seconds:seconds});
    if(error) throw error;
    await enterRoom(data);
  }catch(e){say("setupMessage",e.message);}
}
async function joinRoom(){
  try{
    await ensureUser();
    const name=$("nickname").value.trim()||"Pretas", roomCode=$("roomCode").value.trim().toUpperCase();
    if(!roomCode) throw new Error("Digite o código da sala.");
    const {data,error}=await client.rpc("join_chess_room",{p_code:roomCode,p_name:name});
    if(error) throw error;
    await enterRoom(data);
  }catch(e){say("setupMessage",e.message);}
}
async function enterRoom(row){
  room=row; gameRow=row; myColor=row.white_id===user.id?"w":"b";
  flipped=myColor==="b"; selected=null; legalTargets=[]; say("gameMessage","");
  $("setup").classList.add("hidden"); $("game").classList.remove("hidden");
  $("roomLabel").textContent=row.code; $("orientation").textContent=myColor==="w"?"Você joga de brancas":"Você joga de pretas";
  applyRow(row); subscribe(); render();
}
function applyRow(row){
  room=row; gameRow=row;
  if(!(row.pgn && chess.load_pgn(row.pgn))){ chess.reset(); if(row.fen) chess.load(row.fen); }
  remaining={w:Number(row.white_ms),b:Number(row.black_ms)};
  $("whiteName").textContent=row.white_name||"Brancas"; $("blackName").textContent=row.black_name||"Aguardando...";
  $("whiteClock").textContent=timeText(remaining.w); $("blackClock").textContent=timeText(remaining.b);
  gameOver=!!row.finished_at;
  $("gameStatus").textContent=gameOver?(row.result||"Partida encerrada"):(row.black_id?"Partida em andamento":"Aguardando adversário");
  $("rematchBtn").disabled=!gameOver;
  if(row.rematch_white||row.rematch_black) say("rematchInfo","Pedido de revanche: "+(row.rematch_white?"brancas ":"")+(row.rematch_black?"pretas":""));
  else say("rematchInfo",gameOver?"Peça uma revanche para começar outra partida.":"A revanche fica disponível quando a partida terminar.");
  lastTick=Date.now();
}
function subscribe(){
  if(channel) client.removeChannel(channel);
  channel=client.channel("room-"+room.id)
        .on("postgres_changes",{event:"UPDATE",schema:"public",table:"chess_rooms",filter:"id=eq."+room.id},async payload=>{
      if(payload.new.id!==room.id) return;
      if(payload.new.rematch_room_id && payload.new.rematch_room_id!==room.id){
        const {data}=await client.from("chess_rooms").select("*").eq("id",payload.new.rematch_room_id).single();
        if(data){ await enterRoom(data); say("gameMessage","Nova partida criada!"); }
        return;
      }
      if(payload.new.updated_by!==user.id) applyRow(payload.new);
      render();
    }).subscribe(status=>{ $("connection").textContent=status==="SUBSCRIBED"?"Conectado":"Reconectando…";});
}
function boardSquares(){
  const files=flipped?["h","g","f","e","d","c","b","a"]:["a","b","c","d","e","f","g","h"];
  const ranks=flipped?[1,2,3,4,5,6,7,8]:[8,7,6,5,4,3,2,1];
  return ranks.flatMap(r=>files.map(f=>f+r));
}
function render(){
  const board=$("board"); board.innerHTML="";
  const glyph={"wk":"♔","wq":"♕","wr":"♖","wb":"♗","wn":"♘","wp":"♙","bk":"♚","bq":"♛","br":"♜","bb":"♝","bn":"♞","bp":"♟"};
  for(const sq of boardSquares()){
    const [file,rank]=[sq[0],Number(sq[1])], light=(file.charCodeAt(0)-97+rank)%2===1;
    const piece=chess.get(sq), b=document.createElement("button");
    b.className="square "+(light?"light":"dark")+(selected===sq?" selected":"")+(legalTargets.includes(sq)?" "+(piece?"capture":"target"):"");
    b.setAttribute("aria-label",sq+(piece?", "+piece.color+piece.type:"")); b.textContent=piece?glyph[piece.color+piece.type]:"";
    b.onclick=()=>onSquare(sq); board.appendChild(b);
  }
  const hist=chess.history(); $("moveList").innerHTML="";
  for(let i=0;i<hist.length;i+=2){const li=document.createElement("li");li.textContent=`${Math.floor(i/2)+1}. ${hist[i]}${hist[i+1]?"  "+hist[i+1]:""}`;$("moveList").appendChild(li);}
  $("whiteClock").textContent=timeText(remaining.w); $("blackClock").textContent=timeText(remaining.b);
  if(chess.game_over()){gameOver=true;$("gameStatus").textContent=chess.in_checkmate()?"Xeque-mate":chess.in_draw()?"Empate":"Partida encerrada";$("rematchBtn").disabled=false;}
}
function onSquare(sq){
  if(gameOver||!room?.black_id||chess.turn()!==myColor) return;
  const p=chess.get(sq);
  if(selected){
    const move=chess.move({from:selected,to:sq,promotion:"q"});
    if(move){selected=null;legalTargets=[];render();persistMove();return;}
  }
  if(p&&p.color===myColor){selected=sq;legalTargets=chess.moves({square:sq,verbose:true}).map(m=>m.to);}
  else {selected=null;legalTargets=[];}
  render();
}
async function persistMove(){
  try{
    const now=Date.now(), elapsed=now-lastTick; lastTick=now;
    const mover=myColor; remaining[mover]=Math.max(0,remaining[mover]-elapsed);
    const finished=chess.game_over()||remaining[mover]<=0;
    const result=chess.in_checkmate()?(mover==="w"?"Pretas venceram por xeque-mate":"Brancas venceram por xeque-mate"):remaining[mover]<=0?(mover==="w"?"Pretas venceram pelo tempo":"Brancas venceram pelo tempo"):chess.in_draw()?"Empate":"";
    const {error}=await client.rpc("play_chess_move",{p_room_id:room.id,p_fen:chess.fen(),p_pgn:chess.pgn(),p_white_ms:remaining.w,p_black_ms:remaining.b,p_finished:finished,p_result:result});
    if(error) throw error;
    if(finished){gameOver=true;$("rematchBtn").disabled=false;}
  }catch(e){say("gameMessage","Não consegui salvar a jogada: "+e.message+" — atualize a página para recuperar o estado do servidor.");}
}
async function requestRematch(){
  try{
    const {data,error}=await client.rpc("request_chess_rematch",{p_room_id:room.id});
    if(error) throw error;
    if(data && data.id!==room.id){await enterRoom(data);say("gameMessage","Nova partida criada!");}
    else say("rematchInfo","Pedido enviado. Aguardando seu adversário.");
  }catch(e){say("gameMessage",e.message);}
}
async function leaveRoom(){if(channel) await client.removeChannel(channel);room=null;gameRow=null;selected=null;$("game").classList.add("hidden");$("setup").classList.remove("hidden");}
$("createBtn").onclick=createRoom; $("joinBtn").onclick=joinRoom; $("leaveBtn").onclick=leaveRoom; $("rematchBtn").onclick=requestRematch;
$("flipBtn").onclick=()=>{flipped=!flipped;render();};
$("copyCode").onclick=async()=>{await navigator.clipboard.writeText(room.code);$("copyCode").textContent="Copiado!";};
setInterval(()=>{
  if(!room||gameOver||!gameRow?.black_id) return;
  const now=Date.now(), elapsed=now-lastTick; lastTick=now;
  const turn=chess.turn(); remaining[turn]=Math.max(0,remaining[turn]-elapsed);
  $("whiteClock").textContent=timeText(remaining.w); $("blackClock").textContent=timeText(remaining.b);
  if(remaining[turn]===0){gameOver=true;$("gameStatus").textContent="Tempo esgotado";say("gameMessage","O tempo acabou. Na próxima versão vamos registrar a vitória por tempo no servidor.");}
},250);
