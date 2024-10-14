/** =====================================================
 *  数学ガールの秘密ノート／確率の冒険　研究問題5-1
 *  mathgirl_study_51.js
 */

/**
 *  広域設定
 ========================================================= */
 
/**
 * ユーザ指定する変数
---------------------------------------------------------- */
let userDiceNumber;   // サイコロの本数
let userTrialMax;     // 繰り返し回数指定

/**
 * キャンバスの指定
---------------------------------------------------------- */
// キャンバスオブジェクト
let canvas;
// キャンバスサイズと背景色
const canvas_width = 900;
const canvas_height = 600;
const canvas_background = 255;
// 描画領域指定
const cvHeader = {x:   0, y:  0, w: 900, h:  50, };
const cvDice   = {x:   0, y: 50, w: 700, h: 550, };
const cvStat   = {x: 700, y: 50, w: 200, h: 550, };

/**
 * サイコロデータ
---------------------------------------------------------- */
// 現在のサイコロのデータ
let diceData = [];
let freqTable = [];   // 度数分布表
// サイコロのサイズ及び丸みと1個目の表示位置中心、表示間隔
const diceSize = 40;
const diceRound = 5;
const diceCenter = {x: 40, y: 25,};
const diceInter  = {x:  2, y: 10,};
// サイコロの表示位置を返す：lotCounter、drawCounterは0オリジンであること！
const dicePosition = (trials) => {
  let i = trials % 50;
  const x = (cvDice.w / 5) * floor(i/10) + diceSize/2 + 10;
  const y = (diceSize+diceInter.y) * (i%10) + diceSize/2 + 20 + cvDice.y;
  return {x:x, y:y, };
};
// 引数cの数だけサイコロを振る。cの数に関わらず配列を返す
const diceRoll = (c) => {
  return new Array(c).fill(0).map(v=>floor(random(0,6))+1);
};
// 配列dの要素数だけ、x,yを中心にjitだけ横にずらしながらサイコロを表示する
const diceShow = (d, x, y, jit) => {
  push();
  rectMode(CENTER);
  for (let i=0; i<d.length; i++) {
    diceShowOne(d[i], x+jit*i, y, );
  }
  rectMode(CORNER);
  pop();
};
// 目の数がdのサイコロをx,yの位置に表示する：rectMode(CENTER)を前提とする
const diceShowOne = (d, x, y) => {
  fill('white');
  stroke('black');
  strokeWeight(1);
  square(x, y, diceSize, diceRound);
  if (d==1) {
    strokeWeight(12);
    stroke('red');
    point(x, y);
  } else {
    const m = diceSize / 4;
    strokeWeight(7);
    point(x+m, y-m);  // 右上
    point(x-m, y+m);  // 左下
    if (d>=4) {
      point(x-m, y-m);  // 左上
      point(x+m, y+m);  // 右下
    }
    if (d%2) {
      point(x, y);    // 中央：黒
    }
    if (d==6) {
      point(x-m, y);  // 左中
      point(x+m, y);  // 右中
    }
  }
};

/**
 * ループ制御
---------------------------------------------------------- */
let loopOn = false;
let trials = 0;    // 試行回数
const userFramerate = 30;
let index = 0;
// グラフ表示倍率
let ratio = 1;

/**
 *  イベント設定
========================================================= */
// 実行ボタンクリック：シミュレーションの開始
document.querySelector('#btn_start').addEventListener('click', ()=>{
  document.querySelector('#btn_start').disabled = true;
  document.querySelector('#trial_number').disabled = true;
  document.querySelector('#dice_number').disabled = true;
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
  userDiceNumber = document.querySelector('#dice_number').value * 1;
  userTrialMax = document.querySelector('#trial_number').value * 1;
}

/**
 *  初期化関数
========================================================= */
// 形式的初期化
function setup() {
  frameRate(userFramerate);
  rectMode(CORNER);
  loopOn = false;
  noLoop();
}
// 実行前の実質的な初期化
function initCanvas() {
  // ユーザ設定読み込み
  readHtmlSettings();
  // キャンバス作成
  canvas = createCanvas(canvas_width, canvas_height);
  canvas.parent(document.querySelector('#p5'));
  background(canvas_background);
  // 度数分布表の初期化
  freqTable = new Array(userDiceNumber * 6 + 1).fill(0);
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
  text(`サイコロ投げ　${s+1}回目～${min(s+50, userTrialMax)}回目`, cvHeader.x+cvHeader.w/2, cvHeader.h/2);
  pop();
}

/** 
 *  描画関数
===================================================== */
function draw() {
  if (loopOn) {
    // ヘッダの表示、直前の100回を薄く消す
    if (trials % 50==0) {
      dispHeader(trials);
      push();
      fill(255, 196);
      noStroke();
      rect(cvDice.x, cvDice.y, cvDice.w, cvDice.h);
      pop();
    }
    // サイコロを振る
    const dat = diceRoll(userDiceNumber);
    let s = 0;
    dat.forEach((value) => {s+=value});
    diceData.push(dat);
    freqTable[s]++;
    // サイコロを描画する
    const p = dicePosition(trials);
    diceShow(dat, p.x, p.y, diceSize*0.9);
    trials++;
    // グラフを描画する
    dispStats();
    // 指定した回数投げ終わったか
    if (trials>=userTrialMax) {
      dispRelFreq();
      loopOn = false;
      noLoop();
    }
  }
}

const graphMargin = 20; // メモリ表示の分のマージン
const graphHeight = 20; // グラフ1本の高さ
// グラフ表示単位を返す
const graphScale = () => {
  return (cvStat.w-graphMargin-30) / (max(freqTable)+20);
}
// ----- 統計量を計算する、表示する
function dispStats() {
  // 描画モードの設定
  push();
  fill(canvas_background);
  noStroke();
  rect(cvStat.x, cvStat.y, cvStat.w, cvStat.h);

  // 統計領域の区画
  stroke(0);
  strokeWeight(0.5);
  line(cvStat.x+2, cvStat.y, cvStat.x+2, cvStat.y+cvStat.h);
  
  //軸の描画
  line(cvStat.x+graphMargin, cvStat.y+20, cvStat.x+graphMargin, cvStat.y+20+graphHeight*(freqTable.length)-userDiceNumber);

  // 目盛りの描画
  noStroke();
  fill(0);
  textAlign(RIGHT, CENTER);
  textSize(10);
  for (let i=userDiceNumber; i<freqTable.length; i++) {
    text(i, cvStat.x+graphMargin-2, cvStat.y+30+graphHeight*(i-userDiceNumber));
  }

  // グラフの描画
  fill(90, 255, 220);
  stroke(0);
  strokeWeight(0.5);
  for (let i=userDiceNumber; i<freqTable.length; i++) {
    rect(cvStat.x+graphMargin, cvStat.y+20+graphHeight*(i-userDiceNumber), freqTable[i]*graphScale(), graphHeight);
  }
  
  pop();
}
// 相対度数を表示する
const dispRelFreq = () => {
  push();
  fill('black');
  noStroke();
  textSize(10);
  textAlign(LEFT, CENTER);
  for (let i=userDiceNumber; i<freqTable.length; i++) {
    const p = freqTable[i]/userTrialMax;
    text(`${(p*100).toFixed(1)}％`, cvStat.x+graphMargin+freqTable[i]*graphScale()+2, cvStat.y+20+graphHeight*(i-userDiceNumber)+graphHeight/2);
  }
  pop();
};


