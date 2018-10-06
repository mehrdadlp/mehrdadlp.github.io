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
            $(this).hide();
            var $select = $(this);
            // console.log('burry:', $select);

            //create new pSelect container
            var $pSelect = $("<div>", {class: "pSelect"});
            $pSelect.insertAfter(this)
            $pSelect.css({
                'font-size':    options.baseSize,
                'text-align':   options.align
            });
            // console.log('new pSelect container:', $pSelect);

            //pSelect fake representation markup
            var $pS_box = $("<div>",{class: "pSelect-box"}).text(options.placeholder);
            $pS_box.appendTo($pSelect);
            // console.log('pSelect fake representation markup:', $pS_box);


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

            var wrapperUL = document.createElement('ul');
            $(this).find('option').each(function(i,item) {
                var option = document.createElement('li');
                option.textContent  = item.textContent;
                //option.value        = item.value;
                var attr = document.createAttribute('data-value');
                attr.value = item.value;
                option.setAttributeNode(attr);
                wrapperUL.appendChild(option);
            });
            wrapper.appendChild(wrapperUL);
            $pSelect[0].appendChild(wrapper);



            //toggle list
            // $(document).on('click','.pSelect',antiDoubleClick(function(e) {
            //     console.log(this);
            //     if(e.target !== search) {
            //         toggleList.call(this);
            //     }
            // },300));
            $pSelect.click(function(e) {
                console.log(this);
                if (e.target !== search) {
                    toggleList.call(this);
                }
            });

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
                        console.log(search.focus());
                    } catch(e) {console.log(e)}
                }
            }

            //bind keyboard
            $(document).on('keydown','.pSelect-is-open',function(e) {
                switch(e.key) {
                    case 'ArrowDown':
                        e.preventDefault();
                        var selected = $pSelect.find('.open .pS-active');
                        if(selected.length) {
                            selected.removeClass('pS-active').next(':not(.hide)').addClass('pS-active');
                        } else {
                            $pSelect.find('.open li:eq(0):not(.hide)').addClass('pS-active');
                        }
                        break;
                    case 'ArrowUp':
                        e.preventDefault();
                        var selected = $pSelect.find('.open li.pS-active');
                        if(selected.length) {
                            selected.removeClass('pS-active').prev(':not(.hide)').addClass('pS-active');
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
                    select($(this));
                }
            });
            function select($element) {
                $select.val($element.attr('data-value')).trigger('change');
                $pS_box.text($element.text());
            }

            //search
            //bind search
            if(options.search.enable) {
                search.addEventListener('input',function() {
                    filterOptions('.pSelect-wrapper li',search.value);
                });
            }

            //ajax search
            if(options.ajax.url) {
                $.get(options.ajax.url,function() {

                });
            }



            // var searchTime = {
            //     t0: 0,
            //     t1: 0,
            //     diffs: [],
            //     avg:0
            // };
            function filterOptions(selector, term) {
                // searchTime.t0 = window.performance.now();

                var nodes = document.querySelectorAll(selector);
                for(var i=0;i<nodes.length;i++) {
                    if(!~nodes[i].textContent.search(new RegExp(term,'gi'))) {
                        nodes[i].classList.add('hide');
                    } else {
                        nodes[i].classList.remove('hide');
                    }
                }
                // searchTime.t1 = window.performance.now();
                // debugger;
                // if(searchTime.diffs.length<=10) {
                //     searchTime.diffs.push(searchTime.t1 - searchTime.t0);
                // } else {
                //     searchTime.avg = searchTime.diffs.reduce(function(a,b){return a+b;}).log() / searchTime.diffs.length
                //     console.log(searchTime.avg);
                //     searchTime.diffs =[];
                // }

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
            url: false
        }
    }

})(jQuery);

