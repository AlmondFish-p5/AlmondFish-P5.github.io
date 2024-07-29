/**
 *  相関係数あてゲーム correlation.js
 ======================================================*/ 
// 2次元プロットクラス
let xyPlot;

// 母相関係数はここから選ぶことにする
const rhoList = [0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65];
const betaList = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

let userCoefSelect;
let userRequest = {term : '相関係数', coef : 0, };

let editMode = false;

// その他の広域変数
let canvas;
const canvas_width  = 900;
const canvas_height = 600;
const canvas_background = 'white';
const plotArea = {x:0, y:0, w:canvas_height, h:canvas_height, };
const statArea = {x:plotArea.w, y:0, w:canvas_width-plotArea.w, h:plotArea.h, };
const infoArea = {x:620, y:450, w:580, h:150, };


/** 回帰係数クラス myRegCoef
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

/** 回帰クラス myRegression
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

/** 二次元平面プロッター myXYPlotter
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
  #grid = {grid : false, size: 0, col: 128, };
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
  set scales(s) { // --- # XYスケール強制割当：既存設定上書き
    this.#set_scales(s.min, s.max);
  }
  set grid(size) { // -- # グリッド表示の設定
    if (size==0) {
      this.#grid.grid = false;
    } else {
      this.#grid.grid = true;
      this.#grid.size = size;
    }
  }
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
    this.calcStats();
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
  #set_scales(dmin = null, dmax= null )
  {
    // Xを処理する
    this.#scale.x.min = (dmin==null ? floor(min(this.#data.x))-2 : dmin);
    this.#scale.x.max = (dmax==null ? ceil(max(this.#data.x))+2 : dmax);
    this.#scale.x.scale = this.#plotArea.w / (this.#scale.x.max - this.#scale.x.min);
    this.#scale.x.origin = this.#plotArea.x - this.#scale.x.scale * this.#scale.x.min;
    // Yを処理する
    this.#scale.y.min = (dmin==null ? floor(min(this.#data.y))-2 : dmin);
    this.#scale.y.max = (dmax==null ? ceil(max(this.#data.y))+2 : dmax);
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
  // ---------------------- 現在のデータの統計量を計算する
  calcStats() {
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
    this.calcStats();
  }
  // ----------------- ---- データのプロット：現在のデータをプロットする
  plotData(addMean=false, outLier=-1) {
    push();
    this.#clearArea();
    this.#drawAxis(false);
    if (this.#grid.grid) this.#drawGrid();
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
    //const x = this.#vx(this.#stat.mean.x);
    //line(x, this.#plotArea.y, x, this.#plotArea.y+this.#plotArea.h);
    //this.#dashLine(x, this.#plotArea.y, x, this.#plotArea.y+this.#plotArea.h);
    this.#vline(this.#vx(this.#stat.mean.x), 1);
    //const y = this.#vy(this.#stat.mean.y);
    //line(this.#plotArea.x, y, this.#plotArea.x+this.#plotArea.w, y);
    //this.#dashLine(this.#plotArea.x, y, this.#plotArea.x+this.#plotArea.w, y);
    this.#hline(this.#vy(this.#stat.mean.y), 1);
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
      d2.push(d<0.5 ? d : 100);
    }
    const mind2 = min(d2)
    const indexMin = (mind2<0.5 ? d2.indexOf(mind2) : -1);
    return indexMin;
  }
  // ----------------- ---- 指定された絶対座標に近いデータ点を追加する
  addData(x, y) {
    // データ近似値に逆変換する
    const dx = round(this.#vxinv(x),2);
    const dy = round(this.#vyinv(y),2);
    this.#data.x.push(dx);
    this.#data.y.push(dy);
    this.#data.n = this.#data.x.length;
    this.plotData();
    return {x:dx, y:dy, index:this.#data.n-1, n:this.#data.n, };
  }
  removeData(x, y) {
    // データ点を探す
    const index = this.findData(x, y);
    const dx = (index > 0 ? this.#data.x[index] : -1); 
    const dy = (index > 0 ? this.#data.y[index] : -1); 
    if (index >= 0) { // 見つからない時は何もしない
      this.#data.x.splice(index, 1);
      this.#data.y.splice(index, 1);
      this.#data.n = this.#data.x.length;
    }
    this.plotData();
    return {x:dx, y:dy, index:index, n:this.#data.n, };
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
  #vline(x, type=0)         // x 位置に垂直線を引く
  {
    if (type==0) { // 実線
      line(x, this.#plotArea.y, x, this.#plotArea.y+this.#plotArea.h);
    } if (type==1) {  // 破線
      this.#dashLine(x, this.#plotArea.y, x, this.#plotArea.y+this.#plotArea.h);
    }
  }
  #hline(y, type=0)         // x 位置に垂直線を引く
  {
    if (type==0) { // 実線
      line(this.#plotArea.x, y, this.#plotArea.x+this.#plotArea.w, y);
    } if (type==1) {  // 破線
      this.#dashLine(this.#plotArea.x, y, this.#plotArea.x+this.#plotArea.w, y);
    }
  }
  // ---- ---- グリッドを表示する：中心からsize*scale間隔
  #drawGrid() 
  {
    stroke(this.#grid.col);
    strokeWeight(0.4);
    const xc = round((this.#scale.x.max - this.#scale.x.min) / 2);
    for (let x=xc; x<this.#scale.x.max; x+=this.#grid.size) {
      this.#vline(this.#vx(x), (x==xc ? 0 : 1));
      if (x!=xc) this.#vline(this.#vx(xc*2 - x), 1);
    }
    const yc = round((this.#scale.y.max - this.#scale.y.min) / 2);
    for (let y=yc; y<this.#scale.y.max; y+=this.#grid.size) {
      this.#hline(this.#vy(y), (y==yc ? 0 : 1));
      if (y!=yc) this.#hline(this.#vy(yc*2 - y), 1);
    }
  }
}

/**
 *  HTML設定の読み込みと広域変数の設定
 =================================================== */
