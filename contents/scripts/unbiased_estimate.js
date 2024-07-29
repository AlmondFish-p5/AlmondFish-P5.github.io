//
// 不偏推定量 シミュレーション
// unbiased_estimate.js
//

// 確率変数オブジェクト
let rvPlotter = [];
let rvHist = [];
let userParameter = {mu:0, sigma:1, df:4, min:-3, max:3};
let userDistSet = {d:'', p1:0, p2:0, };
let userSampleSize;
let userMaxTrial = 0;
let userDistribution = -1;
let popParameter = {e:0, v:0, s:0,};

// オブジェクトの設定
let plotDef = [];
let histDef = [];
let statDef = [];

// 蓄積データ
let dataRaw = [];
let dataStat = [[], [], [], [], []];

// キャンバス
let canvas;
const canvas_width = 910;
const canvas_height = 740;
const canvas_background = 255;
const userFramerate = 32;

// ループ制御変数
let loopOn = false;
let index;
let trials;


/**===========================================
 * HTML との連携関数
 */
// 確率分布ごとの期待値と分散の表示
document.querySelector('#select_dist').addEventListener('change', ()=>{
  userDistribution = document.querySelector('#select_dist').value * 1;
  //console.log(userDistribution);
  switch (userDistribution) {
    case 0: // 正規分布
      userDistSet = {d:'N', p1:userParameter.mu, p2:userParameter.sigma, };
      popParameter.e = userParameter.mu;
      popParameter.v = (userParameter.sigma) ** 2;
      popParameter.s = Math.sqrt(popParameter.v);
      break;
    case 1: // t分布
      userDistSet = {d:'T', p1:userParameter.mu, p2:userParameter.df, };
      popParameter.e = userParameter.mu;
      popParameter.v = userParameter.df / (userParameter.df-2);
      popParameter.s = Math.sqrt(popParameter.v);
      break;
    case 2: // 一様分布
      userDistSet = {d:'U', p1:userParameter.min, p2:userParameter.max, };
      popParameter.e = (userParameter.max + userParameter.min) / 2;
      popParameter.v = (userParameter.max - userParameter.min) ** 2 / 12;
      popParameter.s = Math.sqrt(popParameter.v);
      break;
  }
  document.querySelector('#aboutdist').textContent = `期待値:${popParameter.e.toFixed(2)}、分散:${popParameter.v.toFixed(2)}、標準偏差：${popParameter.s.toFixed(2)}`;
  readHtmlSettings();
})
// 設定読み込み
function readHtmlSettings() {
  userSampleSize = document.querySelector('#sample_size').value * 1;
  userMaxTrial = document.querySelector('#trial_number').value * 1;
  document.querySelector('#sample_size').disabled = (userDistribution < 0);
  document.querySelector('#trial_number').disabled = (userDistribution < 0);
  document.querySelector('#btn_start').disabled = (userDistribution < 0);
}
// 実行ボタン
document.querySelector('#btn_start').addEventListener('click', function() {
  reSetup();
//  btnStart.disabled = true;
//  btnStop.toggleAttribute('hidden');
//  index = 0;
//  iter = 0;
//  drawBackground(true);
  showReading();
  trials = 0;
  loopOn = true;
  loop();
});
// リセットボタン
document.querySelector('#btn_reset').addEventListener('click', function() {
  window.location.reload();
});


/**
 *  初期化関数群
 * ======================================================== */
