// =========================================
// 偏差値の表示
//  テストの平均点と標準偏差を入力させて、それに対応した正規分布曲線を描く。
//  個人得点を入力させて、上記の分布に対応した標準得点と偏差値を表示する。
//  個人得点を複数入力できるようにし、個人間比較ができるようにする。
// =========================================
// dev_val_a01.js
//

// 最初の表示であることを示すフラグ
let theFirstTime = true;

// キャンバスの設定
const canvas_width = 600;
const canvas_height = 450;
const canvas_background = 224;

// 分布曲線の表示位置
const xline_left = 50;
const xline_width = 500;
const xline_height = 320;

// 水平軸の位置
const xline_floor = 340;
const index_y = 345; // 目盛り表示位置
const face_y = 365;  // 顔アイコン表示位置

// 広域宣言変数：HTMLに値を反映する、HTMLの入力を反映する
let mu = 50;             // 平均値
let sigma = 10;          // 標準偏差
let personal_point = 50; // 個人得点
let personal_icon = '🐼';   // 個人アイコン

// 正規分布曲線を描く範囲の設定
const x_min = 0;
const x_max = 100;
const array_size = (x_max - x_min) * 10 + 1; //[x_min, x_max]
let scale_x;
let scale_y;

// 正規分布曲線を描くためのベクトル
let x_values = [];
let norm_density = [];
let x_pos = [];
let y_pos = [];

// =========================================
// 入力ボックスの内容が更新されたときの処理
document.getElementById('test_mu').onchange = function(){
  // 変数の数を取得する
  mu = document.getElementById('test_mu').value * 1;
  //console.log('HTMLから値の取得：平均点 = '+mu);
  reDraw();
}
document.getElementById('test_sigma').onchange = function(){
  // 変数の数を取得する
  sigma = document.getElementById('test_sigma').value * 1;
  //console.log('HTMLから値の取得：標準偏差 = '+sigma);
  reDraw();
}
document.getElementById('test_point').onchange = function(){
  // 変数の数を取得する
  personal_point = document.getElementById('test_point').value * 1;
  //console.log('HTMLから値の取得：個人得点 = '+personal_point);
  reDraw();
}
document.getElementById('my_icon').onchange = function() {
  personal_icon = document.getElementById('my_icon').value;
  //console.log('HTMLから値の取得：個人アイコン = '+personal_icon);
  reDraw();
}

// 初期化関数
function setup() {
  createCanvas(canvas_width, canvas_height);
}

// 処理0 初期値をランダムに決めてHTMLに書き戻す
function setInitialValue() {
  // 初期値をランダムに決めてHTMLに書き戻す
  //console.log('初期値をランダムに決めてHTMLに書き戻す');
  if (theFirstTime) {
    theFirstTime = false;
    // 平均点
    mu = round(random() * 30 + 50, 0);
    document.getElementById('test_mu').value = mu;
    //console.log('平均点初期値 = '+mu+' 書き戻し');
    // 標準偏差
    sigma = round(random() * 5 + 10, 0);
    document.getElementById('test_sigma').value = sigma;
    //console.log('標準偏差初期値 = '+sigma+' 書き戻し');
    // 個人得点
    personal_point = round(random() * 10 + 60, 0);
    document.getElementById('test_point').value = personal_point;
    //console.log('個人得点初期値 = '+personal_point+' 書き戻し');
    reDraw();
  }
}

// 処理1 平均値と標準偏差を用いて正規分布曲線を描く
// mu, sigma : 広域変数
function drawGraph() {
  //console.log('処理1 平均値と標準偏差を用いて正規分布曲線を描く');
  //console.log('1.1 正規分布関数表の作成');
  setNorm();
  //console.log('1.2 正規分布曲線を描く');
  drawNormCurve();
}

// Called from 1.1:正規分布：確率密度関数 p = pNormalDist(x, mu, sigma)
// http://www.kogures.com/hitoshi/javascript/mathlib/index.html
// 平均mu、標準偏差sigmaの正規分布において、値xの確率密度関数の値pを返す
function pNormalDist(x, mu=0, sigma=1) {
    let sigma2 = sigma*sigma;
    return  Math.exp(-(x-mu)*(x-mu)/(2*sigma2))/Math.sqrt(2*Math.PI*sigma2);
}

// Called from 2 正規分布：累積確率関数 p = sNormalDistStd(x)
// http://www.kogures.com/hitoshi/javascript/mathlib/index.html
// 標準正規分布に対応したものしか公開されていないので、zを渡して計算する
function sNormalDistStd(x) {
    var b0 =  0.2316419;
    var b1 =  0.31938153;
    var b2 = -0.356563782;
    var b3 =  1.781477937;
    var b4 = -1.821255978;
    var b5 =  1.330274429;
    var t = 1 / (1 + b0 * Math.abs(x));
    var z01 = Math.exp(-x*x/2) / Math.sqrt(2 * Math.PI);
    var s = 1 - z01 * ((((b5 * t + b4) * t + b3) * t + b2) * t + b1) * t;
    if (x > 0) return s;
    else return 1-s;
}

