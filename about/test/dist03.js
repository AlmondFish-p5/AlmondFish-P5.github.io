//
// 確率分布の表示
// dist03.js
//


// HTMLから指定できるパラメータ
let mu = 0;
let sigma = 1;
let x_min = -5;
let x_max =  5;

// =========================================
// 更新ボタンが押されたときの処理
document.getElementById("btn_redraw").onclick = function(){
  // 変数の数を取得する
  mu = document.getElementById('input_mu').value * 1;
  sigma = document.getElementById('input_sigma').value * 1;
  x_min = document.getElementById('input_min').value * 1;
  x_max = document.getElementById('input_max').value * 1;
  
  resetCanvas();
}


// キャンバス
const canvas_width = 800;
const canvas_height = 600;
const canvas_background = 224;
// プロットサイズ
const plot_left = 20;
const plot_height = canvas_height * 0.8;
const plot_width = canvas_width - plot_left * 2;
const plot_floor = canvas_height * 0.9;
// 座標サイズ
let scale_x;
let scale_y;

// 初期化関数
function setup() {
  createCanvas(canvas_width, canvas_height);
  background(canvas_background);

  noLoop();
}

// 正規分布関数表のためのベクトル
let x_values = [];
let norm_density = [];
let x_pos = [];
let y_pos = [];

// 正規分布：確率密度関数 p = pNormalDist(x, mu, sigma)
// http://www.kogures.com/hitoshi/javascript/mathlib/index.html
// 平均μ、標準偏差σの正規分布において、値ｘの確率密度関数の値ｐを戻します。
//   p = 1/√(２πσ2) * e(-(x-μ)2/2σ2)
// μ、σ2を省略すると、μ=0、σ2=1の標準正規分布になります。
function pNormalDist(x, mu=0, sigma=1) {
    let sigma2 = sigma*sigma;
    return  Math.exp(-(x-mu)*(x-mu)/(2*sigma2))/Math.sqrt(2*Math.PI*sigma2);
}

// 正規分布関数表の作成
function setNorm(mu, sigma) {
  // 変数をリセット
  x_values = [];
  norm_density = [];
  x_pos = [];
  y_pos = [];
  
  stroke(0);
  strokeWeight(0.6);
  const arr_size = (x_max - x_min) * 100 + 1;

  // 基準になるx値の作成
  x_values = new Array(arr_size).fill(0).map((v, i) => round(x_min + i * 0.01, 2));
  // x軸表示位置、確率密度、y軸表示位置
  for (i=0; i < arr_size; i++) {
    x_pos[i] = plot_left + (x_values[i]-x_values[0]) * scale_x;
    norm_density[i] = pNormalDist(x_values[i], mu, sigma);
    y_pos[i] = plot_floor - norm_density[i] * scale_y;
  }
}

// 正規分布曲線の描画
function drawNormCurve() {
  for (let i=1; i<x_pos.length; i++) {
    line(x_pos[i-1], y_pos[i-1], x_pos[i], y_pos[i]);
  }
}

// 水平軸（X軸）を描く
function drawXline() {
  strokeWeight(0.5);
  stroke(0);
  line(0, plot_floor, canvas_width, plot_floor);
  noStroke();
  fill(0);
  textAlign(CENTER, TOP);
  textSize(10);
  for (let i=x_min; i<=x_max; i++) {
    text(i, plot_left + scale_x * (i - x_min), plot_floor + 5);
  }
}

function reDraw() {
  setNorm(mu, sigma);
  drawNormCurve();
}

function resetCanvas() {
  background(canvas_background);
  // 座標サイズ
  scale_x = plot_width / (x_max - x_min);
  scale_y = plot_height;
  
  drawXline();
  reDraw();
}

function draw() {
  resetCanvas();
  noLoop();
}

