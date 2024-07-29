/** 
 *  確率変数のアフィン変換
 *  af_of_rv.js
 */


// 確率変数プロッターオブジェクト
let rvPlot = [];  // 0 :X, 1: Y（アフィン変換後）
let userParameter = {mu: 0, sigma: 0, a: 0, b: 0, mu_y: 0, sigma_y: 0, };
let minInterval  = {min: 0, max: 0, };
let cvInterval = {min:0, max:0, };
let userMaxTrials = 0;
let rvFunc;       // 密度関数
let rvHist;       // ヒストグラム

// キャンバス
let canvas;
const canvas_width = 900;
const canvas_height = 620;
const canvas_background = 255;
const userFramerate = 30;
// プロット座標
const plotFunction = {x:   0, y:   0, w: 800, h: 250, };
const plotLines    = {x:   0, y: 250, w: 800, h:  40, };  // 2つ分必要
const plotValues   = {x:   0, y: 330, w: 800, h:  30, };
const plotHistgram = {x:   0, y: 360, w: 800, h: 250, };

// ループ制御変数
let loopOn = false;
let trialIndex = -1;

/**
 *  表示範囲の選択
 ------------------------------------------------------- */
const inputMin = document.querySelector('#inter_min');
const inputMax = document.querySelector('#inter_max');
// 横軸表示範囲を最初から表示するために必要なイベント
window.addEventListener('load', readParameter);
// 横軸表示範囲を移動させる：最小範囲より小さくさせない
inputMin.addEventListener('change', checkInterval);
inputMax.addEventListener('change', checkInterval);
// パラメータを修正する：グローバル変数にとりこんで範囲チェックをする
document.querySelector('#norm_mu').addEventListener('change', ()=>{
  readParameter();
  checkInterval();
});
document.querySelector('#norm_sigma').addEventListener('change', ()=>{
  readParameter();
  checkInterval();
});
document.querySelector('#affin_a').addEventListener('change', ()=>{
  readParameter();
  checkInterval();
});
document.querySelector('#affin_b').addEventListener('change', ()=>{
  readParameter();
  checkInterval();
});
// 表示範囲をチェックして修正する
function checkInterval() {
  const tmp = {min: inputMin.value * 1, max: inputMax.value * 1, };
  if (tmp.min > minInterval.min) {
    inputMin.value = minInterval.min;
    inputMin.style.backgroundColor = '#ff0';
  } else {
    inputMin.style.backgroundColor = '#fff';
  }
  if (tmp.max < minInterval.max) {
    inputMax.value = minInterval.max;
    inputMax.style.backgroundColor = '#ff0';
  } else {
    inputMax.style.backgroundColor = '#fff';
  }
}
// パラメータの読み込み
function readParameter() {
  userParameter.mu = document.querySelector('#norm_mu').value * 1;
  userParameter.sigma = document.querySelector('#norm_sigma').value * 1;
  userParameter.a = document.querySelector('#affin_a').value * 1;
  userParameter.b = document.querySelector('#affin_b').value * 1;
  userParameter.mu_y = userParameter.mu * userParameter.a + userParameter.b;
  userParameter.sigma_y = userParameter.sigma * Math.abs(userParameter.a);
  const tmp = {min: inputMin.value * 1, max: inputMax.value * 1, };
  // 範囲をXまたはYの平均値±標準偏差より狭くしない
  minInterval.min = Math.floor(min(userParameter.mu - userParameter.sigma*2, userParameter.mu_y - userParameter.sigma_y*2)) - 1;
  minInterval.max = Math.ceil(max(userParameter.mu + userParameter.sigma*2, userParameter.mu_y + userParameter.sigma_y*2)) + 1;
  document.querySelector('#inter_min_ref').textContent = `(${minInterval.min}以下)`;
  document.querySelector('#inter_max_ref').textContent = `(${minInterval.max}以上)`;
  document.querySelector('#inter_min_ref').style.fontSize = '0.8rem';
  document.querySelector('#inter_max_ref').style.fontSize = '0.8rem';
}

