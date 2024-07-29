//
// 確率変数 ぷるぷる
// Random Variables 'Puru-puru'
// rv09.js
//

const DISP_SIZE = 10;
const FRAME_RATE = 10;
const CANVAS_NUMBER = 4;
const DISP_MEAN = 1;

let xs = [];
let index = 0;
let data = []; // 蓄積していくデータ
let dispdata = []; // 表示するデータ

// キャンバスサイズと色
const canvas_width = 300;
const canvas_height = 520;
const canvas_background = 224;

// 表示領域を複数縦に並べるためのマージン
const margin_y = [0, 90, 180, 270, 370];

// ぷるぷるちゃん表示領域
const rv_width = 100;
const rv_height = 80;
const rv_left = 10; // この2つは暫定値
const rv_top = 50;
const rv_jit_margin = 2; // 揺れ動く大きさの目安
const rv_background = 255;
// 顔の大きさ
const face_width = rv_width * 0.85;
const face_height = rv_height * 0.85;
const face_left = rv_left + (rv_width - face_width) / 2;
const face_top = rv_top + (rv_height - face_height) / 2;
const face_round = 10; // アール
const face_linewidth = 2;
// バープロット表示領域：ぷるぷるちゃんの中央90％×40％
const plot_width = face_width * 0.9;
const plot_height = face_height * 0.5;
const plot_left = face_left + (face_width - plot_width) / 2;
const plot_top = face_top + plot_height * 0.2;
// 現在の値表示位置：中央揃え
const number_left = face_left + face_width / 2;
const number_top = face_top + face_height * 0.65;
const number_textsize = 18; // 文字の大きさは暫定
const number_color = 0;
// 確率の表示
const prob_left = number_left;
const prob_top = number_top + 20;
const prob_textsize = 12;
const prob_color = 0;

// 分布を変更するコンボボックス
const select_left = 10;
const select_top = 10;
const select_width = 100;
const select_height = 30;
let select_distribution;

// ヒストグラム表示領域
const hist_top = rv_top;
const hist_left = rv_left + rv_width + 10;
const hist_width = canvas_width - hist_left - 10;
const hist_height = rv_height;
const histgram_floor = hist_top + hist_height * 0.9;
const histgram_left = hist_left + hist_width * 0.05;
const histgram_height = hist_height * 0.8;
const histgram_width = hist_width * 0.9;
const hist_background = 0;
const hist_min_break = -2.5;
const hist_max_break = 2.5;
const hist_class_width = 0.2;
const hist_bin_number = 25;
//let hist_class_median = [];
let histgram = [];

// 分布指定
const DIST_NORMAL = 1;
const DIST_UNIF = 2;
const DIST_BINOM = 3;
const DIST_POIS = 4;
let distribution = DIST_NORMAL;
// 分布パラメータ
let mu = 0;
let sigma = 1;
// 表示用の線形変換
let disp_mu = plot_width / 2;
let disp_sigma = plot_width / 5;

// 統計量を蓄えるデータ
let data_mean = [];

// 初期化関数
function setup() {
  //let canvas = createCanvas(canvas_width, canvas_height);
  //let container = document.getElementById('prpr1');
  //canvas.parent(container);
  createCanvas(canvas_width, canvas_height);

  // ボタン表示位置を調整するためにdivの位置を得る
  let tmp = document.getElementById('prpr');
  let t0 = tmp.getBoundingClientRect().top;

  // ドロップダウンの設定
  select_distribution = createSelect();
  select_distribution.option("正規分布", 1);
  select_distribution.option("一様分布", 2);
  select_distribution.changed(change_distribution);
  select_distribution.selected(distribution);
  select_distribution.style('width', select_width);
  select_distribution.style('height', select_height);
  select_distribution.position(select_left, t0 + select_top);

  frameRate(FRAME_RATE);
  strokeCap(SQUARE);

  initArray();
  initCanvas();

  //noLoop();
}

function change_distribution() {
  distribution = select_distribution.value();
//  console.log('selected ' + distribution);
  initArray();
  initCanvas();
}

// HTMLからの制御のための関数
function initCanvas() {
  background(canvas_background);

  // 同時表示する確率変数すべてについての初期化作業
  for (let k = 0; k < CANVAS_NUMBER; k++) {
    // 最低限必要な乱数を先に作っておく
    for (let i = 0; i < DISP_SIZE; i++) {
      makeNewData(k);
    }
  }
    // 平均用のベクトルを計算する
  if (DISP_MEAN > 0) {
    for (let i = 0; i < DISP_SIZE; i++) {
      let s0 = 0;
      for (let k=0; k<CANVAS_NUMBER; k++) {
        s0 += data[k][i];
      }
      data[CANVAS_NUMBER].push(s0 / CANVAS_NUMBER);
    }
  }

  // ヒストグラム用のベクトルは平均用も準備する必要があるので、"+DISP_MAEN"
  for (let k = 0; k < CANVAS_NUMBER+DISP_MEAN; k++) {
    // ヒストグラム作成の準備をしておく
    for (let j = 0; j <= hist_bin_number; j++) {
      histgram.push(0);
    }
  }
  data_mean = [];
}

function stopLoop() {
  noLoop();
}
function moveLoop() {
  loop();
}
function initArray() {
  // 配列の配列を作成する
  for (let k = 0; k < CANVAS_NUMBER+DISP_MEAN; k++) {
    data[k] = [];
    histgram[k] = [];
  }
}

