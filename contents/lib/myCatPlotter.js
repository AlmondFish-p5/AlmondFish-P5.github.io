/**===========================================
 * 離散的確率変数プロッタークラス
 * 
 * インスタンス作成： plotter = new CatPlotter(name, dist, ...args)
 *  name : 識別子文字列
 *  dist : 分布指定オブジェクト {d, p1, p2} （内部で分布番号が与えられる）
 *    d, p1, p2: 分布略号とパラメータ Cベルヌーイ(prob)、Dサイコロ()
 *  args : 描画指定オブジェクト {name:'D', x:0, y:0, w:0, h:0, axis:false, col:0,}
 *    name : 'D' or 'L' or 'B' ドットプロット、ラインプロット、バープロット
 *    x,y,w,h : 描画範囲 絶対座標、ピクセル指定
 *    axis : X軸の描画（Lのみ有効）
 *    col  : 線色の指定（Lのみ有効）
 *  プロパティ : set scalex(s)  // s = {min, max}; これをもとにスケールを内部で計算
 *                このときminは、考えられる実現値のうち最小の値を表示してほしい横軸位置
 *                であり、maxは、同じく最大の値を表示してほしい横軸位置。ともに絶対座標。
 *                この幅に表示がおさまるように、max-min, カテゴリ数をもとに内部で計算する。
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
class CatPlotter {
  // ------------------------------------- フィールド変数
  #name;    // 識別名
  #dist = { 
    d   :'C',  // 分布略号 Cコイン、Dダイス
    dn  : 11, // 分布番号
    p1  : 0,  // パラメータ　C:(prob), D:(1,6):パラメータ固定
    //p2  : 1,
    n   : 1,  // 試行回数＝これに合わせて表示カテゴリ数を計算
    cn  : 0,
    lbl : [],
  };
  #plot = {
    dot:  false,   // ドットをプロットするか
    line: false,   // ラインをプロットするか
    bar:  false,   // バープロットを描くか
  };
  #plotArea = {
    dot: {name:'D', x:0, y:0, w:0, h:0, axis:false, col:0, }, // dot表示枠（都度書き直し）
    line: {name:'L', x:0, y:0, w:0, h:0, axis:false, col:0, }, // line表示枠（上書きのみ）識別名、表示枠xywh、軸表示、線色
    bar: {name:'B', x:0, y:0, w:0, h:0, axis:true, col:0, }, //
  };
  #scale  = { 
    min:0, max:0, // 表示範囲 最小値～最大値：整数であること
    x:[], xc:[], y:0,    // 表示単位 X軸（length=カテゴリ数、左端および中心）、Y軸
    xw:0, yc:0, yf:0,   // X軸表示幅、Y軸中心位置（ドット位置）、Y軸底位置（ライン下部）
  };
  #data;
  #distType = {'C':11, 'D':12, };
  #axisDrawn = false;

  // ------------------------------------- コンストラクタ
  constructor(name, dist, args) {
    this.#name = name;
    this.#setDist(dist);
    this.#data = [];
    if (args.length > 0) {
      args.forEach((arg) => { 
        this.#setCanvas(arg); 
      });
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
  // 軸を設定する：s{left:num, cat:num, width:num, space:num} 
  // x:もっとも左のX座標位置 c:カテゴリ数 w:1カテゴリ幅 s:カテゴリ間スペース
  set scalex(setting) {
    this.#scale.cn = setting.cat;
    this.#scale.xw = setting.width;
    this.#scale.x  = new Array(this.#scale.cn).fill(0).map((value,index)=>{
      return setting.left + (setting.width + setting.space) * index;
    });
    this.#scale.xc  = new Array(this.#scale.cn).fill(0).map((value,index)=>{
      return setting.left + (setting.width + setting.space) * index + setting.width/2;
    });
    if (this.#plot.dot) {   // これはドットの中心Ｙ座標 y-center
      this.#scale.yc = this.#plotArea.dot.y + this.#plotArea.dot.h / 2;
    } 
    if (this.#plot.line) {  // これはラインの下側Ｙ座標 y-floor
      this.#scale.yf = this.#plotArea.line.y + this.#plotArea.line.h - (this.#plotArea.line.axis ? 10 : 0);
    } 
    /** この設定はかっこいいのだが、コイン1枚に対して3つのカテゴリを設定したいので却下
    // 表示領域の両端指定：plotArea よりも狭い範囲を指定しているはず
    this.#scale.min = s.min;
    this.#scale.max = s.max;
    // 本来のカテゴリ数より1大きい数で割ったものを1カテゴリ分の表示幅とする
    this.#scale.xw = (this.#scale.max - this.#scale.min) / (this.#dist.cn + 1);
    // width 1つ分を均等に割り振って実現値間の間隔とする
    const xinter = this.#scale.xw / (this.#dist.cn - 1);
    // this.#scale.n の数だけ this.#scale.x = [] を設定：絶対座標
    // これはラインの書き始めX座標
    this.#scale.x = new Array(this.#dist.cn).fill(0);
    for (let i=0; i<this.#dist.cn; i++) {
      this.#scale.x[i] = (this.#scale.xw + xinter)*i + this.#scale.min;
      this.#scale.xc[i] = (this.#scale.xw + xinter)*i + this.#scale.min + this.#scale.xw / 2;
    }
    // this.#scale.yはカテゴリごとの最大度数をもとに、プロット表示関数で計算する
    */
  }
  // スケール設定の xc だけを返す
  get scalexc() {
    return this.#scale.xc;
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
    if (this.#plot.bar) {
      stroke('blue');
      rect(this.#plotArea.bar.x, this.#plotArea.bar.y, this.#plotArea.bar.w, this.#plotArea.bar.h);
      this.dispString('B', 'bar:'+this.#name, 'blue', 12);
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
  // 新しいデータを生成する
  generateNewData() {
    let x = 0;
    switch(this.#dist.dn) {
      case 11:   // Coin
        for (let i=0; i<this.#dist.n; i++) {
          x += (random(0, 1) < this.#dist.p1 ? 1 : 0);
        }
        //x = random(0, 1) < this.#dist.p1 ? 1 : 0;
        break;
      case 12:   // Dice
        x = Math.floor(random(1, 7));
        break;
    }
    this.#data.push(x);
    return x;
  }
  // データを１つ追加する：これは指定の値を追加したいときに使う
  appendData(x) {
    this.#data.push(x);
  }
  // バープロットを描く：基本的に1回しか呼ばない。描き直すときは引数 erase=true
  drawBarPlot(erase = false, dispprob = false) {
    const pset = this.#plotArea.bar;
    // 領域を消す
    if (erase) {
      fill(255);
      noStroke();
      rect(pset.x, pset.y, pset.w, pset.h);
    }
    // 確率計算
    let prob = [];
    if (this.#dist.d=='C') {
      for (let i=0; i<=this.#dist.n; i++) {
        prob[i] = jStat.binomial.pdf(i, this.#dist.n, this.#dist.p1);
      }
    } else if (this.#dist.d=='D') {
      prob = [1/6, 1/6, 1/6, 1/6, 1/6, 1/6];
    }
    // Y座標の設定 1 に対応するピクセル数
    this.#scale.y = (pset.h-12) / (this.#dist.d=='C' ? max(prob)+0.1 : 0.4);
    this.#drawYaxis(pset);
    this.#drawXaxis(pset);
    stroke('black');
    strokeWeight(0.5);
    fill(255);
    for (let i=0; i<this.#dist.cn; i++) {
      rect(this.#scale.x[i], pset.y+pset.h-10, this.#scale.xw, this.#scale.y * prob[i] * -1);
    }
    if (dispprob) {
      noStroke();
      fill(0);
      textSize(10);
      textAlign(CENTER, BASELINE);
      for (let i=0; i<this.#dist.cn; i++) {
        text(prob[i].toFixed(3), this.#scale.xc[i], pset.y+(pset.h-10)-this.#scale.y * prob[i]-2);
      }
      
    }
  }
  // Y軸を描画する：基本、drawBarplotからしか呼ばれない
  #drawYaxis(pset)
  {
    stroke('black');
    strokeWeight(0.5);
    // 縦線
    line(pset.x + 35, pset.y, pset.x + 35, pset.y + pset.h - 10);
    // 目盛り
    textAlign(RIGHT, CENTER);
    textSize(10);
    fill(0);
    noStroke();
    let y = pset.y + pset.h - 10;
    for (let i=0; i<10; i++) {
      text(i/10, pset.x + 30, y);
      y -= this.#scale.y / 10;
      if (y < (pset.y+10)) break;
    }
  }
  // データをプロットする：type変数によって呼び出す関数を変える：ここは動的プロット
  plotDatas(datalabel = false, prob = false) {
    push();
    let pset;
    if (this.#plot.dot) {
      pset = this.#plotArea.dot;
      this.#plotDots(pset);
    }
    if (this.#plot.line) {
      pset = this.#plotArea.line;
      this.#plotLines(pset, datalabel, prob);
    }
    pop();
  }
  // ------------------------------- プライベート関数：描画関連＝typeによって呼び分ける
  #drawXaxis(pset, marking = true) // X軸を描画する：LINE,BARから呼ばれる 
  {
    stroke('black');
    strokeWeight(0.5);
    line(pset.x, pset.y+pset.h-(marking ? 10 : 0), pset.x + pset.w, pset.y+pset.h-(marking ? 10 : 0));
    if (marking) {
      noStroke();
      fill(0);
      textSize(10);
      textAlign(CENTER, TOP);
      for (let i=0; i<this.#dist.cn; i++) {
        text(this.#dist.lbl[i], this.#scale.xc[i], pset.y + pset.h - 9);
      }
    }
  }
  // データをドットプロットする：type==0:DOTのみ
  #plotDots(pset) 
  {
    fill(255);
    noStroke();
    rect(pset.x, pset.y, pset.w, pset.h);
    const start_index = max(0, this.#data.length - 3);
    let j = 0;
    for (let i=start_index; i<this.#data.length; i++) {
      if (j==2) {
        stroke('red');
      } else {
        stroke(192 - j * 24);
      }
      strokeWeight(j*2 + 8);
      point(this.#scale.xc[this.#data[i]], this.#scale.yc);
      j++;
    }
  }
  // データをラインプロットする：type==1:LINEのみ：
  // 軸表示をONにしたとき、表示エリアの下側10pxが軸の表示に使われる
  #plotLines(pset, datalabel, prob) 
  {
    // 領域を消してから
    fill(255);
    noStroke();
    rect(pset.x, pset.y, pset.w, pset.h);
    this.#drawXaxis(pset, pset.axis);
    // カテゴリごとに度数を計算する
    let freq = new Array(this.#dist.cn).fill(0);
    this.#data.forEach((value) => {
      freq[value - (this.#dist.d=='D' ? this.#dist.n : 0)]++;
    });
    if (max(freq) <= this.#plotArea.line.h * 0.8) {
      this.#scale.y = 1;
    } else {
      this.#scale.y = (this.#plotArea.line.h - (this.#plotArea.line.axis ? 10 : 0)) / (max(freq) * 1.2);
    }
    fill(pset.col);
    noStroke();
    for (let i=0; i<freq.length; i++) {
      rect(this.#scale.x[i], this.#scale.yf, this.#scale.xw, this.#scale.y * freq[i] * -1);
    }
    if (datalabel) {
      let fsum = 0;
      freq.forEach((value) => { 
        fsum += value;
      });
      fill(0);
      noStroke();
      textAlign(CENTER, BASELINE);
      textSize(10);
      for (let i=0; i<freq.length; i++) {
        text((prob ? (freq[i]/fsum).toFixed(3) : freq[i]), this.#scale.xc[i], this.#scale.yf - this.#scale.y * freq[i] - 2);
      }
    }
  }
  // X座標軸の変換
  #cx(x, cx=this.#scale.cx) 
  { 
    return (cx + x * this.#scale.x); 
  }
  // 確率分布とパラメータの設定、ラベルは C:0,1 D:1,2,3,4,5,6
  #setDist(dist)
  {
    this.#dist.d = dist.d.toUpperCase();
    this.#dist.p1 = dist.p1;
    this.#dist.dn = this.#distType[this.#dist.d];
    this.#dist.n = dist.n;
    this.#dist.cn = (this.#dist.d=='C' ? 1 : 5) * this.#dist.n + 1;
    this.#dist.lbl = new Array(this.#dist.cn).fill('').map((value, index)=>{
      return `${index+(this.#dist.d=='D' ? this.#dist.n : 0)}`;
    });
  }
  // タイプ設定：規定値はライン、バー（['LINE', 'BAR']）
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
    } else if (pset.name.toUpperCase() == 'B') {
      this.#plot.bar = true;
      this.#plotArea.bar.x = pset.x;
      this.#plotArea.bar.y = pset.y;
      this.#plotArea.bar.w = pset.w;
      this.#plotArea.bar.h = pset.h;
      this.#plotArea.bar.axis = pset.axis;
      this.#plotArea.bar.col = pset.col;
      pa = this.#plotArea.bar;
    }
    // とりあえず指定範囲を消しておく
    push();
    noStroke();
    fill(255);
    rect(pa.x, pa.y, pa.w, pa.h);
    pop();
  }
}

