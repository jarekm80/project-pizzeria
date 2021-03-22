import {settings, select} from '../settings.js';

// [DONE] class for processing amount
class AmountWidget{
  constructor(element){
    const thisWidget = this;
    thisWidget.getElements(element);
    thisWidget.setValue(settings.amountWidget.defaultValue);
    thisWidget.initActions();
  }

  getElements(element){
    const thisWidget = this;
    thisWidget.element = element;
    thisWidget.input = thisWidget.element.querySelector(select.widgets.amount.input);
    thisWidget.linkDecrease = thisWidget.element.querySelector(select.widgets.amount.linkDecrease);
    thisWidget.linkIncrease = thisWidget.element.querySelector(select.widgets.amount.linkIncrease);
  }

  // [DONE] validate and add fire announce if ok
  setValue(value){
    const thisWidget = this;
    const newValue = parseInt(value);
    /* [DONE]: Add validation */
    if ((thisWidget.value !== newValue) && !isNaN(newValue) && ((newValue >= settings.amountWidget.defaultMin) && (newValue <= settings.amountWidget.defaultMax))) {
      thisWidget.value = newValue;
      thisWidget.announce();
    }
    thisWidget.input.value = thisWidget.value;
  }

  // [DONE] add listeners to updated event
  initActions(){
    const thisWidget = this;
    thisWidget.input.addEventListener('change',function(){
      thisWidget.setValue(thisWidget.input.value);
    });
    thisWidget.linkDecrease.addEventListener('click',function(event){
      event.preventDefault();
      thisWidget.setValue(thisWidget.value - 1);
    });
    thisWidget.linkIncrease.addEventListener('click',function(event){
      event.preventDefault();
      thisWidget.setValue(thisWidget.value + 1);
    });
  }

  // [DONE] make and publish updated event
  announce(){
    const thisWidget = this;
    const event = new CustomEvent('updated',{
      bubbles : true
    });
    thisWidget.element.dispatchEvent(event);
  }
}

export default AmountWidget;