/**
 *  区間推定シミュレーション
 *  interval_estimation.js
 ==================================================== */

// ページ上で指定する変数
let userParameter = {mu:0, sigma:1, df:4, min:-3, max:3};
let userSampleSize;
let userMaxTrial;
let userConfLevel;

// 確率変数オブジェクト
let rvPlot;   // プロッター
let rvHist;   // ヒストグラム
let breaks = [];
let axisX = {
  min: 0, 
  max: 0,
  center_x: 0,
  center_y: 10,
  scale : 0,
};

let pageSize = 200;
let dat;
let hitNumber = 0;
let minDev = 1;

const gapy   = 2;

// キャンバス
let canvas;
const canvas_width  = 900;
const canvas_height = 825;
const canvas_background = 255;
const userFramerate = 30;
let plotArea = {
  sim: {x: 50, y:  30, w: 800, h: 400,}, // 400 = gapy * pageSize
  line:{x: 50, y: 455, w: 800, h:  50,},
  hist:{x: 50, y: 510, w: 800, h: 310,},
};

// ループ制御変数
let maxIndex = 1;
let loopOn = false;
let loopEnd = false;
let index;
let iter;

/**===========================================
 * HTML との連携関数
 */
// ---------------------------------- 実行
document.querySelector('#btn_start').addEventListener('click', function() {
  document.querySelector('#btn_start').disabled = true;
  document.querySelector('#btn_pause').disabled = false;
  readHtmlSettings();

  index = 0;
  iter = 0;
  hitNumber = 0;
  minDev = 1;
  resetCanvas();
  loopOn = true;
  loop();
});
// ---------------------------------- 一時停止
document.querySelector('#btn_pause').addEventListener('click', ()=>{
  loopOn = !loopOn;
  document.querySelector('#btn_pause').value = loopOn ? '一時停止': '再　開';
  if (!loopOn) {
    dispLastData();
  } 
});
// ---------------------------------- リセット
document.querySelector('#btn_reset').addEventListener('click', ()=>{
  window.location.reload();
});

/**
 * 初期化関数
 =========================================== */
// ---------------------------------- ページ上の設定値を読む
function readHtmlSettings() {
  userParameter.mu = document.querySelector('#user_mu').value * 1;
  userParameter.sigma = document.querySelector('#user_sigma').value * 1;
  userSampleSize = document.querySelector('#user_sample_size').value * 1;
  userMaxTrial = document.querySelector('#trial_number').value * 1;
  userConfLevel = document.querySelector('#user_conflevel').value * 1;
  // 限界値の計算
  criticalPoint = jStat.studentt.inv(0.5+userConfLevel/2, userSampleSize-1);
  // レンジの設定：さしあたり標準偏差×4をカバーする
  axisX.min = Math.floor(userParameter.mu - userParameter.sigma * 4);
  axisX.max = Math.ceil(userParameter.mu + userParameter.sigma * 4);
  axisX.scale = plotArea.sim.w / (axisX.max - axisX.min);
  axisX.center_x = plotArea.sim.x - axisX.scale * axisX.min;
  axisX.center_y = plotArea.sim.y;
  // ヒストグラム用階級設定
  breaks = new Array((axisX.max - axisX.min)*5+1).fill(0).map((val, idx) => {
    return round(idx * 0.2 + axisX.min, 1);
  });
}
// ---------------------------------- 確率変数オブジェクトの準備と蓄積用データ初期化
function generateRandomVar() {
  rvPlot = new RvPlotter(
    '正規分布', 
    { d:'N', p1:userParameter.mu, p2:userParameter.sigma}, 
    [{ name:'L', 
      x:plotArea.line.x, y:plotArea.line.y, 
      w:plotArea.line.w, h:plotArea.line.h, 
      axis:true, col:0,}]
  );
  rvPlot.scalex = {min: axisX.min, max: axisX.max, };
  rvHist = new Histgram(
    plotArea.hist.x, plotArea.hist.y, plotArea.hist.w, plotArea.hist.h,
    true
  );
  dat = {   // 蓄積用データ
    raw:  [],
    mean: [], 
    s2:   [], 
    u2:   [], 
    se:   [],
    ci_lower: [],
    ci_upper: [],
    result:   [],
  };
}
// ---------------------------------- 初期化関数：本体
function setup() {
  frameRate(userFramerate);
  strokeCap(SQUARE);
  // ループ制御
  loopOn = false;
  noLoop();
}
// ---------------------------------- 実行ボタンで再初期化する
function resetCanvas() {
  // キャンバスの作成
  canvas = createCanvas(canvas_width, canvas_height);
  canvas.parent(document.getElementById('p5'));
  background(canvas_background);
  // 確率変数の準備
  generateRandomVar();
  // 背景を消してスケールを表示 true する
  drawBackground(true);
}

