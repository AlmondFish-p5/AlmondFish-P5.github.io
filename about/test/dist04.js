//
// 確率分布の表示
// dist04.js
//

// 分布パラメータ
const parameter = {
  mu: 0,
  sigma: 1,
  min: -4,
  max: 4
};

// キャンバス
const canvas_width = 800;
const canvas_height = 400;
const canvas_background = 242;
const userFramerate = 60;
// プロットサイズ
const plot_left = 20;
const plot_height = canvas_height * 0.8;
const plot_width = canvas_width - plot_left * 2;
const plot_floor = canvas_height * 0.9;
// 座標サイズ
let scale_x;
let scale_y;
// 正規分布関数表のためのベクトル
let x_values = [];
let y_values = [];
let x_pos = [];
let y_pos = [];
let randomPlot = [];
let index = 0;
const plotColor = ['silver', 'dodgerblue', 'red'];
const plotEach  = [10, 20, 30, 50, 100];
let each = 0;
let plotCount = [0,0,0];

// =========================================
// 更新ボタンが押されたときの処理
document.getElementById("btn_start").onclick = function(){
  // プロット数を取得する
  plotNumber = document.getElementById('plot_number').value * 1;
  document.getElementById("btn_start").disabled = true;
  document.getElementById('plot_number').disabled = true;
  each = 0;
  if (plotNumber >=  5000) each++;
  if (plotNumber >= 10000) each++;
  if (plotNumber >= 15000) each++;
  if (plotNumber >= 25000) each++;
  plotCount = [0,0,0];
  loop();
}

// 初期化関数
function setup() {
  createCanvas(canvas_width, canvas_height);
  background(canvas_background);
  frameRate(userFramerate);
  // 座標サイズ
  scale_x = plot_width / (parameter.max - parameter.min);
  scale_y = plot_height / 0.4;
  drawNormCurve();
  drawOutline();
  draw95Area();
  // ランダムシード
  randomSeed(minute() + second());
  noLoop();
}

/** 
 *  正規分布曲線の描画
 */
// 関数本体：setupからこれだけを呼ぶ
function drawNormCurve() {
  setNorm();
  push();
  strokeWeight(0.5);
  stroke(0);
  drawXline();
  for (let i=1; i<x_pos.length; i++) {
    line(x_pos[i-1], y_pos[i-1], x_pos[i], y_pos[i]);
  }
  pop();
}
// 正規分布：確率密度関数 p = pNormalDist(x, mu, sigma) mu=0, sigma=1 に固定
// http://www.kogures.com/hitoshi/javascript/mathlib/index.html
function pStandardNormalDist(x) {
  return  Math.exp(-(x*x)/2)/Math.sqrt(2*Math.PI);
}
// 正規分布関数表の作成
function setNorm() {
  // 変数をリセット
  x_values = [];
  y_values = [];
  x_pos = [];
  y_pos = [];
  
  const arr_size = 400 + 1;
  // 基準になるx値,y値の作成
  x_values = new Array(arr_size).fill(0).map((v, i) => round(parameter.min + i * 0.02, 2));
  y_values = x_values.map((value, index)=>{return pStandardNormalDist(value);});
  // x軸表示位置、y軸表示位置に変換
  x_pos = x_values.map((value, index)=>{ return cvtx(value); });
  y_pos = y_values.map((value, index)=>{ return cvty(value); });
}
// 値を描画座標に変換する
function cvtx(x0) {
  return ((x0 - (parameter.min)) * scale_x + plot_left);
}
function cvty(y0) {
  return (plot_floor - y0 * scale_y);
}
// 水平軸（X軸）を描く
function drawXline() {
  line(0, plot_floor, canvas_width, plot_floor);
  push();
  noStroke();
  fill(0);
  textAlign(CENTER, TOP);
  textSize(10);
  for (let i=parameter.min; i<=parameter.max; i++) {
    text(i, plot_left + scale_x * (i - parameter.min), plot_floor + 5);
  }
  pop();
}
// 分布曲線を囲む四角形を描く
function drawOutline() {
  push();
  noFill();
  stroke('blue');
  rect(cvtx(-4), cvty(0.4), cvtx(4)-cvtx(-4), cvty(0)-cvty(0.4));
  pop();
}
// 95％範囲の両端に線をひく
function draw95Area() {
  const p = {lower:0, upper:0};
  p.lower = x_values.indexOf(-1.96);
  p.upper = x_values.indexOf( 1.96);
  push();
  strokeWeight(1);
  stroke('red');
  line(x_pos[p.lower], y_pos[p.lower], x_pos[p.lower], plot_floor);
  line(x_pos[p.upper], y_pos[p.upper], x_pos[p.upper], plot_floor);
  pop();
}

// 乱数プロット
function drawPlot() {
  push();
  strokeWeight(3);
  stroke(0);
  for (i=0; i<plotEach[each]; i++) {
    let x = random(-4, 4);
    let y = random(0, 0.4);
    let c = 0;
    if (pStandardNormalDist(x) >= y) {
      c++;
      if (Math.abs(x) <= 1.96) c++;
    }
    stroke(plotColor[c]);
    plotCount[c]++;
    point(cvtx(x), cvty(y));
    index++;
  }
  noStroke();
  fill(canvas_background);
  rect(0, 0, width, 40);
  fill(0);
  textAlign(LEFT, TOP);
  textSize(16);
  text('N = ' + index, 40, 10);
  text('分布曲線内：' + (plotCount[1]+plotCount[2]), 160, 10);
  text('±1.96σ内：' + plotCount[2] + '  （分布曲線内の' + ((plotCount[2]/(plotCount[1]+plotCount[2]))*100).toFixed(2) + '％）', 320, 10);
  pop();
  if (index >= plotNumber) noLoop();
}

function draw() {
  if (isLooping()) {
    drawPlot();
  }
}

