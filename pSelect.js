function type(a) {
    return Object.prototype.toString.call(a).replace(/\[object (.+)\]/i,"$1").toLowerCase();
}

(function($) {

    $.fn.pSelect = function(params) {
        console.time('lay');
        return this.each(function() {
            var options = $.extend({
                //override defaults (lowest order)
                placeholder:$(this).attr('placeholder')
            },$.fn.pSelect.defaults,params);

            //bury select box
            var $select = $(this);
            $select.hide();
            var old_select = this;

            //create new pSelect container
            var $pSelect = $("<div>", {class: "pSelect"});
            $pSelect.insertAfter(this)
            $pSelect.css({
                'font-size':    options.baseSize,
                'text-align':   options.align
            });

            //pSelect fake representation markup
            var $pS_box = $("<div>",{class: "pSelect-box"}).text(options.placeholder);
            $pS_box.appendTo($pSelect);


            //create dropdown: lay options | put searchbox
            var wrapper = document.createElement('div');
            wrapper.className = 'pSelect-wrapper';
            if(options.search.enable) {
                var search = document.createElement('input');
                search.type='text';
                search.placeholder = options.search.placeholder;
                var searchBox = document.createElement('div');
                searchBox.classList.add('search-box');
                searchBox.appendChild(search);
                wrapper.appendChild(searchBox);
            }

            var wrapperUL;
            function layLies(permanentize) {
                $pSelect.find('ul').remove();
                wrapperUL = document.createElement('ul');
                $select.find('option').each(function (i, item) {
                    var option = document.createElement('li');

                    option.textContent = item.textContent;
                    item.selected && option.classList.add("pS-active");
                    item.disabled && option.classList.add("pS-disabled");

                    if ( permanentize && options.ajax.url !== '' ) {
                        item.classList.add('pS-permanent');
                    }

                    var attr = document.createAttribute('data-value');
                    attr.value = item.value;
                    option.setAttributeNode(attr);
                    wrapperUL.appendChild(option);
                });

                wrapper.appendChild(wrapperUL);
                $pSelect[0].appendChild(wrapper);
                select($pSelect.find('.pS-active'), { preventDefault: function () {} });
                search.focus();
            }
            layLies(true);

            $pSelect.click(antiDoubleClick(function(e) {
                if (e.target !== search) {
                    toggleList.call(this);
                }
            }, 300));

            function toggleList(cmd) {
                if (typeof(cmd) === 'undefined') {
                    cmd = '';
                }
                var $body = $('body');


                var caller_element = $(this).find('.pSelect-wrapper');
                if(cmd ==='close' || caller_element.hasClass('open')) {
                    caller_element.removeClass('open');
                    $body.removeClass('pSelect-is-open');
                } else if(cmd ==='open' || !caller_element.hasClass('open')) {
                    if($body.hasClass('pSelect-is-open')) {
                        $('.pSelect-wrapper').removeClass('open')
                    } else {
                        $body.addClass('pSelect-is-open');
                    }
                    caller_element.addClass('open');
                    try {
                        setTimeout(function() {
                            search.focus();
                        },100);

                    } catch(e) {console.log(e)}
                }
            }

            //bind keyboard
            var list_height = wrapperUL.clientHeight;
            $(document).on('keydown','.pSelect-is-open',function(e) {
                var scroll = wrapperUL.scrollTop;
                switch(e.key) {
                    case 'ArrowDown':
                        e.preventDefault();
                        var $selected = $pSelect.find('.open .pS-active');
                        if($selected.length) {
                            $selected.removeClass('pS-active');
                            $selected = $selected.next(':not(.hide)');
                            $selected = $selected.length ? $selected : $(wrapperUL.querySelector(':first-child'));
                            $selected.addClass('pS-active');
                            if( scroll + list_height + 42 < $selected[0].offsetTop ) {
                                wrapperUL.scrollTop += 42;
                            } else if( scroll > $selected[0].offsetTop ) {
                                wrapperUL.scrollTop = 0;
                            }
                        } else {
                            $pSelect.find('.open li:eq(0):not(.hide)').addClass('pS-active');
                            wrapperUL.scrollTop = 0;
                        }
                        break;
                    case 'ArrowUp':
                        e.preventDefault();
                        var $selected = $pSelect.find('.open li.pS-active');
                        if($selected.length) {
                            $selected.removeClass('pS-active');
                            $selected = $selected.prev(':not(.hide)');
                            window.tmp = $selected;
                            window.wrapper = wrapperUL;
                            $selected = $selected.length ? $selected : $(wrapperUL.querySelector(':last-child'));
                            $selected.addClass('pS-active');


                            if( $selected[0].offsetTop - scroll < 100 ) {
                                wrapperUL.scrollTop -= 42;
                            } else if($selected[0].offsetTop > list_height && scroll == 0) {
                                wrapperUL.scrollTop = wrapperUL.scrollHeight;
                            }
                        } else {
                            $pSelect.find('.open li:last:not(.hide)').addClass('pS-active');
                        }
                        break;
                    case 'Enter':
                        e.preventDefault();
                        $pSelect.find('.open li.pS-active').click();
                        break;
                    case 'Escape':
                        e.preventDefault();
                        toggleList.call($pSelect, 'close');
                    default:

                        break;
                }
            });

            //select item
            $(wrapper).on('click','li',function(e) {
                if(e.target !== searchBox && e.target !== search) {
                    select($(this), e, true);
                }
            });
            function select($element, e, changeSelect) {
                if($element.hasClass('pS-disabled')) {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                }
                changeSelect && $select.val($element.attr('data-value')).trigger('change');
                $pS_box.text($element.text());
            }

            // update on programmatically changes:
            // --dispatch update event to pSelect
            $select.on('change', function() {
                $pSelect.trigger('pSelect:update', false);
            });
            // --listen for changes
            $pSelect.on('pSelect:update', function(e, changeSelect) {
                select($pSelect.find('li:eq('+$select.get(0).selectedIndex+')'), e, changeSelect);
            });


            //search
            //bind search
            if(options.search.enable && !options.ajax.url) {
                search.addEventListener('input',function() {
                    filterOptions('.pSelect-wrapper li',search.value);
                });
            }

            //ajax search
            if(options.ajax.url) {
                $(search).keyup(debounce(function() {
                    if(this.value.length > options.ajax.minChars) {
                        $.get(options.ajax.url + search.value, function (data) {

                            $select.find('option:not(.pS-permanent)').remove();

                            for (var key in data) {
                                var item = data[key];
                                if (typeof(options.ajax.handleResults) === 'function') {
                                    item = options.ajax.handleResults(item);
                                } else {
                                    item = {
                                        value: item,
                                        title: item
                                    }
                                }
                                var option = document.createElement('option');
                                option.textContent = item.title;
                                option.value = item.value;
                                old_select.appendChild(option);
                            }

                            layLies(false);
                        });
                    }
                }, options.ajax.delay));
            }

            function filterOptions(selector, term) {

                var nodes = document.querySelectorAll(selector);
                for(var i=0;i<nodes.length;i++) {
                    if(!~nodes[i].textContent.search(new RegExp(escapeRegExp(term),'gi'))) {
                        nodes[i].classList.add('hide');
                    } else {
                        nodes[i].classList.remove('hide');
                    }
                }

            }

            function antiDoubleClick (fn, delay) {
                var timeoutID = null;
                var running = false;
                return function () {
                    clearTimeout(timeoutID);
                    var args = arguments;
                    var that = this;
                    !running && fn.apply(that, args);
                    running = true;

                    timeoutID = setTimeout(function () {
                        running = false;
                    }, delay);
                }
            }

            function escapeRegExp(text) {
                return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
            }

            function debounce(n, t) {
                var i;
                return function() {
                    var r = this
                        , u = arguments
                        , f = function() {
                        i = null;
                        n.apply(r, u)
                    };
                    clearTimeout(i);
                    i = setTimeout(f, t)
                }
            }
        });


        console.timeEnd('lay');
    };
    $.fn.pSelect.defaults = {
        baseSize: 14,
        align: 'center',
        search: {
            enable: true,
            placeholder:'Enter 3 characters at least'
        },
        ajax: {
            url: false,
            delay: 500,
            minChars:3
        }
    }

})(jQuery);