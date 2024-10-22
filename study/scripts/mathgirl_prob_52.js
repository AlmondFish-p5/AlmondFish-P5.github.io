/** =====================================================
 *  数学ガールの秘密ノート／確率の冒険　研究問題5-2
 *  mathgirl_study_52.js
 */

/**
 *  広域設定
 ========================================================= */
 
/**
 * ユーザ指定する変数
---------------------------------------------------------- */
// 以下、インデックス0をAさん、インデックス1をBさんとして扱う
let userProbability;  // コイン投げの表の確率
let userShortage = [0, 0];   // 不足しているポイント
let userTrialMax;     // 繰り返し回数指定

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
const cvMatch  = {x:   0, y:  40, w: 400, h: 360, };
let   cvStats  = {x: 400, y:  40, w: 400, h: 360, zx:470, zy:80, sx:0, sy:40, gh:35, };
let   cvGraph  = {x:  50, y: 400, w: 750, h: 200, f:600, sy:-200, sx:750/2000};

/**
 *  未完のゲームデータ
---------------------------------------------------------- */
// 現在の勝負データと、勝者の度数集計
let matchData = [0, 0];
let matchWinner = [0, 0];
let maxDraw = 0;
// 勝負がついているかどうかの判定
let matchFinished;
// 勝負の記録 {key: 勝敗[a_b], prob: その理論確率, res: シミュレーション結果, pos: 勝敗がついた位置, });
let sysAnswer = [];
let sysProb = [];
// 期待勝率
let sysExpected = 0;
// 何回目の勝負で、何回目のコイン投げかをカウントする
let matchCounter  = 0;
let drawCounter = 0;
// くじ引き結果のサイズと1個目の表示位置中心、表示間隔
const coinDiam   = 30;
const coinCenter = {x: 30, y: 25,};
const coinInter  = {x: 32, y: 35,};
// 色設定をまとめてしておく
const col = {
  fill: ['#cc6644', '#229933', '#fff7e7', '#d7ffe7'],
  border: ['#cc3300', '#336622', '#ffddcc', '#aaeebb'],
  graph: ['#fca800', '#34582c'],
};
// コイン投げ結果の表示位置を返す：lotCounter、drawCounterは0オリジンであること！
const coinPosition = (matchCounter, drawCounter) => {
  const x = coinCenter.x + coinInter.x * drawCounter;
  const y = coinCenter.y + coinInter.y * (matchCounter % 10);
  return {x:cvMatch.x+x, y:cvMatch.y+y, };
};
// 新しい勝負の作成：指定した不足点数(userShortage={a:0, b:0})を変数に格納、コイン投げの実施
function makeNewMatch() {
  matchData = [userShortage[0], userShortage[1]];
  matchFinished = false;
  // Aが勝ちの時データが0になることに注意！
  let roll = new Array(maxDraw).fill(0).map((value) => {
    return (random(0,1) < userProbability ? 0 : 1);
  });
  let s = 0;
  for (let i=0; i<maxDraw; i++) s+=roll[i];
  // A,Bそれぞれの勝ち数、コイン投げの結果を返す。
  return {a:maxDraw-s, b:s, roll:roll, };
}
// コイン投げ勝負結果の表示：2値に応じてB/Aの色表示をする x,y:表示位置中心 d:直径
const aMatchDraw = (value, x, y, d, fin) => {
  push();
  fill(col.fill[fin ? value+2 : value]);
  stroke(col.border[fin ? value+2 : value]);
  strokeWeight(1.5);
  circle(x, y, d);
  noStroke();
  fill(fin ? 'grey' : 'white');
  textSize(fin ? 10 : 15);
  textAlign(CENTER, CENTER);
  text((value ? 'B' : 'A'), x, y);
  pop();
};

/**
 * ループ制御
---------------------------------------------------------- */
let loopOn = false;
const userFramerate = 20;
let index = 0;

