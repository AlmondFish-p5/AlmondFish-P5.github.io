//
// サンプリング体験
// sample02.js
//




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


// プログラムの状態を示すフラグ
let flagPrepairing = false;   // 準備
let flagSampling = false;     // サンプリング
let flagOutputing = false;     // 結果出力

/** ===================================================
 *  HTMLから設定する変数
 */
let population_size;      // from input id="set_population_size"
let sampling_size;        // from input id="set_sample_size"
let dataType = 1;         // いずれデータの種類を選べるようにする

/** ---------------------------------------------------
 *  固定しておく数値
 */ 
const rv_rows = 50;       // 1列に50個並べる
const rv_size = 16;       // 一つの確率変数のサイズ（縦、横）
const canvas_background = 208;        // 背景色
const canvas_information_height = 20; // 最下段の情報領域
const indiv_backcol = 'lightyellow'   // サンプリング対象背景
const indiv_frontcol = 'lightslategray'; // 個体の色
const indiv_pickcol = 'crimson';      // 抽出されようとしている個体の色

/** ---------------------------------------------------
 *  上記の数値を用いて設定する広域変数
 */ 
let canvas_width;
let canvas_height;

/** ===================================================
 *  その他の広域変数
 */
let canvas;
let population = [];    // 母集団
let parameter = {mu:0, sigma:0, prob:0, category:0}; // 母集団パラメータ
let sample_index = [];  // 標本抽出番号
let sample_data = [];   // 抽出された標本データ
let counter = 0;        // プログラムを途中で止める＆再サンプリングのタイミングをとる
// プログラムの状態を設定しておく変数
let flagWaiting = false;
let flagDoSampling = false;
let flagShowStats = false;
// 初期表示文字列
const defaultMsg = '好きなタイミングで「標本抽出」ボタンをクリックしてください。';
const greeting = ['こんにちは！','はじめまして。','やっほー!!','Good morning!','あ、どうもです。'];

/** ===================================================
 *  保健統計に基づいてデータを作成する
 *  age-6 + sex*6 で年齢、性別を特定する
 */
const height_mean = [117.0, 122.9, 128.5, 133.9, 139.7, 146.1, 116.0, 122.0, 128.1, 134.5, 141.4, 147.9];
const height_sd = [4.94, 5.27, 5.42, 5.77, 6.37, 7.37, 4.96, 5.24, 5.68, 6.44, 6.86, 6.41];
const weight_mean =[21.8, 24.6, 28.0, 31.5, 35.7, 40.0, 21.3, 24.0, 27.3, 31.1, 35.5, 40.5];
const weight_sd = [3.57, 4.39, 5.60, 6.85, 8.12, 9.22, 3.45, 4.19, 5.18, 6.32, 7.41, 8.06];
const eye_p = [22.52, 25.71, 30.88, 38.43, 43.61, 48.28, 23.91, 28.93, 36.49, 44.55, 50.99, 58.35];
const teeth_p = [18.14, 19.90, 20.65, 20.60, 17.34, 13.23, 17.20, 18.65, 19.88, 19.13, 15.84, 12.17];
function rvData() {
  // オブジェクトの設定：年齢、性別、身長、体重、視力（1.0未満か）、虫歯（未治療があるか）
//  let x = { age:0, sex:0, height:0, weight:0, eye:0, teeth:0 };
  // データ種類
  if (dataType==1) { // 小学校学年別データ
    // 年齢と性別を決める
    this.age = floor(random(6, 12));
    this.sex = round(random()) ? 0 : 1; // Male:0, Female:1
    // 身長・体重：平均値と標準偏差から決める
    const i = this.age - 6 + this.sex * 6;
    this.height = round(randomGaussian(height_mean[i], height_sd[i]),1);
    this.weight = round(randomGaussian(weight_mean[i], weight_sd[i]),1);
    // 視力と虫歯：該当者比率から決める
    this.eye = (random(0,100) < eye_p[i]) ? 1: 0; // 該当=1
    this.teeth = (random(0,100) < teeth_p[i]) ? 1: 0; // 該当=1
  }
}


/** ===================================================
 *  HTML設定の読み込みと広域変数の設定
 */
