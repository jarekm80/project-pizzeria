import {settings, select, classNames} from './settings.js';
import Product from './components/Product.js';
import Cart from './components/Cart.js';

const app = {
  initPages: function(){
    const thisApp = this;
    thisApp.pages = document.querySelector(select.containerOf.pages).children;
    thisApp.activatePage(thisApp.pages[0].id);
    thisApp.navLinks = document.querySelectorAll(select.nav.links);

  },

  activatePage: function(pageID){
    const thisApp = this;
    /* Add class active to matching pages, remove it from non-matching */
    for (let page of thisApp.pages){
      page.classList.toggle(classNames.pages.active, page.id === pageID);
    }
    /* Add class active to matching links, remove it from non-matching */
    for (let link of thisApp.links){
      link.classList.toggle(
        classNames.nav.active,
        link.getAttribute('href') === '#' + pageID
      );
    }
  },

  initMenu: function(){
    const thisApp = this;
    for (let productData in thisApp.data.products){
      new Product(thisApp.data.products[productData].id, thisApp.data.products[productData]);
    }
  },

  initData: function(){
    const thisApp = this;
    thisApp.data = {};
    const url = settings.db.url + '/' + settings.db.product;

    fetch(url)
      .then(function(rawResponse){
        return rawResponse.json();
      })
      .then(function(parsedResponse){
        thisApp.data.products = parsedResponse;
        thisApp.initMenu();
      });

  },
  initCart: function(){
    const thisApp = this;
    const cartElem = document.querySelector(select.containerOf.cart);
    thisApp.cart = new Cart(cartElem);

    thisApp.productList = document.querySelector(select.containerOf.menu);
    thisApp.productList.addEventListener('add-to-cart', function(event){
      app.cart.add(event.detail.product);
    });
  },

  init: function(){
    const thisApp = this;
    //  console.log('*** App starting ***');
    //  console.log('thisApp:', thisApp);
    //  console.log('classNames:', classNames);
    //  console.log('settings:', settings);
    //  console.log('templates:', templates);
    thisApp.initPages();
    thisApp.initData();
    thisApp.initCart();
  },
};

app.init();
