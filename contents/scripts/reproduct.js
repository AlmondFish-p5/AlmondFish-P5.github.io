/** 
 *  正規分布の再生性A,B
 *  reproduct.js
 */


// 確率変数プロッターオブジェクト
let rvPlot = [];  // userVarNumber 番目が合計または平均。
let userParameter;
let userVarNumber;
let userSimType;
let userMaxTrials = 0;
let rvFunc;       // 密度関数
let rvHist;       // ヒストグラム

// キャンバス
let canvas;
const canvas_width = 900;
let canvas_height = 0;
const canvas_background = 255;
const userFramerate = 30;
// プロット座標
const plot_left = 50; 
const plot_width = 800;
const plot_graph_height = 300;
const plot_line_height = 40;
const plot_top = 0;
const plot_counter_y = plot_top+plot_graph_height+30;
let plot_hist_top;
let plot_current_data_y;

// ループ制御変数
let loopOn = false;
let loopEnd = false;
let index = 0;
let trials = 0;

// 座標サイズ
let cvInterval = {min:1000, max:-1000, };

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

/**
 *  シミュレートタイプの選択
 ------------------------------------------------------- */
window.addEventListener('load', function() {
  document.querySelector('#setting_s').style.display = 'none';
  document.querySelector('#setting_m').style.display = 'none';
  document.querySelector('#setting_z').style.display = 'none';
});
const simTypeSelect = document.querySelectorAll('.radio');
// シミュレートタイプの選択
simTypeSelect.forEach((sel) => {
  sel.addEventListener('change', function() {
    const idmark = ['s','m','s'];
    const index  = (sel.value=='s' ? 0 : 1);
    const idstr  = [];
    const divstr = [];
    idstr[0] = '#type_select_' + idmark[index];
    idstr[1] = '#type_select_' + idmark[index + 1];
    divstr[0] = '#setting_' + idmark[index];
    divstr[1] = '#setting_' + idmark[index + 1];
    divstr[2] = '#setting_z';
    document.querySelector(idstr[0]).classList.add('active');
    document.querySelector(idstr[1]).classList.remove('active');
    document.querySelector(divstr[0]).style.display = 'block';
    document.querySelector(divstr[1]).style.display = 'none';
    document.querySelector(divstr[2]).style.display = 'block';
    userSimType = sel.value;
  });
});

/**
 *  イベント設定
 ======================================================= */
// 実行ボタン btn_start
document.querySelector('#btn_start').addEventListener('click', () => {
  userMaxTrials = document.querySelector('#trial_number').value * 1;
  document.querySelector('#btn_start').disabled = true;
  document.querySelector('#btn_graph').disabled = true;
  document.querySelectorAll('.number').forEach((element) => {
    element.disabled = true;
  });
  document.querySelectorAll('.radio').forEach((element) => {
    element.disabled = true;
  });
  setInitial();
  index = 0;
  trials = 0;
  loopOn = true;
//  loopEnd = false;
  loop();
});
// グラフのみ表示 btn_graph
document.querySelector('#btn_graph').addEventListener('click', ()=>{
  setInitial();
});
// ページ再読み込み btn_reset
document.querySelector('#btn_reset').addEventListener('click', ()=>{
  window.location.reload();
});
// 実行の一時停止 btn_pause
document.querySelector('#btn_pause').addEventListener('click', ()=>{
  loopOn = !loopOn;
  document.querySelector('#btn_pause').value = loopOn ? '一時停止': '再　開';
  push();
  fill(255);
  noStroke();
  rect(0, plot_current_data_y, canvas_width, canvas_height-plot_current_data_y);
  if (!loopOn) {
    fill(0);
    textSize(15);
    textAlign(LEFT, TOP);
    let y = plot_current_data_y + 5;
    for (let i=0; i<=userVarNumber; i++) {
      text(`${rvPlot[i].name} = ${rvPlot[i].lastdata.toFixed(4)}`, plot_left, y);
      y += 18;
    }
  }
  pop();
});

/**
 *  初期設定
 ======================================================= */
