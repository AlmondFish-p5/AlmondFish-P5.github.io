/** 
 *  回帰直線当てはめゲーム
 *  regression.js
 */


/** ===================================================
 *  広域変数設定
 */
// 回帰クラス
let Reg;
// 回帰係数クラス
let User;

// クリップボード
new ClipboardJS('.copybutton');

// HTMLから設定する変数
let userSampleSize;

// その他の広域変数
let canvas;
const canvas_width  = 600;
const canvas_height = 500;
const canvas_background = 240;

// 画面表示のための固定パラメータ
const defParameter = { 
  mu    : 10,
  sigma : 3,
};
// 画面表示のためのスケール設定
let defDataRange = {
  x : {min:0, max:0, range:0},
  y : {min:0, max:0, range:0},
}

// 座標軸設定のための広域変数
let cvCrd = {
  origin: {x:0, y:0},
  scale: {x:0, y:0}
};
const axisColor = 'darkgrey';   // 座標軸と目盛りの表示色
const plotColor = 'crimson';    // データ点プロットの色
const legendColor = ['crimson', 'blue'];    // 凡例および回帰式の色
const lineColor = ['red','blue'];
const legendTextsize = [18, 16];

/**
 *  回帰係数クラス myRegCoef
 *  constructor
 *  parameter     intercept(set c0, get)  切片の設定と取得
 *                slope(set c0, get) 傾きの設定と取得
 *                cor(set c0, get) 相関係数の設定と取得
 *                coef(get obj) {intercept, slope} 回帰係数の取得
 *                eqstr(get str) 回帰式の取得
 *  method        hatY(num x0) x0に対する予測値を返す
 ======================================================= */
class myRegCoef {
  #intercept;
  #slope;
  #cor;
  constructor() {
    this.#intercept = 0;
    this.#slope = 0;
  }
  set intercept(c0) {
    this.#intercept = c0;
  }
  set slope(c0) {
    this.#slope = c0;
  }
  set cor(c0) {
    this.#cor = c0;
  }
  get coef() {
    return {intercept: this.#intercept, slope: this.#slope, };
  }
  get intercept() {
    return this.#intercept;
  }
  get slope() {
    return this.#slope;
  }
  get cor() {
    return this.#cor;
  }
  get eqstr() {
    return (`^y = ${this.#intercept.toFixed(2)} + ${this.#slope.toFixed(2)} x`);
  }
  // Y予測値を返す
  hatY(x0) {
    return this.#intercept + x0 * this.#slope;
  }
}

/**
 *  回帰クラス myRegression
 *  constructor 
 *  get         eqstr()           回帰式文字列 str
 *              rangeX(), rangeY  X,Yレンジ {min, max}
 *              dataX(),dataY     X,Yデータ num
 *  method      makeRandomData(r 相関, mu 平均, sigma 分散, size 標本サイズ)
 *              hatY(x0)  num x0 に対する予測値 num
 ======================================================= */
class myRegression {
  //フィールド変数
  #reg;
  #stat;
  #data;
  // コンストラクタ
  constructor() {
    this.#reg = new myRegCoef();
    this.#data = {
      x : [],
      y : [],
    };
    this.#stat = {
      mean : {x:0, y:0, },
      cov  : {x2:0, y2:0, xy:0, },
      cor  : 0,
    };
  }
  // セッター、ゲッター
  // -------------- 回帰式文字列を返す
  get eqstr() {
    return this.#reg.eqstr;
  }
  // -------------- Xのレンジを返す
  get rangeX() {
    return {min: min(this.#data.x), max: max(this.#data.x), };
  }
  // -------------- Yのレンジを返す
  get rangeY() {
    return {min: min(this.#data.y), max: max(this.#data.y)};
  }
  // -------------- データを返す
  get dataX() {
    return this.#data.x;
  }
  get dataY() {
    return this.#data.y;
  }
  // 内部関数
  #calc_mean(x)         //------- 平均を計算する
  {
    let s = 0;
    x.forEach((value) => { s+= value; });
    return (s / x.length);
  }
  #calc_variance(x, y)   //------- 分散・共分散を計算する
  {
    const mx = this.#calc_mean(x);
    const my = this.#calc_mean(y);
    let s = 0;
    for (let i=0; i<x.length; i++) {
      s += (x[i]-mx) * (y[i]-my);
    }
    return (s / x.length);
  }
  // --------------- 乱数データを作成する：引数として相関係数を受け取る
  makeRandomData(r, mu, sigma, size) {
    // 乱数データを作成する：相関をもつデータ(Y)はKosugi, et.al. 2023 による
    for (let i=0; i<size; i++) {
      this.#data.x[i] = randomGaussian(0, 1);
      this.#data.y[i] = this.#data.x[i] * r + randomGaussian(0, Math.sqrt(1-r**2));
    }
    // 表示範囲に合わせて線形変換する
    this.#data.x = this.#data.x.map((value) => {
      return round(value * sigma + mu, 2);
    });
    this.#data.y = this.#data.y.map((value) => {
      return round(value * sigma + mu, 2);
    });
    // 平均値、分散、共分散を計算する
    this.#stat.mean.x = this.#calc_mean(this.#data.x);
    this.#stat.mean.y = this.#calc_mean(this.#data.y);
    this.#stat.cov.x2 = this.#calc_variance(this.#data.x, this.#data.x);
    this.#stat.cov.y2 = this.#calc_variance(this.#data.y, this.#data.y);
    this.#stat.cov.xy = this.#calc_variance(this.#data.x, this.#data.y);
    // 相関係数、回帰係数を計算する
    // r = cov_xy / sd_x * sd_y
    // slope = cov_xy / var_x
    // intercept = \bar{y} - \bar{x} * slope
    this.#stat.cor = this.#stat.cov.xy / (Math.sqrt(this.#stat.cov.x2) * Math.sqrt(this.#stat.cov.y2));
    this.#reg.cor = this.#stat.cor;
    this.#reg.slope = this.#stat.cov.xy / this.#stat.cov.x2;
    this.#reg.intercept = this.#stat.mean.y - this.#reg.slope * this.#stat.mean.x;
  }
  // Y予測値を返す
  hatY(x0) {
    return this.#reg.intercept + x0 * this.#reg.slope;
  }
}


