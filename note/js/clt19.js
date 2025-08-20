/** =====================================================
 *  確率変数シミュレーション
 *  clt19.js
 */


/** =====================================================
 *  広域変数
 */
 
// ユーザ指定する変数
//let userVarType;        // 確率変数タイプ
let userRvProb;           // 表の出る確率
let userRvNumber;         // 確率変数の数
let userRvIter;           // 繰り返し回数指定
let userFramerate;        // 設定可能にしてもいい
//let userManMode = true; // 実行モード：手動実行のときtrue

let rvOption = {
  sum  : 1,
  mean : 0,
};
const clsHeight = {
  margin : 20,
  coin : 120,
  sum  : 170,
  mean : 120,
};
const clsWidth = 780;
const rvSize = 50;    // コイン画像の大きさ

// これらの変数に影響される広域変数
let canvas;
const canvasWidth  = 800;
let   canvasHeight;
const canvas_background = 255;

// インスタンス
let clsCoinLine = [];
let clsLinePlotSum;
let clsLinePlotMean;
let img = [];

// 確率変数の記録
let rvdata = [];

// その他の広域変数
let loopOn = false;
let trials = 0;    // 試行回数


/** =====================================================
 *  ラインプロットクラス定義
 *  常に、0からymaxまでの整数値しか受け付けない仕様になっている
 *  引数： x,y,w,h : 表示サイズ（左100が名前、右120が統計量で使用される）
 *        ymax: 0からymaxまでの値をプロット, xmax: 繰り返し回数, name(str): 確率変数名
 *  addPoint(n ,y) : n回目の値がyであったので追加する
 *  dispStat()     : 統計量を表示（n回終わってから）
 */