/**
 * シミュレーション本体部分
 =========================================== */
// ---------------------------------- 指定した分布、サンプルサイズの乱数を返す
function generateRandomData(dist, size) {
  let x = new Array(size).fill(0).map((value) => {
    return jStat.normal.sample(userParameter.mu, userParameter.sigma);
  });
  return x;
}
// ---------------------------------- シミュレーション1回分を描画する
function plotOneSimulation(index) {
  let sum = 0;
  const posy = axisX.center_y + gapy * index;
  const x = generateRandomData('N', userSampleSize);
  // 最小値から最大値まで線を引き
  stroke(96);
  strokeWeight(0.1);
  line(cx(min(x)), posy, cx(max(x)), posy);
  // 各乱数の値に点をうち
  strokeWeight(2);
  x.forEach((value, index) => {
    point(cx(value), posy);
  });
  // 統計量を計算してデータに蓄積し
  const st = calcStatsofMean(x);
  dat.raw.push(x.join(','));
  dat.mean.push(st.mean);
  dat.s2.push(st.s2);
  dat.u2.push(st.u2);
  // 信頼区間を計算して青い（赤い）線を描く
  let simulate = {mean:0, min:0, max:0, conf:0.95, };
  const stderr = Math.sqrt(st.u2 / userSampleSize);
  const conf_width = criticalPoint * stderr;
  simulate = {
    mean:st.mean, 
    ci_lower:st.mean-conf_width, 
    ci_upper:st.mean+conf_width,
  };
  strokeWeight(2);
  // 信頼区間情報も蓄積する
  dat.se.push(stderr);
  dat.ci_lower.push(simulate.ci_lower);
  dat.ci_upper.push(simulate.ci_upper);
  // 信頼区間をふくんでいたら数える
  if (simulate.ci_lower <= userParameter.mu && userParameter.mu <= simulate.ci_upper) {
    hitNumber++;
    stroke(0, 128, 255, 90);
    dat.result.push(1);
  } else {
    stroke(255, 60, 60, 90);
    dat.result.push(0);
  }
  line(cx(simulate.ci_lower), posy, cx(simulate.ci_upper), posy);
  // 平均値に赤い点をうつ
  strokeWeight(4);
  stroke('red');
  point(cx(st.mean), posy);
  // 誤差の最小値を記録する
  if ((st.mean - userParameter.mu) ** 2 < (minDev - userParameter.mu) ** 2) {
    minDev = st.mean;
  }
  // 平均値を返す
  return st.mean;
}

// ---------------------------------- x座標を計算して返す
function cx(x) {
  return axisX.scale * x + axisX.center_x;
}
// ---------------------------------- 平均値の計算
function calcMean(x) {
  let s = 0;
  x.forEach((value) => {
    s += value;
  });
  return (s / x.length);
}
// ---------------------------------- 標本の平均と不偏分散を蓄積する
function calcStatsofMean(x) {
  const mean = calcMean(x);
  let ss = 0;
  x.forEach((value) => {
    ss += (value - mean) ** 2;
  });
  const s2 = ss / x.length;
  const u2 = ss / (x.length - 1);
  return {mean, s2, u2};
}
// ---------------------------------- 直近のデータを見せる
function dispLastData() {
  push();
  fill(255);
  noStroke();
  rect(plotArea.hist.x, plotArea.hist.y, plotArea.hist.w, plotArea.hist.h);
  fill(0);
  textSize(16);
  textAlign(LEFT, TOP);
  const index = dat.raw.length - 1;
  const x0 = dat.raw[index].split(',').map((val) => {
    return val * 1;
  });
  let tx = plotArea.hist.x + 10;
  let ty = plotArea.hist.y + 10;
  text(`現在のデータ（n=${userSampleSize}）：${(userSampleSize>50 ? '51件以降は表示できません' : '')}`, tx, ty); ty+=20;
  for (let i=0; i<min(userSampleSize, 50); i++) {
    text(`x(${i+1}) = ${x0[i].toFixed(3)}`, tx, ty); ty+=20;
    if (i % 10==9) {
      ty = plotArea.hist.y + 10 + 20;
      tx += 150;
    }
  }
  tx = plotArea.hist.x + 10;
  ty = plotArea.hist.y + 10 + 220;
  text(`平均値：${dat.mean[index].toFixed(3)}`, tx, ty);  ty+=20;
  text(`不偏分散：${dat.u2[index].toFixed(3)}`, tx, ty); 
  pop();
}
/**===========================================
 *  描画関数
 */
