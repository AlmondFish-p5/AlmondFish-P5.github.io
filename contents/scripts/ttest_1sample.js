/**
 *  第一種の過誤確率シミュレーション：1標本t検定 ttest_1sample.js
 *  母集団パラメータを固定して帰無仮説とし、そこから任意の標本サイズでサンプリングする。
 *  「標本平均＝母平均」という帰無仮説を検定し、p値がどのような分布をするかをみる。
 *  正しく検定が行われているとすれば、p値は一様分布し、確率αで帰無仮説を棄却するはずである。
 ================================================== */

let rvPlot = [];  // 確率変数プロッター
let rvHist = [];
let userParameter = {
  mu : 0,
  sigma : 1,
  n : 10,
  alpha : 0.05,
};

// オブジェクトの設定用変数
let plotDef = [];
let histDef = [];
let statDef = [];

// それらを用いて設定する広域定数
let canvas;
const canvas_width = 900;
const canvas_height = 720;
const canvas_background = 'white';

// 動作調整ボタン
const btnStart = document.querySelector('#btn_start');
const btnReset = document.querySelector('#btn_reset');

// 閲覧モード　0:シミュレーション、1:データ閲覧
let viewMode = 0;
let loopOn = false;
let trials = 0;
let userMaxTrial = 0;

let userSampleData = [];
let userStatsData = [];

// 実行ボタン：シミュレーション開始
btnStart.addEventListener('click', () => {
  document.querySelectorAll('.number').forEach((element) => {
    element.disabled = true;
  });
  readHemlSetting();
  initRvSetting();
  setupPlotter();
  showReading();
  loopOn = true;
  loop();
});

// リセットボタン
btnReset.addEventListener('click', ()=> {
  window.location.reload();
});

// HTML上の設定を読み込む
function readHemlSetting() {
  userParameter.mu = document.querySelector('#pop_mu').value * 1;
  userParameter.sigma = document.querySelector('#pop_sigma').value * 1;
  userParameter.n = document.querySelector('#sample_size').value * 1;
  userMaxTrial = document.querySelector('#trial_number').value * 1;
}

// 確率変数プロッターを準備する
function setupPlotter() {
  initRvSetting();
  for (let i=0; i<plotDef.length; i++) {
    rvPlot[i] = new RvPlotter(plotDef[i].name, plotDef[i].dist, plotDef[i].areaset);
    rvPlot[i].scalex = plotDef[i].scale;
    //rvPlot[i].fillarea();
  }
  for (let i=0; i<histDef.length; i++) {
    const d = histDef[i]
    rvHist[i] = new Histgram(d.x, d.y, d.w, d.h, axis=true);
  }
  ////////////////////////////////////////////////////////////////
  // p値は内部で10倍した値として記録されるため、軸だけは別設定している
  const p_str = ['','0','.1','.2','.3','.4','.5','.6','.7','.8','.9','1',''];
  rvPlot[2].axisStr = p_str
  rvHist[2].axisStr = p_str;
  ////////////////////////////////////////////////////////////////
}

// プロッターとヒストグラムの表示設定を一括で行う
function initRvSetting() {
  const minList = [[-3, -1], [-4, -1], [-4, -1]];
  const maxList = [[ 3,  5], [ 4, 10], [ 4, 10]];
  plotDef = [
    // 標本平均
    { name : 'Mean', dist : {d:'N', p1:userParameter.mu, p2:userParameter.sigma, }, 
      areaset: [{ name:'D', x:  5, y:  5, w:440, h: 15, axis:false, col:0, },
                { name:'L', x:  5, y: 20, w:440, h: 45, axis:true, col:colorList(0), },],
      scale : { min: floor(userParameter.mu - userParameter.sigma * 4), 
                max: ceil(userParameter.mu + userParameter.sigma * 4), } },
    // t値
    { name : 't-value', dist : {d:'T', p1:userParameter.n-1, p2:0, }, 
      areaset: [{ name:'D', x:  5, y:330, w:440, h: 15, axis:false, col:0, },
                { name:'L', x:  5, y:345, w:440, h: 45, axis:true, col:colorList(1), },],
      scale : { min: -4, 
                max:  4, } },
    ////////////////////////////////////////////////////////////////
    // p値は内部では10倍した値で記録されることに注意!!!
    { name : 'p-value', dist : {d:'U', p1:0, p2:10, }, 
      areaset: [{ name:'D', x:455, y:330, w:440, h: 15, axis:false, col:0, },
                { name:'L', x:455, y:345, w:440, h: 45, axis:true, col:colorList(2), },],
      scale : { min: -1 , 
                max: 11, } },  // したがってこれは min = -0.1, max = 1.1
    ////////////////////////////////////////////////////////////////
  ];
  histDef = [ 
    { name : 'Mean',    x:  5, y: 70, w:440, h:260, axis:true, 
      col:{fill:0, border:0, }, br:[], data:[], },
    { name : 't-value', x:  5, y:445, w:440, h:260, axis:true, 
      col:{fill:0, border:0, }, br:[], data:[], },
    { name : 'p-value', x:455, y:445, w:440, h:260, axis:true, 
      col:{fill:0, border:0, }, br:[], data:[], },
  ];
  for (let i=0; i<histDef.length; i++) {
    const ar = new Array((plotDef[i].scale.max - plotDef[i].scale.min)*5+1).fill(0);
    histDef[i].br = ar.map((val, index) => {
      return round(plotDef[i].scale.min + index * 0.2, 1);
    });
    histDef[i].col.fill = colorList(i);
    histDef[i].col.border = colorList(i, false);
  }

  statDef = [
    { name: 't',  x:455, y: 10, w:440, h: 45, },
    { name: 'm',  x:455, y: 55, w:440, h: 45, },
    { name: 't',  x:455, y:100, w:440, h: 45, },
    { name: 'p',  x:455, y:160, w:440, h: 45, },
  ];
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
    return  (alpha ? color(0,30) : color(0));
  } else {
    index = index % 10;
    if (alpha) {
      return color(c[index][0], c[index][1], c[index][2], 30);
    } else {
      return color(c[index][0], c[index][1], c[index][2]);
    }
  }
}

