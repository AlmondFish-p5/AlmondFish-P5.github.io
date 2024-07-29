/**
 *  相関係数あてゲーム correlation.js
 ======================================================*/ 
// 回帰クラス
let Reg;
// 回帰係数クラス
let User;
// 2次元プロットクラス
let xyPlot;
// HTMLから設定する変数
let userSampleSize;

// 母相関係数はここから選ぶことにする
const rhoList = [0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65];
// 画面表示のための固定パラメータ
let defParameter = {
  rho:0,      // 母相関係数の設定
  cor:0,      // データ標本相関
  mu:10,      // 表示のための一次変換用（固定？）
  sigma:3,
};
// 画面表示のためのスケール設定
let defDataRange = {
  x : {min:0, max:0, range:0},
  y : {min:0, max:0, range:0},
}

// その他の広域変数
let canvas;
const canvas_width  = 900;
const canvas_height = 600;
const canvas_background = 'white';
const plotArea = {x:0, y:0, w:canvas_height, h:canvas_height, };
const statArea = {x:plotArea.w, y:0, w:canvas_width-plotArea.w, h:plotArea.h, };
const testArea = {x:620, y:450, w:280, h:100, };

// 外れ値除去モード
let TestMode = false;

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

/**
 *  二次元平面プロッター myXYPlotter
 *  
 ============================================== */
