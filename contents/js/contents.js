/**
 *  contents.js
 *  コンテンツページ共通のスクリプト
 */

let divs;         // article ブロックすべて id = '***_contents'
let main_nav;     // main_nav 要素すべて id = '***'
let current_id;   // 現在アクティブになっているID 上の変数の *** に入る

/**
 ウィンドウロードで実行する関数
 ------------------------------------------------------- */
window.addEventListener('load', () => {
  
  // 広域変数の読み込み
  divs = document.querySelectorAll('.article_contents');
  main_nav = document.querySelectorAll('.main_menu');
  
  // 初期状態はすべての article 非表示
  closeAllArticles();
  current_id = '';
  
  // main_menu 要素全てにイベントを設定
  main_nav.forEach((element) => {
    element.addEventListener('click', () => {
      // 現在の current_id article を閉じる
      if (current_id.length > 0) {
        closeArticle(current_id);
      }
      // 同じメニューをクリックしたら、それを消すことにする
      if (current_id == element.id) {
        closeArticle(current_id);
        current_id = '';
      } else {  // current_id の取得
        current_id = element.id
        // exit だったら終了手続き
        if (current_id == 'exit') {
          if (window.history.length > 1) {
            window.history.back();
          } else {
            window.close();
          }
        // そうでないなら current_id article を表示
        } else {
          const div_id = `#${current_id}_contents`;
          openArticle(div_id);
        }
      }
    });
  });
})

// すべての article を閉じる
function closeAllArticles() {
  divs.forEach((div) => {
    div.style.display = 'none';
  });
}
// 指定IDの article を閉じる＋メニューの強調 .active をはずす
function closeArticle(cur_id) {
  const div_id = `#${cur_id}_contents`;
  document.querySelector(div_id).style.display = 'none';
  document.querySelector('#'+cur_id).classList.remove('active');
}
// 指定IDの article を開く＋メニューの強調 .active を追加する
function openArticle(div_id) {
  document.querySelector(div_id).style.display = 'block';
  document.querySelector('#'+current_id).classList.add('active');
}

// 数値入力ボックスの入力を監視する
// input .number クラスをすべて選択
const allInput = document.querySelectorAll('.number');
// 入力範囲を表示する
allInput.forEach((element) => {
  const idstr = `#${element.id}_interval`;
  //console.log(idstr);
  if (document.querySelector(idstr)) {
    document.querySelector(idstr).textContent = `(${element.min}～${element.max})`;
    document.querySelector(idstr).style.fontSize = '0.8rem';
    document.querySelector(idstr).style.marginRight = '0.5rem';
  }

  if (element.min && element.max) {
    element.addEventListener('change', () => {
      if (Number(element.value) < Number(element.min)) {
        element.value = element.min;
        element.style.backgroundColor = '#ff0';
      } else if (Number(element.value) > Number(element.max)) {
        element.value = element.max;
        element.style.backgroundColor = '#ff0';
      } else {
        element.style.backgroundColor = '#fff';
      }
    });
  }
});


// CSVファイルとして保存する：data ファイル内容、filename ファイル名文字列
// 使い方 
/** document.querySelector('#save_to_file').addEventListener('click', ()=>{
  data = makeRowData(); // データを作っている
  saveCsvFile(data, 'rawdata.csv'); // 下の関数を呼んでいる
});
*/
function saveCsvFile(csvData, filename) {
  const csvBlob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
  const blobUrl = window.URL.createObjectURL(csvBlob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(blobUrl);
}
