//
// サンプリング体験
// sample01.js
//

let canvas;

// プログラムの状態を示すフラグ
let flagPrepairing = false;   // 準備
let flagSampling = false;     // サンプリング
let flagOutputing = false;     // 結果出力

// HTMLから設定する変数
let rv_length = 20;           // 縦横にいくつrvを並べるか
let sampling_width = 3;       // サンプリング領域 横、縦
let sampling_height = 4;
let variable_select = -1;     // 確率変数の種類

// それらを用いて設定する広域定数
let canvas_width;       // rv * rv_length
let canvas_height;      // rv * rv_length
let maxId;              // rv_length ** 2

// その他の定数
const rv = 20;  // 確率変数1つのサイズ
const rv_about = [
  '偏りのないコイン投げの結果（表=1,裏=0）を表す確率変数です。',
  '偏りのないサイコロ投げの目（1～6）を表す確率変数です。',
  '成功確率pのベルヌーイ分布に従う確率変数です。pはプログラムが自動設定します。',
  '5段階尺度の選択結果（1～5）を表します。分布はプログラムが自動設定します。',
  '範囲0～100の正規分布に従う確率変数です。平均と分散はプログラムが自動設定します。'
];
const canvas_background = 192;
const sampling_background = 'lightyellow'
const indiv_color = 'crimson';

// 母集団・標本情報
let population = [];    // 母集団
let parameter = {mu:0, sigma:0, prob:0, category:0}; // 母集団パラメータ
let pos_x = [];         // 母集団個体の表示位置
let pos_y = [];
let sample_index = [];  // 標本抽出番号
let sample_data = [];   // 抽出された標本データ
let samplingPosition = {x:0, y:0};

// ============================================================
// HTMLの変更

// HTMLの入力コントロールの変更を値に反映する
document.getElementById('pop_size').onchange = function(){
  rv_length = document.getElementById('pop_size').value * 1;
  maxId = rv_length * rv_length;
  loop();
  //console.log(rv_length);
}
document.getElementById('smp_width').onchange = function(){
  sampling_width = document.getElementById('smp_width').value * 1;
  loop();
  //console.log(sampling_width);
}
document.getElementById('smp_height').onchange = function(){
  sampling_height = document.getElementById('smp_height').value * 1;
  loop();
  //console.log(sampling_height);
}
document.getElementById('rv_select').onchange = function(){
  variable_select = document.getElementById('rv_select').value * 1;
  document.getElementById('rv_about').innerHTML = rv_about[variable_select];
  document.getElementById('btn_start').disabled = null;
  //console.log(variable_select);
}

// サンプリング動作を開始する
document.getElementById('btn_start').onclick = function(){
  flagPrepairing = false;
  flagSampling = true;
  document.getElementById('pop_size').disabled = true;
  document.getElementById('smp_width').disabled = true;
  document.getElementById('smp_height').disabled = true;
  document.getElementById('rv_select').disabled = true;
  document.getElementById('btn_start').disabled = true;
  setPopulation();
  loop();
  // console.log('サンプリング開始');
}

// HTML起動時に設定されている値を読み込む：setupから1回だけ呼び出す
function getInitialValue() {
  rv_length = document.getElementById('pop_size').value * 1;
  sampling_width = document.getElementById('smp_width').value * 1;
  sampling_height = document.getElementById('smp_height').value * 1;
  maxId = rv_length * rv_length;
  //console.log(rv_length, sampling_width, sampling_height);
}


// ============================================================
// 母集団設定

// 変数種類の設定に応じて乱数を決める
function getRandomValue() {
  let value;
  
  if (variable_select == 4) {         // 4:正規分布
    value = Math.ceil(randomGaussian(parameter.mu, parameter.sigma));
    if (value>100) value=100;
    if (value<0) value=0;
  } else if (variable_select % 2 == 0) {   // 0,2:コイン投げ、ベルヌーイ
    value = (random() < parameter.prob) ? 1 : 0;
  } else {   // // 1,3：サイコロ or リッカート
    value = Math.ceil(random(0, parameter.category));
    if (variable_select % 2 == 3 && random() > 0.667) { // リッカートのみ
      value += (value > parameter.mu) ? -1 : (value < parameter.mu) ? 1 : 0;
    }
  }
  return value;
}

