/** 
 *  確率変数の性質
 *  what_is_rv.js
 */


// オブジェクトインスタンス
let rvPlot;       // 確率変数
let rvFunc;       // 密度関数
let rvHist;       // ヒストグラム
let userParameter = [
  {n:1, prob:0.5, },    // 分布０：ベルヌーイ
  {n:2, prob:0.5, },    // 分布１：二項
  {mu:0, sigma:1, },    // 分布２：正規
  {min:0, max:0, },     // 分布３：一様
  ];
let userVarNumber;
let userDistType;
let userSimType = -1;
let userMaxTrials = 0;
let userGraphOptimize = false;

// キャンバス
let canvas;
const canvas_width = 900;
const canvas_height = 500;
const canvas_background = 255;
const userFramerate = 30;

// プロット座標
const plotFunction = {x:   0, y:   0, w: 700, h: 200, };
const plotBars     = {x:   0, y:   0, w: 700, h: 200, };
const plotDots     = {x:   0, y: 200, w: 700, h:  15, };
const plotLines    = {x:   0, y: 215, w: 700, h:  50, };
const plotHistgram = {x:   0, y: 270, w: 700, h: 200, };
const plotValues   = {x: 710, y: 200, w: 190, h:  40, };

// ループ制御変数
let loopOn = false;
let trialIndex = -1;

// 座標サイズ
let cvInterval = {min:1000, max:-1000, };

/**
 *  分布の選択
 ------------------------------------------------------- */
// 分布の選択をするコンボ
const selDist = document.querySelector('#select_dist');
// 選択した時に表示したいp要素群
const settingDist = document.querySelectorAll('.dist_setting');
selDist.addEventListener('change', ()=>{
  const idstr = `${selDist.id}_${selDist.value}`;
  settingDist.forEach((element) => {
    if (element.id==idstr) {
      element.style.display = 'block';
      document.querySelector('#btn_onetime').disabled = false;
      document.querySelector('#trial_number').disabled = false;
      document.querySelector('#btn_start').disabled = false;
      // このタイミングでグラフを表示してしまう
      setInitial();
    } else {
      element.style.display = 'none';
    }
  });
  
})

/**
 *  イベント設定
 ======================================================= */
// パラメータを変更するたびにグラフが書き換わるようにするために
document.querySelector('#dist_0_prob').addEventListener('input', setInitial);
document.querySelector('#dist_1_n').addEventListener('input', setInitial);
document.querySelector('#dist_1_prob').addEventListener('input', setInitial);
document.querySelector('#dist_2_mu').addEventListener('input', setInitial);
document.querySelector('#dist_2_sigma').addEventListener('input', setInitial);
document.querySelector('#dist_3_min').addEventListener('input', setInitial);
document.querySelector('#dist_3_max').addEventListener('input', setInitial);
const opt_check = document.querySelectorAll('.opt');
opt_check[0].addEventListener('change', (e)=>{
  userGraphOptimize = e.target.checked;
  opt_check[1].checked = e.target.checked;
  setInitial();
});
opt_check[1].addEventListener('change', (element)=>{
  userGraphOptimize = e.target.checked;
  opt_check[1].checked = e.target.checked;
  setInitial();
});
// 実行ボタン btn_start
document.querySelector('#btn_start').addEventListener('click', () => {
  userMaxTrials = document.querySelector('#trial_number').value * 1;
  stopControles(true);
  if (trialIndex < 0) {
    trialIndex = 0;
    setInitial();
  }
  // このタイミングでグラフの表示をしなおさないと、データが残ってしまう
  if (userDistType<2) rvFunc.drawBarPlot(true, true);
  else                rvFunc.drawCurves(true);
  loopOn = true;
  loop();
});
// 入力コントロールを停止する
function stopControles(flag = false) {
  document.querySelector('#select_dist').disabled = true;
  document.querySelectorAll('.number').forEach((element) => {
    element.disabled = true;
  });
  opt_check.forEach((element) => {
    element.disabled = true;
  });
  document.querySelector('#trial_number').disabled = flag;
  if (flag) {
    document.querySelector('#btn_start').disabled = true;
    document.querySelector('#btn_onetime').disabled = true;
  }
}
// ページ再読み込み btn_reset
document.querySelector('#btn_reset').addEventListener('click', ()=>{
  window.location.reload();
});
// 実行を一周だけ行う btn_onetime
document.querySelector('#btn_onetime').addEventListener('click', ()=>{
  if (trialIndex < 0) {
    trialIndex = 0;
    stopControles(false);
    setInitial();
  }
  const d = drawRandomPlot();
  dispCurrentValue(d);
});

/**
 *  初期設定
 ======================================================= */
