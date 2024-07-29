//
// ｔ分布：定義式の分子・分母
// student_t02.js
//

// 確率変数オブジェクト
let rvT = [];
let rvDf = 3;
let names = ['N','√(W/m)','T'];
const names_j = ['分子：標準正規分布','分母：(カイ二乗分布÷自由度)の平方根','t分布'];

// キャンバス
let canvas;
const canvas_background = 'white';
const userFramerate = 20;

// ループ制御変数
let maxIndex = 1;
let loopOn = false;
let loopEnd = false;
let index = -1;

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

/**===========================================
 * HTML との連携関数
 */
// ボタンオブジェクトへの参照
const btnStart = document.querySelector('#btn_start');
const btnStop = document.querySelector('#btn_stop');
const inputSampleSize = document.querySelector('#sample_size');
const inputDf = document.querySelector('#df');
// 更新ボタン
btnStart.addEventListener('click', function() {
  maxIndex = inputSampleSize.value * 1;
  rvDf = inputDf.value * 1;
  btnStart.disabled = true;
  btnStop.toggleAttribute('hidden');
  inputSampleSize.disabled = true;
  inputDf.disabled = true;

  resetCanvas();
  index = 0;
  loopOn = true;
  loopEnd = false;
  loop();
});
// ストップボタン
btnStop.addEventListener('click', function() {
  btnStop.value = loopOn ? "Restart" : 'Stop';
  loopOn = !loopOn;
});

/**===========================================
 * 初期化関数
 */
// キャンバス設定
const canvas_width  = 820;
let   canvas_height = 920;
// 確率変数クラスインスタンスの準備
function generateRandomVar(rvDf) {
  // 確率変数オブジェクトの準備
  const dHeight = 15;
  const lHeight = 40;
  const hHeight = 250;
  const dlHeight = dHeight + lHeight;
  const allHeight = dHeight + lHeight + hHeight;
  // やっとキャンバスの高さが決まる
  canvas_height = allHeight * 3;
  // カイ二乗分布のパラメータ計算
  const upper = 10;
  const lower = -10;
  let br = new Array((upper - lower)*2+1).fill(0).map((value, index) => {
    return (index * 0.5 + lower);
  });
  // 確率変数オブジェクトの作成
  for (let i=0; i<3; i++) {
    let sizes = [];
    sizes[0] = new AreaSize(10, (dlHeight * i), 800, dHeight, false);
    sizes[1] = new AreaSize(10, (dlHeight * i + dHeight), 800, lHeight, true);
    sizes[2] = new AreaSize(10, (dlHeight * 3 + hHeight*i), 800, hHeight, true);
    if (i==0) {
      rvT[i] = new RandomVariable(names[i], 'N', ['DOT','LINE','HIST'], sizes);
      rvT[i].setParameter(0, 1);  // パラメータの明示的な設定
    } else if (i==1) {
      rvT[i] = new RandomVariable(names[i], 'X', ['DOT','LINE','HIST'], sizes);
      rvT[i].setParameter(rvDf);  // パラメータの明示的な設定
    } else if (i==2) {
      rvT[i] = new RandomVariable(names[i], 'T', ['DOT','LINE','HIST'], sizes);
      rvT[i].setParameter(rvDf);  // パラメータの明示的な設定
    }
    rvT[i].setAxis(lower, upper, 0, 1);  // 軸と階級の設定
    rvT[i].setBreaks(br);
  }

}
// 初期化関数：本体
function setup() {
  frameRate(userFramerate);
  randomSeed(minute() + second());
  strokeCap(SQUARE);
  resetCanvas();
  // ループ制御
  loopOn = false;
  noLoop();
}
// キャンバス再設定
function resetCanvas() {
  // 確率変数の作成
  generateRandomVar(rvDf);
  // キャンバスの作成
  canvas = createCanvas(canvas_width, canvas_height);
  canvas.parent(document.getElementById('p5'));
  background(canvas_background);
  // 動作確認
  for (let i=0; i<3; i++) {
    //rvT[i].fillarea();
    rvT[i].dispString('LINE', names[i], 'black', 11, p='LEFT_TOP');
  }
}



/**

// 生データを表示してみる
objRv.prototype.dispPlotData = function() {
  push();
  fill('lightcyan');
  rect(this.graph.x+this.graph.w-60, this.graph.y, 55, this.graph.h * 0.8);
  textAlign(RIGHT, TOP);
  textSize(12);
  noStroke();
  fill('black');
  const size = this.data.length;
  const textpos = {x:this.graph.x+this.graph.w-10, y:this.graph.y, inter:this.graph.h/10};
  for (let i=1; i<=8; i++) {
    text(this.data[size-i].toFixed(2), textpos.x, textpos.y+textpos.inter*(i-1));
    if (i >= size) break;
  }
  pop();
}
// 統計量を表示する
objRv.prototype.dispStats = function() {
  const mean = calc_mean(this.data);
  const sd   = calc_sd(this.data);
  const nrow = this.data.length;
  push();
  fill(0);
  noStroke();
  textSize(14);
  textAlign(LEFT, TOP);
  const tpos = {x:this.graph.x+this.graph.w-120, y:this.graph.y+10};
  text('確率変数 ' + this.name, tpos.x, tpos.y);
  text('平均値：' + mean.toFixed(2), tpos.x, tpos.y+20);
  text('標準偏差：' + sd.toFixed(2), tpos.x, tpos.y+40);
  text('N ='+nrow, tpos.x, tpos.y+60);
  pop();
}
*/

/**===========================================
 *  描画関数
 */
function draw() {
  if (loopOn) {
    // 名前の表示
    index++;
    doRandomPlot();
    if (index >= maxIndex) {
      //loopEnd = true;
      loopOn = false;
      noLoop();
      btnStop.disabled = true;
      for (let i=0; i<3; i++) {
        rvT[i].drawHist('hist');
        rvT[i].calcStats();
        rvT[i].dispMean('HIST');
        const stat = rvT[i].stat;
        const stat_str = `${names_j[i]}\n平均値 : ${stat.mean.toFixed(2)} \n分散 : ${stat.var_s.toFixed(2)}\n標準偏差 : ${stat.sd_s.toFixed(2)}`;
        rvT[i].dispString('HIST', stat_str, 'black', 11, p='LEFT_TOP');
      }
      //RV.forEach((element, index)=>{element.dispStats();});
      //dispRawData();
    }
  }
}
// 乱数をプロットする
function doRandomPlot() {
  let x = [0, 0];
  x[0] = rvT[0].generateNewData();
  for (let i=0; i<rvDf; i++) {
    x[1] += (randomGaussian(0,1)) ** 2;
  }
  x[1] = Math.sqrt(x[1]/rvDf);
  rvT[1].appendData(x[1]);
  rvT[2].appendData(x[0]/x[1]);
  for (let i=0; i<3; i++) {
    rvT[i].plotDatas();
  }
}
// ローデータの表示
function dispRawData() {
  let result = [];
  const dat_x = RV[rvX].data.map((value, index)=>{return value.toFixed(2);});
  const dat_y = RV[rvY].data.map((value, index)=>{return value.toFixed(2);});
  
  result += '<h3>ローデータ</h3><p>データは小数第3位を四捨五入してあります。</p>';
  result += '<p>確率変数X：<br /><textarea rows="10" cols="100">' + dat_x.join(',') + '</textarea></p>';
  result += '<p>確率変数Y：<br /><textarea rows="10" cols="100">' + dat_y.join(',') + '</textarea></p>';
  document.getElementById('result').innerHTML = result;
}
