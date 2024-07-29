/** 
 *  離散的確率変数の和
 *  sum_of_catrv.js
 */


// 確率変数プロッターオブジェクト
let rvPlot = [];  // userVarNumber 番目が合計または平均。
let userParameter = {coin_p:0.5, };
let userVarNumber;
let userDistType;
//let userSimType = -1;
let userMaxTrials = 0;
let rvFunc;       // 密度関数
let rvHist;       // ヒストグラム

// キャンバス
let canvas;
const canvas_width = 900;
const canvas_height = 400;
const canvas_background = 255;
const userFramerate = 30;
// プロット座標
const plotBars     = {x:   0, y:   0, w: 700, h: 200, };
const plotLines    = {x:   0, y: 200, w: 700, h:  60, };  // 3つ分必要
//const plotHistgram = {x:   0, y: 400, w: 700, h: 250, };
const plotValues   = {x: 710, y: 200, w: 190, h:  60, };

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
let trialIndex = -1;


/**
 *  シミュレートタイプの選択
 ------------------------------------------------------- */
window.addEventListener('load', function() {
  dispParasetSpan();
});
// 分布の選択
document.querySelector('#select_dist').addEventListener('change',dispParasetSpan);
// パラメータ入力エリアの入れ替え
function dispParasetSpan() {
  userDistType = document.querySelector('#select_dist').value * 1;
  document.querySelectorAll('.paraset').forEach((element)=> {
    element.style.display = 'none';
  });
  const idtag = `#para_${userDistType}`;
  document.querySelector(idtag).style.display = 'inline-block';
  //console.log('プロットを描く');
  setInitial();
}
document.querySelector('#coin_p').addEventListener('change', setInitial);
/**
 *  イベント設定
 ======================================================= */
