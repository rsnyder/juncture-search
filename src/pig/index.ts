import { toRaw } from 'vue'
import { licenses } from '../lib/licenses'

type CallbackFunction = () => void;

let optimizedResize = (() => {
  const callbacks: CallbackFunction[] = [];
  let running = false;

  function resize() {
    if (!running) {
      running = true;
      if (window.requestAnimationFrame) {
        window.requestAnimationFrame(runCallbacks);
      } else {
        setTimeout(runCallbacks, 66);
      }
    }
  }

  function runCallbacks() {
    callbacks.forEach((callback) => callback());
    running = false;
  }

  return {
    add(callback: CallbackFunction) {
      if (!callbacks.length) {
        window.addEventListener('resize', resize);
      }
      callbacks.push(callback);
    },

    disable() {
      window.removeEventListener('resize', resize);
    },

    reEnable() {
      window.addEventListener('resize', resize);
    }
  };
})();

function _extend(obj1: any, obj2: any) {
    for (const i in obj2) {
        if (obj2.hasOwnProperty(i)) {
            obj1[i] = obj2[i];
        }
    }
}

function _getOffsetTop(elem: any) {
    let offsetTop = 0;
    do {
      if (!isNaN(elem.offsetTop)){
        offsetTop += elem.offsetTop;
      }
      elem = elem.offsetParent;
    } while(elem);
    return offsetTop;
}

export class Pig {
    // define class properties
    
    inRAF: boolean;
    isTransitioning: boolean;
    minAspectRatioRequiresTransition: boolean;
    minAspectRatio: number | null;
    latestYOffset: number;
    previousYOffset: number;
    lastWindowWidth: number;
    scrollDirection: string;
    visibleImages: any[];
    settings: any;

    scroller: any;
    onScroll: any;
    container: any;
    totalHeight: number;
    images: any[];
    loadMoreCallback: any;

    constructor(imageData: any[], options?: any) {
      this.inRAF = false;
      this.isTransitioning = false;
      this.minAspectRatioRequiresTransition = false;
      this.minAspectRatio = null;
      this.latestYOffset = 0;
      this.lastWindowWidth = window.innerWidth;
      this.scrollDirection = 'down';
  
      // List of images that are loading or completely loaded on screen.
      this.visibleImages = [];
  
      // These are the default settings, which may be overridden.
      this.settings = {
        container: null,
        loadMoreCallback: null,
  
        /**
         * Type: window | HTMLElement
         * Default: window
         * Description: The window or HTML element that the grid scrolls in.
         */
        scroller: window,
  
        /**
         * Type: string
         * Default: 'pig'
         * Description: The prefix associated with this library that should be
         *   prepended to class names within the grid.
         */
        classPrefix: 'pig',
  
        /**
         * Type: string
         * Default: 'figure'
         * Description: The tag name to use for each figure. The default setting is
         *   to use a <figure></figure> tag.
         */
        figureTagName: 'figure',
  
        /**
         * Type: Number
         * Default: 8
         * Description: Size in pixels of the gap between images in the grid.
         */
        spaceBetweenImages: 8,
  
        /**
         * Type: Number
         * Default: 500
         * Description: Transition speed in milliseconds
         */
        transitionSpeed: 500,
  
        /**
         * Type: Number
         * Default: 3000
         * Description: Height in pixels of images to preload in the direction
         *   that the user is scrolling. For example, in the default case, if the
         *   user is scrolling down, 1000px worth of images will be loaded below
         *   the viewport.
         */
        primaryImageBufferHeight: 1000,
  
        /**
         * Type: Number
         * Default: 100
         * Description: Height in pixels of images to preload in the direction
         *   that the user is NOT scrolling. For example, in the default case, if
         *   the user is scrolling down, 300px worth of images will be loaded
         *   above the viewport.  Images further up will be removed.
         */
        secondaryImageBufferHeight: 300,
  
        /**
         * Type: Number
         * Default: 20
         * Description: The height in pixels of the thumbnail that should be
         *   loaded and blurred to give the effect that images are loading out of
         *   focus and then coming into focus.
         */
        thumbnailSize: 20,
  
        /**
         * Get the URL for an image with the given filename & size.
         *
         * @param {string} filename - The filename of the image.
         * @param {Number} size - The size (height in pixels) of the image.
         *
         * @returns {string} The URL of the image at the given size.
         */
        urlForSize: function(filename, size) {
          return '/img/' + size.toString(10) + '/' + filename;
        },
  
        /**
         * Get a callback with the filename of the image
         * which was clicked.
         *
         * @param {string} filename - The filename property of the image.
         */
        onClickHandler: null,
  
        /**
         * Get the minimum required aspect ratio for a valid row of images. The
         * perfect rows are maintained by building up a row of images by adding
         * together their aspect ratios (the aspect ratio when they are placed
         * next to each other) until that aspect ratio exceeds the value returned
         * by this function. Responsive reordering is achieved through changes
         * to what this function returns at different values of the passed
         * parameter `lastWindowWidth`.
         *
         * @param {Number} lastWindowWidth - The last computed width of the
         *                                   browser window.
         *
         * @returns {Number} The minimum aspect ratio at this window width.
         */
        getMinAspectRatio: function(lastWindowWidth) {
          if (lastWindowWidth <= 640) {
            return 2;
          } else if (lastWindowWidth <= 1280) {
            return 4;
          } else if (lastWindowWidth <= 1920) {
            return 5;
          }
          return 6;
        },
  
        /**
         * Get the image size (height in pixels) to use for this window width.
         * Responsive resizing of images is achieved through changes to what this
         * function returns at different values of the passed parameter
         * `lastWindowWidth`.
         *
         * @param {Number} lastWindowWidth - The last computed width of the
         *                                   browser window.
         *
         * @returns {Number} The size (height in pixels) of the images to load.
         */
        getImageSize: function(lastWindowWidth) {
          if (lastWindowWidth <= 640) {
            return 100;
          } else if (lastWindowWidth <= 1920) {
            return 250;
          }
          return 500;
        }
      }

      // We extend the default settings with the provided overrides.
      _extend(this.settings, options || {});

      // Find the container to load images into, if it exists.
      this.container = this.settings.container
      this.loadMoreCallback = this.settings.loadMoreCallback;

      this.scroller = this.settings.scroller;

      // Our global reference for images in the grid.  Note that not all of these
      // images are necessarily in view or loaded.
      this.images = this._parseImageData(imageData);

      // Allows for chaining with `enable()`.
      return this;

    }

