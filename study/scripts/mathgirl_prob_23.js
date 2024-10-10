/** =====================================================
 *  数学ガールの秘密ノート／確率の冒険　研究問題2-3
 *  mathgirl_study_23.js
 */

/**
 *  広域設定
 ========================================================= */
 
/**
 * ユーザ指定する変数
---------------------------------------------------------- */
let userLotNumber;    // くじの本数
let userTrialMax;     // 繰り返し回数指定
let userResultOny;    // 途中経過を表示しないオプション

/**
 * キャンバスの指定
---------------------------------------------------------- */
// キャンバスオブジェクト
let canvas;
// キャンバスサイズと背景色
const canvas_width = 800;
const canvas_height = 610;
const canvas_background = 255;
// 描画領域指定
const cvHeader = {x:   0, y:   0, w: 800, h:  40, };
const cvLots   = {x:   0, y:  40, w: 800, h: 360, };
let   cvGraph  = {x:   0, y: 400, w: 800, h: 200, f:580, sy:160/50, sx:15, };

/**
 * くじデータ
---------------------------------------------------------- */
// 現在引いているくじのデータと、当たりが出た順番の度数集計
let lotData = [];
let lotPrise = [];
// 何回目のくじ引きで、何本目を引いているかをカウントする
let lotCounter  = 0;
let drawCounter = 0;
// くじ引き結果のサイズと1個目の表示位置中心、表示間隔
const lotDiam   = 30;
const lotCenter = {x: 40, y: 25,};
const lotInter  = {x: 15, y: 35,};
// くじ引き結果の表示位置を返す：lotCounter、drawCounterは0オリジンであること！
const lotPosition = (lotCounter, drawCounter) => {
  const x = lotCenter.x + lotInter.x * drawCounter;
  const y = lotCenter.y + lotInter.y * (lotCounter % 10);
  return {x:cvLots.x+x, y:cvLots.y+y, };
};
// 新しいくじ引きセットの作成：指定本数(num)のくじを用意して1本だけあたりにする
const aNewLot = (num) =>{
  let x = new Array(num).fill(0);
  x[floor(random(0, num))] = 1;
  return x;
};
// くじ引き結果の表示：与えられている2値に応じて表または裏の表示をする x,y:表示位置中心 d:直径 n:何回目か
const aLotDraw = (value, x, y, d, n) => {
  push();
  fill(value ? '#ffee00' : '#cccccc');
  stroke(value ? 'red' : 'darkgrey');
  strokeWeight(1);
  circle(x, y, d);
  if (value) {
    circle(x-1, y-0.5, d);
    noStroke();
    fill('red');
    textSize(15);
    textAlign(CENTER, CENTER);
    text(n, x-1, y-1);
  }
  pop();
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
  document.querySelector('#lot_number').disabled = true;
  document.querySelector('#result_only').disabled = true;
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
  userLotNumber = document.querySelector('#lot_number').value * 1;
  userTrialMax = document.querySelector('#trial_number').value * 1;
  userResultOny = document.querySelector('#result_only').checked;
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
  cvGraph.sy = cvGraph.h / ((userTrialMax/userLotNumber)*(-4));
  // キャンバス作成
  canvas = createCanvas(canvas_width, canvas_height);
  canvas.parent(document.querySelector('#p5'));
  background(canvas_background);
  drawAxis();
  lotPrise = new Array(userLotNumber).fill(0);
  lotCounter = 0;
  drawCounter = -1;
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
  text(`くじ引き　${s+1}回目～${min(s+10, userTrialMax)}回目`, cvHeader.x+cvHeader.w/2, cvHeader.h/2);
  pop();
}

/** 
 *  統計表示関数
===================================================== */
// 統計表示固定部分
// 各回の統計表示：

/** 
 *  グラフ描画関数
===================================================== */
// グラフの軸を描画する
const drawAxis = () => {
  push();
  strokeWeight(1);
  stroke(0);
  
  // Y軸
  line(cvGraph.x, cvGraph.y+10, cvGraph.x, cvGraph.f);
  // X軸
  line(cvGraph.x, cvGraph.f, cvGraph.x+cvGraph.w, cvGraph.f);

  noStroke();
  fill(0);
  textAlign(CENTER, TOP);
  textSize(8);
  // X軸表示
  for (let i=0; i<userLotNumber; i++) {
    text((i+1), lotCenter.x+cvGraph.sx*i, cvGraph.f+5);
  }
  pop();
};
const bw = 12;
const drawGraph = () => {
  push();
  stroke('#990000');
  strokeWeight(0.5);
  fill('#ff6600');
  for (let i=0; i<userLotNumber; i++) {
    if (lotPrise[i])
      rect(lotCenter.x+cvGraph.sx*i-bw/2, cvGraph.f, bw, lotPrise[i]*cvGraph.sy);
  }
  pop();
};
const drawResult = () => {
  push();
  noStroke();
  fill(0);
  textSize(10);
  textAlign(CENTER, BASELINE);
  for (let i=0; i<userLotNumber; i++) {
    text(lotPrise[i], lotCenter.x+cvGraph.sx*i, cvGraph.f+lotPrise[i]*cvGraph.sy-3);
  }
  pop();
};

/** 
 *  描画関数
===================================================== */
function draw() {
  if (loopOn) {
    // ヘッダの表示、直前の100回を薄く消す
    if (lotCounter % 10==0 && drawCounter<0) {
      dispHeader(lotCounter);
      push();
      fill(255, 196);
      noStroke();
      rect(cvLots.x, cvLots.y, cvLots.w, cvLots.h);
      pop();
    }
    /////////////////// 途中経過省略モード
    if (userResultOny) {
      lotData = aNewLot(userLotNumber);
      for (let i=0; i<userLotNumber; i++) {
        // 表示位置の取得
        const p = lotPosition(lotCounter, i);
        aLotDraw(lotData[i], p.x, p.y, lotDiam, i+1);
        if (lotData[i]) {
          lotPrise[i]++;
          break;
        }
      }
      lotCounter++;
    }
    /////////////////// 途中経過表示モード
    else {
      // 当たりが出たので1回だけ何もしない
      if (drawCounter > 998) {
        // do nothing;
        drawCounter -= 1000;
      } else {
        // 新しいくじが作成されていないとき
        if (drawCounter < 0) {
          lotData = aNewLot(userLotNumber);
          drawCounter = 0;
        }
        // 表示位置の取得
        const p = lotPosition(lotCounter, drawCounter);
        aLotDraw(lotData[drawCounter], p.x, p.y, lotDiam, drawCounter+1);
        // 当たりが出たら現在のくじ引きを終了する
        if (lotData[drawCounter]) {
          // 当たり番目を記録する
          lotPrise[drawCounter]++;
          drawCounter = 2999;
          lotCounter++;
        } else {
          // くじ引き回数を増やす
          drawCounter++;
        }
      }
    }
    // グラフを描画する
    drawGraph();
    // 指定した回数投げ終わったか
    if (lotCounter>=userTrialMax) {
      drawResult();
      loopOn = false;
      noLoop();
    }
  }
}
