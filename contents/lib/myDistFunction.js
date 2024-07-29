/**===========================================
 *  確率密度関数クラス
 * 
 *  インスタンス作成： dfunc = new drawDistFunc(name, pset, ...args);
 *   name  : 識別子 文字列
 *   pset  : 描画領域 x,y,w,h
 *   args  : 分布関数設定配列
 *          d    : 分布略号、（内部で番号 dn が与えられる）
 *          p1,p2: パラメータ　0:N正規(mu,sigma)、1:Xカイ二乗(df)、2:T(df)、3:F(df1,df3)
 *          col  : 色設定
 */
 
/** -----------------------------------------------
 *  確率変数クラス 本体
 */
class drawDistFunc {
  // ------------------------------------- フィールド変数
  #name;
  #distlist = [];
  #plotArea = { x:0, y:0, w:0, h:0, };
  #scale  = { 
    min:0, max:0, // 表示範囲 最小値～最大値：整数であること
    x:0, y:0,     // 表示単位 X軸、Y軸
    cx:0, cy:0,   // X軸中心位置、Y軸底位置
  };
  #dx = [];
  #distType = {'N':0, 'X':1, 'T':2, 'F':3, 'U':10, };

  // ------------------------------------- コンストラクタ
  constructor(name, pset, dlist) {
    this.#name = name;
    this.#setCanvas(pset);
    for (let i=0; i<dlist.length; i++) {
      this.#distlist[i] = {
        d  : dlist[i].d, 
        dn : this.#distType[dlist[i].d],
        p1 : dlist[i].p1,
        p2 : dlist[i].p2,
        col : dlist[i].col,
        maxd : 0,
        dy : [],
      };
    }
  }

  // ------------------------------------- セッター・ゲッター
  // 軸を設定する
  set scalex(s) {
    this.#scale.min = round(s.min);
    this.#scale.max = round(s.max);
    // X軸単位とゼロ位置（絶対位置）
    this.#scale.x = this.#plotArea.w / (this.#scale.max - this.#scale.min);
    this.#scale.cx = this.#plotArea.x - this.#scale.min * this.#scale.x;
    // X軸を準備する
    const arraysize = (this.#scale.max - this.#scale.min) * 10 + 1;
    this.#dx = new Array(arraysize).fill(0).map((value, index) => {
      return round(this.#scale.min + index * 0.1, 1);
    });
    // Y軸を準備する
    let m = 0;
    for (let i=0; i<this.#distlist.length; i++) {
      this.#setscaley(this.#distlist[i], arraysize);
      if (m < this.#distlist[i].maxd) m = this.#distlist[i].maxd;
    }
    // Y軸単位とゼロ位置（絶対位置）
    this.#scale.cy = this.#plotArea.y + this.#plotArea.h - 10;
    this.#scale.y = (this.#plotArea.y + this.#plotArea.h - 10) / m;
  }
  set maxd(d) {  // Y軸のスケールを強制再設定する set scalex の後から呼ぶこと
    this.#scale.y = (this.#plotArea.y + this.#plotArea.h - 10) / d;
  }
  get xline() {  // X軸設定＝ヒストグラムの breaks 設定に流用する
    return this.#dx;
  }
  get scalex() { // 横軸の中心点＝0位置と単位ピクセル数を返す：#cxの計算に使用している値
    //{ return (this.#scale.cx + x * this.#scale.x); }
    return {cx:this.#scale.cx, sx:this.#scale.x, };
  }
  get scale() { // スケール設定
    return this.#scale;
  }
  // Y軸数値の準備
  #setscaley (dist, size) 
  {
    dist.dy = new Array(size).fill(0);
    switch (dist.dn) {
      case 0: // 正規分布
        for (let i=0; i<size; i++) {
          dist.dy[i] = jStat.normal.pdf(this.#dx[i], dist.p1, dist.p2);
        }
        break;
      case 1: // カイ二乗分布
        for (let i=0; i<size; i++) {
          if (dist.p1 < 2 & this.#dx[i] < 0.1) {
            dist.dy[i] = 0;
          } else {
            dist.dy[i] = jStat.chisquare.pdf(this.#dx[i], dist.p1);
          }
        }
        break;
      case 2: // t分布
        for (let i=0; i<size; i++) {
          dist.dy[i] = jStat.studentt.pdf(this.#dx[i], dist.p1);
        }
        break;
      case 3: // F分布
        for (let i=0; i<size; i++) {
          dist.dy[i] = jStat.centralF.pdf(this.#dx[i], dist.p1, dist.p2);
        }
        break;
      case 10: // 一様分布
        for (let i=0; i<size; i++) {
          dist.dy[i] = jStat.uniform.pdf(this.#dx[i], dist.p1, dist.p2);
        }
        break;
    }
    dist.maxd = Math.ceil(max(dist.dy) * 10) / 10;
  }
  // お名前は？
  get name() {
    return this.#name;
  }
  // ------------------------------------- グローバル関数：動作確認用
  // 描画領域確認
  fillarea() {
    push();
    strokeWeight(3);
    fill('yellow');
    stroke('red');
    rect(this.#plotArea.x, this.#plotArea.y, this.#plotArea.w, this.#plotArea.h);
    this.dispString('curve:'+this.#name, 'red', 12);
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
  dispString(str, col, size, p='LEFT_TOP') {
    // 引数 p を解析する
    const pos = p.toUpperCase().split('_');
    // 表示設定
    push();
    textAlign(this.#ca(pos[0]), this.#ca(pos[1]));
    noStroke();
    fill(col);
    textSize(size);
    // 表示位置設定
    let xy = {x:this.#plotArea.x, y:this.#plotArea.y};
    if (pos[0]=='RIGHT') xy.x += this.#plotArea.w;
    else if (pos[0]=='CENTER') xy.x += this.#plotArea.w / 2;
    if (pos[1]=='BOTTOM') xy.y += this.#plotArea.h-1;
    else if (pos[1]=='CENTER') xy.y += this.#plotArea.h / 2;
    text(str, xy.x, xy.y);
    pop();
  }
  // 凡例の表示：位置は右上に固定
  dispLegend() {
    push();
    const x = this.#plotArea.x + this.#plotArea.w - 100;
    let y = this.#plotArea.y + 10;
    let dstr;
    textAlign(LEFT, CENTER);
    textSize(16);
    noStroke();
    fill(0);
    for (let i=0; i<this.#distlist.length; i++) {
      dstr = this.#distlist[i].d + '(' + round(this.#distlist[i].p1,1);
      if (this.#distlist[i].d=='N' | this.#distlist[i].d=='F') {
        dstr = dstr + ', ' + round(this.#distlist[i].p2,2) + ')';
      } else {
        dstr = dstr + ')';
      }
      text(dstr, x, y+i*20);
    }
    strokeWeight(2);
    for (let i=0; i<this.#distlist.length; i++) {
      stroke(this.#distlist[i].col);
      line(x-1, y+i*20, x-40, y+i*20);
    }
    pop();
  }
  // ------------------------------- プライベート関数：描画関連＝typeによって呼び分ける
  // 軸を描画する
  #drawAxis()
  {
    noStroke();
    fill(0);
    textSize(10);
    // X 軸
    const q = (this.#scale.x <10 ? 5 : (this.#scale.x < 20 ? 2 : 1));
    textAlign(CENTER, TOP);
    const fy = this.#scale.cy + 1;
    for (let x = this.#scale.min; x<=this.#scale.max; x++) {
      if (x % q == 0) text(x, this.#cx(x), fy);
    }
    // Y 軸
    textAlign(LEFT, CENTER);
    const x = this.#plotArea.x + 15;
    let y = 0;
    while (this.#cy(y) > this.#plotArea.y) {
      text(y, x, this.#cy(y));
      y = round(y + 0.1, 1);
    }
    // X 軸の線
    stroke(0);
    strokeWeight(1);
    line(this.#plotArea.x, this.#scale.cy, this.#plotArea.x+this.#plotArea.w, this.#scale.cy);
  }
  // 分布曲線の描画 erase=true で領域消してから描画
  drawCurves(erase=false) {
    push();
    if (erase) {
      fill(255);
      noStroke();
      rect(this.#plotArea.x, this.#plotArea.y, this.#plotArea.w, this.#plotArea.h);
    }
    // XY軸の描画
    this.#drawAxis();
    // 分布曲線の描画：同じキャンバスに上書きする
    for (let i=0; i<this.#distlist.length; i++) {
      this.#drawCurve(this.#distlist[i]);
    }
    pop();
  }
  // 分布曲線ひとつを描く
  #drawCurve(dist) 
  {
    // 曲線を描く
    strokeWeight(2);
    stroke(dist.col);
    for (let i=1; i<this.#dx.length; i++) {
      if (dist.dy[i-1] > 0 && dist.dy[i] > 0) {
        line(this.#cx(this.#dx[i-1]), this.#cy(dist.dy[i-1]),
             this.#cx(this.#dx[i]),   this.#cy(dist.dy[i]  ));
      }
    }
  }
  // ------------------------------------- プライベート関数
  // 座標軸の変換
  #cx(x, cx=this.#scale.cx) 
  { return (cx + x * this.#scale.x); }
  #cy(y, fy=this.#scale.cy) 
  { return (fy - y * this.#scale.y); }
  // 分布リストの削除：指定してある分布を１つ指定（0始まりの番号で）、n<0 のとき全削除
  removeDist(n) {
    if (n<0) {
      this.#distlist = [];
    } else {
      this.#distlist.splice(n, 1);
    }
  }
  // 分布リストを追加するaddDist(d) d {str d, num p1, num p2, col/num/str col}
  //  d    : 分布略号、（内部で番号 dn が与えられる）
  //  p1,p2: パラメータ　0:N正規(mu,sigma)、1:Xカイ二乗(df)、2:T(df)、3:F(df1,df3)
  //  col  : 色設定
  addDist(d) {
    const index = this.#distlist.length;
    this.#distlist[index] = {
      d  : d.d, 
      dn : this.#distType[d.d],
      p1 : d.p1,
      p2 : d.p2,
      col : d.col,
      maxd : 0,
      dy : [],
    };
  }
  // 必要なキャンバスを設定する：object AreaSize={x,y,w,h,a}で指定
  #setCanvas(pset) 
  {
    this.#plotArea = {
      x: pset.x,
      y: pset.y,
      w: pset.w,
      h: pset.h,
    };
    // とりあえず消しておく
    push();
    fill(255);
    noStroke();
    rect(this.#plotArea.x, this.#plotArea.y, this.#plotArea.w, this.#plotArea.h);
    pop();
  }
}