document.getElementById('btn_show_population').onclick = function(){
  document.getElementById('set_population_size').disabled = true;
  document.getElementById('set_sample_size').disabled = true;
  document.getElementById('btn_show_population').disabled = true;
  document.getElementById('btn_do_sampling').disabled = false;
  readHtmlSettings();
}
function readHtmlSettings() {
  population_size = document.getElementById('set_population_size').value * 1;
  sampling_size = document.getElementById('set_sample_size').value * 1;
  //console.log(population_size, sampling_size);
  document.getElementById('sample_stats').innerHTML = defaultMsg;
  
  canvas_width = rv_size * rv_rows; // 横に50個並べることで固定する
  canvas_height = rv_size * (population_size / rv_rows);
  showPopulation();
}
/** ===================================================
 *  標本抽出決定
 */
document.getElementById('btn_do_sampling').onclick = function(){
  noLoop();
  flagDoSampling = false;
  flagShowStats = true;
  document.getElementById('btn_do_sampling').disabled = true;
  showSampleStats();
}

/** ===================================================
 *  初期化関数
 */
function setup() {
  document.getElementById('btn_do_sampling').disabled = true;
  flagWaiting = true;
  noLoop();
}
function showPopulation() {
  // キャンバスを作る
  canvas = createCanvas(canvas_width, canvas_height+canvas_information_height);
  background(canvas_background);
  // 母集団を作る
  makePopulation();
  // サンプリングされる個体番号を得るための配列
  sample_index = [[...Array(sampling_size)].map((_, i) => i+1), new Array(population_size-sampling_size).fill(0)].flat();
  // フレームレートその他の設定
  frameRate(5);
  textAlign(LEFT, BASELINE);
  textSize(12);
  flagWaiting = false;
  flagSampling = true;
  loop();
}


// 個体の表示位置から個体番号を得る
function getIndivIndex(x, y) {
  return (int(y / rv_size) * rv_rows + int(x / rv_size));
}


/** ===================================================
 * 確率変数を表示する
 */
function drawRvs() {
  background(canvas_background);
  doSampling();
  population.forEach((element)=>{ element.draw(); });
}
// sampling メソッド
function doSampling() {
  // サンプリングし直す
  if (counter % 3==0) doResampling();
  // フラグを立てる
  population.forEach((element) => { element.sample = false; });
  for (let i=1; i<=sampling_size; i++) {
    population[sample_index.indexOf(i)].sample = true;
  }
}
function doResampling() {
  sample_index = sample_index.toSorted(() => Math.random() - 0.5);
}

/** ===================================================
 * 母集団：ｎ個の確率変数オブジェクト rndVar を作る
 */
function makePopulation() {
  let x; 
  let y;
  for (let i = 0; i < population_size; i++) {
    x = rv_size / 2 + rv_size * (i % rv_rows);
    y = rv_size / 2 + rv_size * int(i / rv_rows);
    population[i] = new rndVar(x, y, i);
  }
}
/** ===================================================
 * rndVarの内部メソッド
 */
/** 確率変数1個分を生成する */
function rndVar(x, y, n) {
  this.sample = false;    // サンプリング対称になっているか T/F
  this.number = n;        // 個体番号
  this.center = {         // 表示位置（中央座標）
    x: x,
    y: y
  };
  this.size = {           // 表示大きさ
    front: rv_size - 5,
    back: rv_size
  };
  this.greeting = greeting[floor(random(0,5))];
  // 持っているデータ
  //this.data = makeIndivData(1);
  this.data = new rvData(1);
}
/** draw メソッド：描画設定を退避pusuしてから描画、設定の書き戻しpop */
rndVar.prototype.draw = function() {
  push();
  rectMode(CENTER);
  noStroke();
  if (this.sample) {
    fill(indiv_pickcol);
  } else {
    fill(indiv_frontcol);
  }
  // 位置をすこしだけずらすためと大きさを変えるための乱数
  const jit = [random(-1.5,1), random(-1,1.5), random(-1.6, 1.6)];
  // 個体を表す円を描く
  circle(this.center.x+jit[0], this.center.y+jit[1], this.size.front+jit[2]);
  
  pop();
};
rndVar.prototype.getdata = function() {
  return (this.greeting + '  ID ' + this.number + ' 番： ' + this.data.age + '歳の' + ((this.data.sex) ? '男の子':'女の子') + 'です。');
};

/** ===================================================
 * 情報表示
 */
 // マウスがのっている個体の情報を表示する