// シミュレーションの初期設定をする
function setInitial() {
  // パラメータの設定
  setParameters();
  // キャンバスサイズの決定
  canvas_height = plot_graph_height * 2 + plot_line_height * (userVarNumber+1) + 60;
  canvas = createCanvas(canvas_width, canvas_height);
  canvas.parent(document.getElementById('p5'));
  background(canvas_background);
  // プロッターの設定
  makeRandomVariables();
  // グラフの設定
  makeDistFunction();
  // スケールの設定
  setScales();
  // グラフの表示
  rvFunc.drawCurves();
  rvFunc.dispLegend();
}
// パラメータの設定：HTML上の設定を反映する＋合計／平均パラメータを計算する
function setParameters() {
  const p = {mu:0, sigma:0, };
  if (userSimType == 's') {
    userVarNumber = 2;
    userParameter = new Array(2 + 1);
    const pm = [
      document.querySelector('#mu_x').value * 1,
      document.querySelector('#sigma_x').value * 1,
      document.querySelector('#mu_y').value * 1,
      document.querySelector('#sigma_y').value * 1
    ];
    userParameter[0] = { mu: pm[0], sigma: pm[1], };
    userParameter[1] = { mu: pm[2], sigma: pm[3], };
    userParameter[2] = {
      mu : pm[0] + pm[2],
      sigma : Math.sqrt(pm[1] ** 2 + pm[3] ** 2),
    }
  } else if (userSimType == 'm') {
    userVarNumber = document.querySelector('#num_xs').value * 1;
    const p = {
      mu:document.querySelector('#mu_xs').value * 1, 
      sigma:document.querySelector('#sigma_xs').value * 1,
    };
    userParameter = new Array(userVarNumber).fill(p);
    userParameter[userVarNumber] = {
      mu: p.mu,
      sigma:p.sigma / Math.sqrt(userVarNumber),
    }
  } else {
    window.alert('Illigal setting !');
  }
}
// 確率変数プロッターオブジェクトの作成
function makeRandomVariables() {
  let rvnames;
  if (userSimType=='s') {
    rvnames = ['X', 'Y', 'Z=X+Y'];
  } else {
    rvnames = new Array(userVarNumber);
    for (let i=0; i<userVarNumber; i++) {
      rvnames[i] = `X(${i+1})`;
    }
    rvnames[userVarNumber] = 'Mean of Xs';
  }
  let idx;
  let y = plot_counter_y;
  for (idx=0; idx<userVarNumber; idx++) {
    rvPlot[idx] = new RvPlotter(
      rvnames[idx],
      {d:'N', p1:userParameter[idx].mu, p2:userParameter[idx].sigma, },
      [{ name:'L', 
        x: plot_left, y: y, w: plot_width, h: plot_line_height + (idx == userVarNumber-1 ? 10 : 0), 
        axis:(idx == userVarNumber-1 ? true : false), 
        col: colorList(idx, true),
      }]
    );
    y += plot_line_height;
  }
  idx = userVarNumber;
  y += 10;
  rvPlot[idx] = new RvPlotter(
    rvnames[idx],
    {d:'N', p1:userParameter[idx].mu, p2:userParameter[idx].sigma, },
    [{ name:'L', 
      x: plot_left, y: y, w: plot_width, h: plot_line_height+10, axis: true, col: colorList(-1, true),
    }]
  );
  plot_current_data_y = y + plot_line_height + 20;
  plot_hist_top = y + plot_line_height + 20;
  // 存在確認
  rvPlot.forEach((rp, index) => {
    //rp.fillarea();
    rp.dispString('L', rp.name, 0, 12, 'LEFT_CENTER');
  });
}
// 確率密度関数オブジェクトの作成
function makeDistFunction() {
  let dlist = [];
  for (let i=0; i<(userSimType=='s' ? 2:1); i++) {
    dlist[i] = {
      d : 'N',
      p1 : userParameter[i].mu,
      p2 : userParameter[i].sigma,
      col : colorList(i, false),
    }
  }
  const i = userSimType=='s' ? 2:1;
  dlist[i] = {
    d : 'N',
    p1 : userParameter[userVarNumber].mu,
    p2 : userParameter[userVarNumber].sigma,
    col : colorList(-1, false),
  }
  rvFunc = new drawDistFunc(
    '正規分布',
    {x: plot_left, y: plot_top, w: plot_width,  h: plot_graph_height, },
    dlist
  );
  //rvFunc.fillarea();
}
// 描画X軸の設定
function setScales() {
  // X軸の範囲を決める＝確率変数の±4σとする：計算が過度に複雑にならないように丸める
  cvInterval = {min: 1000, max: -1000};
  for (let i=0; i<userParameter.length; i++) {
    cvInterval.min = min(cvInterval.min, userParameter[i].mu - 4 * userParameter[i].sigma);
    cvInterval.max = max(cvInterval.max, userParameter[i].mu + 4 * userParameter[i].sigma);
  }
  rvPlot.forEach((rv) => {
    rv.scalex = cvInterval;
  });
  rvFunc.scalex = cvInterval;
}