// シミュレーションの初期設定をする
function setInitial() {
  // パラメータの設定
  setParameters();
  // キャンバスを初期化
  background(canvas_background);
  // プロッターとグラフの設定、スケールの設定
  makeRandomVariables();
  // グラフの表示
  if (userDistType<2) rvFunc.drawBarPlot(true, true);
  else                rvFunc.drawCurves(true);
}
// パラメータの設定：HTML上の設定を反映する
function setParameters() {
  userDistType = document.querySelector('#select_dist').value * 1;
  userParameter[0].prob = document.querySelector('#dist_0_prob').value * 1;
  userParameter[0].n = 1;
  userParameter[1].prob = document.querySelector('#dist_1_prob').value * 1;
  userParameter[1].n = document.querySelector('#dist_1_n').value * 1;
  userParameter[2].mu = document.querySelector('#dist_2_mu').value * 1;
  userParameter[2].sigma = document.querySelector('#dist_2_sigma').value * 1;
  userParameter[3].min = document.querySelector('#dist_3_min').value * 1;
  userParameter[3].max = document.querySelector('#dist_3_max').value * 1;
}
// 確率変数プロッターオブジェクトの作成
function makeRandomVariables() {
  let distpara;
  let plotarea = [];
  const opt = userGraphOptimize;
  plotarea[0] = {name: 'D', x:plotDots.x, y:plotDots.y, w:plotDots.w, h:plotDots.h, axis:false, col:0, };
  plotarea[1] = {name: 'L', x:plotLines.x, y:plotLines.y, w:plotLines.w, h:plotLines.h, axis:true, col:colorList(0, true), };
  // 離散変数の場合
  if (userDistType<2) { 
    // 分布名
    const distname = (userDistType==0 ? 'ベルヌーイ分布' : '二項分布');
    // 分布パラメータの指定
    distpara = {d:'C', p1:userParameter[userDistType].prob, n:userParameter[userDistType].n, };
    // 棒グラフ描画エリア設定
    const plotbars = [{name: 'B', x:plotBars.x, y:plotBars.y, w:plotBars.w, h:plotBars.h, axis:true, col: color(0), }];
    // 離散の場合、ヒストグラムを描く必要がないのでライン部分を大きくする
    plotarea[1].h += 150;
    // プロッター
    rvPlot = new CatPlotter(distname, distpara, plotarea);
    // 棒グラフ
    rvFunc = new CatPlotter(distname, distpara, plotbars);
    // 棒グラフとプロット位置の指定
    const sx = {left:65, cat:userParameter[1].n+1, width:45, space:10, };
    rvPlot.scalex = sx;
    rvFunc.scalex = sx;
  // 連続変数の場合
  } else {              
    if (userDistType==2) {  // 正規分布：分布パラメータとスケール
      distpara = [{d:'N', p1:userParameter[2].mu, p2:userParameter[2].sigma, col: colorList(0, false), }];
      cvInterval = {
        min: (opt ? Math.floor(userParameter[2].mu - userParameter[2].sigma*4) : -7),
        max: (opt ? Math.ceil(userParameter[2].mu + userParameter[2].sigma*4) : 7),
      };
    } else {                // 一様分布：分布パラメータとスケール
      distpara = [{d:'U', p1:userParameter[3].min, p2:userParameter[3].max, col: colorList(0, false), }];
      cvInterval = {
        min: (opt ? Math.floor(userParameter[3].min - 1) : -7),
        max: (opt ? Math.ceil(userParameter[3].max + 1) : 7),
      };
    }
    // 分布名
    const distname = (userDistType==2 ? '正規分布' : '一様分布');
    // プロッター
    rvPlot = new RvPlotter(distname, distpara[0], plotarea);
    // 密度関数
    rvFunc = new drawDistFunc(distname, plotFunction, distpara);
    // スケールの設定
    rvPlot.scalex = cvInterval;
    rvFunc.scalex = cvInterval;
    // ちょっとやってみる
    if (!opt) rvFunc.maxd = (userDistType==2 ? 0.7 : 1);
  }
  // 存在確認
  //rvPlot.fillarea();
  //rvPlot.dispString('L', rvPlot.name, 0, 12, 'LEFT_CENTER');
  //rvFunc.fillarea();
}

/**
 *  初期化関数
 ======================================================= */
function setup() {
  frameRate(userFramerate);
  strokeCap(SQUARE);
  // ランダムシード
  randomSeed(minute() + second());
  // キャンバスサイズの決定
  canvas = createCanvas(canvas_width, canvas_height);
  canvas.parent(document.getElementById('p5'));
  background(canvas_background);
  
  noLoop();
}
// カラーコードを作る
function colorList(index, alpha=true) {
  const c = [
    [255,  79,   0],  // '#f30'
    [  0, 255,  79],  // '#0f3'
    [ 79,   0, 255],  // '#30f'
    [255, 159,   0],  // '#930'
    [  0, 255, 159],  // '#093'
    [159,   0, 255],  // '#309'
    [255, 255,  79],  // '#c33'
    [ 79, 255, 255],  // '#3c3'
    [255,  79, 255],  // '#33c'
    [ 79,  79,  79],  // '#333'
  ];
  if (index<0) {
    return  (alpha ? color(0,90) : color(0));
  } else {
    index = index % 10;
    if (alpha) {
      return color(c[index][0], c[index][1], c[index][2], 102);
    } else {
      return color(c[index][0], c[index][1], c[index][2]);
    }
  }
}
/**
 *  描画関数
 ======================================================= */