class myXYPlotter {
  // フィールド変数
  #data = {x:[], y:[], n:0};
  #drawArea = {x:0, y:0, w:0, h:0, };
  #plotArea = {x:0, y:0, w:0, h:0, };
  #scale;
  #stat;
  #axis;  // XY 軸の描画
  #col;   // プロットする色
  #size;  // プロットする大きさ
  // ----------------- コンストラクタ
  constructor(x, y, w, h, axis, size, col) {
    this.#drawArea = {x:x, y:y, w:w, h:h, };
    this.#plotArea = {x:x+15, y:y+15, w:w-30, h:h-30, };
    this.#size = size;
    this.#col = col;
    this.#scale = {　
      x: {min:0, max:0, origin:0, scale:0, },
      y: {min:0, max:0, origin:0, scale:0, }, 
    };
    this.#stat = {
      mean : {x:0, y:0, },
      cov  : {x2:0, y2:0, xy:0, },
      cor  : 0,
      reg  : {slope:0, intercept:0, },
    };
  }
  // ----------------- 存在確認関数：範囲の確認
  fillarea() {
    fill('yellow');
    stroke('orange');
    const p = this.#drawArea;
    rect(p.x, p.y, p.w, p.h);
    fill('skyblue');
    stroke('darkblue');
    const q = this.#plotArea;
    rect(q.x, q.y, q.w, q.h);
  }
  // セッター、ゲッター
  set data(d) { // ----- # 既存データの割り当て
    // データの長さをチェックする
    if (d.x.length<1) return null;
    if (d.x.length != d.y.length) return null;
    // データを取得する
    this.#data.x = d.x;
    this.#data.y = d.y;
    this.#data.n = this.#data.x.length;
    this.#set_scales();
    // 統計量を計算する
    this.#calcStats();
  }
  get data() {  // ----- # 使用したデータの取得
    return {x:this.#data.x, y:this.#data.y, };
  }
  get stats() { // ----- # 統計情報の取得
    return this.#stat;
  }
  // ----------------- 表示設定関連関数
  #clearArea()  // ----- # エリアの消去
  {
    push();
    fill('white');
    noStroke();
    const p = this.#drawArea;
    rect(p.x, p.y, p.w, p.h);
    pop();
  }
  #drawAxis()   // ----- # XY軸の描画
  {
    push();
    const ax = this.#plotArea.x;
    const ay = this.#plotArea.y+this.#plotArea.h;
    stroke('black');
    strokeWeight(0.5);
    const p = this.#plotArea;
    line(p.x, ay, p.x+p.w, ay); // X軸
    line(ax, p.y, ax, p.y+p.h); // Y軸
    fill('black');
    noStroke();
    textSize(10);
    textAlign(CENTER, TOP);
    for (let x = this.#scale.x.min; x<=this.#scale.x.max; x++) {
      if (x % 5==0) text(x, this.#vx(x), ay+2);
    }
    textAlign(RIGHT, CENTER);
    for (let y = this.#scale.y.min; y<=this.#scale.y.max; y++) {
      if (y % 5==0) text(y, ax-2, this.#vy(y));
    }
    pop();
  }
  #vx(x) // ---- X軸方向 座標変換
  { return this.#scale.x.origin + x * this.#scale.x.scale; }
  #vy(y) // ---- Y軸方向 座標変換
  { return this.#scale.y.origin + y * this.#scale.y.scale; }
  #vxinv(x) // ---- X軸方向 座標逆変換
  { return (x - this.#scale.x.origin) / this.#scale.x.scale; }
  #vyinv(y) // ---- Y軸方向 座標逆変換
  { return (y - this.#scale.y.origin) / this.#scale.y.scale; }
  // ----------------- データ関連関数
  #set_scales()
  {
    // Xを処理する
    this.#scale.x.min = floor(min(this.#data.x))-2;
    this.#scale.x.max = ceil(max(this.#data.x))+2;
    this.#scale.x.scale = this.#plotArea.w / (this.#scale.x.max - this.#scale.x.min);
    this.#scale.x.origin = this.#plotArea.x - this.#scale.x.scale * this.#scale.x.min;
    // Yを処理する
    this.#scale.y.min = floor(min(this.#data.y))-2;
    this.#scale.y.max = ceil(max(this.#data.y))+2;
    this.#scale.y.scale = this.#plotArea.h / (this.#scale.y.max - this.#scale.y.min) * (-1);
    this.#scale.y.origin = this.#plotArea.y + this.#plotArea.h - this.#scale.y.scale * this.#scale.y.min;
    
  }
  #calc_mean(x)         //------- 平均を計算する
  {
    let s = 0;
    x.forEach(value =>  s+= value );
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
  #calcStats() // ----- 現在のデータの統計量を計算する
  {
    // 平均値、分散、共分散を計算する
    this.#stat.mean.x = this.#calc_mean(this.#data.x);
    this.#stat.mean.y = this.#calc_mean(this.#data.y);
    this.#stat.cov.x2 = this.#calc_variance(this.#data.x, this.#data.x);
    this.#stat.cov.y2 = this.#calc_variance(this.#data.y, this.#data.y);
    this.#stat.cov.xy = this.#calc_variance(this.#data.x, this.#data.y);
    // 相関係数、回帰係数を計算する
    this.#stat.cor = this.#stat.cov.xy / (sqrt(this.#stat.cov.x2) * sqrt(this.#stat.cov.y2));
    this.#stat.reg.slope = this.#stat.cov.xy / this.#stat.cov.x2;
    this.#stat.reg.intercept = this.#stat.mean.y - this.#stat.reg.slope * this.#stat.mean.x;
  }
  // ====================== 広域関数
  // ---------------------- 乱数データ作成：相関係数、分布パラメータ、標本サイズ、丸め処理
  makeRandomData(r, parax, paray, size) {
    // 引数 r num:相関係数（この係数どおりに乱数が作られるとは限らない）
    //  parax, paray:2変数の平均と標準偏差{mu:num, sigma:num}
    //  size:標本サイズ
    //  deci:丸めるときの桁数 0:整数、1,2,.. 小数桁数、-1:丸めなし
    // 乱数データを作成する：相関をもつデータ(Y)はKosugi, et.al. 2023 による
    this.#data.n = size;
    this.#data.x = [];
    this.#data.y = [];
    for (let i=0; i<this.#data.n; i++) {
      this.#data.x[i] = randomGaussian(0, 1);
      this.#data.y[i] = this.#data.x[i] * r + randomGaussian(0, Math.sqrt(1-sq(r)));
    }
    // パラメータを適用して線形変換する
    this.#data.x = this.#data.x.map((value) => {
      return value * parax.sigma + parax.mu;
    });
    this.#data.y = this.#data.y.map((value) => {
      return value * paray.sigma + paray.mu;
    });
    // スケールを適用する
    this.#set_scales();
    // 統計量を計算する
    this.#calcStats();
  }
  // ----------------- ---- データのプロット：現在のデータをプロットする
  plotData(addMean=false, outLier=-1) {
    push();
    this.#clearArea();
    this.#drawAxis(false);
    stroke(this.#col);
    strokeWeight(this.#size);
    for (let i=0; i<this.#data.n; i++) {
      point(this.#vx(this.#data.x[i]), this.#vy(this.#data.y[i]));
    }
    if (outLier>=0) {
      stroke('red');
      strokeWeight(this.#size+2);
      point(this.#vx(this.#data.x[outLier]), this.#vy(this.#data.y[outLier]));
    }
    if (addMean) this.dispMeanLine();
    pop();
  }
  // ----------------- ---- データのプロット：平均値を示す線を追加する
  dispMeanLine() {
    //this.#stat.mean.x;
    //this.#stat.mean.y;
    push();
    stroke('red');
    strokeWeight(0.5);
    const x = this.#vx(this.#stat.mean.x);
    //line(x, this.#plotArea.y, x, this.#plotArea.y+this.#plotArea.h);
    this.#dashLine(x, this.#plotArea.y, x, this.#plotArea.y+this.#plotArea.h);
    const y = this.#vy(this.#stat.mean.y);
    //line(this.#plotArea.x, y, this.#plotArea.x+this.#plotArea.w, y);
    this.#dashLine(this.#plotArea.x, y, this.#plotArea.x+this.#plotArea.w, y);
    noStroke();
    fill('red');
    textSize(12);
    textAlign(LEFT,TOP);
    text(this.#stat.mean.x.toFixed(2), x+2, this.#plotArea.y+2);
    textAlign(RIGHT,BASELINE);
    text(this.#stat.mean.y.toFixed(2), this.#plotArea.x+this.#plotArea.w-2, y-2);
    pop();
  }
  // ----------------- ---- 指定された絶対座標に近いデータ点を探す
  findData(x, y) {
    // データ近似値に逆変換する
    const tmpx = this.#vxinv(x);
    const tmpy = this.#vyinv(y);
    // さがす
    let d2 = [];
    for (let i=0; i<this.#data.x.length; i++) {
      const d = sq(this.#data.x[i] - tmpx)+sq(this.#data.y[i] - tmpy);
      d2.push(d<0.5 ? d : 10000);
    }
    const mind2 = min(d2)
    const indexMin = (mind2<0.5 ? d2.indexOf(mind2) : -1);
    return indexMin;
  }
  // ----------------- ---- 指定データを除いた仮想相関係数を出す
  virCorrelation(index) {
    let vdata = {x:[], y:[], };
    for (let i=0; i<this.#data.x.length; i++) {
      if (i!=index) {
        vdata.x.push(this.#data.x[i]);
        vdata.y.push(this.#data.y[i]);
      }
    }
    // 相関係数を計算する
    const vvar_x = this.#calc_variance(vdata.x, vdata.x);
    const vvar_y = this.#calc_variance(vdata.y, vdata.y);
    const vcov_xy = this.#calc_variance(vdata.x, vdata.y);
    return (vcov_xy / (sqrt(vvar_x) * sqrt(vvar_y)));
  }
  #dashLine(x1, y1, x2, y2) // 破線を引いてみる＝水平・垂直線のみ
  {
    if (x1 != x2 && y1 == y2) { // 水平線
      if (x1 > x2) {
        let tmp=x2; x2=x1; x1=tmp;
      }
      for (let mx = x1; mx<(x2-3); mx+=5) {
        line(mx, y1, mx+2, y2);
      }
    } else if (x1 == x2 && y1 != y2) { // 垂直線
      if (y1 > y2) {
        let tmp=y2; y2=y1; y1=tmp;
      }
      for (let my = y1; my<(y2-3); my+=5) {
        line(x1, my, x2, my+2);
      }
    } else {
      return null;
    }
    
  }
}

/**
 *  HTML設定の読み込みと広域変数の設定
 =================================================== */
//const optDeci = document.querySelector('#deci_option');
const txtSampleSize = document.querySelector('#sample_size');
function readHtmlSetting() {
  //defParameter.deci = optDeci.value * 1;
  userSampleSize = txtSampleSize.value * 1;
}
// ------------------------- プロット描画ボタン：ボタンが押されるまで何も描画しない
document.querySelector('#btn_draw').addEventListener('click', ()=>{
  readHtmlSetting();
  //optDeci.disabled = true;
  txtSampleSize.disabled = true;
  document.querySelector('#estimate').style.display = 'block';
  document.querySelector('#btn_draw').disabled = true;
  reSetup();
  noLoop();
});
// ------------------------- リセットボタン
document.querySelector('#btn_reset').addEventListener('click', ()=>{
  window.location.reload();
})
// ------------------------- 判定ボタン
document.querySelector('#btn_judge').addEventListener('click', ()=>{
  dispAnswer();
  document.querySelector('#btn_judge').disabled = true;
  reSetTestmode();
  noLoop();
});


/** 
 *  初期化関数
 =================================================== */
// ------------------------- 初期化関数本体
function setup() {
  canvas = createCanvas(canvas_width, canvas_height);
  canvas.parent(document.getElementById('p5'));
  background(canvas_background);
  TestMode = false;
  readHtmlSetting();
  noLoop();
}
// ------------------------- ユーザ設定をうけて再セットアップ
function reSetup() {
  // パラメータの設定：母相関係数を選ぶ＝どうせデータはこの通りの係数にはならない
  defParameter.rho = random(rhoList) * random([-1, 1]);
  // プロッターインスタンス
  xyPlot = new myXYPlotter(0, 0, canvas_height, canvas_height, true, 6, 0);
  const px = {mu:defParameter.mu, sigma:defParameter.sigma, };
  const py = {mu:defParameter.mu, sigma:defParameter.sigma, };
  xyPlot.makeRandomData(defParameter.rho, px, py, userSampleSize);
  xyPlot.plotData(true);
}
// ------------------------- テストモード用のセットアップ
function reSetTestmode() {
  TestMode = true;
  document.querySelector('#aboud_testmode').textContent = '外れ値を除外したときの相関係数を試算できます。外れ値にしたいデータ点をクリックしてください。';
  
}

/** 
 *  描画関数
 =================================================== */
// ------------------------- 描画関数本体
function draw() {
  
}
// ------------------------- 描画関数本体
function mouseClicked() {
  // TestMode でしか動作しないようにする
  if ( !TestMode ) return null;
  if (mouseX < 0 || mouseX >= plotArea.w) return null;
  if (mouseY < 0 || mouseY >= plotArea.h) return null;
  const tmpIndex = xyPlot.findData(mouseX, mouseY);
  let vcor = 0;
  if (tmpIndex>=0) {
    xyPlot.plotData(true, tmpIndex);
    vcor = xyPlot.virCorrelation(tmpIndex);
  }

  push();
  fill('white');
  noStroke();
  rect(testArea.x, testArea.y ,testArea.w, testArea.h);
  fill('black');
  textSize(15);
  textAlign(LEFT, TOP)
  text(`マウス座標：x=${round(mouseX)}, y=${round(mouseY)}`, testArea.x+5, testArea.y+5);
  if (tmpIndex>=0) {
    fill('red');
    text(`データ点[${tmpIndex}]を除外します.`, testArea.x+5, testArea.y+30);
    text(`相関係数 r=${vcor.toFixed(3)}.`, testArea.x+5, testArea.y+55);
  } else {
    text('近くにデータ点はありません.', testArea.x+5, testArea.y+25);
  }
  pop();
}

// ------------------------- 答えを表示する
function dispAnswer() {
  const s = xyPlot.stats;
  const r = document.querySelector('#user_correl').value * 1;
  let msg = [];
  msg.push('このデータの相関係数');
  msg.push('');
  msg.push('　◆あなたの予想');
  msg.push(`　予想 r = ${r}`);
  msg.push('');
  msg.push('　◆正解');
  msg.push(`　正解 r = ${s.cor.toFixed(3)}`);
  msg.push('');
  msg.push('　◆統計情報');
  msg.push('　変数xについて');
  msg.push(`　　平均： ${s.mean.x.toFixed(3)}`);
  msg.push(`　　分散： ${s.cov.x2.toFixed(3)}`);
  msg.push('　変数yについて');
  msg.push(`　　平均： ${s.mean.y.toFixed(3)}`);
  msg.push(`　　分散： ${s.cov.y2.toFixed(3)}`);
  msg.push('　2変数の関連');
  msg.push(`　　共分散： ${s.cov.xy.toFixed(3)}`);
  
  fill('black');
  noStroke();
  textSize(15);
  textAlign(LEFT, BASELINE);
  const x = statArea.x + 10;
  const y = statArea.y + 25;
  for (let i=0; i<msg.length; i++) {
    text(msg[i], x, y+i*20);
  }
  prepairDownload();
}

// ローデータの提供 データダウンロードの準備をする
function prepairDownload() {
  document.querySelector('#download').style.display = 'block';
  document.querySelectorAll('.data_download').forEach((element) => {
    element.addEventListener('click', ()=>{
      const csvData = makeDownloadData(element.id);
      const filename = element.id=='script' ? 'script.r' : `${element.id}.csv`;
      saveCsvFile(csvData, filename);
    });
  });
  // 必要に応じて
  document.querySelector('#stats_data').disabled = true; // 統計データがない
}
// ダウンロードファイルをつくる
function makeDownloadData(id) {
  let data = [];
  switch (id) {
    // ---------------------- ローデータの作成
    case 'raw_data':
      let d = xyPlot.data;
      let dhead = 'X, Y';
      data.push(dhead);
      for (let i=0; i<d.x.length; i++) {
        data.push(`${d.x[i]}, ${d.y[i]}`);
      }
      break;
    // ---------------------- 統計データの作成
    case 'stats_data':
      break;
    // ---------------------- スクリプトの作成
    case 'script':
      data.push('## 相関係数の予想');
      data.push('# データ読み込み');
      data.push('df <- read.csv("raw_data.csv")');
      data.push('head(df)');
      data.push('# ヒストグラムを描く');
      data.push('hist(df$X)');
      data.push('hist(df$Y)');
      data.push('# 散布図を描く');
      data.push('plot(df$X, df$Y)');
      data.push('# 統計量を算出する');
      data.push('apply(df, 2, mean)');
      data.push('apply(df, 2, var)');
      data.push('cov(df$X, df$Y)');
      data.push('cor.test(df$X, df$Y)');
      break;
    default:
      return null;
  }
  data.push('');
  return data.join('\n');
}

