/** 
 *  モンティホール問題 シミュレーション
 */
 
/** データ構造作成メモ
index     0,1,2
---------------
door      0,0,1
Select    0,1,0

door[i]+select[i]==0    --> can open     (1 or 2)
door[i]+select[i]>0     --> can not open (2 or 1)
can open == 2 ならば、どちらを開くか選択する

open      1,0,0

select[i]+open[i]==0    --> can change here (only 1)
select[i]+open[i]==1    --> ignore  (2)

if change==true   finalans = 1 - (select[i] + open[i])
   change==false  finalans = select[i]

success = (door == finalans)
*/

/**
 *  モンティホール問題クラス：問題場面1つを表現する
 ====================================================== */
class MontyHall {
  // フィールド変数
  #index;
  #door;
  #userselect;
  #dooropen;
  #finalanswer;
  #doorchange;
  #success;
  #doors = 3;
  #data;
  
  // コンストラクタ doorselect : 最初に選択するドアの指定／mustchange : 必ず変更するか
  constructor(doorselect=-1, mustchange=-1) {
    this.resetDoors();
    this.#index = 0;
    this.#data = [];
    this.#data.push('id, prise, sel1, open, sel2, change, success');
  }
  // 各フェーズの値を返す
  get position_prise() {          // 商品のあるドア番号
    return this.#door.indexOf(1);
  }
  get position_select_first() {   // 最初の選択ドア番号
    return this.#userselect.indexOf(1);
  }
  get position_opened() {         // 司会者が開けたドア番号
    return this.#dooropen.indexOf(1);
  }
  get is_select_change() {
    return (this.#userselect.indexOf(1)==this.#finalanswer.indexOf(1) ? 0:1);
  }
  get position_select_final() {   // 最終的な選択ドア番号
    return this.#finalanswer.indexOf(1);
  }
  get is_get_prise() {            // 商品をゲットしたか
    return (this.#door.indexOf(1)==this.#finalanswer.indexOf(1) ? 1:0);
  }
  get data() {
    return this.#data;
  }
  // ドアをリセットする
  resetDoors() {
    this.#door = new Array(this.#doors).fill(0);        // 賞金が入っているドア番号に1
    this.#userselect = new Array(this.#doors).fill(0);  // ユーザが選択したドア番号に1
    this.#dooropen = new Array(this.#doors).fill(0);    // 司会者が開けたドア番号に1
    this.#finalanswer = new Array(this.#doors).fill(0); // 最終回答のドア番号に1
    this.#doorchange = null;
    this.#success = null;
  }
  
  // 問題を1回演じる
  doTrial(usersel) {
    // ドアを設定する：賞金が入っているドア番号は1、そうでないドア番号は0
    this.#door[random([0,1,2])] = 1;
    // ユーザの選択を受け取る
    this.#userselect[usersel] = 1;

    // 開けて良いドアがどれか確かめる
    let doorleft = [];
    let dopen = -1;
    for (let i=0; i<this.#doors; i++) {
      if (this.#door[i] + this.#userselect[i]==0) {
        doorleft.push(i);
      }
    }
    // 司会者が開けるドアを決める
    if (doorleft.length==1) {
      dopen = doorleft[0];
    } else {
      dopen = doorleft[random([0,1])];
    }
    this.#dooropen[dopen] = 1;
    
    // 選択を変えるかどうかを決める
    this.#doorchange = random([0,1]);
    // 最終回答を決める
    if (this.#doorchange) {
      for (let i=0; i<this.#doors; i++) {
        this.#finalanswer[i] = 1 - (this.#userselect[i] + this.#dooropen[i]);
      }
    } else {
      for (let i=0; i<this.#doors; i++) {
        this.#finalanswer[i] = this.#userselect[i];
      }
    }
    
    // あたりを引いたかどうか判定する
    this.#success = false;
    for (let i=0; i<this.#doors; i++) {
      if (this.#door[i]==1 & this.#finalanswer[i]==1) {
        this.#success = true;
        break;
      }
    }
    // データを追加する
    const d = `${this.#index}, ${this.position_prise}, ${this.position_select_first}, ${this.position_opened}, ${this.position_select_final}, ${this.is_select_change}, ${this.is_get_prise}`
    this.#data.push(d);
    this.#index++;
  }
}

let userSimType = -1;
// モードを選択しないと実行できないようにしておく
window.addEventListener('load', () => {
  document.querySelector('#btn_start').disabled = true;
  document.querySelector('#btn_pause').disabled = true;
  document.querySelector('#btn_reset').disabled = true;
  document.querySelector('#trial_number').disabled = true;
});
// シミュレーションの実行
document.querySelector('#btn_start').addEventListener('click', () => {
  userMaxTrials = document.querySelector('#trial_number').value * 1;
  loopOn = true;
  trials = 0;
  index = 0;
  steps = 0;
  userFramerate = (userSimType ? 30 : 4);
  frameRate(userFramerate);
  loop();
});
// ページのリセット
document.querySelector('#btn_reset').addEventListener('click', () => {
  window.location.reload();
});
// 実行の一時停止 btn_pause
document.querySelector('#btn_pause').addEventListener('click', ()=>{
  loopOn = !loopOn;
  document.querySelector('#btn_pause').value = loopOn ? '一時停止': '再　開';
});
const simTypeSelect = document.querySelectorAll('.radio');
// シミュレートタイプの選択
simTypeSelect.forEach((sel) => {
  sel.addEventListener('change', function() {
    userSimType = sel.value * 1;
    const idstr  = [];
    idstr[0] = '#sim_type_' + (userSimType);
    idstr[1] = '#sim_type_' + (1 - userSimType);
    document.querySelector(idstr[0]).classList.add('active');
    document.querySelector(idstr[1]).classList.remove('active');
    document.querySelector('#btn_start').disabled = false;
    document.querySelector('#btn_pause').disabled = false;
    document.querySelector('#btn_reset').disabled = false;
    document.querySelector('#trial_number').disabled = false;
  });
});


/**
 *  広域変数
 ===================================================== */
let mt;
let canvas;
const canvas_width = 840;
const canvas_height = 600;
const canvas_background = 244;
let userFramerate = 30;
let userMaxTrials;

const mtDoors = 3;    // つねに3つのドアが見せられる
const mtDoorName = ['A', 'B', 'C']; // ドアの識別名
// モンティホール問題の進むステップ
const stepId = ['door', 'user', 'monty', 'user', 'judge', 'prise'];
// ステップごとのアイコン文字
const talkerFace = {
  'door'  : ['A', 'B', 'C'],
  'user'  : ['😀','😄','😅','😊','🙂','🤔','🙄','🙁','😟','😧'],
  'monty' : ['🎤'],
  'judge' : [['😨','😭','😢','😖','😞'], ['🤩','🤑','😲','😍','🥰','😂']],
  'prise' : ['❌','🎁']
};
// ステップごとの色設定
const mboxColor = [
  {f:'#ddd', b:'#999', },   // ドアの表示：グレー
  {f:'#dff', b:'#04b', },   // ユーザの選択：青っぽい感じ
  {f:'#ffd', b:'#b70', },   // 司会者がドアを開ける：黄色っぽい感じ
  {f:'#fdf', b:'#90b', fp:'#fbf', bp:'#909', },  // 最終選択：ピンクっぽい感じ
  {f:'#444', b:'#000', fp:'#d00', bp:'#900', },  // 判定：濃い色
];

const block_width = (canvas_width - 40) / 5;
const block_height = 40;
const margin_left = 20;
const margin_top  = 50;
const demo_area = {
  x: canvas_width / 6,
  y: canvas_height * 0.3,
  w: canvas_width * 0.7,
  h: canvas_height * 0.65,
};
let accent;  // ドア表示に追加するアクセント

let loopOn = false;
let trials = 0;
let index = 0;
let steps = -1;
let demonstrationMode = true;
// シミュレーションモード：0 高速、1 通常、2 デモ
let simMode;

/**
 *  シミュレーションの実行
 ===================================================== */
function montyhall_trial() {
  mt.resetDoors();
  mt.doTrial(Math.floor(random(0, 3)));
}

/**
 *  初期化関数
 ------------------------------------------------------ */
function setup() {
  canvas = createCanvas(canvas_width, canvas_height);
  canvas.parent(document.getElementById('p5'));
  background(canvas_background);

  mt = new MontyHall();

  // ランダムシード
  randomSeed(minute() + second());
  fill(0);
  noStroke();
  textAlign(CENTER, TOP);
  textSize(18);
  let tx = margin_left + block_width/2-10;  text('ドア', tx, 10);   
  tx += block_width;    text('選択1', tx, 10);
  tx += block_width;    text('司会者', tx, 10);
  tx += block_width;    text('選択2', tx, 10);
  tx += block_width;    text('結果', tx, 10);
  noLoop();
}

/**
 *  描画関数
 ------------------------------------------------------ */
let step = 0;
function draw() {
  if (loopOn) {
    if (userSimType==0) {   // 通常
      if (step < 5) {
        showResultSlow(step, index);
      }
      step++;
      if (step == 9) {
        trials++;
        index++;
        step=0;
        bg();
      } 
    } else {                // 高速
      showResultFast(index);
      trials++;
      index++;
      bg();
    }
  }
  if (index>=50) {
    index = 0;
  }
  if (trials >= userMaxTrials) {
    noLoop();
    dispStats();
    prepairDownload();
  }
}
function bg() {
  push();
  fill(244,25);
  noStroke();
  rect(0, 45, canvas_width, canvas_height-50);
  pop();
}
// 描画処理：通常版
function showResultSlow(step, index) {
  if (step==0) {
    montyhall_trial();
    accent = [];
    showDoors(accent, index);
  } else if (step <= 4) {
    showSteps(step, index);
  }
}
// 描画処理：高速版
function showResultFast(index) {
  montyhall_trial();
  accent = [];
  for (let i=0; i<5; i++) {
    if (i==0) showDoors(accent, index);
    else      showSteps(i, index);
  }
}


// ドアを3つ見せる＋ステップに応じたアクセントを追加する
function showDoors(ac, idx) {
  const {x,y,w,h} = setArea(0, idx);
  const dw = w * 0.7 / 3;
  const mx = w * 0.1;
  fill(mboxColor[0].f);
  stroke(mboxColor[0].b);
  strokeWeight(2);
  for (let i=0; i<mtDoors; i++) {
    rect(x+(mx+dw)*i, y, dw, h, 5);
  }
  noStroke();
  fill('black');
  textSize(18);
  textAlign(CENTER, CENTER);
  for (let i=0; i<mtDoors; i++) {
    text(mtDoorName[i], x+(mx+dw)*i+dw/2, y+h/2);
  }
  // アクセントの付加
  if (Array.isArray(ac)) {
    for (let i=0; i<ac.length; i++) {
      if (ac[i].a == 'b') { // 枠線を追加するアクセント
        strokeWeight(3);
        stroke(ac[i].col);
        noFill();
        rect(x+(mx+dw)*(ac[i].d), y, dw, h, 5);
      } else if (ac[i].a == 'c') { // 絵文字を追加するアクセント
        noStroke();
        fill('black');
        textSize(32);
        text(ac[i].str, x+(mx+dw)*(ac[i].d)+dw/2, y+h/2);
      }
    }
  }
}
// 描画領域を計算して返す：いずれ index に応じて下にずらせるようにしておく
function setArea(bn, idx=0) {
  return {
    x: margin_left + block_width * bn,
    y: margin_top + idx * 10,
    w: block_width * 0.9,
    h: block_height,
  };
}
// ステップに合わせてメッセージを出す
function showSteps(st, idx) {
  // 描画範囲の設定
  let {x,y,w,h} = setArea(st, idx);
  x+=12;
  w-=12;
  h-=4;
  // ドア番号、フラグの取得
  let doornumber;
  let flag = 0;
  switch (st) {
    case 0:   // 'door' ドアを設定する
      doornumber = mt.position_prise; 
      break;
    case 1:   // 'user:sel1' ドアを選択する
      doornumber = mt.position_select_first; 
      accent[0] = {d:doornumber, a:'b', col:mboxColor[1].b, };
      showDoors(accent, idx);  // ユーザの選んだドアを強調表示する
      break;
    case 2:   // 'monty' ドアを1つ開ける
      doornumber = mt.position_opened; 
      accent[1] = {d:doornumber, a:'c', str:talkerFace['prise'][0]};
      showDoors(accent, idx);  // 司会者が開けたドアを無効にする
      break;
    case 3:   // 'user:sel2' ドアを最終選択する
      flag = mt.is_select_change;
      doornumber = mt.position_select_final; 
      accent[0] = {d:doornumber, a:'b', col:mboxColor[3].b, };
      showDoors(accent, idx);  // ユーザが最終的に選んだドアを強調表示する
      break;
    case 4:   // 'judge' 判定する
      flag = mt.is_get_prise;
      doornumber = flag ? mt.position_prise : mt.position_select_final;
      accent[2] = {d:doornumber, a:'c', str:talkerFace['prise'][flag]};
      showDoors(accent, idx);  // 賞品または残念賞を表示する
      break;
  }
  // 背景の角丸四角形
  stroke(flag ? mboxColor[st].bp : mboxColor[st].b);
  fill(flag ? mboxColor[st].fp : mboxColor[st].f);
  strokeWeight(1);
  rect(x, y, w, h, 8);
  // 文字列
  noStroke();
  fill(st==4 ? 'white' : 'black');
  textSize(15);
  textAlign(CENTER, CENTER);
  const sid = stepId[st];
  const face = st==4 ? random(talkerFace[sid][flag]) : random(talkerFace[sid]);
  const msg = [
    '',
    `${mtDoorName[doornumber]}にします!`,
    `${mtDoorName[doornumber]}はハズレ!`,
    `${flag ? 'やっぱり' : 'ぜったい'}${mtDoorName[doornumber]}で!`,
    `${flag ? 'おめでとう!' : '残念!!!'}`
  ];
  textSize(32);
  text(face, x+4, y+h-12);
  textSize(14);
  text(msg[st], x + w/2+4, y + h/2);
}

// ドアを3つ見せる＋ステップに応じたアクセントを追加する：デモンストレーションモード
function showDoorsDemo(ac) {
  const {x,y,w,h} = demo_area;
  const dw = w / 4;
  const dh = h / 2;
  fill(mboxColor[0].f);
  stroke(mboxColor[0].b);
  strokeWeight(8);
  for (let i=0; i<mtDoors; i++) {
    rect(x+(w/3)*i+(w/3-dw)/2, y+h/2-10, dw, dh, 5);
  }
  noStroke();
  fill('black');
  textSize(84);
  textAlign(CENTER, CENTER);
  for (let i=0; i<mtDoors; i++) {
    text(mtDoorName[i], x+(w/3)*i+(w/3-dw)/2+dw/2, y+h/2-10+dh/2);
  }
  // アクセントの付加
  if (Array.isArray(ac)) {
    for (let i=0; i<ac.length; i++) {
      if (ac[i].a == 'b') { // 枠線を追加するアクセント
        strokeWeight(8);
        stroke(ac[i].col);
        noFill();
        rect(x+(w/3)*(ac[i].d)+(w/3-dw)/2, y+h/2-10, dw, dh, 5);
      } else if (ac[i].a == 'c') { // 絵文字を追加するアクセント
        noStroke();
        fill('black');
        textSize(84);
          text(ac[i].str, x+(w/3)*(ac[i].d)+(w/3-dw)/2+dw/2, y+h/2-10+dh/2);
      }
    }
  }
}
// ステップに合わせてメッセージを出す：デモンストレーションモード
function showStepsDemo(st) {
  // 描画範囲の設定
  let {x,y,w,h} = demo_area;
  x+=40; if (st%2==0) x+=w/2;
  y+=20;
  w=(w-100)/2;
  h/=3;
  // ドア番号、フラグの取得
  let doornumber;
  let flag = 0;
  switch (st) {
    case 0:   // 'door' ドアを設定する
      doornumber = mt.position_prise; 
      break;
    case 1:   // 'user:sel1' ドアを選択する
      doornumber = mt.position_select_first; 
      accent[0] = {d:doornumber, a:'b', col:mboxColor[1].b, };
      showDoorsDemo(accent);  // ユーザの選んだドアを強調表示する
      break;
    case 2:   // 'monty' ドアを1つ開ける
      doornumber = mt.position_opened; 
      accent[1] = {d:doornumber, a:'c', str:talkerFace['prise'][0]};
      showDoorsDemo(accent);  // 司会者が開けたドアを無効にする
      break;
    case 3:   // 'user:sel2' ドアを最終選択する
      flag = mt.is_select_change;
      doornumber = mt.position_select_final; 
      accent[0] = {d:doornumber, a:'b', col:mboxColor[3].b, };
      showDoorsDemo(accent);  // ユーザが最終的に選んだドアを強調表示する
      break;
    case 4:   // 'judge' 判定する
      flag = mt.is_get_prise;
      doornumber = flag ? mt.position_prise : mt.position_select_final;
      accent[2] = {d:doornumber, a:'c', str:talkerFace['prise'][flag]};
      showDoorsDemo(accent);  // 賞品または残念賞を表示する
      break;
  }
  
  // 背景の角丸四角形
  stroke(flag ? mboxColor[st].bp : mboxColor[st].b);
  fill(flag ? mboxColor[st].fp : mboxColor[st].f);
  strokeWeight(2);
  rect(x, y, w, h, 8);
  // 文字列
  noStroke();
  fill(st==4 ? 'white' : 'black');
  textAlign(CENTER, CENTER);
  const sid = stepId[st];
  const face = st==4 ? random(talkerFace['monty']) : random(talkerFace[sid]);
  const prise = random(talkerFace[sid][flag]);
  const msg = [
    '',
    `${mtDoorName[doornumber]}にします!\n当たるといいな...`,
    `${mtDoorName[doornumber]}はハズレ!\n変えるならいま!`,
    `${flag ? 'やっぱり' : 'ぜったい'}${mtDoorName[doornumber]}で!\nお願いします!`,
    `${flag ? 'おめでとう!\nやったね!!!' : '残念!!!\nまた挑戦してね...'}`
  ];
  textSize(60);
  text(face, x+15, y+h-20);
  if (st==4) {
    text(prise, x+w-40, y+h-20);
  }
  textSize(24);
  text(msg[st], x + w/2+4, y + h/2-20);
}

// 統計表示
// データ構造('id, prise, sel1, open, sel2, change, success') 文字列であることに注意
function dispStats() {
  const d = mt.data;
  let stats = [[0, 0], [0, 0]];
  d.forEach((value, index) => {
    if (index>0) {
      const vals = value.split(',');
      stats[vals[5]*1][vals[6]*1]++;
    }
  });
  console.log(stats);
  let dstr = [];
  dstr[0] = `シミュレーションを ${userMaxTrials} 回繰り返した結果`;
  dstr[1] = `選択を変えなかった場合（ ${stats[0][0]+stats[0][1]} 回）`;
  dstr[2] = `ハズレ ${talkerFace['prise'][0]} ${stats[0][0]} 回`;
  dstr[3] = `あたり ${talkerFace['prise'][1]} ${stats[0][1]} 回`;
  dstr[4] = `確率 ${(stats[0][1] / (stats[0][0]+stats[0][1]) * 100).toFixed(1)} ％`;
  dstr[5] = `選択を変えた場合（ ${stats[1][0]+stats[1][1]} 回）`;
  dstr[6] = `ハズレ ${talkerFace['prise'][0]} ${stats[1][0]} 回`;
  dstr[7] = `あたり ${talkerFace['prise'][1]} ${stats[1][1]} 回`;
  dstr[8] = `確率 ${(stats[1][1] / (stats[1][0]+stats[1][1]) * 100).toFixed(1)} ％`;
  push();
  fill(0);
  textAlign(LEFT, BASELINE);
  textSize(18);
  const tx = canvas_width / 3;
  let ty = 50;
  for (let i=0; i<dstr.length; i++) {
    text(dstr[i], tx, ty+30*i);
  }
  pop();
}
// ローデータの提供 データダウンロードの準備をする
function prepairDownload() {
  document.querySelector('#download').style.display = 'block';
  document.querySelectorAll('.data_download').forEach((element) => {
    element.addEventListener('click', ()=>{
      const csvData = makeDownloadData(element.id);
      const filename = element.id=='script' ? 'script.r' : `${element.id}.csv`;
      saveCsvFile(csvData, filename);
    });
  });
  // 必要に応じて
  document.querySelector('#stats_data').disabled = true; // 統計データがない
}
// ダウンロードファイルをつくる
function makeDownloadData(id) {
  let data = [];
  switch (id) {
    // ---------------------- ローデータの作成
    case 'raw_data':
      for (let i=0; i<mt.data.length; i++) {
        data[i] = mt.data[i];
      }
      break;
    // ---------------------- 統計データの作成
    case 'stats_data':
      break;
    // ---------------------- スクリプトの作成
    case 'script':
      data.push('## Monty Hall Problem');
      data.push('dat <- read.csv("raw_data.csv")');
      data.push('head(dat)');
      data.push('dat$ch <- factor(dat$change, levels=c(0,1), labels=c("そのまま","変更した"))');
      data.push('dat$sc <- factor(dat$success, levels=c(0,1), labels=c("ハズレ","当たり"))');
      data.push('(tbl <- table(dat$ch, dat$sc))');
      data.push('print(prop.table(tbl, margin=2), digits=3)');
      break;
    default:
      return null;
  }
  data.push('');
  return data.join('\n');
}

