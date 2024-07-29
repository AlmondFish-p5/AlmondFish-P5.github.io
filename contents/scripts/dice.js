/** =====================================================
 *  サイコロシミュレーション 試作品3
 *  Random Variables 'DICE'
 *  dice.js
 */

/** =====================================================
 *  広域変数
 */
 
// HTMLで指定する変数
let userDiceNumber;
let userTrialMax;       // 試行回数指定
let userDiceProb = [];  // 確率指定
const maxDiceNumber = 3;
const maxTrialMax = 5000;
const minTrialMax = 500;

// 確率変数ダイス1個のサイズ：これがすべての大きさの基準になる
const diceSize = 40;
const diceInter = {x: 2, y:10};

// これらの変数に影響される広域変数
let canvas;
const canvas_width = 880;
const canvas_height = 600;
const cvHeader = {x:   0, y:  0, w: 900, h:  50, };
const cvDraw   = {x:   0, y: 50, w: 700, h: 550, };;
const cvStat   = {x: 700, y: 50, w: 200, h: 550, };;
const canvas_background = 240;


// その他の広域変数
let Dice = [];
const userFrameRate = 20;
// サイコロを表示する位置（サイコロの中心位置）
let diceCenter = [];
// サイコロ表示位置をずらす大きさ
let jit = {x:3, y:2};
// グラフ表示倍率
let ratio = 1;


let loopOn = false;
let index = 0;
let trials = 0;    // 試行回数
const dispDice = 50;
let diceValue = [];

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
  initCanvas();
  trials = 0;
  diceShadow();
  loopOn = true;
  loop();
}
// ページ再読み込み
document.querySelector('#btn_reset').addEventListener('click', ()=>{
  window.location.reload();
});


/** =====================================================
 *  初期化関数
 */
function setup() {
  const seed =  minute() + second();
  randomSeed(seed);
  rectMode(CORNER);
  frameRate(userFrameRate);
  loopOn = false;
}

// HTML初期設定を読み込む
function readHtmlSettings() {
  userDiceNumber = document.querySelector('#dice_number').value * 1;
  if (userDiceNumber > maxDiceNumber) {
    userDiceNumber = maxDiceNumber;
    document.querySelector('#dice_number').value = userDiceNumber;
  } else if (userDiceNumber < 1) {
    userDiceNumber = 1;
    document.querySelector('#dice_number').value = userDiceNumber;
  }
  userTrialMax = document.querySelector('#trial_number').value * 1;
  if (userTrialMax > maxTrialMax) {
    userTrialMax = maxTrialMax;
    document.querySelector('#trial_number').value = userTrialMax;
  } else if (userTrialMax < minTrialMax) {
    userTrialMax = minTrialMax;
    document.querySelector('#trial_number').value = userTrialMax;
  }
  const ptmp = document.querySelector('#dice_ratio').value;
  userDiceProb = ptmp.split(':');
  if (userDiceProb.length != 6) {
    userDiceProb = [1,1,1,1,1,1];
  } else {
    userDiceProb = userDiceProb.map((value)=>{ return Math.floor(value);});
  }
  document.querySelector('#dice_ratio').value = userDiceProb.join(':');
}

// キャンバスの再設定
function initCanvas() {
  // HTML上の設定を読む
  readHtmlSettings();

  // キャンバス作成
  canvas = createCanvas(canvas_width, canvas_height);
  canvas.parent(document.querySelector('#p5'));
  background(canvas_background);
  freqTable = new Array(userDiceNumber * 6 + 1).fill(0);

  // 表示位置の設定
  for (let i=0; i<dispDice; i++) {
    diceCenter[i] = {
      x: (cvDraw.w / 5) * Math.floor(i/10) + diceSize/2 + 10,
      y: (diceSize+diceInter.y) * (i%10) + diceSize/2 + 20 + cvHeader.h,
    };
  }
  for (let j=0; j<userDiceNumber; j++) {
    Dice[j] = new rvDice(diceCenter[0].x + diceSize*j, diceCenter[0].y, 40, userDiceProb);
  }
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
  line(cvStat.x+graphMargin, cvStat.y+20, cvStat.x+graphMargin, cvStat.y+20+graphHeight*(freqTable.length)-userDiceNumber);

  // 目盛りの描画
  noStroke();
  fill(0);
  textAlign(RIGHT, CENTER);
  textSize(15);
  for (let i=userDiceNumber; i<freqTable.length; i++) {
    text(i, cvStat.x+graphMargin-2, cvStat.y+30+graphHeight*(i-userDiceNumber));
  }

  // スケールの設定
  const graphScale = (cvStat.w-graphMargin-10) / (max(freqTable)+10);

  // グラフの描画
  fill(90, 255, 220);
  stroke(0);
  strokeWeight(0.5);
  for (let i=userDiceNumber; i<freqTable.length; i++) {
    rect(cvStat.x+graphMargin, cvStat.y+20+graphHeight*(i-userDiceNumber), freqTable[i]*graphScale, graphHeight);
  }
  
  pop();
}

// 最後の統計
const txt_x = cvStat.x + 20;
const txt_y = 510;
function dispMeans() {
  push();
  noStroke();
  fill('black');
  textSize(15);
  textAlign(LEFT, TOP);
  text('平均 = '+calc_mean(diceValue).toFixed(2), txt_x, txt_y);
  text('分散 = '+calc_variance(diceValue).toFixed(2), txt_x, txt_y+20);
  
  pop();
}

/** =====================================================
 *  描画関数
 */
function draw() {
  if (loopOn) {
    // ヘッダの表示
    if (trials % 50==0) dispHeader(trials+1);
    v = 0;
    Dice.forEach((dice, index) => {
      let p = {x:diceCenter[trials%50].x + (diceSize-2)*index, y:diceCenter[trials%50].y, };
      dice.position = p;
      v += dice.roll();
    });
    freqTable[v]++;
    diceValue.push(v);
    dispStats();
    trials++;
    if (trials>=userTrialMax) {
      dispMeans();
      prepairDownload();
      noLoop();
    } else {
      index++;
      if (index >= 50) {
        index = 0;
        diceShadow();
      }
      Dice.forEach((dice, index) => {
        let p = {x:diceCenter[trials%50].x + (diceSize-2)*index, y:diceCenter[trials%50].y, };
        dice.position = p;
      });
    }
  }
}

// サイコロ領域に影をつける
function diceShadow() {
  push();
  myRect(cvDraw, color(canvas_background, 160), -1);
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
      data.push('X');
      for (let i=0; i<userTrialMax; i++) {
        data.push(diceValue[i]);
      }
      break;
    // ---------------------- 統計データの作成
    case 'stats_data':
      break;
    // ---------------------- スクリプトの作成
    case 'script':
      data.push('## サイコロ投げシミュレーション');
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