// 再セットアップ：実行ボタンで呼び出される
function reSetup() {
  // 設定をもういちど読み込む
  readHtmlSettings();
  // コントロールを非アクティブ化する
  document.querySelector('#select_dist').disabled = true;
  document.querySelector('#sample_size').disabled = true;
  document.querySelector('#trial_number').disabled = true;
  document.querySelector('#btn_start').disabled = true;
  // 確率変数の準備
  generateRandomVar();
}
// 確率変数オブジェクトの準備
function generateRandomVar() {
  initRvSetting();
  for (let i=0; i<plotDef.length; i++) {
    rvPlotter[i] = new RvPlotter(plotDef[i].name, plotDef[i].dist, plotDef[i].areaset);
    rvPlotter[i].scalex = plotDef[i].scale;
  }
  strokeWeight(1);
  stroke('blue');
  fill(196);
  for (let i=0; i<histDef.length; i++) {
    const d = histDef[i]
    rvHist[i] = new Histgram(d.x, d.y, d.w, d.h, axis=true);
  }
}
// プロッターとヒストグラムの表示設定を一括で行う
function initRvSetting() {
  const minList = [[-3, -1], [-4, -1], [-4, -1]];
  const maxList = [[ 3,  5], [ 4, 10], [ 4, 10]];
  plotDef = [
    { name : 'Mean', dist : {d:'N', p1:0, p2:0, }, 
      areaset: [{ name:'D', x:  5, y:  5, w:440, h: 15, axis:false, col:0, },
                { name:'L', x:  5, y: 20, w:440, h: 45, axis:true, col:colorList(0), },],
      scale : { min: minList[userDistribution][0] , 
                max: maxList[userDistribution][0], } },
    { name : 'Var(n)', dist : {d:'N', p1:0, p2:0, }, 
      areaset: [{ name:'D', x:  5, y:330, w:440, h: 15, axis:false, col:0, },
                { name:'L', x:  5, y:345, w:440, h: 35, axis:false, col:colorList(1), },],
      scale : { min: minList[userDistribution][1] , 
                max: maxList[userDistribution][1], } },
    { name : 'Var(n-1)', dist : {d:'N', p1:0, p2:0, }, 
      areaset: [{ name:'D', x:  5, y:380, w:440, h: 15, axis:false, col:0, },
                { name:'L', x:  5, y:395, w:440, h: 45, axis:true, col:colorList(2), },],
      scale : { min: minList[userDistribution][1] , 
                max: maxList[userDistribution][1], } },
    { name : 'Sd(n)', dist : {d:'N', p1:0, p2:0, }, 
      areaset: [{ name:'D', x:455, y:330, w:440, h: 15, axis:false, col:0, },
                { name:'L', x:455, y:345, w:440, h: 35, axis:false, col:colorList(3), },],
      scale : { min: minList[userDistribution][1] , 
                max: maxList[userDistribution][1], } },
    { name : 'Sd(n-1)', dist : {d:'N', p1:0, p2:0, }, 
      areaset: [{ name:'D', x:455, y:380, w:440, h: 15, axis:false, col:0, },
                { name:'L', x:455, y:395, w:440, h: 45, axis:true, col:colorList(4), },],
      scale : { min: minList[userDistribution][1] , 
                max: maxList[userDistribution][1], } },
  ];
  histDef = [
    { name : 'Mean', x:  5, y: 70, w:440, h:250, axis:true, },
    { name : 'Vars', x:  5, y:445, w:440, h:250, axis:true, },
    { name : 'Sds' , x:455, y:445, w:440, h:250, axis:true, },
  ];
  statDef = [
    { name: 't',  x:455, y: 10, w:440, h: 45, },
    { name: 'm',  x:455, y: 55, w:440, h: 45, },
    { name: 'v0', x:455, y:100, w:440, h: 45, },
    { name: 'v1', x:455, y:145, w:440, h: 45, },
    { name: 's0', x:455, y:190, w:440, h: 45, },
    { name: 's1', x:455, y:235, w:440, h: 45, },
  ];
}

