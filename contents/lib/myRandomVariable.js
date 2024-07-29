/**===========================================
 * 確率変数クラス
 * type によって表示する内容を変える。
 * 0:ドット（直近数個）、1:ライン（バーコード様）、2:ヒストグラム、3:度数多角形、4:関数
 * type を配列で受け取って、複数の表示を管理できるようにする。
 * 分布関数指定
 * 0:正規分布、1:カイ二乗分布、2:t分布、3:F分布
 */

const rvType = {'DOT':0, 'LINE':1, 'HIST':2, 'RECT':3, 'CURV':4};
const distType = {'N':0, 'X':1, 'T':2, 'F':3, 'U':10, 'C':11, 'D':12};
const defaultTypeStr = ['DOT', 'LINE', 'HIST', 'RECT', 'CURV'];

/** -----------------------------------------------
 *  描画エリア設定クラス
 */
class AreaSize {
  #x;  // 描画領域左上x
  #y;  // 　　左上y
  #w;  // 描画領域幅
  #h;  // 　　高さ
  #a;  // 軸の描画 true/false
  constructor(x, y, w, h, a) {
    this.#x = x;
    this.#y = y;
    this.#w = w;
    this.#h = h;
    this.#a = a;
  }
  get s() {
    return {x:this.#x, y:this.#y, w:this.#w, h:this.#h, a:this.#a};
  }
  set x(x) { this.#x = x; }
  set y(y) { this.#y = y; }
  set w(w) { this.#w = w; }
  set h(h) { this.#h = h; }
  set a(a) { this.#a = a; }
}

/** -----------------------------------------------
 *  指定領域塗りつぶしのための関数
 * 　a: エリア cf: Color Fill cs: Color Stroke（-1 for noStroke()）
 */
function fillRect(a, cf, cs) {
  push();
  fill(cf);
  if (cs<0) {
    noStroke();
  } else {
    stroke(cs);
    strokeWeight(1);
  }
  rect(a.x, a.y, a.w, a.h);
  pop();
}

/** -----------------------------------------------
 *  確率変数クラス 本体
 */
class RandomVariable {
  // ------------------------------------- フィールド変数
  #name;
  #distribution;
  #parameter;
  #typeset;
  #plotArea = [];
//  #plotArea   = { x:0, y:0, w:0, h:0, a:0, };
//  #plotCenter = { x:0, y:0, };
//  #plotInter;
  #scale  = { min:0, max:0, x:0, y:0, center:0, };
  #axis;
  #data;
  #clsset;
  #realtimeHist = false;

  // ------------------------------------- コンストラクタ
  constructor(name, dist, types, sizes, ...args) {
    this.#name = name;
    this.#setDist(dist.toUpperCase());
    this.#setType(types);
    this.#setCanvas(sizes);
    this.#eraseCanvas();
    this.#axis = {
      borderColor  : 'black',
      borderWeight : 0.5,
      fontColor    : color(60),
      fontSize     : 10,
    }; 
    this.#clsset = {
      breaks: [], 
      freq:   [], 
      err:    0, 
      num:    0, 
      width:  0, 
      scale:  {x:0, y:0,},
    };
    this.#data = {
      x : [],
      y : [],
      stat : {mean:0, var_s:0, sd_s:0, }, 
    };
    if (args.length > 0) {
      for (let arg in args) {
        if (args[arg].toLowerCase()=='realtimehist') this.#realtimeHist = true;
      }
    }
  }

  // ------------------------------------- セッター
  // データをセットする
  set data(d) {
    this.#data.x = d;
  }
  // ------------------------------------- ゲッター
  // お名前は？
  get name() {
    return this.#name;
  }
  // データを見せて
  get data_x() {
    return this.#data.x;
  }
  // 統計見せて
  get stat() {
    return this.#data.stat;  // stat : {mean, var_s, sd_s, },
  }
  // ------------------------------------- グローバル関数
  // パラメータを変更する
  setParameter(p1, p2) {
    this.#parameter = {mu:0, sigma:1, df1:1, df2:1, prob:0.5, min:1, max:6, };
    switch (this.#distribution) {
      case 0:   // [S]tandard Normal 期待値と標準偏差を指定
        this.#parameter.mu = p1;
        this.#parameter.sigma = p2;
        return;
      case 1:   // [X](chi) squared 自由度を1つ指定
        this.#parameter.df1 = p1;
        return;
      case 2:   // Student [T] 自由度を1つ指定
        this.#parameter.df1 = p1;
        return;
      case 3:   // [F] 自由度を2つ指定
        this.#parameter.df1 = p1;
        this.#parameter.df2 = p2;
        return;
      case 10:  // [U]ni 範囲を指定
        this.#parameter.min = p1;
        this.#parameter.max = p2;
        return;
      case 11:   // [C]oin 成功確率を指定
        this.#parameter.prob = p1;
        return;
      case 12:   // [D]ice 指定なし
        return;
      default:
        return;
    }
  }
  // 軸を設定する
  setAxis(x_min, x_max, y_min, y_max) {
    this.#scale.min = x_min;
    this.#scale.max = x_max;
    this.#scale.x = this.#plotArea[0].area.w / (x_max - x_min);
    this.#scale.y = this.#plotArea[0].area.h / (y_max - y_min);
    
    const center_x = this.#plotArea[0].area.x - x_min * this.#scale.x;
    this.#scale.center = center_x;
    for (let i=0; i<this.#typeset.length; i++) {
      this.#plotArea[i].center.x = center_x;
    }
  }
  // 階級設定をする
  setBreaks(br) {
    this.#clsset.breaks = br;
    this.#clsset.freq = new Array(br.length-1).fill(0);
    this.#clsset.err = 0;
    this.#clsset.num = br.length - 1;
    this.#clsset.width = round((this.#scale.max - this.#scale.min) / this.#clsset.num, 2);
    this.#clsset.scale = {x:0, y:0, };
  }
  // ------------------------------------- グローバル関数：動作確認用
  // 存在確認
  greeting() {
    console.log('My name is '+this.#name);
  }
  // 描画領域確認
  fillarea() {
    push();
    for (let i=0; i<this.#typeset.length; i++) {
      fillRect(this.#plotArea[i].area, 'yellow', 'green');
      strokeWeight(5);
      stroke('red');
      point(this.#plotArea[i].center.x, this.#plotArea[i].center.y);
    }
    pop();
  }
  // 領域消去
  erasearea(type) {
    push();
    const index = this.#typeset.indexOf(type.toUpperCase());
    fillRect(this.#plotArea[index].area, this.#plotArea[index].inter.bg, -1)
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
    const index = this.#typeset.indexOf(type);
    if (pos_str.indexOf(pos[0]) < 0) return null;
    if (pos_str.indexOf(pos[1]) < 0) return null;
    // 表示設定
    push();
    textAlign(this.#ca(pos[0]), this.#ca(pos[1]));
    noStroke();
    fill(col);
    textSize(size);
    // 表示位置設定
    let xy = {x:this.#plotArea[index].area.x, y:this.#plotArea[index].area.y};
    if (pos[0]=='RIGHT') xy.x += this.#plotArea[index].area.w;
    else if (pos[0]=='CENTER') xy.x += this.#plotArea[index].area.w / 2;
    if (pos[1]=='BOTTOM') xy.y += this.#plotArea[index].area.h-1;
    else if (pos[1]=='CENTER') xy.y += this.#plotArea[index].area.h / 2;
    text(str, xy.x, xy.y);
    pop();
  }
  // ------------------------------------- グローバル関数：描画関係
  // 自由度 df のカイ二乗分布乱数（ Z = N(0,1) の2乗のdf個の和）を返す
  #chiSquared(df) 
  {
    let x = 0;
    for (let i=0; i<df; i++) {
      x += (randomGaussian(0,1)) ** 2;
    }
    return x;
  }
  // 新しいデータを生成する 乱数を生成させるときに使う
  // distType = {'N':0, 'X':1, 'T':2, 'F':3, 'U':10, 'C',11, 'D',12};
  // #parameter  = { mu:0, sigma:1, df1:1, df2:1, prob:0.5, min:0, max:0, };
  generateNewData() {
    let x = 0;
    switch(this.#distribution) {
      case 0:   // Standard Normal
        x = randomGaussian(this.#parameter.mu, this.#parameter.sigma);
        break;
      case 1:   // X(chi) squared
        // 以下定義式通り。
        // Z_i ~ N(0,1)  i.i.d のとき、 W = \sum_{i=1}^k Z^2 ~ Chi^2(k)
        x = this.#chiSquared(this.#parameter.df1);
        break;
      case 2:   // Student t
        // 以下定義式通り。
        // Z ~ N(0,1), W ~ Chi^2(m) のとき、 Z / sqrt(W/m) ~ t(m)
        if (this.#parameter.df1 < 2) return null;
        let z = randomGaussian(0,1);
        let w = this.#chiSquared(this.#parameter.df1);
        x = z / Math.sqrt(w / this.#parameter.df1);
        break;
      case 3:   // F
        let w1 = this.#chiSquared(this.#parameter.df1);
        let w2 = this.#chiSquared(this.#parameter.df2);
        x = (w1 / this.#parameter.df1) / (w2 / this.#parameter.df2);
        break;
      case 10:  // Uni
        x = random(this.#parameter.min, this.#parameter.max);
        break;
      case 11:   // Coin
        x = random(0, 1) < this.#parameter.prob ? 1 : 0;
        break;
      case 12:   // Dice
        x = Math.floor(random(this.#parameter.min, this.#parameter.max+1));
        break;
    }
    this.#data.x.push(x);
    if (this.#realtimeHist) this.#appendHistClass(x);
    return x;
  }
  // データを１つ追加する：これは指定の値を追加したいときに使う
  appendData(x) {
    this.#data.x.push(x);
    if (this.#realtimeHist) this.#appendHistClass(x);
  }
  // データをプロットする：type変数によって呼び出す関数を変える：ここは動的プロット
  plotDatas(...args) {
    push();
    for (let i=0; i<this.#typeset.length; i++) {
      switch (this.#plotArea[i].type) {
        case 'DOT': // DOT
          this.#plotDots(this.#plotArea[i]);
          break;
        case 'LINE': // LINE
//          if (this.#data.x.length < 2) {
//            fillRect(this.#plotArea[i].area, this.#plotArea[i].inter.bg, -1);
//          }
          if (this.#plotArea[i].flag) {
            this.#drawXaxis(this.#plotArea[i].center);
            this.#plotArea[i].flag = false;
          }
          this.#plotLines(this.#plotArea[i]); 
          break;
        case 'HIST': // HIST 
          if (this.#realtimeHist) {
            fillRect(this.#plotArea[i].area, this.#plotArea[i].inter.bg, -1);
            this.#drawXaxis(this.#plotArea[i].center);
            this.#graphHistAxis(this.#plotArea[i]);
            this.#graphHist(this.#plotArea[i], args[0]);
          }
          break;
        case 'RECT': // RECT
        case 'CURV': // CURVE
          break;
      }
    }
    pop();
  }
  // ------------------------------- プライベート関数：描画関連＝typeによって呼び分ける
  #drawXaxis(cpos) // X軸を描画する：LINE, HIST などから呼ばれる 
  {
    noStroke();
    fill(this.#axis.fontColor);
    textSize(this.#axis.fontSize);
    textAlign(CENTER, TOP);
    for (let x = Math.ceil(this.#scale.min); x<=Math.ceil(this.#scale.max); x++) {
      text(x, this.#cx(x, cpos.x), cpos.y+1);
    }
  }
  #drawYaxis(fmax, floor_y, scale_y) // Y軸を描画する：HIST などから呼ばれる
  {
    noStroke();
    fill(this.#axis.fontColor);
    textSize(this.#axis.fontSize);
    textAlign(LEFT, CENTER);
    for (let y = 1; y<=(fmax/100); y++) {
      text(y*100, 5, floor_y + scale_y * y * 100);
    }
  }
  // データをドットプロットする：type==0:DOTのみ
  #plotDots(plotarea) 
  {
    fillRect(plotarea.area, plotarea.inter.bg, -1);
    const start_index = max(0, this.#data.x.length - 10);
    let j = 0;
    for (let i=start_index; i<this.#data.x.length; i++) {
      stroke(plotarea.inter.bd[9-j]);
      strokeWeight(plotarea.inter.bw[9-j]);
      point(this.#cx(this.#data.x[i]), plotarea.center.y);
      j++;
    }
  }
  // データをラインプロットする：type==1:LINEのみ：
  // 軸表示をONにしたとき、表示エリアの下側10pxが軸の表示に使われる
  #plotLines(plotarea) 
  {
    stroke(plotarea.inter.bd);
    strokeWeight(plotarea.inter.bw);
    const i = this.#data.x.length - 1;
    line(this.#cx(this.#data.x[i]), plotarea.area.y, 
        this.#cx(this.#data.x[i]), 
        plotarea.area.y + plotarea.area.h - (plotarea.axis ? 10 : 0));
  }
  // ヒストグラムの階級データにデータを足す
  #appendHistClass(x) 
  {
    // 指定されている範囲内のみ処理する
    if (x >= this.#scale.min && x <= this.#scale.max) {
      let cls = Math.floor((x - this.#scale.min) / this.#clsset.width);
      if (cls >= this.#clsset.num) cls--; // 右端を閉じるための処理
      this.#clsset.freq[cls]++;
    } else {
      this.#clsset.err++;
    }
  }
  // ヒストグラムを描く：こっちはまとめて1回だけ描くとき
  drawHist(graphtype, sy=0) 
  {
    // 描画位置の取得
    const index = this.#typeset.indexOf('HIST');
    const parea = this.#plotArea[index];
    // データを数え上げる
    this.#data.x.forEach((value, index) => {
      this.#appendHistClass(value);
    });
    // 軸の設定と描画
    this.#graphHistAxis(parea);
    if (sy !== 0) this.#clsset.scale.y = sy;
    this.#drawXaxis(parea.center);
    this.#drawYaxis(max(this.#clsset.freq), parea.center.y, this.#clsset.scale.y);
    // グラフ本体の描画
    this.#graphHist(parea, graphtype);
    // y軸のスケール設定だけを返す
    return (this.#clsset.scale.y);
  }
  // 分布関数を描く
  drawCurve(col, weight, axis=false)
  {
    // 描画位置の取得
    const index = this.#typeset.indexOf('CURV');
    const parea = this.#plotArea[index];
    if (axis) {
      this.#drawXaxis(parea.center);
    }
    if (this.#distribution > 3) return null;
    // 確率密度を保持する変数
    this.#data.y = new Array(this.#clsset.breaks.length);
    for (let i=0; i<this.#clsset.breaks.length; i++) {
      switch (this.#distribution) {
        case 0:   // Standard Normal 期待値と標準偏差を指定
          this.#data.y[i] = jStat.normal.pdf(this.#clsset.breaks[i], this.#parameter.mu, this.#parameter.sigma);
          break;
        case 1:   // X(chi) squared 自由度を1つ指定
          this.#data.y[i] = jStat.studentt.pdf(this.#clsset.breaks[i], this.#parameter.df1);
          break;
        case 2:   // Student t 自由度を1つ指定
          this.#data.y[i] = jStat.studentt.pdf(this.#clsset.breaks[i], this.#parameter.df1);
          break;
        case 3:   // F 自由度を2つ指定
          this.#data.y[i] = jStat.centralF.pdf(this.#clsset.breaks[i], this.#parameter.df1, this.#parameter.df2);
          break;
      }
    }
    // 曲線を描く
    strokeWeight(weight);
    stroke(col);
    for (let i=1; i<this.#clsset.breaks.length; i++) {
      line(this.#cx(this.#clsset.breaks[i-1]), 
       this.#cy(this.#data.y[i-1], parea.center.y),
       this.#cx(this.#clsset.breaks[i]),
       this.#cy(this.#data.y[i], parea.center.y));
    }
  }
  // 平均値と分散を計算する
  calcStats()
  {
    let s0 = 0;
    this.#data.x.forEach((value, index) => {
      s0 += value; 
    });
    this.#data.stat.mean = s0 / this.#data.x.length;
    s0 = 0;
    this.#data.x.forEach((value, index) => {
      s0 += (value - this.#data.stat.mean) ** 2; 
    });
    this.#data.stat.var_s = s0 / (this.#data.x.length - 1);
    this.#data.stat.sd_s = Math.sqrt(this.#data.stat.var_s);
  }
  // 平均値を表示する：'LINE','HIST','RECT','CURV'に対応
  dispMean(type) {
    const index = this.#typeset.indexOf(type);
    let s0 = 0;
    if (this.#data.stat.var_s == 0) { // 分散が0ということはありえないので
      this.calcStats();
    }
    push();
    stroke('red');
    strokeWeight(0.6);
    line(this.#cx(this.#data.stat.mean), 
         this.#plotArea[index].area.y, this.#cx(this.#data.stat.mean), 
         this.#plotArea[index].area.y + this.#plotArea[index].area.h-10);
    noStroke();
    fill('red');
    textSize(12);
    textAlign(LEFT, TOP);
    text(`Mean=${this.#data.stat.mean.toFixed(2)}`, 
          this.#cx(this.#data.stat.mean)+2, this.#plotArea[index].area.y+15);
    pop();
  }
  // ヒストグラムの軸を設定する
  #graphHistAxis(parea)
  {
    // ヒストグラム用の軸設定
    this.#clsset.scale.x = this.#scale.x * this.#clsset.width;
    this.#clsset.scale.y = -(parea.area.h-15) / max(this.#clsset.freq);
  }
  // ヒストグラムを描く：描画部分本体
  #graphHist(parea, type = 'hist')
  {
    // ヒストグラム
    fill(parea.inter.fill);
    stroke(parea.inter.bd);
    strokeWeight( (type=='hist' ? 0.5 : 2) );
    const x = this.#cx(this.#scale.min);
    const y = parea.center.y;
    const b = this.#clsset.scale.x / 2;
    for (let i=0; i<this.#clsset.freq.length; i++) {
      if (this.#clsset.freq[i] > 0) {
        switch (type) {
          case 'hist': // default 柱状
            rect(x+this.#clsset.scale.x*i, y, 
              this.#clsset.scale.x, this.#clsset.scale.y*this.#clsset.freq[i]);
          case 'stairs': // stairing 階段
            line(x+this.#clsset.scale.x*i, 
                this.#clsset.scale.y*this.#clsset.freq[i], 
                x+this.#clsset.scale.x*(i+1), 
                this.#clsset.scale.y*this.#clsset.freq[i]);
          case 'rect': // freqrect 度数多角形
            if (i>0) {
              line(x+this.#clsset.scale.x*(i-1) + b, 
                this.#clsset.scale.y*this.#clsset.freq[i-1],
                x+this.#clsset.scale.x*i + b, 
                this.#clsset.scale.y*this.#clsset.freq[i]);
            }
        }
      }
    }
  }
  // ------------------------------------- プライベート関数
  // 座標軸の変換
  #cx(x, cx=this.#scale.center) 
  { return (cx + x * this.#scale.x); }
  #cy(y, fy) 
  { return (fy - y * this.#scale.y); }
  // タイプ設定：規定値はドット、ライン、ヒストグラム（['DOT','LINE','HIST']）
  #setType(t) 
  {
    // タイプが設定されている順に記録する＝その順に上から描画領域を割り当てる
    this.#typeset = [];
    // 1つだけの指定（string）
    if (!Array.isArray(t) && typeof(t)=='string') {
      this.#typeset.push(t.toUpperCase());
    //　複数指定（Array of string）
    } else if (t.length>=1) {
      for (let i=0; i<t.length; i++) {
        if (typeof(t[i])=='string') {
          this.#typeset.push(t[i].toUpperCase());
        }
      }
    } else { // default
      this.#typeset = ['DOT','LINE','HIST'];
    }
  }
  // 分布設定：規定値は正規分布。パラメータも初期値を設定しておく
  #setDist(d) 
  {
    if (typeof(d)==='number') this.#distribution = d;
    else if (typeof(d)==='string') this.#distribution = distType[d];
    else this.#distribution = 0;
    // パラメータ初期値を指定してしまう
    this.setParameter();
  }
  // 必要なキャンバスを設定する：object AreaSize={x,y,w,h,a}で指定
  #setCanvas(sizes) 
  {
    for (let t=0; t<this.#typeset.length; t++) {
      // s はAreaSizeクラス
      const s = sizes[t].s;
      this.#plotArea[t] = {
        area : {x:s.x, y:s.y, w:s.w, h:s.h},
        center: {
          x : s.x + s.w / 2,
          y : s.y + (this.#typeset[t]=='DOT' ? s.h/2: s.h),
        },
        axis: s.a,
        flag: s.a,
        inter : {bg: color(255), fill: color(255), bd: color(0), bw: 1, },
        // 次のキャンバスは s.h だけ下から始まる
      };
      if (this.#plotArea[t].axis) {
        this.#plotArea[t].center.y -= 10;
      }
      // プロットタイプ
      this.#plotArea[t].type = this.#typeset[t];
      // タイプごとの色設定
      switch (this.#plotArea[t].type) {
        case 'DOT':
          this.#plotArea[t].inter.bw = [12,11,10,9,8,7,6,5,4,3];
          this.#plotArea[t].inter.bd = ['red',64,80,96,112,128,144,160,176,192];
          break;
        case 'LINE':
          this.#plotArea[t].inter.bw = 0.5;
          this.#plotArea[t].inter.bd = color(0, 128);
          break;
        case 'HIST':
          this.#plotArea[t].inter.fill = color(244);
          break;
        case 'RECT':
          this.#plotArea[t].inter.bw = 2;
          this.#plotArea[t].inter.bd = 'red';
          break;
        case 'CURV':
          this.#plotArea[t].inter.bw = 2;
          this.#plotArea[t].inter.bd = 'blue';
          break;
      }
      //console.log(this.#plotArea[t]);
    }
  }
  #eraseCanvas() 
  {
    for (let i=0; i<this.#typeset.length; i++) {
      fillRect(this.#plotArea[i].area, this.#plotArea[i].inter.bg, -1);
    }
  }
}