// ------------------------- ゲーム開始ボタン
document.querySelector('#btn_start').addEventListener('click', ()=>{
  document.querySelector('#btn_judge').disabled = false;
  document.querySelector('#btn_start').disabled = true;
  const req_elem = document.querySelector('#coef_request');
  req_elem.style.backgroundColor = '#ffc';
  req_elem.style.borderColor = '#f63';
  req_elem.style.display = 'block';
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
  noLoop();
}

// ------------------------- ユーザ設定をうけて再セットアップ
function reSetup() {
  // パラメータの設定：母相関係数を選ぶ＝どうせデータはこの通りの係数にはならない
  userRequest.coef = random(rhoList) * random([-1, 1]);
  document.querySelector('#coef_request').innerHTML = `【課題】&nbsp;<strong>相関係数が <span style="font-size:1.2rem; color:#f03;">${userRequest.coef} </span>になるように、データ点をプロットしてください。</strong><br />（クリックでデータ点を追加、ctrl+クリックでデータ点を削除します。）`;
  // プロッターインスタンス
  xyPlot = new myXYPlotter(0, 0, canvas_height, canvas_height, true, 6, 0);
  xyPlot.scales = {min: 0, max: 10, };
  xyPlot.grid = 2;
  xyPlot.plotData();
  editMode = true;
}

/** 
 *  描画関数
 =================================================== */
// ------------------------- 描画関数本体
function draw() {
  
}
// ------------------------- 描画関数本体
function mouseClicked(event) {
  // editMode でしか動作しないようにする
  if (!editMode) return null;
  if (mouseX < 0 || mouseX >= plotArea.w) return null;
  if (mouseY < 0 || mouseY >= plotArea.h) return null;
  let tmpData;
  let msg = [];
  if (event.ctrlKey) {  // データ点削除
    tmpData = xyPlot.removeData(mouseX, mouseY);
    dMode = '削除';
    if (tmpData.index > 0) {
      msg[0] = `データID[${tmpData.index}]を削除.`
      msg[1] = `x=${tmpData.x}, y=${tmpData.y}`;
    } else {
      msg[0] = 'クリックした付近にデータ点が見つかりません。';
      msg[1] = '';
    }
  } else {              // データ点追加
    tmpData = xyPlot.addData(mouseX, mouseY);
    dMode = '追加';
    msg[0] = `データID[${tmpData.index}]を追加.`
    msg[1] = `x=${tmpData.x}, y=${tmpData.y}`;
  }
  msg[2] = `現在のデータ数：${tmpData.n}`;

  push();
  fill('white');
  noStroke();
  rect(infoArea.x, infoArea.y ,infoArea.w, infoArea.h);
  fill('black');
  textSize(15);
  textAlign(LEFT, TOP)
  text(msg[0], infoArea.x, infoArea.y);
  text(msg[1], infoArea.x, infoArea.y+20);
  text(msg[2], infoArea.x, infoArea.y+40);
  pop();
}

// ------------------------- 答えを表示する
function dispAnswer() {
  editMode = false;
  xyPlot.calcStats();
  const s = xyPlot.stats;
  let msg = [];
  msg.push('このデータの相関係数');
  msg.push('');
  msg.push('　◆プログラムの指定');
  msg.push(`　指定 r = ${userRequest.coef}`);
  msg.push('');
  msg.push('　◆作成されたデータ');
  msg.push(`　相関係数 r = ${s.cor.toFixed(3)}`);
  msg.push('');
  msg.push('　変数x');
  msg.push(`　　平均： ${s.mean.x.toFixed(3)}`);
  msg.push(`　　分散： ${s.cov.x2.toFixed(3)}`);
  msg.push('　変数y');
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