// ---------------------------------- 描画関数本体
function draw() {
  if (loopOn) {
    const x = plotOneSimulation(index);
    rvPlot.appendData(x);
    rvPlot.plotDatas();
    index++;
    iter++;
    if (iter >= userMaxTrial) {
      noLoop();
      document.querySelector('#btn_pause').disabled = true;
      rvHist.setData(rvPlot.data_x, breaks);
      rvHist.drawHist('hist', true);
// 出そうと思えば分散の統計も出せる。どうやって活用するかはまだ決めてない
//      const means = {
//        mean:calcMean(dat.mean), 
//        s2:calcMean(dat.s2),
//        u2:calcMean(dat.u2),
//      };
      const st_str = `区間推定「成功」回数：${hitNumber}回（${(hitNumber/userMaxTrial*100).toFixed(1)}％）\n誤差が最小の標本平均値：${minDev.toFixed(5)}`;
      textAlign(LEFT, TOP);
      textSize(16);
      fill(0);
      noStroke();
      text(st_str, plotArea.hist.x+10, plotArea.hist.y+10);
      prepairDownload();
    } else if (index >= pageSize) {
      drawBackground();
      index = 0;
    }
  }
}
// ---------------------------------- 背景を半透明で消す＋スケールを出す
function drawBackground(flag = false) {
  const fy = gapy * pageSize + 35;
  noStroke();
//  fill(canvas_background, 160);
  fill(255, 160);
  rect(0, 0, canvas_width, fy-1);
  //background(canvas_background, 96);

  fill(255);
  rect(0, 0, canvas_width, plotArea.sim.y-5);
  fill(0);
  textSize(14);
  textAlign(CENTER, CENTER);
  text(`シミュレーション ${iter+1}～${min(iter+pageSize,userMaxTrial)}回目`, canvas_width/2, plotArea.sim.y/2);

  strokeWeight(0.5);
  stroke(255, 0, 0, 128);
  line(cx(userParameter.mu), 3, cx(userParameter.mu), fy);
  if (flag) {
    stroke(0);
    line(0, fy+1, canvas_width, fy+1);
    textSize(10);
    noStroke();
    fill(0);
    textAlign(CENTER, TOP);
    for (let i=axisX.min; i<=axisX.max; i++) {
      text(i, cx(i), fy+2);
    }
  }
}
// ---------------------------------- ローデータの提供 データダウンロードの準備をする
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
      let dhead = new Array(userSampleSize).fill('').map((value, index) => {
        return `X${index+1}`;
      });
      data.push(dhead);
      for (let i=0; i<dat.raw.length; i++) {
        data.push(dat.raw[i]);
      }
      data.push('');
      break;
    // ---------------------- 統計データの作成
    case 'stats_data':
      let d = 'mean, u2, se, ci_lower, ci_upper, result';
      data.push(d);
      for (let i=0; i<dat.mean.length; i++) {
        d = `${dat.mean[i].toFixed(3)}, ${dat.u2[i].toFixed(3)}, ${dat.se[i].toFixed(3)}, ${dat.ci_lower[i].toFixed(3)}, ${dat.ci_upper[i].toFixed(3)}, ${dat.result[i]}`;
        data.push(d);
      }
      break;
    // ---------------------- スクリプトの作成
    case 'script':
      data.push('## 区間推定');
      data.push('## Stats Data と同じものを作ります。');
      data.push('# データ読み込み');
      data.push('df <- read.csv("raw_data.csv")');
      data.push('head(df)');
      data.push('# 箱ひげ図を描く');
      data.push('boxplot(df)');
      data.push('# 平均と分散を比較する');
      data.push('apply(df ,MARGIN = 2, mean)');
      data.push('apply(df ,MARGIN = 2, var)');
      data.push('# 各試行の統計量を計算する');
      data.push('s_size <- ' + userSampleSize);
      data.push('user_mu <- ' + userParameter.mu);
      data.push('for (i in 1:NROW(df)) {');
      data.push('  t_test <- t.test(df[i, 1:s_size], mu=user_mu)');
      data.push('  df$mean[i] <- round(mean(t(df[i, 1:s_size])),3)');
      data.push('  df$u2[i] <- round(var(t(df[i, 1:s_size])),3)');
      data.push('  df$se[i] <- round(t_test$stderr,3)');
      data.push('  df$ci_lower[i] <- round(t_test$conf.int[1],3)');
      data.push('  df$ci_upper[i] <- round(t_test$conf.int[2],3)');
      data.push('  df$result[i] <- (t_test$conf.int[1] <= user_mu && t_test$conf.int[2] >= user_mu) * 1');
      data.push('}');
      data.push('sum(df$result) # 「成功」回数');
      data.push('sum(df$result)/NROW(df) # 「成功」割合');
      break;
    default:
      return null;
  }
  data.push('');
  return data.join('\n');
}

