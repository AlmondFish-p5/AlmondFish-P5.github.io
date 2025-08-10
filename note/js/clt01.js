/** =====================================================
 *  確率変数シミュレーション
 *  clt01.js
 */


/** =====================================================
 *  広域変数
 */
 
// ユーザ指定する変数
let userVarType;      // 確率変数タイプ
let userVarNumber;    // 確率変数の数
let userTrialMax;     // 繰り返し回数指定
let userFramerate = 6; // 設定可能にしてもいい
let userManMode = true; // 実行モード：手動実行のときtrue
const maxTrialMax = 1000;

const strVarSetting = () => {
  let s = {type:'', opt:'', obj:'', };
  switch (userVarType) {
    case 0: 
      s.type = 'コイン投げ'; 
      s.opt = `表の出る確率 ${param.prob}`; 
      s.obj = 'コイン'; break;
    case 1: 
      s.type = 'サイコロ投げ'; 
      s.opt = '各目の出る確率は一様'; 
      s.obj = 'サイコロ'; break;
    case 2: 
      s.type = 'ミニトマトの重さ'; 
      s.opt = `平均値${param.mu}, 標準偏差${param.sigma}(グラム)`; 
      s.obj = 'トマト'; break;
    default: 
      s.type = '不明'; 
      s.opt = ''; 
      s.obj = '';
      break;
  }
  return s;
}
let param = {
  prob  : 0.5,
  min   : 1,
  max   : 6,
  mu    : 12,
  sigma : 1.3,
};

// これらの変数に影響される広域変数
let canvas;
const canvas_width = 900;
const canvas_height = 200;
const cvSetting  = {x:  50, y:   0, w: 800, h:  50, };
const cvDraw     = {x:  50, y:  70, w: 800, h:  80, };
const canvas_background = 255;
let img = [];

// 確率変数の記録
let rvdata = [];
// 確率変数コイン1個のサイズ：これがすべての大きさの基準になる
const rvSize = 75;
// コイン同士の間隔
const rvInter = {x:5, y:5, };
// コインを表示する位置（サイコロの中心位置）
let rvLeftTop = [];

// その他の広域変数
let loopOn = false;
let flag = 0;     // 表示を制御するための変数 0/1
let trials = 0;    // 試行回数

/** =====================================================
 *  ボタンの動作設定と制御
 */
// ボタンの動作＝実行モードの変更をする
document.querySelector("#btn_try").addEventListener('click', function(){
  userManMode = true;
  changeExecMode();
});
document.querySelector("#btn_start").addEventListener('click', function(){
  userManMode = false;  
  changeExecMode();
});
document.querySelector("#btn_stop").addEventListener('click', function(){
  userManMode = true;
  changeExecMode();
});
// ボタンクリックはすべてこの関数に行き着く
function changeExecMode() {
  document.querySelector("#btn_try").disabled = false;
  document.querySelector("#btn_start").disabled = !userManMode;
  document.querySelector("#btn_stop").disabled = userManMode;
  radioButtons.forEach(radio => {radio.disabled = !userManMode});
  document.querySelector('#rvnumber').disabled = !userManMode;
  flag = 0;
  rvdata = [];
  if (!userManMode) {
    trials = 0;
    loopOn = true;
    loop();
  } else {
    loopOn = false;
    noLoop();
    initCanvas();
  }
}

/** =====================================================
 *  HTML 上の設定変更とそれにともなうイベント
 */

// HTML初期設定を読み込む：すべての設定変更はこの関数に行き着く
function readHtmlSettings() {
  userVarType = document.querySelector('input[name="rvtype"]:checked').value * 1;
  userVarNumber = document.querySelector('#rvnumber').value * 1;

//  console.log(userVarType, userVarNumber);
  initCanvas();
}
// 確率変数タイプラジオボタンオブジェクト
const radioButtons = document.querySelectorAll('input[name="rvtype"]');
// 各ラジオボタンにchangeイベントリスナーを追加
radioButtons.forEach(radio => {
  radio.addEventListener('change', () => {
    // 選択されたラジオボタンのvalueを取得
    userVarType = document.querySelector('input[name="rvtype"]:checked').value * 1;
    readHtmlSettings();
  });
});
// 確率変数の数が変更された
document.querySelector('#rvnumber').addEventListener('change', ()=>{
  userVarNumber = document.querySelector('#rvnumber').value * 1;
  readHtmlSettings();
});



/** =====================================================
 *  初期化関数
 */
