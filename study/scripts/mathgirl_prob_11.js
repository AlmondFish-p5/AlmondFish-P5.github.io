/** =====================================================
 *  数学ガールの秘密ノート／確率の冒険　研究問題1-1
 *  mathgirl_study_11.js
 */

/**
 *  広域設定
 ========================================================= */
 
/**
 * ユーザ指定する変数
---------------------------------------------------------- */
let userProbability;  // 成功確率
let userTrialMax;     // 繰り返し回数指定

/**
 * キャンバスの指定
---------------------------------------------------------- */
// キャンバスオブジェクト
let canvas;
// キャンバスサイズと背景色
const canvas_width = 800;
const canvas_height = 460;
const canvas_background = 255;
// 描画領域指定
const cvHeader = {x:   0, y:   0, w: 800, h:  40, };
const cvCoins  = {x:   0, y:  40, w: 600, h: 200, };
const cvStats  = {x: 600, y:  40, w: 200, h: 200, };
  // 最後のsxはw/userTrialMaxで計算し直すこと！
let   cvGraph  = {x:  40, y: 250, w: 750, h: 200, f:450, sy:-200, sx:750/2000,};

/**
 * コインデータ
---------------------------------------------------------- */
// ローデータと表が出た相対度数集計
let coinData = [];
let coinProp = [];
// 何回目のコイン投げかをカウントする
let coinCounter = 0;
// コインのサイズと1個目の表示位置中心
const coinDiam = 30;
const coinCenter = {x: 40, y: 25,};
// コイン同士の間隔
const coinInter  = {x: 25, y: 35,};
// コインの表示位置を返す：coinCounterは0オリジンであること！
const coinPosition = (coinCounter) => {
  const cc = coinCounter % 100;
  const x = coinCenter.x + coinInter.x * (cc % 20);
  const y = coinCenter.y + coinInter.y * floor(cc / 20);
  return {x:cvCoins.x+x, y:cvCoins.y+y, };
};
// コインの動作：与えられている確率に従って0または1を返す
const CoinRoll = () =>{
  return (random(0, 1) < userProbability ? 1 : 0);
};
// コインの表示：与えられている2値に応じて表または裏の表示をする x,y:表示位置中心 d:直径
const CoinDraw = (value, x, y, d) => {
  const c = (value ? '#ff6600' : '#6699ff');
  push();
  fill(c);
  stroke('black');
  strokeWeight(1);
  circle(x, y, d);
  circle(x-1, y-0.5, d);
  pop();
};
// コインデータを作ってしまう
const makeData = (userProbability) => {
  coinData = new Array(userTrialMax).fill(0).map(()=>{
    return (random() < userProbability ? 1 : 0);
  });
};

/**
 * ループ制御
---------------------------------------------------------- */
let loopOn = false;
const userFramerate = 30;
let index = 0;

/**
 *  イベント設定
========================================================= */
// 実行ボタンクリック：シミュレーションの開始
document.querySelector('#btn_start').addEventListener('click', ()=>{
  document.querySelector('#btn_start').disabled = true;
  document.querySelector('#trial_number').disabled = true;
  document.querySelector('#coin_prob').disabled = true;
  initCanvas();
  trials = 0;
  loopOn = true;
  loop();
});
// リセットクリック：ページ再読み込み
document.querySelector('#btn_reset').addEventListener('click', ()=>{
  window.location.reload();
});

// HTML初期設定を読み込む
function readHtmlSettings() {
  userProbability = document.querySelector('#coin_prob').value * 1;
  userTrialMax = document.querySelector('#trial_number').value * 1;
}

/**
 *  初期化関数
========================================================= */
// 形式的初期化
function setup() {
  frameRate(userFramerate);
  loopOn = false;
  noLoop();
}
// 実行前の実質的な初期化
function initCanvas() {
  // ユーザ設定読み込み
  readHtmlSettings();
  cvGraph.sx = cvGraph.w/userTrialMax;
  // キャンバス作成
  canvas = createCanvas(canvas_width, canvas_height);
  canvas.parent(document.querySelector('#p5'));
  background(canvas_background);
  // コインデータを作ってしまう
  makeData(userProbability);
  coinCounter = 0;
}
// ヘッダ表示する
function dispHeader(s) {
  push();
  fill(0, 60, 60);
  noStroke();
  rect(cvHeader.x, cvHeader.y, cvHeader.w, cvHeader.h);
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(18);
  text(`コイン投げ　${s+1}回目～${min(s+100, userTrialMax)}回目`, cvHeader.x+cvHeader.w/2, cvHeader.h/2);
  pop();
}

