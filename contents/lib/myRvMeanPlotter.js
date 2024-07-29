/**===========================================
 * 確率変数プロッタークラス：複数実現値とその平均値をプロットする
 * 
 * インスタンス作成： plotter = new RvMeanPlotter(name, dist, ...args)
 *  name : 識別子文字列
 *  dist : 分布指定オブジェクト {d, p1, p2} （内部で分布番号が与えられる）
 *    d, p1, p2, n: 分布略号とパラメータ、標本サイズ
 *      N正規(mu,sigma)、Xカイ二乗(df)、T(df)、F(df1,df2)、U連続一様(min,max)
 *  args : 描画指定オブジェクト {str name, num x, y, w, h1, h2, bool axis, col col}
 *    name : 'M' or 'B' 平均ドットプロット、あるいはラインプロット併用
 *    x,y,w,h1,h2 : 描画範囲 絶対座標、ピクセル指定（h1:ドット、h2:ライン）
 *    axis : X軸の描画（Bのみ有効）
 *    col  : 線色および平均点ドット色の指定
 *  setter : scalex(s)  // s = {min, max}; これをもとにスケールを内部で計算
 *           data, data_x // データのセット、生成されたデータの取り出し
 *  getter   name // 名前
 *  method   fillarea() // 表示位置の確認
 *           dispString(type, str, col, size, p='LEFT_TOP') // 任意文字列の表示
 *                type : 描画指定文字 'D' or 'L'
 *                str : 描画したい文字列
 *                col, size: 文字色と文字サイズ
 *                p : アライン指定
 *           generateNewData() // 新しいデータを生成する
 *           appendData(x) // データを１つ追加する：これは指定の値を追加したいときに使う
 *           plotDatas(...args) // データをプロットする
 */

/** -----------------------------------------------
 *  確率変数プロッター
 */