/**
 *  初期化関数
 ====================================================== */
function setup() {
  canvas = createCanvas(canvas_width, canvas_height);
  canvas.parent(document.querySelector('#p5'));
  background(canvas_background);
  noLoop();
}

/**
 *  検定関数
 ====================================================== */
const meanOf = (x)=> {  // xの平均値
  let s = 0;
  x.forEach((v)=>{s += v});
  return s / x.length;
}
const ssOf = (x,m)=> {  // xのmean周りの偏差平方和
  let s = 0;
  x.forEach((v)=>{s += sq(v-m)});
  return s;
}
// -------------------- 1つのデータに対してZ検定を行う
function oneSampleZTest(x, mu, sigma) {
  const mean = meanOf(x);
  return {
      m:mean,
      z:(mean - mu) / (sigma / sqrt(x.length)), 
      p:(1 - jStat.normal.cdf(abs(zvalue), 0, 1)) * 2, 
    };
}
// -------------------- 1つのデータに対してt検定を行う
function oneSampleTTest(x, mu, sigma=0) {
  const mean = meanOf(x);
  const u2 = ssOf(x, mean) / (x.length-1);
  const tvalue = (mean - mu) / sqrt(u2 / x.length);
  return {
      m:mean,
      se:sqrt(u2 / x.length),
      t:tvalue,
      p:(1 - jStat.studentt.cdf(abs(tvalue), (x.length-1))) * 2,
      df:x.length-1,
    };
}


/**
 *  描画関数
 ====================================================== */
function draw() {
  if (loopOn) {
    let x = [];
    let s = 0;
    for (let i=0; i<userParameter.n; i++) {
      x[i] = randomGaussian(userParameter.mu, userParameter.sigma);
      s += x[i];
    }
    userSampleData.push(x);
    const result = oneSampleTTest(x, userParameter.mu);
    userStatsData.push(result);
  ////////////////////////////////////////////////////////////////
  // p値は内部で10倍された値で記録されていることに注意!!!
    const res = [result.m, result.t, result.p*10];
  ////////////////////////////////////////////////////////////////
    for (let i=0; i<3; i++) {
      rvPlot[i].appendData(res[i]);
      rvPlot[i].plotDatas();
      histDef[i].data.push(res[i]);
    } 
    trials++;
    if (trials % 10==0) { trialCounts(); }
    if (trials >= userMaxTrial) {
      loopOn = false;
      noLoop();
      drawHistgrams();  // ヒストグラムの表示
      drawStats();    // 統計量の表示
      prepairDownload();    // ローデータ提供の準備
    }
  }
}

// ヒストグラムの表示
function drawHistgrams() {
  for (let i=0; i<3; i++) {
    rvHist[i].fillColor = histDef[i].col.fill;
    rvHist[i].borderColor = histDef[i].col.border;
    rvHist[i].setData(histDef[i].data, histDef[i].br);
    rvHist[i].drawHist('hist', true);
  }
}

