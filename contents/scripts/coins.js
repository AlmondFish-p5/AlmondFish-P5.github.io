/** =====================================================
 *  二項分布シミュレーション 試作品2
 *  coin.js
 */

/** =====================================================
 *  広域変数
 */
 
// ユーザ指定する変数
let userProbability;  // 成功確率
let userCoinNumber;   // 試行回数
let userTrialMax;     // 繰り返し回数指定
const maxCoinNumber = 20;
const maxTrialMax = 5000;
const minTrialMax = 500;

// これらの変数に影響される広域変数
let canvas;
const canvas_width = 880;
const canvas_height = 600;
const cvHeader = {x:   0, y:  0, w: 880, h:  50, };
const cvDraw   = {x:   0, y: 50, w: 680, h: 550, };;
const cvStat   = {x: 680, y: 50, w: 200, h: 550, };;
const canvas_background = 240;

// 確率変数コイン
let Coin = [];        // userCoinNumber個、最大20個
// 確率変数コイン1個のサイズ：これがすべての大きさの基準になる
let coinSize = 30;
// コイン同士の間隔
const coinInter = {x: 3, y:10};
// コインを表示する位置（サイコロの中心位置）
let coinCenter = [];

// 統計データ
let freqTable;

// サイコロ表示位置をずらす大きさ
let jit = {x:3, y:2};

// その他の広域変数
let loopOn = false;
let userFramerate = 30;
let index = 0;
let trials = 0;    // 試行回数
let coinStats = []; // 統計用蓄積データ


// 四角形描画関数 args には、fill, stroke, strokeWeightを指定できる
function myRect(obj, ...args) {
  const v = Object.values(obj);
  push();
  if (args.length > 0) fill(args[0]);
  if (args.length > 1) {
    if (args[1] < 0) noStroke();
    else {strokeWeight(args[2]); stroke(args[1]);}
  }
  rect(v[0], v[1], v[2], v[3]);
  pop();
}

/** =====================================================
 *  Start ボタンのクリック
 */
document.getElementById("btn_start").onclick = function(){
  document.getElementById('btn_start').disabled = true;
  document.getElementById('trial_number').disabled = true;
  document.getElementById('coin_number').disabled = true;
  document.getElementById('success_prob').disabled = true;
  initCanvas();
  trials = 0;
  loopOn = true;
  loop();
}
// ページ再読み込み
document.querySelector('#btn_reset').addEventListener('click', ()=>{
  window.location.reload();
});

// HTML初期設定を読み込む
function readHtmlSettings() {
  userProbability = document.querySelector('#success_prob').value * 1;
  userCoinNumber = document.querySelector('#coin_number').value * 1;
  if (userCoinNumber > maxCoinNumber) {
    userCoinNumber = maxCoinNumber;
    document.querySelector('#coin_number').value = userCoinNumber;
  } else if (userCoinNumber < 1) {
    userCoinNumber = 1;
    document.querySelector('#coin_number').value = userCoinNumber;
  }
  userTrialMax = document.querySelector('#trial_number').value * 1;
  if (userTrialMax > maxTrialMax) {
    userTrialMax = maxTrialMax;
    document.querySelector('#trial_number').value = userTrialMax;
  } else if (userTrialMax < minTrialMax) {
    userTrialMax = minTrialMax;
    document.querySelector('#trial_number').value = userTrialMax;
  }
}

/** =====================================================
 *  初期化関数
 */
function setup() {
  // ランダムシード
  randomSeed(minute() + second());
  frameRate(userFramerate);
  // HTML上の設定を読む
  readHtmlSettings();
  loopOn = false;
  noLoop();
}

// キャンバスの再設定
function initCanvas() {
  // 初期化
  readHtmlSettings();
  if (userCoinNumber <= 5) {
    coinSize = 40;
  } else if (userCoinNumber <= 10) {
    coinSize = 35;
  } else if (userCoinNumber <= 15) {
    coinSize = 32;
  } else {
    coinSize = 30;
  }
  freqTable = new Array(userCoinNumber + 1).fill(0);

  // キャンバス作成
  canvas = createCanvas(canvas_width, canvas_height);
  canvas.parent(document.getElementById('p5'));
  background(canvas_background);
  
  // 表示位置の設定
  const x0 = cvDraw.x + (cvDraw.w - (coinSize+coinInter.x) * (userCoinNumber-1) ) / 2;
  for (let i=0; i<userCoinNumber; i++) {
    coinCenter[i] = {
      x: x0 + ( coinSize + coinInter.x ) * i,
      y: cvDraw.y + coinSize / 2 + coinInter.y,
    };
  }
  makeCoin();
}
// ----- ヘッダを表示する
function dispHeader(s) {
  // ヘッダの表示
  push();
  myRect(cvHeader, color(0, 60, 60), -1);
  noStroke();
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(18);
  text(`試　　行（${s}回～${s+49}回）`, cvDraw.x+cvDraw.w/2, cvHeader.h/2);
  text('結果', cvStat.x+cvStat.w/2, cvHeader.h/2);
  pop();
}