/**
 *  イベント設定
 ======================================================= */
// 数値を変更したらグラフを更新する
document.querySelector('#norm_mu').addEventListener('change', setInitial);
document.querySelector('#norm_sigma').addEventListener('change', setInitial);
document.querySelector('#affin_a').addEventListener('change', setInitial);
document.querySelector('#affin_b').addEventListener('change', setInitial);
document.querySelector('#inter_min').addEventListener('change', setInitial);
document.querySelector('#inter_max').addEventListener('change', setInitial);
// 実行ボタン btn_start
document.querySelector('#btn_start').addEventListener('click', () => {
  userMaxTrials = document.querySelector('#trial_number').value * 1;
  stopControles(true);
  if (trialIndex < 0) {
    trialIndex = 0;
    setInitial();
  }
  loopOn = true;
  loop();
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
// 入力コントロールを停止する
function stopControles(flag = false) {
  document.querySelectorAll('.number').forEach((element) => {
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

/**
 *  初期設定
 ======================================================= */
// シミュレーションの初期設定をする
function setInitial() {
  // パラメータの設定
  readParameter();
  cvInterval = {
    min: inputMin.value * 1,
    max: inputMax.value * 1,
  };
  // プロッターの設定
  makeRandomVariables();
  // グラフの設定
  makeDistFunction();
  // スケールの設定
  rvPlot[0].scalex = cvInterval;
  rvPlot[1].scalex = cvInterval;
  rvFunc.scalex = cvInterval;
  // グラフの表示
  rvFunc.drawCurves(true);
  rvFunc.dispLegend();
}
// 確率変数プロッターオブジェクトの作成
function makeRandomVariables() {
  const rvnames = ['X', 'Y'];
  let distpara = [];
  distpara[0] = {d:'N', p1:userParameter.mu, p2:userParameter.sigma, };
  distpara[1] = {d:'N', p1:userParameter.mu_y, p2:userParameter.sigma_y, };

  for (let i=0; i<2; i++) {
    rvPlot[i] = new RvPlotter(
      rvnames[i], distpara[i], 
      [{ name:'L', 
        x: plotLines.x, y: plotLines.y+plotLines.h*i, w: plotLines.w, h: plotLines.h, 
        axis: false, 
        col: colorList(i, true),
      }]
    );
  }
  // 存在確認
  rvPlot.forEach((rp, index) => {
    //rp.fillarea();
    rp.dispString('L', rp.name, 0, 12, 'LEFT_CENTER');
  });
}
// 確率密度関数オブジェクトの作成
function makeDistFunction() {
  let dlist = [];
  dlist[0] = {
      d   : 'N', 
      p1  : userParameter.mu, 
      p2  : userParameter.sigma, 
      col : colorList(0, false),
    };
  dlist[1] = {
      d   : 'N', 
      p1  : userParameter.mu_y, 
      p2  : userParameter.sigma_y, 
      col : colorList(1, false),
    };
  rvFunc = new drawDistFunc(
    '正規分布',
    plotFunction,
    dlist
  );
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
  // とりあえず初期設定でグラフを描く
  setInitial();
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
function draw() {
  if (loopOn) {
    drawRandomPlot();
    if (trialIndex % 10==0) {
      push();
      fill(255);
      noStroke();
      rect(plotValues.x, plotValues.y, plotValues.w, plotValues.h);
      fill(0);
      textAlign(LEFT, CENTER);
      textSize(15);
      text(`${trialIndex}回終了`, plotValues.x+plotValues.w * 0.75, plotValues.y+plotValues.h/2);
      pop();
    }
    if (trialIndex >= userMaxTrials) {
      dispHistgram();
      prepairDownload();
      loopEnd = true;
      loopOn = false;
      noLoop();
    }
  }
}
// 乱数をプロットする
function drawRandomPlot() {
  let xsum = 0;
  let data = [];
  data[0] = rvPlot[0].generateNewData();
  rvPlot[0].plotDatas();
  data[1] = data[0] * userParameter.a + userParameter.b;
  rvPlot[1].appendData(data[1]);
  rvPlot[1].plotDatas();
  trialIndex++;
  return data;
}
// 現在の乱数値を表示する
function dispCurrentValue(data) {
  push();
  // グラフの表示しなおし
  rvFunc.drawCurves(true);
  rvFunc.dispLegend();

  const scalex = rvFunc.scalex;
  for (let i=0; i<2; i++) {
    // グラフに重ねて点を描画
    noStroke();
    fill(colorList(i, false));
    circle(scalex.cx + data[i]*scalex.sx, plotFunction.y + plotFunction.h-40, 12);
    fill(0);
    textSize(12);
    textAlign(CENTER, BASELINE);
    text(`${data[i].toFixed(3)}`, scalex.cx + data[i]*scalex.sx, plotFunction.y + plotFunction.h - (i ? 50 : 20));
  }
  // 値表示エリアに値と計算式を表示
  fill(255);
  noStroke();
  rect(plotValues.x, plotValues.y, plotValues.w*0.7, plotValues.h);
  fill(0);
  textSize(15);
  textAlign(LEFT, CENTER);
  const txtstr = `x=${data[0].toFixed(3)}, y=${userParameter.a}x+${userParameter.b}=${data[1].toFixed(3)}`;
  text(txtstr, plotValues.x+100, plotValues.y+plotValues.h/2);
  pop();
}
/**
 *  結果表示
 ======================================================= */
// ヒストグラムを表示する
function dispHistgram() {
  rvHist = new Histgram(plotHistgram.x, plotHistgram.y, plotHistgram.w, plotHistgram.h, true);
  // 最大度数をいくつにすればよいか
  let freqMax = 0;
  const rvBreaks = rvFunc.xline.filter((value, index) => {
    return (index % 2==0);
  });
  for (let i=0; i<2; i++) {
    rvHist.setData(rvPlot[i].data_x, rvBreaks);
    freqMax = max(freqMax, rvHist.freqmax);
  }
  // ヒストグラムを順に重ね書きする
  for (let i=0; i<2; i++) {
    rvHist.setData(rvPlot[i].data_x, rvBreaks, freqMax);
    rvHist.fillColor = colorList(i, true);
    rvHist.borderColor = colorList(i, true);
    rvHist.borderWidth = 0.2;
    rvHist.drawHist('hist', (i==0));
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
      let d = [];
      let dhead = 'ID, X, Y';
      for (let k=0; k<2; k++) {
        d[k] = [];
        d[k] = rvPlot[k].data_x;
      }
      data.push(dhead);
      for (let i=0; i<userMaxTrials; i++) {
        let dstr = '' + (i+1);
        for (let k=0; k<2; k++) {
          dstr = dstr + ', ' + d[k][i];
        }
        data.push(dstr);
      }
      break;
    // ---------------------- 統計データの作成
    case 'stats_data':
      break;
    // ---------------------- スクリプトの作成
    case 'script':
      data.push('## 確率変数のアフィン変換');
      data.push('# データ読み込み');
      data.push('df <- read.csv("raw_data.csv")');
      data.push('head(df)');
      data.push('# ヒストグラムを描く');
      data.push('hist(df$X)');
      data.push('hist(df$Y)');
      data.push('# 箱ひげ図を描く');
      data.push('boxplot(df[,-1])');
      data.push('# 平均と分散を比較する');
      data.push('apply(df[,-1],MARGIN = 2, mean)');
      data.push('apply(df[,-1],MARGIN = 2, var)');
      data.push('# 散布図は当然、一直線を描く');
      data.push('plot(df$X, df$Y)');
      break;
    default:
      return null;
  }
  data.push('');
  return data.join('\n');
}