// 乱数生成関数
function makeNewData(k) {
  // switch 構文を使うとなぜか思った通り動かないので…
  if (distribution==1) {
      data[k].push(randomGaussian());
  } else if (distribution==2) {
      data[k].push(random(mu-sigma*2.5, mu+sigma*2.5));
  } else {
      console.log('select error. value is ' + distribution);
  }
}

function drawHistgram(k) {
  fill(255, 255, 196);
  noStroke();
  rect(hist_left, hist_top + margin_y[k], hist_width, hist_height);

  for (let i = 0; i <= hist_bin_number; i++) {
    histgram[k][i] = 0;
  }
  for (let i in data[k]) {
    let index = int((data[k][i] - hist_min_break) / hist_class_width) + 1;
    //    console.log(xs[i],index);
    if ((index > 0) & (index <= hist_bin_number)) {
      histgram[k][index]++;
    }
  }

  // ヒストグラムの各ビンの高さ基準と幅
  const h = histgram_height / max(histgram[k]);
  const w = histgram_width / (hist_bin_number + 1);
  let x = histgram_left;
  stroke(0);
  strokeWeight(0.5);
  line(hist_left, histgram_floor + margin_y[k], hist_left + hist_width, histgram_floor + margin_y[k]);
  noStroke();
  fill(0, 0, 255);
  for (let i = 1; i <= hist_bin_number; i++) {
    rect(x + w * i, histgram_floor + margin_y[k] - histgram[k][i] * h, w, histgram[k][i] * h);
  }
  stroke('red');
  strokeWeight(0.8);
  line(
    x + w + w * (hist_bin_number / 2),
    hist_top + margin_y[k],
    x + w + w * (hist_bin_number / 2),
    hist_top + hist_height + margin_y[k]
  );
}

function drawFace(k) {
  // 横軸方向のゆらぎ
  let x_jit = randomGaussian() * rv_jit_margin;
  let y_jit = randomGaussian() * rv_jit_margin;
  // 縦軸方向のゆらぎ
  let x_sign = round(random(0, 1)) ? 1 : -1;
  let y_sign = round(random(0, 1)) ? 1 : -1;

  // 顔の背景を消す
  fill(rv_background);
  noStroke();
  rect(rv_left, rv_top + margin_y[k], rv_width, rv_height);

  // 顔を描く
  strokeWeight(face_linewidth);
  stroke(0, 127, 255);
  fill(128, 255, 255);
  rect(face_left + x_sign * x_jit, face_top + margin_y[k] + y_sign * y_jit, face_width, face_height, face_round);
}

// 最新（最初の方）のDISP_SIZE個を表示する
function drawData(k) {
  textAlign(CENTER, TOP);
  textSize(number_textsize);
  // 表示させたい部分を切り取ってきて
  let d = data[k].slice(data[k].length - DISP_SIZE);
  let return_value = 0;
  for (let i in d) {
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
    line(plot_left + x, plot_top + margin_y[k], plot_left + x, plot_top + plot_height + margin_y[k]);
    if (i == DISP_SIZE - 1) {
      // 線の下に数値を表示する
      let t = nfc(d[i], 2);
      // 理論平均値を示す赤線を追加する
      stroke('red');
      strokeWeight(0.8);
      line(plot_left + disp_mu, face_top + margin_y[k], plot_left + disp_mu, face_top + margin_y[k] + face_height);
      // 線の下に数値を表示する
      noStroke();
      fill(number_color);
      text(t, number_left, number_top + margin_y[k]);
      // 確率
//      textSize(prob_textsize);
//      let prob = 2 * (pnorm(Math.abs(d[i])) - 0.5);
//      text(nfc(prob, 3), prob_left, prob_top + margin_y[k]);
      return_value = d[i];
    }
  }
  return return_value;
}

function draw() {
  // 前のやつを全部消してから
  strokeWeight(1);
  stroke(0);
  fill(canvas_background);
  rect(0, 0, canvas_width - 1, canvas_height - 1);

  // 新しいデータを追加して
  let s0 = 0;
  for (let k = 0; k < CANVAS_NUMBER; k++) {
    makeNewData(k);
    drawFace(k);
    s0 += drawData(k);
    drawHistgram(k);
  }
  if (DISP_MEAN > 0) {
    data[CANVAS_NUMBER].push(s0 / CANVAS_NUMBER);
    drawFace(CANVAS_NUMBER);
    drawData(CANVAS_NUMBER);
    drawHistgram(CANVAS_NUMBER);
  }

  if (data[0].length >= 1000) noLoop();
}


//function pnorm(x) {
  // https://www.marketechlabo.com/normal-distribution-javascript/
  // http://www.kogures.com/hitoshi/javascript/mathlib/index.html
//  const pn_p = 0.2316419;
//  const pn_b1 = 0.31938153;
//  const pn_b2 = -0.356563782;
//  const pn_b3 = 1.781477937;
//  const pn_b4 = -1.821255978;
//  const pn_b5 = 1.330274429;
//  const t = 1 / (1 + pn_p * Math.abs(x));
//  const Z = Math.exp((-x * x) / 2) / Math.sqrt(2 * Math.PI);
//  const y = 1 - Z * ((((pn_b5 * t + pn_b4) * t + pn_b3) * t + pn_b2) * t + pn_b1) * t;
//  return x > 0 ? y : 1 - y;
//}
