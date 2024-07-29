//
// 確率変数 ぷるぷるちゃん
// Random Variables 'Puru-puru chan!'
// rv.js
//

const DISP_SIZE = 10; // 最新のデータだけを表示する
const FRAME_RATE = 10;
let xs = [];
let index = 0;
let data = []; // 蓄積していくデータ
let dispdata = []; // 表示するデータ

// キャンバスサイズと色
const canvas_width = 120;
const canvas_height = 150;
const canvas_background = 224;
// 乱数データ表示領域と色
const draw_top = 50;
const draw_left = 0;
const draw_width = 500;
const draw_height = 50;

// ぷるぷるちゃん表示領域
const rv_width = 100;
const rv_height = 100;
const rv_left = 10; // この2つは暫定値
const rv_top = 10;
const rv_background = 255;
// 顔の大きさ
const face_width = rv_width * 0.85;
const face_height = rv_height * 0.85;
const face_left = rv_left + (rv_width - face_width) / 2;
const face_top = rv_top + (rv_height - face_height) / 2;
const face_round = 10; // アール
const face_linewidth = 2;
//const face_linecolor = '08f';直接指定
//const face_background = '8ff';直接指定
// バープロット表示領域：ぷるぷるちゃんの中央90％×40％
const plot_width = face_width * 0.9;
const plot_height = face_height * 0.45;
const plot_left = face_left + (face_width - plot_width) / 2;
const plot_top = face_top + plot_height * 0.2;
// 現在の値表示位置：中央揃え
const number_left = face_left + face_width / 2;
const number_top = face_top + face_height * 0.6;
const number_textsize = 18; // 文字の大きさは暫定
const number_color = 0;
// 確率の表示
const prob_left = number_left;
const prob_top = number_top + 20;
const prob_textsize = 12;
const prob_color = 0;

// 分布指定
let distribution = 0;
// 分布パラメータ
let mu = 0;
let sigma = 1;
// 表示用の線形変換
let disp_mu = plot_width / 2;
let disp_sigma = plot_width / 5;

// 初期化関数
function setup() {
  //let canvas = createCanvas(canvas_width, canvas_height);
  //let container = document.getElementById('prpr1');
  //canvas.parent(container);
  createCanvas(canvas_width, canvas_height);
  frameRate(FRAME_RATE);
  initCanvas();

  //noLoop();
}

// HTMLからの制御のための関数
function initCanvas() {
  background(canvas_background);
  // 最低限必要な乱数を先に作っておくと待ち時間がない
  for (let i = 0; i < DISP_SIZE; i++) makeNewData();
}
function stopLoop() {
  noLoop();
}
function moveLoop() {
  loop();
}
function initArray() {
  data = [];
  dispdata = [];
}

// 乱数生成関数
function makeNewData() {
  // 当面、標準正規分布乱数のみ
  data.push(randomGaussian());
}

function drawFace() {
  // 横軸方向のゆらぎ
  let x_jit = randomGaussian() * rv_left * 0.2;
  let y_jit = randomGaussian() * rv_top * 0.2;
  // 縦軸方向のゆらぎ
  let x_sign = round(random(0, 1)) ? 1 : -1;
  let y_sign = round(random(0, 1)) ? 1 : -1;

  // 顔の背景を消す
  fill(rv_background);
  noStroke();
  rect(rv_left, rv_top, rv_width, rv_height);

  // 顔を描く
  strokeWeight(face_linewidth);
  stroke(0, 127, 255);
  fill(128, 255, 255);
  rect(face_left + x_sign * x_jit, face_top + y_sign * y_jit, face_width, face_height, face_round);
}

// 最新（最初の方）のDISP_SIZE個を表示する
function drawData() {
  textAlign(CENTER, TOP);
  textSize(number_textsize);
  // 表示させたい部分を切り取ってきて
  let d = data.slice(data.length - DISP_SIZE);
  for (let i in d) {
    // もとデータをテキストにしておいて
    let t = nfc(d[i], 2);
    // 古いデータほど細く薄くして
    strokeWeight(i * 0.5);
    if (i == DISP_SIZE - 1) {
      stroke('red');
    } else {
      stroke(220 - i * 20);
    }
    noFill();
    // 線形変換した位置に縦線を引き、
    let x = d[i] * disp_sigma + disp_mu;
    line(plot_left + x, plot_top, plot_left + x, plot_top + plot_height);
    if (i == DISP_SIZE - 1) {
      // 線の下に数値を表示する
      noStroke();
      fill(number_color);
      text(t, number_left, number_top);
      // 確率
      textSize(prob_textsize);
      let prob_str = nfc((pnorm(Math.abs(d[i])) - 0.5) * 2,2 );
      text(prob_str, prob_left, prob_top);
    }
  }
}

function draw() {
  // 前のやつを全部消してから
  strokeWeight(1);
  fill(canvas_background);
  rect(0, 0, canvas_width - 1, canvas_height - 1);

  // 新しいデータを追加して
  makeNewData(); //すでにDISP_SIZEだけ作ってある
  // 新しい方からDISP_SIZE個だけを描画する
  drawFace();
  drawData();

  if (data.length > 100) noLoop();
}

function pnorm(x) {
  // https://www.marketechlabo.com/normal-distribution-javascript/
  // http://www.kogures.com/hitoshi/javascript/mathlib/index.html
  const pn_p = 0.2316419;
  const pn_b1 = 0.31938153;
  const pn_b2 = -0.356563782;
  const pn_b3 = 1.781477937;
  const pn_b4 = -1.821255978;
  const pn_b5 = 1.330274429;

  const t = 1 / (1 + pn_p * Math.abs(x));
  const Z = Math.exp((-x * x) / 2) / Math.sqrt(2 * Math.PI);
  const y = 1 - Z * ((((pn_b5 * t + pn_b4) * t + pn_b3) * t + pn_b2) * t + pn_b1) * t;

  return x > 0 ? y : 1 - y;
}