// 1.1 正規分布関数表の作成
function setNorm() {
  // 変数をリセット
  x_values = [];
  norm_density = [];
  x_pos = [];
  y_pos = [];
  
  // 基準になるx値の作成[x_min, x_max](step 0.1)
  x_values = new Array(array_size).fill(0).map((v, i) => round(x_min + i * 0.1, 1));
  // x軸表示位置、確率密度、y軸表示位置
  scale_x = xline_width / 100;
  scale_y = xline_height / pNormalDist(mu, mu, 10);
  for (let i=0; i < array_size; i++) {
    x_pos[i] = xline_left + (x_values[i]-x_values[0]) * scale_x;
    norm_density[i] = pNormalDist(x_values[i], mu, sigma);
    y_pos[i] = xline_floor - norm_density[i] * scale_y;
  }
}

// 1.2:正規分布曲線を描く：線の太さと色は固定
function drawNormCurve() {
  stroke('darkblue');
  strokeWeight(1.5);
  for (let i=1; i<x_pos.length; i++) {
    line(x_pos[i-1], y_pos[i-1], x_pos[i], y_pos[i]);
  }
}

// 処理2 個人得点の位置に縦線を引き、両側確率を表示する
// personal_point : 広域変数
function drawPersonalPoint() {
  //console.log('処理2 個人得点の位置に縦線を引き、両側確率を表示する');
  let myindex = x_values.indexOf(round(personal_point,1));
  //console.log('index = ', myindex);
  //console.log('縦線を表示');
  stroke('red');
  strokeWeight(2);
  line(x_pos[myindex], y_pos[myindex], x_pos[myindex], xline_floor);
  //console.log('両側の確率を表示');
  const p = sNormalDistStd((personal_point-mu)/sigma);
  const p_low = round(p*100, 1) + '% ←';
  const p_high = '→ ' + round((1-p)*100, 1) + '%';
  fill('blue');
  noStroke();
  textSize(14);
  textAlign(RIGHT, BASELINE);
  text(p_low, x_pos[myindex]-5,y_pos[myindex]);
  textAlign(LEFT, BASELINE);
  text(p_high, x_pos[myindex]+5,y_pos[myindex]);
}

// 処理3 水平軸（X軸）を描く：線の太さと色は固定
function drawXline() {
  strokeWeight(1);
  stroke(0);
  line(0, xline_floor, canvas_width, xline_floor);
  noStroke();
  fill(0);
  textAlign(CENTER, TOP);
  textSize(10);
  for (let i=0; i<=10; i++) {
    text(i*10, xline_left + scale_x*i*10, index_y);
  }
}

// 処理4 個人アイコンを描く、個人点数を描く
function drawPersonalMark() {
  noStroke();
  fill('blue');
  textSize(15);
  text(personal_point, xline_left + scale_x*personal_point, face_y+22);
  textAlign(CENTER, TOP);
  textSize(20);
  text(personal_icon, xline_left + scale_x*personal_point, face_y)
}

// 処理5 標準得点と偏差値をHTMLに書き戻す
function writeScores() {
  //console.log('処理5 標準得点と偏差値をHTMLに書き戻す');
  let z = round((personal_point-mu) / sigma,2);
  let d = z * 10 + 50;
  z_text = '(' + personal_point + '－' + mu +') ÷' + sigma + '＝<strong>' + z + '</strong>';
  d_text = z + '×10＋50＝<strong>' + d + '</strong>';
  document.getElementById('z_score').innerHTML = z_text;
  document.getElementById('d_score').innerHTML = d_text;
}

// 再描画関数
function reDraw() {
  //console.log('再描画関数の順次呼び出しをする');
  background(canvas_background);
  // 処理1 平均値と標準偏差を用いて正規分布曲線を描く
  drawGraph();
  // 処理2 個人得点の位置に縦線を引き、両側確率を表示する
  drawPersonalPoint();
  // 処理3 水平軸（X軸）を描く：線の太さと色は固定
  drawXline();
  // 処理4 個人アイコンを描く、個人点数を描く
  drawPersonalMark();
  // 処理5 標準得点と偏差値をHTMLに書き戻す
  writeScores();
}

// 描画ループ関数：再描画を1回だけ呼ぶ
function draw() {
  setInitialValue();
  noLoop();
}