/** ===================================================
 *  オブジェクトの設定
 */
// 初期値 function regVal(typeStr) --> new myRegression();
// 回帰式を文字列で返す regVal.prototype.equation --> myRegression.eqstr;
// 初期化 regVal.prototype.initialize --> myRegression.makeRandomData();

/** ===================================================
 *  HTML設定の読み込みと広域変数の設定
 */
// 予想関連のボタンを隠しておく
window.addEventListener('load', () => {
  document.querySelector('#estimate').style.display = 'none';
});
// プロット描画ボタン：ボタンが押されるまで何も描画しない
document.querySelector('#btn_draw').addEventListener('click', ()=>{
  document.querySelector('#estimate').style.display = 'block';
  userSampleSize = document.querySelector('#user_datanumber').value * 1;
  document.querySelector('#user_datanumber').disabled = true;
  document.querySelector('#btn_draw').disabled = true;
  makeInitialSetting();
  reDraw();
});
// リセットボタン
document.querySelector('#btn_reset').addEventListener('click', ()=>{
  window.location.reload();
})
// 回帰係数の予測値の変更感知＋再描画
document.querySelector('#user_intercept').addEventListener('change', () =>{
  User.intercept = document.querySelector('#user_intercept').value * 1;
  reDraw();
});
document.querySelector('#user_slope').addEventListener('change', ()=>{
  User.slope = document.querySelector('#user_slope').value * 1;
  reDraw();
});
// 判定ボタン
document.querySelector('#btn_judge').addEventListener('click', ()=>{
  addAnswer();
  document.querySelector('#user_intercept').disabled = true;
  document.querySelector('#user_slope').disabled = true;
  document.querySelector('#btn_judge').disabled = true;
  noLoop();
});


/** 
 *  初期化関数
 =================================================== */
function setup() {
  canvas = createCanvas(canvas_width, canvas_height);
  canvas.parent(document.getElementById('p5'));
  background(canvas_background);
  noLoop();
}

// 表示用のデータを作る
function makeInitialSetting() {
  // 相関係数をランダムに決める
  const tmp_cor = round(random(0.1,0.6), 3);
  
  // クラスインスタンスの作成と初期設定
  Reg = new myRegression();
  Reg.makeRandomData(tmp_cor, defParameter.mu, defParameter.sigma, userSampleSize);
  console.log(Reg);
  User = new myRegCoef();
  User.intercept = document.querySelector('#user_intercept').value * 1;
  User.slope = document.querySelector('#user_slope').value * 1;
  
 // データ範囲の設定
  const xr = Reg.rangeX;
  const yr = Reg.rangeY;
  defDataRange.x.min = Math.floor(xr.min) - 2;
  defDataRange.x.max = Math.ceil(xr.max) + 2;
  defDataRange.x.range = defDataRange.x.max - defDataRange.x.min;
  defDataRange.y.min = Math.floor(yr.min) - 2;
  defDataRange.y.max = Math.ceil(yr.max) + 2;
  defDataRange.y.range = defDataRange.y.max - defDataRange.y.min;
//  console.log(defDataRange);
}

/** 
 *  描画関連関数
 =================================================== */
 // ----- 変数の値を座標に変換
function cvd(dx, dy) {
  const x = cvCrd.origin.x + cvCrd.scale.x * (dx - defDataRange.x.min);
  const y = cvCrd.origin.y - cvCrd.scale.y * (dy - defDataRange.y.min);
  return {x, y};
}