/**
 *  イベント設定
========================================================= */
// 実行ボタンクリック：シミュレーションの開始
document.querySelector('#btn_start').addEventListener('click', ()=>{
  document.querySelector('#btn_start').disabled = true;
  document.querySelector('#trial_number').disabled = true;
  document.querySelector('#user_prob').disabled = true;
  document.querySelector('#shortage_0').disabled = true;
  document.querySelector('#shortage_1').disabled = true;
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
  userProbability = document.querySelector('#user_prob').value * 1;
  userTrialMax = document.querySelector('#trial_number').value * 1;
  userShortage[0] = document.querySelector('#shortage_0').value * 1;
  userShortage[1] = document.querySelector('#shortage_1').value * 1;
  maxDraw = userShortage[0] + userShortage[1] - 1;
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
  // 理論値の計算と記録の準備
  sysAnswer = calcAnswer();
  document.querySelector('#expected').textContent = `プレーヤーAの期待勝率は${(sysExpected*100).toFixed(1)}％です。`;
  // キャンバス作成
  canvas = createCanvas(canvas_width, canvas_height);
  canvas.parent(document.querySelector('#p5'));
  background(canvas_background);
  dispStatsAxis();
  matchCounter = 0;
  drawCounter = -1;
  sysProb = [];
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
  text(`未完のゲーム　${s+1}回目～${min(s+10, userTrialMax)}回目`, cvHeader.x+cvHeader.w/2, cvHeader.h/2);
  pop();
}

/** 
 *  理論値計算と表示
===================================================== */
// ------------------ 基礎関数群
// 階乗計算の値を定数にしておく
const fact_num = [1, 1, 2, 6, 24, 120, 120*6, 120*6*7];
// 確率pのn乗を計算する 7乗までしか対応しない
const fact_prob = (p, n) => {
  if (n>8) return null;
  let x = 1;
  for (let i=n; i>=1; i--) {
    x *= p;
  }
  return x;
};
// 二項係数の値を計算する n<=7, k<=7 しか受け付けていない
const choose = (n, k) => {
  if ((n <= 7) && (k <= 7)) {
    return (fact_num[n] / (fact_num[k] * fact_num[n-k]));
  } else {
    return null;
  }
};
// 二項分布の確率を計算する 確率pの二項分布(n \choose k)の確率
const pbinom = (n, k, p) => {
  return (choose(n,k) * fact_prob(p, k) * fact_prob(1-p, n-k));
};
// ---------------- 理論値を計算する
function calcAnswer() {
  let ans = [];
  const n = userShortage[0] + userShortage[1] - 1;
  sysExpected = 0;
  for (let k=0; k<=n; k++) {
    const prob = pbinom(n, k, userProbability);
    ans.push({win: {a:k, b:n-k, }, prob: prob, res: 0, });
    if (n-k < userShortage[1]) sysExpected += prob;
  }
  return ans;
}

/** 
 *  統計表示関数
===================================================== */
// 統計表示固定部分
function dispStatsAxis() {
  push();
  // まず消す
  fill('white');
  noStroke();
  rect(cvStats.x, cvStats.y, cvStats.w, cvStats.h);
  // 縦軸
  stroke('black');
  strokeWeight(1);
  line(cvStats.zx, cvStats.zy-cvStats.sy, cvStats.zx, cvStats.zy+cvStats.sy*maxDraw+15);
  // 目盛表示
  noStroke();
  fill('black');
  textSize(12);
  textAlign(RIGHT, CENTER);
  for (let i=0; i<=maxDraw; i++) {
    text(`${sysAnswer[maxDraw-i].win.a}勝${sysAnswer[maxDraw-i].win.b}敗`, cvStats.zx-2, cvStats.zy+cvStats.sy*i-15);
  }
  //　横軸の表示単位を設定する
  const pr = sysAnswer.map(item => item.prob);
  cvStats.sx = 300 / (max(pr)*1.5*userTrialMax);
  pop();
}
// 各回の統計表示
function dispStats() {
  push();
  noStroke();
  for (let i=0; i<=maxDraw; i++) {
    fill(sysAnswer[maxDraw-i].win.b<userShortage[1] ? col.fill[0] : col.fill[1]);
    rect(cvStats.zx, cvStats.zy+cvStats.sy*i-30, cvStats.sx*sysAnswer[maxDraw-i].res, 30);
  }
  pop();
}
// 最後の統計表示
function dispTotalStats() {
  push();
  noStroke();
  for (let i=0; i<=maxDraw; i++) {
    const x = cvStats.zx+cvStats.sx*sysAnswer[maxDraw-i].res;
    const y = cvStats.zy+cvStats.sy*i;
    fill('black');
    textSize(12);
    textAlign(LEFT, BASELINE);
    text(`理論値:${(sysAnswer[maxDraw-i].prob*100).toFixed(1)}%`, x+2, y-18);
    text(`実測値:${(sysAnswer[maxDraw-i].res/userTrialMax*100).toFixed(1)}%`, x+2, y-4);
    textAlign(RIGHT, BASELINE);
    fill('white');
    textSize(15);
    text(sysAnswer[maxDraw-i].res, x-2, y-11);
  }
  document.querySelector('#simulated').textContent = `今回のシミュレーションでのAの勝率は${(sysProb[userTrialMax-1]*100).toFixed(1)}％でした。`;
  pop();
}

/** 
 *  グラフ描画関数
===================================================== */
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
    // 理論勝率表示線
    stroke('red');
    line(cvGraph.x, cvGraph.f+cvGraph.sy*sysExpected, cvGraph.x+cvGraph.w, cvGraph.f+cvGraph.sy*sysExpected);
  
    noStroke();
    fill(0);
    textAlign(RIGHT, CENTER);
    textSize(10);
    // Y軸単位表示
    text('1', cvGraph.x-2, cvGraph.y+5);
    text('0', cvGraph.x-2, cvGraph.f-5);
    text(sysExpected.toFixed(3), cvGraph.x-2, cvGraph.f+cvGraph.sy*sysExpected);
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
// 折れ線グラフを表示する
const drawGraph = (n, p, q) => {
  push();
  stroke(0);
  strokeWeight(1.5);
  line(cvGraph.x+cvGraph.sx*n, cvGraph.f+cvGraph.sy*p, cvGraph.x+cvGraph.sx*(n-1), cvGraph.f+cvGraph.sy*q);
  pop();
};

/** 
 *  描画関数
===================================================== */
function draw() {
  if (loopOn) {
    // ヘッダの表示、直前の100回を薄く消す
    if (matchCounter % 10==0 && drawCounter<0) {
      dispHeader(matchCounter);
      push();
      fill(255, 196);
      noStroke();
      rect(cvMatch.x, cvMatch.y, cvMatch.w, cvMatch.h);
      pop();
      if (matchCounter % 100==0) drawAxis(matchCounter);
    }
    // プレーヤーの勝ち数が返ってくるw=[Aの勝ち数, Bの勝ち数]
    let game = makeNewMatch(); // この関数内でmatchDataを初期化していることに注意！
    sysAnswer[game.a].res++;
    drawCounter = 0;
    for (let i=0; i<maxDraw; i++) {
      // コイン投げの結果を呼び出す
      const x = game.roll.pop();
      // 結果を記録する
      matchData[x]--;
      // 表示位置を計算して
      const p = coinPosition(matchCounter, i);
      // コイン投げの結果を表示する
      aMatchDraw(x, p.x, p.y, coinDiam, matchFinished);
      // ゲームが終わっているかを調べる
      if (!matchFinished) {
        matchFinished = (matchData[0] * matchData[1]==0);
        // 終わっていたら勝敗を記録する
        if (matchFinished) {
          matchWinner[x]++;
          sysProb.push(matchWinner[0]/(matchWinner[0]+matchWinner[1]));
        }
      }
      drawCounter = -1;
      dispStats();
    }
    matchCounter++;
    // グラフを描画する
    drawGraph(matchCounter, sysProb[matchCounter-1], sysProb[(matchCounter>1 ? matchCounter-2 : matchCounter-1)]);
    // 指定した回数投げ終わったか
    if (matchCounter>=userTrialMax) {
      dispTotalStats();
      loopOn = false;
      noLoop();
    }
  }
}