//const plotFunction = {x:   0, y:   0, w: 700, h: 250, };
function draw() {
  if (loopOn) {
    drawRandomPlot();
    if (trialIndex % 10==0) {
      push();
      fill(255);
      noStroke();
      rect(700, 200, 200, 50);
      fill(0);
      textAlign(CENTER, BASELINE);
      textSize(15);
      text(`${trialIndex}回終了`, 780, 240);
      pop();
    }
    if (trialIndex >= userMaxTrials) {
      if (userDistType>1) dispHistgram();
      prepairDownload();
      loopEnd = true;
      loopOn = false;
      noLoop();
    }
  }
}
// 乱数をプロットする
function drawRandomPlot() {
  const d = rvPlot.generateNewData();
  rvPlot.plotDatas((trialIndex==userMaxTrials-1),(trialIndex==userMaxTrials-1));
  trialIndex++;
  return d;
}
// 現在の乱数値を表示する
function dispCurrentValue(data) {
  push();
  // グラフの表示しなおし
  if (userDistType<2) {
    rvFunc.drawBarPlot(true, true);
  } else {
    rvFunc.drawCurves(true);
  }
  
  fill('white');
  noStroke();
  rect(plotValues.x-9, 0, plotValues.w, plotValues.y+plotValues.h*3);
  textSize(15);
  const name = 'X';
  let scalex;
  fill(0);
//  textAlign(CENTER, CENTER);
//  text(name, plotValues.x+20, plotValues.y + 20);
  textAlign(RIGHT, CENTER);
  if (userDistType<2) {
    scalex = rvFunc.scalexc;
    text(data, plotValues.x+100, plotValues.y + 20);
  } else {
    scalex = rvFunc.scalex;
    text(data.toFixed(2), plotValues.x+100, plotValues.y + 20);
  }
  fill(colorList(0, false));
  circle(plotValues.x+48, plotValues.y + 20, 12);
  if (userDistType<2) {
    circle(scalex[data], plotBars.y + plotBars.h - 40, 12);
//    fill(0);
//    textAlign(CENTER, BASELINE);
//    text(name, scalex[data], plotBars.y + plotBars.h - 20);
  } else {
    circle(scalex.cx + data*scalex.sx, plotFunction.y + plotFunction.h-40, 12);
//    fill(0);
//    textAlign(CENTER, BASELINE);
//    text(name, scalex.cx + data*scalex.sx, plotFunction.y + plotFunction.h - 20);
  }
  pop();
}
/**
 *  結果表示
 ======================================================= */
// ヒストグラムを表示する
function dispHistgram() {
  rvHist = new Histgram(plotHistgram.x, plotHistgram.y, plotHistgram.w, plotHistgram.h, true);
  const rvBreaks = rvFunc.xline.filter((value, index) => {
    return (index % 2==0);
  });
  rvHist.setData(rvPlot.data_x, rvBreaks);
  rvHist.fillColor = colorList(0, true);
  rvHist.borderColor = colorList(0, true);
  rvHist.borderWidth = 0.2;
  rvHist.drawHist('hist', true);
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
      const d = rvPlot.data_x;
      data.push('X');
      for (let i=0; i<userMaxTrials; i++) {
        data.push(`${d[i]}`);
      }
      break;
    // ---------------------- 統計データの作成
    case 'stats_data':
      break;
    // ---------------------- スクリプトの作成
    case 'script':
      data.push('## 確率変数の和と平均');
      data.push('# データ読み込み');
      data.push('df <- read.csv("raw_data.csv")');
      data.push('head(df)');
      if (userDistType>1) {
        data.push('# ヒストグラムを描く');
        data.push('hist(df$X)');
        data.push('# 箱ひげ図を描く');
        data.push('boxplot(df$X)');
      } else {
        data.push('# ヒストグラムを描く');
        data.push('hist(df$X, breaks=0:'+(userParameter[userDistType].n+1)+', right = F)');
        data.push('# 度数分布表をつくる')
        data.push('table(df$X)');
      }
      data.push('# 平均と標準偏差');
      data.push('mean(df$X)');
      data.push('sd(df$X)');
      break;
    default:
      return null;
  }
  data.push('');
  return data.join('\n');
}