/** 
 *  統計表示関数
===================================================== */
// 統計表示固定部分
const statsHead = () => {
  fill(0);
  textAlign(LEFT, BASELINE);
  text('回数', cvStats.x+10, cvStats.y+30);
  text('表の回数', cvStats.x+10, cvStats.y+60);
  text('相対度数', cvStats.x+10, cvStats.y+90);
};
// 各回の統計表示：n:コイン投げ回数, freq:表の出た合計回数
const statsEach = (n, freq) => {
  push();
  noStroke();
  fill(canvas_background);
  textSize(15);
  if (n==1) {
    rect(cvStats.x, cvStats.y, cvStats.w, cvStats.h);
    statsHead();
  } else {
    rect(cvStats.x+100, cvStats.y, cvStats.w-100, cvStats.h);
  }
  fill('darkblue');
  textAlign(RIGHT, BASELINE);
  text(n, cvStats.x+cvStats.w-20, cvStats.y+30);
  text(freq, cvStats.x+cvStats.w-20, cvStats.y+60);
  text((freq/n).toFixed(3), cvStats.x+cvStats.w-20, cvStats.y+90);
  pop();
};

/** 
 *  グラフ描画関数
===================================================== */
const graphMargin = 30; // メモリ表示の分のマージン
const graphHeight = 20; // グラフ1本の高さ
// グラフの軸を描画する
const drawAxis = (n) =>{
  push();
  if (n<1) {
    strokeWeight(1);
    stroke(0);
    
    // Y軸
    line(cvGraph.x, cvGraph.y, cvGraph.x, cvGraph.f);
    // X軸
    line(cvGraph.x, cvGraph.f, cvGraph.x+cvGraph.w, cvGraph.f);
    // prob表示線
    stroke('red');
    line(cvGraph.x, cvGraph.f+cvGraph.sy*userProbability, cvGraph.x+cvGraph.w, cvGraph.f+cvGraph.sy*userProbability);
  
    noStroke();
    fill(0);
    textAlign(RIGHT, CENTER);
    textSize(10);
    // Y軸単位表示
    text('1', cvGraph.x-2, cvGraph.y+5);
    text('0', cvGraph.x-2, cvGraph.f-5);
    text(userProbability, cvGraph.x-2, cvGraph.f+cvGraph.sy*userProbability);
  } else {
    strokeWeight(0.5);
    stroke(128);
    line(cvGraph.x+cvGraph.sx*n, cvGraph.y, cvGraph.x+cvGraph.sx*n, cvGraph.f)
    noStroke();
    fill(128);
    textAlign(RIGHT,BASELINE);
    textSize(10);
    text(n, cvGraph.x+cvGraph.sx*n-2, cvGraph.f-2);
  }
  pop();
};
const drawGraph = (n, p, q) => {
  push();
  stroke(0);
  strokeWeight(1.5);
//  point(cvGraph.x+cvGraph.sx*n, cvGraph.f+cvGraph.sy*p);
//  strokeWeight(0.5);
  line(cvGraph.x+cvGraph.sx*n, cvGraph.f+cvGraph.sy*p, cvGraph.x+cvGraph.sx*(n-1), cvGraph.f+cvGraph.sy*q);
  pop();
};

/** 
 *  描画関数
===================================================== */
function draw() {
  if (loopOn) {
    // ヘッダの表示、直前の100回を薄く消す
    if (coinCounter % 100==0) {
      dispHeader(coinCounter);
      push();
      fill(255, 196);
      noStroke();
      rect(cvCoins.x, cvCoins.y, cvCoins.w, cvCoins.h);
      pop();
      drawAxis(coinCounter);
    }
    // 表示位置の取得
    const p = coinPosition(coinCounter);
    let s = 0;
    CoinDraw(coinData[coinCounter], p.x, p.y, coinDiam);
    coinCounter++;
    for (let i=0; i<coinCounter; i++) s+=coinData[i];
    coinProp.push(s/coinCounter);
  // 1回ごとの統計データを表示する
    statsEach(coinCounter, s);
    // 折れ線グラフを描画する
    drawGraph(coinCounter, coinProp[coinCounter-1], coinProp[(coinCounter>1 ? coinCounter-2 : coinCounter-1)]);
    // 指定した回数投げ終わったか
    if (coinCounter>=userTrialMax) {
      loopOn = false;
      noLoop();
    }
  }
}