// 統計量の表示
function drawStats() {
  // 統計量平均の算出
  let estMean = [];
  for (let i=0; i<3; i++) {
    estMean[i] = meanOf(histDef[i].data);
  }
  ////////////////////////////////////////////////////////////////
  estMean[2] /= 10; // p値は内部で10倍された値で記録されていることに注意!!!
  let sig_count = [0, 0, 0];
  histDef[2].data.forEach((value) => {
    if (value <= 1) {
      sig_count[0]++;
      if (value <= 0.5) {
        sig_count[1]++;
        if (value <= 0.1) sig_count[2]++;
      }
    }
  });
  ////////////////////////////////////////////////////////////////
  // 統計量平均の表示
  noStroke();
  fill(0);
  textSize(15);
  textAlign(RIGHT, TOP);
  let d = histDef[0];
  text('標本平均の平均値', d.x+d.w-20, d.y+10);
  text(`${estMean[0].toFixed(3)}`, d.x+d.w-20, d.y+10+20);
  fill('red');
  text(`母平均は ${userParameter.mu}`, d.x+d.w-20, d.y+10+40);
  fill(0);
  textAlign(LEFT, TOP);
  d = statDef[3];
  text(`p値の平均値は ${estMean[2].toFixed(3)}`, d.x+20, d.y+25);
  text(`p < 0.1 は ${sig_count[0]}回（${(sig_count[0]/userMaxTrial*100).toFixed(2)}％）`, d.x+20, d.y+50);
  text(`p < 0.05 は ${sig_count[1]}回（${(sig_count[1]/userMaxTrial*100).toFixed(2)}％）`, d.x+20, d.y+75);
  text(`p < 0.01 は ${sig_count[2]}回（${(sig_count[2]/userMaxTrial*100).toFixed(2)}％）`, d.x+20, d.y+100);
}

// 繰り返し回数の表示
const trialCounts = () => {
  push();
  noStroke();
  fill(244);
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
  const cv = abs(jStat.studentt.inv(userParameter.alpha, userParameter.n-1));
  rect(d.x, d.y, d.w, d.h*5+1);
  fill(0);
  textSize(15);
  textAlign(LEFT, BASELINE);
  let ty = d.y + 20;
  let tx = d.x + 20
  text('上段（赤）：標本の平均', tx, ty); ty+=45;
  text('下段：一標本t検定の結果', tx, ty); ty +=25;
  text(`　緑：t値（両側${userParameter.alpha*50}％臨界値は ±${cv.toFixed(2)}）`, tx, ty); ty+=20;
  text('　紫：p値', tx, ty); ty+=20;
}

// ---------------------- ローデータの提供 データダウンロードの準備をする
function prepairDownload() {
  document.querySelector('#download').style.display = 'block';
  document.querySelectorAll('.data_download').forEach((element) => {
    element.addEventListener('click', ()=>{
      const csvData = makeDownloadData(element.id);
      const filename = element.id=='script' ? 'script.r' : `${element.id}.csv`;
      saveCsvFile(csvData, filename);
    });
  });
}

// ---------------------- ダウンロードファイルをつくる
function makeDownloadData(id) {
  let data = [];
  switch (id) {
    // ---------------------- ローデータの作成
    case 'raw_data':
      const dh = ['Trials', 'X',];
      data.push(dh);
      for (let i=0; i<userSampleData.length; i++) {
        for (let j=0; j<userSampleData[i].length; j++) {
          data.push(`${i+1}, ${userSampleData[i][j]}`);
        }
      }
      break;
    // ---------------------- 統計データの作成
    case 'stats_data':
      const sh = ['mean', 'stderr', 't-value', 'p-value',];
      data.push(sh);
      for (let i=0; i<userStatsData.length; i++) {
        const d = userStatsData[i];
        data.push(`${d.m}, ${d.se}, ${d.t}, ${d.o}`);
      }
      break;
    // ---------------------- スクリプトの作成
    case 'script':

      data.push('## 一標本t検定');
      data.push('# データ読み込み');
      data.push('df <- read.csv("raw_data.csv")');
      data.push('head(df)');
      data.push('# ヒストグラムを描く');
      data.push('hist(df$X)');
      data.push('# Trial ごとの平均値とt検定のp値を計算する');
      data.push('i_start <- min(df$Trials)');
      data.push('i_end <- max(df$Trials)');
      data.push('mu <- ' + userParameter.mu);
      data.push('pvalue <- rep(0, (i_end-i_start+1))');
      data.push('tvalue <- rep(0, (i_end-i_start+1))');
      data.push('for (i in i_start:i_end) {');
      data.push('  dfs <- subset(df, df$Trials==i)');
      data.push('  res <- t.test(dfs$X, mu=mu)');
      data.push('  tvalue[i] <- res$statistic');
      data.push('  pvalue[i] <- res$p.value');
      data.push('}');
      data.push('head(tvalue)');
      data.push('hist(tvalue)');
      data.push('head(pvalue)');
      data.push('hist(pvalue)');
      data.push('# 有意(p<0.05)になった割合を計算する');
      data.push('ifelse(pvalue < 0.05, 1, 0) |> mean()');
      break;
    default:
      return null;
  }
  data.push('');
  return data.join('\n');
}