// 初期化関数：本体
function setup() {
  frameRate(userFramerate);
  strokeCap(SQUARE);
  // キャンバスの作成
  canvas = createCanvas(canvas_width, canvas_height);
  canvas.parent(document.getElementById('p5'));
  background(canvas_background);
  readHtmlSettings();
  // ループ制御
  //loopOn = false;
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
 *  シミュレーション関数群
 * ======================================================== */
// 指定した分布、サンプルサイズの乱数を返す
function generateRandomData(dist, size) {
  let x = new Array(size).fill(0);
  switch (dist) {
    case 0: 
      x = x.map((value) => {
        return jStat.normal.sample(userParameter.mu, userParameter.sigma);
      });
      break;
    case 1:
      x = x.map((value) => {
        return jStat.studentt.sample(userParameter.df);
      });
      break;
    case 2:
      x = x.map((value) => {
        return jStat.uniform.sample(userParameter.min, userParameter.max);
      });
      break;
    default:
      x = x.map((value) => { return -1; });
      break;
  }
  return x;
}
// 平均値の計算
function calcMean(x) {
  let s = 0;
  x.forEach((value) => {
    s += value;
  });
  return (s / x.length);
}
// 分散、標準偏差の計算
function calcStats(x) {
  const mean = calcMean(x);
  let ss = 0;
  x.forEach((value) => {
    ss += (value - mean) ** 2;
  });
  const s2 = ss / x.length;
  const u2 = ss / (x.length - 1);
  return [mean, s2, u2, Math.sqrt(s2), Math.sqrt(u2)];
}


/**
 *  描画関数群
 * ======================================================== */
// 描画関数本体
function draw() {
  if (loopOn) {
    const x = generateRandomData(userDistribution, userSampleSize);
    const stat = calcStats(x);
    dataRaw.push(x);
    for (let i=0; i<5; i++) dataStat[i].push(stat[i]);
    for (let i=0; i<stat.length; i++) {
      rvPlotter[i].appendData(stat[i]);
      rvPlotter[i].plotDatas();
    }
    index++;
    trials++;
    if (trials % 10==0) { trialCounts(); }
    if (trials >= userMaxTrial) {
      noLoop();
      drawHistgrams();  // ヒストグラムの表示
      drawEstMean();    // 統計量の表示
      prepairDownload();    // ローデータ提供の準備
    }
  }
}
// 統計量平均の表示
function drawEstMean() {
  // 統計量平均の算出
  let estMean = [];
  for (let i=0; i<5; i++) {
    estMean[i] = calcMean(dataStat[i])
  }
  // 統計量平均の表示
  noStroke();
  fill(0);
  textSize(15);
  textAlign(RIGHT, TOP);
  let d = histDef[0];
  text('標本平均の平均値', d.x+d.w-20, d.y+10);
  text(`${estMean[0].toFixed(3)}`, d.x+d.w-20, d.y+10+20);
  fill('red');
  text(`母平均は ${popParameter.e.toFixed(3)}`, d.x+d.w-20, d.y+10+40);
  d = histDef[1];
  fill(0);
  text('分散の平均値', d.x+d.w-20, d.y+10);
  text(`nで割った分散：${estMean[1].toFixed(3)}`, d.x+d.w-20, d.y+10+20);
  text(`n-1で割った分散：${estMean[2].toFixed(3)}`, d.x+d.w-20, d.y+10+40);
  fill('red');
  text(`母分散は ${popParameter.v.toFixed(3)}`, d.x+d.w-20, d.y+10+60);
  fill(0);
  d = histDef[2];
  text('標準偏差の平均値', d.x+d.w-20, d.y+10);
  text(`nで割った分散の平方根：${estMean[3].toFixed(3)}`, d.x+d.w-20, d.y+10+20);
  text(`n-1で割った分散の平方根：${estMean[4].toFixed(3)}`, d.x+d.w-20, d.y+10+40);
  fill('red');
  text(`母標準偏差は ${popParameter.s.toFixed(3)}`, d.x+d.w-20, d.y+10+60);
}
// ヒストグラムの表示
function drawHistgrams() {
  for (let i=0; i<3; i++) {
    const d = plotDef[i].scale;
    const br = new Array((d.max-d.min)*5+1).fill(0).map((val, index) => {
      return round(d.min + index * 0.2, 1);
    });
    if (i==0) {
      rvHist[i].fillColor = colorList(0);
      rvHist[i].borderColor = colorList(0, false);
      rvHist[i].setData(dataStat[0], br);
      rvHist[i].drawHist('hist', true);
    } else {
      let fm = [];
      rvHist[i].setData(dataStat[(2*i)], br);
      fm[0] = rvHist[i].freqmax;
      rvHist[i].setData(dataStat[(2*i-1)], br);
      fm[1] = rvHist[i].freqmax;

      rvHist[i].fillColor = colorList(i*2-1);
      rvHist[i].borderColor = colorList(i*2-1, false);
      rvHist[i].setData(dataStat[(2*i-1)], br, max(fm));
      rvHist[i].drawHist('hist', true);

      rvHist[i].fillColor = colorList(i*2);
      rvHist[i].borderColor = colorList(i*2, false);
      rvHist[i].setData(dataStat[(2*i)], br, max(fm));
      rvHist[i].drawHist('hist', false);
    }
  }
}
// 繰り返し回数の表示
const trialCounts = () => {
  push();
  noStroke();
  fill(canvas_background);
  const d = statDef[0];
  rect(d.x, d.y, d.w, d.h);
  fill(0);
  textSize(15);
  textAlign(CENTER, CENTER);
  text(`繰り返し ${trials}回 終了`, d.x+d.w/2, d.y+d.h/2);
  pop();
}
// 説明を表示する
const showReading = ()=> {
  noStroke();
  fill(canvas_background);
  const d = statDef[1];
  rect(d.x, d.y, d.w, d.h*5+1);
  fill(0);
  textSize(15);
  textAlign(LEFT, BASELINE);
  let ty = d.y + 20;
  let tx = d.x + 20
  text('赤：標本の平均', tx, ty); ty+=45;
  text('緑／青：分散', tx, ty); ty+=20;
  text('上段は 偏差平方和(ss)÷n （通称「標本分散」）', tx+20, ty); ty+=20;
  text('下段は 偏差平方和(ss)÷(n-1) （通称「不偏分散」）', tx+20, ty); ty+=45;
  text('黄／緑：標準偏差', tx, ty); ty+=20;
  text('上段は 通称「標本分散」の正の平方根', tx+20, ty); ty+=20;
  text('下段は 通称「不偏分散」の正の平方根', tx+20, ty); ty+=20;
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
  // document.querySelector('#stats_data').disabled = true; // 統計データがない
}
// ダウンロードファイルをつくる
function makeDownloadData(id) {
  let data = [];
  switch (id) {
    // ---------------------- ローデータの作成
    case 'raw_data':
      let datRawhead = new Array(userSampleSize).fill('').map((value, index) => {
        return `X${index+1}`;
      });
      data.push(datRawhead);
      for (let i=0; i<userMaxTrial; i++) {
        data.push(dataRaw[i].join(','));
      }
      break;
    // ---------------------- 統計データの作成
    case 'stats_data':
      data.push('mean, var_p, var_s, sd_p, sd_s');
      for (let i=0; i<userMaxTrial; i++) {
        let tmp = [];
        for (j=0; j<5; j++) {
          tmp.push(dataStat[j][i]);
        }
        data.push(tmp.join(','));
      }
      break;
    // ---------------------- スクリプトの作成
    case 'script':
      data.push('## 不偏推定量');
      data.push('# データ読み込み');
      data.push('df <- read.csv("raw_data.csv")');
      data.push('head(df)');
      data.push('## nで割った分散を計算する関数');
      data.push('var_p <- function(x) {var(x)*(length(x)-1)/length(x)}');
      data.push('## nで割った分散の平方根を計算する関数');
      data.push('sd_p <- function(x) {sqrt(var_p(x))}');
      data.push('# 箱ひげ図を描く');
      data.push('boxplot(df)');
      data.push('# 平均と分散を比較する');
      data.push('apply(df, 2, mean)');
      data.push('apply(df, 2, var_p)');
      data.push('## 各回の統計量を算出して平均する');
      data.push('# 平均値の平均：母平均=' + popParameter.e.toFixed(3));
      data.push('mean(apply(df, 1, mean))');
      data.push('# 分散の平均：母分散=' + popParameter.v.toFixed(3));
      data.push('# nで割った値の平均：');
      data.push('mean(apply(df, 1, var_p))');
      data.push('# n-1で割った値の平均');
      data.push('mean(apply(df, 1, var))');
      data.push('# 標準偏差：母標準偏差=' + popParameter.s.toFixed(3));
      data.push('# （nで割った分散の平方根）の平均');
      data.push('mean(apply(df, 1, sd_p))');
      data.push('# （n-1で割った分散の平方根）の平均');
      data.push('mean(apply(df, 1, sd))');
      break;
    default:
      return null;
  }
  data.push('');
  return data.join('\n');
}