// 座標軸の設定と軸の描画
function setCoordinate() { 
  cvCrd.origin.x = 30;
  cvCrd.origin.y = canvas_height - 30;
  cvCrd.scale.x = (canvas_width - 30) / defDataRange.x.range;
  cvCrd.scale.y = (canvas_height - 30) / defDataRange.y.range;
  // 座標軸を引く
  stroke(axisColor);
  strokeWeight(1);
  line(0, cvCrd.origin.y, width, cvCrd.origin.y);
  line(cvCrd.origin.x, 0, cvCrd.origin.x, height);
  // 目盛りをつける：5の倍数のみ
  noStroke();
  fill(axisColor);
  textAlign(CENTER, BASELINE);
  textSize(12);
  for (let x=round(defDataRange.x.min); x<=defDataRange.x.max; x++) { // x軸
    if (x % 5==0) text(x, cvd(x,0).x, cvCrd.origin.y+20);
  }
  textAlign(RIGHT, BASELINE);
  for (let y=round(defDataRange.y.min); y<=defDataRange.y.max; y++) { // x軸
    if (y % 5==0) text(y, cvCrd.origin.x-5, cvd(0,y).y);
  }
}

// 乱数データをプロットする
function plotData() {
  stroke(plotColor);
  strokeWeight(5);
  const dx = Reg.dataX;
  const dy = Reg.dataY;
  for (let i=0; i<userSampleSize; i++) {
    let p = cvd(dx[i], dy[i]);
    point(p.x, p.y);
  }
}

/**
 *  回帰係数計算関連：
 *     以下、user=true 画面上でユーザが指定した係数による
 *          user=false 正解の係数による
 * ----------------------------------------------------- */
// 回帰予測値を計算
function calcHatY(x, user=false) {
  return (user ? User.hatY(x) : Reg.hatY(x));
}

// 回帰直線の描画 user=true でユーザ指定の値を使う user=false で正解を使う
function drawRegLine(user=false) {
  // 回帰直線
  stroke(lineColor[user*1]);
  strokeWeight(2);
  let start = cvd(defDataRange.x.min, calcHatY(defDataRange.x.min, user));
  let end = cvd(defDataRange.x.max, calcHatY(defDataRange.x.max, user));
  line(start.x, start.y, end.x, end.y);
}

// ----- 回帰式と残差平方和の描画
function drawRegEquation(user=false) {
  // 回帰式
  fill(legendColor[user*1]);
  textSize(legendTextsize[user*1]);
  noStroke();
  let eq = {x:0, y:0};
  const eq_x = (user ? defDataRange.x.min+1 : defDataRange.x.max-1);
  const eq_y = defDataRange.y.min + (defDataRange.y.max - defDataRange.y.min) * (user ? 0.7 : 0.3);
  eq = cvd(eq_x, eq_y);
  const ttl = (user ? 'あなたの予測' : '最小二乗法予測') + '\n';
  const eqs = user ? User.eqstr : Reg.eqstr;
  const sse = '\n残差平方和='+calcSumSquareDeviation(user);
  textAlign(user ? LEFT : RIGHT, BASELINE);
  text(ttl + eqs + sse, eq.x, eq.y);
}
// ----- 残差平方和を計算する
function calcSumSquareDeviation(user=false) {
  let ssd = 0;
  const dx = Reg.dataX;
  const dy = Reg.dataY;
  for (let i=0; i<userSampleSize; i++) {
    ssd += (dy[i] - calcHatY(dx[i], user)) ** 2;
  }
  return round(ssd,2);
}

/** ===================================================
 * 描画関数
 */
function draw() {
  noLoop();
}
// ----- 描画し直す
function reDraw() {
  background(240);
  setCoordinate();
  plotData();
  drawRegLine(true);
}
// ----- 回答を描画する
function addAnswer() {
  drawRegLine(false);
  drawRegEquation(false);
  drawRegEquation(true);
  dispRawData();
}

// ローデータを提供する
function dispRawData() {
  const dx = Reg.dataX;
  const dy = Reg.dataY;
  let df = [];
  let script = [];
  let result = '';
  df.push('x, y');
  for (let i=0; i<userSampleSize; i++) {
    df.push(`${dx[i]}, ${dy[i]}`);
  }
  script.push('## 回帰係数の計算');
  script.push('df <- read.csv("data.csv")');
  script.push('head(df)');
  script.push('result <- lm(y ~ x, data=df)');
  script.push('# Coefficients Estimate が回帰係数');
  script.push('summary(result)');
  script.push('# Sum of Squares / Residuals が残差平方和');
  script.push('aov(result)');
  script.push('# プロットして回帰直線を描く');
  script.push('plot(y ~ x, data=df)');
  script.push('abline(result, col="red")');

  result += '<h3>Raw Data</h3>';
  result += '<p><textarea rows="6" cols="70" id="raw_data">' + df.join('\n') + '</textarea>';
  result += '<button class="copybutton" data-clipboard-target="#raw_data">Copy Raw Data</button></p>';
  result += '<h3>R Script</h3>';
  result += '<p><textarea rows="6" cols="70" id="r_script">' + script.join('\n') + '</textarea>';
  result += '<button class="copybutton" data-clipboard-target="#r_script">Copy R Script</button></p>';

  document.querySelector('#result').innerHTML = result;
}