/**
 *  初期化関数
 ======================================================= */
function setup() {
  frameRate(userFramerate);
  strokeCap(SQUARE);
  // ランダムシード
  randomSeed(minute() + second());
  
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
    index++;
    drawRandomPlot(index);
    if (index % 10==0) {
      push();
      fill(255);
      noStroke();
      rect(0, plot_counter_y-30, canvas_width, 30);
      fill(0);
      textAlign(RIGHT, BASELINE);
      textSize(15);
      text(`繰り返し ${index} 回まで終了`, canvas_width-50, plot_counter_y-5);
      pop();
    }
    if (index >= userMaxTrials) {
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
  for (let i=0; i<userVarNumber; i++) {
    xsum += rvPlot[i].generateNewData();
    rvPlot[i].plotDatas();
  }
  if (userSimType=='m') xsum /= userVarNumber;
  rvPlot[userVarNumber].appendData(xsum);
  rvPlot[userVarNumber].plotDatas();
}

/**
 *  結果表示
 ======================================================= */
// ヒストグラムを表示する
function dispHistgram() {
  rvHist = new Histgram(plot_left, plot_hist_top, plot_width, plot_graph_height, true);
  // 最もSDの小さいものを基準にする
  let msd = 1000;
  let index = -1;
  for (let i=0; i<=userVarNumber; i++) {
    if (userParameter[i].sigma < msd) {
      index = i;
      msd = userParameter[i].sigma;
    }
  }
  // 最大度数をいくつにすればよいか
  let freqMax = 0;
  const rvBreaks = rvFunc.xline;
  rvHist.setData(rvPlot[index].data_x, rvBreaks);
  freqMax = rvHist.freqmax;
  // ヒストグラムを順に重ね書きする
  for (let i=0; i<=userVarNumber; i++) {
    rvHist.setData(rvPlot[i].data_x, rvBreaks, freqMax);
    const j = (i==userVarNumber ? -1 : i);
    rvHist.fillColor = colorList(j, true);
    rvHist.borderColor = colorList(j, true);
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
      let dhead = 'ID';
      for (let k=0; k<=userVarNumber; k++) {
        d[k] = [];
        d[k] = rvPlot[k].data_x;
        dhead = dhead + ', ' + rvPlot[k].name;
      }
      data.push(dhead);
      for (let i=0; i<userMaxTrials; i++) {
        let dstr = '' + (i+1);
        for (let k=0; k<=userVarNumber; k++) {
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
      data.push('## 正規分布の再生性');
      data.push('# データ読み込み');
      data.push('df <- read.csv("raw_data.csv")');
      data.push('head(df)');
      data.push('# それぞれの変数の平均と分散を確認する');
      data.push('df.stat <- data.frame(');
      data.push('  mean=apply(df[,-1], 2, mean), ');
      data.push('  var=apply(df[,-1], 2, var),');
      data.push('  sd=apply(df[,-1], 2, sd))');
      data.push('print(df.stat, digits=4)');
      data.push('# ヒストグラムを描く');
      data.push('min.data <- floor(min(df[,-1]))');
      data.push('max.data <- ceiling(max(df[,-1]))');
      data.push('breaks <- seq(min.data, max.data, 0.2)');
      data.push('for (i in 2:(length(df))) {');
      data.push('  hist(df[,i], xlab=colnames(df)[i], main=colnames(df)[i], breaks=breaks)');
      data.push('}');
      break;
    default:
      return null;
  }
  data.push('');
  return data.join('\n');
}

