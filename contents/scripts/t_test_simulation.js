/**
 *  t検定シミュレーション t_test_simulation.js
 *  平均値や分散の異なる2つの母集団を想定し、そこから指定した標本サイズで
 *  サンプリングした時、どのような結果になるかをシミュレーションする。
 *  1. 想定母集団をつくる：平均値と分散をそれぞれに指定させ、確率密度曲線を描く
 *  2. 標本サイズを指定し、乱数を発生させる。
 *  3. 好みのタイミングでサンプリングを実行する。（シミュレーションのため、複数回実行できる）
 *     サンプリング回数（上限あり）を指定して自動実行、あるいは手動実行
 *  4. 閲覧モードに移行しサンプリングされたデータを見る。データをダウンロードする。
 ================================================== */

let tPlot;    // t検定プロッター
let tDist;    // 確率分布関数
let rvPlot = [];  // 確率変数プロッター
let dPlot = []; // ドットプロッター
const dtmp = { // とりあえず設定用の分布設定
  d  : 'N',
  p1 : 0,
  p2 : 1,
  col: 0,
};

let userParameter = {
  mu : [-1, -1],
  sigma : [-1, -1],
  n : 10,
  nn : 10,
  gname : ['Group1', 'Group2'],
  scale : {min:0, max:0, },
};

// それらを用いて設定する広域定数
let canvas;
const canvas_width = 900;
const canvas_height = 500;
const tplotArea = { x:  0, y:  0, w:300, h:300, };
const graphArea = { x:300, y:  0, w:600, h:290, };
const dplotArea = { x:300, y:200, w:600, h: 30, };
const dotArea   = { x:300, y:300, w:600, h1:20, h2:40, };
const infoArea  = { x:  0, y:430, w:300, h: 60, };
const statsArea = { x:300, y:430, w:600, h: 60, };
const ttestArea = { x:  0, y:300, w:900, h:210, };

// 動作調整ボタン
const btnStart = document.querySelector('#btn_start');
const btnReset = document.querySelector('#btn_reset');

// 閲覧モード　0:シミュレーション、1:データ閲覧
let viewMode = 0;
let loopOn = false;

// いつまでもサンプリングしないと困るので
const systemMaxTrial = 10000;
let trials = 0;
let systemSamplingChance = 0;
let nowSampling = false;
// サンプリングした回数を記録
let userSampling = 0;

let userSampleData = [];
let userStatsData = [];

/** 
 *  ドットプロッタークラス：小学校6年生風ドットプロットを透明背景に描く
 *  dPlot = new myDotPlotter(x, y, w, h, col, size, axis);
 *          num x, num y, num w, num h : 描画範囲
 *          col c, num size : ドットの塗り色と大きさ
 *          bool axis : X軸を描画する（領域の下10pxを占拠する）
 *  setter  scalex(num min, num max); 横軸の設定（整数指定のこと）
 *          data(Array data); 表示するデータの設定
 *  method  plot(mean=false, col=0); プロットする 
 *                mean=true のとき平均値をcol色で追加する。col 無指定のとき黒
 ================================================== */
