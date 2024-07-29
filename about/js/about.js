/**
 *  contents.js
 *  アバウトページ共通のスクリプト
 */

/**
 ウィンドウロードで実行する関数
 ------------------------------------------------------- */
window.addEventListener('load', () => {
  
  // 広域変数の読み込み
  divs = document.querySelectorAll('.linkblock');
  
  // main_menu 要素全てにイベントを設定
  divs.forEach((element) => {
    // href 属性が設定してあれば取得できる
    //console.log(element.attributes.href.nodeValue);
    element.addEventListener('click', ()=>{
      window.location.href = element.attributes.href.nodeValue;
    });
  });
})

