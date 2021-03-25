import {select, classNames, templates} from '../settings.js';
import utils from '../utils.js';
import AmountWidget from './AmountWidget.js';

class Product{
  constructor(id, data){
    const thisProduct = this;
    thisProduct.id = id;
    thisProduct.data = data;
    thisProduct.renderInMenu();
    thisProduct.getElements();
    thisProduct.initAccordion();
    thisProduct.initOrderForm();
    thisProduct.initAmountWidget();
    thisProduct.processOrder();
  }
  renderInMenu(){
    const thisProduct = this;

    /* [DONE] generate HTML based on template */
    const generatedHTML = templates.menuProduct(thisProduct.data);
    /* [DONE] create element using utils.createElementFromHTML */
    thisProduct.element = utils.createDOMFromHTML(generatedHTML);
    /* [DONE] find menu container */
    const menuContainer = document.querySelector(select.containerOf.menu);
    /* [DONE] add element to menu */
    menuContainer.appendChild(thisProduct.element);
  }

  getElements(){
    const thisProduct = this;

    thisProduct.dom = {};
    thisProduct.dom.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
    thisProduct.dom.form = thisProduct.element.querySelector(select.menuProduct.form);
    thisProduct.dom.formInputs = thisProduct.dom.form.querySelectorAll(select.all.formInputs);
    thisProduct.dom.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton);
    thisProduct.dom.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem);
    thisProduct.dom.imageWrapper = thisProduct.element.querySelector(select.menuProduct.imageWrapper);
    thisProduct.dom.amountWidgetElem = thisProduct.element.querySelector(select.menuProduct.amountWidget);
  }

  initAmountWidget(){
    const thisProduct = this;
    thisProduct.amountWidget = new AmountWidget(thisProduct.dom.amountWidgetElem);
    thisProduct.dom.amountWidgetElem.addEventListener('updated',function(){
      thisProduct.processOrder();
    });
  }

  initAccordion(){
    const thisProduct = this;
    /* START: add event listener to clickable trigger on event click */
    thisProduct.dom.accordionTrigger.addEventListener('click', function(event) {
      /* [DONE] prevent default action for event */
      event.preventDefault();
      /* [DONE] find active product (product that has active class) */
      let activeProduct = document.querySelector(classNames.menuProduct.wrapperActive);
      /* [DONE] if there is active product and it's not thisProduct.element, remove class active from it */
      if ((activeProduct != null) && (activeProduct != thisProduct.element)){
        activeProduct.classList.remove(classNames.menuProduct.wrapperActive);
      }
      /* [DONE] toggle active class on thisProduct.element */
      thisProduct.element.classList.toggle(classNames.menuProduct.wrapperActive);
    });
  }

  initOrderForm(){
    const thisProduct = this;
    thisProduct.dom.form.addEventListener('submit', function(event){
      event.preventDefault();
      thisProduct.processOrder();
    });
    for(let input of thisProduct.dom.formInputs){
      input.addEventListener('change', function(){
        thisProduct.processOrder();
      });
    }
    thisProduct.dom.cartButton.addEventListener('click', function(event){
      event.preventDefault();
      thisProduct.processOrder();
      thisProduct.addToCart();
    });
  }

  processOrder(){
    const thisProduct = this;
    const formData = utils.serializeFormToObject(thisProduct.dom.form);

    // [DONE] set price to default price
    let price = thisProduct.data.price;

    // [DONE] for every category (param)...
    for(let paramId in thisProduct.data.params) {
      // [DONE] determine param value, e.g. paramId = 'toppings', param = { label: 'Toppings', type: 'checkboxes'... }
      const param = thisProduct.data.params[paramId];
      for(let optionId in param.options) {
        // [DONE] determine option value, e.g. optionId = 'olives', option = { label: 'Olives', price: 2, default: true }
        const option = param.options[optionId];
        // [DONE] determine if marked
        let marked = (formData[paramId] != null) && (formData[paramId].includes(optionId));
        // [DONE] change prize
        if (marked && (!('default' in option) || !option.default))  {
          price += option.price;
        } else if (!marked && option.default) {
          price -= option.price;
        }
        // [DONE] switch active in image
        const optionImage = thisProduct.dom.imageWrapper.querySelector('.' + paramId + '-' + optionId);
        if (marked && optionImage){
          optionImage.classList.add('active');
        } else if (!marked && optionImage) {
          optionImage.classList.remove('active');
        }
      }
    }
    // [DONE] update calculated price in the HTML
    thisProduct.priceSingle = price;
    price *= thisProduct.amountWidget.value;
    thisProduct.dom.priceElem.innerHTML = price;
  }

  addToCart(){
    const thisProduct = this;
    //app.cart.add(thisProduct.prepareCartProduct());
    const event = new CustomEvent('add-to-cart',{
      'bubbles': true,
      detail: {
        product: thisProduct.prepareCartProduct(),
      },
    });
    thisProduct.element.dispatchEvent(event);
  }

  prepareCartProduct(){
    const thisProduct = this;
    const productSummary = {
      id : thisProduct.id,
      name: thisProduct.data.name,
      amount: thisProduct.amountWidget.value,
      priceSingle: thisProduct.priceSingle,
      price: thisProduct.priceSingle * thisProduct.amountWidget.value,
      params: {},
    };
    return productSummary;
  }
}

export default Product;