// 実行ボタン btn_start
document.querySelector('#btn_start').addEventListener('click', () => {
  userMaxTrials = document.querySelector('#trial_number').value * 1;
  //document.querySelectorAll('.radio').forEach((element) => {
  //  if (element.checked) userSimType = element.value;
  //  element.disabled = true;
  //});
  stopControles(true);
  if (trialIndex < 0) {
    trialIndex = 0;
    setInitial();
  }
  loopOn = true;
  loop();
});
// 入力コントロールを停止する
function stopControles(flag = false) {
  document.querySelector('#select_dist').disabled = true;
  document.querySelectorAll('.number').forEach((element) => {
    element.disabled = true;
  });
  document.querySelector('#trial_number').disabled = flag;
  document.querySelectorAll('.radio').forEach((element) => {
    element.disabled = true;
  });
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
  // キャンバスサイズの決定
  canvas = createCanvas(canvas_width, canvas_height);
  canvas.parent(document.getElementById('p5'));
  background(canvas_background);
  // プロッターと棒グラフの設定
  makeRandomVariables();
  // スケールの設定：上の関数の中で設定完了
  // グラフの表示
  rvFunc.drawBarPlot();
}
// パラメータの設定：HTML上の設定を反映する
function setParameters() {
  userDistType = document.querySelector('#select_dist').value * 1;
  userParameter.coin_p = document.querySelector('#coin_p').value * 1;
}
// 確率変数プロッターオブジェクトの作成
function makeRandomVariables() {
  const rvtype = userDistType==0 ? 'Coin' : 'Dice';
  const rvnames = [`${rvtype}:A`,`${rvtype}:B`, `${rvtype}:A+B`];
  let distpara = [];
  if (userDistType==0) {
    distpara[0] = {d:'C', p1:userParameter.coin_p, n:1, };
    distpara[1] = {d:'C', p1:userParameter.coni_p, n:2, };
  } else if (userDistType==1) {
    distpara[0] = {d:'D', p1:1, n:1, };
    distpara[1] = {d:'D', p1:1, n:2, };
  }
  for (let i=0; i<3; i++) {
    rvPlot[i] = new CatPlotter(
      rvnames[i], distpara[(i==2 ? 1 : 0)], 
      [{ name:'L', 
        x: plotLines.x, y: plotLines.y+plotLines.h*i, w: plotLines.w, h: plotLines.h+(i==2 ? 10 : 0), 
        axis: (i==2), 
        col: colorList(i, true),
      }]
    );
  }
  // 存在確認
  const scalex = (userDistType==0 ? {left:100, cat:3, width:50, space:20, } : {left:100, cat:11, width:40, space:10, });
  rvPlot.forEach((rp, index) => {
    rp.scalex = scalex;
    //rp.fillarea();
    rp.dispString('L', rp.name, 0, 12, 'LEFT_CENTER');
  });
  // 確率密度関数オブジェクトの作成
  rvFunc = new CatPlotter(
      rvtype, distpara[0], 
      [{ name:'B', 
        x: plotBars.x, y: plotBars.y, w: plotBars.w, h: plotBars.h, 
        axis: true, 
        col: color('black'),
      }]
  );
  rvFunc.scalex = scalex;
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
      rect(700, 150, 200, 50);
      fill(0);
      textAlign(CENTER, CENTER);
      textSize(15);
      text(`${trialIndex}回終了`, 780, 175);
      pop();
    }
    if (trialIndex >= userMaxTrials) {
      //dispHistgram();
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
  for (let i=0; i<2; i++) {
    data[i] = rvPlot[i].generateNewData();
    rvPlot[i].plotDatas();
    rvPlot[i].dispString('L', rvPlot[i].name, 0, 12, 'LEFT_CENTER');
  }
  //data[2] = (userSimType==0 ? data[0] + data[1]:(data[0] + data[1])/2 );
  data[2] = data[0] + data[1];
  rvPlot[2].appendData(data[2]);
  rvPlot[2].plotDatas();
  rvPlot[2].dispString('L', rvPlot[2].name, 0, 12, 'LEFT_CENTER');
  trialIndex++;
  return data;
}
// 現在の乱数値を表示する
//const plotFunction = {x:   0, y:   0, w: 700, h: 250, };
function dispCurrentValue(data) {
  push();
  // グラフの表示しなおし
  rvFunc.drawBarPlot(true);

  fill('white');
  noStroke();
  rect(plotValues.x-9, 0, plotValues.w, plotValues.y+plotValues.h*3);
  textSize(15);
  const name = ['A', 'B', '和'];
  const scalex = rvFunc.scalexc;
  for (let i=0; i<=2; i++) {
    const d = data[i] - (userDistType==1 ? 1 : 0);
    fill(0);
    textAlign(CENTER, CENTER);
    text(name[i], plotValues.x+20, plotValues.y + 20 + (i*60));
    textAlign(RIGHT, CENTER);
    text(data[i], plotValues.x+100, plotValues.y + 20 + (i*60));
    // 値表示エリアに点を描画
    fill(colorList(i, false));
    circle(plotValues.x+48, plotValues.y + 20 + (i*60), 12);
    // グラフに重ねて点を描画
    circle(scalex[d], plotBars.y + plotBars.h - (i==2 ? 60 : 40), 12);
    fill(0);
    textAlign(CENTER, BASELINE);
    text(name[i], scalex[d], plotBars.y + plotBars.h - (i==2 ? 70 : 20));
  }
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
  for (let i=0; i<=2; i++) {
    rvHist.setData(rvPlot[i].data_x, rvBreaks);
    freqMax = max(freqMax, rvHist.freqmax);
  }
  // ヒストグラムを順に重ね書きする
  for (let i=0; i<=2; i++) {
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
      let dhead = 'ID, X, Y, Z';
      for (let k=0; k<=2; k++) {
        d[k] = [];
        d[k] = rvPlot[k].data_x;
      }
      data.push(dhead);
      for (let i=0; i<userMaxTrials; i++) {
        let dstr = '' + (i+1);
        for (let k=0; k<=2; k++) {
          dstr = dstr + ', ' + d[k][i];
        }
        data.push(dstr);
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
      data.push('## 確率変数の和と平均');
      data.push('# データ読み込み');
      data.push('df <- read.csv("raw_data.csv")');
      data.push('head(df)');
      data.push('# 度数分布');
      data.push('table(df$X)');
      data.push('table(df$Y)');
      data.push('table(df$Z)');
      data.push('# 平均と分散を比較する');
      data.push('apply(df[,-1],MARGIN = 2, mean)');
      data.push('apply(df[,-1],MARGIN = 2, var)');
      break;
    default:
      return null;
  }
  data.push('');
  return data.join('\n');
}