class RvMeanPlotter {
  // ------------------------------------- フィールド変数
  #name;    // 識別名
  #dist = { 
    d:'N',  // 分布略号 U一様,N正規,Xカイ二乗,T,F 英大文字であること
    dn: 0,  // 分布番号
    p1: 0,  // パラメータ　U(min, max), N(mu,sigma), X,T(df), F(df1,df2)
    p2: 1, 
    n : 0,  // 標本サイズ
  };
  #plot = {
    dot: true,    // ドットをプロットするか true 限定
    line: false,  // ラインをプロットするか
  };
  #plotArea = {
    dot: {name:'D', x:0, y:0, w:0, h:0, axis:false, col:0, }, // dot表示枠（都度半透明消去）
    line: {naem:'L', x:0, y:0, w:0, h:0, axis:false, col:0, }, // line表示枠（上書きのみ）識別名、表示枠xywh、軸表示、線色
  };
  #scale  = { 
    min:0, max:0, // 表示範囲 最小値～最大値：整数であること
    x:0, y:0,     // 表示単位 X軸、Y軸
    cx:0, cy:0,   // X軸中心位置、Y軸底位置
  };
  #data;
  #mean;
  #distType = {'N':0, 'X':1, 'T':2, 'F':3, 'U':10, 'C':11, 'D':12};
  #axisDrawn = false;

  // ------------------------------------- コンストラクタ
  constructor(name, dist, args) {
    this.#name = name;
    this.#setDist(dist);
    this.#data = [];
    this.#mean = [];
    if (args.length > 0) {
      args.forEach((arg) => { this.#setCanvas(arg); });
      return args.length;
    } else {
      return 0;
    }
  }

  // ------------------------------------- セッター、ゲッター
  // データをセットする、取得する
  set data(d) {
    this.#data = d;
  }
  get data_x() {
    return this.#data;
  }
  get lastdata() {
    return this.#data.at(-1);
  }
  // 軸を設定する：エリアがどちらも設定されていないと無効になる
  set scalex(s) {
    this.#scale.min = round(s.min);
    this.#scale.max = round(s.max);
    let ref;
    if (this.#plot.dot) {
      ref = this.#plotArea.dot;
    } else if (this.#plot.line) {
      ref = this.#plotArea.line;
    }
    // X軸単位とゼロ位置（絶対位置）
    this.#scale.x = ref.w / (this.#scale.max - this.#scale.min);
    this.#scale.cx = ref.x - this.#scale.min * this.#scale.x;
  }
  // お名前は？
  get name() {
    return this.#name;
  }
  // ------------------------------------- 動作確認用
  // 描画領域確認
  fillarea() {
    push();
    strokeWeight(3);
    fill('yellow');
    if (this.#plot.dot) {
      stroke('green');
      rect(this.#plotArea.dot.x, this.#plotArea.dot.y, this.#plotArea.dot.w, this.#plotArea.dot.h);
      this.dispString('M', 'dotMean:'+this.#name, 'green', 10);
    }
    if (this.#plot.line) {
      stroke('red');
      rect(this.#plotArea.line.x, this.#plotArea.line.y, this.#plotArea.line.w, this.#plotArea.line.h);
      this.dispString('B', 'meanLine:'+this.#name, 'red', 12);
    }
    pop();
  }
  #ca(s)   // 文字列表記パラメータの変換
  {
    switch (s) {
      case 'LEFT':    return LEFT;
      case 'RIGHT':   return RIGHT;
      case 'CENTER':  return CENTER;
      case 'TOP':     return TOP;
      case 'BOTTOM':  return BASELINE;
      default:        return LEFT;
    }
  }
  // 任意の文字列表記
  dispString(type, str, col, size, p='LEFT_TOP') {
    // 引数 p を解析する
    const pos_str = ['LEFT', 'RIGHT', 'TOP', 'BOTTOM', 'CENTER'];
    const pos = p.toUpperCase(p).split('_');
    const pset = this.#plotArea.line;
    if (pos_str.indexOf(pos[0]) < 0) return null;
    if (pos_str.indexOf(pos[1]) < 0) return null;
    // 表示設定
    push();
    textAlign(this.#ca(pos[0]), this.#ca(pos[1]));
    noStroke();
    fill(col);
    textSize(size);
    // 表示位置設定
    let xy = {x:pset.x, y:pset.y};
    if (pos[0]=='RIGHT') xy.x += pset.w;
    else if (pos[0]=='CENTER') xy.x += pset.w / 2;
    if (pos[1]=='BOTTOM') xy.y += pset.h-1;
    else if (pos[1]=='CENTER') xy.y += pset.h / 2;
    text(str, xy.x, xy.y);
    pop();
  }
  // ------------------------------------- グローバル関数：描画関係
  // 新しいデータを生成する 乱数を生成させるときに使う X,T,F では jStat ライブラリ必須
  generateNewData() {
    let x = new Array(this.#dist.n).fill(0);
    switch(this.#dist.dn) {
      case 0:   // Standard Normal
        for (let i=0; i<this.#dist.n; i++)
          x[i] = randomGaussian(this.#dist.p1, this.#dist.p2);
        break;
      case 1:   // X(chi) squared
        for (let i=0; i<this.#dist.n; i++)
          x[i] = jStat.chisquare.sample(this.#dist.p1);
        break;
      case 2:   // Student t
        for (let i=0; i<this.#dist.n; i++)
          x[i] = jStat.studentt.sample(this.#dist.p1);
        break;
      case 3:   // F
        for (let i=0; i<this.#dist.n; i++)
          x[i] = jStat.centralF.sample(this.#dist.p1, this.#dist.p2);
        break;
      case 10:  // Uni
        for (let i=0; i<this.#dist.n; i++)
          x[i] = random(this.#dist.p1, this.#dist.p2);
        break;
    }
    const newIndex = this.#mean.length;
    this.#mean[newIndex] = 0;
    x.forEach((value) => {
      this.#mean[newIndex] += value;
    });
    this.#mean[newIndex] /= x.length;
    this.#data[newIndex] = x;
    return this.#mean[newIndex];
  }
  // データを１つ追加する：これは指定の値を追加したいときに使う
//  appendData(x) {
//    this.#data.push(x);
//  }
  // データをプロットする：type変数によって呼び出す関数を変える：ここは動的プロット
  plotDatas(...args) {
    push();
    let pset;
    if (this.#plot.dot) {
      pset = this.#plotArea.dot;
      this.#plotDots(pset);
    }
    if (this.#plot.line) {
      pset = this.#plotArea.line;
      if (pset.axis & (!this.#axisDrawn)) {
        this.#drawXaxis(pset);
        this.#axisDrawn = true;
      }
      this.#plotLines(pset);
    }
    pop();
  }
  // ------------------------------- プライベート関数：描画関連＝typeによって呼び分ける
  #drawXaxis(pset) // X軸を描画する：LINEから呼ばれる 
  {
    noStroke();
    fill(0);
    textSize(10);
    textAlign(CENTER, TOP);
    const y = pset.y+pset.h-9;
    for (let x = this.#scale.min; x<=this.#scale.max; x++) {
      text(x, this.#cx(x), y);
    }
  }
  // データをドットプロットする：type==0:DOTのみ
  #plotDots(pset) 
  {
    fill(255, 60);
    noStroke();
    rect(pset.x, pset.y, pset.w, pset.h);

    const index = this.#mean.length - 1;
    const x = this.#data[index];
    const m = this.#mean[index];
    const y = pset.y + pset.h/2;
    // データベクトル：グレー
    stroke(60);
    strokeWeight(9);
    for (let i=0; i<x.length; i++) {
      point(this.#cx(x[i]), y);
    }
    // 最小値と最大値をむすぶ線：グレー細線
    strokeWeight(0.5);
    line(this.#cx(min(x)), y, this.#cx(max(x)), y);
    // 平均値：赤
    stroke('red');
    strokeWeight(15);
    point(this.#cx(m), y);
  }
  // データをラインプロットする：type==1:LINEのみ：
  // 軸表示をONにしたとき、表示エリアの下側10pxが軸の表示に使われる
  #plotLines(pset) 
  {
    stroke(pset.col);
    strokeWeight(0.5);
    const index = this.#mean.length - 1;
    const m = this.#mean[index];
    line(this.#cx(m), pset.y, this.#cx(m), pset.y + pset.h - (pset.axis ? 10 : 0));
  }
  // X座標軸の変換
  #cx(x, cx=this.#scale.cx) 
  { 
    return (cx + x * this.#scale.x); 
  }
  // 確率分布とパラメータの設定
  #setDist(dist)
  {
    this.#dist.d = dist.d.toUpperCase();
    this.#dist.p1 = dist.p1;
    this.#dist.p2 = dist.p2;
    this.#dist.dn = this.#distType[this.#dist.d]
    this.#dist.n = dist.n;
  }
  // タイプ設定：規定値はドット、ライン（['DOT','LINE']）
  #setCanvas(pset) 
  {
    let pa;
    this.#plot.dot = true;
    this.#plotArea.dot.x = pset.x;
    this.#plotArea.dot.y = pset.y;
    this.#plotArea.dot.w = pset.w;
    this.#plotArea.dot.h = pset.h1;
    this.#plotArea.dot.col = pset.col;
    pa = this.#plotArea.dot;
    if (pset.name.toUpperCase() == 'B') {
      this.#plot.line = true;
      this.#plotArea.line.x = pset.x;
      this.#plotArea.line.y = pset.y + pset.h1;
      this.#plotArea.line.w = pset.w;
      this.#plotArea.line.h = pset.h2;
      this.#plotArea.line.axis = pset.axis;
      this.#plotArea.line.col = pset.col;
      pa = this.#plotArea.line;
    }
    // とりあえず指定範囲を消しておく
    push();
    noStroke();
    fill(255);
    rect(pa.x, pa.y, pa.w, pa.h);
    pop();
  }
}

