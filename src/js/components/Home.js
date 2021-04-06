import {templates, classNames, select} from '../settings.js';
//import Flickity from '../../vendor/flickity.pkgd.min.js';

class Home{
  constructor(element){
    const thisHome = this;
    thisHome.render(element);
    thisHome.initListeners();
    thisHome.initCarousel();

  }

  render(element){
    const thisHome = this;
    const generatedHTML = templates.home();
    thisHome.dom = {};
    thisHome.dom.wrapper = element;
    thisHome.dom.wrapper.innerHTML = generatedHTML;
    thisHome.linksInHome = thisHome.dom.wrapper.querySelector(select.home.links).children;
    thisHome.pages = document.querySelector(select.containerOf.pages).children;
    thisHome.navLinks = document.querySelectorAll(select.nav.links);
    thisHome.dom.carousel = thisHome.dom.wrapper.querySelector('.carousel');
  }

  initListeners(){
    const thisHome = this;
    for (let link of thisHome.linksInHome){
      link.addEventListener('click',function(event){
        const clickedElement = this;
        event.preventDefault();
        /* get page id from href */
        const id = clickedElement.getAttribute('href').replace('#','');
        thisHome.activatePage(id);
        /* change URL hash */
        window.location.hash = '#/' + id;
      });
    }
  }

  activatePage(pageID){
    const thisHome = this;
    /* Add class active to matching pages, remove it from non-matching */
    for (let page of thisHome.pages){
      page.classList.toggle(classNames.pages.active, page.id === pageID);
    }
    /* Add class active to matching links, remove it from non-matching */
    for (let link of thisHome.navLinks){
      link.classList.toggle(
        classNames.nav.active,
        link.getAttribute('href') === '#' + pageID
      );
    }
  }

  initCarousel(){
    const thisHome = this;

    thisHome.element = document.querySelector(select.widgets.carousel);
    console.log(thisHome.element);

    //eslint-disable-next-line no-undef
    thisHome.flkty = new Flickity (thisHome.element,{
      //options
      cellAlign: 'left',
      contain: true,
      autoPlay: true,
      prevNextButtons: false,
      wrapAround: true,
      imagesLoaded: true,
    });

  }

}

export default Home;