// 母集団をつくる
function setPopulation() {
  population = new Array(maxId).fill(0);
  pos_x = new Array(maxId).fill(0);
  pos_y = new Array(maxId).fill(0);
  jit_x = new Array(maxId).fill(0);
  jit_y = new Array(maxId).fill(0);
  
  if (variable_select == 0) {         // コイン投げ
    parameter.prob = 0.5;
    parameter.mu = 0.5;
  } else if (variable_select == 1) {  // サイコロ投げ
    parameter.category = 6;
    parameter.mu = 3.5;
  } else if (variable_select == 2) {  // ベルヌーイ
    parameter.prob = round(random(3,8) / 10,1);
    parameter.mu = parameter.prob;
  } else if (variable_select == 3) {  // リッカート5段階
    parameter.category = 5;
    parameter.mu = floor(random(2,5));
  } else if (variable_select == 4) {  // テスト成績
    parameter.mu = Math.floor(random(40, 76));
    parameter.sigma = Math.floor(random(8, 20));
  }
  
  for (i=0; i<maxId; i++) {
    population[i] = getRandomValue();
    pos_x[i] = rv/2 + rv*(i % rv_length);
    pos_y[i] = rv/2 + rv * int(i / rv_length);
  }
  setJitter();
}

// 表示位置をずらす乱数を設定する、更新する
function setJitter() {
  for (i=0; i<jit_x.length; i++) {
    jit_x[i] = randomGaussian()*4;
    jit_y[i] = randomGaussian()*4;
  }
}

// ============================================================
// 基本動作

// A:シミュレーション画面を出す flagPrepairing=true, flagSampling=true
function doSimulation() {
  // A-0:母集団をつくる
  setPopulation();
  // A-1:キャンバスの再設定
  canvas_width = rv * rv_length;
  canvas_height = rv * rv_length;
  canvas = createCanvas(canvas_width, canvas_height);
  drawSamplingArea();
  //console.log('Done A-1');
  // A-2:確率変数（ダミー）の表示
  drawRandomVar();
  //console.log('Done A-2');
  let about_text = '母集団の' + round(((sampling_height * sampling_width) / rv_length ** 2) * 100, 1) + '％をサンプリングします。';
  document.getElementById('smp_about').innerHTML = about_text;
}

// B:サンプリングする flagSampling=true, flagSampling=true
function doSampling() {
  if (flagSampling) {
    drawSamplingArea(); // マウスの移動に合わせて矩形を移動する
    drawRandomVar();    // 確率変数を100個並べる
  } else {
    noLoop();
    getStats();
    showSamplingData();
  }
}

// 手順A.1 B.1 サンプリングエリアを四角形で描く
function drawSamplingArea() {
  // console.log('手順1 サンプリングエリアを四角形で描く');
  background(canvas_background);
  fill(sampling_background);
  noStroke();

  if (flagPrepairing) {
    rect(2*rv, 3*rv, rv*sampling_width, rv*sampling_height);
  } else {
    // 四角形を描く領域左上は、左上から数えて何番目の個体であるかを計算している
    let x = (int(mouseX / rv) >= rv_length-sampling_width) ? (rv_length - sampling_width) : int(mouseX / rv);
    let y = (int(mouseY / rv) >= rv_length-sampling_height) ? (rv_length - sampling_height) : int(mouseY / rv);

    rect(x*rv, y*rv, rv*sampling_width, rv*sampling_height);
    samplingPosition.x = x;
    samplingPosition.y = y;
  }
  //console.log(samplingPosition);
}

// 手順A.2 B.2 母集団変数を100個並べる
function drawRandomVar() {
  // console.log('手順1.2 母集団変数を100個並べます');
  fill(indiv_color);
  noStroke();
  setJitter();
  for (let i=0; i<maxId; i++) {
    circle(pos_x[i]+jit_x[i], pos_y[i]+jit_y[i], random(2,10));
  }
//  noLoop();
}

// C: サンプリングの結果を返す 
function getStats() {
  // console.log(samplingPosition);
  for (let j=0; j<sampling_height; j++) {
    for (let i=0; i<sampling_width; i++) {
      sample_index.push(rv_length*(samplingPosition.y+j) + samplingPosition.x + i);
    }
  }
  // console.log(sample_index);
  strokeWeight(0.5);
  fill(0);
  textSize(13);
  textAlign(CENTER, CENTER);
  for (k=0; k<sample_index.length; k++) {
    sample_data[k] = population[sample_index[k]];
    text(sample_data[k], pos_x[sample_index[k]], pos_y[sample_index[k]]);
  }
  noLoop();
  canvas.mouseClicked(false);
}