class myLinePlot {
  #pad = {x:5, y:10, left:100, right:120, };
  #statX;
  #gbase;
  #yaxis;
  #xaxis;
  #df;
  #counter;
  constructor(x, y, w, h, ymax, nmax) {
    this.#gbase = {
      x : x + this.#pad.left,
      y : y + h - this.#pad.y,
      w : w - this.#pad.left - this.#pad.right,
    };
    this.#statX =  x + w - this.#pad.right + this.#pad.x*2; // 統計量表示X座標左端
    this.#yaxis = {
      max  : ymax,
      step : (h - this.#pad.y * 2) / ymax * (-1),
    };
    this.#xaxis = {
      max  : nmax,
      step : (w - this.#pad.left - this.#pad.right) / nmax,
    };
    this.#df = [];
    this.#counter = new Array(ymax+1).fill(0);
    this.#drawAxis();
  }
  #drawAxis () {  // ----- 軸と目盛りの表示
    push();
    strokeWeight(0.5);
    stroke(160);
    for (let i=0; i<=this.#xaxis.max; i++){
      line(this.#gbase.x, this.#gbase.y + this.#yaxis.step * i, 
           this.#gbase.x + this.#gbase.w, this.#gbase.y + this.#yaxis.step * i);
    }
    noStroke();
    textSize(12);
    textAlign(RIGHT, CENTER);
    for (let i=0; i<=this.#xaxis.max; i++){
      text(`${i} `, this.#gbase.x, this.#gbase.y + this.#yaxis.step * i);
    }
    pop();
  }
  addPoint(n, y) { // ----- 新しい値のプロットと折れ線の描画
    push();
    strokeWeight(4);
    stroke('red');
    point(this.#gbase.x + this.#xaxis.step * n, this.#gbase.y + this.#yaxis.step * y);
    this.#df.push(y);
    this.#counter[y]++;
    
    if (n>1) {
      strokeWeight(0.5);
      const y0 = this.#df[n-2];
      line(this.#gbase.x + this.#xaxis.step * n, this.#gbase.y + this.#yaxis.step * y, 
           this.#gbase.x + this.#xaxis.step * (n-1), this.#gbase.y + this.#yaxis.step * y0);
    }
    pop();
  }
  dispStat() {

    push();
    fill(0);
    textSize(12);
    textAlign(LEFT, CENTER);
    for (let i=0; i<=this.#yaxis.max; i++) {
      const sstr = this.#counter[i] + `(${(this.#counter[i] * 100 / this.#xaxis.max).toFixed(1)} %)` 
      text(sstr, this.#statX, this.#gbase.y + this.#yaxis.step * i);
    }
    pop();
  }
}

/** =====================================================
 *  コイン表示クラス定義
 *  指定された枚数のコインを用意し、指定されたデータ通りに描画する。データ管理はしない。
 *  引数： x,y : 1枚目の表示位置、size, inter : コインのサイズと横の間隔、rept : コインの枚数
 *  dispCoins(x) : データベクトルxを受け取ってコインを描画
 *  posy = y     : y表示位置を変更する
 */
class myDispCoins {
  #pos;
  #size;
  #rept;
  #img;
  constructor(x, y, size, inter, rept) {
    this.#pos = {
      x : new Array(rept).fill(0).map((val, idx) => {return(x + (size + inter) * idx)}),
      y : y,
    };
    this.#size = size;
    this.#rept = rept;
    this.#img = img;
  }
  set posy(y) {
    this.#pos.y = y;
  }
  dispCoins(x) {
    for (let i=0; i<this.#rept; i++) {
      image(img[x[i]], this.#pos.x[i], this.#pos.y, this.#size, this.#size);
    }
  }
}

/** =====================================================
 *  コイン表示＋ラインプロットクラス定義（コイン1枚のみ）
 *  1枚のコインを用意し、指定されたデータ通りに描画する。データ管理はしない。
 *  new myCoinLine (x, y, w, h, size, ymax, iter, rvname)
 *    引数： x,y,w,h : 表示領域、size : コイン画像サイズ
 *    ymax : Y軸最大値（=1）、iter : 繰り返し回数、 rvname : 確率変数名
 *  dispData(x) : データxを受け取ってコインとラインプロットを描画
 *  dispStat()  : 統計量を表示
 */
class myCoinLinePlot {
  #cv;
  #margin;
  #cbase;   // コイン表示領域
  #gbase;   // ライン表示領域
  #step;    // XY各軸の幅単位
  #size;
  #img;
  #data;
  #counter;
  #ymax;
  #iter;
  constructor(x, y, w, h, size, ymax, iter, rvname) {
    this.#margin = {
      inner : 5,      // 指定された領域の内側、何も表示しない領域
      ctoc  : 2,      // コインどうしの間隔
      names : (w - 5*4 - (size+2)*10) / 2,  // 名前表示のための領域
      stats : (w - 5*4 - size*10) / 2,      // ラインプロット統計量のための領域
      axis  : 10,     // ラインプロットのY軸目盛り
    };
    this.#cv = {
      x : x + this.#margin.inner,
      y : y + this.#margin.inner,
      w : w - this.#margin.inner * 2,
      h : h - this.#margin.inner * 2,
    };
    this.#cbase = {
      x : this.#cv.x + this.#margin.names + this.#margin.axis,
      y : this.#cv.y,
      w : this.#cv.w - this.#margin.names - this.#margin.axis,
      h : size,
    };
    this.#gbase = {
      x : this.#cbase.x,
      y : this.#cv.y + this.#cbase.h + this.#margin.inner,
      w : this.#cbase.w - this.#margin.stats,
      h : this.#cv.h - this.#cbase.h - this.#margin.inner*2,
      f : this.#cv.y + this.#cv.h - this.#margin.inner,
    };
    this.#step = {
      x : iter <= 10 ? size + this.#margin.ctoc : this.#gbase.w / iter,
      y : (this.#gbase.h - this.#margin.inner * 2) / ymax * (-1),
    };
    this.#size = size;  // 横幅がはみ出す想定をしていないことに注意！！
    this.#img = img;    // 画像を高域変数 img プリロードしておくこと！
    this.#data = [];
    this.#counter = new Array(ymax+1).fill(0);
    this.#iter = iter;
    this.#ymax = ymax;
    this.#drawInterior(x, y, w, h, rvname);
    //console.log(this.#cbase);
    //console.log(this.#gbase);
    //console.log(this.#step);
    //console.log(this.#ymax);
  }
  set iter(n) {
    this.#iter = n;
    this.#step.x = (n <= 10 ? this.#size + this.#margin.ctoc : this.#gbase.w / n);
  }
  #drawInterior (x, y, w, h, rvname) {
    push();
    stroke(90);
    strokeWeight(1);
    fill(253);
    rect(x, y, w, h);
    // rvnames 表示部分
    fill(0);
    textSize(16);
    textAlign(CENTER, CENTER);
    text(rvname, this.#cv.x + this.#margin.names / 2, this.#cv.y + this.#cv.h / 2);
    // XY軸表示部分
    noFill();
    strokeWeight(0.5);
    stroke(160);
    for (let i=0; i<=this.#ymax; i++){
      line(this.#gbase.x, this.#gbase.f + this.#step.y * i, 
           this.#gbase.x + this.#gbase.w, this.#gbase.f + this.#step.y * i);
    }
    fill(0);
    noStroke();
    textSize(12);
    textAlign(RIGHT, CENTER);
    for (let i=0; i<=this.#ymax; i++){
      text(`${i} `, this.#gbase.x - 2, this.#gbase.f + this.#step.y * i);
    }
    pop();
  }
  // --- データを受け取って描画
  addData (x) {
    const n = this.#data.length % 10;
    const index = this.#data.length;
    const x0 = index>0 ? this.#data.at(-1) : -1;
    // n == 0 のときコイン画像を薄く消す
    if (n==0) {
      push();
      fill(255, 192);
      noStroke();
      rect(this.#cbase.x, this.#cbase.y, this.#cbase.w, this.#cbase.h);
      pop();
    }
    // 2値のときは画像、そうでないときは値丸囲み
    if (this.#ymax < 2) {
      image(img[x], this.#cbase.x + (this.#size + this.#margin.ctoc) * n, 
      this.#cbase.y, this.#size, this.#size);
    } else {
      push();
      fill('lightyellow');
      stroke('orange');
      strokeWeight(3);
      circle(this.#cbase.x + (this.#size + this.#margin.ctoc) * n + this.#size / 2, 
             this.#cbase.y + this.#size / 2, this.#size - this.#margin.inner);
      textAlign(CENTER, CENTER);
      textSize(20);
      fill('maroon');
      noStroke();
      text(x, this.#cbase.x + (this.#size + this.#margin.ctoc) * n + this.#size / 2, 
      this.#cbase.y + this.#size / 2);
      pop();
    }
    this.#data.push(x);
    this.#counter[x]++;
    push();
    strokeWeight(5);
    stroke('red');
    point(this.#gbase.x + this.#step.x * index + (this.#iter<=10 ? this.#size/2 : 0), 
          this.#gbase.f + this.#step.y * x );
    if (index > 0) {
      strokeWeight(0.1);
      line(this.#gbase.x + this.#step.x * index + (this.#iter<=10 ? this.#size/2 : 0), 
           this.#gbase.f + this.#step.y * x,
           this.#gbase.x + this.#step.x * (index-1)+ (this.#iter<=10 ? this.#size/2: 0), 
           this.#gbase.f + this.#step.y * x0 );

    }
    pop();
  }
  // --- 統計量を計算して描画
  dispStat() {
    push();
    fill(0);
    textSize(12);
    textAlign(LEFT, CENTER);
    for (let i=0; i<=this.#ymax; i++) {
      const sstr = this.#counter[i] + `  (${(this.#counter[i] * 100 / this.#iter).toFixed(1)} %)` 
      text(sstr, 
           this.#gbase.x + this.#gbase.w + this.#margin.inner, 
           this.#gbase.f + this.#step.y * i);
    }
    pop();
  }
}


/** =====================================================
 *  ボタンの動作設定と制御
 */
const btnTest  = document.querySelector('#btn_test');
const btnStart = document.querySelector('#btn_start');
const btnReset = document.querySelector('#btn_reset');

btnTest.addEventListener('click', function(){
  // 10回だけ実行して表示する
  btnStart.disabled = true;
  userRvIter = 10;
  preStart();
});
btnStart.addEventListener('click', function(){
  // 10回実行して表示する、を繰り返す
  btnTest.disabled = true;
  userRvIter = ctlRvIter.value * 1;
  preStart();
});
btnReset.addEventListener('click', () => { window.location.reload() });

function resetButtons() {
  btnTest.disabled = false;
  btnStart.disabled = false;
  btnReset.disabled = false;
  ctlRvIter.disabled = false;
}
const preStart = () => {
  ctlRvIter.disabled = true;
  initCanvas();
  if (userRvIter > 100) frameRate(10);
  else if (userRvIter > 200) frameRate(16);
  else if (userRvIter > 300) frameRate(24);
  trials = 0;
  loopOn = true;
  loop();
}


/** =====================================================
 *  HTML 上の設定変更とそれにともなうイベント
 */
//const ctlRvNumber = document.querySelector('#rvnumber');
const ctlRvIter   = document.querySelector('#rviter');
//const chkRvSum    = document.querySelector('#rvsum');
//const chkRvMean   = document.querySelector('#rvmean');

//ctlRvNumber.addEventListener('change', readHtmlSettings);
ctlRvIter.addEventListener('change', readHtmlSettings);
//chkRvSum.addEventListener('change', readHtmlSettings);
//chkRvMean.addEventListener('change', readHtmlSettings);

// HTML初期設定を読み込む：すべての設定変更はこの関数に行き着く
function readHtmlSettings() {
//  userVarNumber = ctlRvNumber.value * 1;
//  userRvIter = ctlRvIter.value * 1;
//  rvOption.sum = chkRvSum.checked ? 1: 0;
//  rvOption.mean = chkRvMean.checked ? 1: 0;
  userRvNumber = 2;
  rvOption = {sum : true, mean : false, };
//  console.log(userRvIter);
//  console.log(rvOption);
  initCanvas();
}

/** =====================================================
 *  初期化関数
 */
// 画像のプリロード この関数で画像をロードしておかないと表示されない
function preload() {  
  img = new Array(2);
  img[0] = loadImage('img/bit0.png');
  img[1] = loadImage('img/bit1.png');
}
// セットアップ
function setup() {
  // 高域変数の固定
  userRvProb = 0.5;
  userRvNumber = 2;
  userFramerate = 8;
  // ランダムシード
  frameRate(userFramerate);
  // HTML上の設定を読む
  readHtmlSettings();

//  let CL = new myCoinLinePlot(50, 0, 800, 120, 50, 1, 10, 'X[1]');
//  for (let i=0; i<10; i++) {
//    CL.addData(random([0,1]));
//  }
//  CL.dispStat();

  loopOn = false;
  noLoop();
}
/** =====================================================
 *  画面の再初期化
 */
// キャンバスの再設定 HTMLで設定を変更するたびに呼ばれる
function initCanvas() {
  // 確率変数の数に応じてキャンバスの高さを変更
  canvasHeight = clsHeight.margin + clsHeight.coin * userRvNumber + 
                 clsHeight.sum * rvOption.sum + clsHeight.mean * rvOption.mean + 20;
  // キャンバス作成
  canvas = createCanvas(canvasWidth, canvasHeight);
  canvas.parent(document.getElementById('p5'));
  background(canvas_background);
  // クラスインスタンスの作成
  clsCoinLine = new Array(userRvNumber);
  let y = clsHeight.margin;
  const xleft = 10;
  for (let i=0; i<userRvNumber; i++) {
    clsCoinLine[i] = new myCoinLinePlot(xleft, y, clsWidth, clsHeight.coin, 
      rvSize, 1, 10, `X_${i+1}`);
    clsCoinLine[i].iter = userRvIter;
    y += clsHeight.coin
  }
  if (rvOption.sum) {
    y += 10;
    clsLinePlotSum = new myCoinLinePlot(xleft, y, clsWidth, clsHeight.sum, 
      rvSize, userRvNumber, 10, 'X_iの和');
    clsLinePlotSum.iter = userRvIter;
    y += clsHeight.sum;
  }
  if (rvOption.mean) {
    y += 10;
    clsLinePlotMean = new myCoinLinePlot(xleft, y, clsWidth, clsHeight.mean, 
      rvSize, userRvNumber, 10, 'X_iの平均');
    clsLinePlotMean.iter = userRvIter;
  }

}

/** =====================================================
 *  確率変数の動作と表示
 */
// 確率変数の新しい実現値を得る。指定された回数分の配列を返す
const newValue = () => {
  return random(0, 1) < userRvProb ? 1 : 0;
}

/** 
 *  描画関数
 ===================================================== */
function draw() {
  if (loopOn) {
    let s = 0;
    for (let i=0; i<userRvNumber; i++) {
      const x = newValue();
      s += x;
      clsCoinLine[i].addData(x);
    }
    clsLinePlotSum.addData(s);
    
    trials++;
    if (trials % 10==0) {
      push();
      noStroke();
      fill(canvas_background);
      rect(0, 0, canvasWidth, clsHeight.margin-1);
      fill(0);
      textSize(15);
      textAlign(RIGHT, TOP);
      text(`${trials} / ${userRvIter}  `, canvasWidth, 0);
      pop();
    }
    if (trials>=userRvIter) {
      //dispResult();
      //userManMode = true;
      for (let i=0; i<userRvNumber; i++) {
        clsCoinLine[i].dispStat();
      }
      clsLinePlotSum.dispStat();
      loopOn = false;
      noLoop();
      //resetButtons();
    }
  }
}