class myDotPlotter {
  #plotArea = {x:0,y:0,w:0,h:0};
  #col;
  #size;
  #data = [];
  #axis;
  #integer = false;
  #scale = { min:0, max:0, x:0, cx:0, cy:0, };
  constructor(x, y, w, h, c, size, axis, integer) {
    // ------ プロットエリア
    this.#plotArea.x = x;
    this.#plotArea.y = y;
    this.#plotArea.w = w;
    this.#plotArea.h = h;
    // ------- プロットの色と大きさ
    this.#col = c;
    this.#size = size;
    // ------- 軸を描画するか
    this.#axis = axis;
    // ------- 整数値（ドットの大きさを度数によって変える）
    this.#integer = integer;
  }
  // スケールの設定：最小値、最大値、X単位幅、x-center、y-center
  set scalex(s) {
    this.#scale.min = s.min;
    this.#scale.max = s.max;
    this.#scale.x = this.#plotArea.w / (this.#scale.max-this.#scale.min);
    this.#scale.cx = this.#plotArea.x - this.#scale.x * this.#scale.min;
    this.#scale.cy = this.#plotArea.y + this.#plotArea.h / 2;
  }
  // データをセットする
  set data(d) {
    this.#data = d;
  }
  // グローバル関数
  plot(mean=false, col=0) {
    let fr;
    let frmax;
    if (this.#integer) {
      // 度数分布表を作る
      fr = new Array(this.#scale.max - this.#scale.min + 1).fill(0);
      for (let i=0; i<this.#data.length; i++) {
        fr[this.#data[i]-this.#scale.min]++;
      }
      frmax = max(fr);
    }
    push();
    stroke(this.#col);
    if (this.#integer) {
      for (let i=0; i<fr.length; i++) {
        if (fr[i]) {
          const x = (this.#scale.min + i) * this.#scale.x + this.#scale.cx;
          const r = map(fr[i], 1, frmax, this.#size, this.#plotArea.h-4);
          strokeWeight(r);
          point(x, this.#scale.cy);
        }
      }
    } else {
      strokeWeight(this.#size);
      for (let i=0; i<this.#data.length; i++) {
        const x = this.#data[i] * this.#scale.x + this.#scale.cx;
        point(x, this.#scale.cy);
      }
    }
    if (mean) {
      const s = 0;
      this.#data.forEach((value) => { s += value });
      s /= this.#data.length;
      stroke(col);
      const x = s * this.#scale.x + this.#scale.cx;
      point(x, this.#scale.cy);
    }
    pop();
  }
}

/**
 *  t.test プロットクラス：パラメータどおりに棒グラフを描く
 *  tPlot = new myTtestPlotter(x,y,w,h,c1,c2);
 *          num x, num y, num w, num h : 描画範囲
 *          col c1, col c2 : グループ１と２の塗り色
 *  setter  gname1(str name), gname2(str name) : グループ名の設定
 *          mean1/2(num m), sd1/2(num s), n1/2(num n) : パラメータ設定
 *          errorbar(num e) : エラーバー表示タイプ 0非表示 1標準誤差 2信頼区間
 *          displabel(bool d) : データラベル表示 true/false
 *          dispeffsize(bool d) : 効果量表示 true/false
 *  method  getParameter(num index) 
 *             return : str gname, num mean, num sd, num n
 ================================================== */
class myTtestPlotter {
  // フィールド変数
  #gname = ['Group1', 'Group2'];
  #n     = [0, 0];
  #mean  = [0, 0];
  #sd    = [0, 0];
  #stderr = [0, 0];
  #errors = [0, 0, 0];
  #effsize = 0;
  #col = [0, 0];
  #paired = 0;
  #drawArea = {x:0,y:0,w:0,h:0};
  #plotArea = {x:0,y:0,w:0,h:0};
  #axis;
  #scale = {y:0, breaks:[], x:[], labelx:[], xwidth:0, };
  // コンストラクタ
  constructor(x, y, w, h, c1, c2) {
    this.#col = [c1, c2];
    // ------ 描画エリアの設定
    this.#drawArea.x = x;
    this.#drawArea.y = y;
    this.#drawArea.w = w;
    this.#drawArea.h = h;
    // ------ プロットエリア：描画エリアの幅-60、高さ-40
    this.#plotArea.x = this.#drawArea.x + 40;
    this.#plotArea.y = this.#drawArea.y + 30;
    this.#plotArea.w = this.#drawArea.w - 60;
    this.#plotArea.h = this.#drawArea.h - 50;
    this.#plotArea.fy = this.#plotArea.y + this.#plotArea.h;
    // ------ X軸の位置の設定　プロット幅　19,26,10,26,19%
    this.#scale.x = [
      this.#plotArea.x+this.#plotArea.w*0.19,
      this.#plotArea.x+this.#plotArea.w*0.55,
    ];
    this.#scale.labelx = [
      this.#plotArea.x+this.#plotArea.w*0.31,
      this.#plotArea.x+this.#plotArea.w*0.68,
    ];
    this.#scale.xwidth = this.#plotArea.w*0.26;
  }
  // セッター、ゲッター
  // -------------- 共通平均と標準偏差の設定
  set gname1(str) {
    this.#gname[0] = str;
  }
  set gname2(str) {
    this.#gname[1] = str;
  }
  set mean1(m) {
    this.#mean[0] = m;
  }
  set mean2(m) {
    this.#mean[1] = m;
  }
  set sd1(s)   { 
    this.#sd[0] = s;
  }
  set sd2(s)   { 
    this.#sd[1] = s;
  }
  set stderr1(e)   { 
    this.#stderr[0] = e;
  }
  set stderr2(e)   { 
    this.#stderr[1] = e;
  }
  set n1(n) {
    this.#n[0] = n;
  }
  set n2(n) {
    this.#n[1] = n;
  }
  // ローカル関数
  // -------------- 描画エリアを白く消す
  #cleararea()
  {
    fill('white');
    noStroke();
    rect(this.#drawArea.x, this.#drawArea.y, this.#drawArea.w, this.#drawArea.h);
  }
  // -------------- 描画を更新する
  updatePlot(title='', errBar=false, pValue=0) {
    push();
    this.#cleararea();
    this.#drawYaxis();
    this.#drawXaxis();
    // 平均値が2つとも正の値なら箱を描く
    if (this.#mean[0] > 0 & this.#mean[1] > 0) {
      this.#drawBoxes();
      this.#addMeans();
      if (title.length) this.#addMainTitle(title);
      if (errBar) this.#addErrorbar();
      if (pValue) this.#addPvalue(pValue);
    }
    pop();
  }
  // -------------- メインタイトルを追加する
  #addMainTitle(title)
  {
    fill('black');
    noStroke();
    textAlign(CENTER, TOP);
    textSize(15);
    text(title, this.#drawArea.x+this.#drawArea.w/2, this.#drawArea.y+5);
  }
  // -------------- 棒グラフを描画する
  #drawBoxes()
  {
    strokeWeight(1);
    stroke('black');
    for (let i=0; i<2; i++) {
      fill(this.#col[i]);
      rect(this.#scale.x[i], this.#plotArea.fy, this.#scale.xwidth, this.#mean[i] * this.#scale.y);
    }
  }
  // -------------- エラーバーの追加
  #addErrorbar()
  {
    strokeWeight(1);
    stroke('black');
    for (let i=0; i<2; i++) {
      const x = this.#scale.labelx[i];
      const y = [this.#plotArea.fy + (this.#mean[i] - this.#stderr[i]) * this.#scale.y,
                 this.#plotArea.fy + (this.#mean[i] + this.#stderr[i]) * this.#scale.y];
      line( x, y[0], x, y[1]);
      line( x-5, y[0], x+5, y[0]);
      line( x-5, y[1], x+5, y[1]);
    }
  }
  // -------------- データラベルの追加
  #addMeans() 
  {
    // データラベルを描く設定：いずれフラグを広域から設定できるようにする
    noStroke();
    fill('black');
    textSize(12);
    textAlign(CENTER, BOTTOM);
    for (let i=0; i<2; i++) {
      text(this.#mean[i].toFixed(2), this.#scale.labelx[i], this.#plotArea.fy-3);
    }
  }
  // -------------- p値の追加
  #addPvalue(p)
  {
    strokeWeight(2);
    stroke('#999');
    const x = [this.#scale.labelx[0], this.#scale.labelx[1]];
    const y = this.#plotArea.y+10;
    line(x[0], y, x[1], y);
    line(x[0], y, x[0], y+5);
    line(x[1], y, x[1], y+5);
    noStroke();
    fill('black');
    textSize(12);
    textAlign(CENTER, TOP);
    text(`p=${p.toFixed(3)}`, this.#plotArea.x+this.#plotArea.w/2, this.#plotArea.y+15);
  }
  // -------------- X軸を描画する
  #drawXaxis() 
  {
    // #plotArea の下端に縦線を引く＝X軸
    stroke('black');
    strokeWeight(1);
    line(this.#plotArea.x, this.#plotArea.fy, this.#plotArea.x+this.#plotArea.w, this.#plotArea.fy);
    // #scale.breaks ＝目盛り設定、#scale.labelx ＝各Groupの棒グラフの中央点
    noStroke();
    fill('black');
    textAlign(CENTER, TOP);
    textSize(12);
    for (let i=0; i<2; i++) {
      text(this.#gname[i], this.#scale.labelx[i], this.#plotArea.fy+2);
    }
  }
  // -------------- Y軸を描画する
  #drawYaxis() 
  {
    // ------ breaks の計算　エリア高さの80％に棒グラフが収まるようにしている
    const y_max = ceil(max(this.#mean) / 0.8);
    const y_step = (y_max > 25 ? 10 : (y_max < 5 ? 1 : 5));
    this.#scale.y = this.#plotArea.h / y_max * (-1);
    this.#scale.breaks = [];
    for (let i=0; i<=(y_max/y_step); i++) {
      this.#scale.breaks.push(i * y_step);
    }
    // #plotArea の左端に縦線を引く＝Y軸
    stroke('black');
    strokeWeight(1);
    line(this.#plotArea.x, this.#plotArea.y, this.#plotArea.x, this.#plotArea.y+this.#plotArea.h);
    // #scale.breaks ＝目盛り設定、#scale.y ＝(y=1)に対応するYピクセル数
    textSize(10);
    textAlign(RIGHT, CENTER);
    noStroke();
    fill('black');
    for (let i=0; i<this.#scale.breaks.length; i++) {
      text(this.#scale.breaks[i], this.#plotArea.x-2, this.#plotArea.fy + this.#scale.breaks[i] * this.#scale.y);
    }
  }
  // グローバル関数
  getParameter(index) {
    return {
      name: this.#gname[index],
      mean: this.#mean[index],
      sd  : this.#sd[index],
      n   : this.#n[index],
    };
  }
}

// ページロード
window.addEventListener('load', () => {
  const p1 = document.querySelector('#group1');
  p1.style.borderLeftColor = colorList(0, false);
  p1.style.backgroundColor = colorList(0, true);
  const p2 = document.querySelector('#group2');
  p2.style.borderLeftColor = colorList(1, false);
  p2.style.backgroundColor = colorList(1, true);
});

// シミュレーション設定 input 要素
document.querySelector('#groupname1').addEventListener('blur', ()=>{
  userParameter.gname[0] = document.querySelector('#groupname1').value;
  updateGraph();
});
document.querySelector('#groupname2').addEventListener('blur', ()=>{
  userParameter.gname[1] = document.querySelector('#groupname2').value;
  updateGraph();
});
document.querySelector('#mu1').addEventListener('change', ()=>{
  userParameter.mu[0] = document.querySelector('#mu1').value * 1;
  if (userParameter.mu[0]<0) {
    document.querySelector('#mu1').value = 0;
    userParameter.mu[0] = 0;
  }
  updateGraph();
  checkPrepaired();
});
document.querySelector('#mu2').addEventListener('change', ()=>{
  userParameter.mu[1] = document.querySelector('#mu2').value * 1;
  if (userParameter.mu[1]<0) {
    document.querySelector('#mu2').value = 0;
    userParameter.mu[1] = 0;
  }
  updateGraph();
  checkPrepaired();
});
document.querySelector('#sigma1').addEventListener('change', ()=>{
  userParameter.sigma[0] = document.querySelector('#sigma1').value * 1;
  if (userParameter.sigma[0]<=0) {
    document.querySelector('#sigma1').value = 0.1;
    userParameter.sigma[0] = 0.1;
  }
  updateGraph();
  checkPrepaired();
});
document.querySelector('#sigma2').addEventListener('change', ()=>{
  userParameter.sigma[1] = document.querySelector('#sigma2').value * 1;
  if (userParameter.sigma[1]<=0) {
    document.querySelector('#sigma2').value = 0.1;
    userParameter.sigma[1] = 0.1;
  }
  updateGraph();
  checkPrepaired();
});
document.querySelector('#sample_size').addEventListener('change', ()=>{
  userParameter.n = document.querySelector('#sample_size').value * 1;
  checkPrepaired();
});
document.querySelector('#sample_number').addEventListener('change', ()=>{
  userParameter.nn = document.querySelector('#sample_number').value * 1;
  checkPrepaired();
});

// 入力が終わっているかをチェックして「乱数生成」ボタンの動作を決める
function checkPrepaired() {
  if (!viewMode) {
    const chk = document.querySelector('#mu1').value.length * 
                document.querySelector('#mu2').value.length *
                document.querySelector('#sigma1').value.length * 
                document.querySelector('#sigma2').value.length * 
                document.querySelector('#sample_size').value.length *
                document.querySelector('#sample_number').value.length;
    //console.log(chk);
    btnStart.disabled = (chk==0);
  }
}

// ボタンの表示を調整する s = bool[t/f, t/f, t/f, t/f];
function setBtnStatus(s0, s1, s2, s3) { // start, sampling, close, reset
  btnStart.disabled = (!s0);      // s[0] は乱数生成開始ボタン
  //btnSampling.disabled = (!s1);   // s[1] はサンプリングボタン
  //btnClose.disabled = (!s2);      // s[2] は乱数生成終了ボタン
  btnReset.disabled = (!s3);      // s[3] はリセットボタン
}

// 乱数生成を開始する
btnStart.addEventListener('click', () => {
  document.querySelectorAll('.simset').forEach((element) => {
    element.disabled = true;
  });
  setPlotter();
  nowSampling = false;
  systemSamplingChance = floor(random(50, 75));
  setBtnStatus(false, true, true, false);
  loopOn = true;
  loop();
});

// リセットボタン
btnReset.addEventListener('click', ()=> {
  window.location.reload();
});

// カラーコードを作る
function colorList(index, alpha=true) {
  const c = [
    [255,  79,   0],  // '#f30'
    [  0, 255,  79],  // '#0f3'
    [ 79,   0, 255],  // '#30f'
    [255, 159,   0],  // '#930'
    [  0, 255, 159],  // '#093'
    [159,   0, 255],  // '#309'
    [255, 255,  79],  // '#c33'
    [ 79, 255, 255],  // '#3c3'
    [255,  79, 255],  // '#33c'
    [ 79,  79,  79],  // '#333'
  ];
  if (index<0) {
    return  (alpha ? color(0,30) : color(0));
  } else {
    index = index % 10;
    if (alpha) {
      return color(c[index][0], c[index][1], c[index][2], 30);
    } else {
      return color(c[index][0], c[index][1], c[index][2]);
    }
  }
}

// 確率分布関数を描画し直す
function updateGraph() {
  if (userParameter.mu[0]<0 || userParameter.mu[1]<0 ||
      userParameter.sigma[0]<=0 || userParameter.sigma[1]<=0) {
        return null;
  } else {
    // 設定されている関数をいったん消す
    tDist.removeDist(-1);
    for (let i=0; i<2; i++) {
      const d = {
        d  : 'N',
        p1 : userParameter.mu[i],
        p2 : userParameter.sigma[i],
        col: colorList(i, false),
      };
      // 分布リストを追加するaddDist(d) d {str d, num p1, num p2, col/num/str col}
      tDist.addDist(d);
    }
    // グラフの最小値最大値を設定する
    userParameter.scale = {
      min: floor(min(userParameter.mu[0] - userParameter.sigma[0]*4, userParameter.mu[1] - userParameter.sigma[1]*4)), 
      max: ceil(max(userParameter.mu[0] + userParameter.sigma[0]*4, userParameter.mu[1] + userParameter.sigma[1]*4)),
    };
    // 分布曲線を描く
    tDist.scalex = userParameter.scale;
    tDist.drawCurves(true);
    tDist.dispLegend();
    // 棒グラフを描く
    tPlot.gname1 = userParameter.gname[0];
    tPlot.gname2 = userParameter.gname[1];
    tPlot.mean1 = userParameter.mu[0];
    tPlot.mean2 = userParameter.mu[1];
    tPlot.sd1 = sqrt(userParameter.mu[0]);
    tPlot.sd2 = sqrt(userParameter.mu[1]);
    tPlot.updatePlot('仮想サンプル');
  }
}

// 確率変数プロッターを準備する
function setPlotter() {
  for (let i=0; i<2; i++) {
    rvPlot[i] = new RvPlotter(
      userParameter.gname[i], 
      {d:'N', p1:userParameter.mu[i], p2:sqrt(userParameter.sigma[i]) }, 
      [{ name:'D', x:dotArea.x, y:dotArea.y+i*70, w:dotArea.w, h:dotArea.h1, 
        axis:false , col:colorList(i), },
       { name:'L', x:dotArea.x, y:dotArea.y+i*70+dotArea.h1, w:dotArea.w, h:dotArea.h2, 
        axis:false , col:colorList(i), }]
    );
    rvPlot[i].scalex = userParameter.scale;
    //rvPlot[i].fillarea();
    //noLoop();
  }
}

// シミュレーション結果を表示する
function dispSimulationResult(index) {
  index--;
  // 棒グラフを表示
  const d = userStatsData[index];
  tPlot.mean1 = d.m1;
  tPlot.mean2 = d.m2;
  tPlot.stderr1 = d.se1;
  tPlot.stderr2 = d.se2;
  tPlot.n1 = d.n1;
  tPlot.n2 = d.n2;
  tPlot.updatePlot(`Simulation ${index+1}`, true, d.p);
  // 密度関数を描き直し
  tDist.drawCurves(true);
  dPlot[0].data = userSampleData[index].x1;
  dPlot[1].data = userSampleData[index].x2;
  dPlot[0].plot();
  dPlot[1].plot();
  // 検定情報
  const simres = [`【 シミュレーション ${index+1} 回目 】`, 
  `${userParameter.gname[0]} : 平均 ${d.m1.toFixed(3)}, 標準偏差 ${d.sd1.toFixed(3)}, 標準誤差 ${d.se1.toFixed(3)}, n=${d.n1}`,
  `${userParameter.gname[1]} : 平均 ${d.m2.toFixed(3)}, 標準偏差 ${d.sd2.toFixed(3)}, 標準誤差 ${d.se2.toFixed(3)}, n=${d.n2}`,
  `Welch 検定 : t-value = ${d.t.toFixed(3)}, df = ${d.df.toFixed(3)}, p-value = ${d.p.toFixed(3)}, d = ${d.d.toFixed(3)}`];
  push();
  noStroke();
  fill(246);
  rect(ttestArea.x, ttestArea.y, ttestArea.w, ttestArea.h);
  fill('black');
  textSize(15);
  textAlign(LEFT, TOP);
  for (let i=0; i<simres.length; i++) {
    text(simres[i], infoArea.x+50, dotArea.y+20+25*i);
  }
  pop();
}

/**
 *  初期化関数
 ====================================================== */
function setup() {
  document.querySelector('#post_analysis').style.display = 'none';
  canvas = createCanvas(canvas_width, canvas_height);
  canvas.parent(document.querySelector('#p5'));
  background('white');
  setBtnStatus(false, false, false, true);
  tPlot = new myTtestPlotter(tplotArea.x, tplotArea.y, tplotArea.w, tplotArea.h, colorList(0), colorList(1));
  tDist = new drawDistFunc('想定母集団', graphArea, dtmp);
}

// ビューモードに設定する
function resetupViewMode() {
  document.querySelector('#post_analysis').style.display = 'block';
  document.querySelector('#sample_index').disabled = false;
  document.querySelector('#sample_index').setAttribute('max', userParameter.nn);
  // ビューモード設定
  viewMode = 1;
  // ドットプロッターの設定
  const sc = tDist.scale;
  for (let i=0; i<2; i++) {
    dPlot[i] = new myDotPlotter(dplotArea.x, dplotArea.y+dplotArea.h*i, dplotArea.w, dplotArea.h, colorList(i, false), 7, false, true);
    dPlot[i].scalex = {min:sc.min,  max:sc.max};
  }
  // イベントを設定する
  document.querySelector('#sample_index').addEventListener('change', () => {
    const ss = document.querySelector('#sample_index').value * 1;
    dispSimulationResult(ss);
  });
  document.querySelector('#sample_index').value = 1;
  dispSimulationResult(1);
}


/**
 *  描画関数
 ====================================================== */
function draw() {
  if (loopOn) {
    let x = [];
    for (let i=0; i<2; i++) {
      x[i] = rvPlot[i].generateNewData(true);
      rvPlot[i].plotDatas();
    }
    trials++;
    if (trials == systemSamplingChance) { 
      nowSampling = true;
      setBtnStatus(false, false, false, false);
      userSampleData[userSampling] = {
        x1: [], x2: [], 
        n1: userParameter.n,
        n2: userParameter.n,
      };
    }
    if (nowSampling) {    // サンプリング中の動作
      if (userSampleData[userSampling].x1.length < userParameter.n) {
        userSampleData[userSampling].x1.push(x[0]);
        userSampleData[userSampling].x2.push(x[1]);
      } else {
        dispStats();
        userSampling++;
        if (userSampling < userParameter.nn) {
          setBtnStatus(false, false, true, false);
          nowSampling = false;
          systemSamplingChance = floor(random(120/userParameter.nn, 180/userParameter.nn));
          trials = 0;
        } else {
          loopOn = false;
          noLoop();
          resetupViewMode();
          prepairDownload();
        }
      }
    }
  }
}

// -------------------- サンプリング情報 statsArea={ x:300, y:550, w:600, h: 60, };
function dispStats() {
  // 計算部分
  userStatsData[userSampling] = calcTtest(userSampleData[userSampling]);
  // 表示部分
  push();
  fill('white');
  noStroke();
  rect(statsArea.x, statsArea.y, statsArea.w, statsArea.h);
  fill('black');
  textSize(15);
  textAlign(LEFT, TOP);
  text(`サンプリング終了 ${userSampling+1} ／ ${userParameter.nn}`, statsArea.x+30, statsArea.y+statsArea.h/4);
  pop();
}

// --------------------- t検定の計算をする
function calcTtest(d) {
  const m1 = meanOf(d.x1);
  const m2 = meanOf(d.x2);
  const ss1 = ssOf(d.x1, m1);
  const ss2 = ssOf(d.x2, m2);
  const sd1 = sqrt(ss1 / (d.n1 - 1));
  const sd2 = sqrt(ss2 / (d.n2 - 1));
  const se1 = sd1 / sqrt(d.n1);
  const se2 = sd2 / sqrt(d.n2);
  const cohen = (m1 - m2) / sqrt((ss1 + ss2) / (d.n1 + d.n2 - 2));
  const g1 = (ss1/(d.n1 - 1))/d.n1;
  const g2 = (ss2/(d.n2 - 1))/d.n2;
  const df = (sq(g1 + g2)) / (sq(g1) / ((d.n1 - 1)) + sq(g2) / ((d.n2 - 1)));
  const tvalue = (m1-m2) / sqrt( g1 + g2 );
  const pvalue = (1-jStat.studentt.cdf(abs(tvalue), df))*2;

  return {m1:m1, m2:m2, sd1:sd1, sd2:sd2, se1:se1, se2:se2, n1:d.n1, n2:d.n2, t:tvalue, df:df, p:pvalue, d:cohen, };
}
const meanOf = (x)=> {
  let s = 0;
  x.forEach((v)=>{s += v});
  return s / x.length;
}
const ssOf = (x,m)=> {
  let s = 0;
  x.forEach((v)=>{s += sq(v-m)});
  return s;
}

// ---------------------- ローデータの提供 データダウンロードの準備をする
function prepairDownload() {
  document.querySelector('#download').style.display = 'block';
  document.querySelectorAll('.data_download').forEach((element) => {
    element.addEventListener('click', ()=>{
      const csvData = makeDownloadData(element.id);
      const filename = element.id=='script' ? 'script.r' : `${element.id}.csv`;
      saveCsvFile(csvData, filename);
    });
  });
}

// ---------------------- ダウンロードファイルをつくる
function makeDownloadData(id) {
  let data = [];
  switch (id) {
    // ---------------------- ローデータの作成
    case 'raw_data':
      const dh = ['Simulate', 'Group', 'Value', ];
      data.push(dh);
      for (let i=0; i<userSampleData.length; i++) {
        for (let j=0; j<userSampleData[i].n1; j++) {
          data.push(`${i+1}, 1, ${userSampleData[i].x1[j]}`);
        }
        for (let j=0; j<userSampleData[i].n2; j++) {
          data.push(`${i+1}, 2, ${userSampleData[i].x2[j]}`);
        }
      }
      break;
    // ---------------------- 統計データの作成
    case 'stats_data':
      const sh = ['m1', 'm2', 'sd1', 'sd2', 'n1', 'n2', 't-value', 'df', 'p-value', 'd(g)'];
      data.push(sh);
      for (let i=0; i<userStatsData.length; i++) {
        const d = userStatsData[i];
        data.push(`${d.m1}, ${d.m2}, ${d.sd1}, ${d.sd2}, ${d.n1}, ${d.n2}, ${d.t}, ${d.df}, ${d.p}, ${d.d}`);
      }
      // 最終行に想定母集団情報を追加しておく
      const p0 = tPlot.getParameter(0);
      const p1 = tPlot.getParameter(1);
      data.push(`${p0.mean}, ${p1.mean}, ${p0.sd}, ${p1.sd}, ${p0.n}, ${p1.n}, .,.,.,.`);
      break;
    // ---------------------- スクリプトの作成
    case 'script':
      data.push('## t検定シミュレーション');
      data.push('## データ読み込み');
      data.push('df <- read.csv("raw_data.csv")');
      data.push('head(df)');
      data.push('istart <- min(df$Simulate)');
      data.push('iend <- max(df$Simulate)');
      data.push('## シミュレーションごとにWelch検定する');
      data.push('for (i in istart:iend) {');
      data.push('  dfs <- df[df$Simulate==i, ]');
      data.push('  result <- t.test(Value ~ Group, data=dfs)');
      data.push('  print(paste("====== Simulation",i,"======"))');
      data.push('  print(result)');
      data.push('  barplot(result$estimate, main=paste("Simulation",i))');
      data.push('}');
      break;
    default:
      return null;
  }
  data.push('');
  return data.join('\n');
}