// 画像のプリロード この関数で画像をロードしておかないと表示されない
function preload() {  
  img[0] = new Array(2);
  img[0][0] = loadImage('img/bcoin0.png');
  img[0][1] = loadImage('img/bcoin1.png');
  img[1] = new Array(6);
  img[1][0] = loadImage('img/dice1.png');
  img[1][1] = loadImage('img/dice2.png');
  img[1][2] = loadImage('img/dice3.png');
  img[1][3] = loadImage('img/dice4.png');
  img[1][4] = loadImage('img/dice5.png');
  img[1][5] = loadImage('img/dice6.png');
  img[2] = new Array(5);
  img[2][0] = loadImage('img/tomato0.png');
  img[2][1] = loadImage('img/tomato1.png');
  img[2][2] = loadImage('img/tomato2.png');
  img[2][3] = loadImage('img/tomato3.png');
  img[2][4] = loadImage('img/tomato4.png');
}
// セットアップ
function setup() {    
  // キャンバス作成
  canvas = createCanvas(canvas_width, canvas_height);
  canvas.parent(document.getElementById('p5'));
  background(canvas_background);
  // ランダムシード
  frameRate(userFramerate);
  userTrialMax = 100;
  // HTML上の設定を読む
  changeExecMode();
  readHtmlSettings();

  loopOn = false;
  noLoop();
}

/** =====================================================
 *  画面の再初期化
 */
// キャンバスの再設定 HTMLで設定を変更するたびに呼ばれる
function initCanvas() {
  // 領域の初期化
  background(canvas_background);
  // 表示位置の設定
  const x0 = cvDraw.x + (cvDraw.w - (rvSize+rvInter.x) * userVarNumber) / 2;
  for (let i=0; i<userVarNumber; i++) {
    rvLeftTop[i] = {
      x: x0 + ( rvSize + rvInter.x ) * i,
      y: cvDraw.y + rvInter.y,
    };
  }
  dispSetting();
  if (!flag) dispValues();
}
// 現在の設定を表示する cvSetting を塗りつぶして設定文字列を描く
const dispSetting = ()=> {
  push();
  noStroke();
  fill(242);
  rect(cvSetting.x, cvSetting.y, cvSetting.w, cvSetting.h);
  textAlign(CENTER, CENTER);
  textSize(18);
  fill(0);
  const s = strVarSetting();
  text(`現在の設定：${s.type}, ${s.opt}`, cvSetting.x + cvSetting.w/2, cvSetting.y+cvSetting.h/2);
  if (!userManMode) {
    textSize(12);
    textAlign(RIGHT, CENTER);
    text(`試行:${trials+1}回目`, cvSetting.x + cvSetting.w-5, cvSetting.y+cvSetting.h/2);
  }
  pop();
}

/** =====================================================
 *  確率変数の動作と表示
 */
// 確率変数の新しい実現値を得る
const newValue = (d) => {
  let x;
  let rx;
  switch (d) {
    case 0:  // ベルヌーイ分布＝コイン
      x = rx = random(0, 1)<param.prob ? 1 : 0;
      break;
    case 1:  // 一様分布＝サイコロ
      x = floor(random(param.min-1, param.max));
      rx = x + 1;
      break;
    case 2:  // 正規分布＝ミニトマト
      const z = randomGaussian(0, 1);
      const sgn = z > 0? 1: -1;
      switch (round(abs(z) / 0.5)) {
        case 0: x = 0; break;
        case 1:
        case 2: x = 1; break;
        default: x = 2;
      }
      x = x * sgn + 2;
      rx = round(z * param.sigma + param.mu, 1);
      break;
  }
  return {x, rx};
}

// 確率変数の数だけループする
function dispValues() {
  push();
  fill(0);
  textSize(18);
  textAlign(CENTER, CENTER);
  for (let i=0; i<userVarNumber; i++) {
    // 実現値を得て、自動モードなら記録する
    const x = newValue(userVarType);
    if (!userManMode) rvdata.push(x.rx);
    // 画像を表示して
    image(img[userVarType][x.x], rvLeftTop[i].x, rvLeftTop[i].y, rvSize, rvSize);
    // 実現値も表示する
    text(x.rx, rvLeftTop[i].x+rvSize/2, rvLeftTop[i].y+rvSize+18);
  }
  pop();
  //console.log(rvdata);
}

/** 
 *  描画関数
 ===================================================== */
function draw() {
  if (loopOn) {
    initCanvas();
    flag = 1 - flag;
    trials += flag;
    if (trials>=userTrialMax) {
      dispResult();
      userManMode = true;
      changeExecMode();
    }
  }
}

// 自動モードの結果表示
function dispResult() {
  let mean = new Array(userVarNumber).fill(0);
  for (let i=0; i<rvdata.length; i++) {
    mean[i % userVarNumber] += rvdata[i];
  }
  for (let j=0; j<userVarNumber; j++) {
    mean[j] /= userTrialMax;
  }
  //console.log(mean);
  const nam = strVarSetting(userVarType).obj;
  let pstr = '';
  for (let j=0; j<userVarNumber; j++) {
    pstr += `${j+1}個目の${nam}：平均値 = ${mean[j].toFixed(2)}` + '<br />';
  }
  document.querySelector('#result').innerHTML = '<p>' + pstr + '</p>';
}


