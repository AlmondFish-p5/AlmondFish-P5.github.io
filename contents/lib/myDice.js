/** =====================================================
 *  ダイスクラス
 初期化関数 new rvDice(x, y, s, p, i) // xy座標, サイズ（半径）, 成功確率, 識別番号
 広域関数   roll(); //コインをふる 戻り値＝1/0
           // shadow(); //影を描く＝この関数は削除した
 セッター     position(pos); // 指定座標に移動する pos={x,y,}
           backcol(c); // 背景色の指定
 ゲッター     data(); // 生データを見せる
           stat(); // 統計を見せる {合計sum, サイズlen, 割合prob} 
           position(); 指定座標を返す
 */

class rvDice {
  // フィールド変数
  #index;
  #value;
  #position;
  #size;
  #prob;
  #probsum;
  #color;
  #pointpos;
  #pointselect;
  #dotsize;
  #data;
  // コンストラクタ 中心座標、サイズ（半径）、確率ベクトル、識別番号
  constructor (x0, y0, size, prob, idx = 0) {
    this.#index = idx;
    this.#value = 0;
    this.#position = {
      x : x0,
      y : y0,
    };
    this.#size = {
      w : size,
      r : 4,
      b : 1,
    };
    {
      this.#prob = prob;
      this.#probsum = 0;
      this.#prob.forEach((value)=>{
        this.#probsum+=value;
      });
    }
    this.#color = {
      bgcolor : color(255),
      shadow  : color(242),
      line    : color(0),
    }
    this.#setPointpos();
    this.#pointselect = [
        [false, false, false, false, false, false, false],
        [true,  false, false, false, false, false, false],
        [false, true,  true,  false, false, false, false],
        [true,  true,  true,  false, false, false, false],
        [false, true,  true,  true,  true,  false, false],
        [true,  true,  true,  true,  true,  false, false],
        [false, true,  true,  true,  true,  true,  true ]
    ];
    this.#dotsize = [0, 10, 6, 6, 6, 6, 6];
    this.#data = [];
  }
  // セッター、ゲッター
  set position(pos) {
    this.#position = {
      x : pos.x,
      y : pos.y,
    };
    this.#setPointpos();
  }
  // 内部関数
  // ---------- 表示位置を指定する（中心座標を{x,y}で指定）
  #setPointpos()
  {
    this.#pointpos = [
      {x:this.#position.x, y:this.#position.y}, 
      {x:this.#position.x-this.#size.w/4, y:this.#position.y-this.#size.w/4}, 
      {x:this.#position.x+this.#size.w/4, y:this.#position.y+this.#size.w/4}, 
      {x:this.#position.x-this.#size.w/4, y:this.#position.y+this.#size.w/4}, 
      {x:this.#position.x+this.#size.w/4, y:this.#position.y-this.#size.w/4}, 
      {x:this.#position.x-this.#size.w/4, y:this.#position.y}, 
      {x:this.#position.x+this.#size.w/4, y:this.#position.y}
    ];
  }
  // ---------- 目を表示する
  #dispValue()
  {
    const tmp = Math.ceil(random(0,this.#probsum));
    let psum = 0;
    if ((psum +=this.#prob[0]) >= tmp)        this.#value = 1;
    else if ((psum += this.#prob[1]) >= tmp)  this.#value = 2;
    else if ((psum += this.#prob[2]) >= tmp)  this.#value = 3;
    else if ((psum += this.#prob[3]) >= tmp)  this.#value = 4;
    else if ((psum += this.#prob[4]) >= tmp)  this.#value = 5;
    else                                      this.#value = 6;
    //console.log('tmp='+tmp+', value='+this.value);
    stroke(this.#value==1 ? 'red' : 'black');
    strokeWeight(this.#dotsize[this.#value]);

    this.#pointselect[this.#value].forEach((val, idx) => {
      if (val) point(this.#pointpos[idx].x, this.#pointpos[idx].y);
    });
    this.#data.push(this.#value);
  }
  // 公開関数
  // ---------- サイコロをふる
  roll() {
    push();
    rectMode(CENTER);
    fill(this.#color.bgcolor);
    stroke(this.#color.line);
    strokeWeight(this.#size.b);
    rect(this.#position.x, this.#position.y, this.#size.w, this.#size.w, this.#size.r);
    this.#dispValue();
    pop();
    return this.#value;
  }

} // end of class

/** =====================================================
 *  サイコロオブジェクトのメソッド
 
// ----- サイコロ自身をいったん消去する
rvDice.prototype.erase = function() {
  push();
  rectMode(CENTER);
  fill(canvas_background);
  noStroke();
  rect(this.pos.x, this.pos.y, this.size.w+2, this.size.h+2);
  pop();
}



// ----- サイコロの出目と出目の間に表示する画像
rvDice.prototype.dispShadow = function() {
  push();
  //this.erase();
  rectMode(CENTER);
  fill(this.color.shadow);
  stroke(this.color.line);
  strokeWeight(this.size.b);
  rect(this.pos.x, this.pos.y, this.size.w, this.size.h, this.size.r);
  stroke(this.color.shadow * 0.7);
  for (let k=0; k<8; k++) {
    let x0 = random(-this.size.w/2, this.size.w/2);
    line(this.pos.x+x0, this.pos.y-this.size.h/2, this.pos.x+x0, this.pos.y+this.size.h/2);
  }
  pop();
}
*/