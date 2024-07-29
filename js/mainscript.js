/**
 *  mainscript.js
 */

let menuItem;
let articleList;
let activeDiv;

window.addEventListener('load', ()=>{
  menuItem = document.querySelectorAll('.main_nav');
  articleList = document.querySelectorAll('.main_content');
  activeDiv = 'about';
  //console.log(menuItem[0].id);
  menuItem.forEach((item) => {
    item.addEventListener('click', () => {
      change_active_article(item.id);
    });
  });
  hide_all_articles();
  disp_active_article();
});

// いったんすべての article を非表示にする
function hide_all_articles() {
  articleList.forEach((item) => {
    item.style.display = 'none';
 });
}

// active article だけを表示する
function disp_active_article() {
  if (activeDiv.length > 0){
    const active_article = document.querySelector(`#content_${activeDiv}`);
    active_article.style.display = 'block';
    const active_menu = document.querySelector(`#${activeDiv}`);
    active_menu.classList.add('active');
  }
}

// active article を入れ替える
function change_active_article(newActiveId) {
  document.querySelector(`#content_${activeDiv}`).style.display = 'none';
  document.querySelector(`#${activeDiv}`).classList.remove('active');
  activeDiv = newActiveId;
  document.querySelector(`#content_${activeDiv}`).style.display = 'block';
  document.querySelector(`#${activeDiv}`).classList.add('active');
}

