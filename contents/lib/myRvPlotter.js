/**===========================================
 * 確率変数プロッタークラス
 * 
 * インスタンス作成： plotter = new RvPlotter(name, dist, ...args)
 *  name : 識別子文字列
 *  dist : 分布指定オブジェクト {d, p1, p2} （内部で分布番号が与えられる）
 *    d, p1, p2: 分布略号とパラメータ
 *      N正規(mu,sigma)、Xカイ二乗(df)、T(df)、F(df1,df3)
 *      U連続一様(min,max)、Cベルヌーイ(prob)、Dサイコロ(min,max)
 *  args : 描画指定オブジェクト {name:'D', x:0, y:0, w:0, h:0, axis:false, col:0,}
 *    name : 'D' or 'L' ドットプロット、ラインプロット、両方の指定可
 *    x,y,w,h : 描画範囲 絶対座標、ピクセル指定
 *    axis : X軸の描画（Lのみ有効）
 *    col  : 線色の指定（Lのみ有効）
 *  プロパティ : set scalex(s)  // s = {min, max}; これをもとにスケールを内部で計算
 *            set data, get data_x // データのセット、生成されたデータの取り出し
 *            get name // 名前
 *  メソッド    fillarea() // 表示位置の確認
 *            dispString(type, str, col, size, p='LEFT_TOP') // 任意文字列の表示
 *                type : 描画指定文字 'D' or 'L'
 *                str : 描画したい文字列
 *                col, size: 文字色と文字サイズ
 *                p : アライン指定
 *            generateNewData() // 新しいデータを生成する
 *            appendData(x) // データを１つ追加する：これは指定の値を追加したいときに使う
 *            plotDatas(...args) // データをプロットする
 */

/** -----------------------------------------------
 *  確率変数プロッター
 */
class RvPlotter {
  // ------------------------------------- フィールド変数
  #name;    // 識別名
  #dist = { 
    d:'N',  // 分布略号 U一様,N正規,Xカイ二乗,T,F 英大文字であること
    dn: 0,  // 分布番号
    p1: 0,  // パラメータ　U(min, max), N(mu,sigma), X,T(df), F(df1,df2)
    p2: 1, 
  };
  #plot = {
    dot: false,   // ドットをプロットするか
    line: false,  // ラインをプロットするか
  };
  #plotArea = {
    dot: {name:'D', x:0, y:0, w:0, h:0, axis:false, col:0, }, // dot表示枠（都度書き直し）
    line: {naem:'L', x:0, y:0, w:0, h:0, axis:false, col:0, }, // line表示枠（上書きのみ）識別名、表示枠xywh、軸表示、線色
  };
  #scale  = { 
    min:0, max:0, // 表示範囲 最小値～最大値：整数であること
    x:0, y:0,     // 表示単位 X軸、Y軸
    cx:0, cy:0,   // X軸中心位置、Y軸底位置
  };
  #data;
  #distType = {'N':0, 'X':1, 'T':2, 'F':3, 'U':10, 'C':11, 'D':12};
  #axisDrawn = false;
  #axisStr = [];

  // ------------------------------------- コンストラクタ
  constructor(name, dist, args) {
    this.#name = name;
    this.#setDist(dist);
    this.#data = [];
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
  set axisStr(a) {  // X軸目盛り文字列の指定
    this.#axisStr = a;
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
      this.dispString('D', 'dot:'+this.#name, 'green', 10);
    }
    if (this.#plot.line) {
      stroke('red');
      rect(this.#plotArea.line.x, this.#plotArea.line.y, this.#plotArea.line.w, this.#plotArea.line.h);
      this.dispString('L', 'line:'+this.#name, 'red', 12);
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
  generateNewData(integer=false) {
    let x = 0;
    switch(this.#dist.dn) {
      case 0:   // Standard Normal
        x = randomGaussian(this.#dist.p1, this.#dist.p2);
        break;
      case 1:   // X(chi) squared
        x = jStat.chisquare.sample(this.#dist.p1);
        break;
      case 2:   // Student t
        x = jStat.studentt.sample(this.#dist.p1);
        break;
      case 3:   // F
        x = jStat.centralF.sample(this.#dist.p1, this.#dist.p2);
        break;
      case 10:  // Uni
        x = random(this.#dist.p1, this.#dist.p2);
        break;
      case 11:   // Coin
        x = random(0, 1) < this.#dist.p1 ? 1 : 0;
        break;
      case 12:   // Dice
        x = Math.floor(random(this.#dist.p1, this.#dist.p2+1));
        break;
    }
    if (integer) x = round(x);
    this.#data.push(x);
    return x;
  }
  // データを１つ追加する：これは指定の値を追加したいときに使う
  appendData(x) {
    this.#data.push(x);
  }
  // データをプロットする：type変数によって呼び出す関数を変える：ここは動的プロット
  plotDatas() {
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
    const x = this.#scale.min;
    if (this.#axisStr.length == 0) {
      for (let x = this.#scale.min; x<=this.#scale.max; x++) {
        this.#axisStr.push(x.toString());
      }
    }
    for (let i=0; i<this.#axisStr.length; i++) {
      text(this.#axisStr[i], this.#cx(this.#scale.min+i), y);
    }
  }
  // データをドットプロットする：type==0:DOTのみ
  #plotDots(pset) 
  {
    fill(255);
    noStroke();
    rect(pset.x, pset.y, pset.w, pset.h);

    const start_index = max(0, this.#data.length - 10);
    const y = pset.y + pset.h/2;
    let j = 0;
    for (let i=start_index; i<this.#data.length; i++) {
      if (j==9) {
        stroke('red');
      } else {
        stroke(192 - j * 16);
      }
      strokeWeight(j + 3);
      const x = this.#cx(this.#data[i]);
      // この if は表示領域からはみ出して赤いドットが描かれないための設定
      if (pset.x+6 < x && x < pset.x+pset.w-6) point(x, y);
      j++;
    }
    /** // ドットの色設定
    this.#plotArea[t].inter.bw = [12,11,10,9,8,7,6,5,4,3];
    this.#plotArea[t].inter.bd = ['red',64,80,96,112,128,144,160,176,192]; */
  }
  // データをラインプロットする：type==1:LINEのみ：
  // 軸表示をONにしたとき、表示エリアの下側10pxが軸の表示に使われる
  #plotLines(pset) 
  {
    stroke(pset.col);
    strokeWeight(0.5);
    const i = this.#data.length - 1;
    const x = this.#cx(this.#data[i]);
    if (x < pset.x+pset.w) line(x, pset.y, x, pset.y + pset.h - (pset.axis ? 10 : 0));
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
  }
  // タイプ設定：規定値はドット、ライン（['DOT','LINE']）
  #setCanvas(pset) 
  {
    let pa;
    if (pset.name.toUpperCase() == 'D') {
      this.#plot.dot = true;
      this.#plotArea.dot.x = pset.x;
      this.#plotArea.dot.y = pset.y;
      this.#plotArea.dot.w = pset.w;
      this.#plotArea.dot.h = pset.h;
      pa = this.#plotArea.dot;
    } else if (pset.name.toUpperCase() == 'L') {
      this.#plot.line = true;
      this.#plotArea.line.x = pset.x;
      this.#plotArea.line.y = pset.y;
      this.#plotArea.line.w = pset.w;
      this.#plotArea.line.h = pset.h;
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