    _getTransitionTimeout() {
        const transitionTimeoutScaleFactor = 1.5;
        return this.settings.transitionSpeed * transitionTimeoutScaleFactor;
    }

    _getTransitionString() {
      if (this.isTransitioning) {
        return (this.settings.transitionSpeed / 1000).toString(10) + 's transform ease';
      }
      return 'none';
    }

    _recomputeMinAspectRatio() {
      const oldMinAspectRatio = this.minAspectRatio;
      this.minAspectRatio = this.settings.getMinAspectRatio(this.lastWindowWidth);

      if (oldMinAspectRatio !== null && oldMinAspectRatio !== this.minAspectRatio) {
        this.minAspectRatioRequiresTransition = true;
      } else {
        this.minAspectRatioRequiresTransition = false;
      }
    }

    _parseImageData(imageData: any[], offset=0) {
      const progressiveImages: ProgressiveImage[] = [];

      imageData.forEach(function(image, index) {
        const progressiveImage = new ProgressiveImage(image, offset+index, this);
        progressiveImages.push(progressiveImage);
      }.bind(this));

      return progressiveImages;
    }

    _computeLayout() {
      // Constants
      const wrapperWidth = this.container.clientWidth

      // State
      let row:any[] = [];           // The list of images in the current row.
      let translateX = 0;     // The current translateX value that we are at
      let translateY = 0;     // The current translateY value that we are at
      let rowAspectRatio = 0; // The aspect ratio of the row we are building

      // Compute the minimum aspect ratio that should be applied to the rows.
      this._recomputeMinAspectRatio();

      // If we are not currently transitioning, and our minAspectRatio has just
      // changed, then we mark isTransitioning true. If this is the case, then
      // `this._getTransitionString()` will ensure that each image has a value
      // like "0.5s ease all". This will cause images to animate as they change
      // position. (They need to change position because the minAspectRatio has
      // changed.) Once we determine that the transtion is probably over (using
      // `this._getTransitionTimeout`) we unset `this.isTransitioning`, so that
      // future calls to `_computeLayout` will set "transition: none".
      if (!this.isTransitioning && this.minAspectRatioRequiresTransition) {
        this.isTransitioning = true;
        setTimeout(function() {
          this.isTransitioning = false;
        }, this._getTransitionTimeout());
      }

      // Get the valid-CSS transition string.
      const transition = this._getTransitionString();

      // Loop through all our images, building them up into rows and computing
      // the working rowAspectRatio.
      [].forEach.call(this.images, function(image, index) {
        rowAspectRatio += image.aspectRatio;
        // console.log(index, image.aspectRatio, rowAspectRatio)
        row.push(image);

        // When the rowAspectRatio exceeeds the minimum acceptable aspect ratio,
        // or when we're out of images, we say that we have all the images we
        // need for this row, and compute the style values for each of these
        // images.
        if (rowAspectRatio >= this.minAspectRatio || index + 1 === this.images.length) {

          // Make sure that the last row also has a reasonable height
          rowAspectRatio = Math.max(rowAspectRatio, this.minAspectRatio);

          // Compute this row's height.
          const totalDesiredWidthOfImages = wrapperWidth - this.settings.spaceBetweenImages * (row.length - 1);
          const rowHeight = totalDesiredWidthOfImages / rowAspectRatio;
          // console.log(`rowHeight: ${rowHeight} rowAspectRatio=${rowAspectRatio}`)

          // For each image in the row, compute the width, height, translateX,
          // and translateY values, and set them (and the transition value we
          // found above) on each image.
          //
          // NOTE: This does not manipulate the DOM, rather it just sets the
          //       style values on the ProgressiveImage instance. The DOM nodes
          //       will be updated in _doLayout.
          row.forEach(function(img) {

            const imageWidth: number = rowHeight * img.aspectRatio;

            // This is NOT DOM manipulation.
            img.style = {
              width: imageWidth,
              height: rowHeight,
              translateX: translateX,
              translateY: translateY,
              transition: transition
            };

            // The next image is this.settings.spaceBetweenImages pixels to the
            // right of this image.
            translateX += imageWidth + this.settings.spaceBetweenImages;

          }.bind(this));

          // Reset our state variables for next row.
          row = [];
          rowAspectRatio = 0;
          translateY += rowHeight + this.settings.spaceBetweenImages + 50;
          translateX = 0;
        }
      }.bind(this));

      // No space below the last image
      this.totalHeight = translateY - this.settings.spaceBetweenImages;
      // console.log(`totalHeight=${this.totalHeight} (translateY=${translateY} - space=${this.settings.spaceBetweenImages})`) 
    }