// ----- コインをつくる
function makeCoin() {
  Coin = [];
  coinStats = [];
  for (let i=0; i<userCoinNumber; i++) {
    Coin[i] = new rvCoin(coinCenter[i].x, coinCenter[i].y, coinSize, userProbability, i) // xy座標, サイズ（半径）, 成功確率, 識別番号
  }
}




/** =====================================================
 *  結果表示
 */
const graphMargin = 30; // メモリ表示の分のマージン
const graphHeight = 20; // グラフ1本の高さ
// ----- 統計量を計算する、表示する
function dispStats() {
  // 描画モードの設定
  push();

  // 消す
  myRect(cvStat, canvas_background, -1);

  // 統計領域の区画
  stroke(0);
  strokeWeight(0.5);
  line(cvStat.x+2, cvStat.y, cvStat.x+2, cvStat.y+cvStat.h);
  
  //軸の描画
  line(cvStat.x+graphMargin, cvStat.y+20, cvStat.x+graphMargin, cvStat.y+20+graphHeight*freqTable.length);

  // 目盛りの描画
  noStroke();
  fill(0);
  textAlign(RIGHT, CENTER);
  textSize(15);
  for (let i=0; i<freqTable.length; i++) {
    text(i, cvStat.x+graphMargin-2, cvStat.y+30+graphHeight*i);
  }

  // スケールの設定
  const graphScale = (cvStat.w-graphMargin-10) / (max(freqTable)+10);

  // グラフの描画
  fill(90, 255, 220);
  stroke(0);
  strokeWeight(0.5);
  for (let i=0; i<freqTable.length; i++) {
    rect(cvStat.x+graphMargin, cvStat.y+20+graphHeight*i, freqTable[i]*graphScale, graphHeight);
  }
  
  pop();
}

const txt_x = cvStat.x + 20;
const txt_y = 510;
// 最後の統計
function dispMeans() {
  push();
  noStroke();
  fill('black');
  textSize(15);
  textAlign(LEFT, TOP);
  
  text('平均 = '+calc_mean(coinStats).toFixed(2), txt_x, txt_y);
  text('分散 = '+calc_variance(coinStats).toFixed(2), txt_x, txt_y+20);

  pop();
}
/** 
 *  描画関数
 ===================================================== */
function draw() {
  if (loopOn) {
    {
      trials++;
      // ヘッダの表示
      if (trials % 50==1) dispHeader(trials);
      jit.x = random(-5,5);
      jit.y = coinInter.y * (trials % 50);
      let s = 0;
      Coin.forEach((element, index)=>{
        const pos = {
          x: coinCenter[index].x + jit.x,
          y: coinCenter[index].y + jit.y,
        };
        s += element.roll();
        element.position = pos;
      });
      freqTable[s]++;
      coinStats.push(s);
      dispStats();
      myRect(cvDraw, color(240,24), -1);
    }
    if (trials>=userTrialMax) {
      dispMeans();
      prepairDownload();
      noLoop();
    }
    index++;
  }
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
      data.push('X');
      for (let i=0; i<userTrialMax; i++) {
        data.push(coinStats[i]);
      }
      break;
    // ---------------------- 統計データの作成
    case 'stats_data':
      break;
    // ---------------------- スクリプトの作成
    case 'script':
      data.push('## コイン投げシミュレーション');
      data.push('# データ読み込み');
      data.push('df <- read.csv("raw_data.csv")');
      data.push('head(df)');
      data.push('# 度数分布');
      data.push('(t <- table(df$X))');
      data.push('barplot(t)');
      data.push('# 統計量');
      data.push('stats <- c(mean(df$X), var(df$X), sd(df$X), median(df$X))');
      data.push('names(stats) <- c("平均","分散","標準偏差", "中央値")');
      data.push('print(stats)');
      break;
    default:
      return null;
  }
  data.push('');
  return data.join('\n');
}