function dispRvInfo() {
  noStroke();
  fill(0);
  const info_y = height-5;
  // マウスが個体表示範囲外なら
  if (mouseX < 0 || mouseY < 0 || mouseX >= canvas_width || mouseY >= canvas_height-canvas_information_height) {
    // なんとなくメッセージを出しておく
    text('ボタンを押して標本抽出しましょう!', 0, info_y);
  // 個体表示範囲内なら
  } else {
    // 個体番号を計算して(getIndivIndex)
    let rv_index = getIndivIndex(mouseX, mouseY);
    // データを教えてもらって(.getdata)表示する
    text(population[rv_index].getdata(), 0, info_y);
  }
}
// 標本統計量を計算する：ただし合計を計算するだけ
function calcSampleStats(dat) {
  if (dataType==1) {
    // 統計量を算出する
    let s0 = {n:0, age:0, sex:0, height:0, weight:0, eye:0, teeth:0};
    dat.forEach((element, index)=>{
      s0.n++;
      s0.age += element.data.age;
      s0.sex += element.data.sex;
      s0.height += element.data.height;
      s0.weight += element.data.weight;
      s0.eye += element.data.eye;
      s0.teeth += element.data.teeth;
    });
    return s0;
  }
}
// 表統計量文字列を作成する
function makeStatStr(s0) {
  if (dataType==1) {
    let s1 = [];
    s1[0] = 'サンプルサイズ：' + s0.n;
    s1[1] = '年齢平均：' + (s0.age/s0.n).toFixed(1) + '歳';
    s1[2] = '男' + (s0.n-s0.sex) + '名 女' + s0.sex + '名';
    s1[3] = '身長平均：' + (s0.height/s0.n).toFixed(1) + 'cm';
    s1[4] = '体重平均：' + (s0.weight/s0.n).toFixed(1) + 'kg';
    s1[5] = '視力1.0未満：' + s0.eye + '名（' + (s0.eye/s0.n*100).toFixed(1) + '％）';
    s1[6] = '未治療虫歯保有：' + s0.teeth + '名（' + (s0.teeth/s0.n*100).toFixed(1) + '％）';
    return (s1[0]+'　'+s1[1]+'　'+s1[2]+'<br />'+s1[3]+'　'+s1[4]+'<br />'+s1[5]+'　'+s1[6]);
  }
}
// ローデータ文字列を作成する
function makeRawDataStr() {
  if (dataType==1) {
    let csvStr = 'ID, Age, Sex, Height, Weight, Eye, Teeth \n';
    const s = [];
    sample_data.forEach((element, index) => {
      s[index] = element.number + ', ' + element.data.age + ', ' + element.data.sex + ', ' + element.data.height.toFixed(1) + ', ' + element.data.weight.toFixed(1) + ', ' +element.data.eye + ', ' + element.data.teeth + '\n';
    });
    s.forEach((value, index)=>{ csvStr = concat(csvStr, value); });
    return csvStr;
  }
}
// サンプリングされた標本の統計量とローデータを表示する
function showSampleStats() {
  // サンプリングされた個体だけ抽出 (.filter) する
  sample_data = population.filter((element, index) => {
    return (element.sample == true);
  });
  // 標本統計量
  const sample_s = calcSampleStats(sample_data);    // 統計量を算出する
  const sampleStatStr = makeStatStr(sample_s);      // 統計量表示文字列
  document.getElementById('sample_stats').innerHTML = '<hr /><h3>標本統計量</h3><p>' + sampleStatStr + '</p>';
  // 母集団統計量
  const population_s = calcSampleStats(population);    // 統計量を算出する
  const populationStatStr = makeStatStr(population_s);      // 統計量表示文字列
  document.getElementById('population_stats').innerHTML = '<hr /><h3>母集団統計</h3><p>' + populationStatStr + '</p><hr />';
  // ローデータ
  const csvStr = makeRawDataStr();
  createDiv('<h3>Raw Data</h3><p><textarea cols=80 rows=10 id="raw_data">' + csvStr + '</textarea><br /></p>');
//  createDiv('<h3>Raw Data</h3><p><textarea cols=80 rows=10 id="raw_data">' + csvStr + '</textarea><br /><input type="button" value="Copy RawData" id="copybutton" onclick="copytext()"></input></p>');    // HTML出力：このコマンドだとキャンバス下に表示
}
function copytext() {
  const txt = document.getElementById('raw_data').value;
  navigator.clipboard.writeText(txt);
}

/** ===================================================
 * 描画関数
 */
function draw() {
  if (flagSampling) {
    drawRvs();
    dispRvInfo();
    counter++;
    if (counter>200) noLoop();
  }
}