    _doLayout() {
      // Set the container height
      this.container.style.height = this.totalHeight + 'px';

      // Get the top and bottom buffers heights.
      const bufferTop =
        (this.scrollDirection === 'up') ?
          this.settings.primaryImageBufferHeight :
          this.settings.secondaryImageBufferHeight;
      const bufferBottom =
        (this.scrollDirection === 'down') ?
          this.settings.secondaryImageBufferHeight :
          this.settings.primaryImageBufferHeight;

      // Now we compute the location of the top and bottom buffers:
      const containerOffset = _getOffsetTop(this.container);
      const scrollerHeight = this.scroller === window ? window.innerHeight : this.scroller.offsetHeight;
      // console.log(`doLayout: containerOffset=${containerOffset}, scrollerHeight=${scrollerHeight}, bufferTop=${bufferTop}, bufferBottom=${bufferBottom}`)

      // This is the top of the top buffer. If the bottom of an image is above
      // this line, it will be removed.
      const minTranslateYPlusHeight = this.latestYOffset - containerOffset - bufferTop;

      // This is the bottom of the bottom buffer.  If the top of an image is
      // below this line, it will be removed.
      const maxTranslateY = this.latestYOffset - containerOffset + scrollerHeight + bufferBottom;

      let last = 0

      // Here, we loop over every image, determine if it is inside our buffers or
      // no, and either insert it or remove it appropriately.
      this.images.forEach(function(image, idx) {
        if (image.style.translateY + image.style.height < minTranslateYPlusHeight ||
          image.style.translateY > maxTranslateY) {
          // Hide Image
          image.hide();
        } else {
          // Load Image
          image.load();
          last = idx
        }
      }.bind(this));
      // console.log(`images=${this.images.length} last=${last} scroll=${this.scrollDirection}`)
      if (this.images.length && last >= this.images.length - 10 && this.scrollDirection === 'down') {
        // console.log('load more')
        if (this.loadMoreCallback) this.loadMoreCallback()
      }
    }