// 統計関数：D から呼び出される-->t_dist01.js を使用
//function calcMean(v) {
//  let mean = 0;
//  v.forEach((value, index) => mean += value);
//  return (mean / v.length);
//}
//function calcVar(v, m, u=0) {
//  let sd = 0;
//  v.forEach((value, index) => sd += (value-m)**2);
//  return (sd / ((u!=0) ? v.length : v.length-1));
//}

// D: サンプリング結果をHTML出力する flagOutputing=true
function dispSamplingData() {
  // 母集団統計
  const pop_mu = calc_mean(population);
  const pop_var = calc_variance(population, pop_mu);
  // 標本統計
  const smp_m = calc_mean(sample_data);
  const smp_var = calc_variance(sample_data);
  const smp_uvar = calc_variance(sample_data, true);
  

  // 母集団データの記述
  let str0 = '<h3>母集団</h3> <p>母集団サイズ：' + maxId + ', '
  let str1;
  let str2 = '<br / >母集団統計：N = ' + maxId + ', 母平均μ = ' + pop_mu.toFixed(2) + ', 母分散σ2 = ' + pop_var.toFixed(2) + '</p>';
  // 可変部分
  if (variable_select == 0) {         // コイン投げ
    str1 = 'ベルヌーイ分布 母比率π = 0.5';
  } else if (variable_select == 1) {  // サイコロ投げ
    str1 = '離散一様分布（1～6はそれぞれ1/6）';
  } else if (variable_select == 2) {  // ベルヌーイ
    str1 = 'ベルヌーイ分布 母比率π = ' + parameter.prob;
  } else if (variable_select == 3) {  // リッカート5段階
    str1 = '正規分布に近い離散単峰型分布 最頻値 = ' + parameter.mu;
  } else if (variable_select == 4) {  // テスト成績
    str1 = '正規分布 母平均μ = ' + parameter.mu + ', 母分散σ2 = ' + parameter.sigma**2;
  }

  // 標本データの記述
  let str3 = '<h3>標本</h3> <p>標本サイズ：' + sample_data.length + ', ';
  let str4 = '標本平均 = ' + smp_m.toFixed(2) + ', 標準分散 = ' + smp_var.toFixed(2) + ', 不偏分散 = ' + smp_uvar.toFixed(2) + '<br />';
  let str5 = '標本データ：' + sample_data.join(',') + '</p><hr />';

  // 1標本t検定の結果記述
  // result={mean:0, u2:0, n:0, df:0, se_hat:0, t0:0, t_crt:0, p_ast:false, ci_low:0, ci_up:0};
  const result = OneSampleTtest(sample_data, parameter.mu);
  let res1 ='<h3>平均値の検定結果</h3> t = ' + result.t0.toFixed(4) + ', df = ' + result.df + ', ';
  let res2 = (result.p_ast) ? 'p < .05' : 'n.s.';
  let res3 = '<br /> sample mean = ' + result.mean.toFixed(4) + ', 95% confidence interval : ' + result.ci_low.toFixed(4) + ', ' + result.ci_up.toFixed(4) + '</p><hr />'
  const code0 = '<h3>Rによる検算</h3><p>次のコードをRで実行し、検算してください。<br />';
  const code1 = '<code>dat <- c(' + sample_data.join(',') + ') </code><br />' + '<code>t.test(dat, mu = ' + parameter.mu + ')  </code></p>';

  // HTML書き出し
  document.getElementById('output_stats').innerHTML = str0 + str1 + str2 + str3 + str4 + str5 + res1 + res2 + res3 + code0 + code1 + '<hr />';
}


// ============================================================
// 初期化関数
function setup() {
  // htmlで初期設定されている値を取得する
  getInitialValue();
  flagPrepairing = true;
  frameRate(10);
}

// ============================================================
// 描画関数
function draw() {
  if (flagPrepairing) {
    doSimulation();
    noLoop();
  } else if (flagSampling) {
    doSampling();    
    canvas.mouseClicked( ()=>{ // クリックしたらサンプリングを止める
      flagSampling = false;
      flagOutputing = true;
    });
  } else if (flagOutputing) {
    getStats();
    dispSamplingData();
    //noLoop();
  }
//  noLoop();
}

