import {select, settings, templates, classNames} from '../settings.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';
import utils from '../utils.js';

class Booking{
  constructor(element){
    const thisBooking = this;
    thisBooking.render(element);
    thisBooking.initWidgets();  
    thisBooking.getData(); 
    thisBooking.selectedTable = 0; 
  }

  getData(){
    const thisBooking = this;
    const startDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.datePicker.minDate);
    const endDateParam = settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.datePicker.maxDate);
    const params = {
      booking: [
        startDateParam,
        endDateParam,
      ],
      eventsCurrent: [
        settings.db.notRepeatParam,
        startDateParam,
        endDateParam,
      ],
      eventsRepeat: [
        settings.db.repeatParam,
        endDateParam,
      ],
    };

    const urls = {
      booking:       settings.db.url + '/' + settings.db.booking + '?' + params.booking.join('&'),
      eventsCurrent: settings.db.url + '/' + settings.db.event   + '?' + params.eventsCurrent.join('&'),
      eventsRepeat:  settings.db.url + '/' + settings.db.event   + '?' + params.eventsRepeat.join('&'),
    };
    //  console.log(urls);
    Promise.all([
      fetch(urls.booking),
      fetch(urls.eventsCurrent),
      fetch(urls.eventsRepeat),
    ])
      .then(function(allResponses){
        const bookingsResponse = allResponses[0];
        const eventsCurrentResponse = allResponses[1];
        const eventsRepeatResponse = allResponses[2];
        return Promise.all([
          bookingsResponse.json(),
          eventsCurrentResponse.json(),
          eventsRepeatResponse.json(),
        ]);
      })
      .then(function([bookings, eventsCurrent, eventsRepeat]){
        thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
      });
      
  }

  parseData(bookings, eventsCurrent, eventsRepeat){
    const thisBooking = this;
    thisBooking.booked = {};
    for (let item of eventsCurrent){
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }
    for (let item of bookings){
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }
    const minDate = thisBooking.datePicker.minDate;
    const maxDate = thisBooking.datePicker.maxDate;

    for (let item of eventsRepeat){
      if (item.repeat === 'daily'){
        for (let loopDate = minDate ; loopDate < maxDate ; loopDate = utils.addDays(loopDate,1))
          thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
      }}
    thisBooking.updateDOM();
  }

  makeBooked(date, hour, duration, table){
    const thisBooking = this;
    if (typeof thisBooking.booked[date] === 'undefined'){
      thisBooking.booked[date] = {};
    }
    const startHour = utils.hourToNumber(hour);
    if (typeof thisBooking.booked[date][startHour] === 'undefined'){
      thisBooking.booked[date][startHour] = [];
    }
    for (let hourBlock = startHour; hourBlock < startHour + duration ; hourBlock += 0.5){
      if (typeof thisBooking.booked[date][hourBlock] === 'undefined'){
        thisBooking.booked[date][hourBlock] = [];
      }
      thisBooking.booked[date][hourBlock].push(table);
    }
  }
  
  updateDOM() {
    const thisBooking = this;

    thisBooking.date = thisBooking.datePicker.value;
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);

    let allAvailable = false;

    if (
      typeof thisBooking.booked[thisBooking.date] == 'undefined'
      ||
      typeof thisBooking.booked[thisBooking.date][thisBooking.hour] == 'undefined'
    ) {
      allAvailable = true;
    }

    for (let table of thisBooking.dom.tables) {
      let tableId = table.getAttribute(settings.booking.tableIdAttribute);
      if (!isNaN(tableId)) {
        tableId = parseInt(tableId);
      }

      if (
        !allAvailable
        &&
        thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId) 
      ) {
        table.classList.add(classNames.booking.tableBooked);
      } else {
        table.classList.remove(classNames.booking.tableBooked);
      }
      table.addEventListener('click', function () {
        table.classList.toggle(classNames.booking.tableBooked);
      });
    }

    thisBooking.selectedTable = 0;
  }

  render(element){
    const thisBooking = this;
    const generatedHTML = templates.bookingWidget();
    thisBooking.dom = {};
    thisBooking.dom.wrapper = element;
    thisBooking.dom.wrapper.innerHTML = generatedHTML;
    thisBooking.dom.peopleAmount = thisBooking.dom.wrapper.querySelector(select.booking.peopleAmount);
    thisBooking.dom.hoursAmount = thisBooking.dom.wrapper.querySelector(select.booking.hoursAmount);
    thisBooking.dom.datePicker =  thisBooking.dom.wrapper.querySelector(select.widgets.datePicker.wrapper);
    thisBooking.dom.hourPicker =  thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.wrapper);
    thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(select.booking.tables);
    thisBooking.dom.divWithTables = thisBooking.dom.wrapper.querySelector(select.booking.divWithTables);
    thisBooking.dom.orderConfirmationForm = thisBooking.dom.wrapper.querySelector(select.booking.orderConfirmationForm);
  }

  initWidgets(){
    const thisBooking = this;
    thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);  
    thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);
    thisBooking.dom.peopleAmount.addEventListener('updated',function(){
    });
    thisBooking.dom.hoursAmount.addEventListener('updated',function(){
    });
  
    thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker);
    thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);

    thisBooking.dom.wrapper.addEventListener('updated',function(){
      thisBooking.updateDOM();
    });
    
    thisBooking.dom.divWithTables.addEventListener('click',function(event){
      thisBooking.initTables(event.target);
    });
  
    const buttonSendForm = thisBooking.dom.orderConfirmationForm.querySelector('.btn-secondary');
    buttonSendForm.addEventListener('click',function(event){
      event.preventDefault();
      thisBooking.sendBooking();
    });
  }

  isTableFree(tableNumber,date,hour){
    const thisBooking = this;
    if ((typeof thisBooking.booked[date] == 'undefined') || (typeof thisBooking.booked[date][hour] == 'undefined') || !(thisBooking.booked[date][hour].includes(tableNumber))) {
      return true;
    } else {
      return false;
    }
  }

  initTables(table){
    const thisBooking = this;
    const date = thisBooking.datePicker.value;
    const hour = utils.hourToNumber(thisBooking.hourPicker.value);
    if (table.classList.contains('table')){
      const tableNumber = parseInt(table.getAttribute(settings.booking.tableIdAttribute));
      if (tableNumber === thisBooking.selectedTable){
        table.classList.remove('selected');
      } else if (thisBooking.isTableFree(tableNumber,date,hour)){
        table.classList.add('selected');
        if (this.selectedTable !== 0){
          for (let domTable of thisBooking.dom.tables){
            if (parseInt(domTable.getAttribute(settings.booking.tableIdAttribute)) === thisBooking.selectedTable){
              domTable.classList.remove('selected');
              domTable.classList.remove('booked');
              break;
            }
          } 
        }
        thisBooking.selectedTable = tableNumber;
      } 
    }  
  }

  sendBooking(){
    const thisBooking = this;
    const url = settings.db.url + '/' + settings.db.booking;

    let tempStarters = [];
    const checkboxs = thisBooking.dom.wrapper.querySelectorAll('[type="checkbox"]');
    for (let checkBox of checkboxs){
      if (checkBox.checked){
        tempStarters.push(checkBox.value);
      }
    }
    const payLoad = {
      'date': thisBooking.datePicker.value,
      'hour': thisBooking.hourPicker.value,
      'table': null,
      'duration': thisBooking.hoursAmount.value,
      'ppl':  thisBooking.peopleAmount.value,
      'starters': tempStarters,
      'phone': thisBooking.dom.orderConfirmationForm.querySelector('[name="phone"]').value,
      'address': thisBooking.dom.orderConfirmationForm.querySelector('[name="address"]').value
    };
    if (thisBooking.selectedTable !== 0){
      payLoad.table = thisBooking.selectedTable;
    }  
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payLoad),
    };
    fetch(url, options);
  } 
}

export default Booking;