    addImages(imageData: any[]) {
      this.images = this.images.concat(this._parseImageData(imageData, this.images.length))
      this._computeLayout()
      this._doLayout();
      console.log(`addImages: ${imageData.length} => ${this.images.length}`)
    }

    update(imageData: any[]) {
      console.log(`update: ${imageData.length}`)
      this.container.querySelectorAll('.pig-figure').forEach((el) => el.remove() )
      this.images = this._parseImageData(imageData)
      this._computeLayout()
      this._doLayout();

    }

    enable() {
      let time = Date.now();
      const wait = 100;
      const _this = this
      function throttledScrollHandler() {
        if ((time + wait - Date.now()) < 0) {
          // Compute the scroll direction using the latestYOffset and the
          // previousYOffset
          const newYOffset = _this.scroller === window ? window.pageYOffset : _this.scroller.scrollTop
          _this.previousYOffset = _this.latestYOffset || newYOffset
          _this.latestYOffset = newYOffset
          _this.scrollDirection = (_this.latestYOffset > _this.previousYOffset) ? 'down' : 'up'
    
          // Call _this.doLayout, guarded by window.requestAnimationFrame
          if (!_this.inRAF) {
            _this.inRAF = true
            window.requestAnimationFrame(function() {
              _this._doLayout()
              _this.inRAF = false
            });
          }
          time = Date.now()
        }
      }
      this.scroller.addEventListener('scroll', throttledScrollHandler);
  
      // this.onScroll();
      this._computeLayout();
      this._doLayout();
  
      optimizedResize.add(function() {
        this.lastWindowWidth = this.scroller === window ? window.innerWidth : this.scroller.offsetWidth;
        this._computeLayout();
        this._doLayout();
      }.bind(this));
  
      return this;
    }

    disable() {
      this.scroller.removeEventListener('scroll', this.onScroll);
      optimizedResize.disable();
      this.container.querySelectorAll('.pig-figure').forEach((el) => el.remove() )
      return this;
    }

}

export class ProgressiveImage {
  existsOnPage: boolean;
  aspectRatio: number;
  filename: string;
  index: number;
  logo: string;
  width: number;
  height: number;
  format: string;
  pig: any;
  classNames: any;
  thumbnail: any;
  fullImage: any;
  licenseUrl: string;
  licenseCode: string;
  licenseBadges: string[]
  licenseHtml: string
  element: any;
  style: any;

  thumbnailSrc: string;

  // Constructor to initialize the progressive image
  constructor(singleImageData: any, index: number, pig: any) {
    // console.log(singleImageData)
    // True if the element exists on the page
    this.existsOnPage = false;

    // Instance information
    this.width = singleImageData.width;
    this.height = singleImageData.height;
    this.format = singleImageData.format;
    this.aspectRatio = singleImageData.aspect_ratio;
    this.filename = singleImageData.file;
    this.thumbnailSrc = singleImageData.thumbnail;
    this.logo = singleImageData.logo;
    this.licenseUrl = singleImageData.license;
    this.licenseCode = licenses[singleImageData.license]?.code || singleImageData.license;
    this.licenseBadges = licenses[singleImageData.license]?.badges || [];
    if (this.licenseBadges.length > 1) {
      this.licenseHtml = `<a class="license" href="${this.licenseUrl}" target="_blank" title="${this.licenseCode}">`
      for (let i = 1; i < this.licenseBadges.length; i++) {
        this.licenseHtml += `<img src="${this.licenseBadges[i]}" alt="${this.licenseCode}">`
      }
      this.licenseHtml += `</a>`
    } else {
      this.licenseHtml = `<a class="license" href="${this.licenseUrl}" target="_blank" title="${this.licenseCode}">${this.licenseCode}</a>`
    }
    this.index = index;

    // The Pig instance
    this.pig = pig;

    // Class names for different elements
    this.classNames = {
      figure: pig.settings.classPrefix + '-figure',
      thumbnail: pig.settings.classPrefix + '-thumbnail',
      loaded: pig.settings.classPrefix + '-loaded'
    };
  }

  // Method to load the progressive image
  load() {
    // Making image available on the page and updating styles
    this.existsOnPage = true;
    this._updateStyles();
    // Append the image to the container
    this.pig.container.appendChild(this.getElement());

    setTimeout(() => {
      // Check if image is still on page
      if (!this.existsOnPage) {
        return;
      }
      // Add thumbnail to the element if not present already
      /*
      if (!this.thumbnail) {
        this.thumbnail = new Image();
        // this.thumbnail.src = this.pig.settings.urlForSize(this.filename, this.pig.settings.thumbnailSize);
        this.thumbnail.src = this.thumbnailSrc;
        this.thumbnail.className = this.classNames.thumbnail;
        this.thumbnail.onload = () => {
          if (this.thumbnail) {
            this.thumbnail.className += ' ' + this.classNames.loaded;
          }
        };
        this.getElement().appendChild(this.thumbnail);
      }
      */

      // Add full image to the element if not present already
      
      if (!this.fullImage) {
        this.fullImage = new Image();
        // this.fullImage.src = this.pig.settings.urlForSize(this.filename, this.pig.settings.getImageSize(this.pig.lastWindowWidth));
        this.fullImage.src = this.thumbnailSrc;
        this.fullImage.onload = () => {
          if (this.fullImage) {
            this.fullImage.className += ' ' + this.classNames.loaded;
          }
        };
        // this.getElement().appendChild(this.fullImage);
        let el = this.getElement()
        el.insertBefore(this.fullImage, el.firstChild);      }

    }, 100);
  }

  // Method to hide the image
  hide() {
    if (this.getElement()) {
      if (this.thumbnail) {
        this.thumbnail.src = '';
        this.getElement().removeChild(this.thumbnail);
        delete this.thumbnail;
      }

      if (this.fullImage) {
        this.fullImage.src = '';
        this.getElement().removeChild(this.fullImage);
        delete this.fullImage;
      }
    }

    if (this.existsOnPage) {
      this.pig.container.removeChild(this.getElement());
    }

    this.existsOnPage = false;
  }

  // Method to get the element
  getElement() {
    if (!this.element) {
      this.element = document.createElement('div');
      this.element.className = this.classNames.figure;
      // let figure = document.createElement(this.pig.settings.figureTagName);
      // this.element.appendChild(figure);
      // figure.className = this.classNames.figure;
      this.fullImage = new Image();
        // this.fullImage.src = this.pig.settings.urlForSize(this.filename, this.pig.settings.getImageSize(this.pig.lastWindowWidth));
        this.fullImage.src = this.thumbnailSrc;
        this.fullImage.onload = () => {
          if (this.fullImage) {
            this.fullImage.className += ' ' + this.classNames.loaded;
          }
        };
        this.getElement().appendChild(this.fullImage)
        let figcaption = document.createElement('div')
        figcaption.className = 'caption'
        
        let title = document.createElement('div')
        title.className = 'title'
        title.innerHTML = `<img src=${this.logo}> ${this.licenseHtml}`
        title.innerHTML += '<sl-icon name="star"></sl-icon>'

        figcaption.appendChild(title)

        let size = document.createElement('div')
        size.className = 'size clamp'
        size.innerHTML = this.width
          ? `${this.width.toLocaleString()} x ${this.height.toLocaleString()} ${this.format?.split('/').pop()?.toUpperCase()}`
          : ''
        figcaption.appendChild(size)

        this.element.appendChild(figcaption)
        if (this.pig.settings.onClickHandler !== null) {
          this.element.addEventListener('click', () => {
            this.pig.settings.onClickHandler(this.index);
          });
        }
        this._updateStyles();
      }

    return this.element;
  }

  // Method to update styles
  _updateStyles() {
    this.getElement().style.transition = this.style.transition;
    this.getElement().style.width = this.style.width + 'px';
    this.getElement().style.height = this.style.height + 50 + 'px';
    this.getElement().style.transform = (
      'translate3d(' + this.style.translateX + 'px,' +
      this.style.translateY + 'px, 0)');
  }
}
